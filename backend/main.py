import os
import shutil
import uuid
import random
from typing import List
from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import timedelta

import database as db_mod
import auth
import schemas
import comfy_client

app = FastAPI(title="Flux App")

# Create necessary directories
OUTPUT_DIR = "static/outputs"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# CORS configuration
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "*", # Allow all origins for production deployment
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static files for generated images
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.on_event("startup")
def startup_event():
    db_mod.init_db()

# --- Auth Endpoints ---

@app.post("/register", response_model=schemas.User)
def register_user(user: schemas.UserCreate, db: Session = Depends(db_mod.get_db)):
    db_user = db.query(db_mod.User).filter(db_mod.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    hashed_password = auth.get_password_hash(user.password)
    new_user = db_mod.User(
        username=user.username, 
        hashed_password=hashed_password,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/token", response_model=schemas.Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(db_mod.get_db)):
    user = db.query(db_mod.User).filter(db_mod.User.username == form_data.username).first()
    
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

# --- Chat & Image Gen Endpoints ---

@app.get("/chats", response_model=List[schemas.ChatRoom])
def get_user_chats(current_user: db_mod.User = Depends(auth.get_current_user), db: Session = Depends(db_mod.get_db)):
    return db.query(db_mod.ChatRoom).filter(db_mod.ChatRoom.user_id == current_user.id).all()

@app.post("/chats", response_model=schemas.ChatRoom)
def create_chat(chat: schemas.ChatRoomCreate, current_user: db_mod.User = Depends(auth.get_current_user), db: Session = Depends(db_mod.get_db)):
    db_chat = db_mod.ChatRoom(title=chat.title, user_id=current_user.id)
    db.add(db_chat)
    db.commit()
    db.refresh(db_chat)
    return db_chat

@app.get("/chats/{chat_id}", response_model=schemas.ChatRoom)
def get_chat(chat_id: int, current_user: db_mod.User = Depends(auth.get_current_user), db: Session = Depends(db_mod.get_db)):
    chat = db.query(db_mod.ChatRoom).filter(db_mod.ChatRoom.id == chat_id, db_mod.ChatRoom.user_id == current_user.id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    return chat

@app.delete("/chats/{chat_id}")
def delete_chat(chat_id: int, current_user: db_mod.User = Depends(auth.get_current_user), db: Session = Depends(db_mod.get_db)):
    chat = db.query(db_mod.ChatRoom).filter(db_mod.ChatRoom.id == chat_id, db_mod.ChatRoom.user_id == current_user.id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    # 1. Get all messages in this chat
    messages = db.query(db_mod.ChatMessage).filter(db_mod.ChatMessage.chat_id == chat_id).all()
    
    # 2. For each message with an image, delete the image file and ImageMetadata
    for msg in messages:
        if msg.image_url:
            # Delete physical file
            filename = msg.image_url.split("/")[-1]
            filepath = os.path.join(OUTPUT_DIR, filename)
            if os.path.exists(filepath):
                try:
                    os.remove(filepath)
                except Exception as e:
                    print(f"Failed to delete file {filepath}: {e}")
            
            # Delete from ImageMetadata gallery
            db.query(db_mod.ImageMetadata).filter(db_mod.ImageMetadata.url == msg.image_url).delete()
            
        # Delete message
        db.delete(msg)
        
    # 3. Delete the chat itself
    db.delete(chat)
    db.commit()
    return {"status": "success"}

@app.post("/chats/{chat_id}/messages", response_model=schemas.ChatMessage)
async def send_message(chat_id: int, message: schemas.MessageCreate, current_user: db_mod.User = Depends(auth.get_current_user), db: Session = Depends(db_mod.get_db)):
    # 1. Save user message
    user_msg = db_mod.ChatMessage(chat_id=chat_id, role="user", content=message.content)
    db.add(user_msg)
    db.commit()

    # 2. Trigger Image Generation via Hugging Face API
    try:
        filename = await comfy_client.generate_image(message.content)
        
        # 3. Handle generated image
        local_path = os.path.join(OUTPUT_DIR, filename)
        image_url = f"/static/outputs/{filename}"
            
        # 4. Save assistant message with image
        assistant_msg = db_mod.ChatMessage(
            chat_id=chat_id, 
            role="assistant", 
            content="Generated your image:", 
            image_url=image_url
        )
        db.add(assistant_msg)
        
        # 5. Save to global image gallery
        if image_url:
            img_metadata = db_mod.ImageMetadata(
                user_id=current_user.id,
                prompt=message.content,
                file_path=local_path,
                url=image_url
            )
            db.add(img_metadata)
            
        db.commit()
        db.refresh(assistant_msg)
        return assistant_msg
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Image generation failed: {str(e)}")

@app.get("/gallery", response_model=List[schemas.ImageMetadata])
def get_gallery(db: Session = Depends(db_mod.get_db)):
    return db.query(db_mod.ImageMetadata).order_by(db_mod.ImageMetadata.created_at.desc()).all()
