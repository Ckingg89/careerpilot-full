# file: backend/personality_fit/job_fit_analysis.py
import os
import json
import time
import numpy as np
from dotenv import load_dotenv
from openai import OpenAI

# ========== SETUP ==========
load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# ========== SAFE WRAPPER ==========
def safe_llm_request(**kwargs):
    """Retry OpenAI API requests with exponential backoff."""
    for delay in [1, 2, 4]:
        try:
            return client.chat.completions.create(**kwargs)
        except Exception as e:
            print(f"⚠️ LLM error: {e}. Retrying in {delay}s...")
            time.sleep(delay)
    raise RuntimeError("OpenAI request failed after retries.")

# ========== LOAD CANDIDATE TRAITS ==========
def load_candidate_profile(path="candidate_scores.json"):
    """Safely load local candidate profile or use default fallback."""
    if os.path.exists(path):
        with open(path, "r") as f:
            data = json.load(f)
        if "traits" in data and "environment" in data:
            return data

    # Fallback defaults
    print("⚠️ No candidate profile found — using defaults.")
    return {
        "traits": {"H": 50, "S": 50, "X": 50, "A": 50, "C": 50, "O": 50, "G": 50},
        "environment": {
            "structure": 0.5,
            "sociality": 0.5,
            "stability": 0.5,
            "creativity": 0.5,
            "autonomy": 0.5,
        },
    }

# ========== SCORING CONSTANTS ==========
FIT_W = {"H": 0.15, "S": 0.15, "X": 0.15, "A": 0.10, "C": 0.20, "O": 0.10, "G": 0.15}
ENV_W = {
    "structure": 0.20,
    "sociality": 0.20,
    "stability": 0.20,
    "creativity": 0.20,
    "autonomy": 0.20,
}

# ========== SCORING FUNCTIONS ==========
def fit_score(user_trait, job_trait):
    sims = [
        w * (1 - abs(user_trait[k] - job_trait[k]) / 100)
        for k, w in FIT_W.items()
        if k in user_trait and k in job_trait
    ]
    return 100 * sum(sims) / sum(FIT_W.values())

def satisfaction_score(user_env_vec, job_env_vec):
    sims = [
        w * (1 - abs(user_env_vec[k] - job_env_vec[k]))
        for k, w in ENV_W.items()
        if k in user_env_vec and k in job_env_vec
    ]
    return 100 * sum(sims) / sum(ENV_W.values())

# ========== MAIN CALCULATOR ==========
def calculate_fit_scores(job_descriptions: list[str]) -> list[dict]:
    """
    Takes a list of job description texts and returns personality fit + satisfaction scores.
    """
    candidate = load_candidate_profile()
    user_traits = candidate["traits"]
    user_env = candidate["environment"]

    SYSTEM_PROMPT = """
    You are a psychometric evidence analyst.
    You will complete the Hiring-Manager Job-Requirements Survey item by item for multiple Job Descriptions.
    Every rating must be grounded in explicit textual evidence from the JD. Absence of evidence = 3.
    Output strictly in JSON format with jobs, traits, and environment as numeric lists.
    """

    # Merge all job descriptions into one batch for efficiency
    jd_batch = "\n\n".join([f"=== JOB {i+1} ===\n{jd}" for i, jd in enumerate(job_descriptions)])

    response = safe_llm_request(
        model="gpt-4o-mini",
        temperature=0.0,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT.strip()},
            {"role": "user", "content": jd_batch.strip()},
        ],
    )

    jd_json = json.loads(response.choices[0].message.content)

    results = []
    for job in jd_json.get("jobs", []):
        traits_raw = job.get("traits", {})
        env_raw = job.get("environment", {})

        job_traits = {
            t: round(100 * np.mean([(v - 1) / 4 for v in vals]), 2)
            for t, vals in traits_raw.items()
            if vals
        }
        job_env = {
            e: round(np.mean([(v - 1) / 4 for v in vals]), 3)
            for e, vals in env_raw.items()
            if vals
        }

        # Flip S for stability (higher = more stable)
        if "S" in job_traits:
            job_traits["S"] = 100 - job_traits["S"]

        fit = round(fit_score(user_traits, job_traits), 2)
        satisfaction = round(satisfaction_score(user_env, job_env), 2)

        results.append(
            {
                "job_id": job.get("job_id", str(len(results) + 1)),
                "fit": fit,
                "satisfaction": satisfaction,
                "job_traits": job_traits,
                "job_env": job_env,
            }
        )

    return results
