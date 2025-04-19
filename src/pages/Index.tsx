
import { Button } from "@/components/ui/button"
import { Bot } from "lucide-react"
import { DashboardHeader } from "@/components/dashboard/DashboardHeader"
import { StatsCards } from "@/components/dashboard/StatsCards"
import { ActivityFeed } from "@/components/dashboard/ActivityFeed"
import DashboardLayout from "@/components/layout/DashboardLayout"

export default function Index() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <DashboardHeader />
        <StatsCards />
        <ActivityFeed />
        
        {/* Chatbot Flutuante */}
        <div className="fixed bottom-6 right-6">
          <Button size="icon" className="glass w-12 h-12 rounded-full shadow-lg hover:bg-white/10 transition-all duration-200">
            <Bot className="h-6 w-6 text-[#38bdf8]" />
          </Button>
        </div>
      </div>
    </DashboardLayout>
  )
}
