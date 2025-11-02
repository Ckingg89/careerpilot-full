
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, User, Briefcase, GraduationCap, Award } from "lucide-react";

export default function ProfileEditor({ profile, isEditing, onChange }) {
  const addExperience = () => {
    onChange({
      ...profile,
      experience: [...(profile.experience || []), {
        title: "",
        company: "",
        start_date: "",
        end_date: "",
        is_current: false,
        description: ""
      }]
    });
  };

  const removeExperience = (index) => {
    onChange({
      ...profile,
      experience: profile.experience.filter((_, i) => i !== index)
    });
  };

  const updateExperience = (index, field, value) => {
    const updatedExperience = [...(profile.experience || [])];
    updatedExperience[index] = { ...updatedExperience[index], [field]: value };
    // The error was here. It was spreading an incomplete object.
    // This ensures all original profile fields, including raw_text, are kept.
    onChange({ ...profile, experience: updatedExperience });
  };

  return (
    <div className="space-y-6">
      <Card className="glass-card shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            Professional Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <Textarea
              value={profile.professional_summary || ""}
              onChange={(e) => onChange({ ...profile, professional_summary: e.target.value })}
              className="min-h-[100px]"
            />
          ) : (
            <p className="text-gray-700 leading-relaxed">{profile.professional_summary}</p>
          )}
        </CardContent>
      </Card>

      <Card className="glass-card shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-blue-600" />
            Experience
          </CardTitle>
          {isEditing && (
            <Button onClick={addExperience} size="sm" variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Add
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {profile.experience?.map((exp, index) => (
            <div key={index} className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-100">
              {isEditing ? (
                <div className="space-y-3">
                  <div className="flex justify-end">
                    <Button
                      onClick={() => removeExperience(index)}
                      size="sm"
                      variant="ghost"
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <Label>Title</Label>
                      <Input
                        value={exp.title || ''}
                        onChange={(e) => updateExperience(index, 'title', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Company</Label>
                      <Input
                        value={exp.company || ''}
                        onChange={(e) => updateExperience(index, 'company', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Start Date</Label>
                      <Input
                        type="month"
                        value={exp.start_date || ''}
                        onChange={(e) => updateExperience(index, 'start_date', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>End Date</Label>
                      <Input
                        type="month"
                        value={exp.end_date || ''}
                        onChange={(e) => updateExperience(index, 'end_date', e.target.value)}
                        disabled={exp.is_current}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={exp.description || ''}
                      onChange={(e) => updateExperience(index, 'description', e.target.value)}
                    />
                  </div>
                </div>
              ) : (
                <>
                  <h4 className="font-bold text-gray-900">{exp.title}</h4>
                  <p className="text-gray-700 font-medium">{exp.company}</p>
                  <p className="text-sm text-gray-600 mb-2">
                    {exp.start_date} - {exp.is_current ? "Present" : exp.end_date}
                  </p>
                  <p className="text-gray-700 text-sm">{exp.description}</p>
                </>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="glass-card shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-blue-600" />
            Education
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {profile.education?.map((edu, index) => (
            <div key={index} className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-100">
              <h4 className="font-bold text-gray-900">{edu.program}</h4>
              <p className="text-gray-700">{edu.institution}</p>
              <p className="text-sm text-gray-600">{edu.field} • {edu.graduation_date}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="glass-card shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-blue-600" />
            Skills & Certifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="font-semibold mb-2 block">Skills</Label>
            <div className="flex flex-wrap gap-2">
              {profile.skills?.map((skill, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
          {profile.certifications && profile.certifications.length > 0 && (
            <div>
              <Label className="font-semibold mb-2 block">Certifications</Label>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                {profile.certifications.map((cert, index) => (
                  <li key={index}>{cert}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
