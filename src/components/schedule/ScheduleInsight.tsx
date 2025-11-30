import { useState } from "react";
import { Sidebar } from "@/components/Layout/Sidebar";
import { Header } from "@/components/Layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  Users,
  Clock,
  DollarSign,
  Target,
  Lightbulb,
  Plus,
  Minus,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  BookOpen
} from "lucide-react";

// Forward-looking data for the next 4 weeks
const planningWeeks = [
  { 
    start: "Dec 9", 
    end: "Dec 15",
    status: "current",
    predictedRevenue: 21500,
    confidence: "high"
  },
  { 
    start: "Dec 16", 
    end: "Dec 22",
    status: "planning", 
    predictedRevenue: 28900, // Holiday week
    confidence: "high"
  },
  { 
    start: "Dec 23", 
    end: "Dec 29",
    status: "planning",
    predictedRevenue: 19200, // Holiday week - reduced
    confidence: "medium"
  },
  { 
    start: "Jan 6", 
    end: "Jan 12",
    status: "planning",
    predictedRevenue: 24800, // New year boost
    confidence: "medium"
  }
];

const demandForecast = [
  {
    day: "MON",
    date: "Dec 9",
    predicted: { hair: 12, nails: 8, spa: 4, massage: 3 },
    current_staff: { hair: 3, nails: 2, spa: 1, massage: 1 },
    recommended_staff: { hair: 3, nails: 2, spa: 1, massage: 1 },
    status: "optimal"
  },
  {
    day: "TUE", 
    date: "Dec 10",
    predicted: { hair: 15, nails: 12, spa: 6, massage: 4 },
    current_staff: { hair: 3, nails: 2, spa: 1, massage: 1 },
    recommended_staff: { hair: 4, nails: 3, spa: 2, massage: 1 },
    status: "understaffed"
  },
  {
    day: "WED",
    date: "Dec 11", 
    predicted: { hair: 18, nails: 14, spa: 8, massage: 5 },
    current_staff: { hair: 4, nails: 3, spa: 2, massage: 1 },
    recommended_staff: { hair: 4, nails: 3, spa: 2, massage: 2 },
    status: "minor_gap"
  },
  {
    day: "THU",
    date: "Dec 12",
    predicted: { hair: 20, nails: 16, spa: 10, massage: 6 },
    current_staff: { hair: 3, nails: 2, spa: 1, massage: 1 },
    recommended_staff: { hair: 5, nails: 4, spa: 3, massage: 2 },
    status: "critical"
  },
  {
    day: "FRI",
    date: "Dec 13",
    predicted: { hair: 22, nails: 18, spa: 12, massage: 7 },
    current_staff: { hair: 4, nails: 3, spa: 2, massage: 2 },
    recommended_staff: { hair: 5, nails: 4, spa: 3, massage: 2 },
    status: "minor_gap"
  },
  {
    day: "SAT",
    date: "Dec 14",
    predicted: { hair: 25, nails: 20, spa: 15, massage: 8 },
    current_staff: { hair: 5, nails: 4, spa: 3, massage: 2 },
    recommended_staff: { hair: 6, nails: 5, spa: 4, massage: 3 },
    status: "understaffed"
  },
  {
    day: "SUN",
    date: "Dec 15",
    predicted: { hair: 16, nails: 12, spa: 8, massage: 4 },
    current_staff: { hair: 4, nails: 3, spa: 2, massage: 1 },
    recommended_staff: { hair: 4, nails: 3, spa: 2, massage: 1 },
    status: "optimal"
  }
];

const staffAvailability = [
  {
    id: "1",
    name: "Emma",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face",
    skills: ["hair", "color"],
    availability: "full_time",
    timeOff: [],
    maxHours: 40,
    currentHours: 38,
    efficiency: 92
  },
  {
    id: "2", 
    name: "Amelia",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b776?w=40&h=40&fit=crop&crop=face",
    skills: ["hair", "extensions"],
    availability: "full_time", 
    timeOff: ["Dec 23-29"],
    maxHours: 40,
    currentHours: 35,
    efficiency: 88
  },
  {
    id: "3",
    name: "Bella",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face",
    skills: ["nails", "pedicure"],
    availability: "part_time",
    timeOff: [],
    maxHours: 25,
    currentHours: 22,
    efficiency: 85
  },
  {
    id: "4",
    name: "Charlotte",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face", 
    skills: ["spa", "massage"],
    availability: "full_time",
    timeOff: ["Dec 16"],
    maxHours: 40,
    currentHours: 42,
    efficiency: 90
  }
];

