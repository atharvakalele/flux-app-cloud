import os
from datetime import datetime
from dotenv import load_dotenv
from sqlalchemy import create_engine, Column, Integer, String, Text, ForeignKey, DateTime, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
      raise ValueError("DATABASE_URL not set in environment")

# For SQLite, we need check_same_thread: False
if DATABASE_URL.startswith("sqlite"):
      engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
      engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class User(Base):
      __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    chats = relationship("ChatRoom", back_populates="owner")
    images = relationship("ImageMetadata", back_populates="owner")

class ChatRoom(Base):
      __tablename__ = "chat_rooms"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    user_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="chats")
    messages = relationship("ChatMessage", back_populates="chat_room")

class ChatMessage(Base):
      __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    chat_id = Column(Integer, ForeignKey("chat_rooms.id"))
    role = Column(String) # 'user' or 'assistant'
    content = Column(Text)
    image_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    chat_room = relationship("ChatRoom", back_populates="messages")

class ImageMetadata(Base):
      __tablename__ = "images"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    prompt = Column(Text)
    file_path = Column(String)
    url = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="images")

def get_db():
      db = SessionLocal()
      try:
                yield db
finally:
        db.close()

def init_db():
      Base.metadata.create_all(bind=engine)
  
