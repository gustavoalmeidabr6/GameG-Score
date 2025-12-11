from fastapi import FastAPI, Depends, HTTPException, Query, Body, Request
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
import requests
import os
import time
import json
import re
import random
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
import urllib.parse
from difflib import SequenceMatcher 

from dotenv import load_dotenv
load_dotenv()

import bcrypt

# --- CONFIGURAÇÃO DE SEGURANÇA (BCRYPT) ---
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

# --- CONFIGURAÇÃO DO BANCO DE DADOS (SQLALCHEMY) ---
from sqlalchemy import create_engine, Column, Integer, String, Float, ForeignKey, desc, Boolean, Text, or_, func
from sqlalchemy.orm import sessionmaker, declarative_base, Session

engine = None
SessionLocal = None
Base = declarative_base()

# --- MODELOS DO BANCO DE DADOS ---

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
    steam_url = Column(String, default="") # Guarda o STEAM ID 64
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
    is_favorite = Column(Boolean, default=False)
    owner_id = Column(Integer, ForeignKey("users.id"))

class Tierlist(Base):
    __tablename__ = "tierlists"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    data = Column(Text)
    owner_id = Column(Integer, ForeignKey("users.id"))

class Comment(Base):
    __tablename__ = "comments"
    id = Column(Integer, primary_key=True, index=True)
    game_id = Column(Integer, nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    content = Column(Text, nullable=False)
    created_at = Column(String, default=lambda: datetime.now().isoformat())

class CommentLike(Base):
    __tablename__ = "comment_likes"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    comment_id = Column(Integer, ForeignKey("comments.id"))

# --- CONEXÃO COM O BANCO ---
def get_db():
    global engine, SessionLocal
    try:
        if engine is None:
            DATABASE_URL = os.environ.get('POSTGRES_URL_NON_POOLING')
            if not DATABASE_URL: 
                DATABASE_URL = "sqlite:///./test.db"
            if DATABASE_URL.startswith("postgres://"):
                DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
            
            engine = create_engine(DATABASE_URL)
            SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
            Base.metadata.create_all(bind=engine)
            
        db = SessionLocal()
        yield db
    finally:
        if 'db' in locals() and db: db.close()

app = FastAPI()
app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"], 
)

# --- SCHEMAS (Pydantic) ---
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

class FavoritesInput(BaseModel):
    user_id: int
    game_ids: List[int]

class TierlistInput(BaseModel):
    name: str
    data: Dict[str, Any]
    owner_id: int

class TierlistUpdate(BaseModel):
    name: str
    data: Dict[str, Any]
    owner_id: int

class CommentInput(BaseModel):
    game_id: int
    user_id: int
    content: str

class LikeInput(BaseModel):
    user_id: int
    comment_id: int

# ==============================================================================
#  INTEGRAÇÃO IGDB
# ==============================================================================

IGDB_ACCESS_TOKEN = None
IGDB_TOKEN_EXPIRY = 0

def get_igdb_headers():
    global IGDB_ACCESS_TOKEN, IGDB_TOKEN_EXPIRY
    
    client_id = os.environ.get("IGDB_CLIENT_ID")
    client_secret = os.environ.get("IGDB_CLIENT_SECRET")
    
    if not client_id or not client_secret:
        print("ERRO: Faltam as chaves IGDB_CLIENT_ID ou IGDB_CLIENT_SECRET no .env")
        return None

    if not IGDB_ACCESS_TOKEN or time.time() > IGDB_TOKEN_EXPIRY:
        try:
            url = f"https://id.twitch.tv/oauth2/token?client_id={client_id}&client_secret={client_secret}&grant_type=client_credentials"
            response = requests.post(url)
            data = response.json()
            IGDB_ACCESS_TOKEN = data["access_token"]
            IGDB_TOKEN_EXPIRY = time.time() + data["expires_in"] - 60 
        except Exception as e:
            print(f"Erro ao pegar token IGDB: {e}")
            return None

    return {
        "Client-ID": client_id,
        "Authorization": f"Bearer {IGDB_ACCESS_TOKEN}",
    }

