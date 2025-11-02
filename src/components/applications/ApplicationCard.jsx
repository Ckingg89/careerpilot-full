import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Calendar, MapPin } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

export default function ApplicationCard({ application, onUpdate }) {
  const statusColors = {
    saved: "bg-gray-100 text-gray-700 border-gray-300",
    applied: "bg-blue-100 text-blue-700 border-blue-300",
    responded: "bg-green-100 text-green-700 border-green-300",
    interviewing: "bg-purple-100 text-purple-700 border-purple-300",
    offered: "bg-amber-100 text-amber-700 border-amber-300",
    rejected: "bg-red-100 text-red-700 border-red-300",
    accepted: "bg-emerald-100 text-emerald-700 border-emerald-300"
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="glass-card hover:shadow-xl transition-all duration-300 p-6">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="flex gap-4 flex-1">
            <div className="w-14 h-14 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-xl font-bold text-gray-600">
                {application.company[0]}
              </span>
            </div>

            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-1">
                {application.job_title}
              </h3>
              <p className="text-gray-700 font-medium mb-2">{application.company}</p>

              <div className="flex flex-wrap gap-2 mb-3">
                <Badge variant="secondary" className={`${statusColors[application.status]} border`}>
                  {application.status.replace('_', ' ').toUpperCase()}
                </Badge>
                <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                  <MapPin className="w-3 h-3 mr-1" />
                  {application.location_type}
                </Badge>
                {application.applied_date && (
                  <Badge variant="secondary" className="bg-gray-50 text-gray-700 border-gray-200">
                    <Calendar className="w-3 h-3 mr-1" />
                    Applied {format(new Date(application.applied_date), 'MMM d, yyyy')}
                  </Badge>
                )}
              </div>

              <p className="text-gray-600 text-sm line-clamp-2">
                {application.job_description}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 md:w-auto">
            <Button
              onClick={() => window.open(application.application_url, '_blank')}
              variant="outline"
              size="sm"
              className="border-2 hover:border-blue-500"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View Job
            </Button>
            {application.cover_letter && (
              <Button
                variant="outline"
                size="sm"
                className="border-2"
              >
                View Materials
              </Button>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}