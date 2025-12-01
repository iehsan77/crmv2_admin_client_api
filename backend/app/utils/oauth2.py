from jose import JWTError, jwt
from datetime import datetime, timedelta
from fastapi import Depends, status, HTTPException
from fastapi.security import OAuth2PasswordBearer
# from .config import settings
from app.networks.database import db 
from app.schemas import schemas
oauth2_scheme = OAuth2PasswordBearer(tokenUrl='login')

SECRET_KEY = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e73JOE-com"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 40000


def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm = ALGORITHM)
    
    return encoded_jwt


def create_businessify_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm = ALGORITHM)
    
    return encoded_jwt


def verify_access_token(token: str, credentials_exception):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms = [ALGORITHM])
        id:int = payload.get('id')
        
        if id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="token has been expired")
            # raise credentials_exception
        token_data = schemas.TokenData(id=id)
    
    except JWTError:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid Token received")
            #raise  credentials_exception
    
    return token_data

def get_current_user(token: str = Depends(oauth2_scheme)):

    credentials_exception = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                                detail=f"Could not validate credentials", headers={"WWW-Authenticate": "Bearer"})

    token = verify_access_token(token, credentials_exception)

    user = db.system_users.find_one({"id": int(token.id)},{"_id":0})
    
    if user:
        return user['id']     
    else:
        user = db.users.find_one({"id": int(token.id)},{"_id":0})
        # print(user)
        return user['id'] 
    

    # return user['id'] 


def get_user_by_token(token: str = Depends(oauth2_scheme)):

    credentials_exception = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                                detail=f"Could not validate credentials", headers={"WWW-Authenticate": "Bearer"})

    token = verify_access_token(token, credentials_exception)

    user = db.users.find_one({"id": int(token.id)},{"_id":0})
    
    if user:
        return user     
    else:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    

    # return user['id'] 



# Users verification

def verify_user_access_token(token: str, credentials_exception):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms = [ALGORITHM])
        id:int = payload.get('id')
        
        if id is None:
            raise credentials_exception
        token_data = schemas.TokenData(id=id)
    except JWTError:
            raise  credentials_exception
    
    return token_data

def get_user(token: str = Depends(oauth2_scheme)):
    
    credentials_exception = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                                          detail=f"Could not validate credentials", headers={"WWW-Authenticate": "Bearer"})

    token = verify_access_token(token, credentials_exception)

    user = db.system_users.find_one({"id": int(token.id)})

    return user['id']



def verify_businessify_token(token: str, credentials_exception):
    try:
        # Decode the token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        # Extract the 'id' from the payload
        user_id: int = payload.get('id')
        role: int = payload.get('role')
        tenant_id: int = payload.get('tenant_id')
        if user_id is None and role is None and tenant_id is None:
            # Raise credentials exception if 'id' is missing
            raise credentials_exception
        
        # Create and return token data
        return payload
    
    except JWTError as e:
        # Handle JWT-related errors (e.g., invalid or expired token)
        raise HTTPException(status_code=403, detail="Invalid or expired token") from e
    
    except Exception as e:
        # Handle any other unexpected errors
        raise HTTPException(status_code=500, detail="An unexpected error occurred") from e


def get_businessify_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, 
                                detail=f"Could not validate credentials", headers={"WWW-Authenticate": "Bearer"})
    token = verify_businessify_token(token, credentials_exception)
    return token