
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User, Briefcase, BarChart3, FolderKanban } from "lucide-react";

export default function Layout({ children }) {
  const location = useLocation();
  const navItems = [
    { href: createPageUrl("Profile"), label: "Profile", icon: User },
    { href: createPageUrl("JobDiscovery"), label: "Job Discovery", icon: Briefcase },
    { href: createPageUrl("MyApplications"), label: "My Applications", icon: FolderKanban },
    { href: createPageUrl("Analytics"), label: "Analytics", icon: BarChart3 },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-white border-b shadow-sm sticky top-0 z-10">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Briefcase className="w-8 h-8 text-blue-600" />
                <span className="ml-2 text-2xl font-bold text-gray-800">CareerPilot</span>
              </div>
              <div className="hidden sm:-my-px sm:ml-6 sm:flex sm:space-x-8">
                {navItems.map((item) => (
                  <Link
                    key={item.label}
                    to={item.href}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      location.pathname.startsWith(item.href)
                        ? 'border-blue-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <item.icon className="w-5 h-5 mr-2" />
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </nav>
      </header>
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
