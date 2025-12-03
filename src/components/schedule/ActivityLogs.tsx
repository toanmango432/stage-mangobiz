import { useState, useMemo } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import {
  Search,
  Download,
  Clock,
  Settings,
  AlertTriangle,
  CheckCircle,
  Info,
  Edit,
  Plus
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export interface ActivityLogEntry {
  id: string;
  timestamp: Date;
  action: string;
  category: "schedule" | "timeoff" | "staff" | "settings" | "system";
  severity: "info" | "warning" | "error" | "success";
  user: {
    id: string;
    name: string;
    avatar?: string;
    initials: string;
  };
  target?: {
    type: "employee" | "schedule" | "timeoff_request" | "setting";
    id: string;
    name: string;
  };
  details: string;
  metadata?: Record<string, any>;
}

// Mock activity data - in real app this would come from an API
const mockActivityLogs: ActivityLogEntry[] = [
  {
    id: "1",
    timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
    action: "Schedule Updated",
    category: "schedule",
    severity: "success",
    user: { id: "mgr1", name: "Sarah Manager", initials: "SM" },
    target: { type: "employee", id: "emp1", name: "John Smith" },
    details: "Updated weekly schedule: added 4-hour shift on Friday",
    metadata: { oldHours: 32, newHours: 36, day: "Friday" }
  },
  {
    id: "2",
    timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
    action: "Time Off Approved",
    category: "timeoff",
    severity: "info",
    user: { id: "mgr1", name: "Sarah Manager", initials: "SM" },
    target: { type: "timeoff_request", id: "to1", name: "Personal Day Request" },
    details: "Approved Emma Wilson's personal day request for March 15th",
    metadata: { requestDate: "2024-03-15", reason: "Personal" }
  },
  {
    id: "3",
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    action: "New Employee Added",
    category: "staff",
    severity: "success",
    user: { id: "mgr1", name: "Sarah Manager", initials: "SM" },
    target: { type: "employee", id: "emp15", name: "Alex Johnson" },
    details: "Added new stylist to the team with part-time schedule",
    metadata: { position: "Stylist", status: "Part-time" }
  },
  {
    id: "4",
    timestamp: new Date(Date.now() - 1000 * 60 * 45), // 45 minutes ago
    action: "Overtime Alert",
    category: "schedule",
    severity: "warning",
    user: { id: "system", name: "System", initials: "SY" },
    target: { type: "employee", id: "emp5", name: "Grace Miller" },
    details: "Employee scheduled for 42 hours this week (exceeds 40h threshold)",
    metadata: { scheduledHours: 42, threshold: 40 }
  },
  {
    id: "5",
    timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
    action: "Settings Changed",
    category: "settings",
    severity: "info",
    user: { id: "mgr1", name: "Sarah Manager", initials: "SM" },
    details: "Updated full-time criteria: minimum hours changed from 32 to 35",
    metadata: { setting: "fullTimeHours", oldValue: 32, newValue: 35 }
  },
  {
    id: "6",
    timestamp: new Date(Date.now() - 1000 * 60 * 90), // 1.5 hours ago
    action: "Schedule Conflict Resolved",
    category: "schedule",
    severity: "warning",
    user: { id: "mgr2", name: "Mike Assistant", initials: "MA" },
    target: { type: "employee", id: "emp3", name: "Charlotte Johnson" },
    details: "Resolved scheduling conflict: moved 2pm appointment to avoid double-booking",
    metadata: { originalTime: "2:00 PM", newTime: "3:30 PM" }
  },
  {
    id: "7",
    timestamp: new Date(Date.now() - 1000 * 60 * 120), // 2 hours ago
    action: "Bulk Schedule Import",
    category: "schedule",
    severity: "success",
    user: { id: "mgr1", name: "Sarah Manager", initials: "SM" },
    details: "Imported schedules for 8 employees from CSV file",
    metadata: { employeeCount: 8, fileName: "march_schedule.csv" }
  },
  {
    id: "8",
    timestamp: new Date(Date.now() - 1000 * 60 * 180), // 3 hours ago
    action: "Time Off Denied",
    category: "timeoff",
    severity: "error",
    user: { id: "mgr1", name: "Sarah Manager", initials: "SM" },
    target: { type: "timeoff_request", id: "to2", name: "Vacation Request" },
    details: "Denied Julia Thompson's vacation request due to insufficient coverage",
    metadata: { requestDates: "2024-03-20 to 2024-03-22", reason: "Insufficient coverage" }
  }
];

const categoryColors = {
  schedule: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  timeoff: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  staff: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  settings: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  system: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
};

const severityIcons = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: AlertTriangle
};

