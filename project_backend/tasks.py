from flask import request
from flask_restx import Namespace, Resource, fields
from models import Task
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from auth import auth_ns

task_ns=Namespace('tasks', description='A namespace for tasks')

task_model = task_ns.model(
    'Task',
    {
        'id': fields.Integer(),
        'title': fields.String(),
        'description': fields.String(),
        'priority_level': fields.Integer(),
        'subject_id': fields.Integer()
    }
)


@task_ns.route('/hello')
class HelloResource(Resource):
    def get(self):
        return {"message":"Hello World"}

@task_ns.route('/tasks')
class TaskListResource(Resource): #unneeded
    @jwt_required()
    @task_ns.marshal_list_with(task_model)
    def get(self):
        """Get all tasks"""
        current_user=get_jwt_identity()
        tasks = Task.query.filter_by(user_id=current_user) \
                          .order_by(Task.priority_level.desc()) \
                          .all()
        return tasks
    
    @task_ns.expect(task_model)
    @task_ns.marshal_with(task_model)
    @jwt_required()
    def post(self):
        """Create a new task"""
        current_user=get_jwt_identity()
        data=request.get_json()
        new_task=Task(
            title=data.get('title'),
            description=data.get('description'),
            priority_level=data.get('priority_level'),
            subject_id=data.get('subject_id')
        )
        if new_task.title is None or new_task.description is None:
            return {"message":"Title and description are required"},400
        new_task.save()
        return new_task,201

@task_ns.route('/tasks/<int:id>')
class TaskResource(Resource):
    @task_ns.marshal_with(task_model)
    @jwt_required()
    def get(self, id):
        """Get a task by id"""
        current_user=get_jwt_identity()
        return Task.query.get_or_404(id)

    @task_ns.marshal_with(task_model)
    @jwt_required()
    def put(self,id):
        """Update a task by id"""
        current_user=get_jwt_identity()
        task_to_update=Task.query.get_or_404(id)
        data=request.get_json()
        task_to_update.update(data.get('title'),data.get('description'))
        return task_to_update

    @task_ns.marshal_with(task_model)
    @jwt_required()
    def delete(self,id):
        """Delete a task by id"""
        current_user=get_jwt_identity()
        task_to_delete=Task.query.get_or_404(id)
        task_to_delete.delete()
        return task_to_delete
@auth_ns.route('/refresh')
class Refresh(Resource):
    @jwt_required(refresh=True)
    def post(self):
        current_user=get_jwt_identity()
        new_access_token=create_access_token(identity=str(current_user))
        return jsonify({"access_token":new_access_token}),200
