from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import requests
import os
import time
import json
from pydantic import BaseModel, Json
from typing import Optional, List, Dict, Any

from dotenv import load_dotenv
load_dotenv()

import bcrypt

def verify_password(plain_password, hashed_password):
    try:
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

from sqlalchemy import create_engine, Column, Integer, String, Float, ForeignKey, desc, Boolean, Text, or_, and_
from sqlalchemy.orm import sessionmaker, declarative_base, Session

engine = None
SessionLocal = None
Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    nickname = Column(String, default="") 
    hashed_password = Column(String, nullable=False)
    bio = Column(String, default="Insira sua bio")
    avatar_url = Column(Text, default="") 
    banner_url = Column(String, default="")
    xp = Column(Integer, default=0)
    level = Column(Integer, default=1)
    steam_url = Column(String, default="")
    xbox_url = Column(String, default="")
    psn_url = Column(String, default="")
    epic_url = Column(String, default="")

class Review(Base):
    __tablename__ = "reviews"
    id = Column(Integer, primary_key=True, index=True)
    game_id = Column(Integer, nullable=False, index=True) 
    game_name = Column(String) 
    game_image_url = Column(String, nullable=True)
    genre = Column(String, nullable=True) 
    jogabilidade = Column(Float)
    graficos = Column(Float)
    narrativa = Column(Float)
    audio = Column(Float)
    desempenho = Column(Float)
    nota_geral = Column(Float)
    owner_id = Column(Integer, ForeignKey("users.id"))

class Tierlist(Base):
    __tablename__ = "tierlists"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    data = Column(Text)
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
    username: Optional[str] = None
    nickname: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    banner_url: Optional[str] = None
    steam_url: Optional[str] = None
    xbox_url: Optional[str] = None
    psn_url: Optional[str] = None
    epic_url: Optional[str] = None

class ReviewInput(BaseModel):
    game_id: int
    game_name: str
    game_image_url: Optional[str] = "" 
    genre: Optional[str] = ""
    jogabilidade: float
    graficos: float
    narrativa: float
    audio: float
    desempenho: float
    owner_id: int

class TierlistInput(BaseModel):
    name: str
    data: Dict[str, Any]
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
    if db.query(User).filter(User.username == user.username).first():
        raise HTTPException(status_code=400, detail="Nome de usuário já existe")
    hashed_pw = get_password_hash(user.password)
    new_user = User(email=user.email, username=user.username, nickname=user.username, hashed_password=hashed_pw, avatar_url="", banner_url="")
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
    
    all_reviews = db.query(Review).filter(Review.owner_id == user_id).all()
    review_count = len(all_reviews)
    
    genre_map = {}
    fps_count = 0
    for r in all_reviews:
        g_name = r.genre or "Outros"
        if "Shooter" in g_name or "FPS" in g_name:
            fps_count += 1
        if g_name not in genre_map:
            genre_map[g_name] = {"count": 0, "total_score": 0.0}
        genre_map[g_name]["count"] += 1
        genre_map[g_name]["total_score"] += r.nota_geral

    favorite_genre = "Nenhum"
    if genre_map:
        def get_sort_key(item):
            data = item[1]
            avg = data["total_score"] / data["count"] if data["count"] > 0 else 0
            return (data["count"], avg)
        sorted_genres = sorted(genre_map.items(), key=get_sort_key, reverse=True)
        favorite_genre = sorted_genres[0][0]

    attributes = ["jogabilidade", "graficos", "narrativa", "audio", "desempenho"]
    best_by_attribute = {}
    for attr in attributes:
        sorted_by_attr = sorted(all_reviews, key=lambda x: getattr(x, attr), reverse=True)[:3]
        best_by_attribute[attr] = [
            {"title": r.game_name, "score": getattr(r, attr)} 
            for r in sorted_by_attr if getattr(r, attr) > 0
        ]

    has_10_any = False
    perfect_game = False
    hater_mode = False
    for r in all_reviews:
        if (r.jogabilidade == 10 or r.graficos == 10 or r.narrativa == 10 or r.audio == 10 or r.desempenho == 10):
            has_10_any = True
        if (r.jogabilidade == 10 and r.graficos == 10 and r.narrativa == 10 and r.audio == 10 and r.desempenho == 10):
            perfect_game = True
        if r.nota_geral < 3:
            hater_mode = True

    connected = (user.steam_url != "") or (user.xbox_url != "") or (user.psn_url != "") or (user.epic_url != "")

    achievements = {
        "first_review": review_count >= 1,
        "five_reviews": review_count >= 5,
        "ten_reviews": review_count >= 10,
        "fps_king": fps_count >= 20,
        "high_score": has_10_any,
        "perfect_game": perfect_game,
        "hater": hater_mode,
        "connected": connected,
        "veteran": user.level >= 5
    }

    top_reviews = sorted(all_reviews, key=lambda x: x.nota_geral, reverse=True)[:3]
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
        "nickname": user.nickname or user.username,
        "bio": user.bio,
        "avatar_url": user.avatar_url,
        "banner_url": user.banner_url,
        "xp": user.xp,
        "level": user.level,
        "stats": { 
            "reviews_count": review_count,
            "favorite_genre": favorite_genre
        },
        "social": { "steam": user.steam_url, "xbox": user.xbox_url, "psn": user.psn_url, "epic": user.epic_url },
        "best_by_attribute": best_by_attribute,
        "achievements": achievements,
        "top_favorites": top_reviews_data
    }