const severityColors = {
  info: "text-blue-500",
  success: "text-green-500",
  warning: "text-amber-500",
  error: "text-red-500"
};

const actionIcons = {
  "Schedule Updated": Edit,
  "Time Off Approved": CheckCircle,
  "Time Off Denied": AlertTriangle,
  "New Employee Added": Plus,
  "Settings Changed": Settings,
  "Schedule Conflict Resolved": AlertTriangle,
  "Bulk Schedule Import": Download,
  "Overtime Alert": Clock,
  default: Info
};

export function ActivityLogs() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");

  const filteredLogs = useMemo(() => {
    return mockActivityLogs.filter(log => {
      const matchesSearch = 
        log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.target?.name.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = categoryFilter === "all" || log.category === categoryFilter;
      const matchesSeverity = severityFilter === "all" || log.severity === severityFilter;

      return matchesSearch && matchesCategory && matchesSeverity;
    });
  }, [searchQuery, categoryFilter, severityFilter]);

  const handleExportLogs = () => {
    // In a real app, this would generate and download a CSV/Excel file
    console.log("Exporting activity logs...");
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header and Filters */}
      <div className="space-y-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Activity Logs</h3>
            <p className="text-sm text-muted-foreground">
              Track all system activities and changes
            </p>
          </div>
          <Button variant="outline" onClick={handleExportLogs} className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search activities, users, or details..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="schedule">Schedule</SelectItem>
              <SelectItem value="timeoff">Time Off</SelectItem>
              <SelectItem value="staff">Staff</SelectItem>
              <SelectItem value="settings">Settings</SelectItem>
              <SelectItem value="system">System</SelectItem>
            </SelectContent>
          </Select>

          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="secondary">{filteredLogs.length} activities</Badge>
          {(searchQuery || categoryFilter !== "all" || severityFilter !== "all") && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                setSearchQuery("");
                setCategoryFilter("all");
                setSeverityFilter("all");
              }}
              className="h-6 px-2 text-xs"
            >
              Clear filters
            </Button>
          )}
        </div>
      </div>

      {/* Activity List */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-2">
        {filteredLogs.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Search className="w-12 h-12 text-muted-foreground mb-4" />
              <h4 className="text-lg font-medium mb-2">No Activities Found</h4>
              <p className="text-sm text-muted-foreground">
                {searchQuery || categoryFilter !== "all" || severityFilter !== "all" 
                  ? "Try adjusting your search or filters"
                  : "No activity logs available"
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredLogs.map((log) => {
            const SeverityIcon = severityIcons[log.severity];
            const ActionIcon = actionIcons[log.action as keyof typeof actionIcons] || actionIcons.default;
            
            return (
              <Card key={log.id} className="hover:bg-muted/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Icon and Severity */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className={`w-8 h-8 rounded-lg bg-muted flex items-center justify-center ${severityColors[log.severity]}`}>
                        <ActionIcon className="w-4 h-4" />
                      </div>
                      <SeverityIcon className={`w-4 h-4 ${severityColors[log.severity]}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-sm">{log.action}</h4>
                            <Badge 
                              variant="secondary" 
                              className={`text-xs ${categoryColors[log.category]}`}
                            >
                              {log.category}
                            </Badge>
                            {log.target && (
                              <Badge variant="outline" className="text-xs">
                                {log.target.name}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {log.details}
                          </p>
                          
                          {/* Metadata */}
                          {log.metadata && Object.keys(log.metadata).length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-2">
                              {Object.entries(log.metadata).map(([key, value]) => (
                                <span key={key} className="text-xs bg-muted px-2 py-1 rounded">
                                  {key}: <span className="font-medium">{String(value)}</span>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <time className="text-xs text-muted-foreground flex-shrink-0">
                          {formatDistanceToNow(log.timestamp, { addSuffix: true })}
                        </time>
                      </div>

                      {/* User */}
                      <div className="flex items-center gap-2 mt-2">
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={log.user.avatar} />
                          <AvatarFallback className="text-xs">{log.user.initials}</AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-muted-foreground">
                          by {log.user.name}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}