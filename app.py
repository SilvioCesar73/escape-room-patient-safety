# /app.py

from . import create_app

# Cria a aplicação chamando a função de fábrica
app = create_app()

if __name__ == "__main__":
    # Roda o servidor de desenvolvimento
    app.run(debug=True)
