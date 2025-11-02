import React, { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { InvokeLLM } from "@/api/integrations";
import { Loader2, Mail, Copy, CheckCircle, ArrowRight } from "lucide-react";
import { JobApplication } from "@/api/entities";

export default function CoverLetterGenerator({ job, profile, onClose, onPrepared }) {
  const [coverLetter, setCoverLetter] = useState("");
  const [emailDraft, setEmailDraft] = useState("");
  const [hiringManager, setHiringManager] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [step, setStep] = useState(1);
  const [copied, setCopied] = useState(false);

  const generateCoverLetter = useCallback(async () => {
    setIsGenerating(true);
    try {
      const result = await InvokeLLM({
        prompt: `Write a compelling, professional cover letter for this job application.
        
        Job: ${job.job_title} at ${job.company}
        Job Description: ${job.job_description}
        
        Candidate Profile:
        - Experience: ${JSON.stringify(profile.experience)}
        - Skills: ${profile.skills.join(", ")}
        - Education: ${JSON.stringify(profile.education)}
        - Summary: ${profile.professional_summary}
        
        Make it personalized, highlighting relevant experience and skills. Keep it concise (3-4 paragraphs).
        Use a professional but warm tone. Don't include the address block or date - just the letter body.`
      });

      setCoverLetter(result);
    } catch (error) {
      console.error("Error generating cover letter:", error);
    }
    setIsGenerating(false);
  }, [job, profile]);

  useEffect(() => {
    generateCoverLetter();
  }, [generateCoverLetter]);

  const generateEmail = async () => {
    setIsGenerating(true);
    try {
      const managerResult = await InvokeLLM({
        prompt: `Based on the company "${job.company}" and role "${job.job_title}", suggest a realistic hiring manager contact. 
        If this is a well-known company, use real information. Otherwise, create a realistic example.`,
        response_json_schema: {
          type: "object",
          properties: {
            name: { type: "string" },
            email: { type: "string" },
            title: { type: "string" }
          }
        }
      });

      setHiringManager(managerResult);

      const emailResult = await InvokeLLM({
        prompt: `Write a professional email to ${managerResult.name} (${managerResult.title}) about the ${job.job_title} position at ${job.company}.
        
        The email should:
        - Be concise and professional
        - Reference the specific role
        - Highlight 1-2 key qualifications
        - Express enthusiasm
        - Include a clear call to action
        - Be no more than 3 short paragraphs
        
        Candidate summary: ${profile.professional_summary}
        Top skills: ${profile.skills.slice(0, 5).join(", ")}
        
        Return ONLY the email body (no subject line, no signature).`
      });

      setEmailDraft(emailResult);
      setStep(2);
    } catch (error) {
      console.error("Error generating email:", error);
    }
    setIsGenerating(false);
  };

  const handleContinue = async () => {
    await generateEmail();
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleMarkApplied = async () => {
    let updatedJob;
    if (job.id) {
       updatedJob = await JobApplication.update(job.id, {
        status: "applied",
        applied_date: new Date().toISOString().split('T')[0],
        cover_letter: coverLetter,
        email_draft: emailDraft,
        hiring_manager_contact: hiringManager
      });
    } else {
       updatedJob = await JobApplication.create({
        ...job,
        status: "applied",
        applied_date: new Date().toISOString().split('T')[0],
        cover_letter: coverLetter,
        email_draft: emailDraft,
        hiring_manager_contact: hiringManager
      });
    }
    if (onPrepared) onPrepared(updatedJob);
    onClose();
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl gradient-text">
            {step === 1 ? "Your Cover Letter" : "Personalized Outreach Email"}
          </DialogTitle>
          <p className="text-gray-600">
            {step === 1 
              ? "Review and edit your AI-generated cover letter"
              : `Email to ${hiringManager?.name} - ${hiringManager?.title}`
            }
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {step === 1 ? (
            <>
              {isGenerating ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">Crafting your perfect cover letter...</p>
                  </div>
                </div>
              ) : (
                <>
                  <Textarea
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    className="min-h-[400px] font-serif text-base leading-relaxed"
                  />

                  <div className="flex justify-between items-center pt-4 border-t">
                    <Button variant="outline" onClick={onClose}>
                      Cancel
                    </Button>
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => handleCopy(coverLetter)}
                      >
                        {copied ? <CheckCircle className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                        {copied ? "Copied!" : "Copy"}
                      </Button>
                      <Button
                        onClick={handleContinue}
                        className="bg-gradient-to-r from-blue-600 to-cyan-500"
                      >
                        Continue to Email
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </>
          ) : (
            <>
              {isGenerating ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">Generating personalized email...</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-xl border-2 border-blue-100">
                    <p className="font-medium text-gray-900 mb-1">To: {hiringManager?.email}</p>
                    <p className="text-sm text-gray-600">
                      Subject: Application for {job.job_title} Position
                    </p>
                  </div>

                  <Textarea
                    value={emailDraft}
                    onChange={(e) => setEmailDraft(e.target.value)}
                    className="min-h-[300px] font-sans text-base leading-relaxed"
                  />

                  <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                    <p className="text-sm text-amber-900">
                      <strong>Next step:</strong> Copy this email and send it to {hiringManager?.email} 
                      or through the company's contact form. Mark as applied when done!
                    </p>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t">
                    <Button variant="outline" onClick={() => setStep(1)}>
                      Back to Cover Letter
                    </Button>
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => handleCopy(`To: ${hiringManager?.email}\nSubject: Application for ${job.job_title} Position\n\n${emailDraft}`)}
                      >
                        {copied ? <CheckCircle className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                        {copied ? "Copied!" : "Copy Email"}
                      </Button>
                      <Button
                        onClick={handleMarkApplied}
                        className="bg-gradient-to-r from-green-600 to-emerald-500"
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        Mark as Applied
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}