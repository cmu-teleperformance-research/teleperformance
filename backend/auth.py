import os
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from database import get_db
import models

SECRET_KEY = os.getenv("SECRET_KEY", "changeme-use-a-real-secret-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")

RESEARCHER_USERNAMES = {
    "dishakew",
    "yichiaw",
    "shiyu",
    "simret",
    "joyceBWang",
    "robertekraut1",
    "hz",
}


def get_role(username: str) -> str:
    return "researcher" if username in RESEARCHER_USERNAMES else "participant"


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8")[:72], bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8")[:72], hashed.encode("utf-8"))


def create_access_token(user_id: int, username: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    role = get_role(username)
    return jwt.encode({"sub": str(user_id), "username": username, "role": role, "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> models.User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload.get("sub"))
    except (JWTError, TypeError, ValueError) as e:
        # TEMPORARY DEBUG LOGGING — remove once /start 401 is diagnosed
        print(f"[DEBUG get_current_user] jwt.decode failed: {type(e).__name__}: {e}")
        raise credentials_exception

    # TEMPORARY DEBUG LOGGING — remove once /start 401 is diagnosed
    print(f"[DEBUG get_current_user] decoded sub={payload.get('sub')!r} -> user_id={user_id}")

    user = db.query(models.User).filter(models.User.id == user_id).first()
    # TEMPORARY DEBUG LOGGING — remove once /start 401 is diagnosed
    print(f"[DEBUG get_current_user] lookup for id={user_id} found={('yes: ' + user.username) if user else 'NO MATCHING ROW'}")
    if user is None:
        raise credentials_exception
    return user


def require_researcher(current_user: models.User = Depends(get_current_user)) -> models.User:
    if get_role(current_user.username) != "researcher":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Researcher access required")
    return current_user
