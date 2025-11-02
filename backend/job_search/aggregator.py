import os
from dotenv import load_dotenv
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
import numpy as np
import math

# ✅ FIXED: Use absolute imports (Render-safe)
from job_search.api_clients.jsearch_api import fetch_jsearch
from job_search.utils.salary_extractor import extract_salary_for_job, parse_salary_range
from job_search.utils.date_extractor import extract_posted_date

load_dotenv()
RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY")


# ========================= UTILITIES =========================
def normalize_missing(val):
    if val is None or (isinstance(val, str) and val.strip().lower() in {"", "n/a", "none", "null"}):
        return None
    return val


def is_missing_salary(val):
    if val is None:
        return True
    if isinstance(val, str):
        s = val.strip().lower()
        if s in {"", "n/a", "none", "null"}:
            return True
        try:
            float(s.replace(",", ""))
            return False
        except ValueError:
            return True
    if isinstance(val, (int, float)):
        return val <= 0
    return True


def within_date_filter(job_date_str, user_filter):
    if not job_date_str:
        return False
    try:
        job_date = datetime.fromisoformat(job_date_str.replace("Z", "+00:00"))
    except Exception:
        return False

    now = datetime.now(timezone.utc)
    delta_days = (now - job_date).days

    if user_filter == "today":
        return delta_days <= 1
    elif user_filter == "week":
        return delta_days <= 7
    elif user_filter == "month":
        return delta_days <= 30
    return True  # "all"


def matches_job_type(job_type_field, user_job_type):
    if not user_job_type:
        return True
    if not job_type_field:
        return False
    job_type_field = job_type_field.lower()
    user_job_type = user_job_type.lower()
    return user_job_type in job_type_field


# ========================= PAY SCORE LOGIC =========================
def compute_fallback_pay_score(job):
    """Used if too few salaries exist to build a relative distribution."""
    vals = [v for v in [job.get("job_min_salary"), job.get("job_max_salary")] if v]
    if not vals:
        return None
    avg = np.mean(vals)
    if avg < 1000:  # hourly → annualize
        avg *= 2080
    MIN, MAX = 15000, 300000
    avg = max(min(avg, MAX), MIN)
    return round(1 + 9 * (np.log(avg) - np.log(MIN)) / (np.log(MAX) - np.log(MIN)), 1)


def compute_relative_pay_scores(jobs):
    """Compute relative pay scores (1–10) based on salaries among valid results."""
    salaries = []
    for job in jobs:
        vals = [v for v in [job.get("job_min_salary"), job.get("job_max_salary")] if v]
        if not vals:
            continue
        avg = np.mean(vals)
        if avg < 1000:  # hourly → annualize
            avg *= 2080
        salaries.append(avg)

    if len(salaries) < 3:
        for job in jobs:
            job["pay_score"] = compute_fallback_pay_score(job)
        return jobs

    mean = np.mean(salaries)
    std = np.std(salaries) if np.std(salaries) > 0 else 1

    for job in jobs:
        vals = [v for v in [job.get("job_min_salary"), job.get("job_max_salary")] if v]
        if not vals:
            job["pay_score"] = None
            continue
        avg = np.mean(vals)
        if avg < 1000:
            avg *= 2080
        z = (avg - mean) / std
        sigmoid = 1 / (1 + math.exp(-z))
        job["pay_score"] = round(1 + 9 * sigmoid, 1)
    return jobs


# ========================= JOB PROCESSING =========================
def process_job(job):
    job["job_min_salary"] = normalize_missing(job.get("job_min_salary"))
    job["job_max_salary"] = normalize_missing(job.get("job_max_salary"))
    job["job_posted_at_datetime_utc"] = normalize_missing(job.get("job_posted_at_datetime_utc"))

    # Fill missing salaries
    if is_missing_salary(job["job_min_salary"]) or is_missing_salary(job["job_max_salary"]):
        detected = extract_salary_for_job(job)
        parsed_min, parsed_max = parse_salary_range(detected)
        if parsed_min is not None:
            job["job_min_salary"] = parsed_min
        if parsed_max is not None:
            job["job_max_salary"] = parsed_max

    # Fill missing dates
    if not job.get("job_posted_at_datetime_utc"):
        job["job_posted_at_datetime_utc"] = extract_posted_date(job.get("job_apply_link"))

    return job


