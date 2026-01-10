import os
from urllib.parse import quote_plus
from dotenv import load_dotenv

load_dotenv()

# MongoDB Configuration
MONGO_USER = os.getenv("MONGO_USER")
MONGO_PASS = os.getenv("MONGO_PASS")
MONGO_CLUSTER = os.getenv("MONGO_CLUSTER")
MONGO_URI = f"mongodb+srv://{quote_plus(MONGO_USER)}:{quote_plus(MONGO_PASS)}@{MONGO_CLUSTER}/resume_parser?retryWrites=true&w=majority"

# JWT Configuration
SECRET_KEY = os.getenv("SECRET_KEY") or "defaultsecret"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 8

# Groq API Configuration
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
# OPENAI_URL = "https://openrouter.ai/api/v1"

GROQ_PARSING_MODEL = "llama-3.1-8b-instant"
GROQ_INSIGHTS_MODEL = "llama-3.3-70b-versatile"
GROQ_CHATBOT_MODEL = "mixtral-8x7b-32768"

# CORS Configuration
CORS_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173"]