# file: job_fit_analysis.py
import os, json, time, numpy as np
from dotenv import load_dotenv
from openai import OpenAI

# ========== SETUP ==========
load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def safe_llm_request(**kwargs):
    for delay in [1, 2, 4]:
        try:
            return client.chat.completions.create(**kwargs)
        except Exception as e:
            print(f"⚠️ LLM error: {e}. Retrying in {delay}s...")
            time.sleep(delay)
    raise RuntimeError("OpenAI request failed after retries.")

# ====== LOAD CANDIDATE SCORES ======
with open("candidate_scores.json", "r") as f:
    candidate = json.load(f)

user_traits = candidate["traits"]
user_env = candidate["environment"]

# ====== JOB INPUT ======
print("\nPaste multiple job descriptions below. Separate each JD with === JOB n ===\nEnd with an empty line:")
jd_lines = []
while True:
    line = input()
    if line.strip() == "":
        break
    jd_lines.append(line)
jd_batch = "\n".join(jd_lines)

# ====== SURVEY BLOCK ======
HIRING_MANAGER_SURVEY_BLOCK = """[same as your full block here]"""

SYSTEM_PROMPT = f"""
You are a psychometric evidence analyst.

You will complete the Hiring-Manager Job-Requirements Survey item by item for multiple Job Descriptions (JDs).
Every rating must be grounded in explicit textual evidence from the JD. Do NOT infer or speculate.
Absence of evidence = 3.

RATING RULES:
1 = opposite behavior required
2 = weak or occasional evidence
3 = no explicit mention (neutral)
4 = strong cues the trait is important
5 = multiple explicit statements making it critical

Ensure variation; do not assign all 4–5.
Respond for every item.

SURVEY:
{HIRING_MANAGER_SURVEY_BLOCK}

OUTPUT FORMAT:
{{
  "jobs": [
    {{
      "job_id": "1",
      "traits": {{ "H": [..], "S": [..], "X": [..], "A": [..], "C": [..], "O": [..], "G": [..] }},
      "environment": {{ "structure": [..], "sociality": [..], "stability": [..], "creativity": [..], "autonomy": [..] }}
    }}
  ]
}}
"""

# ====== API CALL ======
print("\n🔍 Analyzing JDs for evidence-based numeric answers...")
resp = safe_llm_request(
    model="gpt-4o-mini",
    temperature=0.0,
    response_format={"type": "json_object"},
    messages=[
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": jd_batch}
    ],
)

jd_json = json.loads(resp.choices[0].message.content)

# ====== SCORING ======
FIT_W = {"H":0.15, "S":0.15, "X":0.15, "A":0.10, "C":0.20, "O":0.10, "G":0.15}
ENV_W = {"structure":0.20, "sociality":0.20, "stability":0.20, "creativity":0.20, "autonomy":0.20}

def fit_score(user_trait, job_trait):
    sims = [w * (1 - abs(user_trait[k] - job_trait[k]) / 100) for k, w in FIT_W.items()]
    return 100 * sum(sims) / sum(FIT_W.values())

def satisfaction_score(user_env_vec, job_env_vec):
    sims = [w * (1 - abs(user_env_vec[k] - job_env_vec[k])) for k, w in ENV_W.items()]
    return 100 * sum(sims) / sum(ENV_W.values())

results = []
for job in jd_json["jobs"]:
    traits_raw = job["traits"]
    env_raw = job["environment"]
    job_traits = {t: round(100*np.mean([(v-1)/4 for v in vals]),2) for t, vals in traits_raw.items()}
    job_env = {e: round(np.mean([(v-1)/4 for v in vals]),3) for e, vals in env_raw.items()}

    # 🔹 Adjust Emotional Stability (S): invert so that higher = more stability
    job_traits["S"] = 100 - job_traits["S"]

    fit = round(fit_score(user_traits, job_traits), 2)
    satisfaction = round(satisfaction_score(user_env, job_env), 2)
    results.append({
        "job_id": job["job_id"],
        "fit": fit,
        "satisfaction": satisfaction,
        "job_traits": job_traits,
        "job_env": job_env
    })

# ====== OUTPUT ======
print("\n==================== RESULTS ====================")
for r in results:
    print(f"\nJOB {r['job_id']}:")
    print(json.dumps({
        "Fit (0–100)": r["fit"],
        "Satisfaction (0–100)": r["satisfaction"],
        "Job Traits": r["job_traits"],
        "Job Environment": r["job_env"]
    }, indent=2))
print("================================================\n")
