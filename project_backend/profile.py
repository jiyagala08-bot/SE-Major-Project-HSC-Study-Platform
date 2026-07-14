from flask import request
from flask_restx import Namespace, Resource, fields
from project_backend.models import Profile, User
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from project_backend.auth import auth_ns
from project_backend.exts import db
from datetime import datetime

profile_ns = Namespace('profile', description='Profile related operations')


def _get_or_create_profile(user):
    if user.profile is None:
        profile = Profile(
            user_id=user.id,
            name=user.username or "User",
            optimal_study_time=1,
        )
        db.session.add(profile)
        db.session.commit()
        db.session.refresh(profile)
        user.profile = profile
    return user.profile


profile_model = profile_ns.model(
    'Profile',
    {
        'name': fields.String(),
        'school_year': fields.Integer(),
        'birthdate': fields.String(),
        'optimal_study_time': fields.Integer()
    }
)

@profile_ns.route('/')
class ProfileResource(Resource):
    @profile_ns.marshal_with(profile_model)
    @jwt_required()
    def get(self):
        """Get the profile of the current user"""
        current_user = get_jwt_identity()
        user = User.query.filter_by(id=current_user).first_or_404()
        profile = _get_or_create_profile(user)
        return profile, 200

    @profile_ns.expect(profile_model)
    @profile_ns.marshal_with(profile_model)
    @jwt_required()
    def put(self):
        current_user = get_jwt_identity()
        user = User.query.get_or_404(current_user)
        data = request.get_json()

        profile = _get_or_create_profile(user)

        profile.name = data.get('name') or profile.name
        profile.optimal_study_time = data.get('optimal_study_time', profile.optimal_study_time)
        profile.school_year = data.get('school_year', profile.school_year)

        if data.get('birthdate'):
            try:
                profile.birthdate = datetime.fromisoformat(data['birthdate']).date()
            except ValueError:
                return {"message": "birthdate must be in YYYY-MM-DD format"}, 400

        db.session.commit()

        return profile, 200