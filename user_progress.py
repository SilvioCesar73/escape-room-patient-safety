# user_progress.py
import json
from models import db, User

class UserProgress:
    def __init__(self, user_id):
        self.user_id = user_id
        self.keys = self.load_keys()
        self.scores = self.load_scores()
    
    def load_keys(self):
        """Carrega chaves do usuário do banco ou sessão"""
        user = db.session.get(User, self.user_id)
        if user and user.visitor_id:
            # Tentar carregar do banco (simulado)
            return json.loads(getattr(user, 'game_keys', '[]'))
        return []
    
    def load_scores(self):
        """Carrega pontuações do usuário"""
        return json.loads(getattr(db.session.get(User, self.user_id), 'game_scores', '{}'))
    
    def save_progress(self):
        """Salva progresso do usuário"""
        user = db.session.get(User, self.user_id)
        if user:
            user.game_keys = json.dumps(self.keys)
            user.game_scores = json.dumps(self.scores)
            db.session.commit()
    
    def add_key(self, key):
        """Adiciona uma chave conquistada"""
        if key and key not in self.keys:
            self.keys.append(key)
            self.save_progress()
    
    def add_score(self, challenge_id, score):
        """Adiciona pontuação de um desafio"""
        self.scores[str(challenge_id)] = score
        self.save_progress()
    
    def can_access(self, challenge_id):
        """Verifica se usuário pode acessar o desafio"""
        from challenge_manager import KeySystem
        return KeySystem.can_access_challenge(challenge_id, self.keys)
    
    def get_completed_challenges(self):
        """Retorna lista de desafios completados"""
        return list(self.scores.keys())