from fastapi import FastAPI, Depends, Body
from fastapi.middleware.cors import CORSMiddleware
import requests
import os

# Importações do SQLAlchemy
from sqlalchemy import create_engine, text, Column, Integer, String, Float, ForeignKey, desc
from sqlalchemy.orm import sessionmaker, declarative_base, Session
from sqlalchemy.exc import OperationalError
from pydantic import BaseModel 

# --- CONFIGURAÇÃO "PREGUIÇOSA" (LAZY) ---
engine = None
SessionLocal = None
Base = declarative_base()

# --- DEFINIÇÃO DAS TABELAS (Modelos) ---
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)

class Review(Base):
    __tablename__ = "reviews"
    id = Column(Integer, primary_key=True, index=True)
    game_id = Column(Integer, nullable=False, index=True) 
    game_name = Column(String) 
    jogabilidade = Column(Float)
    graficos = Column(Float)
    narrativa = Column(Float)
    audio = Column(Float)
    desempenho = Column(Float)
    nota_geral = Column(Float)
    owner_id = Column(Integer, ForeignKey("users.id"))

# --- FUNÇÃO DE DEPENDÊNCIA (get_db) ---
def get_db():
    global engine, SessionLocal
    try:
        if engine is None:
            DATABASE_URL = os.environ.get('POSTGRES_URL_NON_POOLING')
            if not DATABASE_URL:
                raise ValueError("POSTGRES_URL_NON_POOLING não foi encontrada.")
            if DATABASE_URL.startswith("postgres://"):
                DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
            engine = create_engine(DATABASE_URL)
            SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
            print("Conexão com o banco (Não-Agrupada) inicializada.")
        db = SessionLocal()
        yield db
    finally:
        if 'db' in locals() and db:
            db.close()

# --- INÍCIO DA APLICAÇÃO FASTAPI ---
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"], 
)

# --- Endpoints de Teste e Criação ---
@app.get("/api/ola")
def get_hello():
    return {"mensagem": "Olá, direto do Backend Python!"}

@app.get("/api/DANGEROUS-RESET-DB")
def dangerous_reset_db(db: Session = Depends(get_db)):
    try:
        global engine
        Base.metadata.drop_all(bind=engine)
        return {"message": "Todas as tabelas foram apagadas! Clique em 'Criar Tabelas' agora."}
    except Exception as e:
        return {"error": f"Erro ao apagar tabelas: {e}"}

@app.get("/api/create-tables")
def create_tables(db: Session = Depends(get_db)):
    try:
        global engine
        Base.metadata.create_all(bind=engine)
        return {"message": "Tabelas criadas com sucesso (ou já existiam)!"}
    except Exception as e:
        return {"error": f"Erro ao criar tabelas: {e}"}

@app.get("/api/test-db")
def test_db(db: Session = Depends(get_db)):
    try:
        result = db.execute(text("SELECT 'Conexão com o banco de dados bem-sucedida!'"))
        message = result.fetchone()[0]
        return {"database_status": message}
    except Exception as e:
        return {"error": f"Falha ao conectar ao banco: {e}"}

@app.post("/api/create-user")
def create_test_user(db: Session = Depends(get_db)):
    try:
        existing_user = db.query(User).filter(User.username == "usuarioteste").first()
        if existing_user:
            return {"message": "Usuário de teste já existe", "user_id": existing_user.id}
        new_user = User(email="teste@teste.com", username="usuarioteste")
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return {"message": "Usuário de teste criado!", "user_id": new_user.id}
    except Exception as e:
        db.rollback()
        return {"error": f"Erro ao criar usuário: {e}"}

# --- Endpoints de Review (Salvar e Buscar) ---
class ReviewInput(BaseModel):
    game_id: int
    game_name: str
    jogabilidade: float
    graficos: float
    narrativa: float
    audio: float
    desempenho: float
    owner_id: int

