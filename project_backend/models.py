from project_backend.exts import db
from sqlalchemy import CheckConstraint
from datetime import date

"""
class Task:
    id:int primary key
    title:str
    description:str
"""
class PublicSubject(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False)
    description = db.Column(db.Text, nullable=False)

class Profile(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False)
    school_year = db.Column(db.Integer, CheckConstraint('school_year >= 7 AND school_year <= 12'), nullable=True)
    birthdate = db.Column(db.Date, nullable=True)
    optimal_study_time = db.Column(db.Integer, CheckConstraint('optimal_study_time >= 1 AND optimal_study_time <= 4'), nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    user = db.relationship("User", back_populates="profile")

class UserPublicSubject(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    public_subject_id = db.Column(db.Integer, db.ForeignKey('public_subject.id'))

class Subject(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    name = db.Column(db.String, nullable=False)
    public_subject_id = db.Column(db.Integer, db.ForeignKey('public_subject.id'), nullable=True)
    difficulty_level = db.Column(db.Integer, CheckConstraint('difficulty_level >= 1 AND difficulty_level <= 10'), nullable=True)
    assessments = db.relationship('Assessment', backref='subject', lazy=True, cascade='all, delete-orphan')
    user = db.relationship('User', backref='subjects')
    public_subject = db.relationship('PublicSubject', backref='private_subjects')

    def calculate_cumulative_score(self):
        total = sum((a.score / a.total_score) * a.weight for a in self.assessments)
        return total

    def delete(self):
        db.session.delete(self)
        db.session.commit()

    def save(self):
        db.session.add(self)
        db.session.commit()

class Assessment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    subject_id = db.Column(db.Integer, db.ForeignKey('subject.id', ondelete='CASCADE'), nullable=False)
    score = db.Column(db.Float, nullable=True)
    total_score = db.Column(db.Float, CheckConstraint('total_score > 0 AND score <= total_score'), nullable=True)
    weight = db.Column(db.Float, CheckConstraint('weight >= 0 AND weight <= 100'), nullable=True)
    due_date = db.Column(db.DateTime,nullable=False)
    ready_score = db.Column(db.Float, default=False)

    def save(self):
        db.session.add(self)
        db.session.commit()

    def delete(self):
        db.session.delete(self)
        db.session.commit()

class Task(db.Model):
    id=db.Column(db.Integer(),primary_key=True)
    title=db.Column(db.String(),nullable=False)
    description=db.Column(db.Text(), nullable=False)
    priority_level=db.Column(db.Integer(), CheckConstraint('priority_level >= 1 AND priority_level <= 10'), nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    subject_id = db.Column(db.Integer, db.ForeignKey('subject.id'), nullable=True)
    # ORM relationship
    subject = db.relationship('Subject', backref='tasks')
    due_date = db.Column(db.Date, nullable=False)

    def __repr__(self):
        return f"<Task {self.title}>"
    
    def save(self):
        db.session.add(self)
        db.session.commit()
        
    def delete(self):
        db.session.delete(self)
        db.session.commit()

    def update(self,title,description, priority_level=None, subject_id=None, subject=None):
        self.title=title
        self.description=description
        if priority_level is not None:
            self.priority_level = priority_level
        if subject_id is not None:
            self.subject_id = subject_id
        if subject is not None:
            self.subject = subject
    
    def days_left(self):
        return (self.due_date - date.today()).days
    
    def days_left_score(self):
        """Return a 1-10 score based on days left until `due_date`.
        Values below 0 return 0.
        """
        d = self.days_left()
        if d < 0:
            return 0
        if d <= 2:
            return 1
        elif d <= 4:
            return 2
        elif d == 5:
            return 3
        elif d == 6:
            return 4
        elif d == 7:
            return 5
        elif d <= 9:
            return 6
        elif d <= 11:
            return 7
        elif d <= 14:
            return 8
        elif d <= 19:
            return 9
        else:
            return 10

#user model

"""
class User:
    id: integer
    username: string
    email: string
    password: string
    """

class User(db.Model):
    id=db.Column(db.Integer(),primary_key=True)
    username=db.Column(db.String(25),nullable=False,unique=True)
    email=db.Column(db.String(80), nullable=False, unique=True)
    password=db.Column(db.Text(),nullable=False)
    profile = db.relationship("Profile", back_populates="user", uselist=False)

    def __repr__(self):
        return f"<User {self.username}>"
    
    def save(self):
        db.session.add(self)
        db.session.commit()

    def create_profile(self):
        profile = Profile(user_id=self.id, name=self.username, optimal_study_time=1)  # Default optimal study time
        db.session.add(profile)
        db.session.commit()