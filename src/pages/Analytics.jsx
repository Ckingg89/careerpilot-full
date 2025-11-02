import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Clock, Target, Briefcase, Award } from "lucide-react";

import StatsCard from "../components/analytics/StatsCard";
import ApplicationTimeline from "../components/analytics/ApplicationTimeline";
import CompanyFrequency from "../components/analytics/CompanyFrequency";
import ResponseChart from "../components/analytics/ResponseChart";

export default function Analytics() {
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const user = await base44.auth.me();
      // Fetch all applications
      const allApps = await base44.entities.JobApplication.filter({ created_by: user.email }, "-created_date");
      // Filter for actual applications (not just discovered/saved)
      const actualApplications = allApps.filter(app => !['discovered', 'saved'].includes(app.status));
      setApplications(actualApplications);
    } catch (error) {
      console.error("Error loading analytics:", error);
    }
    setIsLoading(false);
  };

  const stats = {
    totalApplications: applications.length,
    responded: applications.filter(a => a.status === "responded" || a.status === "interviewing").length,
    interviews: applications.filter(a => a.status === "interviewing").length,
    offers: applications.filter(a => a.status === "offered").length,
    responseRate: applications.length > 0 
      ? Math.round((applications.filter(a => a.response_date).length / applications.length) * 100)
      : 0,
    avgResponseTime: calculateAvgResponseTime(applications),
  };

  function calculateAvgResponseTime(apps) {
    const responded = apps.filter(a => a.applied_date && a.response_date);
    if (responded.length === 0) return "N/A";
    
    const totalDays = responded.reduce((sum, app) => {
      const applied = new Date(app.applied_date);
      const responded = new Date(app.response_date);
      return sum + Math.floor((responded - applied) / (1000 * 60 * 60 * 24));
    }, 0);
    
    return `${Math.round(totalDays / responded.length)} days`;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/30 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Your Job Search Analytics</h1>
          <p className="text-gray-600">Track your progress and optimize your application strategy</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatsCard
            title="Applications Sent"
            value={stats.totalApplications}
            icon={Briefcase}
            gradient="from-blue-500 to-cyan-400"
            trend={applications.filter(a => {
              const weekAgo = new Date();
              weekAgo.setDate(weekAgo.getDate() - 7);
              return new Date(a.created_date) > weekAgo;
            }).length + " this week"}
          />
          <StatsCard
            title="Response Rate"
            value={`${stats.responseRate}%`}
            icon={TrendingUp}
            gradient="from-green-500 to-emerald-400"
            trend={stats.responded + " responses"}
          />
          <StatsCard
            title="Interviews"
            value={stats.interviews}
            icon={Target}
            gradient="from-purple-500 to-pink-400"
            trend={stats.offers + " offers received"}
          />
          <StatsCard
            title="Avg Response Time"
            value={stats.avgResponseTime}
            icon={Clock}
            gradient="from-orange-500 to-amber-400"
          />
          <StatsCard
            title="Active Applications"
            value={applications.filter(a => a.status === "applied" || a.status === "interviewing").length}
            icon={BarChart3}
            gradient="from-indigo-500 to-blue-400"
          />
          <StatsCard
            title="Success Rate"
            value={applications.length > 0 ? `${Math.round((stats.offers / stats.totalApplications) * 100)}%` : "0%"}
            icon={Award}
            gradient="from-pink-500 to-rose-400"
            trend="Offers to applications"
          />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <ApplicationTimeline applications={applications} isLoading={isLoading} />
          <CompanyFrequency applications={applications} isLoading={isLoading} />
        </div>

        <div className="mt-6">
          <ResponseChart applications={applications} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}