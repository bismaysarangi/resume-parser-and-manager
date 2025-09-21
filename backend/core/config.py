import os
from urllib.parse import quote_plus
from dotenv import load_dotenv

load_dotenv()

MONGO_USER = os.getenv("MONGO_USER")
MONGO_PASS = os.getenv("MONGO_PASS")
MONGO_CLUSTER = os.getenv("MONGO_CLUSTER")
SECRET_KEY = os.getenv("SECRET_KEY") or "defaultsecret"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# MongoDB connection
user = quote_plus(MONGO_USER)
password = quote_plus(MONGO_PASS)
MONGO_URI = f"mongodb+srv://{user}:{password}@{MONGO_CLUSTER}/resume_parser?retryWrites=true&w=majority"

CORS_ORIGINS = ["http://localhost:5173/*", "http://127.0.0.1:5173"]