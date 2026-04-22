from flask import Flask, app
from flask_restx import Api,Resource,fields
from models import Task, User
from exts import db
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from tasks import task_ns
from auth import auth_ns

def create_app(config):
    app=Flask(__name__)
    app.config.from_object(config)

    db.init_app(app)

    migrate=Migrate(app,db)
    jwt = JWTManager(app)

    api = Api(app, doc='/docs', strict_slashes=False)

    api.add_namespace(task_ns)
    api.add_namespace(auth_ns)

    @app.shell_context_processor
    def make_shell_context():
        return{
            "db":db,
            "Task":Task,
            "User":User
        }
    return app