def format_igdb_image(url, size="t_cover_big"):
    if not url: return ""
    if url.startswith("//"):
        url = "https:" + url
    return url.replace("t_thumb", size)

# ==============================================================================
#  INTEGRAÇÃO STEAM (DADOS + AUTH)
# ==============================================================================

@app.get("/api/steam/library")
def get_steam_library(steam_id: str):
    api_key = os.environ.get("STEAM_API_KEY")
    if not api_key:
        print("ERRO STEAM: STEAM_API_KEY não encontrada no .env")
        raise HTTPException(status_code=500, detail="Chave da Steam não configurada.")

    target_id = steam_id
    # Resolve Vanity URL (caso o ID não seja numérico)
    if not steam_id.isdigit():
        try:
            resolve_url = f"http://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key={api_key}&vanityurl={steam_id}"
            resp = requests.get(resolve_url).json()
            if resp.get('response', {}).get('success') == 1:
                target_id = resp['response']['steamid']
        except Exception as e:
            print(f"Erro ao resolver Vanity URL Steam: {e}")

    print(f"Buscando dados Steam para ID: {target_id}")

    player_summary = {}
    steam_level = 0
    games_list = []

    # 1. Perfil (Summary)
    try:
        summary_url = f"http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key={api_key}&steamids={target_id}"
        summary_resp = requests.get(summary_url).json()
        players = summary_resp.get("response", {}).get("players", [])
        if players:
            player_summary = players[0]
    except Exception as e:
        print(f"Erro Steam Summary: {e}")

    # 2. Nível (Steam Level) - NOVO
    try:
        level_url = f"http://api.steampowered.com/IPlayerService/GetSteamLevel/v1/?key={api_key}&steamid={target_id}"
        level_resp = requests.get(level_url).json()
        steam_level = level_resp.get("response", {}).get("player_level", 0)
    except Exception as e:
        print(f"Erro Steam Level: {e}")

    # 3. Jogos (Owned Games)
    try:
        games_url = f"http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key={api_key}&steamid={target_id}&include_appinfo=1&include_played_free_games=1&format=json"
        games_resp = requests.get(games_url)
        
        if games_resp.status_code != 200:
            print(f"Erro Steam Games API Code: {games_resp.status_code}")
        
        data = games_resp.json()
        games = data.get("response", {}).get("games", [])
        
        for game in games:
            img_hash = game.get("img_icon_url")
            app_id = game.get("appid")
            image_url = ""
            if img_hash:
                image_url = f"http://media.steampowered.com/steamcommunity/public/images/apps/{app_id}/{img_hash}.jpg"

            games_list.append({
                "id": app_id, 
                "name": game.get("name"),
                "image": {"medium_url": image_url, "thumb_url": image_url},
                "playtime_forever": game.get("playtime_forever", 0) 
            })
            
        games_list.sort(key=lambda x: x['playtime_forever'], reverse=True)
    except Exception as e:
        print(f"Erro Steam Games Fetch: {e}")

    # Adiciona o nível ao objeto de retorno do perfil
    if player_summary:
        player_summary["level"] = steam_level

    return {
        "profile": player_summary,
        "games": games_list[:50]
    }

# --- ROTAS DE AUTENTICAÇÃO STEAM (OPENID) ---

@app.get("/api/auth/steam/login")
def login_steam(user_id: int, redirect_url: str, request: Request):
    """Redireciona o usuário para a página de login da Steam (OpenID)"""
    steam_openid_url = "https://steamcommunity.com/openid/login"
    
    # Monta a URL de callback usando o host atual da requisição
    base_url = str(request.base_url).rstrip("/")
    callback_url = f"{base_url}/api/auth/steam/callback"
    
    params = {
        "openid.ns": "http://specs.openid.net/auth/2.0",
        "openid.mode": "checkid_setup",
        "openid.return_to": f"{callback_url}?user_id={user_id}&redirect_url={urllib.parse.quote(redirect_url)}",
        "openid.realm": base_url,
        "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
        "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
    }
    
    redirect_to = f"{steam_openid_url}?{urllib.parse.urlencode(params)}"
    return RedirectResponse(redirect_to)

