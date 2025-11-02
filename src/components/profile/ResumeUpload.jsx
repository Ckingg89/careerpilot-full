
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileText, AlertCircle, Loader2, CheckCircle } from "lucide-react";
import { UploadFile, InvokeLLM } from "@/api/integrations";
import { UserProfile } from "@/api/entities";
import { User } from "@/api/entities";

// A helper function to get text from the file first.
async function getTextFromResume(file_url) {
  // In a real application, this function would interact with a backend service
  // to read the file content from the provided file_url (which points to a PDF or DOCX file)
  // and convert it into plain text. Client-side conversion of PDF/DOCX to text is complex
  // and typically requires external libraries or server-side processing.
  //
  // For the purpose of this implementation, and to allow the rest of the flow to function,
  // we will return a placeholder string. You would replace this with actual text extraction logic.
  
  console.warn("getTextFromResume: Returning placeholder text. Implement actual PDF/DOCX to text extraction for production use.");
  return `
  John Doe
  john.doe@example.com | (555) 123-4567 | San Francisco, CA

  Summary: Highly motivated and results-oriented Software Engineer with experience in developing scalable web applications using React, Node.js, and AWS. Proven ability to lead projects from conception to deployment and collaborate effectively with cross-functional teams. Seeking to leverage expertise in a challenging environment.

  Experience:
  Senior Software Engineer | Tech Solutions Inc. | San Francisco, CA | Jan 2021 – Present
  - Led a team of 4 engineers in developing a new microservices architecture, reducing latency by 30%.
  - Designed and implemented critical features for the flagship product using React and TypeScript.
  - Mentored junior developers and conducted code reviews.

  Software Engineer | Innovate Corp. | San Francisco, CA | Jun 2018 – Dec 2020
  - Developed and maintained RESTful APIs using Node.js and Express.
  - Contributed to front-end development using React.js, improving user experience by 20%.
  - Implemented CI/CD pipelines using Jenkins and Docker.

  Education:
  M.S. Computer Science | Stanford University | Sep 2017 – Jun 2018
  B.S. Computer Science | University of California, Berkeley | Sep 2013 – May 2017

  Skills:
  Programming Languages: JavaScript, Python, Java
  Frameworks: React, Node.js, Express, Spring Boot
  Databases: PostgreSQL, MongoDB
  Cloud: AWS (EC2, S3, Lambda)
  Tools: Docker, Kubernetes, Git, Jenkins, JIRA
  Other: Microservices, RESTful APIs, Agile, Test-Driven Development, Team Leadership, Project Management

  Certifications:
  AWS Certified Solutions Architect – Associate
  Scrum Master Certification
  `;
}


