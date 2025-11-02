import os
import json
import pdfplumber
from openai import OpenAI
from dotenv import load_dotenv

# ---------- Load API key ----------
load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# ---------- PDF to Text ----------
def pdf_to_text(pdf_path: str) -> str:
    """Extract text from all pages of a PDF file."""
    text = ""
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    return text.strip()

# ---------- GPT-4o Mini Resume Parser ----------
def parse_resume_with_gpt(resume_text: str) -> dict:
    """
    Send resume text to GPT-4o mini for structured parsing.
    Returns a dictionary with personal info, work experience, education, and skills.
    """
    prompt = f"""
    You are an expert resume parser. Read the following resume text and extract the requested information.

    Respond ONLY in JSON using this exact structure:
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
    - In work_experience:
        * If the job is marked "present", "current", or similar, set date_ended to "Present".
        * Otherwise, extract the actual end date.
    - In education:
        * If the text indicates the user is still studying (e.g., "candidate", "expected", "pursuing", "in progress"),
          append " (in progress)" to the degree title.
        * Example: "Bachelor of Science (B.S.) in Computer Science (in progress)".
    - For skills:
        * Include explicit skills listed.
        * ALSO infer strongly implied skills from all parts of the resume (job descriptions, achievements, education, summary, etc.).
        * Only include a skill if the text gives clear evidence of it (e.g., if they mention “developed machine learning models”, include “Machine Learning”).
        * Do NOT stretch or guess. Only infer if the evidence is explicit or unavoidable.
        * Exclude soft skills like “ethics”, “responsibility”, etc. unless explicitly relevant to the work.
    - Use "Present" or "Ongoing" where appropriate.
    - Use a dash "-" if information is unavailable.

    Resume text:
    '''{resume_text}'''
    """

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are a precise, structured resume parser."},
            {"role": "user", "content": prompt}
        ],
        response_format={"type": "json_object"}
    )

    # Safely parse JSON string
    try:
        message_content = response.choices[0].message.content
        parsed_data = json.loads(message_content)
    except Exception as e:
        print("⚠️ Error parsing JSON from model:", e)
        parsed_data = {"error": "Failed to parse JSON", "raw_response": response.choices[0].message.content}

    return parsed_data

# ---------- Main ----------
def main():
    pdf_path = input("Enter the path to the resume PDF: ").strip()

    # Step 1: Extract text
    print("\nExtracting text from PDF...")
    resume_text = pdf_to_text(pdf_path)

    # Step 2: Parse with GPT-4o mini
    print("Sending to GPT-4o mini for parsing...\n")
    parsed_resume = parse_resume_with_gpt(resume_text)

    # Step 3: Display structured data
    print("\n---- Parsed Resume Data ----")
    print(json.dumps(parsed_resume, indent=2, ensure_ascii=False))

if __name__ == "__main__":
    main()
