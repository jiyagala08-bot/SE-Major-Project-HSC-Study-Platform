from flask import request
from flask_restx import Namespace, Resource, fields
from project_backend.models import Profile
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from project_backend.auth import auth_ns
from project_backend.exts import db

profile_ns = Namespace('profile', description='Profile related operations')

profile_model = profile_ns.model(
    'Profile',
    {
        'name': fields.String(),
        'optimal_study_time': fields.Integer()
    }
)

@profile_ns.route('/')
class Profile(Resource):
    @profile_ns.marshal_with(profile_model)
    @jwt_required()
    def get(self):
        """Get the profile of the current user"""
        current_user = get_jwt_identity()
        user = User.query.filter_by(id=current_user).first_or_404()
        return user.profile, 200
    
    @profile_ns.expect(profile_model)
    @jwt_required()
    def put(self):
        current_user = get_jwt_identity()
        user = User.query.get_or_404(current_user)
        data = request.get_json()

        profile = user.profile

        profile.name = data.get('name', profile.name)
        profile.optimal_study_time = data.get('optimal_study_time', profile.optimal_study_time)

        db.session.commit()

        return profile, 200