@app.get("/api/auth/steam/callback")
def callback_steam(user_id: int, redirect_url: str, request: Request, db: Session = Depends(get_db)):
    """Recebe o retorno da Steam, extrai o ID e salva no banco"""
    params = dict(request.query_params)
    
    if params.get("openid.mode") == "id_res":
        claimed_id = params.get("openid.claimed_id")
        # O ID vem assim: https://steamcommunity.com/openid/id/76561198...
        steam_id_match = re.search(r'https://steamcommunity.com/openid/id/(\d+)', claimed_id)
        
        if steam_id_match:
            steam_id_64 = steam_id_match.group(1)
            
            # Salva o ID da Steam no usuário
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                user.steam_url = steam_id_64 # Usamos este campo para guardar o ID
                db.commit()
                print(f"SUCESSO: Steam ID {steam_id_64} vinculado ao usuário {user_id}")
            else:
                print(f"ERRO: Usuário {user_id} não encontrado para vincular Steam.")
        else:
            print("ERRO: Não foi possível extrair o Steam ID do callback.")
            
    return RedirectResponse(redirect_url)

# ==============================================================================
#  ROTA FAVORITOS E QUIZ
# ==============================================================================

@app.post("/api/profile/favorites")
def set_favorites(input_data: FavoritesInput, db: Session = Depends(get_db)):
    try:
        db.query(Review).filter(Review.owner_id == input_data.user_id).update({"is_favorite": False})
        if input_data.game_ids:
            db.query(Review).filter(
                Review.owner_id == input_data.user_id, 
                Review.game_id.in_(input_data.game_ids)
            ).update({"is_favorite": True}, synchronize_session=False)
        db.commit()
        return {"message": "Favoritos atualizados!"}
    except Exception as e:
        db.rollback()
        return {"error": str(e)}

@app.get("/api/quiz/{user_id}")
def generate_quiz(user_id: int, db: Session = Depends(get_db)):
    reviews = db.query(Review).filter(Review.owner_id == user_id).all()
    
    if len(reviews) < 4:
        return {"error": "Usuário precisa de pelo menos 4 avaliações."}

    questions = []
    
    def create_question(category_key, category_name, reverse_sort=False, label_superlative="maior"):
        sorted_reviews = sorted(reviews, key=lambda x: getattr(x, category_key), reverse=not reverse_sort)
        winner = sorted_reviews[0]
        winner_val = getattr(winner, category_key)

        potential_distractors = [r for r in reviews if r.id != winner.id and getattr(r, category_key) != winner_val]
        
        if len(potential_distractors) < 3: return None

        random.shuffle(potential_distractors)
        distractors = potential_distractors[:3]
        
        options = [winner] + distractors
        random.shuffle(options)

        return {
            "id": len(questions) + 1,
            "question": f"Qual jogo recebeu a {label_superlative} nota em {category_name}?",
            "correct_id": winner.game_id,
            "options": [{"id": opt.game_id, "name": opt.game_name, "image": opt.game_image_url} for opt in options]
        }

    q_types = [
        ("nota_geral", "Nota Geral", False, "maior"),
        ("nota_geral", "Nota Geral", True, "menor"),
        ("jogabilidade", "Jogabilidade", False, "melhor"),
        ("graficos", "Gráficos", False, "melhor"),
        ("narrativa", "Narrativa", False, "melhor"),
        ("audio", "Áudio", False, "melhor"),
        ("desempenho", "Desempenho", False, "melhor"),
    ]

    for key, name, rev, label in q_types:
        q = create_question(key, name, rev, label)
        if q: questions.append(q)

    favorites = [r for r in reviews if r.is_favorite]
    if favorites and len(reviews) >= 4:
        fav_winner = favorites[0]
        others = [r for r in reviews if r.id != fav_winner.id][:3]
        if len(others) == 3:
            opts = [fav_winner] + others
            random.shuffle(opts)
            questions.append({
                "id": len(questions) + 1,
                "question": "Qual destes jogos está no TOP 3 do perfil?",
                "correct_id": fav_winner.game_id,
                "options": [{"id": o.game_id, "name": o.game_name, "image": o.game_image_url} for o in opts]
            })

    return questions[:10]

