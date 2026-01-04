# 📄 Resume Parser and Manager

A full-stack web application for intelligent resume parsing, AI-powered career insights, and smart candidate recruitment. Built with **React** (Frontend), **FastAPI** (Backend), and **MongoDB** (Database), powered by **Groq AI** for advanced resume analysis and intelligent candidate ranking.

---

## ✨ Features

### 👤 For Candidates
- **Resume Upload & Parsing**: Upload PDF, DOCX, or TXT resumes for automatic comprehensive data extraction
- **AI-Powered Career Insights**: Get personalized career recommendations, strengths analysis, skill gap identification, and interview tips
- **Resume History**: View and manage all previously uploaded resumes
- **Profile Management**: Update personal information and credentials
- **Comprehensive Data Extraction**: Extracts achievements, publications, research work, certifications, awards, volunteer experience, languages, and interests

### 🏢 For Recruiters
- **Bulk Resume Upload**: Upload multiple resumes at once (up to 50 files) with intelligent processing
- **AI-Powered Chatbot**: Smart candidate search with intelligent ranking and natural language queries
- **Advanced Candidate Ranking**: Multi-criteria scoring system that analyzes skill proficiency, experience quality, project relevance, education level, and company background
- **Smart Duplicate Detection**: Automatically identifies duplicate resumes based on email/name/phone
- **Candidate Database**: Access and manage parsed candidate resumes with deduplication
- **Natural Language Search**: Ask questions like "Find top 5 Python developers" or "Who has 5+ years experience?"

### 🤖 AI Capabilities
- **Comprehensive Resume Parsing**: Extracts 20+ data fields
- **Intelligent Skill Detection**: Both explicit skills and derived skills from project descriptions
- **Multi-Criteria Candidate Ranking**: Weighted scoring based on query intent
- **Conversational AI Assistant**: Natural language understanding
- **Experience Calculation**: Accurate total years calculation from multiple date formats
- **Career Path Analysis**: AI-powered career suggestions
- **Skill Gap Identification**: Role-specific skill recommendations

---

## 🛠️ Tech Stack

### Frontend
- React 18 with Vite
- React Router v6
- shadcn/ui + Tailwind CSS
- Lucide React icons

### Backend
- FastAPI (Python 3.10+)
- MongoDB with PyMongo
- Groq AI API
- JWT Authentication
- PDFPlumber & python-docx
- httpx for async requests
- Bcrypt password hashing

---

## 📁 Project Structure

```
bismaysarangi-resume-parser-and-manager/
├── README.md
├── client/                     # React Frontend
│   └── src/
│       ├── App.jsx
│       ├── main.jsx
│       ├── index.css
│       ├── components/
│       │   ├── Navbar.jsx
│       │   ├── Footer.jsx
│       │   └── ui/
│       ├── hooks/
│       │   └── useAuth.jsx
│       ├── lib/
│       │   └── utils.js
│       └── pages/
│           ├── Home.jsx
│           ├── Login.jsx
│           ├── Signup.jsx
│           ├── candidate/
│           │   ├── Dashboard.jsx
│           │   ├── Upload.jsx
│           │   ├── ParsedResults.jsx
│           │   ├── AiInsights.jsx
│           │   ├── History.jsx
│           │   └── Profile.jsx
│           └── recruiter/
│               ├── RecruiterBulkUpload.jsx
│               ├── RecruiterBulkResults.jsx
│               ├── RecruiterChatbot.jsx
│               └── RecruiterProfile.jsx
└── server/                     # FastAPI Backend
    ├── main.py
    ├── requirements.txt
    ├── .env.example
    ├── core/
    │   ├── config.py
    │   ├── database.py
    │   └── security.py
    ├── dependencies/
    │   ├── auth.py
    │   └── role_based_auth.py
    ├── models/
    │   ├── user.py
    │   └── resume.py
    ├── routes/
    │   ├── auth.py
    │   ├── user.py
    │   ├── candidate/
    │   │   ├── resume.py
    │   │   └── history.py
    │   └── recruiter/
    │       ├── bulk_upload.py
    │       ├── candidates.py
    │       └── chatbot.py
    ├── schemas/
    │   ├── token.py
    │   └── user.py
    └── services/
        ├── resume_parser.py
        ├── ai_insights.py
        └── folder_parser.py
```

---

## 🚀 Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/bismaysarangi/resume-parser-and-manager.git
cd bismaysarangi-resume-parser-and-manager
```

### 2. Backend Setup
```bash
cd server
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Create .env
cp .env.example .env
# Edit .env: Add MONGO credentials, SECRET_KEY, GROQ_API_KEY

# Run server
uvicorn main:app --reload --port 8000
```

### 3. Frontend Setup
```bash
cd ../client
npm install
npm run dev
```

Visit **http://localhost:5173**

---

## 🎯 Intelligent Ranking System

The AI chatbot ranks candidates using 5 scoring factors:

### 1. Skill Proficiency (0-100)
- Explicit skill listing: 30 pts
- Project usage: up to 40 pts
- Experience usage: up to 30 pts

### 2. Experience Quality (0-75)
- Total years: up to 40 pts
- Company diversity: up to 15 pts
- Senior roles: up to 20 pts

### 3. Project Relevance (0-100)
- Relevant projects with required skills
- Project complexity indicators

### 4. Education Score (0-100)
- PhD: 100, Masters: 70-75, Bachelor's: 50-70

### 5. Company Background (0-100)
- Top tech companies: 25 pts each
- Full-time vs internship roles

### Weighted Final Score
```python
# Skill-focused queries
weights = {'skills': 0.45, 'projects': 0.30, 'experience': 0.15, 'education': 0.05, 'company': 0.05}

