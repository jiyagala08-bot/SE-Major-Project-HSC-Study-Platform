from exts import db
from sqlalchemy import CheckConstraint

"""
class Task:
    id:int primary key
    title:str
    description:str
"""
class Profile(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    subjects = db.relationship('Subject', backref='profile', lazy=True)
    

class Subject(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    profile_id = db.Column(db.Integer, db.ForeignKey('profile.id'))
    name = db.Column(db.String, nullable=False)
    assessments = db.relationship('Assessment', backref='subject', lazy=True)

    def calculate_cumulative_score(self):
        total = sum(a.score * (a.weight / 100) for a in self.assessments)
        return total

class Assessment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    subject_id = db.Column(db.Integer, db.ForeignKey('subject.id'))
    score = db.Column(db.Float, nullable=False)
    weight = db.Column(db.Float, nullable=False)


class Task(db.Model):
    id=db.Column(db.Integer(),primary_key=True)
    title=db.Column(db.String(),nullable=False)
    description=db.Column(db.Text(), nullable=False)
    priority_level=db.Column(db.Integer(), CheckConstraint('priority_level >= 1 AND priority_level <= 10'), nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    # Foreign key to Subject
    subject_id = db.Column(db.Integer, db.ForeignKey('subject.id'), nullable=True)

    # ORM relationship
    subject = db.relationship('Subject', backref='tasks')

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
    email=db.Column(db.String(80),nullable=True)
    password=db.Column(db.Text(),nullable=False)

    def __repr__(self):
        return f"<User {self.username}>"
    
    def save(self):
        db.session.add(self)
        db.session.commit()
