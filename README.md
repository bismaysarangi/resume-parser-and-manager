# 📄 Resume Parser and Manager

A full-stack web application for intelligent resume parsing, AI-powered career insights, and candidate management. Built with **React** (Frontend), **FastAPI** (Backend), and **MongoDB** (Database), powered by **Groq AI** for advanced resume analysis.

---

## ✨ Features

### 👤 For Candidates
- **Resume Upload & Parsing**: Upload PDF, DOCX, or TXT resumes for automatic data extraction
- **AI-Powered Insights**: Get personalized career recommendations, strengths analysis, skill gap identification, and interview tips
- **Resume History**: View and manage all previously uploaded resumes
- **Profile Management**: Update personal information and credentials

### 🏢 For Recruiters
- **Bulk Resume Upload**: Upload multiple resumes at once (up to 50 files)
- **Candidate Database**: Access and manage parsed candidate resumes
- **Smart Duplicate Detection**: Automatically identifies duplicate resumes based on email/name/phone
- **Candidate Search**: Find and review candidates efficiently

### 🤖 AI Capabilities
- Structured resume data extraction (name, email, phone, education, skills, experience, projects)
- Derived skill extraction from experience and projects
- Career path suggestions based on resume analysis
- Personalized strength and improvement recommendations
- Role-specific skill gap analysis
- Interview preparation tips

---

## 🛠️ Tech Stack

### Frontend
- **React 18** with Vite
- **React Router** for navigation
- **shadcn/ui** components with Tailwind CSS
- **Lucide React** for icons

### Backend
- **FastAPI** (Python web framework)
- **MongoDB** with PyMongo
- **Groq AI API** for LLM-powered parsing and insights
- **JWT Authentication** with role-based access control
- **PDFPlumber** for PDF parsing
- **python-docx** for DOCX parsing

### Database
- **MongoDB Atlas** (cloud database)

---

## 📁 Project Structure

```
bismaysarangi-resume-parser-and-manager/
├── README.md
├── client/                          # Frontend React Application
│   ├── src/
│   │   ├── App.jsx                 # Main app component with routing
│   │   ├── main.jsx                # React entry point
│   │   ├── index.css               # Global styles
│   │   ├── components/
│   │   │   ├── Navbar.jsx          # Navigation bar
│   │   │   ├── Footer.jsx          # Footer component
│   │   │   └── ui/                 # shadcn/ui components
│   │   ├── hooks/
│   │   │   └── useAuth.jsx         # Authentication hook
│   │   ├── pages/
│   │   │   ├── Home.jsx            # Landing page
│   │   │   ├── Login.jsx           # Login page
│   │   │   ├── Signup.jsx          # Registration page
│   │   │   ├── candidate/          # Candidate-specific pages
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   ├── Upload.jsx
│   │   │   │   ├── ParsedResults.jsx
│   │   │   │   ├── AiInsights.jsx
│   │   │   │   ├── History.jsx
│   │   │   │   └── Profile.jsx
│   │   │   └── recruiter/          # Recruiter-specific pages
│   │   │       ├── RecruiterBulkUpload.jsx
│   │   │       ├── RecruiterBulkResults.jsx
│   │   │       ├── RecruiterCandidates.jsx
│   │   │       └── RecruiterProfile.jsx
│   │   └── lib/
│   │       └── utils.js            # Utility functions
│   ├── package.json
│   └── vite.config.js
│
└── server/                          # Backend FastAPI Application
    ├── main.py                     # FastAPI app entry point
    ├── requirements.txt            # Python dependencies
    ├── .env.example                # Environment variables template
    ├── core/
    │   ├── config.py               # App configuration
    │   ├── database.py             # MongoDB connection
    │   └── security.py             # Password hashing & JWT
    ├── dependencies/
    │   ├── auth.py                 # Authentication dependencies
    │   └── role_based_auth.py      # Role-based access control
    ├── models/
    │   ├── user.py                 # User data models
    │   └── resume.py               # Resume data models
    ├── routes/
    │   ├── auth.py                 # Authentication endpoints
    │   ├── user.py                 # User profile endpoints
    │   ├── candidate/
    │   │   ├── resume.py           # Resume parsing endpoints
    │   │   └── history.py          # Resume history endpoints
    │   └── recruiter/
    │       ├── bulk_upload.py      # Bulk resume upload
    │       └── candidates.py       # Candidate management
    ├── schemas/
    │   ├── token.py                # JWT token schemas
    │   └── user.py                 # User schemas
    └── services/
        ├── resume_parser.py        # Resume parsing logic
        ├── ai_insights.py          # AI insights generation
        └── folder_parser.py        # Batch processing logic
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18+)
- **Python** (v3.10+)
- **MongoDB Atlas** account (or local MongoDB)
- **Groq API Key** ([Get it here](https://console.groq.com))

---

## 📦 Installation

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/bismaysarangi/resume-parser-and-manager.git
cd resume-parser-and-manager
```

