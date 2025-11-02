import React, { useState, useEffect, useCallback } from "react";
import { JobApplication } from "@/api/entities";
import { User } from "@/api/entities";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

import ApplicationCard from "../components/applications/ApplicationCard";

export default function MyApplications() {
  const [applications, setApplications] = useState([]);
  const [filteredApps, setFilteredApps] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const filterApplications = useCallback(() => {
    let filtered = applications;

    if (activeTab !== "all") {
      filtered = filtered.filter(app => app.status === activeTab);
    }

    if (searchQuery) {
      filtered = filtered.filter(app =>
        app.job_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.company.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredApps(filtered);
  }, [applications, activeTab, searchQuery]);

  useEffect(() => {
    loadApplications();
  }, []);

  useEffect(() => {
    filterApplications();
  }, [filterApplications]);

  const loadApplications = async () => {
    setIsLoading(true);
    try {
      const user = await User.me();
      const apps = await JobApplication.filter({ created_by: user.email }, "-created_date");
      setApplications(apps);
    } catch (error) {
      console.error("Error loading applications:", error);
    }
    setIsLoading(false);
  };

  const statusCounts = {
    all: applications.length,
    saved: applications.filter(a => a.status === "saved").length,
    applied: applications.filter(a => a.status === "applied").length,
    interviewing: applications.filter(a => a.status === "interviewing").length,
    offered: applications.filter(a => a.status === "offered").length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/30 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">My Applications</h1>
          <p className="text-gray-600">Track all your job applications in one place</p>
        </div>

        <div className="mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
            <TabsList className="grid grid-cols-5 w-full md:w-auto bg-white border-2 border-gray-100">
              <TabsTrigger value="all" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-500 data-[state=active]:text-white">
                All <Badge variant="secondary" className="ml-1">{statusCounts.all}</Badge>
              </TabsTrigger>
              <TabsTrigger value="saved">
                Saved <Badge variant="secondary" className="ml-1">{statusCounts.saved}</Badge>
              </TabsTrigger>
              <TabsTrigger value="applied">
                Applied <Badge variant="secondary" className="ml-1">{statusCounts.applied}</Badge>
              </TabsTrigger>
              <TabsTrigger value="interviewing">
                Interviews <Badge variant="secondary" className="ml-1">{statusCounts.interviewing}</Badge>
              </TabsTrigger>
              <TabsTrigger value="offered">
                Offers <Badge variant="secondary" className="ml-1">{statusCounts.offered}</Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by company or title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-2 focus:border-blue-500"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-white rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filteredApps.length > 0 ? (
          <div className="grid gap-4">
            {filteredApps.map((app) => (
              <ApplicationCard key={app.id} application={app} onUpdate={loadApplications} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-12 h-12 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No applications found</h3>
            <p className="text-gray-600">Start discovering jobs to build your application pipeline</p>
          </div>
        )}
      </div>
    </div>
  );
}