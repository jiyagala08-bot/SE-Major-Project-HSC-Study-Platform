from flask import Flask, jsonify
from flask_restx import Api,Resource,fields
from project_backend.models import Task, User
from project_backend.exts import db
from project_backend.auth import auth_ns
from project_backend.tasks import task_ns
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from project_backend.subjects_and_assmnts import subject_ns, assessment_ns
from project_backend.profile import profile_ns
from flask_cors import CORS

def create_app(config):
    app=Flask(__name__)
    CORS(app, resources={r"/*": {"origins": "*"}})
    app.config.from_object(config)

    db.init_app(app)

    migrate=Migrate(app,db)
    jwt = JWTManager(app)

    api = Api(app, doc='/docs', strict_slashes=False)

    api.add_namespace(task_ns)
    api.add_namespace(auth_ns)
    api.add_namespace(subject_ns)
    api.add_namespace(assessment_ns)
    api.add_namespace(profile_ns)

    @app.shell_context_processor
    def make_shell_context():
        return{
            "db":db,
            "Task":Task,
            "User":User
        }
    
    """Adds a global error handler to catch all exceptions and return a JSON response with the error message and appropriate status code."""
    #@app.errorhandler(Exception)
    #def handle_error(e):
        #return jsonify({"message": str(e)}), getattr(e, "code", 500)
    return app