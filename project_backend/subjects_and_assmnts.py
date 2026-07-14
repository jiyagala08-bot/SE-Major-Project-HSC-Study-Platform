from flask import request
from flask_restx import Namespace, Resource, fields
from datetime import datetime
from flask_jwt_extended import jwt_required, get_jwt_identity
from project_backend.models import Subject, Assessment

subject_ns=Namespace('subjects', description='A namespace for subjects')

subject_model = subject_ns.model(
    'Subject',
    {
        'id': fields.Integer(),
        'name': fields.String(),
        'difficulty_level' : fields.Integer(),
        'user_id' : fields.Integer()
    }
)
subject_input = subject_ns.model(
    'SubjectInput',
    {
        'name': fields.String(required=True),
        'difficulty_level': fields.Integer()
    }
)

@subject_ns.route('/subjects')
class SubjectListResource(Resource):
    @jwt_required()
    @subject_ns.marshal_list_with(subject_model)
    def get(self):
        """Get all subjects"""
        current_user=get_jwt_identity()
        subjects = Subject.query.filter_by(user_id=current_user) \
                          .order_by(Subject.difficulty_level.desc())\
                          .all()
        return subjects
    @jwt_required()
    @subject_ns.expect(subject_input)
    def post(self):
        current_user = get_jwt_identity()
        data = request.get_json()

        new_subject = Subject(
            name=data['name'],
            difficulty_level=data.get('difficulty_level', data.get('priority_level', 1)),
            user_id=current_user,
            #due_date=data.get('due_date')
        )

        new_subject.save()

        return {"message": "Subject created", "id": new_subject.id}, 201

@subject_ns.route('/subjects/<int:id>')
class SubjectResource(Resource):
    @subject_ns.marshal_with(subject_model)
    @jwt_required()
    def delete(self, id):
        """Delete a subject by id"""
        current_user=get_jwt_identity()
        subject = Subject.query.filter_by(id=id, user_id=current_user).first_or_404()
        subject.delete()
        return {"message": "Subject deleted", "id": id}, 200
    @jwt_required()
    def get(self, id):
        """Calculate the cumulative weighted mark for a subject"""
        current_user=get_jwt_identity()
        subject = Subject.query.filter_by(id=id, user_id=current_user).first_or_404()
        cumulative_score = subject.calculate_cumulative_score()
        return {"cumulative_score": cumulative_score}, 200
    

assessment_ns=Namespace('assessments', description='A namespace for assessments')

def parse_due_date(value):
    if not value:
        return datetime.utcnow()
    try:
        return datetime.fromisoformat(value)
    except ValueError:
        return datetime.utcnow()

assessment_model = assessment_ns.model(
    'Assessment',
    {
        'id': fields.Integer(),
        'subject_id': fields.Integer(),
        'score': fields.Float(),
        'total_score' : fields.Float(),
        'weight' : fields.Float(),
        'due_date' : fields.DateTime()
    }
)
assessment_input = assessment_ns.model(
    'AssessmentInput',
    {
        'subject_id': fields.Integer(required=True),
        'score': fields.Float(required=True),
        'total_score': fields.Float(required=True),
        'weight': fields.Float(required=True),
        'due_date': fields.String()  # ISO string, not DateTime()
    }
)


@assessment_ns.route('/assessments')
class AssessmentListResource(Resource):
    @jwt_required()
    @assessment_ns.marshal_list_with(assessment_model)
    def get(self):
        """Get all assessments"""
        current_user=get_jwt_identity()
        assessments = Assessment.query.join(Subject).filter(Subject.user_id == current_user).all()
        return assessments
    @jwt_required()
    @assessment_ns.expect(assessment_input)
    @assessment_ns.marshal_with(assessment_model)
    def post(self):
        """Create a new assessment"""
        current_user=get_jwt_identity()
        data=request.get_json()
        new_assessment=Assessment(
            subject_id=data.get('subject_id'),
            score=data.get('score'),
            total_score=data.get('total_score', 100),
            weight=data.get('weight'),
            due_date=parse_due_date(data.get('due_date'))
        )
        subject = Subject.query.filter_by(id=data.get('subject_id'), user_id=current_user).first()
        if not subject:
            return {'message': 'Invalid subject_id'}, 403
        elif new_assessment.subject_id is None or new_assessment.score is None or new_assessment.total_score is None or new_assessment.weight is None:
            return {"message": "Subject ID, score, total score and weight are required"}, 400
        new_assessment.save()
        return new_assessment, 201

@assessment_ns.route('/assessments/<int:id>')
class AssessmentResource(Resource):
    @jwt_required()
    def delete(self, id):
        """Delete an assessment by id"""
        current_user = get_jwt_identity()
        assessment = Assessment.query.join(Subject).filter(
            Assessment.id == id,
            Subject.user_id == current_user
        ).first_or_404()
        assessment.delete()
        return {"message": "Assessment deleted", "id": id}, 200