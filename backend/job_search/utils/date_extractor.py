import re
from datetime import datetime, timedelta, timezone
import requests
from bs4 import BeautifulSoup
from utils.page_fetcher import get_rendered_html

BLOCKED_SITES = {"indeed.com", "ca.indeed.com", "simplyhired.ca", "glassdoor.com", "ziprecruiter.com"}


def relative_to_date(match: str) -> str:
    """Convert '3 days ago', '2 weeks ago' etc. into ISO UTC datetime string."""
    now = datetime.now(timezone.utc)
    num = int(re.search(r"\d+", match).group()) if re.search(r"\d+", match) else 1

    if "day" in match:
        dt = now - timedelta(days=num)
    elif "week" in match:
        dt = now - timedelta(weeks=num)
    elif "month" in match:
        dt = now - timedelta(days=num * 30)
    else:
        dt = now

    return dt.strftime("%Y-%m-%dT00:00:00Z")


def extract_from_html(html: str) -> str:
    text = BeautifulSoup(html, "html.parser").get_text(separator="\n", strip=True)
    match = re.search(r"(\d+)\s+(day|days|week|weeks|month|months)\s+ago", text, re.IGNORECASE)
    if match:
        return relative_to_date(match.group())
    return None


def extract_posted_date(url: str) -> str:
    if not url:
        return None
    try:
        r = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=10)
        if r.status_code == 200:
            date = extract_from_html(r.text)
            if date:
                return date
    except Exception:
        pass

    html = get_rendered_html(url)
    if html:
        return extract_from_html(html)
    return None