@app.get("/api/users/search")
def search_users(q: str, db: Session = Depends(get_db)):
    if not q: return []
    users = db.query(User).filter(or_(User.username.ilike(f"%{q}%"), User.nickname.ilike(f"%{q}%"))).limit(20).all()
    results = []
    for u in users:
        results.append({
            "id": u.id, "username": u.username, "nickname": u.nickname or u.username, 
            "avatar_url": u.avatar_url, "level": u.level
        })
    return results

# --- NOVA ROTA: RANKING GLOBAL ---
@app.get("/api/users/top")
def get_top_users(db: Session = Depends(get_db)):
    # Pega os 10 usuários com mais XP
    users = db.query(User).order_by(desc(User.xp)).limit(10).all()
    results = []
    for u in users:
        results.append({
            "id": u.id, 
            "username": u.username, 
            "nickname": u.nickname or u.username,
            "avatar_url": u.avatar_url, 
            "level": u.level,
            "xp": u.xp
        })
    return results

@app.put("/api/profile/update")
def update_profile(data: UserUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == data.user_id).first()
    if not user: raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    if data.username is not None and data.username != user.username:
        existing = db.query(User).filter(User.username == data.username).first()
        if existing: raise HTTPException(status_code=400, detail="Nome de usuário já existe")
        user.username = data.username

    if data.nickname is not None: user.nickname = data.nickname
    if data.bio is not None: user.bio = data.bio
    if data.avatar_url is not None: user.avatar_url = data.avatar_url
    if data.banner_url is not None: user.banner_url = data.banner_url
    if data.steam_url is not None: user.steam_url = data.steam_url
    if data.xbox_url is not None: user.xbox_url = data.xbox_url
    if data.psn_url is not None: user.psn_url = data.psn_url
    if data.epic_url is not None: user.epic_url = data.epic_url
    db.commit()
    return {"message": "Perfil atualizado!"}

