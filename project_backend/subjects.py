from flask import request
from flask_restx import Namespace, Resource, fields
from models import Subject, Assessment, User
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from auth import auth_ns

subject_ns=Namespace('subjects', description='A namespace for subjects')

subject_model = subject_ns.model(
    'Subject',
    {
        'id': fields.Integer(),
        'name': fields.String(),
        'priority_level': fields.Integer(),
        'user_id' : fields.Integer()
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
                          .order_by(Subject.priority_level.desc()) \
                          .all()
        return subjects
    @jwt_required()
    @subject_ns.expect(subject_model)
    def post(self):
        current_user = get_jwt_identity()
        data = request.get_json()

        new_subject = Subject(
            name=data['name'],
            priority_level=data.get('priority_level', 1),
            user_id=current_user
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
        return subject, 200
    @subject_ns.marshal_with(subject_model)
    @jwt_required()
    def calculate(self, id):
        """Calculate the cumulative weighted mark for a subject"""
        current_user=get_jwt_identity()
        subject = Subject.query.filter_by(id=id, user_id=current_user).first_or_404()
        cumulative_score = subject.calculate_cumulative_score()
        return {"cumulative_score": cumulative_score}, 200
    

assessment_ns=Namespace('Assessment', description='A namespace for assessments')

assessment_model = assessment_ns.model(
    'Assessment',
    {
        'id': fields.Integer(),
        'subject_id': fields.Integer(),
        'score': fields.Float(),
        'weight' : fields.Float()
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
    @assessment_ns.expect(assessment_model)
    def post(self):
        """Create a new assessment"""
        current_user=get_jwt_identity()
        data=request.get_json()
        new_assessment=Assessment(
            subject_id=data.get('subject_id'),
            score=data.get('score'),
            weight=data.get('weight')
        )
        if new_assessment.subject_id is None or new_assessment.score is None or new_assessment.weight is None:
            return {"message": "Subject ID, score and weight are required"}, 400
        new_assessment.save()
        return new_assessment, 201

profile_ns=Namespace('Profile', description='A namespace for profiles')

profile_model = profile_ns.model(
    'Profile',
    {
        'id': fields.Integer(),
        'user_id' : fields.Integer(),
        'name': fields.String(),
    }
)
@profile_ns.route('/me')
class Profile(Resource):
    @jwt_required()
    def get(self):
        user_id = get_jwt_identity()

        user = User.query.get_or_404(user_id)
        subjects = Subject.query.filter_by(user_id=user_id).all()

        return {
            "username": user.username,
            "email": user.email,
            "subjects": [
                {
                    "id": s.id,
                    "name": s.name,
                    "priority_level": s.priority_level
                }
                for s in subjects
            ]
        }

