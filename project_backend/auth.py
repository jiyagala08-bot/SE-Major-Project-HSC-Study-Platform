from flask import Flask, request, jsonify, make_response
from flask_restx import Resource, Namespace, fields
from models import User
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token
from exts import db

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

@auth_ns.route('/signup')
class Signup(Resource):
    @auth_ns.expect(signup_model)
    def post(self):
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        email = data.get('email')

        db_email = User.query.filter_by(email=email).first()
        db_user = User.query.filter_by(username=username).first()

        if db_user or db_email:
            return {"message": f"User with username {username} or email {email} already exists"}, 400

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
    def post(self):
        data = request.get_json()
        db_user = User.query.filter_by(username=data['username']).first()

        if db_user is None or not check_password_hash(db_user.password, data['password']):
            return {"message": "Invalid username or password"}, 401
        token = create_access_token(identity=db_user.id)
        return {"message": "User created", "access_token": token}, 201