def print_job(job):
    description = job.get("job_description", "N/A") or "N/A"

    print("─────────────────────────────")
    print(f"🏢 Company: {job.get('employer_name', 'N/A')}")
    print(f"💼 Job Title: {job.get('job_title', 'N/A')}")
    print(f"🌐 Apply Link: {job.get('job_apply_link', 'N/A')}")
    print(f"📍 Location: {job.get('job_city', 'N/A')}, {job.get('job_state', 'N/A')} ({job.get('job_country', 'N/A')})")
    print(f"💰 Min Salary: {job.get('job_min_salary', 'N/A')}")
    print(f"💰 Max Salary: {job.get('job_max_salary', 'N/A')}")
    print(f"📈 Pay Score: {job.get('pay_score', 'N/A')}/10")
    print(f"📅 Posted: {job.get('job_posted_at_datetime_utc', 'N/A')}")
    print(f"🕓 Type: {job.get('job_employment_type', 'N/A')}")
    print("\n📝 Full Description:\n")
    print(description.strip())
    print("\n─────────────────────────────\n")


# ========================= MAIN =========================
def main():
    print("=== Job Search Filters ===")
    keyword = input("Keyword (e.g., cashier): ").strip()
    location = input("City and Province/State (e.g., Toronto, ON): ").strip()
    job_type = input("Job type (e.g., part-time, full-time): ").strip().lower()
    country = input("Country code (default: us): ").strip() or "us"
    date_posted = input("Date filter (all, today, week, month): ").strip().lower() or "all"

    print("\n🔍 Fetching from JSearch...\n")
    data = fetch_jsearch(keyword, location, job_type, country, date_posted)
    jobs = data.get("data", [])
    print(f"✅ Retrieved {len(jobs)} job listings\n")

    # Process jobs concurrently
    updated = []
    with ThreadPoolExecutor(max_workers=8) as executor:
        futures = [executor.submit(process_job, job) for job in jobs]
        for f in as_completed(futures):
            updated.append(f.result())

    print("💡 Filtering results...")

    # Filter by job type & date
    filtered = [
        job for job in updated
        if matches_job_type(job.get("job_employment_type"), job_type)
        and within_date_filter(job.get("job_posted_at_datetime_utc"), date_posted)
    ]

    # Remove low-paying Canadian jobs (<$17.20/hr)
    cleaned = []
    for job in filtered:
        vals = [v for v in [job.get("job_min_salary"), job.get("job_max_salary")] if v]
        if not vals:
            cleaned.append(job)
            continue
        avg = np.mean(vals)
        if avg < 1000:  # hourly
            if job.get("job_country", "").lower() == "ca" and avg < 17.20:
                continue
        cleaned.append(job)

    print(f"✅ {len(cleaned)}/{len(updated)} jobs remain after filtering.\n")

    # Compute pay scores relative to remaining jobs
    cleaned = compute_relative_pay_scores(cleaned)
    cleaned.sort(key=lambda j: (j.get("pay_score") or 0), reverse=True)

    for job in cleaned:
        print_job(job)

    print("✅ Done — results ranked by relative pay score!\n")


def job_search_pipeline(keyword, location, job_type=None, country="us", date_posted="all"):
    """
    Programmatic version of the job search for API or backend usage.
    Returns a list of processed job dicts.
    """
    data = fetch_jsearch(keyword, location, job_type, country, date_posted)
    jobs = data.get("data", [])
    updated = []

    with ThreadPoolExecutor(max_workers=8) as executor:
        futures = [executor.submit(process_job, job) for job in jobs]
        for f in as_completed(futures):
            updated.append(f.result())

    filtered = [
        job for job in updated
        if matches_job_type(job.get("job_employment_type"), job_type)
        and within_date_filter(job.get("job_posted_at_datetime_utc"), date_posted)
    ]

    cleaned = []
    for job in filtered:
        vals = [v for v in [job.get("job_min_salary"), job.get("job_max_salary")] if v]
        if not vals:
            cleaned.append(job)
            continue
        avg = np.mean(vals)
        if avg < 1000:  # hourly
            if job.get("job_country", "").lower() == "ca" and avg < 17.20:
                continue
        cleaned.append(job)

    cleaned = compute_relative_pay_scores(cleaned)
    cleaned.sort(key=lambda j: (j.get("pay_score") or 0), reverse=True)
    return cleaned


if __name__ == "__main__":
    main()
