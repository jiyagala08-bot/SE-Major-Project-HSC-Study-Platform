# SE-Major-Project-HSC-Study-Platform

Running the HSC Study Platform in GitHub Codespaces
1. Open the project

Open the repository in GitHub and create a new Codespace.

2. Install the Python dependencies

Open a terminal and run:

cd /workspaces/SE-Major-Project-HSC-Study-Platform
pip install -r project_backend/requirements.txt
3. Create the database (first time only)

Run:

PYTHONPATH=. python -c "from project_backend.main import create_app; from project_backend.config import DevConfig; from project_backend.exts import db; app=create_app(DevConfig); app.app_context().push(); db.create_all(); print('Database created successfully')"

This only needs to be completed once (or whenever the database is deleted).

4. Start the backend server

Run:

PYTHONPATH=. python project_backend/run.py

The backend API will start on port 5000.

Leave this terminal running.

5. Start the frontend server

Open a second terminal and run:

cd /workspaces/SE-Major-Project-HSC-Study-Platform
python -m http.server 5500

The frontend will start on port 5500.

Leave this terminal running.

6. Make both ports public

In the Ports panel in GitHub Codespaces:

Set port 5000 to Public.
Set port 5500 to Public.
7. Update the frontend API URLs

Open the following files:

project_frontend/js/auth.js
project_frontend/js/index.js
project_frontend/js/subjects.js

Update the API base URL so it points to your own Codespaces port 5000 address, for example:

const API = "https://your-codespace-name-5000.app.github.dev";

(Only the Codespace name changes. The remainder of the URL stays the same.)

8. Open the application

Open your browser and navigate to:

https://your-codespace-name-5500.app.github.dev/project_frontend/html/

Create a new account, then sign in to begin using the application.