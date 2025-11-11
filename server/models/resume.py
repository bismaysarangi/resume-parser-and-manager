from sqlalchemy import Column, Integer, String, JSON
from core.database import Base

class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    name = Column(String)
    email = Column(String)
    phone = Column(String)
    education = Column(JSON)
    skills = Column(JSON)
    experience = Column(JSON)
    projects = Column(JSON)
    tenth_marks = Column(String)
    twelfth_marks = Column(String)
