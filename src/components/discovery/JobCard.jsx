
import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Sparkles, ChevronDown, MapPin, Clock, Bookmark, BookmarkCheck } from "lucide-react";
import { JobApplication } from "@/api/entities";
import { motion } from "framer-motion";

import CoverLetterGenerator from "./CoverLetterGenerator";

export default function JobCard({ job, onExpand, profile, onAppliedOrSaved }) {
  const [showCoverLetter, setShowCoverLetter] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = async () => {
    if (job.id) {
        await JobApplication.update(job.id, { status: "saved" });
    } else {
        await JobApplication.create({ ...job, status: "saved" });
    }
    setIsSaved(true);
    if(onAppliedOrSaved) onAppliedOrSaved(job.id);
  };

  const handleApply = async () => {
    if (job.id) {
        await JobApplication.update(job.id, {
            status: "applied",
            applied_date: new Date().toISOString().split('T')[0]
        });
    } else {
        await JobApplication.create({
            ...job,
            status: "applied",
            applied_date: new Date().toISOString().split('T')[0]
        });
    }
    window.open(job.application_url, '_blank');
    if(onAppliedOrSaved) onAppliedOrSaved(job.id);
  };
  
  const handlePrepared = (updatedJob) => {
    if(onAppliedOrSaved) onAppliedOrSaved(updatedJob.id);
  };

  const getScoreColor = (score) => {
    if (score >= 8) return "from-green-500 to-emerald-400";
    if (score >= 6) return "from-blue-500 to-cyan-400";
    if (score >= 4) return "from-yellow-500 to-amber-400";
    return "from-orange-500 to-red-400";
  };

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
        transition={{ duration: 0.3 }}
      >
        <Card className="glass-card hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-transparent hover:border-blue-200">
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center">
                    <span className="text-lg font-bold text-gray-600">
                      {job.company[0]}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{job.job_title}</h3>
                    <p className="text-sm font-medium text-gray-600">{job.company}</p>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSave}
                disabled={isSaved}
                className="text-gray-400 hover:text-blue-600"
              >
                {isSaved ? <BookmarkCheck className="w-5 h-5 text-blue-600" /> : <Bookmark className="w-5 h-5" />}
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                <MapPin className="w-3 h-3 mr-1" />
                {job.location_type}
              </Badge>
              <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                {job.job_type}
              </Badge>
              {job.pay_estimate && (
                <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200">
                  {job.pay_estimate}
                </Badge>
              )}
              <Badge variant="secondary" className="bg-gray-50 text-gray-700 border-gray-200">
                <Clock className="w-3 h-3 mr-1" />
                {job.date_posted}
              </Badge>
            </div>

            <p className="text-gray-600 text-sm mb-6 line-clamp-3">
              {job.job_description}
            </p>

            <div className="grid grid-cols-4 gap-3 mb-6">
              <div className="text-center">
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getScoreColor(job.pay_potential)} flex items-center justify-center mx-auto mb-1 shadow-lg`}>
                  <span className="text-white font-bold text-sm">{job.pay_potential}</span>
                </div>
                <p className="text-xs text-gray-600 font-medium">Pay</p>
              </div>
              <div className="text-center">
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getScoreColor(job.fit_score)} flex items-center justify-center mx-auto mb-1 shadow-lg`}>
                  <span className="text-white font-bold text-sm">{job.fit_score}</span>
                </div>
                <p className="text-xs text-gray-600 font-medium">Fit</p>
              </div>
              <div className="text-center">
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getScoreColor(job.response_rate)} flex items-center justify-center mx-auto mb-1 shadow-lg`}>
                  <span className="text-white font-bold text-sm">{job.response_rate}</span>
                </div>
                <p className="text-xs text-gray-600 font-medium">Response</p>
              </div>
              <div className="text-center">
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getScoreColor(job.growth_index)} flex items-center justify-center mx-auto mb-1 shadow-lg`}>
                  <span className="text-white font-bold text-sm">{job.growth_index}</span>
                </div>
                <p className="text-xs text-gray-600 font-medium">Growth</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Button
                onClick={() => setShowCoverLetter(true)}
                variant="outline"
                className="border-2 hover:border-blue-500 hover:bg-blue-50 transition-all"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Prepare
              </Button>
              <Button
                onClick={handleApply}
                className="bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Apply
              </Button>
              <Button
                onClick={onExpand}
                variant="outline"
                className="border-2 hover:border-purple-500 hover:bg-purple-50"
              >
                <ChevronDown className="w-4 h-4 mr-2" />
                Expand
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>

      {showCoverLetter && (
        <CoverLetterGenerator
          job={job}
          profile={profile}
          onClose={() => setShowCoverLetter(false)}
          onPrepared={handlePrepared}
        />
      )}
    </>
  );
}
