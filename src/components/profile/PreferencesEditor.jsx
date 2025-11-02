import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Settings } from "lucide-react";

export default function PreferencesEditor({ profile, isEditing, onChange }) {
  const toggleLocationType = (type) => {
    if (!isEditing) return;
    const current = profile.job_preferences?.location_type || [];
    const updated = current.includes(type)
      ? current.filter(t => t !== type)
      : [...current, type];
    onChange({
      ...profile,
      job_preferences: { ...profile.job_preferences, location_type: updated }
    });
  };

  const toggleJobType = (type) => {
    if (!isEditing) return;
    const current = profile.job_preferences?.job_type || [];
    const updated = current.includes(type)
      ? current.filter(t => t !== type)
      : [...current, type];
    onChange({
      ...profile,
      job_preferences: { ...profile.job_preferences, job_type: updated }
    });
  };

  return (
    <Card className="glass-card shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-600" />
          Job Preferences
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <Label className="font-semibold mb-3 block">Location Type</Label>
            <div className="space-y-3">
              {["Remote", "Hybrid", "On-site"].map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={`pref-loc-${type}`}
                    checked={(profile.job_preferences?.location_type || []).includes(type)}
                    onCheckedChange={() => toggleLocationType(type)}
                    disabled={!isEditing}
                  />
                  <Label htmlFor={`pref-loc-${type}`} className="cursor-pointer">{type}</Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label className="font-semibold mb-3 block">Job Type</Label>
            <div className="space-y-3">
              {["Full-time", "Part-time", "Contract", "Internship", "Freelance"].map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={`pref-job-${type}`}
                    checked={(profile.job_preferences?.job_type || []).includes(type)}
                    onCheckedChange={() => toggleJobType(type)}
                    disabled={!isEditing}
                  />
                  <Label htmlFor={`pref-job-${type}`} className="cursor-pointer">{type}</Label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}