# ==============================================================================
#  ROTAS PRINCIPAIS (MANTIDAS)
# ==============================================================================

@app.get("/api/profile/{user_id}")
def get_profile(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user: raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    all_reviews = db.query(Review).filter(Review.owner_id == user_id).all()
    review_count = len(all_reviews)
    
    genre_map = {}
    fps_count = 0
    total_score_sum = 0

    favorites = [r for r in all_reviews if r.is_favorite]
    if not favorites:
        favorites = sorted(all_reviews, key=lambda x: x.nota_geral, reverse=True)[:3]
    else:
        favorites = favorites[:3]

    favorites_data = []
    for r in favorites:
        favorites_data.append({
            "game_name": r.game_name,
            "game_image_url": r.game_image_url or "",
            "nota_geral": r.nota_geral,
            "jogabilidade": r.jogabilidade,
            "graficos": r.graficos,
            "narrativa": r.narrativa,
            "audio": r.audio,
            "desempenho": r.desempenho
        })

    for r in all_reviews:
        g_name = r.genre or "Outros"
        if "Shooter" in g_name or "FPS" in g_name:
            fps_count += 1
        if g_name not in genre_map:
            genre_map[g_name] = {"count": 0, "total_score": 0.0}
        genre_map[g_name]["count"] += 1
        genre_map[g_name]["total_score"] += r.nota_geral
        total_score_sum += r.nota_geral

    favorite_genre = "Nenhum"
    if genre_map:
        def get_sort_key(item):
            data = item[1]
            avg = data["total_score"] / data["count"] if data["count"] > 0 else 0
            return (data["count"], avg)
        sorted_genres = sorted(genre_map.items(), key=get_sort_key, reverse=True)
        favorite_genre = sorted_genres[0][0]

    global_average = total_score_sum / review_count if review_count > 0 else 0.0

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
            "favorite_genre": favorite_genre,
            "average_score": global_average
        },
        "social": { "steam": user.steam_url, "xbox": user.xbox_url, "psn": user.psn_url, "epic": user.epic_url },
        "best_by_attribute": best_by_attribute,
        "achievements": achievements,
        "top_favorites": favorites_data
    }

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

