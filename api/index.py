from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import requests
import os
from pydantic import BaseModel
from typing import Optional

# Carregar variáveis do .env
from dotenv import load_dotenv
load_dotenv()

# --- SEGURANÇA (Bcrypt Direto - Mais Estável) ---
import bcrypt

def verify_password(plain_password, hashed_password):
    try:
        # Converte para bytes
        password_bytes = plain_password.encode('utf-8')
        hashed_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(password_bytes, hashed_bytes)
    except Exception as e:
        print(f"Erro na verificação de senha: {e}")
        return False

def get_password_hash(password):
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode('utf-8')

# --- BANCO DE DADOS ---
from sqlalchemy import create_engine, Column, Integer, String, Float, ForeignKey, desc, Boolean, Text
from sqlalchemy.orm import sessionmaker, declarative_base, Session

engine = None
SessionLocal = None
Base = declarative_base()

# --- MODELOS ---
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    bio = Column(String, default="Gamer apaixonado.")
    avatar_url = Column(Text, default="https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=200&h=200&fit=crop")
    banner_url = Column(String, default="https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1920&h=400&fit=crop")
    xp = Column(Integer, default=0)
    level = Column(Integer, default=1)
    steam_connected = Column(Boolean, default=False)
    xbox_connected = Column(Boolean, default=False)
    psn_connected = Column(Boolean, default=False)
    epic_connected = Column(Boolean, default=False)

class Review(Base):
    __tablename__ = "reviews"
    id = Column(Integer, primary_key=True, index=True)
    game_id = Column(Integer, nullable=False, index=True) 
    game_name = Column(String) 
    game_image_url = Column(String, nullable=True) 
    jogabilidade = Column(Float)
    graficos = Column(Float)
    narrativa = Column(Float)
    audio = Column(Float)
    desempenho = Column(Float)
    nota_geral = Column(Float)
    owner_id = Column(Integer, ForeignKey("users.id"))

def get_db():
    global engine, SessionLocal
    try:
        if engine is None:
            DATABASE_URL = os.environ.get('POSTGRES_URL_NON_POOLING')
            if not DATABASE_URL: 
                raise ValueError("Nenhuma URL de banco de dados encontrada no .env!")
            if DATABASE_URL.startswith("postgres://"):
                DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
            engine = create_engine(DATABASE_URL)
            SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
        yield db
    finally:
        if 'db' in locals() and db: db.close()

app = FastAPI()
app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"], 
)

class UserCreate(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserUpdate(BaseModel):
    user_id: int
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    banner_url: Optional[str] = None

class ReviewInput(BaseModel):
    game_id: int
    game_name: str
    game_image_url: Optional[str] = "" 
    jogabilidade: float
    graficos: float
    narrativa: float
    audio: float
    desempenho: float
    owner_id: int

@app.get("/api/DANGEROUS-RESET-DB")
def dangerous_reset_db(db: Session = Depends(get_db)):
    try:
        global engine
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)
        return {"message": "SUCESSO: Banco resetado e tabelas atualizadas!"}
    except Exception as e:
        return {"error": f"FALHA ao resetar: {str(e)}"}

@app.post("/api/auth/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email já cadastrado")
    hashed_pw = get_password_hash(user.password)
    new_user = User(email=user.email, username=user.username, hashed_password=hashed_pw)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "Criado!", "user_id": new_user.id, "username": new_user.username}

