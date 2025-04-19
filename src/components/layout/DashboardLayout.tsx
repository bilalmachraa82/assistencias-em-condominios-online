
import React from 'react';
import { Link } from "react-router-dom";
import { Sparkles, LogOut } from "lucide-react";

const menuItems = [
  { icon: Sparkles, label: 'Dashboard', href: '/' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex w-full bg-[#1A1F2C]">
      <main className="flex-1 p-8 overflow-hidden">
        <div className="container mx-auto max-w-6xl">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-2 text-white text-3xl font-bold">
              <Sparkles className="text-[#1EAEDB]" size={24} />
              ASSISTECH
            </div>
            <div className="flex items-center gap-2">
              <button className="h-9 px-3 glass text-white/80 hover:text-white hover:bg-white/10 rounded-md flex items-center gap-2">
                <LogOut className="h-4 w-4" />
                <span>Técnico</span>
              </button>
            </div>
          </div>
          
          <div>
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