const recommendations = [
  {
    priority: "critical",
    title: "Hire Additional Nail Technician",
    description: "Saturday demand consistently exceeds capacity by 40%. Consider hiring 1 part-time nail tech.",
    impact: "+$2,400 weekly revenue",
    cost: "$600/week",
    timeframe: "2-3 weeks"
  },
  {
    priority: "high", 
    title: "Cross-train Bella for Hair Services",
    description: "Bella has availability and could cover Thursday hair demand gaps.",
    impact: "+15% Thursday efficiency",
    cost: "$200 training",
    timeframe: "1 week"
  },
  {
    priority: "medium",
    title: "Extend Friday Hours",
    description: "Friday 6-8pm shows strong demand potential based on booking attempts.",
    impact: "+$800 weekly revenue",
    cost: "$400 overtime",
    timeframe: "Immediate"
  },
  {
    priority: "low",
    title: "Optimize Tuesday Schedule", 
    description: "Current Tuesday staffing could be reduced by 1 person during 11am-2pm.",
    impact: "$200 weekly savings",
    cost: "$0",
    timeframe: "Next week"
  }
];

function getDayStatusColor(status: string) {
  switch (status) {
    case "optimal": return "bg-green-100 text-green-800 border-green-200";
    case "minor_gap": return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "understaffed": return "bg-orange-100 text-orange-800 border-orange-200";
    case "critical": return "bg-red-100 text-red-800 border-red-200";
    default: return "bg-gray-100 text-gray-600 border-gray-200";
  }
}

function getPriorityColor(priority: string) {
  switch (priority) {
    case "critical": return "bg-red-100 text-red-800 border-red-200";
    case "high": return "bg-orange-100 text-orange-800 border-orange-200"; 
    case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "low": return "bg-blue-100 text-blue-800 border-blue-200";
    default: return "bg-gray-100 text-gray-600 border-gray-200";
  }
}

