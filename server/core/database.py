from pymongo import MongoClient
from .config import MONGO_URI

client = MongoClient(MONGO_URI)
db = client["resume_parser"]
users_collection = db["users"]

print("MongoDB connected successfully")