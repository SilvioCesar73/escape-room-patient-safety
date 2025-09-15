# /game_api.py

from flask import Blueprint, jsonify, request, session
from functools import wraps
from .models import db, User, UserProgress, ChallengeAttempt
from .challenges_data import challenges

# --- CORREÇÃO APLICADA AQUI ---
# A criação do Blueprint foi movida para o topo, ANTES de ser usada por qualquer rota.
game_bp = Blueprint('game_api', __name__)

# --- Decorator de Autenticação ---
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({"success": False, "error": "Authentication required"}), 401
        return f(*args, **kwargs)
    return decorated_function

# --- Funções de Apoio ---
def get_or_create_progress(user_id):
    progress = UserProgress.query.filter_by(user_id=user_id).first()
    if not progress:
        progress = UserProgress(user_id=user_id)
        db.session.add(progress)
    return progress

# --- Endpoints da API ---

@game_bp.route('/progress', methods=['GET'])
@login_required
def get_progress():
    user_id = session['user_id']
    progress = get_or_create_progress(user_id)
    db.session.commit()
    return jsonify({
        "success": True,
        "current_challenge_id": progress.current_challenge_id,
        "earned_keys": progress.get_keys(),
        "total_score": progress.total_score,
        "total_time_seconds": progress.total_time_seconds
    })

@game_bp.route('/challenge/start', methods=['POST'])
@login_required
def start_challenge():
    data = request.get_json()
    if not data:
        return jsonify({"success": False, "error": "Invalid request body. Expected JSON."}), 400
        
    challenge_id = data.get('challenge_id')
    if not challenge_id or challenge_id not in challenges:
        return jsonify({"success": False, "error": "Invalid challenge ID"}), 400

    user_id = session['user_id']
    progress = get_or_create_progress(user_id)
    challenge_info = challenges[challenge_id]
    required_key = challenge_info.get('requiredKey')

    if required_key and required_key not in progress.get_keys():
        return jsonify({"success": False, "error": "Required key not found"}), 403

    attempt = ChallengeAttempt(user_id=user_id, challenge_id=challenge_id, status='started')
    db.session.add(attempt)
    db.session.commit()
    return jsonify({"success": True, "message": f"Challenge {challenge_id} started."})

@game_bp.route('/challenge/complete', methods=['POST'])
@login_required
def complete_challenge():
    data = request.get_json()
    if not data:
        return jsonify({"success": False, "error": "Invalid request"}), 400

    challenge_id = data.get('challenge_id')
    score = data.get('score', 0)
    time_spent = data.get('time_spent', 0)
    key_earned = data.get('key_earned')

    if not all([challenge_id, key_earned is not None]): # key_earned pode ser uma string vazia
        return jsonify({"success": False, "error": "Missing required data"}), 400

    user_id = session['user_id']
    progress = get_or_create_progress(user_id)
    attempt = ChallengeAttempt.query.filter_by(user_id=user_id, challenge_id=challenge_id, status='started').order_by(ChallengeAttempt.started_at.desc()).first()
    if attempt:
        attempt.status = 'completed'
        attempt.score = score
        attempt.time_spent_seconds = time_spent
    
    progress.total_score += score
    progress.total_time_seconds += time_spent
    progress.add_key(key_earned)
    
    if progress.current_challenge_id == challenge_id:
        progress.current_challenge_id += 1

    db.session.commit()
    return jsonify({
        "success": True,
        "message": "Challenge completed and progress saved.",
        "new_key_earned": key_earned,
        "next_challenge_id": progress.current_challenge_id
    })
