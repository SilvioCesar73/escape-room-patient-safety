# test_database.py
from app import app, db
from models import User, PageViews, SiteAccess
from datetime import datetime, date
import inspect

def test_database():
    print("=== TESTE DO BANCO DE DADOS ===")
    
    with app.app_context():
        try:
            # 1. Testar conexão com o banco
            connection = db.engine.connect()
            print("✅ Conexão com banco de dados bem-sucedida!")
            connection.close()
            
            # 2. Verificar se tabelas foram criadas (método moderno)
            inspector = db.inspect(db.engine)
            tables = inspector.get_table_names()
            print(f"✅ Tabelas criadas: {len(tables)}")
            for table in tables:
                print(f"   - {table}")
            
            # 3. Contar registros em cada tabela principal
            print("\n📊 Contagem de registros:")
            print(f"   Usuários: {User.query.count()}")
            print(f"   PageViews: {PageViews.query.count()}")
            print(f"   SiteAccess: {SiteAccess.query.count()}")
            
            # 4. Verificar estatísticas de hoje
            today = date.today()
            stats = SiteAccess.query.filter_by(access_date=today).first()
            if stats:
                print(f"   Estatísticas hoje: {stats.page_views} pageviews, {stats.unique_visitors} visitantes")
            else:
                print("   ℹ️  Nenhuma estatística registrada hoje ainda")
            
            # 5. Tentar criar um usuário de teste
            if User.query.count() == 0:
                try:
                    test_user = User(
                        username="test_user",
                        email="test@example.com", 
                        profession="Tester",
                        country="Brasil"
                    )
                    test_user.set_password("teste123")
                    test_user.generate_visitor_id()
                    
                    db.session.add(test_user)
                    db.session.commit()
                    print("✅ Usuário de teste criado com sucesso!")
                except Exception as e:
                    print(f"⚠️  Não foi possível criar usuário de teste: {e}")
                    db.session.rollback()
            
            # 6. Listar usuários existentes
            users = User.query.all()
            print(f"\n👥 Usuários no sistema ({len(users)}):")
            for user in users:
                print(f"   - {user.username} ({user.email})")
            
            print("\n🎉 Banco de dados está funcionando perfeitamente!")
            
        except Exception as e:
            print(f"❌ Erro no banco de dados: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    return True

if __name__ == "__main__":
    test_database()