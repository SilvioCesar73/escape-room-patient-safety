# game_routes.py
from flask import Blueprint, request, jsonify, session, render_template
from challenge_manager import ChallengeManager, KeySystem
from user_progress import UserProgress

game_bp = Blueprint('game', __name__)
challenge_manager = ChallengeManager()

@game_bp.route('/station/<int:challenge_id>')
def station_challenge(challenge_id):
    """Rota para carregar uma estação específica"""
    if 'user_id' not in session:
        return redirect(url_for('login'))
    
    user_progress = UserProgress(session['user_id'])
    
    # Verificar se usuário pode acessar o desafio
    if not user_progress.can_access(challenge_id):
        return render_template('station_locked.html', 
                             challenge_id=challenge_id,
                             text=session.get('text', {}))
    
    challenge = challenge_manager.get_challenge(challenge_id)
    if not challenge:
        return render_template('404.html'), 404
    
    return render_template(f'station_{challenge["type"]}.html',
                         challenge=challenge,
                         text=session.get('text', {}),
                         challenge_id=challenge_id)

@game_bp.route('/api/challenge/<int:challenge_id>')
def get_challenge_api(challenge_id):
    """API para obter dados do desafio"""
    if 'user_id' not in session:
        return jsonify({'error': 'Não autenticado'}), 401
    
    user_progress = UserProgress(session['user_id'])
    
    if not user_progress.can_access(challenge_id):
        return jsonify({'error': 'Desafio bloqueado'}), 403
    
    challenge = challenge_manager.get_challenge(challenge_id)
    if not challenge:
        return jsonify({'error': 'Desafio não encontrado'}), 404
    
    # Retornar dados do desafio (sem respostas)
    challenge_data = challenge.copy()
    for question in challenge_data.get('questions', []):
        question.pop('correctAnswer', None)
    
    return jsonify(challenge_data)

@game_bp.route('/api/submit-answers/<int:challenge_id>', methods=['POST'])
def submit_answers_api(challenge_id):
    """API para submeter respostas"""
    if 'user_id' not in session:
        return jsonify({'error': 'Não autenticado'}), 401
    
    user_progress = UserProgress(session['user_id'])
    
    if not user_progress.can_access(challenge_id):
        return jsonify({'error': 'Desafio bloqueado'}), 403
    
    challenge = challenge_manager.get_challenge(challenge_id)
    if not challenge:
        return jsonify({'error': 'Desafio não encontrado'}), 404
    
    user_answers = request.json.get('answers', {})
    result = challenge_manager.verify_answers(challenge_id, user_answers)
    
    if result['passed']:
        # Conceder chave e salvar pontuação
        user_progress.add_key(challenge['keyReward'])
        user_progress.add_score(challenge_id, result['score'])
    
    return jsonify(result)