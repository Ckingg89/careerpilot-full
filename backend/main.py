# file: backend/main.py
from fastapi import FastAPI, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json

from resume_parser.parser import parse_resume_with_gpt, pdf_to_text
from job_search.aggregator import job_search_pipeline
from personality_fit.job_fit_analysis import calculate_fit_scores

app = FastAPI(title="CareerPilot API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "CareerPilot backend running successfully!"}

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/parse_resume")
async def parse_resume(file: UploadFile):
    pdf_bytes = await file.read()
    text = pdf_to_text(pdf_bytes)
    parsed_data = parse_resume_with_gpt(text)
    return parsed_data

@app.get("/get_jobs")
def get_jobs(keyword: str, location: str, job_type: str = "", country: str = "us", date_posted: str = "all"):
    jobs = job_search_pipeline(keyword, location, job_type, country, date_posted)
    return {"results": jobs}

class FitRequest(BaseModel):
    candidate: dict
    job_descriptions: list[str]

@app.post("/fit_score")
async def fit_score(request: FitRequest):
    scores = calculate_fit_scores(request.candidate, request.job_descriptions)
    return {"results": scores}

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    print(f"❌ Unexpected error: {exc}")
    return {"error": str(exc)}
