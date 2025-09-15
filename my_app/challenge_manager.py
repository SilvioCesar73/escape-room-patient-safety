# challenge_manager.py
import json
import os

class ChallengeManager:
    def __init__(self):
        self.challenges = self.load_challenges()
    
    def load_challenges(self):
        """Carrega os desafios do arquivo challenges.js"""
        try:
            # Tentar importar do challenges.js
            from challenges import challenges, keySystem
            return challenges
        except ImportError:
            # Fallback: carregar dados básicos
            return {
                1: {
                    'id': 1,
                    'type': 'quiz',
                    'title': 'Identificação segura do recém-nascido',
                    'theme': 'Maternidade - Berçario',
                    'background': '/static/img/cenario-maternidade.jpg',
                    'timeLimit': 900,
                    'requiredKey': None,
                    'items': [{'id': 'pulseira', 'x': 25, 'y': 60, 'icon': 'bi-card-checklist', 'title': 'Pulseira de Identificação', 'number': 1}],
                    'questions': [
                        {
                            'id': 'q1',
                            'text': 'Quais informações devem constar obrigatoriamente na pulseira de identificação do recém-nascido?',
                            'options': [
                                {'id': 'a', 'text': 'Apenas nome da mãe e data de nascimento'},
                                {'id': 'b', 'text': 'Nome completo da mãe, data e hora de nascimento, sexo e número de registro'},
                                {'id': 'c', 'text': 'Apenas o primeiro nome da mãe e o sexo do bebê'},
                                {'id': 'd', 'text': 'Nome do médico responsável e tipo de parto'}
                            ],
                            'correctAnswer': 'b',
                            'points': 10
                        },
                        {
                            'id': 'q2', 
                            'text': 'Quando a pulseira de identificação deve ser colocada no recém-nascido?',
                            'options': [
                                {'id': 'a', 'text': 'Imediatamente após o nascimento, ainda na sala de parto'},
                                {'id': 'b', 'text': 'Após o primeiro banho, na unidade neonatal'},
                                {'id': 'c', 'text': 'No momento da alta hospitalar'},
                                {'id': 'd', 'text': 'Somente se o bebê for transferido para outra unidade'}
                            ],
                            'correctAnswer': 'a',
                            'points': 10
                        }
                    ],
                    'hints': [{
                        'text': 'A identificação segura é o primeiro passo para garantir a segurança do paciente. Todas as informações devem ser verificadas por pelo menos dois profissionais.',
                        'penalty': 2
                    }],
                    'keyReward': 'chave_identificacao_segura'
                },
                2: {
                    'id': 2,
                    'type': 'quiz', 
                    'title': 'Administração de medicamentos pediátricos',
                    'theme': 'Pediatria - Enfermaria',
                    'background': '/static/img/cenario-maternidade.jpg',
                    'timeLimit': 1200,
                    'requiredKey': 'chave_identificacao_segura',
                    'items': [{'id': 'medicacao', 'x': 60, 'y': 40, 'icon': 'bi-capsule', 'title': 'Medicação', 'number': 2}],
                    'questions': [
                        {
                            'id': 'q1',
                            'text': 'Qual é a prática mais segura para administração de medicamentos em pediatria?',
                            'options': [
                                {'id': 'a', 'text': 'Administrar sempre a dose padrão para adultos, mas em menor quantidade'},
                                {'id': 'b', 'text': 'Calcular a dose baseada no peso corporal e verificar com outro profissional'},
                                {'id': 'c', 'text': 'Usar sempre a mesma dose para crianças da mesma idade'},
                                {'id': 'd', 'text': 'Administrar medicação apenas com base na idade, sem considerar o peso'}
                            ],
                            'correctAnswer': 'b',
                            'points': 15
                        }
                    ],
                    'hints': [{
                        'text': 'A administração segura de medicamentos em pediatria requer cálculo preciso baseado no peso corporal e dupla checagem.',
                        'penalty': 2
                    }],
                    'keyReward': 'chave_medicamentos_seguros'
                }
            }
    
    def get_challenge(self, challenge_id):
        return self.challenges.get(challenge_id)
    
    def verify_answers(self, challenge_id, user_answers):
        """Verifica as respostas do usuário e retorna pontuação"""
        challenge = self.get_challenge(challenge_id)
        if not challenge:
            return None
        
        score = 0
        correct_answers = 0
        total_questions = len(challenge['questions'])
        
        for question in challenge['questions']:
            user_answer = user_answers.get(question['id'])
            if user_answer == question['correctAnswer']:
                score += question['points']
                correct_answers += 1
        
        return {
            'score': score,
            'correct_answers': correct_answers,
            'total_questions': total_questions,
            'passed': correct_answers >= total_questions * 0.7  # 70% para passar
        }
    
    def can_access_challenge(self, challenge_id, user_keys):
        """Verifica se usuário pode acessar o desafio"""
        challenge = self.get_challenge(challenge_id)
        if not challenge:
            return False
        
        if challenge_id == 1:  # Primeiro desafio sempre acessível
            return True
        
        return challenge['requiredKey'] in user_keys

# Sistema de chaves
class KeySystem:
    @staticmethod
    def can_access_challenge(challenge_id, user_keys):
        challenge_manager = ChallengeManager()
        challenge = challenge_manager.get_challenge(challenge_id)
        if not challenge:
            return False
        
        if challenge_id == 1:
            return True
        
        return challenge['requiredKey'] in user_keys
    
    @staticmethod
    def add_key(user_keys, key):
        if key and key not in user_keys:
            user_keys.append(key)
        return user_keys
    
    @staticmethod
    def get_next_challenge(user_keys):
        challenge_manager = ChallengeManager()
        for i in range(1, 16):  # 15 desafios
            if not KeySystem.can_access_challenge(i, user_keys):
                return i
        return None