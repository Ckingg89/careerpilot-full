import React, { useState, useEffect, useCallback, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { RefreshCw, SlidersHorizontal, ArrowUpDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

import WelcomeSetup from "../components/discovery/WelcomeSetup";
import FilterPanel from "../components/discovery/FilterPanel";
import JobCard from "../components/discovery/JobCard";
import JobDetailPanel from "../components/discovery/JobDetailPanel";
import { generateMatchingJobs } from "../components/utils/jobMatcher";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function JobDiscovery() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState("pay_potential");

  const fetchAndSaveNewJobs = useCallback(async (userProfile, userData) => {
    setIsRefreshing(true);
    const matchedJobs = await generateMatchingJobs(userProfile);
    
    const existingApps = await base44.entities.JobApplication.filter({ created_by: userData.email });
    const discoveredJobs = existingApps.filter(app => app.status === 'discovered');

    for (const job of discoveredJobs) {
      await base44.entities.JobApplication.delete(job.id);
    }
    
    const jobsToCreate = matchedJobs.map(job => ({ ...job, status: 'discovered' }));

    if (jobsToCreate.length > 0) {
       const createdJobs = await base44.entities.JobApplication.bulkCreate(jobsToCreate);
      setJobs(createdJobs);
    } else {
      setJobs([]);
    }
    setIsRefreshing(false);
  }, []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const userData = await base44.auth.me();
      setUser(userData);
      
      const profiles = await base44.entities.UserProfile.filter({ created_by: userData.email });
      if (profiles.length > 0) {
        const userProfile = profiles[0];
        setProfile(userProfile);
        
        const discoveredJobs = await base44.entities.JobApplication.filter({
          created_by: userData.email,
          status: 'discovered'
        }, "-created_date");

        if (discoveredJobs.length > 0) {
          setJobs(discoveredJobs);
        } else {
          await fetchAndSaveNewJobs(userProfile, userData);
        }
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setIsLoading(false);
  }, [fetchAndSaveNewJobs]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = async () => {
    if (!profile || !user) return;
    await fetchAndSaveNewJobs(profile, user);
  };

  const handleProfileCreated = async (newProfile) => {
    setProfile(newProfile);
    const userData = await base44.auth.me();
    setUser(userData);
    await fetchAndSaveNewJobs(newProfile, userData);
  };
  
  const handleJobAppliedOrSaved = (jobId) => {
    setJobs(prevJobs => prevJobs.filter(job => job.id !== jobId));
  };

  const sortedJobs = useMemo(() => {
    return [...jobs].sort((a, b) => (b[sortBy] || 0) - (a[sortBy] || 0));
  }, [jobs, sortBy]);


  if (!profile && !isLoading) {
    return <WelcomeSetup onProfileCreated={handleProfileCreated} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/30">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Discover Your Next Role
            </h1>
            <p className="text-gray-600">
              {jobs.length} perfectly matched opportunities waiting for you
            </p>
          </div>
          <div className="flex gap-3 w-full md:w-auto items-center">
            <div className="flex items-center gap-2">
               <ArrowUpDown className="w-4 h-4 mr-2 text-gray-500" />
               <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px] bg-white">
                  <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pay_potential">Pay Potential</SelectItem>
                  <SelectItem value="fit_score">Match Fit</SelectItem>
                  <SelectItem value="response_rate">Response Rate</SelectItem>
                  <SelectItem value="growth_index">Growth Potential</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex-1 md:flex-none border-2 hover:border-blue-500 hover:bg-blue-50 transition-all"
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Filters
            </Button>
            <Button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex-1 md:flex-none bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 shadow-lg hover:shadow-xl transition-all"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Finding...' : 'Refresh Jobs'}
            </Button>
          </div>
        </div>

        {showFilters && (
          <FilterPanel 
            profile={profile} 
            onClose={() => setShowFilters(false)}
            onUpdateProfile={(updatedProfile) => {
              setProfile(updatedProfile);
              handleRefresh();
            }}
          />
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-64 bg-white rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {sortedJobs.map((job, index) => (
              <JobCard
                key={job.id || index}
                job={job}
                onExpand={() => setSelectedJob(job)}
                profile={profile}
                onAppliedOrSaved={handleJobAppliedOrSaved}
              />
            ))}
          </div>
        )}

        {jobs.length === 0 && !isLoading && (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <RefreshCw className="w-12 h-12 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No jobs found</h3>
            <p className="text-gray-600 mb-6">Try adjusting your filters or refresh to find new opportunities</p>
            <Button onClick={handleRefresh} disabled={isRefreshing} className="bg-gradient-to-r from-blue-600 to-cyan-500">
              {isRefreshing ? 'Finding...' : 'Refresh Jobs'}
            </Button>
          </div>
        )}
      </div>

      {selectedJob && (
        <JobDetailPanel
          job={selectedJob}
          profile={profile}
          onClose={() => setSelectedJob(null)}
          onAppliedOrSaved={handleJobAppliedOrSaved}
        />
      )}
    </div>
  );
}