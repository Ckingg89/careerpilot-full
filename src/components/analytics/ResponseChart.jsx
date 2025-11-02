import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

export default function ResponseChart({ applications, isLoading }) {
  const statusCounts = {
    total: applications.length,
    applied: applications.filter(a => a.status === "applied").length,
    responded: applications.filter(a => a.status === "responded" || a.response_date).length,
    interviewing: applications.filter(a => a.status === "interviewing").length,
    offered: applications.filter(a => a.status === "offered").length,
  };

  const getPercentage = (count) => {
    return statusCounts.total > 0 ? Math.round((count / statusCounts.total) * 100) : 0;
  };

  return (
    <Card className="glass-card shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          Application Pipeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-64 bg-gray-100 animate-pulse rounded-xl" />
        ) : statusCounts.total > 0 ? (
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Applied</span>
                <span className="text-sm text-gray-600">{statusCounts.applied} ({getPercentage(statusCounts.applied)}%)</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-blue-500 to-cyan-400 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${getPercentage(statusCounts.applied)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Responded</span>
                <span className="text-sm text-gray-600">{statusCounts.responded} ({getPercentage(statusCounts.responded)}%)</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-green-500 to-emerald-400 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${getPercentage(statusCounts.responded)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Interviewing</span>
                <span className="text-sm text-gray-600">{statusCounts.interviewing} ({getPercentage(statusCounts.interviewing)}%)</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-purple-500 to-pink-400 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${getPercentage(statusCounts.interviewing)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Offers</span>
                <span className="text-sm text-gray-600">{statusCounts.offered} ({getPercentage(statusCounts.offered)}%)</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-amber-500 to-orange-400 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${getPercentage(statusCounts.offered)}%` }}
                />
              </div>
            </div>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-12">Start applying to see your pipeline</p>
        )}
      </CardContent>
    </Card>
  );
}