@app.get("/api/statistics/{user_id}")
def get_statistics(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user: raise HTTPException(status_code=404, detail="Usuário não encontrado")
    all_reviews = db.query(Review).filter(Review.owner_id == user_id).all()
    games_by_genre = {}
    for r in all_reviews:
        g_name = r.genre or "Outros"
        if g_name not in games_by_genre: games_by_genre[g_name] = []
        games_by_genre[g_name].append({
            "title": r.game_name,
            "ratings": {"jogabilidade": r.jogabilidade, "graficos": r.graficos, "narrativa": r.narrativa, "audio": r.audio, "desempenho": r.desempenho},
            "cover": r.game_image_url or "", "nota_geral": r.nota_geral
        })
    top_by_genre = {}
    for genre, games in games_by_genre.items():
        top_by_genre[genre] = sorted(games, key=lambda x: x['nota_geral'], reverse=True)[:3]
    attributes = ["jogabilidade", "graficos", "narrativa", "audio", "desempenho"]
    best_by_attribute = {}
    for attr in attributes:
        sorted_by_attr = sorted(all_reviews, key=lambda x: getattr(x, attr), reverse=True)[:3]
        best_by_attribute[attr] = [{"title": r.game_name, "score": getattr(r, attr)} for r in sorted_by_attr if getattr(r, attr) > 0]
    return { "top_by_genre": top_by_genre, "best_by_attribute": best_by_attribute }

@app.get("/api/user_games/{user_id}")
def get_user_games(user_id: int, db: Session = Depends(get_db)):
    reviews = db.query(Review).filter(Review.owner_id == user_id).all()
    games = []
    seen_ids = set()
    for r in reviews:
        if r.game_id not in seen_ids:
            games.append({"id": r.game_id, "title": r.game_name, "cover": r.game_image_url or ""})
            seen_ids.add(r.game_id)
    return games

@app.post("/api/tierlist")
def create_tierlist(tierlist_input: TierlistInput, db: Session = Depends(get_db)):
    try:
        new_tierlist = Tierlist(name=tierlist_input.name, data=json.dumps(tierlist_input.data), owner_id=tierlist_input.owner_id)
        db.add(new_tierlist)
        db.commit()
        return {"message": "Tierlist salva com sucesso!"}
    except Exception as e:
        db.rollback()
        return {"error": str(e)}

@app.get("/api/tierlists/{user_id}")
def get_tierlists(user_id: int, db: Session = Depends(get_db)):
    tierlists = db.query(Tierlist).filter(Tierlist.owner_id == user_id).all()
    result = []
    for t in tierlists:
        try:
            # Garante que se data for None ou vazio, não quebre
            loaded_data = json.loads(t.data) if t.data else {}
            result.append({ "id": t.id, "name": t.name, "data": loaded_data })
        except: pass
    return result

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
            if review_input.genre: existing.genre = review_input.genre 
            if review_input.game_image_url: existing.game_image_url = review_input.game_image_url
            db.commit()
            return {"message": "Review atualizada!"}
        new_review = Review(game_id=review_input.game_id, game_name=review_input.game_name, game_image_url=review_input.game_image_url, genre=review_input.genre, jogabilidade=review_input.jogabilidade, graficos=review_input.graficos, narrativa=review_input.narrativa, audio=review_input.audio, desempenho=review_input.desempenho, nota_geral=nota_geral, owner_id=review_input.owner_id)
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
SEARCH_CACHE = {}
BACKUP_GAMES_DATA = {
    "Elden Ring": [{"id": 84605, "name": "Elden Ring", "image": {"thumb_url": "https://www.giantbomb.com/a/uploads/scale_avatar/16/164924/3453743-eldenring_cover.jpg", "medium_url": "https://www.giantbomb.com/a/uploads/scale_medium/16/164924/3453743-eldenring_cover.jpg"}}],
    "Red Dead Redemption 2": [{"id": 56436, "name": "Red Dead Redemption 2", "image": {"thumb_url": "https://www.giantbomb.com/a/uploads/scale_avatar/31/316598/3060599-rdr2_cover_art.jpg", "medium_url": "https://www.giantbomb.com/a/uploads/scale_medium/31/316598/3060599-rdr2_cover_art.jpg"}}],
    "The Legend of Zelda: Breath of the Wild": [{"id": 46567, "name": "The Legend of Zelda: Breath of the Wild", "image": {"thumb_url": "https://www.giantbomb.com/a/uploads/scale_avatar/25/250426/2914622-breathofthewild.jpg", "medium_url": "https://www.giantbomb.com/a/uploads/scale_medium/25/250426/2914622-breathofthewild.jpg"}}],
    "Minecraft": [{"id": 30475, "name": "Minecraft", "image": {"thumb_url": "https://www.giantbomb.com/a/uploads/scale_avatar/8/87790/2469736-minecraft_cover.png", "medium_url": "https://www.giantbomb.com/a/uploads/scale_medium/8/87790/2469736-minecraft_cover.png"}}],
    "The Last of Us Part II": [{"id": 56814, "name": "The Last of Us Part II", "image": {"thumb_url": "https://www.giantbomb.com/a/uploads/scale_avatar/29/299021/3181980-7840719750-cover.jpg", "medium_url": "https://www.giantbomb.com/a/uploads/scale_medium/29/299021/3181980-7840719750-cover.jpg"}}],
    "Sekiro: Shadows Die Twice": [{"id": 66425, "name": "Sekiro: Shadows Die Twice", "image": {"thumb_url": "https://www.giantbomb.com/a/uploads/scale_avatar/8/82063/3075530-sekiroshadowsdietwice.jpg", "medium_url": "https://www.giantbomb.com/a/uploads/scale_medium/8/82063/3075530-sekiroshadowsdietwice.jpg"}}],
    "Grand Theft Auto V": [{"id": 36992, "name": "Grand Theft Auto V", "image": {"thumb_url": "https://www.giantbomb.com/a/uploads/scale_avatar/3/34651/2462051-5283156604-Grand.jpg", "medium_url": "https://www.giantbomb.com/a/uploads/scale_medium/3/34651/2462051-5283156604-Grand.jpg"}}],
    "Hollow Knight: Silksong": [{"id": 72016, "name": "Hollow Knight: Silksong", "image": {"thumb_url": "https://www.giantbomb.com/a/uploads/scale_avatar/15/151939/3087118-hkss.jpg", "medium_url": "https://www.giantbomb.com/a/uploads/scale_medium/15/151939/3087118-hkss.jpg"}}]
}

@app.get("/api/search")
def search_games(q: str = None, api_key: str = Depends(get_api_key)):
    if not q: return []
    if q in SEARCH_CACHE: return SEARCH_CACHE[q]
    url = "https://www.giantbomb.com/api/search/"
    headers = {'User-Agent': 'GameGScore-App-V1'}
    params = {'api_key': api_key, 'format': 'json', 'query': q, 'resources': 'game', 'limit': 10, 'field_list': 'id,name,image'}
    for attempt in range(2): 
        try:
            r = requests.get(url, params=params, headers=headers)
            if r.status_code == 200:
                data = r.json()
                if data.get('status_code') == 107: break 
                if data.get('status_code') == 1: 
                     results = data.get('results', [])
                     SEARCH_CACHE[q] = results
                     return results
            if r.status_code == 420: break
            time.sleep(1)
        except: time.sleep(1)
    if q in BACKUP_GAMES_DATA: return BACKUP_GAMES_DATA[q]
    return [] 

@app.get("/api/game/{game_id}")
def get_game(game_id: str, api_key: str = Depends(get_api_key)):
    game_id_int = int(game_id)
    for name, games in BACKUP_GAMES_DATA.items():
        if games[0]['id'] == game_id_int:
            games[0]['genres'] = [{'name': 'Action'}]
            return games[0]
    try:
        r = requests.get(f"https://www.giantbomb.com/api/game/3030-{game_id}/", params={'api_key': api_key, 'format': 'json', 'field_list': 'id,name,deck,image,genres'}, headers={'User-Agent': 'MeuApp'})
        return r.json().get('results', {})
    except: return {}

@app.get("/api/review")
def get_review(game_id: int, owner_id: int, db: Session = Depends(get_db)):
    r = db.query(Review).filter(Review.game_id == game_id, Review.owner_id == owner_id).first()
    return r if r else {"error": "Não encontrada"}