# file: backend/job_search/utils/date_extractor.py
import re
from datetime import datetime, timedelta, timezone
import requests
from bs4 import BeautifulSoup
from .page_fetcher import get_rendered_html  # ✅ fixed import

# Sites that often block direct HTTP requests
BLOCKED_SITES = {"indeed.com", "ca.indeed.com", "simplyhired.ca", "glassdoor.com", "ziprecruiter.com"}


def relative_to_date(match_text: str) -> str:
    """Convert '3 days ago', '2 weeks ago', etc. into an ISO 8601 UTC datetime string."""
    now = datetime.now(timezone.utc)
    num_match = re.search(r"\d+", match_text)
    num = int(num_match.group()) if num_match else 1

    match_lower = match_text.lower()
    if "day" in match_lower:
        dt = now - timedelta(days=num)
    elif "week" in match_lower:
        dt = now - timedelta(weeks=num)
    elif "month" in match_lower:
        dt = now - timedelta(days=num * 30)
    else:
        dt = now

    return dt.strftime("%Y-%m-%dT00:00:00Z")


def extract_from_html(html: str) -> str | None:
    """Extract posting date from visible text (e.g., '3 days ago')."""
    if not html:
        return None

    try:
        text = BeautifulSoup(html, "html.parser").get_text(separator="\n", strip=True)
        match = re.search(r"(\d+)\s+(day|days|week|weeks|month|months)\s+ago", text, re.IGNORECASE)
        if match:
            return relative_to_date(match.group())
    except Exception:
        return None

    return None


def extract_posted_date(url: str) -> str | None:
    """
    Extract job posting date from a URL.
    Tries simple GET first; falls back to rendered HTML if blocked.
    """
    if not url:
        return None

    try:
        res = requests.get(
            url,
            headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                                   "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"},
            timeout=10,
        )
        if res.status_code == 200:
            date = extract_from_html(res.text)
            if date:
                return date
    except Exception:
        pass

    # Fallback: browser-rendered HTML (Playwright)
    try:
        html = get_rendered_html(url)
        if html:
            return extract_from_html(html)
    except Exception:
        pass

    return None
