from flask import Flask, request, jsonify, make_response
from flask_restx import Resource, Namespace, fields
from models import User
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token
from exts import db
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
PASSWORD_REGEX = r"^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+]).{8,50}$"

@auth_ns.route('/signup')
class Signup(Resource):
    @auth_ns.expect(signup_model)
    def post(self):
        data = request.get_json()

        username = data.get('username', '').strip()
        email = data.get('email', '').strip()
        password = data.get('password', '')

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
            return {"message": "Password must contain letters, numbers, and special characters"}, 400

        # DUPLICATE CHECKS
        db_email = User.query.filter_by(email=email).first()
        db_user = User.query.filter_by(username=username).first()

        if db_user or db_email:
            return {"message": f"User with username {username} or email {email} already exists"}, 400

        # CREATE USER
        new_user = User(
            email=email,
            username=username,
            password=generate_password_hash(password)
        )
        new_user.save()

        return make_response(jsonify({"message": "User created successfully"}), 201)



@auth_ns.route('/login')
class Login(Resource):
    @auth_ns.expect(login_model)
    def sanitise_name(name):
        return re.sub(r"[^a-zA-Z\s-]", "", name).strip()
    def sanitise_password(password):
        return re.sub(r"[^a-zA-Z0-9!@#$%^&*()_+]", "", password).strip()
    def post(self):
        data = request.get_json()

        if not re.match(USERNAME_REGEX, data['username']):
            return {"message": "Invalid username format"}, 400

        db_user = User.query.filter_by(username=data['username']).first()

        if db_user is None or not check_password_hash(db_user.password, data['password']):
            return {"message": "Invalid username or password"}, 401
        token = create_access_token(identity=db_user.id)
        return {"message": "User created", "access_token": token}, 201
