# app.py
from init import create_app  # sem o ponto, porque init.py está na raiz

app = create_app()

if __name__ == "__main__":
    app.run(debug=True)
