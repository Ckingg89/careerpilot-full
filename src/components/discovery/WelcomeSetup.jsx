import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Rocket, Target, BarChart3 } from "lucide-react";
import ResumeUpload from "../profile/ResumeUpload";

export default function WelcomeSetup({ onProfileCreated }) {
  const [showUpload, setShowUpload] = React.useState(false);

  if (showUpload) {
    return <ResumeUpload onProfileCreated={onProfileCreated} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/30 flex items-center justify-center p-4">
      <Card className="max-w-4xl w-full p-8 md:p-12 glass-card shadow-2xl">
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 gradient-text">
            Welcome to CareerPilot
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Your AI-powered career assistant
          </p>
          <p className="text-gray-500">
            Transform your job search from hours to minutes with intelligent automation
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Rocket className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Smart Discovery</h3>
            <p className="text-sm text-gray-600">
              AI finds the best-matching jobs based on your profile
            </p>
          </div>

          <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-400 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Target className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Auto-Generated Materials</h3>
            <p className="text-sm text-gray-600">
              Custom cover letters and outreach emails for every role
            </p>
          </div>

          <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-400 rounded-xl flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Track Everything</h3>
            <p className="text-sm text-gray-600">
              Analytics dashboard shows your progress and success rate
            </p>
          </div>
        </div>

        <div className="text-center">
          <Button
            size="lg"
            onClick={() => setShowUpload(true)}
            className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-lg px-8 py-6 shadow-xl hover:shadow-2xl transition-all"
          >
            Get Started - Upload Your Resume
          </Button>
          <p className="text-sm text-gray-500 mt-4">
            Your resume data is processed securely and never shared
          </p>
        </div>
      </Card>
    </div>
  );
}