@app.get("/api/users/search")
def search_users(q: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(User)
    if q:
        query = query.filter(or_(User.username.ilike(f"%{q}%"), User.nickname.ilike(f"%{q}%")))
        query = query.order_by(User.username.asc())
    else:
        query = query.order_by(User.username.asc())
    users = query.limit(50).all()
    results = []
    for u in users:
        results.append({
            "id": u.id, "username": u.username, "nickname": u.nickname or u.username, 
            "avatar_url": u.avatar_url, "level": u.level
        })
    return results

@app.get("/api/users/top")
def get_top_users(db: Session = Depends(get_db)):
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
            games.append({
                "id": r.game_id, 
                "title": r.game_name, 
                "cover": r.game_image_url or "",
                "nota_geral": r.nota_geral,
                "is_favorite": r.is_favorite 
            })
            seen_ids.add(r.game_id)
    return games
    
@app.get("/api/games/best-rated")
def get_best_rated_games(db: Session = Depends(get_db)):
    results = db.query(
        Review.game_id,
        Review.game_name,
        Review.game_image_url,
        func.avg(Review.nota_geral).label("average_score"),
        func.count(Review.id).label("review_count")
    ).group_by(
        Review.game_id, Review.game_name, Review.game_image_url
    )\
    .having(func.count(Review.id) >= 2) \
    .order_by(
        desc("average_score"), 
        desc("review_count")
    ).limit(12).all()

    games = []
    for r in results:
        games.append({
            "id": r.game_id,
            "name": r.game_name,
            "image": { "medium_url": r.game_image_url, "thumb_url": r.game_image_url },
            "average_score": r.average_score,
            "review_count": r.review_count
        })
    return games

@app.get("/api/tierlist_public/{tierlist_id}")
def get_single_tierlist(tierlist_id: int, db: Session = Depends(get_db)):
    tierlist = db.query(Tierlist).filter(Tierlist.id == tierlist_id).first()
    if not tierlist:
        raise HTTPException(status_code=404, detail="Tierlist não encontrada")
    
    try:
        loaded_data = json.loads(tierlist.data) if tierlist.data else {}
    except: loaded_data = {}

    owner = db.query(User).filter(User.id == tierlist.owner_id).first()
    owner_name = owner.username if owner else "Desconhecido"

    return { 
        "id": tierlist.id, 
        "name": tierlist.name, 
        "data": loaded_data, 
        "owner_id": tierlist.owner_id,
        "owner_name": owner_name
    }

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
            loaded_data = json.loads(t.data) if t.data else {}
            result.append({ "id": t.id, "name": t.name, "data": loaded_data })
        except: pass
    return result

@app.delete("/api/tierlist/{tierlist_id}")
def delete_tierlist(tierlist_id: int, owner_id: int, db: Session = Depends(get_db)):
    tierlist = db.query(Tierlist).filter(Tierlist.id == tierlist_id).first()
    if not tierlist:
        raise HTTPException(status_code=404, detail="Tierlist não encontrada")
    
    if tierlist.owner_id != owner_id:
        raise HTTPException(status_code=403, detail="Sem permissão para deletar")

    try:
        db.delete(tierlist)
        db.commit()
        return {"message": "Tierlist deletada com sucesso!"}
    except Exception as e:
        db.rollback()
        return {"error": str(e)}

@app.put("/api/tierlist/{tierlist_id}")
def update_tierlist(tierlist_id: int, tierlist_input: TierlistUpdate, db: Session = Depends(get_db)):
    tierlist = db.query(Tierlist).filter(Tierlist.id == tierlist_id).first()
    if not tierlist:
        raise HTTPException(status_code=404, detail="Tierlist não encontrada")
        
    if tierlist.owner_id != tierlist_input.owner_id:
        raise HTTPException(status_code=403, detail="Sem permissão para editar")

    try:
        tierlist.name = tierlist_input.name
        tierlist.data = json.dumps(tierlist_input.data)
        db.commit()
        return {"message": "Tierlist atualizada com sucesso!"}
    except Exception as e:
        db.rollback()
        return {"error": str(e)}
        
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

@app.get("/api/review")
def get_review(game_id: int, owner_id: int, db: Session = Depends(get_db)):
    r = db.query(Review).filter(Review.game_id == game_id, Review.owner_id == owner_id).first()
    return r if r else {"error": "Não encontrada"}

@app.post("/api/comments")
def post_comment(comment: CommentInput, db: Session = Depends(get_db)):
    try:
        new_comment = Comment(
            game_id=comment.game_id,
            user_id=comment.user_id,
            content=comment.content
        )
        db.add(new_comment)
        db.commit()
        return {"message": "Comentário enviado!"}
    except Exception as e:
        db.rollback()
        return {"error": str(e)}

@app.get("/api/game/{game_id}/discussion")
def get_game_discussion(game_id: int, user_id: int = -1, db: Session = Depends(get_db)):
    total_count = db.query(Comment).filter(Comment.game_id == game_id).count()
    stmt = db.query(Comment, func.count(CommentLike.id).label('likes'))\
        .outerjoin(CommentLike)\
        .filter(Comment.game_id == game_id)\
        .group_by(Comment.id)\
        .order_by(desc('likes'), desc(Comment.created_at))\
        .first()
    if not stmt:
        return {"total": 0, "top_comment": None}
    comment, likes_count = stmt
    user_liked = False
    if user_id != -1:
        if db.query(CommentLike).filter(CommentLike.user_id == user_id, CommentLike.comment_id == comment.id).first():
            user_liked = True
    author = db.query(User).filter(User.id == comment.user_id).first()
    return {
        "total": total_count,
        "top_comment": {
            "id": comment.id,
            "content": comment.content,
            "created_at": comment.created_at,
            "likes": likes_count,
            "user_liked": user_liked,
            "author": {
                "id": author.id,
                "username": author.username,
                "nickname": author.nickname or author.username,
                "avatar_url": author.avatar_url
            }
        }
    }

@app.get("/api/game/{game_id}/comments/all")
def get_all_game_comments(game_id: int, user_id: int = -1, db: Session = Depends(get_db)):
    comments = db.query(Comment, func.count(CommentLike.id).label('likes'))\
        .outerjoin(CommentLike)\
        .filter(Comment.game_id == game_id)\
        .group_by(Comment.id)\
        .order_by(desc('likes'), desc(Comment.created_at))\
        .all()
    result = []
    for c, likes in comments:
        user_liked = False
        if user_id != -1:
            if db.query(CommentLike).filter(CommentLike.user_id == user_id, CommentLike.comment_id == c.id).first():
                user_liked = True
        author = db.query(User).filter(User.id == c.user_id).first()
        result.append({
            "id": c.id,
            "content": c.content,
            "created_at": c.created_at,
            "likes": likes,
            "user_liked": user_liked,
            "author": {
                "id": author.id,
                "username": author.username,
                "nickname": author.nickname or author.username,
                "avatar_url": author.avatar_url
            }
        })
    return result

@app.post("/api/comments/{comment_id}/like")
def toggle_like(comment_id: int, like_data: LikeInput, db: Session = Depends(get_db)):
    existing = db.query(CommentLike).filter(CommentLike.comment_id == comment_id, CommentLike.user_id == like_data.user_id).first()
    if existing:
        db.delete(existing)
        db.commit()
        return {"status": "unliked"}
    else:
        new_like = CommentLike(comment_id=comment_id, user_id=like_data.user_id)
        db.add(new_like)
        db.commit()
        return {"status": "liked"}

@app.get("/api/user/{user_id}/comments")
def get_user_comments(user_id: int, db: Session = Depends(get_db)):
    comments = db.query(Comment, func.count(CommentLike.id).label('likes'))\
        .outerjoin(CommentLike)\
        .filter(Comment.user_id == user_id)\
        .group_by(Comment.id)\
        .order_by(desc(Comment.created_at))\
        .all()
    results = []
    for c, likes in comments:
        review = db.query(Review).filter(Review.game_id == c.game_id).first()
        game_name = review.game_name if review else f"Jogo #{c.game_id}"
        results.append({
            "id": c.id,
            "content": c.content,
            "likes": likes,
            "game_name": game_name,
            "game_id": c.game_id,
            "created_at": c.created_at
        })
    return results

@app.get("/api/user/{user_id}/best_comment")
def get_user_best_comment(user_id: int, db: Session = Depends(get_db)):
    stmt = db.query(Comment, func.count(CommentLike.id).label('likes'))\
        .outerjoin(CommentLike)\
        .filter(Comment.user_id == user_id)\
        .group_by(Comment.id)\
        .order_by(desc('likes'))\
        .first()
    if not stmt: return None
    comment, likes = stmt
    game_name = "Jogo Desconhecido"
    review = db.query(Review).filter(Review.game_id == comment.game_id).first()
    if review: game_name = review.game_name
    return {
        "id": comment.id,
        "content": comment.content,
        "likes": likes,
        "game_name": game_name,
        "game_id": comment.game_id
    }