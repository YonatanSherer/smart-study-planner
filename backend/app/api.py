from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List

from backend.app.core.models import StudySubject
from backend.app.core.scheduler import generate_study_plan

# -------------------------
# APP
# -------------------------
app = FastAPI()

# -------------------------
# CORS (SIMPLE + LEGAL)
# -------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # DEV ONLY
    allow_credentials=False,      # MUST be False with "*"
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------
# MODELS
# -------------------------
class SubjectIn(BaseModel):
    name: str
    hours_needed: float
    difficulty: int
    deadline_days: int

class PlanRequest(BaseModel):
    subjects: List[SubjectIn]
    hours_per_day: float

# -------------------------
# ROUTES
# -------------------------
@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/generate-plan")
def generate_plan(req: PlanRequest):
    subjects = [
        StudySubject(
            name=s.name,
            hours_needed=s.hours_needed,
            difficulty=s.difficulty,
            deadline_days=s.deadline_days,
        )
        for s in req.subjects
    ]
    plan = generate_study_plan(subjects, req.hours_per_day)
    return {"plan": plan}