---

### 2️⃣ Backend Setup

#### Navigate to server directory
```bash
cd server
```

#### Create virtual environment (recommended)
```bash
# On Windows
python -m venv venv
venv\Scripts\activate

# On macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

#### Install dependencies
```bash
pip install -r requirements.txt
```

#### Configure environment variables
Create a `.env` file in the `server/` directory:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# MongoDB Configuration
MONGO_USER=your_mongodb_username
MONGO_PASS=your_mongodb_password
MONGO_CLUSTER=cluster0.xxxxx.mongodb.net

# JWT Secret (generate a random string)
SECRET_KEY=your_very_secure_random_secret_key_here

# Groq API Key
GROQ_API_KEY=your_groq_api_key_here
```

**How to get MongoDB credentials:**
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Go to Database Access → Add Database User
4. Go to Network Access → Add IP Address (allow 0.0.0.0/0 for testing)
5. Go to Database → Connect → Connect your application
6. Copy the connection string details

**Generate SECRET_KEY:**
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

#### Run the backend server
```bash
# Development mode
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Production mode
uvicorn main:app --host 0.0.0.0 --port 8000
```

Backend will be available at: **http://localhost:8000**

API Documentation: **http://localhost:8000/docs**

---

### 3️⃣ Frontend Setup

#### Open a new terminal and navigate to client directory
```bash
cd client
```

#### Install dependencies
```bash
npm install
```

#### Run the development server
```bash
npm run dev
```

Frontend will be available at: **http://localhost:5173**

---

## 📖 API Documentation

### Authentication Endpoints

#### POST `/api/v1/auth/signup`
Register a new user (candidate or recruiter)

**Request Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "full_name": "John Doe",
  "password": "securepassword123",
  "role": "candidate",
  "company_name": "Acme Corp" // Required only for recruiters
}
```

**Response:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "full_name": "John Doe",
  "role": "candidate",
  "disabled": false
}
```

---

#### POST `/api/v1/auth/login`
Login and get JWT token

**Request Body (form-data):**
```
username: john@example.com
password: securepassword123
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "role": "candidate",
  "username": "john_doe"
}
```

---

#### GET `/api/v1/auth/me`
Get current user details

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "full_name": "John Doe",
  "role": "candidate",
  "disabled": false
}
```

---

### Candidate Endpoints

#### POST `/api/candidate/parse-resume`
Parse an uploaded resume (PDF/DOCX/TXT)

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Request Body:**
```
file: <resume_file>
```

**Response:**
```json
{
  "message": "Resume parsed successfully",
  "filename": "john_doe_resume.pdf",
  "data": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "education": [...],
    "skills": ["Python", "JavaScript", "React"],
    "derived_skills": ["FastAPI", "MongoDB", "Docker"],
    "experience": [...],
    "projects": [...]
  }
}
```

---

#### POST `/api/candidate/ai-insights`
Generate AI-powered career insights

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "resume_data": {
    "name": "John Doe",
    "skills": ["Python", "React"],
    "experience": [...],
    ...
  }
}
```

**Response:**
```json
{
  "insights": {
    "strengths": ["Strong technical skills", "..."],
    "improvements": ["Add certifications", "..."],
    "skillGaps": {
      "Frontend Developer": ["TypeScript", "..."],
      "Backend Developer": ["Microservices", "..."]
    },
    "careerSuggestions": ["Full Stack Developer", "..."],
    "interviewTips": ["Prepare system design", "..."],
    "overallScore": 78,
    "summary": "Solid technical profile..."
  }
}
```

---

#### GET `/api/candidate/resume-history`
Get all resume parsing history for current user

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "user_email": "john@example.com",
    "filename": "resume_v1.pdf",
    "parsed_data": {...},
    "parsed_at": "2024-01-15T10:30:00"
  }
]
```

---

### Recruiter Endpoints

#### POST `/api/recruiter/bulk-parse-resume`
Upload and parse multiple resumes (max 50)

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Request Body:**
```
files: <resume_file_1>
files: <resume_file_2>
...
```

**Response:**
```json
{
  "successful": [
    {
      "filename": "candidate1.pdf",
      "resume_id": "507f1f77bcf86cd799439011",
      "data": {...}
    }
  ],
  "failed": [
    {
      "filename": "invalid.txt",
      "error": "Failed to parse"
    }
  ],
  "duplicates": [
    {
      "filename": "duplicate.pdf",
      "reason": "Same email as existing resume"
    }
  ],
  "summary": {
    "total": 10,
    "successful": 8,
    "failed": 1,
    "duplicates": 1
  }
}
```

---

#### GET `/api/recruiter/candidates`
Get all candidates uploaded by this recruiter

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "recruiter_email": "recruiter@company.com",
    "filename": "candidate_resume.pdf",
    "parsed_data": {...},
    "parsed_at": "2024-01-15T10:30:00",
    "upload_type": "bulk"
  }
]
```

