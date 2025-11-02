import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { motion } from "framer-motion";

export default function StatsCard({ title, value, icon: Icon, gradient, trend }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="glass-card hover:shadow-xl transition-all duration-300 overflow-hidden">
        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${gradient} opacity-10 rounded-full transform translate-x-8 -translate-y-8`} />
        <CardHeader className="p-6 relative">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
              <div className="text-4xl font-bold text-gray-900">
                {value}
              </div>
              {trend && (
                <p className="text-sm text-gray-500 mt-2">{trend}</p>
              )}
            </div>
            <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} bg-opacity-20`}>
              <Icon className={`w-6 h-6 bg-gradient-to-br ${gradient} bg-clip-text text-transparent`} />
            </div>
          </div>
        </CardHeader>
      </Card>
    </motion.div>
  );
}