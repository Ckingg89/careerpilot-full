"""
Resume Parser Module
--------------------
This module extracts and normalizes key information from uploaded resumes (PDF/DOCX/TXT).
It supports use inside FastAPI routes and can be extended with machine-learning matching later.
"""

import re
import json
from typing import Dict, Optional
from pathlib import Path
from docx import Document
from pdfminer.high_level import extract_text


# =============== UTILITIES ===============

def read_file_text(file_path: str) -> str:
    """Extract raw text from a PDF, DOCX, or TXT file."""
    path = Path(file_path)
    if path.suffix.lower() == ".pdf":
        return extract_text(path)
    elif path.suffix.lower() == ".docx":
        doc = Document(path)
        return "\n".join(p.text for p in doc.paragraphs)
    elif path.suffix.lower() == ".txt":
        return path.read_text(encoding="utf-8")
    else:
        raise ValueError("Unsupported file type. Please upload PDF, DOCX, or TXT.")


def clean_text(text: str) -> str:
    """Normalize text spacing and remove strange characters."""
    text = re.sub(r"\s+", " ", text)
    text = re.sub(r"[^\x00-\x7F]+", " ", text)
    return text.strip()


# =============== PARSER CORE ===============

def parse_resume(file_path: str) -> Dict[str, Optional[str]]:
    """Extract key information from a resume."""
    raw_text = clean_text(read_file_text(file_path))

    # Example regex patterns (simple baseline)
    email = re.search(r"[\w\.-]+@[\w\.-]+\.\w+", raw_text)
    phone = re.search(r"\+?\d[\d\s\-]{7,}\d", raw_text)
    name = raw_text.split("\n")[0].strip() if raw_text else None

    # Find key skills
    skills_keywords = [
        "Python", "Java", "C++", "Machine Learning", "Excel", "Communication",
        "Leadership", "SQL", "Data Analysis", "FastAPI", "Django", "React"
    ]
    found_skills = [s for s in skills_keywords if s.lower() in raw_text.lower()]

    return {
        "name": name,
        "email": email.group(0) if email else None,
        "phone": phone.group(0) if phone else None,
        "skills": found_skills or None,
        "summary_length": len(raw_text.split()),
    }


# =============== TEST ENTRY POINT ===============

if __name__ == "__main__":
    sample_path = "sample_resume.pdf"  # change this to test locally
    result = parse_resume(sample_path)
    print(json.dumps(result, indent=2))