---

## 🔐 Authentication & Authorization

### Role-Based Access Control (RBAC)

The application has two user roles:

1. **Candidate** (default)
   - Can upload and parse their own resumes
   - Access AI insights for career guidance
   - View their resume history

2. **Recruiter**
   - Can upload multiple resumes in bulk
   - Access candidate database
   - View and manage candidate profiles
   - Requires `company_name` during registration

### JWT Token Flow

1. User logs in with email/password
2. Backend validates credentials and generates JWT token
3. Token contains user info (email, role) and expiration (30 minutes)
4. Frontend stores token in `localStorage`
5. All API requests include token in `Authorization` header
6. Backend validates token and checks user role for protected routes

---

## 🤖 AI Models Used

### Groq AI API

The application uses Groq's API with two different models:

1. **Resume Parsing**: `llama-3.3-70b-versatile`
   - Structured data extraction
   - High accuracy for parsing resumes

2. **AI Insights**: `openai/gpt-oss-20b`
   - Career recommendations
   - Skill gap analysis
   - Interview preparation tips

### Rate Limiting

- Sequential processing with delays between requests
- Exponential backoff on rate limit errors
- Maximum 3 retry attempts
- Dynamic delay calculation based on request patterns

---

## 📊 Database Schema

### Users Collection

```javascript
{
  _id: ObjectId,
  username: String,
  email: String,
  full_name: String,
  hashed_password: String,
  role: "candidate" | "recruiter",
  company_name: String (optional, for recruiters),
  disabled: Boolean,
  created_at: ISODate
}
```

### Resume History Collection

```javascript
{
  _id: ObjectId,
  user_email: String,              // For candidates
  recruiter_email: String,          // For recruiters
  filename: String,
  parsed_data: {
    name: String,
    email: String,
    phone: String,
    education: Array,
    skills: Array,
    derived_skills: Array,
    experience: Array,
    projects: Array,
    tenth_marks: String,
    twelfth_marks: String
  },
  parsed_at: ISODate,
  upload_type: "single" | "bulk",
  candidate_email: String,
  resume_hash: String               // For duplicate detection
}
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. MongoDB Connection Error
```
Error: MongoServerError: Authentication failed
```
**Solution:**
- Verify MongoDB credentials in `.env`
- Check if IP is whitelisted in MongoDB Atlas
- Ensure cluster URL is correct

---

#### 2. Groq API Rate Limiting
```
Error: Rate limit exceeded
```
**Solution:**
- Wait a few seconds and retry
- The app has built-in retry logic
- Check your Groq API quota

---

#### 3. CORS Error in Browser
```
Access to fetch blocked by CORS policy
```
**Solution:**
- Ensure backend is running on port 8000
- Check `CORS_ORIGINS` in `server/core/config.py`
- Frontend should be on `http://localhost:5173`

---

#### 4. JWT Token Expired
```
401 Unauthorized: Could not validate credentials
```
**Solution:**
- Log out and log in again
- Token expires after 30 minutes
- Clear localStorage: `localStorage.clear()`

---

#### 5. File Upload Fails
```
413 Request Entity Too Large
```
**Solution:**
- Maximum file size is 50MB
- Check file format (PDF, DOCX, TXT only)
- Ensure file is not corrupted

---

## 🧪 Testing

### Test the Backend API

Use the interactive API documentation:
```
http://localhost:8000/docs
```

Or use curl:
```bash
# Test signup
curl -X POST http://localhost:8000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@test.com","password":"test123","role":"candidate"}'

# Test login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -F "username=test@test.com" \
  -F "password=test123"
```

### Test Resume Parsing

```bash
curl -X POST http://localhost:8000/api/candidate/parse-resume \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/resume.pdf"
```

---

## 📝 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgments

- [FastAPI](https://fastapi.tiangolo.com/) - Modern Python web framework
- [React](https://react.dev/) - Frontend library
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful UI components
- [Groq](https://groq.com/) - Lightning-fast AI inference
- [MongoDB](https://www.mongodb.com/) - NoSQL database

---


## 🔮 Future Enhancements

- [ ] Real-time collaboration for recruiters
- [ ] Advanced search and filtering for candidates
- [ ] Resume scoring and ranking system
- [ ] Email notifications for candidate matches
- [ ] Integration with job posting platforms
- [ ] Resume comparison tool
- [ ] Export parsed data to CSV/Excel
- [ ] Multi-language resume support
- [ ] Video resume analysis

---

**Happy Recruiting! 🎉**
