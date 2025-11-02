import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Clock } from "lucide-react";

export default function ApplicationTimeline({ applications, isLoading }) {
  const recentApps = applications
    .filter(a => a.applied_date)
    .sort((a, b) => new Date(b.applied_date) - new Date(a.applied_date))
    .slice(0, 5);

  return (
    <Card className="glass-card shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-600" />
          Recent Applications
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2" />
                <div className="h-3 bg-gray-100 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : recentApps.length > 0 ? (
          <div className="space-y-4">
            {recentApps.map((app) => (
              <div
                key={app.id}
                className="flex items-start gap-3 p-3 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-100"
              >
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{app.job_title}</p>
                  <p className="text-sm text-gray-600">{app.company}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {format(new Date(app.applied_date), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No applications yet</p>
        )}
      </CardContent>
    </Card>
  );
}