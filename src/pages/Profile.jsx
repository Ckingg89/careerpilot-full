
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Loader2, Save, Edit } from "lucide-react";
import ResumeUpload from "../components/profile/ResumeUpload";
import ProfileEditor from "../components/profile/ProfileEditor";
import PreferencesEditor from "../components/profile/PreferencesEditor";

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState(null);

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => base44.auth.me(),
  });

  const { data: profile, isLoading: isLoadingProfile, refetch } = useQuery({
    queryKey: ["userProfile", user?.id],
    queryFn: () => base44.entities.UserProfile.filter({ created_by: user.email }).then(res => res[0]),
    enabled: !!user,
    onSuccess: (data) => {
      if (data) {
        setEditedProfile(JSON.parse(JSON.stringify(data)));
      }
    }
  });

  const updateProfileMutation = useMutation({
    mutationFn: ({ id, profileData }) => base44.entities.UserProfile.update(id, profileData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      setIsEditing(false);
    },
  });

  const handleSave = () => {
    if (profile && editedProfile) {
      updateProfileMutation.mutate({ id: profile.id, profileData: editedProfile });
    }
  };
  
  const handleCancel = () => {
    setEditedProfile(JSON.parse(JSON.stringify(profile)));
    setIsEditing(false);
  };
  
  const handleProfileCreated = () => {
    refetch();
  }

  if (isLoadingProfile) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  if (!profile && !isLoadingProfile) {
    return <ResumeUpload onProfileCreated={handleProfileCreated} />;
  }

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/30 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Your Professional Profile</h1>
          {isEditing ? (
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancel}>Cancel</Button>
              <Button onClick={handleSave} disabled={updateProfileMutation.isLoading}>
                {updateProfileMutation.isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save
              </Button>
            </div>
          ) : (
            <Button onClick={() => setIsEditing(true)}><Edit className="w-4 h-4 mr-2" />Edit Profile</Button>
          )}
        </div>

        <div className="space-y-8">
          <ProfileEditor 
            profile={editedProfile || profile} 
            isEditing={isEditing}
            onChange={setEditedProfile}
          />
          <PreferencesEditor 
            profile={editedProfile || profile}
            isEditing={isEditing}
            onChange={setEditedProfile}
          />
        </div>
      </div>
    </div>
  );
}
