import unittest
from flask_jwt_extended import create_access_token
from project_backend.main import create_app
from project_backend.config import TestConfig
from project_backend.exts import db
from project_backend.models import User


class APITestCase(unittest.TestCase):
    def setUp(self):
        self.app=create_app(TestConfig)
        self.client=self.app.test_client()
        with self.app.app_context():
            db.create_all()
    def test_hello_world(self):
        hello_response=self.client.get('/recipes/hello')
        json = hello_response.get_json()
        #print(json)
        self.assertEqual(json, {"message":"Hello World"})
    def test_signup(self):
        signup_response=self.client.post('/auth/signup',
            json = {"username": "testuser",
                    "email": "testuser@example.com",
                    "password": "testpassword"},
        )
        status_code=signup_response.status_code
        self.assertEqual(status_code,201)
    def test_login(self):
    #later
            pass

    def test_profile_get_creates_profile_for_users_without_one(self):
        with self.app.app_context():
            user = User(username="profileuser", email="profileuser@example.com", password="hashed")
            user.save()
            token = create_access_token(identity=str(user.id))

        response = self.client.get('/profile/', headers={"Authorization": f"Bearer {token}"})

        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data["name"], "profileuser")

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()

if __name__ == '__main__':
    unittest.main()
