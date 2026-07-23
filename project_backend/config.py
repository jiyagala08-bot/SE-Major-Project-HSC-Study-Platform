from decouple import config
import os

BASE_DIR = os.path.dirname(os.path.realpath(__file__))
class Config:
    SECRET_KEY = config('SECRET_KEY', default='a-very-secure-development-secret-key-32-chars-long!')
# SECRET_KEY is loaded from environment variables for security; fallback is for development convenience.
    SQLALCHEMY_TRACK_MODIFICATIONS = config('SQLALCHEMY_TRACK_MODIFICATIONS',default=False, cast=bool)
# Disables SQLAlchemy's event system to reduce overhead and avoid unnecessary warnings.


class DevConfig(Config):
    SQLALCHEMY_DATABASE_URI="sqlite:///"+os.path.join(BASE_DIR, 'dev.db')
    DEBUG=True
    SQLALCHEMY_ECHO=True
    
class ProdConfig(Config):
    pass

class TestConfig(Config):
    SQLALCHEMY_DATABASE_URI='sqlite:///test.db'
    SQLALCHEMY_ECHO=False
    TESTING=True