@app.post("/api/review")
def post_review(review_input: ReviewInput, db: Session = Depends(get_db)):
    try:
        notas = [review_input.jogabilidade, review_input.graficos, review_input.narrativa, review_input.audio, review_input.desempenho]
        nota_geral = sum(notas) / len(notas)
        
        existing_review = db.query(Review).filter(
            Review.game_id == review_input.game_id,
            Review.owner_id == review_input.owner_id
        ).first()
        
        if existing_review:
            existing_review.jogabilidade = review_input.jogabilidade
            # ... (demais campos)
            existing_review.nota_geral = nota_geral
            db.commit()
            return {"message": "Review atualizada com sucesso!"}
        else:
            new_review = Review(
                game_id = review_input.game_id,
                game_name = review_input.game_name,
                jogabilidade = review_input.jogabilidade,
                graficos = review_input.graficos,
                narrativa = review_input.narrativa,
                audio = review_input.audio,
                desempenho = review_input.desempenho,
                nota_geral = nota_geral,
                owner_id = review_input.owner_id
            )
            db.add(new_review)
            db.commit()
            return {"message": "Review salva com sucesso!"}

    except Exception as e:
        db.rollback()
        return {"error": f"Erro ao salvar review: {e}"}

@app.get("/api/review")
def get_review(game_id: int, owner_id: int, db: Session = Depends(get_db)):
    try:
        review = db.query(Review).filter(
            Review.game_id == game_id,
            Review.owner_id == owner_id
        ).first()
        
        if review:
            return review 
        else:
            return {"error": "Review não encontrada"}
            
    except Exception as e:
        return {"error": f"Erro ao buscar review: {e}"}

# --- !!! NOSSO NOVO ENDPOINT DE PERFIL !!! ---
@app.get("/api/my-reviews")
def get_my_reviews(db: Session = Depends(get_db)):
    # Por enquanto, "chumbado" para nosso usuário de teste ID 1
    owner_id = 1
    try:
        # Busca todas as reviews do usuário 1, ordenadas da maior nota para a menor
        reviews = db.query(Review).filter(
            Review.owner_id == owner_id
        ).order_by(desc(Review.nota_geral)).all()
        
        return reviews # Retorna a lista (pode estar vazia)
            
    except Exception as e:
        return {"error": f"Erro ao buscar reviews do perfil: {e}"}


# --- Endpoints de Jogo ---
def get_api_key():
    GIANTBOMB_API_KEY = os.environ.get('GIANTBOMB_API_KEY')
    if not GIANTBOMB_API_KEY:
        raise ValueError("GIANTBOMB_API_KEY não encontrada.")
    return GIANTBOMB_API_KEY

@app.get("/api/search")
def search_games(q: str | None = None, api_key: str = Depends(get_api_key)):
    if not q: return {"error": "Nenhum termo de busca fornecido"}
    url = "https://www.giantbomb.com/api/search/"
    # --- MUDANÇA AQUI: Adicionámos 'field_list' para pedir o objeto 'image' ---
    params = {'api_key': api_key, 'format': 'json', 'query': q, 'resources': 'game', 'limit': 10, 'field_list': 'id,name,image'}
    headers = { 'User-Agent': 'MeuPerfilGamerApp' }
    try:
        response = requests.get(url, params=params, headers=headers)
        response.raise_for_status() 
        data = response.json()
        return data['results']
    except requests.exceptions.RequestException as e:
        return {"error": f"Erro ao chamar a API externa: {e}"}

@app.get("/api/game/{game_id}")
def get_game_details(game_id: str, api_key: str = Depends(get_api_key)):
    # (código de detalhes - sem mudanças)
    url = f"https://www.giantbomb.com/api/game/3030-{game_id}/"
    params = {'api_key': api_key, 'format': 'json', 'field_list': 'name,deck,image,guid,id'}
    headers = { 'User-Agent': 'MeuPerfilGamerApp' }
    try:
        response = requests.get(url, params=params, headers=headers)
        response.raise_for_status()
        data = response.json()
        return data['results']
    except requests.exceptions.RequestException as e:
        return {"error": f"Erro ao buscar detalhes do jogo: {e}"}