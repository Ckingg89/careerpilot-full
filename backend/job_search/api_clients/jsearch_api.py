import os
import requests
from dotenv import load_dotenv

load_dotenv()

RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY")

# Base endpoint for JSearch
BASE_URL = "https://jsearch.p.rapidapi.com/search"

def fetch_jsearch(keyword, location, job_type="", country="us", date_posted="all"):
    """
    Fetch job listings from JSearch API (v1).

    Parameters
    ----------
    keyword : str
        Main search keyword (e.g., "developer")
    location : str
        City or region (e.g., "Toronto, ON")
    job_type : str
        Optional job type for query text only
    country : str
        Country code (default = 'us')
    date_posted : str
        Filter for recency (e.g., 'all', 'today', 'week', 'month')
    """

    headers = {
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": "jsearch.p.rapidapi.com"
    }

    params = {
        "query": f"{keyword} {job_type} jobs in {location}",
        "page": "1",
        "num_pages": "1",
        "country": country,
        "date_posted": date_posted
    }

    try:
        res = requests.get(BASE_URL, headers=headers, params=params)
        if res.status_code != 200:
            return {"error": f"JSearch API returned {res.status_code}: {res.text}"}
        return res.json()
    except Exception as e:
        return {"error": str(e)}
