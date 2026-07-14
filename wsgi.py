from project_backend.main import create_app
from project_backend.config import DevConfig

app = create_app(DevConfig)
