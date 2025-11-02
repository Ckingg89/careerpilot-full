# file: backend/resume_parser/parser.py
"""
Production-ready Resume Parser module for CareerPilot.
- Accepts raw PDF bytes or file path.
- Extracts text with pdfplumber.
- Parses with GPT-4o-mini for structured JSON output.
"""

import os
import io
import json
import pdfplumber
from openai import OpenAI
from dotenv import load_dotenv

# ---------- SETUP ----------
load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# ---------- PDF TO TEXT ----------
def pdf_to_text(pdf_input) -> str:
    """
    Extract text from PDF bytes or a file path.
    Works both in API (UploadFile) and local script usage.
    """
    text = ""
    try:
        if isinstance(pdf_input, (bytes, bytearray)):
            with pdfplumber.open(io.BytesIO(pdf_input)) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
        elif isinstance(pdf_input, str) and os.path.exists(pdf_input):
            with pdfplumber.open(pdf_input) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
        else:
            raise ValueError("Invalid PDF input type. Must be bytes or valid file path.")
    except Exception as e:
        print(f"⚠️ Error reading PDF: {e}")
        return ""
    return text.strip()

# ---------- GPT-4o MINI RESUME PARSER ----------
def parse_resume_with_gpt(resume_text: str) -> dict:
    """
    Send resume text to GPT-4o-mini for structured parsing.
    Returns a dictionary with personal info, work experience, education, and skills.
    """
    if not resume_text:
        return {"error": "Empty resume text — nothing to parse."}

    prompt = f"""
    You are an expert resume parser. Read the following resume text and extract information in JSON form.

    Respond ONLY in this exact structure:
    {{
      "name": "",
      "phone_number": "",
      "email": "",
      "address": "",
      "work_experience": [
        {{
          "position_name": "",
          "company_name": "",
          "location": "",
          "date_started": "",
          "date_ended": "",
          "description": ""
        }}
      ],
      "education": [
        {{
          "education_level": "",
          "institution": "",
          "date_of_graduation": ""
        }}
      ],
      "skills": []
    }}

    Parsing rules:
    - Be concise and accurate.
    - Use "Present" if ongoing.
    - Append "(in progress)" to degrees still being pursued.
    - Include explicit and clearly implied technical skills only.
    - Use "-" if information is unavailable.

    Resume text:
    '''{resume_text}'''
    """

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a precise, structured resume parser."},
                {"role": "user", "content": prompt.strip()},
            ],
            response_format={"type": "json_object"},
        )

        message_content = response.choices[0].message.content
        parsed_data = json.loads(message_content)
        return parsed_data

    except json.JSONDecodeError as e:
        print("⚠️ JSON parse error:", e)
        return {"error": "Failed to parse model output.", "raw_response": message_content}
    except Exception as e:
        print("⚠️ GPT request error:", e)
        return {"error": str(e)}

# ---------- MAIN (OPTIONAL LOCAL TEST) ----------
if __name__ == "__main__":
    pdf_path = input("Enter the path to the resume PDF: ").strip()
    print("\nExtracting text from PDF...")
    resume_text = pdf_to_text(pdf_path)

    if not resume_text:
        print("❌ No text extracted. Exiting.")
        exit()

    print("Sending to GPT-4o-mini for parsing...\n")
    parsed_resume = parse_resume_with_gpt(resume_text)

    print("\n---- Parsed Resume Data ----")
    print(json.dumps(parsed_resume, indent=2, ensure_ascii=False))
