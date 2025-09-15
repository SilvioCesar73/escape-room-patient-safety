from app import app, db
from models import User, Scenario, Challenge, UserProgress, StationAnswers, UserAnswers, Hint, UserHints, SiteAccess, PageViews

with app.app_context():
    # Criar todas as tabelas
    db.create_all()
    
    # Opcional: Adicionar dados iniciais
    try:
        # Criar um usuário admin padrão se necessário
        admin_user = User(
            username='admin',
            email='admin@example.com',
            profession='developer',
            country='Portugal'
        )
        admin_user.set_password('admin123')
        admin_user.generate_visitor_id()
        
        db.session.add(admin_user)
        db.session.commit()
        print("✅ Banco de dados criado com sucesso!")
        print("✅ Usuário admin criado: admin / admin123")
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Erro ao criar dados iniciais: {e}")