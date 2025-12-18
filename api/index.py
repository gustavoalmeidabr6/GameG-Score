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
import concurrent.futures

from dotenv import load_dotenv
load_dotenv()

import bcrypt

CACHE_EXPIRATION = 3600  # 1 hora em segundos

upcoming_cache = {
    "data": [],
    "last_updated": 0
}

news_cache = {
    "data": [],
    "last_updated": 0
}

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
from sqlalchemy import create_engine, Column, Integer, String, Float, ForeignKey, desc, Boolean, Text, or_, func, distinct, text
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
    game_video_id = Column(String, default="")
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

class TierlistLike(Base):
    __tablename__ = "tierlist_likes"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    tierlist_id = Column(Integer, ForeignKey("tierlists.id"))

class TierlistComment(Base):
    __tablename__ = "tierlist_comments"
    id = Column(Integer, primary_key=True, index=True)
    tierlist_id = Column(Integer, ForeignKey("tierlists.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    content = Column(Text, nullable=False)
    created_at = Column(String, default=lambda: datetime.now().isoformat())

class Follower(Base):
    __tablename__ = "followers"
    follower_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    followed_id = Column(Integer, ForeignKey("users.id"), primary_key=True)

class FriendRequest(Base):
    __tablename__ = "friend_requests"
    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    receiver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String, default="pending") # pending, accepted
# --- NOVOS MODELOS PARA DISCUSSÕES ---

class Discussion(Base):
    __tablename__ = "discussions"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    game_id = Column(Integer, nullable=True) # Jogo relacionado (opcional)
    game_name = Column(String, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(String, default=lambda: datetime.now().isoformat())

class DiscussionVote(Base):
    __tablename__ = "discussion_votes"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    discussion_id = Column(Integer, ForeignKey("discussions.id"))
    vote_type = Column(Integer) # 1 para Like (Upvote), -1 para Deslike (Downvote)

class DiscussionComment(Base):
    __tablename__ = "discussion_comments"
    id = Column(Integer, primary_key=True, index=True)
    discussion_id = Column(Integer, ForeignKey("discussions.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"))
    content = Column(Text, nullable=False)
    created_at = Column(String, default=lambda: datetime.now().isoformat())

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

class DiscussionInput(BaseModel):
    title: str
    content: str
    game_id: Optional[int] = None
    game_name: Optional[str] = None
    user_id: int

class VoteInput(BaseModel):
    user_id: int
    discussion_id: int
    vote_type: int # 1 ou -1

class DiscussionCommentInput(BaseModel):
    discussion_id: int
    user_id: int
    content: str

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
    game_video_id: Optional[str] = ""
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

class TierlistLikeInput(BaseModel):
    user_id: int
    tierlist_id: int

class TierlistCommentInput(BaseModel):
    tierlist_id: int
    user_id: int
    content: str

class FollowInput(BaseModel):
    follower_id: int
    followed_id: int

class FriendInput(BaseModel):
    sender_id: int
    target_id: int

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
#  INTEGRAÇÃO STEAM
# ==============================================================================

@app.get("/api/steam/library")
def get_steam_library(steam_id: str):
    api_key = os.environ.get("STEAM_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Chave da Steam não configurada.")

    target_id = steam_id
    if not steam_id.isdigit():
        try:
            resolve_url = f"http://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key={api_key}&vanityurl={steam_id}"
            resp = requests.get(resolve_url).json()
            if resp.get('response', {}).get('success') == 1:
                target_id = resp['response']['steamid']
        except:
            pass 

    player_summary = {}
    try:
        summary_url = f"http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key={api_key}&steamids={target_id}"
        summary_resp = requests.get(summary_url).json()
        players = summary_resp.get("response", {}).get("players", [])
        if players:
            player_summary = players[0]
    except: pass

    url = f"http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key={api_key}&steamid={target_id}&include_appinfo=1&include_played_free_games=1&format=json"
    
    games_list = []
    try:
        response = requests.get(url)
        data = response.json()
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
    except: pass

    return {
        "profile": player_summary,
        "games": games_list[:50]
    }

# ==============================================================================
#  ROTAS DE BUSCA E JOGO
# ==============================================================================

@app.get("/api/search")
def search_games(q: str = None):
    if not q: return []
    
    headers = get_igdb_headers()
    if not headers: return [] 

    url = "https://api.igdb.com/v4/games"
    body = f'search "{q}"; fields name, cover.url, genres.name, first_release_date, videos.video_id; where cover != null; limit 20;'
    
    try:
        response = requests.post(url, headers=headers, data=body)
        games = response.json()
        
        results = []
        for game in games:
            cover_url = ""
            if "cover" in game:
                cover_url = format_igdb_image(game["cover"]["url"])
            
            video_id = ""
            if "videos" in game and len(game["videos"]) > 0:
                video_id = game["videos"][0].get("video_id", "")

            results.append({
                "id": game["id"],
                "name": game["name"],
                "image": {
                    "medium_url": cover_url,
                    "thumb_url": cover_url
                },
                "video_id": video_id,
                "release_date": game.get("first_release_date", "")
            })
        return results
    except Exception as e:
        print(f"Erro na busca IGDB: {e}")
        return []
    
@app.get("/api/game/{game_id}")
def get_game(game_id: str, db: Session = Depends(get_db)):
    headers = get_igdb_headers()
    if not headers: return {}

    url = "https://api.igdb.com/v4/games"
    body = f'fields name, summary, cover.url, genres.name, involved_companies.company.name, platforms.name, screenshots.url, websites.url, websites.category, external_games.category, external_games.uid; where id = {game_id};'
    
    igdb_data = {}
    steam_data = None
    community_stats = {}
    
    try:
        response = requests.post(url, headers=headers, data=body)
        data = response.json()
        if data:
            igdb_data = data[0]
    except Exception as e:
        print(f"Erro IGDB: {e}")
        return {}

    steam_app_id = None
    if "external_games" in igdb_data:
        for ext in igdb_data["external_games"]:
            if ext.get("category") == 1:
                steam_app_id = ext.get("uid")
                break
    
    if not steam_app_id and "websites" in igdb_data:
        for site in igdb_data["websites"]:
            if site.get("category") == 13: 
                url_str = site.get("url", "")
                match = re.search(r'store\.steampowered\.com/app/(\d+)', url_str)
                if match:
                    steam_app_id = match.group(1)
                    break
    
    if not steam_app_id and igdb_data.get("name"):
        try:
            search_name = urllib.parse.quote(igdb_data["name"])
            search_url = f"https://store.steampowered.com/api/storesearch/?term={search_name}&l=portuguese&cc=BR"
            search_resp = requests.get(search_url, timeout=3).json()
            
            if search_resp.get("total") > 0 and len(search_resp.get("items", [])) > 0:
                potential_item = search_resp["items"][0]
                potential_name = potential_item["name"]
                
                similarity = SequenceMatcher(None, igdb_data["name"].lower(), potential_name.lower()).ratio()
                
                is_valid = True
                if similarity < 0.80: is_valid = False
                if len(potential_name) > len(igdb_data["name"]) + 5: is_valid = False

                if is_valid:
                    steam_app_id = potential_item["id"]
        except Exception as e:
            print(f"Erro na busca fallback Steam: {e}")

    if steam_app_id:
        steam_data = {
            "app_id": steam_app_id,
            "store_link": f"https://store.steampowered.com/app/{steam_app_id}/",
            "is_free": False,
            "current_players": 0,
            "price_overview": None,
            "header_image": None
        }
        
        try:
            store_url = f"http://store.steampowered.com/api/appdetails?appids={steam_app_id}&cc=br&l=portuguese&filters=basic,price_overview,metacritic"
            store_resp = requests.get(store_url, headers={"User-Agent": "GameGScore/1.0"}, timeout=3).json()
            if store_resp and str(steam_app_id) in store_resp:
                app_data = store_resp[str(steam_app_id)]
                if app_data.get("success"):
                    s_data = app_data["data"]
                    steam_data["price_overview"] = s_data.get("price_overview", None)
                    steam_data["metacritic"] = s_data.get("metacritic")
                    steam_data["is_free"] = s_data.get("is_free", False)
                    steam_data["header_image"] = s_data.get("header_image")
        except Exception as e:
            print(f"Erro Steam Store API: {e}")

        try:
            players_url = f"https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid={steam_app_id}"
            players_resp = requests.get(players_url, headers={"User-Agent": "GameGScore/1.0"}, timeout=3).json()
            if players_resp.get("response"):
                steam_data["current_players"] = players_resp["response"].get("player_count", 0)
        except Exception as e:
            print(f"Erro Steam Players API: {e}")

    try:
        stats = db.query(func.avg(Review.nota_geral), func.count(Review.id)).filter(Review.game_id == int(game_id)).first()
        avg_val = stats[0] if stats[0] is not None else 0
        count_val = stats[1] if stats[1] is not None else 0
        community_stats["average_score"] = float(avg_val)
        community_stats["total_reviews"] = int(count_val)
    except Exception as e:
        community_stats = {"average_score": 0, "total_reviews": 0}

    cover_med = ""
    cover_high = ""
    if "cover" in igdb_data:
        cover_med = format_igdb_image(igdb_data["cover"]["url"], "t_cover_big")
        cover_high = format_igdb_image(igdb_data["cover"]["url"], "t_1080p")

    screenshots = []
    if "screenshots" in igdb_data:
        for s in igdb_data["screenshots"][:4]: 
            screenshots.append(format_igdb_image(s["url"], "t_screenshot_big"))

    return {
        "id": igdb_data.get("id"),
        "name": igdb_data.get("name"),
        "deck": igdb_data.get("summary", "Sem descrição."),
        "image": {
            "medium_url": cover_med,
            "original_url": cover_high
        },
        "genres": [{"name": g["name"]} for g in igdb_data.get("genres", [])],
        "screenshots": screenshots,
        "steam_data": steam_data,
        "community_stats": community_stats
    }

# ==============================================================================
#  ROTAS DE COMUNIDADE (NOVO: COMENTÁRIOS E TIERLISTS)
# ==============================================================================

@app.get("/api/community/top_comments")
def get_top_community_comments(db: Session = Depends(get_db)):
    stmt = db.query(Comment, func.count(CommentLike.id).label('likes'))\
        .outerjoin(CommentLike)\
        .group_by(Comment.id)\
        .order_by(desc('likes'), desc(Comment.created_at))\
        .limit(10)\
        .all()
    
    results = []
    for comment, likes in stmt:
        author = db.query(User).filter(User.id == comment.user_id).first()
        game_name = "Jogo Desconhecido"
        review = db.query(Review).filter(Review.game_id == comment.game_id).first()
        if review:
            game_name = review.game_name

        results.append({
            "id": comment.id,
            "content": comment.content,
            "likes": likes,
            "created_at": comment.created_at,
            "game_id": comment.game_id,
            "game_name": game_name,
            "author": {
                "id": author.id,
                "username": author.username,
                "nickname": author.nickname or author.username,
                "avatar_url": author.avatar_url
            }
        })
    return results

@app.get("/api/community/top_tierlists")
def get_top_community_tierlists(db: Session = Depends(get_db)):
    stmt = db.query(Tierlist, func.count(TierlistLike.id).label('likes'))\
        .outerjoin(TierlistLike)\
        .group_by(Tierlist.id)\
        .order_by(desc('likes'), desc(Tierlist.id))\
        .limit(10)\
        .all()
    
    results = []
    for tierlist, likes in stmt:
        author = db.query(User).filter(User.id == tierlist.owner_id).first()
        try:
            loaded_data = json.loads(tierlist.data) if tierlist.data else {}
        except:
            loaded_data = {}
            
        results.append({
            "id": tierlist.id,
            "name": tierlist.name,
            "likes": likes,
            "data": loaded_data,
            "author": {
                "id": author.id,
                "username": author.username,
                "nickname": author.nickname or author.username,
                "avatar_url": author.avatar_url
            }
        })
    return results

@app.post("/api/tierlist/{tierlist_id}/like")
def toggle_tierlist_like(tierlist_id: int, like_data: TierlistLikeInput, db: Session = Depends(get_db)):
    existing = db.query(TierlistLike).filter(TierlistLike.tierlist_id == tierlist_id, TierlistLike.user_id == like_data.user_id).first()
    if existing:
        db.delete(existing)
        db.commit()
        return {"status": "unliked"}
    else:
        new_like = TierlistLike(tierlist_id=tierlist_id, user_id=like_data.user_id)
        db.add(new_like)
        db.commit()
        return {"status": "liked"}

# ==============================================================================
#  DEMAIS ROTAS (MANTIDAS)
# ==============================================================================

@app.get("/api/DANGEROUS-RESET-DB")
def dangerous_reset_db(db: Session = Depends(get_db)):
    try:
        global engine
        # Passo extra: Forçar a exclusão da tabela antiga 'friendships' que está travando o banco
        with engine.connect() as connection:
            connection.execute(text("DROP TABLE IF EXISTS friendships CASCADE"))
            connection.commit()
            
        # Agora roda o reset normal
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

# No arquivo index.py, procure por @app.get("/api/profile/{user_id}") e substitua por:

@app.get("/api/profile/{identifier}")
def get_profile(identifier: str, db: Session = Depends(get_db)):
    # Tenta buscar o usuário
    user = None
    
    # Se for puramente numérico, tenta buscar pelo ID primeiro
    if identifier.isdigit():
        user = db.query(User).filter(User.id == int(identifier)).first()
    
    # Se não achou pelo ID (ou não era número), busca pelo username
    if not user:
        # Busca por username (case insensitive é melhor para UX, mas aqui manteremos exato ou ilike)
        user = db.query(User).filter(User.username == identifier).first()

    if not user: 
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    user_id = user.id # Pegamos o ID real do usuário encontrado

    # --- O RESTO DA FUNÇÃO PERMANECE IGUAL, APENAS USE user_id ONDE ERA USADO ANTES ---
    
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
    
    followers_count = db.query(Follower).filter(Follower.followed_id == user_id).count()
    following_count = db.query(Follower).filter(Follower.follower_id == user_id).count()

    return {
        "id": user.id,
        "username": user.username,
        "nickname": user.nickname or user.username,
        "bio": user.bio,
        "avatar_url": user.avatar_url,
        "banner_url": user.banner_url,
        "xp": user.xp,
        "level": user.level,
        "followers_count": followers_count,
        "following_count": following_count,
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
        Review.game_video_id,
        func.avg(Review.nota_geral).label("average_score"),
        func.count(Review.id).label("review_count")
    ).group_by(
        Review.game_id, Review.game_name, Review.game_image_url, Review.game_video_id
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
            "video_id": r.game_video_id,
            "average_score": r.average_score,
            "review_count": r.review_count
        })
    return games

@app.get("/api/tierlist_public/{tierlist_id}")
def get_single_tierlist(tierlist_id: int, user_id: int = -1, db: Session = Depends(get_db)):
    tierlist = db.query(Tierlist).filter(Tierlist.id == tierlist_id).first()
    if not tierlist:
        raise HTTPException(status_code=404, detail="Tierlist não encontrada")
    
    try:
        loaded_data = json.loads(tierlist.data) if tierlist.data else {}
    except: loaded_data = {}

    owner = db.query(User).filter(User.id == tierlist.owner_id).first()
    owner_data = {
        "id": owner.id,
        "username": owner.username,
        "nickname": owner.nickname or owner.username,
        "avatar_url": owner.avatar_url
    } if owner else {"id": 0, "username": "Desconhecido", "nickname": "Desconhecido", "avatar_url": ""}

    # Contagem de Likes
    likes_count = db.query(TierlistLike).filter(TierlistLike.tierlist_id == tierlist_id).count()
    
    # Verifica se o usuário (se passado na query) deu like
    user_has_liked = False
    if user_id != -1:
        if db.query(TierlistLike).filter(TierlistLike.tierlist_id == tierlist_id, TierlistLike.user_id == user_id).first():
            user_has_liked = True

    # Busca Comentários
    comments_query = db.query(TierlistComment).filter(TierlistComment.tierlist_id == tierlist_id).order_by(desc(TierlistComment.created_at)).all()
    comments_list = []
    for c in comments_query:
        c_author = db.query(User).filter(User.id == c.user_id).first()
        comments_list.append({
            "id": c.id,
            "content": c.content,
            "created_at": c.created_at,
            "author": {
                "id": c_author.id,
                "nickname": c_author.nickname or c_author.username,
                "avatar_url": c_author.avatar_url
            } if c_author else {"nickname": "Desconhecido", "avatar_url": ""}
        })

    return { 
        "id": tierlist.id, 
        "name": tierlist.name, 
        "data": loaded_data, 
        "owner_id": tierlist.owner_id,
        "owner": owner_data,
        "likes_count": likes_count,
        "user_has_liked": user_has_liked,
        "comments": comments_list
    }

# ESTA ROTA ESTAVA FALTANDO! ELA É A RESPONSÁVEL POR CRIAR A TIERLIST (POST)
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

@app.post("/api/tierlist/comment")
def post_tierlist_comment(comment_data: TierlistCommentInput, db: Session = Depends(get_db)):
    try:
        new_comment = TierlistComment(
            tierlist_id=comment_data.tierlist_id,
            user_id=comment_data.user_id,
            content=comment_data.content
        )
        db.add(new_comment)
        db.commit()
        
        # Opcional: Dar XP para quem comentou
        user = db.query(User).filter(User.id == comment_data.user_id).first()
        if user:
            user.xp += 15
        db.commit()

        return {"message": "Comentário enviado com sucesso!"}
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
        new_review = Review(game_id=review_input.game_id, game_name=review_input.game_name, game_image_url=review_input.game_image_url, game_video_id=review_input.game_video_id, genre=review_input.genre, jogabilidade=review_input.jogabilidade, graficos=review_input.graficos, narrativa=review_input.narrativa, audio=review_input.audio, desempenho=review_input.desempenho, nota_geral=nota_geral, owner_id=review_input.owner_id)
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

# --- ROTAS DE SEGUIR, SOCIAL E AMIGOS ---

@app.post("/api/user/follow")
def toggle_follow(data: FollowInput, db: Session = Depends(get_db)):
    if data.follower_id == data.followed_id:
        return {"error": "Não pode seguir a si mesmo"}
    
    existing = db.query(Follower).filter(Follower.follower_id == data.follower_id, Follower.followed_id == data.followed_id).first()
    
    if existing:
        db.delete(existing)
        db.commit()
        return {"status": "unfollowed"}
    else:
        new_follow = Follower(follower_id=data.follower_id, followed_id=data.followed_id)
        db.add(new_follow)
        db.commit()
        return {"status": "followed"}

@app.get("/api/user/{user_id}/social_list")
def get_social_list(user_id: int, db: Session = Depends(get_db)):
    # 1. Seguidores
    followers = db.query(User).join(Follower, Follower.follower_id == User.id).filter(Follower.followed_id == user_id).all()
    
    # 2. Seguindo
    following = db.query(User).join(Follower, Follower.followed_id == User.id).filter(Follower.follower_id == user_id).all()
    
    # 3. Amigos (Tabela FriendRequest com status accepted)
    # Amigos onde eu sou o sender
    friends_sent = db.query(User).join(FriendRequest, FriendRequest.receiver_id == User.id).filter(
        FriendRequest.sender_id == user_id, 
        FriendRequest.status == "accepted"
    ).all()
    
    # Amigos onde eu sou o receiver
    friends_received = db.query(User).join(FriendRequest, FriendRequest.sender_id == User.id).filter(
        FriendRequest.receiver_id == user_id, 
        FriendRequest.status == "accepted"
    ).all()
    
    friends_list = friends_sent + friends_received
    
    def format_user(u):
        return {
            "id": u.id,
            "username": u.username,
            "nickname": u.nickname or u.username,
            "avatar_url": u.avatar_url,
            "level": u.level
        }

    return {
        "friends": [format_user(u) for u in friends_list],
        "followers": [format_user(u) for u in followers],
        "following": [format_user(u) for u in following]
    }

# --- ROTAS DE AMIZADE (ADD / REMOVE / ACCEPT) ---

@app.get("/api/friend/status")
def get_friendship_status(sender_id: int, target_id: int, db: Session = Depends(get_db)):
    # Verifica se já existe solicitação em qualquer direção
    req = db.query(FriendRequest).filter(
        or_(
            (FriendRequest.sender_id == sender_id) & (FriendRequest.receiver_id == target_id),
            (FriendRequest.sender_id == target_id) & (FriendRequest.receiver_id == sender_id)
        )
    ).first()
    
    if not req:
        return {"status": "none"}
    
    if req.status == "accepted":
        return {"status": "friends"}
    
    if req.sender_id == sender_id:
        return {"status": "pending_sent"}
    else:
        return {"status": "pending_received"}

@app.post("/api/friend/request")
def send_friend_request(data: FriendInput, db: Session = Depends(get_db)):
    if data.sender_id == data.target_id: return {"error": "Mesmo usuário"}
    
    existing = db.query(FriendRequest).filter(
        or_(
            (FriendRequest.sender_id == data.sender_id) & (FriendRequest.receiver_id == data.target_id),
            (FriendRequest.sender_id == data.target_id) & (FriendRequest.receiver_id == data.sender_id)
        )
    ).first()
    
    if existing:
        if existing.status == "accepted": return {"message": "Já são amigos"}
        return {"message": "Solicitação já existe"}
    
    new_req = FriendRequest(sender_id=data.sender_id, receiver_id=data.target_id, status="pending")
    db.add(new_req)
    db.commit()
    return {"message": "Solicitação enviada"}

# --- ADICIONE ESTA ROTA QUE ESTAVA FALTANDO ---
@app.get("/api/user/{user_id}/pending_requests")
def get_pending_requests(user_id: int, db: Session = Depends(get_db)):
    # Busca solicitações onde EU sou o recebedor (receiver_id) e status é 'pending'
    requests = db.query(FriendRequest).filter(
        FriendRequest.receiver_id == user_id,
        FriendRequest.status == "pending"
    ).all()
    
    results = []
    for req in requests:
        sender = db.query(User).filter(User.id == req.sender_id).first()
        if sender:
            results.append({
                "request_id": req.id,
                "sender_id": sender.id,
                "username": sender.username,
                "nickname": sender.nickname or sender.username,
                "avatar_url": sender.avatar_url
            })
    return results



# --- ADICIONE ESTA ROTA QUE ESTAVA FALTANDO ---
@app.get("/api/user/{user_id}/pending_requests")
def get_pending_requests(user_id: int, db: Session = Depends(get_db)):
    # Busca solicitações onde EU sou o recebedor (receiver_id) e status é 'pending'
    requests = db.query(FriendRequest).filter(
        FriendRequest.receiver_id == user_id,
        FriendRequest.status == "pending"
    ).all()
    
    results = []
    for req in requests:
        sender = db.query(User).filter(User.id == req.sender_id).first()
        if sender:
            results.append({
                "request_id": req.id,
                "sender_id": sender.id,
                "username": sender.username,
                "nickname": sender.nickname or sender.username,
                "avatar_url": sender.avatar_url
            })
    return results

@app.post("/api/friend/accept")
def accept_friend_request(data: FriendInput, db: Session = Depends(get_db)):
    # Procura o pedido onde o remetente é quem enviou (sender_id) e o destinatário sou eu (target_id)
    req = db.query(FriendRequest).filter(
        (FriendRequest.sender_id == data.sender_id) & 
        (FriendRequest.receiver_id == data.target_id)
    ).first()
    
    if not req: 
        raise HTTPException(status_code=404, detail="Solicitação não encontrada")
    
    req.status = "accepted"
    db.commit()
    return {"message": "Agora vocês são amigos!"}

@app.delete("/api/friend/remove")
def remove_friend(sender_id: int, target_id: int, db: Session = Depends(get_db)):
    # Procura a relação em qualquer direção para deletar (serve para recusar ou desfazer amizade)
    req = db.query(FriendRequest).filter(
        or_(
            (FriendRequest.sender_id == sender_id) & (FriendRequest.receiver_id == target_id),
            (FriendRequest.sender_id == target_id) & (FriendRequest.receiver_id == sender_id)
        )
    ).first()
    
    if req:
        db.delete(req)
        db.commit()
        return {"message": "Removido"}
    
    raise HTTPException(status_code=404, detail="Solicitação não encontrada")

# --- ROTA DE CONEXÕES / AMIGOS (COM CÁLCULO DE COMPATIBILIDADE) ---
@app.get("/api/connections/{user_id}")
def get_profile_connections(user_id: int, db: Session = Depends(get_db)):
    # 1. Busca todas as reviews do usuário alvo
    target_reviews = db.query(Review).filter(Review.owner_id == user_id).all()
    
    # Mapa: {game_id: nota_geral}
    target_scores = {r.game_id: r.nota_geral for r in target_reviews}
    target_game_ids = list(target_scores.keys())
    
    connections_list = []
    
    if target_game_ids:
        # 2. Busca outras reviews DESSES MESMOS JOGOS por OUTROS usuários
        others_reviews = db.query(Review).filter(
            Review.game_id.in_(target_game_ids),
            Review.owner_id != user_id
        ).all()
        
        # Agrupa por usuario
        user_scores_map = {}
        for r in others_reviews:
            if r.owner_id not in user_scores_map:
                user_scores_map[r.owner_id] = []
            user_scores_map[r.owner_id].append(r)
            
        # 3. Calcula compatibilidade
        for other_id, reviews in user_scores_map.items():
            total_similarity = 0
            shared_count = 0
            
            for r in reviews:
                if r.game_id in target_scores:
                    my_score = target_scores[r.game_id]
                    other_score = r.nota_geral
                    
                    # Diferença absoluta (0 a 10)
                    diff = abs(my_score - other_score)
                    
                    # Converter diff em % de similaridade (0 diff = 100%, 10 diff = 0%)
                    similarity = max(0, 100 - (diff * 10))
                    
                    total_similarity += similarity
                    shared_count += 1
            
            if shared_count > 0:
                final_compatibility = total_similarity / shared_count
                
                # SÓ ADICIONA SE FOR MAIOR QUE 50%
                if final_compatibility > 50:
                    other_user = db.query(User).filter(User.id == other_id).first()
                    if other_user:
                        connections_list.append({
                            "id": other_user.id,
                            "username": other_user.username,
                            "nickname": other_user.nickname or other_user.username,
                            "avatar_url": other_user.avatar_url,
                            "level": other_user.level,
                            "compatibility": int(final_compatibility),
                            "interaction": f"{int(final_compatibility)}% Compatível"
                        })

    # Ordena por maior compatibilidade
    connections_list.sort(key=lambda x: x['compatibility'], reverse=True)
    
    return connections_list[:10] # Retorna top 10

# --- QUIZ COM 10 PERGUNTAS VARIADAS ---
@app.get("/api/quiz/{user_id}")
def generate_quiz(user_id: int, db: Session = Depends(get_db)):
    reviews = db.query(Review).filter(Review.owner_id == user_id).all()
    
    if len(reviews) < 2:
        return {"error": "Usuário precisa de pelo menos 2 avaliações para gerar o quiz."}

    questions = []
    
    # Helper para pegar distratores (opções erradas)
    def get_distractors(exclude_id, count=3):
        candidates = [r for r in reviews if r.id != exclude_id]
        if len(candidates) >= count:
            return random.sample(candidates, count)
        return candidates

    # 1. MELHOR NOTA GERAL
    sorted_by_score = sorted(reviews, key=lambda x: x.nota_geral, reverse=True)
    winner_score = sorted_by_score[0]
    opts_score = [winner_score] + get_distractors(winner_score.id)
    random.shuffle(opts_score)
    questions.append({
        "id": 1, "type": "multiple_choice",
        "question": "Qual jogo recebeu a MAIOR Nota Geral deste perfil?",
        "correct_id": winner_score.game_id,
        "options": [{"id": o.game_id, "name": o.game_name, "image": o.game_image_url} for o in opts_score]
    })

    # 2. MELHOR GRÁFICO
    sorted_gfx = sorted(reviews, key=lambda x: x.graficos, reverse=True)
    winner_gfx = sorted_gfx[0]
    opts_gfx = [winner_gfx] + get_distractors(winner_gfx.id)
    random.shuffle(opts_gfx)
    questions.append({
        "id": 2, "type": "multiple_choice",
        "question": "Qual jogo tem os Melhores Gráficos segundo o usuário?",
        "correct_id": winner_gfx.game_id,
        "options": [{"id": o.game_id, "name": o.game_name, "image": o.game_image_url} for o in opts_gfx]
    })

    # 3. MELHOR NARRATIVA
    sorted_narr = sorted(reviews, key=lambda x: x.narrativa, reverse=True)
    winner_narr = sorted_narr[0]
    opts_narr = [winner_narr] + get_distractors(winner_narr.id)
    random.shuffle(opts_narr)
    questions.append({
        "id": 3, "type": "multiple_choice",
        "question": "Qual jogo tem a Melhor História (Narrativa)?",
        "correct_id": winner_narr.game_id,
        "options": [{"id": o.game_id, "name": o.game_name, "image": o.game_image_url} for o in opts_narr]
    })

    # 4. SLIDER (NOTA EXATA - Jogo Aleatório 1)
    r_slider1 = random.choice(reviews)
    questions.append({
        "id": 4, "type": "slider",
        "question": f"Qual a nota exata de {r_slider1.game_name}?",
        "game_name": r_slider1.game_name,
        "game_image": r_slider1.game_image_url,
        "correct_score": r_slider1.nota_geral
    })

    # 5. VERSUS (Quem ganha?)
    if len(reviews) >= 2:
        r1, r2 = random.sample(reviews, 2)
        winner_versus = r1 if r1.nota_geral > r2.nota_geral else r2 # Se empate, r2 ganha (simplificação)
        questions.append({
            "id": 5, "type": "versus",
            "question": "Duelo: Qual jogo tem a nota maior?",
            "option_a": {"id": r1.game_id, "name": r1.game_name, "image": r1.game_image_url, "score": r1.nota_geral},
            "option_b": {"id": r2.game_id, "name": r2.game_name, "image": r2.game_image_url, "score": r2.nota_geral},
            "correct_id": winner_versus.game_id
        })

    # 6. GÊNERO FAVORITO
    genre_counts = {}
    for r in reviews:
        g = r.genre or "Outros"
        genre_counts[g] = genre_counts.get(g, 0) + 1
    fav_genre = sorted(genre_counts.items(), key=lambda x: x[1], reverse=True)[0][0]
    fake_genres = ["RPG", "Shooter", "Adventure", "Indie", "Strategy", "Sports"]
    fake_genres = [g for g in fake_genres if g != fav_genre]
    random.shuffle(fake_genres)
    opts_genre = [fav_genre] + fake_genres[:3]
    random.shuffle(opts_genre)
    
    questions.append({
        "id": 6, "type": "genre",
        "question": "Qual gênero aparece mais neste perfil?",
        "options": opts_genre,
        "correct_answer": fav_genre
    })

    # 7. PIOR NOTA (Ou Menor)
    sorted_worst = sorted(reviews, key=lambda x: x.nota_geral)
    worst = sorted_worst[0]
    opts_worst = [worst] + get_distractors(worst.id)
    random.shuffle(opts_worst)
    questions.append({
        "id": 7, "type": "multiple_choice",
        "question": "Qual destes jogos teve a MENOR nota?",
        "correct_id": worst.game_id,
        "options": [{"id": o.game_id, "name": o.game_name, "image": o.game_image_url} for o in opts_worst]
    })

    # 8. SLIDER (NOTA EXATA - Jogo Aleatório 2)
    # Tenta pegar um diferente do primeiro slider
    r_slider2 = random.choice(reviews)
    if r_slider2.id == r_slider1.id and len(reviews) > 1:
        for r in reviews:
            if r.id != r_slider1.id:
                r_slider2 = r
                break
                
    questions.append({
        "id": 8, "type": "slider",
        "question": f"Quanto o usuário deu para {r_slider2.game_name}?",
        "game_name": r_slider2.game_name,
        "game_image": r_slider2.game_image_url,
        "correct_score": r_slider2.nota_geral
    })

    # 9. MELHOR JOGABILIDADE
    sorted_gameplay = sorted(reviews, key=lambda x: x.jogabilidade, reverse=True)
    winner_gp = sorted_gameplay[0]
    opts_gp = [winner_gp] + get_distractors(winner_gp.id)
    random.shuffle(opts_gp)
    questions.append({
        "id": 9, "type": "multiple_choice",
        "question": "Qual jogo tem a Melhor Jogabilidade?",
        "correct_id": winner_gp.game_id,
        "options": [{"id": o.game_id, "name": o.game_name, "image": o.game_image_url} for o in opts_gp]
    })

    # 10. ESTÁ NO TOP 3 (FAVORITOS)?
    favorites = [r for r in reviews if r.is_favorite]
    if favorites:
        fav_target = random.choice(favorites)
        # Distratores devem ser jogos que NÃO são favoritos
        non_favs = [r for r in reviews if not r.is_favorite]
        if len(non_favs) >= 3:
            dist_favs = random.sample(non_favs, 3)
            opts_fav = [fav_target] + dist_favs
            random.shuffle(opts_fav)
            questions.append({
                "id": 10, "type": "multiple_choice",
                "question": "Qual destes jogos está nos Favoritos do perfil?",
                "correct_id": fav_target.game_id,
                "options": [{"id": o.game_id, "name": o.game_name, "image": o.game_image_url} for o in opts_fav]
            })
    
    # Se não tiver favoritos suficientes ou der erro, completa com outra pergunta de áudio
    if len(questions) < 10:
        sorted_audio = sorted(reviews, key=lambda x: x.audio, reverse=True)
        winner_aud = sorted_audio[0]
        opts_aud = [winner_aud] + get_distractors(winner_aud.id)
        random.shuffle(opts_aud)
        questions.append({
            "id": 10, "type": "multiple_choice",
            "question": "Qual jogo tem o Melhor Áudio/Trilha Sonora?",
            "correct_id": winner_aud.game_id,
            "options": [{"id": o.game_id, "name": o.game_name, "image": o.game_image_url} for o in opts_aud]
        })

    return questions[:10]
# ==============================================================================
#  NOVAS ROTAS: DADOS (Lançamentos e Notícias com Tradução)
# ==============================================================================

# Função auxiliar de tradução segura
def safe_translate(text):
    if not text or len(text) < 2:
        return text
    try:
        from deep_translator import GoogleTranslator
        # Traduz do inglês (auto) para português (pt)
        return GoogleTranslator(source='auto', target='pt').translate(text)
    except ImportError:
        print("ERRO: 'deep-translator' não instalado. Rodar: pip install deep-translator")
        return text
    except Exception as e:
        print(f"Erro ao traduzir trecho: {e}")
        return text

# --- SUBSTITUA A FUNÇÃO get_upcoming_games POR ESTA ---

@app.get("/api/games/upcoming")
def get_upcoming_games():
    global upcoming_cache
    
    # 1. Verifica Cache (1 hora)
    current_time = int(time.time())
    if upcoming_cache["data"] and (current_time - upcoming_cache["last_updated"] < CACHE_EXPIRATION):
        return upcoming_cache["data"]

    try:
        # Busca a lista oficial de "Em Breve" da Steam
        url = "https://store.steampowered.com/api/featuredcategories?cc=BR&l=portuguese"
        response = requests.get(url, timeout=10)
        data = response.json()
        
        items = []
        if "coming_soon" in data:
            items = data["coming_soon"]["items"]
        
        # REMOVIDO: Fallback para 'top_sellers' (causava o bug de mostrar jogos atuais)

        # Pega IDs dos top 20 para filtrar (pegamos mais para poder descartar os ruins)
        target_ids = [item["id"] for item in items[:25]]
        
        if not target_ids:
            return []

        def get_steam_details(app_id):
            try:
                # Delay para não tomar block da API
                time.sleep(random.uniform(0.05, 0.1))
                
                url_det = f"http://store.steampowered.com/api/appdetails?appids={app_id}&cc=BR&l=portuguese"
                res = requests.get(url_det, timeout=5).json()
                
                if str(app_id) in res and res[str(app_id)]["success"]:
                    game_data = res[str(app_id)]["data"]
                    
                    # --- FILTROS DE QUALIDADE E CONTEÚDO ---
                    
                    # 1. Filtra se não for jogo base (descarta DLCs, hardware, etc se aparecerem)
                    if game_data.get("type") != "game":
                        return None

                    # 2. Filtra Conteúdo Adulto / Hentai
                    # Verifica descritores de conteúdo da Steam (Ids 1=Nudity, 3=Sexual Content)
                    descriptors = game_data.get("content_descriptors", {}).get("ids", [])
                    if 3 in descriptors: # Sexual Content Explícito
                        return None
                        
                    # Verifica palavras chave no nome e descrição curta
                    name_lower = game_data["name"].lower()
                    desc_lower = game_data.get("short_description", "").lower()
                    banned_terms = ["hentai", "sex ", "sexual", "nude", "uncensored", "18+"]
                    
                    if any(term in name_lower for term in banned_terms):
                        return None
                    
                    # Filtra shovelware pornografico pela descrição se for muito suspeita
                    if "sexual acts" in desc_lower or "explicit content" in desc_lower:
                        return None

                    # --- FORMATAÇÃO DE DADOS ---

                    # Formata Gêneros
                    genres = [g["description"] for g in game_data.get("genres", [])][:2]
                    
                    # Formata Plataformas
                    platforms = ["PC"]
                    if game_data.get("platforms", {}).get("mac"): platforms.append("Mac")
                    
                    # TRATAMENTO DE DATA (Resolve o "Invalid Date")
                    raw_date = game_data.get("release_date", {}).get("date", "")
                    clean_date = raw_date
                    
                    # Tenta limpar a data PT-BR para algo mais limpo
                    # Ex: "27 fev., 2025" -> "27 Fev 2025"
                    try:
                        clean_date = clean_date.replace(".", "").strip()
                        # Capitaliza o mês (fev -> Fev)
                        parts = clean_date.split(" ")
                        if len(parts) >= 2:
                            parts[1] = parts[1].capitalize()
                            clean_date = " ".join(parts)
                    except:
                        pass # Se falhar, usa a original

                    return {
                        "id": app_id,
                        "name": game_data["name"],
                        "image": game_data.get("header_image", ""),
                        "release_date": clean_date, # Retorna string limpa
                        "summary": game_data.get("short_description", "Sem descrição disponível."),
                        "platforms": platforms,
                        "genres": genres
                    }
            except Exception as e:
                # Silencia erros individuais para não quebrar a lista
                return None
            return None

        results = []
        # Executa em paralelo
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            future_to_id = {executor.submit(get_steam_details, i): i for i in target_ids}
            for future in concurrent.futures.as_completed(future_to_id):
                r = future.result()
                if r: results.append(r)
        
        # Reordena conforme a lista original da Steam (relevância)
        results.sort(key=lambda x: target_ids.index(x["id"]) if x["id"] in target_ids else 999)

        # Atualiza Cache
        upcoming_cache["data"] = results[:12] # Pega os 12 primeiros válidos
        upcoming_cache["last_updated"] = current_time
        
        return upcoming_cache["data"]

    except Exception as e:
        print(f"Erro Geral Steam Upcoming: {e}")
        return []


@app.get("/api/news/latest")
def get_latest_news():
    global news_cache
    
    # 1. Verifica Cache
    current_time = int(time.time())
    if news_cache["data"] and (current_time - news_cache["last_updated"] < CACHE_EXPIRATION):
        return news_cache["data"]

    # IDs: BG3, CS2, Dota2, Apex, Elden Ring, GTA V
    target_app_ids = [1086940, 730, 570, 1172470, 1245620, 271590]
    
    raw_news = []

    # Função interna para buscar e traduzir UMA notícia (será executada em paralelo)
    def fetch_news_for_app(app_id):
        try:
            url = f"http://api.steampowered.com/ISteamNews/GetNewsForApp/v0002/?appid={app_id}&count=1&maxlength=300&format=json"
            res = requests.get(url, timeout=5) # Timeout um pouco maior para garantir
            data = res.json()
            
            if "appnews" in data and "newsitems" in data["appnews"]:
                items = data["appnews"]["newsitems"]
                processed_items = []
                for item in items:
                    clean_content = re.sub('<[^<]+?>', '', item.get("contents", ""))
                    
                    # Tradução
                    title_pt = safe_translate(item.get("title"))
                    content_pt = safe_translate(clean_content[:150] + "...")

                    processed_items.append({
                        "id": item.get("gid"),
                        "title": title_pt,
                        "url": item.get("url"),
                        "author": item.get("author", "Steam"),
                        "date": item.get("date"),
                        "game_id": app_id,
                        "content_snippet": content_pt
                    })
                return processed_items
        except Exception as e:
            print(f"Erro ao buscar notícia app {app_id}: {e}")
            return []
        return []

    # 2. Execução Paralela (ThreadPoolExecutor)
    # Isso faz com que as 6 requisições aconteçam quase simultaneamente, não uma após a outra
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        future_to_app = {executor.submit(fetch_news_for_app, app_id): app_id for app_id in target_app_ids}
        
        for future in concurrent.futures.as_completed(future_to_app):
            try:
                data = future.result()
                if data:
                    raw_news.extend(data)
            except Exception as exc:
                print(f'Erro na task de noticias: {exc}')

    # Ordena por data
    raw_news.sort(key=lambda x: x["date"], reverse=True)
    
    # Atualiza Cache
    news_cache["data"] = raw_news
    news_cache["last_updated"] = current_time

    return raw_news

# --- ROTA PARA O MINIGAME DE CAPA (GUESS THE GAME) ---
@app.get("/api/minigame/cover/{user_id}")
def get_minigame_cover(user_id: int, db: Session = Depends(get_db)):
    reviews = db.query(Review).filter(Review.owner_id == user_id).all()
    
    # Mínimo de 3 jogos para jogar
    if len(reviews) < 3:
        return []
    
    # Seleciona até 10 jogos aleatórios
    selected_reviews = random.sample(reviews, min(len(reviews), 10))
    
    game_data = []
    for r in selected_reviews:
        # Gera uma dica baseada nas notas disponíveis
        possible_hints = []
        if r.nota_geral: possible_hints.append(f"O usuário deu nota TOTAL {r.nota_geral:.1f} para este jogo")
        if r.narrativa: possible_hints.append(f"A nota de NARRATIVA foi {r.narrativa:.1f}")
        if r.graficos: possible_hints.append(f"A nota de GRÁFICOS foi {r.graficos:.1f}")
        if r.jogabilidade: possible_hints.append(f"A nota de JOGABILIDADE foi {r.jogabilidade:.1f}")
        if r.audio: possible_hints.append(f"A nota de ÁUDIO foi {r.audio:.1f}")
        
        hint = random.choice(possible_hints) if possible_hints else "Jogo avaliado pelo usuário"
        
        game_data.append({
            "id": r.game_id,
            "name": r.game_name,
            "cover": r.game_image_url,
            "hint": hint
        })
        
    return game_data
@app.get("/api/games/anticipated_2026")
def get_anticipated_2026():
    return [
        {
            "category": "Sequências e Continuações AAA",
            "games": [
                {
                    "id": 202601,
                    "name": "Grand Theft Auto VI",
                    "developer": "Rockstar Games",
                    "release_date": "19 de novembro de 2026",
                    "platforms": ["PS5", "Xbox Series X/S"],
                    "description": "O próximo capítulo da icônica série nos levará de volta à Vice City. A trama foca em Lucia e Jason construindo seu império do crime.",
                    "image": "https://media-rockstargames-com.akamaized.net/mfe6/prod/__common/img/71d4d17edcd49703a5ea446cc0e588e6.jpg"
                },
                {
                    "id": 202602,
                    "name": "Resident Evil Requiem",
                    "developer": "Capcom",
                    "release_date": "27 de fevereiro de 2026",
                    "platforms": ["PS5", "Xbox Series X/S", "PC"],
                    "description": "Novo episódio com a protagonista Grace Ashcroft e o retorno de Leon S. Kennedy. Trama envolve segredos da Umbrella e um vilão enigmático.",
                    "image": "https://cdn1.epicgames.com/spt-assets/b2e589fac93746fc8d20b4177f5b3a60/resident-evil-requiem-1lsil.jpg"
                },
                {
                    "id": 202603,
                    "name": "Final Fantasy VII Remake – Parte 3",
                    "developer": "Square Enix",
                    "release_date": "Final de 2026",
                    "platforms": ["PS5", "PC (futuro)", "Switch 2 (futuro)"],
                    "description": "A conclusão épica da trilogia reimaginada. Promete a maior escala da saga, incluindo o retorno da airship Highwind.",
                    "image": "https://external-preview.redd.it/final-fantasy-vii-remake-part-three-currently-nine-months-v0-VZGJ4Q9MV4peuNQF4yeP1YFI_aT3lkkE7jhOswk9QOY.jpg?auto=webp&s=426cbd17d103a6fe4c06c8ad8bfc244095434342"
                },
                {
                    "id": 202604,
                    "name": "Assassin’s Creed Codename Hexe",
                    "developer": "Ubisoft",
                    "release_date": "Final de 2026 (Halloween)",
                    "platforms": ["PS5", "Xbox Series X/S", "PC"],
                    "description": "Ambientado na Europa do séc. XVII durante a caça às bruxas. Foco em ocultismo, atmosfera sombria e investigação.",
                    "image": "https://gaming-cdn.com/images/products/12830/orig/assassin-s-creed-codename-hexe-pc-jogo-cover.jpg?v=1746198035"
                },
                {
                    "id": 202605,
                    "name": "Nioh 3",
                    "developer": "Team Ninja",
                    "release_date": "6 de fevereiro de 2026",
                    "platforms": ["PS5", "PC"],
                    "description": "Ambientado no Período Bakumatsu (Séc. XIX). Mistura espadas e armas de fogo contra yokais e o Shinsengumi.",
                    "image": "https://upload.wikimedia.org/wikipedia/en/d/db/Nioh_3_cover_art_2026.jpg"
                },
                {
                    "id": 202606,
                    "name": "Ace Combat 8: Wings of Theve",
                    "developer": "Bandai Namco",
                    "release_date": "2026",
                    "platforms": ["PS5", "Xbox Series X/S", "PC"],
                    "description": "Retorno triunfal ao universo de Strangereal com foco em narrativa cinematográfica e dogfights realistas na nova geração.",
                    "image": "https://image.api.playstation.com/vulcan/ap/rnd/202511/1823/5929543b280b7ff4707431f09bd5e9e5a4396a1dde269986.png"
                },
                {
                    "id": 202607,
                    "name": "Control: Resonant",
                    "developer": "Remedy Entertainment",
                    "release_date": "2026",
                    "platforms": ["PS5", "Xbox Series X/S", "PC"],
                    "description": "Dylan Faden protagoniza esta sequência nas ruas de Manhattan, enfrentando o Plano Astral fora do Bureau.",
                    "image": "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/3669870/04a0fb15e3e8144d78ab3cce4b973097bd73d0ef/capsule_616x353.jpg?t=1765809598"
                },
                {
                    "id": 202608,
                    "name": "Dragon Quest VII: Reimagined",
                    "developer": "Square Enix",
                    "release_date": "5 de fevereiro de 2026",
                    "platforms": ["PS5", "Xbox", "Switch/Switch 2", "PC"],
                    "description": "Releitura moderna com estilo diorama e novo sistema 'Moonlighting' para subclasses. Uma aventura colossal.",
                    "image": "https://image.api.playstation.com/vulcan/ap/rnd/202508/1808/98bf7139a8eb6b67e473c54ec0fcad8819f1b953881574cf.png"
                }
            ]
        },
        {
            "category": "Novos AAA e Inéditos",
            "games": [
                {
                    "id": 202609,
                    "name": "Pragmata",
                    "developer": "Capcom",
                    "release_date": "24 de abril de 2026",
                    "platforms": ["PS5", "Xbox", "PC", "Switch 2"],
                    "description": "Aventura sci-fi distópica na Lua. Um 'third-person sci-fi puzzle shooter' com atmosfera surreal.",
                    "image": "https://i.ytimg.com/vi_webp/PdDVyBtYrUI/maxresdefault.webp"
                },
                {
                    "id": 202610,
                    "name": "Marvel’s Wolverine",
                    "developer": "Insomniac Games",
                    "release_date": "Outubro-Dezembro 2026",
                    "platforms": ["PS5"],
                    "description": "Jogo solo de Logan com tom maduro e violento. Narrativa standalone possivelmente interligada ao universo Spider-Man.",
                    "image": "https://cdn.marvel.com/content/2x/marvelswolverine_lob_crd_02.jpg"
                },
                {
                    "id": 202611,
                    "name": "Marvel Tokon: Fighting Souls",
                    "developer": "Arc System Works",
                    "release_date": "2º Semestre 2026",
                    "platforms": ["PS5", "PC"],
                    "description": "Jogo de luta 2D estilo 'kung-fu punk' unindo heróis da Marvel com a expertise da criadora de Guilty Gear.",
                    "image": "https://image.api.playstation.com/vulcan/ap/rnd/202506/0507/3afe291dd4c976b3a2cd6f4618ada26f5f884a4f3f1aaab1.png"
                },
                {
                    "id": 202612,
                    "name": "Phantom Blade Zero",
                    "developer": "S-Game",
                    "release_date": "9 de setembro de 2026",
                    "platforms": ["PS5", "PC"],
                    "description": "Action RPG 'Kung-fu Punk'. Combates rápidos e cinematográficos em uma China imperial steampunk.",
                    "image": "https://www.adrenaline.com.br/wp-content/uploads/2024/08/Phantom-Blade-Zero-1.jpg"
                },
                {
                    "id": 202613,
                    "name": "Saros",
                    "developer": "Housemarque",
                    "release_date": "30 de abril de 2026",
                    "platforms": ["PS5"],
                    "description": "Shooter arcade sci-fi frenético com múltiplos protagonistas e foco em cooperação contra hordas alienígenas.",
                    "image": "https://sm.ign.com/ign_me/cover/s/saros/saros_8vmm.jpg"
                },
                {
                    "id": 202614,
                    "name": "007: First Light",
                    "developer": "IO Interactive",
                    "release_date": "Final de 2026",
                    "platforms": ["PS5", "Xbox Series X/S", "PC"],
                    "description": "História de origem de James Bond. Mistura stealth estratégico e ação cinematográfica em escala global.",
                    "image": "https://image.api.playstation.com/vulcan/ap/rnd/202506/0421/8b3de34eb203ae7a81a96153455e6cf0cab0ac7e4930df3c.png"
                },
                {
                    "id": 202615,
                    "name": "Diablo IV: Senhor do Ódio",
                    "developer": "Blizzard",
                    "release_date": "2026",
                    "platforms": ["PS5", "Xbox", "PC"],
                    "description": "Expansão focada em Mephisto. Nova região, inimigos e mudanças estruturais no endgame.",
                    "image": "https://static0.gamerantimages.com/wordpress/wp-content/uploads/2025/12/diablo-4-lord-of-hatred-cover-art.jpg"
                },
                {
                    "id": 202616,
                    "name": "Duskbloods",
                    "developer": "FromSoftware",
                    "release_date": "2026",
                    "platforms": ["Switch 2"],
                    "description": "RPG de ação sombrio focado em vampirismo e magia de sangue em um mundo gótico.",
                    "image": "https://preview.redd.it/the-duskbloods-is-making-me-feel-like-who-didnt-have-a-v0-3lzv69pbx9df1.jpeg?width=640&crop=smart&auto=webp&s=8a940eb44d33e7177c8d67711ac0a95518e5aad7"
                },
                {
                    "id": 202617,
                    "name": "Pokémon Pokopia",
                    "developer": "Game Freak",
                    "release_date": "2026",
                    "platforms": ["Switch 2"],
                    "description": "Evolução do mundo aberto de Pokémon em uma região inédita com ecossistemas dinâmicos.",
                    "image": "https://sm.ign.com/ign_br/cover/p/pokemon-po/pokemon-pokopia_qj5p.jpg"
                },
                {
                    "id": 202618,
                    "name": "Assetto Corsa EVO",
                    "developer": "Kunos Simulazioni",
                    "release_date": "2026",
                    "platforms": ["PC", "PS5", "Xbox"],
                    "description": "Simulação pura com motor gráfico renovado, clima dinâmico e física realista.",
                    "image": "https://pbs.twimg.com/media/GMruJXtWkAEXgWn.jpg"
                },
                {
                    "id": 202619,
                    "name": "Forza Horizon 6",
                    "developer": "Playground Games",
                    "release_date": "2026",
                    "platforms": ["Xbox", "PC"],
                    "description": "Corrida em mundo aberto com novo cenário (rumores fora da Europa/EUA) e eventos narrativos.",
                    "image": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2483190/fc75b5f645be08ba8964d34d4ed1980b54c2c933/ss_fc75b5f645be08ba8964d34d4ed1980b54c2c933.1920x1080.jpg?t=1759247866"
                },
                {
                    "id": 202620,
                    "name": "Halo: Campanha Evoluída",
                    "developer": "343 Industries",
                    "release_date": "2026",
                    "platforms": ["Xbox", "PC"],
                    "description": "Nova experiência single-player, evolução de Halo Infinite com narrativa guiada.",
                    "image": "https://xboxwire.thesourcemediaassets.com/sites/8/2025/10/HaloCE_Wallpaper_Desktop-4K_3840x2160_RGB-92f0ca1dd025e4c9aded.jpg"
                },
                {
                    "id": 202621,
                    "name": "Tomb Raider Legacy of Atlantis",
                    "developer": "Crystal Dynamics",
                    "release_date": "2026",
                    "platforms": ["PS5", "Xbox", "PC"],
                    "description": "Reimaginação do original com tecnologia atual, narrativa expandida e Lara clássica.",
                    "image": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRtliXWRTVaxS_OfaXmx2fvZ8IAV9N9sjtuiQ&s"
                },
                {
                    "id": 202622,
                    "name": "Marvel 1943: A Ascensão da Hydra",
                    "developer": "Skydance New Media",
                    "release_date": "2026",
                    "platforms": ["PS5", "Xbox", "PC"],
                    "description": "Ação narrativa na 2ª Guerra com Capitão América e Pantera Negra (Azzuri).",
                    "image": "https://upload.wikimedia.org/wikipedia/pt/7/73/Marvel_1943_Rise_of_Hydra.jpeg"
                }
            ]
        },
        
    ]

# ==============================================================================
#  ROTAS DE DISCUSSÕES (COMUNIDADE)
# ==============================================================================

@app.get("/api/discussions/top")
def get_top_discussions(db: Session = Depends(get_db)):
    # Busca discussões e calcula o "score" (soma dos votos)
    # Ordena por score descendente e data
    discussions = db.query(Discussion).all()
    
    results = []
    for d in discussions:
        # Calcula Score
        score = db.query(func.sum(DiscussionVote.vote_type)).filter(DiscussionVote.discussion_id == d.id).scalar() or 0
        
        # Contagem de Comentários
        comment_count = db.query(DiscussionComment).filter(DiscussionComment.discussion_id == d.id).count()
        
        author = db.query(User).filter(User.id == d.user_id).first()
        
        results.append({
            "id": d.id,
            "title": d.title,
            "content": d.content,
            "game_id": d.game_id,
            "game_name": d.game_name,
            "created_at": d.created_at,
            "score": score,
            "comment_count": comment_count,
            "author": {
                "id": author.id,
                "nickname": author.nickname or author.username,
                "avatar_url": author.avatar_url,
                "username": author.username
            } if author else {"nickname": "Desconhecido", "avatar_url": ""}
        })
    
    # Ordenação manual python (Score > Data)
    results.sort(key=lambda x: (x['score'], x['created_at']), reverse=True)
    return results[:20]

@app.post("/api/discussions")
def create_discussion(data: DiscussionInput, db: Session = Depends(get_db)):
    try:
        new_disc = Discussion(
            title=data.title,
            content=data.content,
            game_id=data.game_id,
            game_name=data.game_name,
            user_id=data.user_id
        )
        db.add(new_disc)
        
        # XP para o criador
        user = db.query(User).filter(User.id == data.user_id).first()
        if user: user.xp += 20
        
        db.commit()
        return {"message": "Discussão criada!"}
    except Exception as e:
        db.rollback()
        return {"error": str(e)}

@app.post("/api/discussions/vote")
def vote_discussion(data: VoteInput, db: Session = Depends(get_db)):
    # Verifica se já votou
    existing = db.query(DiscussionVote).filter(
        DiscussionVote.discussion_id == data.discussion_id, 
        DiscussionVote.user_id == data.user_id
    ).first()
    
    if existing:
        # Se clicar no mesmo, remove (toggle). Se clicar no outro, troca.
        if existing.vote_type == data.vote_type:
            db.delete(existing)
            db.commit()
            return {"status": "removed"}
        else:
            existing.vote_type = data.vote_type
            db.commit()
            return {"status": "updated"}
    else:
        new_vote = DiscussionVote(discussion_id=data.discussion_id, user_id=data.user_id, vote_type=data.vote_type)
        db.add(new_vote)
        db.commit()
        return {"status": "created"}

@app.get("/api/discussions/{discussion_id}/comments")
def get_discussion_comments(discussion_id: int, db: Session = Depends(get_db)):
    comments = db.query(DiscussionComment).filter(DiscussionComment.discussion_id == discussion_id).order_by(DiscussionComment.created_at.asc()).all()
    results = []
    for c in comments:
        author = db.query(User).filter(User.id == c.user_id).first()
        results.append({
            "id": c.id,
            "content": c.content,
            "created_at": c.created_at,
            "author": {
                "nickname": author.nickname or author.username,
                "avatar_url": author.avatar_url,
                "username": author.username
            } if author else {"nickname": "Anon", "avatar_url": ""}
        })
    return results

@app.post("/api/discussions/comment")
def post_discussion_comment(data: DiscussionCommentInput, db: Session = Depends(get_db)):
    try:
        new_comment = DiscussionComment(
            discussion_id=data.discussion_id,
            user_id=data.user_id,
            content=data.content
        )
        db.add(new_comment)
        db.commit()
        return {"message": "Comentado!"}
    except Exception as e:
        db.rollback()
        return {"error": str(e)}
    
if __name__ == "__main__":
    import uvicorn
    # Apenas para teste local direto, se necessário
    uvicorn.run(app, host="0.0.0.0", port=8000)