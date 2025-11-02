
import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Save, Plus, Building, MapPin as MapPinIcon, CalendarDays, Briefcase } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";

const TagInput = ({ value, onChange, placeholder }) => {
  const [inputValue, setInputValue] = useState("");

  const handleAdd = () => {
    if (inputValue && !value.includes(inputValue)) {
      onChange([...value, inputValue]);
      setInputValue("");
    }
  };

  const handleRemove = (tagToRemove) => {
    onChange(value.filter(tag => tag !== tagToRemove));
  };

  return (
    <div>
      <div className="flex gap-2 mb-2">
        <Input
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAdd())}
        />
        <Button type="button" variant="outline" size="icon" onClick={handleAdd}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {value.map(item => (
          <Badge key={item} variant="secondary" className="flex items-center gap-1">
            {item}
            <button onClick={() => handleRemove(item)} className="rounded-full hover:bg-gray-300">
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}
      </div>
    </div>
  );
};


export default function FilterPanel({ profile, onClose, onUpdateProfile }) {
  const [filters, setFilters] = useState(profile.job_preferences || {
    location_type: [],
    date_posted: "30 days",
    cities: [],
    job_type: [],
    preferred_companies: []
  });

  const handleSave = async () => {
    // This is the definitive fix.
    // It ensures that no matter what, the raw_text from the original profile object is preserved.
    // It creates a new object containing all original data and merges the updated preferences.
    const dataToUpdate = {
      ...profile, // This includes the essential `raw_text` and all other fields.
      job_preferences: filters, // This overwrites just the preferences part.
    };

    // This removes any doubt about the data being sent.
    const updatedProfile = await base44.entities.UserProfile.update(profile.id, dataToUpdate);
    onUpdateProfile(updatedProfile);
    onClose();
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleFilterArray = (key, value) => {
    const current = filters[key] || [];
    const updated = current.includes(value)
      ? current.filter(t => t !== value)
      : [...current, value];
    handleFilterChange(key, updated);
  };
  
  const jobTypes = ["Full-time", "Part-time", "Contract", "Internship", "Freelance", "Seasonal", "Temporary", "Apprenticeship"];

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card className="glass-card p-6 mb-6 shadow-xl border-2 border-blue-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900">Job Search Filters</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="space-y-3">
            <Label className="text-base font-semibold flex items-center gap-2"><MapPinIcon className="w-4 h-4" /> Location Type</Label>
            {["Remote", "Hybrid", "On-site"].map((type) => (
              <div key={type} className="flex items-center space-x-2">
                <Checkbox
                  id={`loc-${type}`}
                  checked={(filters.location_type || []).includes(type)}
                  onCheckedChange={() => toggleFilterArray('location_type', type)}
                />
                <Label htmlFor={`loc-${type}`} className="cursor-pointer">{type}</Label>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <Label className="text-base font-semibold flex items-center gap-2"><Briefcase className="w-4 h-4" /> Job Type</Label>
            <div className="max-h-32 overflow-y-auto pr-2 space-y-3">
              {jobTypes.map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={`job-${type}`}
                    checked={(filters.job_type || []).includes(type)}
                    onCheckedChange={() => toggleFilterArray('job_type', type)}
                  />
                  <Label htmlFor={`job-${type}`} className="cursor-pointer">{type}</Label>
                </div>
              ))}
            </div>
          </div>
          
          <div className="space-y-3">
            <Label className="text-base font-semibold flex items-center gap-2"><CalendarDays className="w-4 h-4" /> Date Posted</Label>
            <Select value={filters.date_posted} onValueChange={(value) => handleFilterChange('date_posted', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1 day">Last 24 hours</SelectItem>
                <SelectItem value="7 days">Last 7 days</SelectItem>
                <SelectItem value="30 days">Last 30 days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3 lg:col-span-2">
            <Label className="text-base font-semibold flex items-center gap-2"><MapPinIcon className="w-4 h-4" /> Cities</Label>
            <TagInput
              value={filters.cities || []}
              onChange={(value) => handleFilterChange('cities', value)}
              placeholder="e.g., San Francisco"
            />
          </div>

          <div className="space-y-3 lg:col-span-3">
            <Label className="text-base font-semibold flex items-center gap-2"><Building className="w-4 h-4" /> Preferred Companies</Label>
            <TagInput
              value={filters.preferred_companies || []}
              onChange={(value) => handleFilterChange('preferred_companies', value)}
              placeholder="e.g., Google"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} className="bg-gradient-to-r from-blue-600 to-cyan-500">
            <Save className="w-4 h-4 mr-2" />
            Save & Refresh
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}
