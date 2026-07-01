from project_backend.main import create_app
from project_backend.config import DevConfig

if __name__ == '__main__':
    app=create_app(DevConfig)
    app.run(host="0.0.0.0", port=5000)