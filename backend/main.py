from fastapi import FastAPI, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
import json

from resume_parser.parser import parse_resume_with_gpt, pdf_to_text
from job_search.aggregator import job_search_pipeline
from personality_fit.job_fit_analysis import calculate_fit_scores

app = FastAPI(title="CareerPilot API", version="1.0")

# Allow connections from your Base44 frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Replace with your Base44 domain for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "CareerPilot backend running successfully!"}

# ----------- RESUME PARSER -----------
@app.post("/parse_resume")
async def parse_resume(file: UploadFile):
    pdf_bytes = await file.read()
    text = pdf_to_text(pdf_bytes)
    parsed_data = parse_resume_with_gpt(text)
    return parsed_data

# ----------- JOB SEARCH -----------
@app.get("/get_jobs")
def get_jobs(keyword: str, location: str, job_type: str = "", country: str = "us", date_posted: str = "all"):
    jobs = job_search_pipeline(keyword, location, job_type, country, date_posted)
    return {"results": jobs}

# ----------- PERSONALITY FIT -----------
@app.post("/fit_score")
async def fit_score(candidate_json: str = Form(...), job_description: str = Form(...)):
    candidate_data = json.loads(candidate_json)
    scores = calculate_fit_scores(candidate_data, job_description)
    return scores
