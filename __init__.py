# /__init__.py

import os
import json
import uuid
import hashlib
from datetime import datetime, date, timedelta
from flask import Flask, render_template, redirect, url_for, request, session, jsonify
from flask_migrate import Migrate
from .config import config
from .models import db, User, PageViews, SiteAccess
# Importa os dados dos desafios para serem usados nas rotas
from .challenges_data import challenges

# Inicializa as extensões sem uma aplicação específica ainda
migrate = Migrate()

def create_app(config_name='development'):
    """
    Função Fábrica de Aplicação (Application Factory).
    """
    app = Flask(__name__)
    app.config.from_object(config[config_name])

    # Inicializa as extensões com a aplicação criada
    db.init_app(app)
    migrate.init_app(app, db)

    # --- Registro dos Blueprints ---
    from .game_api import game_bp
    app.register_blueprint(game_bp, url_prefix='/api/game')

    # --- Lógica de Negócio e Configurações ---
    def load_translations():
        translations = {}
        translations_dir = os.path.join(os.path.dirname(__file__), 'translations')
        if not os.path.exists(translations_dir): return {}
        for lang_file in ['pt.json', 'en.json', 'es.json']:
            lang_code = lang_file.split('.')[0]
            file_path = os.path.join(translations_dir, lang_file)
            try:
                if os.path.exists(file_path):
                    with open(file_path, 'r', encoding='utf-8') as f:
                        translations[lang_code] = json.load(f)
            except Exception as e:
                print(f"Error loading translation {lang_file}: {e}")
                translations[lang_code] = {}
        return translations

    translations = load_translations()
    
    professions = {
        'pt': ["Médico", "Enfermeiro", "Farmacêutico", "Técnico de Enfermagem", "Estudante", "Outro"],
        'en': ["Doctor", "Nurse", "Pharmacist", "Nursing Technician", "Student", "Other"],
        'es': ["Médico", "Enfermero", "Farmacéutico", "Técnico de Enfermería", "Estudiante", "Otro"]
    }
    countries = {
        'pt': ["Brasil", "Portugal", "Estados Unidos", "Espanha", "Argentina", "Outro"],
        'en': ["Brazil", "Portugal", "United States", "Spain", "Argentina", "Other"],
        'es': ["Brasil", "Portugal", "Estados Unidos", "España", "Argentina", "Otro"]
    }

    @app.context_processor
    def inject_user():
        user_data = None
        if 'user_id' in session:
            user = db.session.get(User, session['user_id'])
            if user:
                user_data = {'username': user.username, 'email': user.email, 'profession': user.profession}
        return dict(current_user=user_data)

    @app.before_request
    def track_access():
        if 'visitor_id' not in session: session['visitor_id'] = str(uuid.uuid4())
        session.permanent = True
        if request.endpoint and request.endpoint != 'static':
            try:
                ip_hash = hashlib.sha256(request.remote_addr.encode()).hexdigest()[:45] if request.remote_addr else None
                visitor_id = session.get('visitor_id')
                page_view = PageViews(user_id=session.get('user_id'), visitor_id=visitor_id, page_url=request.url, page_title=request.endpoint or 'unknown', language=session.get('lang', 'pt'), ip_address=ip_hash, user_agent=request.user_agent.string[:500] if request.user_agent else None)
                db.session.add(page_view)
                db.session.commit()
            except Exception as e:
                app.logger.error(f"Error tracking access: {e}")
                db.session.rollback()

    # --- ROTAS ---
    @app.route("/")
    def home():
        if 'lang' in session: return redirect(url_for(f'home_{session["lang"]}'))
        return redirect(url_for('home_pt'))

    @app.route("/pt")
    def home_pt():
        session['lang'] = 'pt'
        text = translations.get('pt', {}).copy()
        text['lang'] = 'pt'
        return render_template("index.html", text=text)

    @app.route("/en")
    def home_en():
        session['lang'] = 'en'
        text = translations.get('en', {}).copy()
        text['lang'] = 'en'
        return render_template("index.html", text=text)

    @app.route("/es")
    def home_es():
        session['lang'] = 'es'
        text = translations.get('es', {}).copy()
        text['lang'] = 'es'
        return render_template("index.html", text=text)

    @app.route("/dashboard")
    def dashboard():
        if "user_id" not in session: return redirect(url_for("login"))
        lang = session.get('lang', 'pt')
        text = translations.get(lang, {}).copy()
        text['lang'] = lang
        return render_template("dashboard.html", text=text)

    @app.route("/register", methods=["GET", "POST"])
    def register():
        lang = session.get('lang', 'pt')
        text = translations.get(lang, {}).copy()
        text['lang'] = lang
        if request.method == "POST":
            try:
                user = User(username=request.form["username"], email=request.form["email"], profession=request.form["profession"], country=request.form["country"], language=lang)
                user.set_password(request.form["password"])
                user.generate_visitor_id()
                db.session.add(user)
                db.session.commit()
                session['user_id'] = user.id
                return redirect(url_for("dashboard"))
            except Exception as e:
                db.session.rollback()
                app.logger.error(f"Registration error: {e}")
        return render_template("register.html", text=text, professions=professions.get(lang, professions['pt']), countries=countries.get(lang, countries['pt']))

    @app.route("/login", methods=["GET", "POST"])
    def login():
        lang = session.get('lang', 'pt')
        text = translations.get(lang, {}).copy()
        text['lang'] = lang
        if request.method == "POST":
            user = User.query.filter_by(email=request.form["email"]).first()
            if user and user.check_password(request.form["password"]):
                session["user_id"] = user.id
                return redirect(url_for("dashboard"))
            else:
                return render_template("login.html", text=text, error=text.get("error_credentials", "Credenciais inválidas"))
        return render_template("login.html", text=text)

    @app.route("/logout")
    def logout():
        session.clear()
        lang = session.get('lang', 'pt')
        return redirect(url_for(f"home_{lang}"))

    @app.route("/technical_specifications")
    def technical_specifications():
        lang = session.get('lang', 'pt')
        text = translations.get(lang, {}).copy()
        text['lang'] = lang
        return render_template("technical_specifications.html", text=text, return_to='dashboard')

    @app.route("/terms")
    def terms():
        lang = session.get('lang', 'pt')
        text = translations.get(lang, {}).copy()
        text['lang'] = lang
        return render_template("terms.html", text=text)
    
    @app.route("/instructions_professors")
    def instructions_professors():
        lang = session.get('lang', 'pt')
        text = translations.get(lang, {}).copy()
        text['lang'] = lang
        return render_template("instructions_professors.html", text=text, return_to='dashboard')


    @app.route("/instructions_students")
    def instructions_students():
        lang = session.get('lang', 'pt')
        text = translations.get(lang, {}).copy()
        text['lang'] = lang
        return render_template("instructions_students.html", text=text, return_to='dashboard')


    @app.route("/references")
    def references():
        lang = session.get('lang', 'pt')
        text = translations.get(lang, {}).copy()
        text['lang'] = lang
        return render_template("references.html", text=text)
    

    @app.route("/profile")
    def profile():
        if "user_id" not in session: return redirect(url_for("login"))
        lang = session.get('lang', 'pt')
        text = translations.get(lang, {}).copy()
        text['lang'] = lang
        user = db.session.get(User, session["user_id"])
        if not user:
            session.clear()
            return redirect(url_for(f"home_{lang}"))
        user_data = {"username": user.username, "email": user.email, "profession": user.profession, "country": user.country, "created_at": user.created_at}
        return render_template("profile.html", text=text, user=user_data, return_to='dashboard')

    @app.route("/station")
    def station():
        if "user_id" not in session: return redirect(url_for("login"))
        lang = session.get('lang', 'pt')
        text = translations.get(lang, {})
        return render_template("station.html", text=text)

    @app.route("/station/<int:challenge_id>")
    def play_challenge(challenge_id):
        if "user_id" not in session:
            return redirect(url_for("login"))
        
        challenge_info = challenges.get(challenge_id)

        if not challenge_info:
            return redirect(url_for('station'))

        lang = session.get('lang', 'pt')
        text = translations.get(lang, {}).copy()
        
        return render_template(
            "play_challenge.html", 
            text=text, 
            challenge=challenge_info
        )

    # Nova rota para testar desafios individualmente
    @app.route("/test_challenge/<int:challenge_id>")
    def test_challenge(challenge_id):
        challenge_info = challenges.get(challenge_id)

        if not challenge_info:
            return "Desafio não encontrado!", 404

        # Não verifica login ou chaves para esta rota de teste
        return render_template(
            "play_challenge.html", 
            text={}, # Pode ser um dicionário vazio ou mínimo, já que não há tradução para o teste
            challenge=challenge_info
        )

    @app.route("/test_complete")
    def test_complete():
        return "Teste do desafio concluído! Você pode fechar esta aba e continuar testando outros desafios."

    @app.route("/api/user-data")
    def api_user_data():
        if "user_id" not in session: return jsonify({"error": "Não autenticado"}), 401
        user = db.session.get(User, session["user_id"])
        if not user: return jsonify({"error": "Usuário não encontrado"}), 404
        return jsonify({"username": user.username, "user_id": user.id, "email": user.email})

    @app.errorhandler(404)
    def page_not_found(e):
        lang = session.get('lang', 'pt')
        text = translations.get(lang, {})
        return render_template('404.html', text=text), 404


        # --- API: salvar resultado da estação ---
    @app.route("/api/station_result", methods=["POST"])
    def save_station_result():
        if "user_id" not in session:
            return jsonify({"success": False, "error": "Não autenticado"}), 401

        data = request.json
        station_id = data.get("station_id")
        score = data.get("score")
        time_spent = data.get("time_spent")

        if not station_id or score is None or time_spent is None:
            return jsonify({"success": False, "error": "Dados incompletos"}), 400

        from .models import StationResult  # importa aqui para evitar ciclo

        result = StationResult.query.filter_by(
            user_id=session["user_id"], station_id=station_id
        ).first()

        if result:
            result.score = score
            result.time_spent = time_spent
            result.completed_at = datetime.utcnow()
        else:
            result = StationResult(
                user_id=session["user_id"],
                station_id=station_id,
                score=score,
                time_spent=time_spent
            )
            db.session.add(result)

        db.session.commit()
        return jsonify({"success": True})


    # --- API: obter resultados do usuário ---
    @app.route("/api/get_station_results", methods=["GET"])
    def get_station_results():
        if "user_id" not in session:
            return jsonify({"error": "Não autenticado"}), 401

        from .models import StationResult  # importa aqui para evitar ciclo

        results = StationResult.query.filter_by(user_id=session["user_id"]).all()
        station_data = {
            r.station_id: {"score": r.score, "time_spent": r.time_spent}
            for r in results
        }
        total_score = sum(r.score for r in results)

        return jsonify({
            "success": True,
            "stations": station_data,
            "total_score": total_score
        })


    # --- API: salvar avaliação no banco de dados ---
    @app.route("/api/save_evaluation", methods=["POST"])
    def save_evaluation():
        if "user_id" not in session:
            return jsonify({"success": False, "error": "Não autenticado"}), 401

        from .models import Evaluation
        data = request.json

        evaluation = Evaluation(
            user_id=session["user_id"],
            participant_type=data.get("participantType"),
            participation_type=data.get("participationType"),
            team=json.dumps(data.get("team", [])),
            q1=int(data.get("q1")),
            q2=int(data.get("q2")),
            q3=int(data.get("q3")),
            q4=int(data.get("q4")),
            q5=data.get("q5"),
            q6=data.get("q6")
        )

        db.session.add(evaluation)
        db.session.commit()

        return jsonify({"success": True, "message": "Avaliação salva com sucesso!"})


    # --- API: gerar relatório em PDF ---

    # --- API: gerar relatório em PDF ---
    @app.route("/api/generate_report", methods=["GET"])
    def generate_report():
        if "user_id" not in session:
            return jsonify({"success": False, "error": "Não autenticado"}), 401

        from reportlab.lib.pagesizes import A4
        from reportlab.pdfgen import canvas
        from reportlab.lib import colors
        from reportlab.pdfbase import pdfmetrics
        from reportlab.pdfbase.ttfonts import TTFont
        from reportlab.pdfbase.pdfmetrics import stringWidth
        from reportlab.lib.utils import simpleSplit, ImageReader
        from .models import StationResult, Evaluation, User
        import io, os, json as pyjson

        # Registra fontes Unicode (DejaVu)
        fonts_dir = os.path.join(os.path.dirname(__file__), "static", "fonts")
        pdfmetrics.registerFont(TTFont("DejaVu",        os.path.join(fonts_dir, "DejaVuSans.ttf")))
        pdfmetrics.registerFont(TTFont("DejaVu-Bold",   os.path.join(fonts_dir, "DejaVuSans-Bold.ttf")))
        pdfmetrics.registerFont(TTFont("DejaVu-Italic", os.path.join(fonts_dir, "DejaVuSans-Oblique.ttf")))

        # Helpers de layout
        def wrap_draw(p, text, x, y, max_width, font="DejaVu", size=10, lh=14):
            line = ""
            for word in (text or "").split():
                test = (line + " " + word) if line else word
                if stringWidth(test, font, size) <= max_width:
                    line = test
                else:
                    p.setFont(font, size)
                    p.drawString(x, y, line)
                    y -= lh
                    line = word
            if line:
                p.setFont(font, size)
                p.drawString(x, y, line)
                y -= lh
            return y

        def boxed_paragraph(p, title, body, x, y, w, font="DejaVu", size=10, lh=14, pad=6):
            lines = simpleSplit(body or "", font, size, w - 2*pad)
            box_h = pad + (len(lines) + 1) * lh + pad
            p.setFillColor(colors.lightgrey)
            p.rect(x, y - box_h + pad, w, box_h, fill=True, stroke=False)
            p.setFillColor(colors.black)
            p.setFont(font, size)
            p.drawString(x + pad, y - lh, title)
            yy = y - (2 * lh)
            for line in lines:
                p.drawString(x + pad, yy, line)
                yy -= lh
            return y - box_h - pad

        user = db.session.get(User, session["user_id"])
        if not user:
            return jsonify({"success": False, "error": "Usuário não encontrado"}), 404

        buffer = io.BytesIO()
        p = canvas.Canvas(buffer, pagesize=A4)
        width, height = A4

        # --- Cabeçalho ---
        try:
            logo_path = os.path.join(os.path.dirname(__file__), "static", "img", "logotipo_wpsd_simweek.jpg")
            logo = ImageReader(logo_path)
            p.drawImage(logo, (width - 180) / 2, height - 100, width=180, height=60, mask="auto")
        except Exception as e:
            p.setFont("DejaVu", 8)
            p.drawString(50, height - 80, f"[Erro ao carregar logotipo: {e}]")

        p.setFont("DejaVu-Bold", 18)
        p.setFillColor(colors.HexColor("#1F3C88"))
        p.drawCentredString(width / 2, height - 120, "Escape Room da Segurança do Paciente")
        p.setFont("DejaVu-Italic", 12)
        p.setFillColor(colors.black)
        p.drawCentredString(width / 2, height - 140, "Relatório de Desempenho do Usuário")

        p.setFont("DejaVu", 10)
        from datetime import datetime
        p.drawCentredString(width / 2, height - 160, f"Data/Hora: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
        p.setFont("DejaVu-Bold", 12)
        p.drawCentredString(width / 2, height - 180, f"Usuário: {user.username}")

        p.setStrokeColor(colors.grey)
        p.line(40, height - 190, width - 40, height - 190)

        y = height - 220

        # --- Progresso do usuário ---
        p.setFont("DejaVu-Bold", 12)
        p.setFillColor(colors.HexColor("#1F3C88"))
        p.drawString(50, y, "Progresso do Usuário")
        y -= 25

        results = StationResult.query.filter_by(user_id=session["user_id"]).all()
        total_score = sum(r.score for r in results)
        total_time = sum(r.time_spent for r in results)

        MAX_POINTS = {1: 5, 2: 7, 3: 4, 4: 6, 5: 8, 6: 5, 7: 8, 8: 5, 9: 6, 10: 9, 11: 8, 12: 6, 13: 7, 14: 5, 15: 11}
        total_max = sum(MAX_POINTS.get(r.station_id, 0) for r in results)
        avg_pct = round((total_score / total_max) * 100, 2) if total_max else 0

        if avg_pct >= 85:
            achievement = "Ouro"
        elif avg_pct >= 65:
            achievement = "Prata"
        elif avg_pct >= 40:
            achievement = "Bronze"
        else:
            achievement = "—"

        p.setFont("DejaVu", 10)
        p.setFillColor(colors.black)
        for r in results:
            p.drawString(50, y, f"Estação {r.station_id}: {r.score} pontos, Tempo: {r.time_spent}s")
            y -= 15

        y -= 10
        p.drawString(50, y, f"Pontuação Total: {total_score}")
        y -= 15
        p.drawString(50, y, f"Tempo Total: {total_time//3600}h {(total_time%3600)//60}m")
        y -= 15
        p.drawString(50, y, f"Pontuação Média: {avg_pct}%")
        y -= 15
        p.drawString(50, y, f"Conquista: {achievement}")
        y -= 40

        # --- Avaliação da Plataforma ---
        evaluation = Evaluation.query.filter_by(user_id=session["user_id"]).order_by(Evaluation.created_at.desc()).first()
        if evaluation:
            p.setFont("DejaVu-Bold", 12)
            p.setFillColor(colors.HexColor("#1F3C88"))
            p.drawString(50, y, "Avaliação da Plataforma")
            y -= 25

            p.setFont("DejaVu", 10)
            p.setFillColor(colors.black)
            p.drawString(50, y, f"Tipo de participante: {evaluation.participant_type}")
            y -= 15
            p.drawString(50, y, f"Tipo de participação: {evaluation.participation_type}")
            y -= 15

            # Equipe
            team_list = []
            try:
                team_list = pyjson.loads(evaluation.team) if evaluation.team else []
            except Exception:
                team_list = [evaluation.team] if evaluation.team else []

            p.drawString(50, y, "Equipe:")
            y -= 15
            for member in team_list:
                y = wrap_draw(p, f"• {member}", 60, y, width - 100, font="DejaVu", size=10)

            y -= 10
            p.drawString(50, y, f"Q1 - Facilidade de uso: {evaluation.q1}")
            y -= 15
            p.drawString(50, y, f"Q2 - Aprendizado: {evaluation.q2}")
            y -= 15
            p.drawString(50, y, f"Q3 - Design/Interface: {evaluation.q3}")
            y -= 15
            p.drawString(50, y, f"Q4 - Recomendação: {evaluation.q4}")
            y -= 20

            if evaluation.q5:
                y = boxed_paragraph(p, "Pontos fortes:", evaluation.q5, x=45, y=y, w=width - 90, font="DejaVu", size=10, lh=14, pad=8)
                y -= 10

            if evaluation.q6:
                y = boxed_paragraph(p, "Melhorias sugeridas:", evaluation.q6, x=45, y=y, w=width - 90, font="DejaVu", size=10, lh=14, pad=8)
                y -= 10

        # --- Rodapé ---
        p.setStrokeColor(colors.grey)
        p.line(40, 50, width - 40, 50)

        p.setFont("DejaVu", 9)
        p.setFillColor(colors.HexColor("#1F3C88"))
        p.drawCentredString(width / 2, 35, "Comentários e sugestões: Prof. Dr. Silvio Cesar da Conceição")
        p.linkURL("mailto:silvioenfermeiro73@gmail.com", (width/2 - 100, 20, width/2 + 100, 40), relative=0)
        p.setFillColor(colors.black)
        p.drawCentredString(width / 2, 20, "E-mail: silvioenfermeiro73@gmail.com")

        # Finaliza PDF
        p.showPage()
        p.save()
        buffer.seek(0)

        return (
            buffer.getvalue(),
            200,
            {
                "Content-Type": "application/pdf",
                "Content-Disposition": "attachment; filename=relatorio.pdf"
            },
        )




    return app