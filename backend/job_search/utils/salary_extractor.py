import re
import requests
from urllib.parse import urlparse
from bs4 import BeautifulSoup

# ✅ Relative import so Render and local environments both work
from .page_fetcher import get_rendered_html


# ======== CONSTANTS ========

# Domains that almost always require a headless browser (anti-bot pages)
BLOCKED_DOMAINS = {
    "indeed.com", "ca.indeed.com", "emplois.ca.indeed.com",
    "simplyhired.ca", "fr.simplyhired.ca",
    "glassdoor.ca", "glassdoor.com",
    "ziprecruiter.com", "www.ziprecruiter.com",
}

# Keywords that indicate we hit a CAPTCHA, bot-check, or blank stub page
BLOCK_PHRASES = [
    "enable javascript", "please verify you are a human", "robot check",
    "access denied", "forbidden", "sorry, we just need to make sure",
    "/captcha", "unusual traffic", "are you a robot",
]


# ======== SALARY TEXT EXTRACTION ========

def extract_salary_from_text(text: str):
    """
    Detect salary mentions using contextual and regex rules.
    Works for patterns like:
      - $15.00 - $16.00 per hour
      - $17.60 per hour
      - Rate: $16/hour
      - $45,000 per year, etc.
    """
    if not text:
        return None

    lines = text.splitlines()
    combined = []
    for i, line in enumerate(lines):
        line = line.strip()
        # Merge "Salary:" or "Pay:" header lines with next line content
        if re.match(r"^(Pay|Salary|Wage|Rate|Compensation)[:\s]*$", line, re.I) and i + 1 < len(lines):
            combined.append(f"{line} {lines[i+1].strip()}")
        else:
            combined.append(line)

    salary_patterns = [
        # e.g., $15 - $16 per hour | $20/hr | $45,000 per year | 16-18 hourly
        r"\$\s?\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?"
        r"(?:\s?[-–to]{1,3}\s?\$?\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?)?"
        r"\s?(?:per\s?(?:hour|annum|year)|/ ?hr|hourly)",
        # Lines that say Salary/Pay/etc followed by a number
        r"\b(?:Pay|Salary|Wage|Rate|Compensation)\b[:\s]*\$?\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?"
        r"(?:\s?[-–to]{1,3}\s?\$?\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?)?"
        r"(?:\s?(?:per\s?(?:hour|annum|year)|/ ?hr|hourly))?",
    ]

    for line in combined:
        lower = line.lower()
        if any(k in lower for k in ["pay", "salary", "wage", "rate", "compensation"]):
            for pattern in salary_patterns:
                m = re.search(pattern, line, re.IGNORECASE)
                if m:
                    return m.group().strip()
            # fallback: if it mentions salary/pay and has a $number, take the line
            if re.search(r"\$\s?\d", line):
                return line.strip()
    return None


def parse_salary_range(salary_text: str):
    """
    Convert extracted salary string to numeric (min, max).
    Returns floats or (None, None) if parsing fails.
    """
    if not salary_text or "Error" in salary_text:
        return None, None

    nums = re.findall(r"\d{1,3}(?:,\d{3})*(?:\.\d+)?", salary_text)
    if not nums:
        return None, None

    def to_float(s):
        return float(s.replace(",", ""))

    if len(nums) == 1:
        return to_float(nums[0]), None
    return to_float(nums[0]), to_float(nums[1])


# ======== NETWORK HELPERS ========

def _looks_blocked(html: str) -> bool:
    if not html:
        return True
    l = html.lower()
    # small pages or containing bot-check language
    return any(phrase in l for phrase in BLOCK_PHRASES) or len(l) < 800


def _requests_text(url: str):
    """Try plain requests to get visible text. Return text or None if blocked."""
    try:
        res = requests.get(
            url,
            timeout=12,
            headers={
                "User-Agent": (
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/120.0.0.0 Safari/537.36"
                ),
                "Accept-Language": "en-US,en;q=0.8",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            },
        )
        html = res.text
        if res.status_code != 200 or _looks_blocked(html):
            return None
        soup = BeautifulSoup(html, "html.parser")
        return soup.get_text(separator="\n", strip=True)
    except Exception:
        return None


def _playwright_text(url: str):
    """Render with Playwright and return visible text or None."""
    html = get_rendered_html(url)
    if not html or _looks_blocked(html):
        return None
    soup = BeautifulSoup(html, "html.parser")
    return soup.get_text(separator="\n", strip=True)


# ======== MAIN PIPELINE ========

def extract_salary_for_job(job: dict) -> str:
    """
    Best-effort extraction pipeline for a single JSearch job dict:
      1) Try job_description (fast, often already has salary)
      2) Try requests on job_apply_link
      3) If domain is known-blocked or requests looked blocked, render via Playwright
      Returns a human-readable string or "Salary: None found".
    """
    desc = job.get("job_description") or ""
    from_desc = extract_salary_from_text(desc)
    if from_desc:
        return from_desc

    url = job.get("job_apply_link") or ""
    if not url:
        return "Salary: None found"

    host = urlparse(url).hostname or ""
    text = _requests_text(url)

    # If blocked or domain known to block bots, use Playwright rendering
    if text is None or host in BLOCKED_DOMAINS:
        text = _playwright_text(url)

    if not text:
        return "Salary: None found"

    found = extract_salary_from_text(text)
    return found or "Salary: None found"
