# check_results.py
import sys
import os

# Garante que a pasta do projeto está no caminho do Python
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
sys.path.insert(0, BASE_DIR)

# Importa diretamente os módulos da raiz
from __init__ import create_app, db
from models import StationResult

# Cria app e contexto
app = create_app()
with app.app_context():
    results = StationResult.query.all()
    if not results:
        print("Nenhum resultado salvo ainda.")
    else:
        for r in results:
            print(f"Usuário {r.user_id}, Estação {r.station_id}, Pontos {r.score}, Tempo {r.time_spent}s")
