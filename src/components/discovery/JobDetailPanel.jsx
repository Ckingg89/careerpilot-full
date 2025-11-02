
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, MapPin, Clock, DollarSign, TrendingUp } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { JobApplication } from "@/api/entities";

export default function JobDetailPanel({ job, profile, onClose, onAppliedOrSaved }) {

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
    onClose();
  };


  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center">
              <span className="text-2xl font-bold text-gray-600">{job.company[0]}</span>
            </div>
            <div>
              <DialogTitle className="text-2xl">{job.job_title}</DialogTitle>
              <p className="text-gray-600 font-medium">{job.company}</p>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-6 pr-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                <MapPin className="w-3 h-3 mr-1" />
                {job.location_type} - {job.location}
              </Badge>
              <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                {job.job_type}
              </Badge>
              {job.pay_estimate && (
                <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200">
                  <DollarSign className="w-3 h-3 mr-1" />
                  {job.pay_estimate}
                </Badge>
              )}
              <Badge variant="secondary" className="bg-gray-50 text-gray-700 border-gray-200">
                <Clock className="w-3 h-3 mr-1" />
                Posted {job.date_posted}
              </Badge>
            </div>

            <div className="grid grid-cols-4 gap-4 bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-xl">
               <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-1">{job.pay_potential}</div>
                <div className="text-sm text-gray-600">Pay Potential</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-1">{job.fit_score}</div>
                <div className="text-sm text-gray-600">Match Score</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-1">{job.response_rate}</div>
                <div className="text-sm text-gray-600">Response Rate</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-amber-600 mb-1">{job.growth_index}</div>
                <div className="text-sm text-gray-600">Growth Index</div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Job Description</h3>
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {job.job_description}
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Why This Role Matches You
              </h3>
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• Your skills in {profile.skills.slice(0, 3).join(", ")} are highly relevant</li>
                  <li>• Experience level aligns with role requirements</li>
                  <li>• Company culture matches your career goals</li>
                  <li>• Strong growth potential in this position</li>
                </ul>
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button
            onClick={handleApply}
            className="bg-gradient-to-r from-green-600 to-emerald-500"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Apply Now
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
