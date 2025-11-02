import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2 } from "lucide-react";

export default function CompanyFrequency({ applications, isLoading }) {
  const companyStats = applications.reduce((acc, app) => {
    acc[app.company] = (acc[app.company] || 0) + 1;
    return acc;
  }, {});

  const topCompanies = Object.entries(companyStats)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  return (
    <Card className="glass-card shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-blue-600" />
          Top Companies Applied
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2" />
              </div>
            ))}
          </div>
        ) : topCompanies.length > 0 ? (
          <div className="space-y-3">
            {topCompanies.map(([company, count], index) => (
              <div key={company} className="flex items-center justify-between p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    ['bg-blue-100', 'bg-green-100', 'bg-purple-100', 'bg-orange-100', 'bg-pink-100'][index]
                  }`}>
                    <span className={`text-sm font-bold ${
                      ['text-blue-600', 'text-green-600', 'text-purple-600', 'text-orange-600', 'text-pink-600'][index]
                    }`}>
                      {company[0]}
                    </span>
                  </div>
                  <span className="font-medium text-gray-900">{company}</span>
                </div>
                <span className="text-sm font-bold text-gray-700">{count} {count === 1 ? 'app' : 'apps'}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No data yet</p>
        )}
      </CardContent>
    </Card>
  );
}