# Company-focused queries
weights = {'company': 0.50, 'experience': 0.25, 'skills': 0.15, 'projects': 0.05, 'education': 0.05}

final_score = sum(factor_score * weight for factor, weight in weights.items())
```

Candidates are sorted by final score and presented naturally without exposing numerical scores.

---

## 📖 Key API Endpoints

### Authentication
```
POST /api/v1/auth/signup          # Register user
POST /api/v1/auth/login           # Get JWT token
GET  /api/v1/auth/me              # Get current user
```

### User Profile
```
GET  /api/v1/user/profile         # Get profile
PUT  /api/v1/user/profile/update  # Update profile
```

### Candidate
```
POST   /api/candidate/parse-resume       # Upload & parse resume
POST   /api/candidate/ai-insights        # Generate career insights
GET    /api/candidate/resume-history     # Get parsing history
DELETE /api/candidate/resume-history/{id}# Delete resume
```

### Recruiter
```
POST /api/recruiter/bulk-parse-resume  # Bulk upload (max 50)
GET  /api/recruiter/candidates         # Get all candidates
GET  /api/recruiter/candidates/{id}    # Get candidate details
POST /api/recruiter/chatbot            # AI candidate search
GET  /api/recruiter/chatbot/stats      # Get database stats
```

---

## 🗄️ Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  username: String,
  email: String,
  full_name: String,
  hashed_password: String,
  role: "candidate" | "recruiter",
  company_name: String,
  disabled: Boolean,
  created_at: ISODate
}
```

### Resume History Collection
```javascript
{
  _id: ObjectId,
  user_email: String,         // For candidates
  recruiter_email: String,    // For recruiters
  filename: String,
  upload_type: "single" | "bulk",
  candidate_email: String,
  resume_hash: String,
  parsed_at: ISODate,
  parsed_data: {
    name, email, phone, summary, objective,
    education: [], skills: [], derived_skills: [],
    experience: [], projects: [],
    achievements: [], publications: [], research: [],
    certifications: [], awards: [], volunteer_work: [],
    languages: [], interests: [], references: [],
    tenth_marks, twelfth_marks, extra_sections: {}
  }
}
```

---

### Model Configuration

Located in `server/core/config.py`:

```python
GROQ_PARSING_MODEL = "llama-3.1-8b-instant"
GROQ_INSIGHTS_MODEL = "llama-3.3-70b-versatile"
GROQ_CHATBOT_MODEL = "llama-3.3-70b-versatile"
```

### Rate Limiting & Token Management

**Bulk Upload:**
- Base delay: 3 seconds between requests
- Dynamic delay adjustment based on API load
- Maximum 8 requests per minute
- Exponential backoff on rate limit errors (2s, 4s, 8s, max 30s)
- Automatic retry (up to 3 attempts)
- Token usage tracking and logging

**Single Resume Upload:**
- Standard rate limiting with retry logic
- Token usage displayed in console logs

**Chatbot:**
- Optimized for interactive use
- Smaller context windows for faster responses
- Temperature: 0.8 for natural conversations

---

## 📝 Environment Variables

Create `server/.env`:

```env
MONGO_USER=your_username
MONGO_PASS=your_password
MONGO_CLUSTER=cluster0.xxxxx.mongodb.net
SECRET_KEY=your_secret_key
GROQ_API_KEY=your_groq_api_key
```

Generate SECRET_KEY:
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

---

## 🔐 Role-Based Access

### Candidate
- Upload resumes
- View AI insights
- Manage history
- Update profile

### Recruiter
- Bulk uploads
- Access database
- Use AI chatbot
- View candidates
- Requires company_name

**Auth**: `Authorization: Bearer <jwt_token>`

---

## 🐛 Troubleshooting

### MongoDB Connection Error
- Verify `.env` credentials
- Whitelist IP in Atlas
- Check cluster URL

### Groq Rate Limiting
- Built-in retry handles this
- Check quota at console.groq.com

### CORS Issues
- Backend: port 8000
- Frontend: port 5173
- Check `CORS_ORIGINS` in config.py

### Token Expired
- Expires after 8 hours
- Clear localStorage and re-login

---

## 🧪 Testing

**cURL Examples:**
```bash
# Signup
curl -X POST http://localhost:8000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@test.com","password":"test123","role":"candidate"}'

# Login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -F "username=test@test.com" -F "password=test123"

# Parse Resume
curl -X POST http://localhost:8000/api/candidate/parse-resume \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@resume.pdf"
```

---

## 🙏 Acknowledgments

- [FastAPI](https://fastapi.tiangolo.com/) - Backend framework
- [React](https://react.dev/) - Frontend library
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [Groq](https://groq.com/) - AI inference
- [MongoDB](https://www.mongodb.com/) - Database

---

## 🔮 Future Enhancements

- [ ] Real-time collaboration
- [ ] Advanced filtering
- [ ] Resume scoring dashboard
- [ ] Email notifications
- [ ] Job posting integration
- [ ] Resume comparison tool
- [ ] Export to CSV/Excel
- [ ] Multi-language support
- [ ] Video resume analysis
- [ ] Interview scheduling
- [ ] Custom scoring weights

---