@app.post("/api/auth/login")
def login(user_login: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_login.email).first()
    if not user:
        raise HTTPException(status_code=400, detail="Email não encontrado")
    if not verify_password(user_login.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Senha incorreta")
    return {"message": "Login OK", "user_id": user.id, "username": user.username}

@app.get("/api/profile/{user_id}")
def get_profile(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user: raise HTTPException(status_code=404, detail="Usuário não encontrado")
    review_count = db.query(Review).filter(Review.owner_id == user_id).count()
    top_reviews = db.query(Review).filter(Review.owner_id == user_id).order_by(desc(Review.nota_geral)).limit(3).all()
    
    top_reviews_data = []
    for r in top_reviews:
        top_reviews_data.append({
            "game_name": r.game_name,
            "game_image_url": r.game_image_url or "",
            "nota_geral": r.nota_geral,
            "jogabilidade": r.jogabilidade,
            "graficos": r.graficos,
            "narrativa": r.narrativa,
            "audio": r.audio,
            "desempenho": r.desempenho
        })
    
    return {
        "username": user.username,
        "bio": user.bio,
        "avatar_url": user.avatar_url,
        "banner_url": user.banner_url,
        "xp": user.xp,
        "level": user.level,
        "stats": { "reviews_count": review_count, "accounts": { "steam": user.steam_connected, "xbox": user.xbox_connected, "psn": user.psn_connected, "epic": user.epic_connected } },
        "top_favorites": top_reviews_data
    }

@app.put("/api/profile/update")
def update_profile(data: UserUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == data.user_id).first()
    if not user: raise HTTPException(status_code=404, detail="Usuário não encontrado")
    if data.bio is not None: user.bio = data.bio
    if data.avatar_url is not None: user.avatar_url = data.avatar_url
    if data.banner_url is not None: user.banner_url = data.banner_url
    db.commit()
    return {"message": "Perfil atualizado!"}

@app.post("/api/review")
def post_review(review_input: ReviewInput, db: Session = Depends(get_db)):
    try:
        notas = [review_input.jogabilidade, review_input.graficos, review_input.narrativa, review_input.audio, review_input.desempenho]
        nota_geral = sum(notas) / len(notas)
        
        existing = db.query(Review).filter(Review.game_id == review_input.game_id, Review.owner_id == review_input.owner_id).first()
        
        if existing:
            existing.jogabilidade = review_input.jogabilidade
            existing.graficos = review_input.graficos
            existing.narrativa = review_input.narrativa
            existing.audio = review_input.audio
            existing.desempenho = review_input.desempenho
            existing.nota_geral = nota_geral
            if review_input.game_image_url:
                existing.game_image_url = review_input.game_image_url
            db.commit()
            return {"message": "Review atualizada!"}
        
        new_review = Review(
            game_id=review_input.game_id, 
            game_name=review_input.game_name, 
            game_image_url=review_input.game_image_url,
            jogabilidade=review_input.jogabilidade, 
            graficos=review_input.graficos,
            narrativa=review_input.narrativa, 
            audio=review_input.audio,
            desempenho=review_input.desempenho, 
            nota_geral=nota_geral,
            owner_id=review_input.owner_id
        )
        db.add(new_review)
        
        user = db.query(User).filter(User.id == review_input.owner_id).first()
        if user:
            user.xp += 100
            user.level = 1 + (user.xp // 500)
        
        db.commit()
        return {"message": "Review salva!"}
    except Exception as e:
        db.rollback()
        print(f"Erro ao salvar review: {e}") 
        return {"error": str(e)}

def get_api_key(): return os.environ.get('GIANTBOMB_API_KEY') or ""

@app.get("/api/search")
def search_games(q: str = None, api_key: str = Depends(get_api_key)):
    if not q: return []
    try:
        r = requests.get("https://www.giantbomb.com/api/search/", params={'api_key': api_key, 'format': 'json', 'query': q, 'resources': 'game', 'limit': 10, 'field_list': 'id,name,image'}, headers={'User-Agent': 'MeuApp'})
        return r.json().get('results', [])
    except: return []

@app.get("/api/game/{game_id}")
def get_game(game_id: str, api_key: str = Depends(get_api_key)):
    try:
        r = requests.get(f"https://www.giantbomb.com/api/game/3030-{game_id}/", params={'api_key': api_key, 'format': 'json', 'field_list': 'name,deck,image'}, headers={'User-Agent': 'MeuApp'})
        return r.json().get('results', {})
    except: return {}

@app.get("/api/review")
def get_review(game_id: int, owner_id: int, db: Session = Depends(get_db)):
    r = db.query(Review).filter(Review.game_id == game_id, Review.owner_id == owner_id).first()
    return r if r else {"error": "Não encontrada"}