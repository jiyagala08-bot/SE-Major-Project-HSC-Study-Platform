from flask_jwt_extended import jwt_required, get_jwt_identity
from flask import request
from flask_restx import Resource, Namespace, fields
from project_backend.models import User
from project_backend.exts import db
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, create_refresh_token
import re

auth_ns = Namespace('auth', description='Authentication related operations')

signup_model = auth_ns.model(
    'User',
    {
        'username': fields.String(),
        'email': fields.String(),
        'password': fields.String()
    }
)

login_model = auth_ns.model(
    'Login',
    {
        'username': fields.String(),
        'password': fields.String()
    }
)

EMAIL_REGEX = r"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$"
USERNAME_REGEX = r"^[A-Za-z0-9\s-]{3,30}$"
PASSWORD_REGEX = r"^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*()_+]).{8,50}$"


@auth_ns.route('/signup')
class Signup(Resource):
    @auth_ns.expect(signup_model)
    def post(self):
        """Create a user"""
        data = request.get_json() or {}

        username = (data.get('username') or "").strip()
        email = (data.get('email') or '').strip()
        password = data.get('password') or ''

        # LENGTH CHECKS
        if len(password) < 8:
            return {"message": "Password must be at least 8 characters long"}, 400

        if len(password) > 50:
            return {"message": "Password must be less than 50 characters long"}, 400

        # FORMAT VALIDATION
        if not re.match(EMAIL_REGEX, email):
            return {"message": "Invalid email format"}, 400

        if not re.match(USERNAME_REGEX, username):
            return {"message": "Invalid username format"}, 400

        if not re.match(PASSWORD_REGEX, password):
            return {"message": "Password must contain at least one letter, number, and special character"}, 400

        # DUPLICATE CHECKS
        existing_user = User.query.filter(
            (User.email == email) | (User.username == username)
        ).first()

        if existing_user:
            return {"message": f"User with username {username} or email {email} already exists"}, 400

        # CREATE USER
        new_user = User(
            email=email,
            username=username,
            password=generate_password_hash(password)
        )
        new_user.save()
        new_user.create_profile()  # Create an associated profile for the new user

        return {"message": "User created successfully. A verification email has been sent."}, 201


@auth_ns.route('/login')
class Login(Resource):
    @auth_ns.expect(login_model)
    def post(self):
        """Authenticate an existing user"""
        data = request.get_json() or {}
        username = (data.get('username') or '').strip()
        password = data.get('password') or ''

        if not re.match(USERNAME_REGEX, username):
            return {"message": "Invalid username format"}, 400

        db_user = User.query.filter_by(username=username).first()

        if db_user is None or not check_password_hash(db_user.password, password):
            return {"message": "Invalid username or password"}, 401

        access_token = create_access_token(identity=str(db_user.id))
        refresh_token = create_refresh_token(identity=str(db_user.id))

        return {
            "message": "User logged in",
            "access_token": access_token,
            "refresh_token": refresh_token
        }, 200
    
@auth_ns.route('/refresh')
class Refresh(Resource):
    @jwt_required(refresh=True)
    def post(self):
        """Refresh the access token of an existing user"""
        identity = get_jwt_identity()
        new_access_token = create_access_token(identity=identity)
        return {"access_token": new_access_token}, 200
    