export default function ResumeUpload({ onProfileCreated }) {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type === "application/pdf" ||
          selectedFile.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        setFile(selectedFile);
        setError(null);
      } else {
        setError("Please upload a PDF or DOCX file");
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgress(10);
    setError(null);

    try {
      const { file_url } = await UploadFile({ file });
      setProgress(25);

      const resumeText = await getTextFromResume(file_url);
      setProgress(50);

      const parsingPrompt = `
You are an expert career coach and professional recruiter with 20 years of experience. Your task is to perform a deep, semantic analysis of the following resume text and transform it into a structured JSON profile. Do not just look for keywords; understand the context, responsibilities, and achievements to build a comprehensive professional profile.

Resume Text:
---
${resumeText}
---

Follow these instructions carefully:

1.  **Professional Summary**: Based on the resume, write a professional summary that is impactful and concise (2-3 sentences). This summary should capture the candidate's core expertise, key strengths, and career ambitions.

2.  **Contact Information**: Extract contact details like email, phone, and location (city, state, country).

3.  **Work Experience**: Identify all professional roles. For each role, extract the title, company, dates (start_date, end_date), and a description of responsibilities and achievements. If a role is current, set end_date to "Present".

4.  **Education**: Identify all educational entries, including institution, program/degree, field of study, and graduation date.

5.  **Skills (Crucial Task)**:
    -   First, extract all skills explicitly listed in a "Skills" section.
    -   Second, and most importantly, **infer skills** from the work experience descriptions. Analyze the responsibilities and achievements to identify demonstrated abilities that are not explicitly listed. For example, if the text says "managed a cross-functional team to deliver a project on time," you must infer skills like "Project Management," "Team Leadership," and "Cross-Functional Collaboration."
    -   Combine both explicit and inferred skills into a single, comprehensive list. Remove duplicates.

6.  **Certifications**: Extract any professional certifications or licenses mentioned.

Structure your final output as a JSON object that strictly adheres to the provided schema. Do not add any fields not in the schema. Do not make up information that is not present in the resume.
`;

      const profileDataResult = await InvokeLLM({
        prompt: parsingPrompt,
        response_json_schema: {
            "type": "object",
            "properties": {
                "professional_summary": { "type": "string" },
                "contact_info": { "type": "object", "properties": { "email": { "type": "string" }, "phone": { "type": "string" }, "city": { "type": "string" }, "state": { "type": "string" }, "country": { "type": "string" }}},
                "experience": { "type": "array", "items": { "type": "object", "properties": { "title": { "type": "string" }, "company": { "type": "string" }, "start_date": { "type": "string" }, "end_date": { "type": "string" }, "description": { "type": "string" }}}},
                "education": { "type": "array", "items": { "type": "object", "properties": { "institution": { "type": "string" }, "program": { "type": "string" }, "field": { "type": "string" }, "graduation_date": { "type": "string" }}}},
                "skills": { "type": "array", "items": { "type": "string" } },
                "certifications": { "type": "array", "items": { "type": "string" } }
            },
            "required": ["professional_summary", "contact_info", "experience", "education", "skills"]
        }
      });

      setProgress(90);

      const user = await User.me();
      const profileData = {
        raw_text: resumeText, // Add raw_text here
        resume_file_url: file_url,
        contact_info: profileDataResult.contact_info || {},
        experience: profileDataResult.experience || [],
        education: profileDataResult.education || [],
        skills: profileDataResult.skills || [],
        certifications: profileDataResult.certifications || [],
        professional_summary: profileDataResult.professional_summary,
        job_preferences: {
          location_type: ["Remote"],
          date_posted: "7 days",
          cities: [],
          job_type: ["Full-time"],
          preferred_companies: []
        }
      };

      const profile = await UserProfile.create(profileData);
      setProgress(100);

      onProfileCreated(profile);
    } catch (err) {
      console.error("Error processing resume:", err);
      setError("Failed to process your resume. The new AI parser may be experiencing high load. Please try again or contact support.");
    }

    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/30 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full glass-card shadow-2xl">
        <CardHeader className="text-center pb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Upload className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold gradient-text">
            Upload Your Resume
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Our AI will extract your experience, skills, and preferences automatically
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!file ? (
            <div className="border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center hover:border-blue-500 transition-colors cursor-pointer bg-gradient-to-br from-white to-blue-50/30"
              onClick={() => document.getElementById('resume-upload').click()}
            >
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-700 mb-2">
                Click to upload or drag and drop
              </p>
              <p className="text-sm text-gray-500">PDF or DOCX (max 10MB)</p>
              <input
                id="resume-upload"
                type="file"
                accept=".pdf,.docx"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          ) : (
            <div className="border-2 border-blue-500 rounded-2xl p-6 bg-gradient-to-br from-blue-50 to-cyan-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                {!isProcessing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFile(null)}
                  >
                    Remove
                  </Button>
                )}
              </div>

              {isProcessing && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Processing your resume...
                    </span>
                    <span className="text-sm text-gray-600">{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-600 to-cyan-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {progress < 25 && "Uploading file..."}
                    {progress >= 25 && progress < 50 && "Extracting text from document..."}
                    {progress >= 50 && progress < 90 && "Analyzing text with AI..."}
                    {progress >= 90 && "Finalizing profile..."}
                  </p>
                </div>
              )}
            </div>
          )}

          {file && !isProcessing && (
            <Button
              onClick={handleUpload}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-lg py-6 shadow-lg hover:shadow-xl transition-all"
              size="lg"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Process Resume & Create Profile
            </Button>
          )}

          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <Loader2 className="w-4 h-4" />
              What happens next?
            </h4>
            <ul className="space-y-1 text-sm text-blue-800">
              <li>• AI extracts your experience, education, and skills</li>
              <li>• We generate a professional summary</li>
              <li>• You can review and edit all information</li>
              <li>• Start discovering perfectly matched job opportunities</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
