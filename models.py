# models.py

from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, date
import hashlib
import uuid
import json  # Importação necessária para lidar com as chaves (keys)

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    profession = db.Column(db.String(50), nullable=False)
    country = db.Column(db.String(50), nullable=False)
    visitor_id = db.Column(db.String(36), unique=True, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime, nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    language = db.Column(db.String(5), default='pt')
    
    # Relacionamentos
    page_views = db.relationship('PageViews', backref='user', lazy=True)
    progress = db.relationship('UserProgress', backref='user', uselist=False, cascade="all, delete-orphan")
    attempts = db.relationship('ChallengeAttempt', backref='user', lazy='dynamic', cascade="all, delete-orphan")

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def generate_visitor_id(self):
        if not self.visitor_id:
            self.visitor_id = str(uuid.uuid4())
    
    def __repr__(self):
        return f'<User {self.username}>'

class SiteAccess(db.Model):
    __tablename__ = 'site_access'
    
    id = db.Column(db.Integer, primary_key=True)
    access_date = db.Column(db.Date, nullable=False, unique=True)
    page_views = db.Column(db.Integer, default=0)
    unique_visitors = db.Column(db.Integer, default=0)
    language = db.Column(db.String(5), default='pt')
    country = db.Column(db.String(50), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class PageViews(db.Model):
    __tablename__ = 'page_views'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    visitor_id = db.Column(db.String(36), nullable=False)
    page_url = db.Column(db.String(200), nullable=False)
    page_title = db.Column(db.String(100), nullable=False)
    language = db.Column(db.String(5), nullable=False)
    ip_address = db.Column(db.String(45), nullable=True)
    user_agent = db.Column(db.Text, nullable=True)
    accessed_at = db.Column(db.DateTime, default=datetime.utcnow)

class UserProgress(db.Model):
    __tablename__ = 'user_progress'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, unique=True)
    
    current_challenge_id = db.Column(db.Integer, nullable=False, default=1)
    total_score = db.Column(db.Integer, nullable=False, default=0)
    total_time_seconds = db.Column(db.Integer, nullable=False, default=0)
    
    _earned_keys = db.Column(db.Text, name='earned_keys', nullable=False, default='[]')

    def get_keys(self):
        return json.loads(self._earned_keys)

    def add_key(self, key):
        keys = self.get_keys()
        if key not in keys:
            keys.append(key)
            self._earned_keys = json.dumps(keys)

    def __repr__(self):
        return f'<UserProgress user_id={self.user_id} challenge={self.current_challenge_id}>'

class ChallengeAttempt(db.Model):
    __tablename__ = 'challenge_attempts'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    challenge_id = db.Column(db.Integer, nullable=False)
    
    status = db.Column(db.String(20), nullable=False, default='started')
    score = db.Column(db.Integer, default=0)
    time_spent_seconds = db.Column(db.Integer, default=0)
    
    started_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime, nullable=True, onupdate=datetime.utcnow)

    def __repr__(self):
        return f'<ChallengeAttempt user_id={self.user_id} challenge={self.challenge_id} status={self.status}>'

class StationResult(db.Model):
    __tablename__ = 'station_results'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    station_id = db.Column(db.Integer, nullable=False)
    score = db.Column(db.Integer, nullable=False)
    time_spent = db.Column(db.Integer, nullable=False)
    completed_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint('user_id', 'station_id', name='uq_user_station'),
    )

    def __repr__(self):
        return f'<StationResult user_id={self.user_id} station={self.station_id} score={self.score}>'

# --- NOVO MODELO DE AVALIAÇÃO ---
class Evaluation(db.Model):
    __tablename__ = 'evaluations'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    participant_type = db.Column(db.String(50), nullable=False)   # estudante/profissional/professor
    participation_type = db.Column(db.String(20), nullable=False) # sozinho/equipe
    team = db.Column(db.Text, nullable=True)  # lista JSON dos membros

    q1 = db.Column(db.Integer, nullable=False)  # facilidade de uso
    q2 = db.Column(db.Integer, nullable=False)  # aprendizado
    q3 = db.Column(db.Integer, nullable=False)  # design/interface
    q4 = db.Column(db.Integer, nullable=False)  # recomendação
    q5 = db.Column(db.Text, nullable=True)      # pontos fortes
    q6 = db.Column(db.Text, nullable=True)      # pontos de melhoria

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<Evaluation user_id={self.user_id} participant={self.participant_type}>'
