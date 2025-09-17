import os
from datetime import timedelta

basedir = os.path.abspath(os.path.dirname(__file__))

def get_database_url():
    # Fallback: SQLite local
    default_sqlite_url = 'sqlite:///' + os.path.join(basedir, 'instance', 'app.db')
    database_url = os.environ.get('DATABASE_URL', default_sqlite_url)

    # Render usa postgres://, mas o SQLAlchemy exige postgresql+psycopg2://
    if database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql+psycopg2://", 1)

    return database_url


class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'sua-chave-secreta-aqui-mude-isso'

    # Banco de Dados
    SQLALCHEMY_DATABASE_URI = get_database_url()
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Sessões
    PERMANENT_SESSION_LIFETIME = timedelta(days=7)

    # Uploads
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB


class DevelopmentConfig(Config):
    DEBUG = True


class ProductionConfig(Config):
    DEBUG = False


config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
