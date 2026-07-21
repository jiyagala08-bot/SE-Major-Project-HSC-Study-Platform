from flask import request
from flask_restx import Namespace, Resource, fields
from project_backend.models import Task
from project_backend.exts import db
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.orm import joinedload
from datetime import date

task_ns = Namespace('tasks', description='A namespace for tasks')

task_model = task_ns.model(
    'Task',
    {
        'id': fields.Integer(),
        'title': fields.String(),
        'description': fields.String(),
        'priority_level': fields.Integer(),
        'subject_id': fields.Integer(),
        'user_id': fields.Integer(),
        'completed': fields.Boolean(),
        'ready_score': fields.Float(),
        'due_date': fields.String(),
        'subject_name': fields.String(attribute=lambda t: t.subject.name if t.subject else None)
    }
)

task_input = task_ns.model(
    'TaskInput',
    {
        'title': fields.String(required=True),
        'description': fields.String(required=True),
        'priority_level': fields.Integer(),
        'subject_id': fields.Integer(),
        'due_date': fields.String()
    }
)
def parse_due_date(value):
    if not value:
        return date.today()
    try:
        return date.fromisoformat(value)
    except ValueError:
        return date.today()

@task_ns.route('/tasks')
class TaskListResource(Resource):
    @jwt_required()
    @task_ns.marshal_list_with(task_model)
    def get(self):
        """Get all tasks"""
        current_user = get_jwt_identity()
        tasks = (Task.query
                .options(joinedload(Task.subject))
                .filter_by(user_id=current_user)
                .order_by(Task.priority_level.desc(), Task.ready_score.asc())
                .all())
        if not tasks:
            return {"message": "No tasks found"}, 404
        return tasks

    @task_ns.expect(task_input)
    @task_ns.marshal_with(task_model)
    @jwt_required()
    def post(self):
        """Create a new task"""
        current_user = get_jwt_identity()
        data = request.get_json() or {}

        title = data.get('title')
        description = data.get('description')

        if not title or not description:
            return {"message": "Title and description are required"}, 400

        new_task = Task(
            title=title,
            description=description,
            priority_level=data.get('priority_level'),
            subject_id=data.get('subject_id'),
            user_id=current_user,
            due_date=parse_due_date(data.get('due_date'))
        )
        new_task.save()
        return new_task, 201


@task_ns.route('/tasks/<int:id>')
class TaskResource(Resource):
    @task_ns.marshal_with(task_model)
    @jwt_required()
    def get(self, id):
        """Get a task by id"""
        current_user = get_jwt_identity()
        task = Task.query.get_or_404(id)
        if task.user_id != int(current_user):
            return {"message": "Forbidden"}, 403        
        return task, 200

    @task_ns.marshal_with(task_model)
    @jwt_required()
    def put(self, id):
        """Update a task by id"""
        current_user = get_jwt_identity()
        task_to_update = Task.query.get_or_404(id)
        data = request.get_json() or {}
        if task_to_update.user_id != int(current_user):
            return {"message": "Forbidden"}, 403
        task_to_update.title = data.get('title', task_to_update.title)
        task_to_update.description = data.get('description', task_to_update.description)
        task_to_update.priority_level = data.get('priority_level', task_to_update.priority_level)
        task_to_update.subject_id = data.get('subject_id', task_to_update.subject_id)
        task_to_update.completed = data.get('completed', task_to_update.completed)
        if 'due_date' in data:
            task_to_update.due_date = parse_due_date(data.get('due_date'))
        task_to_update.save()
        return task_to_update

    @jwt_required()
    def delete(self, id):
        """Delete a task by id"""
        current_user = get_jwt_identity()
        task_to_delete = Task.query.get_or_404(id)
        if task_to_delete.user_id != int(current_user):
            return {"message": "Forbidden"}, 403
        task_to_delete.delete()
        return {"message": "Task deleted", "id": id}, 200

@task_ns.route('/tasks/<int:id>/ready-score')
class TaskReadyScoreResource(Resource):
    @jwt_required()
    def post(self, id):
        """Calculate the ready score for a task."""
        current_user = get_jwt_identity()
        task = Task.query.get_or_404(id)
        if task.user_id != int(current_user):
            return {"message": "Forbidden"}, 403

        data = request.get_json() or {}
        timeinput = data.get("timeinput")

        if timeinput is None:
            return {"message": "timeinput is required"}, 400

        try:
            timeinput = float(timeinput)
        except ValueError:
            return {"message": "timeinput must be a number"}, 400
        if timeinput <= 3:
            timeinput_score = 10
        elif timeinput == 4:
            timeinput_score = 9
        elif timeinput == 5:
            timeinput_score = 8
        elif timeinput == 6:
            timeinput_score = 7
        elif timeinput in (7, 8):
            timeinput_score = 6
        elif timeinput in (9, 10):
            timeinput_score = 5
        elif timeinput in (11, 12):
            timeinput_score = 4
        elif 13 <= timeinput <= 15:
            timeinput_score = 3
        elif 16 <= timeinput <= 18:
            timeinput_score = 2
        elif timeinput > 18:
            timeinput_score = 1
        else:
            timeinput_score = 5

        days_left_score = task.days_left_score()
        # Convert frontend 1–3 scale into backend 1–10 scale
        priority_map = {1: 3, 2: 6, 3: 9}
        priority_level = priority_map.get(task.priority_level, 6)
        subject_difficulty = task.subject.difficulty_level if task.subject else 5
        subject_cumulative_score = (task.subject.calculate_cumulative_score() * 0.1) if task.subject else 5

        ready_score = ((10 - priority_level)
                       + subject_difficulty
                       + days_left_score * 0.5
                       + timeinput_score * 0.5
                       + subject_cumulative_score) / 40 * 100

        task.ready_score = ready_score
        task.save()

        return {"ready_score": ready_score}, 200