function PlanningCalendar() {
  const [selectedWeek, setSelectedWeek] = useState(0);
  
  return (
    <div className="space-y-4">
      {/* Week Selector */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Weekly Planning View</h3>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setSelectedWeek(Math.max(0, selectedWeek - 1))}
            disabled={selectedWeek === 0}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium px-3">
            {planningWeeks[selectedWeek].start} - {planningWeeks[selectedWeek].end}
          </span>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setSelectedWeek(Math.min(planningWeeks.length - 1, selectedWeek + 1))}
            disabled={selectedWeek === planningWeeks.length - 1}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Daily Planning Grid */}
      <div className="grid grid-cols-8 gap-2">
        <div className="font-medium text-sm text-muted-foreground p-3">Services</div>
        {demandForecast.map((day) => (
          <div key={day.day} className="text-center p-2">
            <div className="font-semibold text-sm">{day.day}</div>
            <div className="text-xs text-muted-foreground">{day.date}</div>
          </div>
        ))}
        
        {/* Hair Services Row */}
        <div className="font-medium text-sm p-3 bg-muted/30 rounded">Hair</div>
        {demandForecast.map((day) => (
          <div key={`hair-${day.day}`} className={`p-2 rounded border text-xs ${getDayStatusColor(day.status)}`}>
            <div className="font-semibold">Demand: {day.predicted.hair}</div>
            <div className="flex items-center justify-between mt-1">
              <span>Current: {day.current_staff.hair}</span>
              <span>Need: {day.recommended_staff.hair}</span>
            </div>
          </div>
        ))}

        {/* Nails Services Row */}
        <div className="font-medium text-sm p-3 bg-muted/30 rounded">Nails</div>
        {demandForecast.map((day) => (
          <div key={`nails-${day.day}`} className={`p-2 rounded border text-xs ${getDayStatusColor(day.status)}`}>
            <div className="font-semibold">Demand: {day.predicted.nails}</div>
            <div className="flex items-center justify-between mt-1">
              <span>Current: {day.current_staff.nails}</span>
              <span>Need: {day.recommended_staff.nails}</span>
            </div>
          </div>
        ))}

        {/* Spa Services Row */}
        <div className="font-medium text-sm p-3 bg-muted/30 rounded">Spa</div>
        {demandForecast.map((day) => (
          <div key={`spa-${day.day}`} className={`p-2 rounded border text-xs ${getDayStatusColor(day.status)}`}>
            <div className="font-semibold">Demand: {day.predicted.spa}</div>
            <div className="flex items-center justify-between mt-1">
              <span>Current: {day.current_staff.spa}</span>
              <span>Need: {day.recommended_staff.spa}</span>
            </div>
          </div>
        ))}

        {/* Massage Services Row */}
        <div className="font-medium text-sm p-3 bg-muted/30 rounded">Massage</div>
        {demandForecast.map((day) => (
          <div key={`massage-${day.day}`} className={`p-2 rounded border text-xs ${getDayStatusColor(day.status)}`}>
            <div className="font-semibold">Demand: {day.predicted.massage}</div>
            <div className="flex items-center justify-between mt-1">
              <span>Current: {day.current_staff.massage}</span>
              <span>Need: {day.recommended_staff.massage}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StaffPlanning() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Staff Availability & Skills</h3>
      
      <div className="grid gap-4">
        {staffAvailability.map((staff) => (
          <Card key={staff.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={staff.avatar} alt={staff.name} />
                    <AvatarFallback>{staff.name.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{staff.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {staff.skills.join(", ")} • {staff.availability}
                    </div>
                    {staff.timeOff.length > 0 && (
                      <div className="text-xs text-orange-600 mt-1">
                        Time off: {staff.timeOff.join(", ")}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-sm font-medium">{staff.currentHours}h / {staff.maxHours}h</div>
                  <div className="text-xs text-muted-foreground">{staff.efficiency}% efficiency</div>
                  <div className="flex items-center gap-2 mt-2">
                    <Button size="sm" variant="outline">
                      <Plus className="w-3 h-3 mr-1" />
                      Add Hours
                    </Button>
                    <Button size="sm" variant="outline">
                      <BookOpen className="w-3 h-3 mr-1" />
                      Cross-train
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function RecommendationsEngine() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Lightbulb className="w-5 h-5" />
        AI Recommendations
      </h3>
      
      <div className="space-y-3">
        {recommendations.map((rec, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={getPriorityColor(rec.priority)}>
                      {rec.priority.toUpperCase()}
                    </Badge>
                    <span className="font-medium">{rec.title}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{rec.description}</p>
                  
                  <div className="grid grid-cols-3 gap-4 text-xs">
                    <div>
                      <span className="font-medium text-green-600">{rec.impact}</span>
                      <div className="text-muted-foreground">Impact</div>
                    </div>
                    <div>
                      <span className="font-medium">{rec.cost}</span>
                      <div className="text-muted-foreground">Cost</div>
                    </div>
                    <div>
                      <span className="font-medium">{rec.timeframe}</span>
                      <div className="text-muted-foreground">Timeline</div>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2 ml-4">
                  <Button size="sm" variant="outline">Decline</Button>
                  <Button size="sm">Implement</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

const Insight = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Layout */}
      <div className="lg:hidden">
        {/* Mobile Header */}
        <Header onMenuClick={() => setSidebarOpen(true)} />
        
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div 
              className="fixed inset-0 bg-background/80 backdrop-blur-sm" 
              onClick={() => setSidebarOpen(false)}
            />
            <div className="fixed left-0 top-0 h-full w-80 max-w-[85vw]">
              <Sidebar onClose={() => setSidebarOpen(false)} />
            </div>
          </div>
        )}
        
        {/* Mobile Content */}
        <main className="min-h-screen">
          <InsightContent />
        </main>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:flex min-h-screen">
        <Sidebar />
        
        <div className="flex-1 flex flex-col">
          <Header />
          <InsightContent />
        </div>
      </div>
    </div>
  );
};

// Separate component for the main content to avoid duplication
const InsightContent = () => {
  return (
    <div className="flex-1 bg-background min-h-screen">
      {/* Mobile-friendly Page Header */}
      <div className="sticky top-0 lg:top-16 z-30 bg-card/95 glass-effect border-b border-border/50">
        <div className="px-4 lg:px-6 py-4 lg:py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-xl lg:text-2xl font-semibold text-foreground tracking-tight">Planning Center</h1>
              <p className="text-sm text-muted-foreground mt-1">
                AI-powered staffing planning for the next 4 weeks
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                className="apple-transition hover:scale-105 apple-shadow-sm rounded-xl"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Next 4 Weeks
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="apple-transition hover:scale-105 apple-shadow-sm rounded-xl bg-primary/5 text-primary border-primary/30"
              >
                <Zap className="w-4 h-4 mr-2" />
                Auto-Schedule
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Key Planning Metrics - Mobile responsive grid */}
      <div className="px-4 lg:px-6 py-6 lg:py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
          <Card className="apple-shadow-md rounded-2xl border-border/50 hover:apple-shadow-lg apple-transition">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-foreground">Next Week Forecast</CardTitle>
              <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground tracking-tight">$21,500</div>
              <div className="flex items-center text-xs text-success mt-2">
                <ArrowUpRight className="w-3 h-3 mr-1" />
                +8.5% vs this week
              </div>
            </CardContent>
          </Card>

          <Card className="apple-shadow-md rounded-2xl border-border/50 hover:apple-shadow-lg apple-transition">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-foreground">Staffing Gaps</CardTitle>
              <div className="w-8 h-8 bg-destructive/10 rounded-xl flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground tracking-tight">5</div>
              <div className="flex items-center text-xs text-destructive mt-2">
                <ArrowDownRight className="w-3 h-3 mr-1" />
                Thu & Sat critical
              </div>
            </CardContent>
          </Card>

          <Card className="apple-shadow-md rounded-2xl border-border/50 hover:apple-shadow-lg apple-transition">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-foreground">Available Hours</CardTitle>
              <div className="w-8 h-8 bg-light-blue-foreground/10 rounded-xl flex items-center justify-center">
                <Clock className="h-4 w-4 text-light-blue-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground tracking-tight">147h</div>
              <div className="text-xs text-muted-foreground mt-2">
                Need 180h for optimal
              </div>
            </CardContent>
          </Card>

          <Card className="apple-shadow-md rounded-2xl border-border/50 hover:apple-shadow-lg apple-transition">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-foreground">Optimization Score</CardTitle>
              <div className="w-8 h-8 bg-warning/10 rounded-xl flex items-center justify-center">
                <Target className="h-4 w-4 text-warning" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground tracking-tight">73%</div>
              <div className="text-xs text-warning mt-2">
                Can improve +$2,400
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mobile-friendly Tabs */}
        <Tabs defaultValue="planning" className="space-y-6">
          <div className="overflow-x-auto">
            <TabsList className="grid w-full grid-cols-3 min-w-fit bg-muted/50 rounded-2xl p-1">
              <TabsTrigger 
                value="planning"
                className="rounded-xl apple-transition data-[state=active]:bg-card data-[state=active]:apple-shadow-sm"
              >
                <span className="hidden sm:inline">Weekly Planning</span>
                <span className="sm:hidden">Planning</span>
              </TabsTrigger>
              <TabsTrigger 
                value="staff"
                className="rounded-xl apple-transition data-[state=active]:bg-card data-[state=active]:apple-shadow-sm"
              >
                <span className="hidden sm:inline">Staff Management</span>
                <span className="sm:hidden">Staff</span>
              </TabsTrigger>
              <TabsTrigger 
                value="recommendations"
                className="rounded-xl apple-transition data-[state=active]:bg-card data-[state=active]:apple-shadow-sm"
              >
                <span className="hidden sm:inline">Recommendations</span>
                <span className="sm:hidden">AI Tips</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="planning" className="space-y-6">
            <PlanningCalendar />
          </TabsContent>

          <TabsContent value="staff" className="space-y-6">
            <StaffPlanning />
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-6">
            <RecommendationsEngine />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Insight;