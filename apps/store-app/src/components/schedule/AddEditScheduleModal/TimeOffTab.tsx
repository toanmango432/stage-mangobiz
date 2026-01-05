import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent } from "@/components/ui/Card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { Switch } from "@/components/ui/switch";
import { format, startOfDay, isBefore } from "date-fns";
import {
  CalendarIcon,
  Clock,
  DollarSign,
  CheckCircle,
  XCircle,
  Plus,
  User
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Staff, TimeOffRequest } from "../AddEditScheduleModal";
import { toast } from "@/hooks/use-toast";

interface TimeOffTabProps {
  staffMember: Staff;
  timeOffRequests: TimeOffRequest[];
  onUpdate: (requests: TimeOffRequest[]) => void;
}

export function TimeOffTab({ staffMember, timeOffRequests, onUpdate }: TimeOffTabProps) {
  const [activeTab, setActiveTab] = useState("current");
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [formData, setFormData] = useState({
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
    isDateRange: false,
    shiftType: "full" as "full" | "partial",
    reason: "",
    payrollImpact: true
  });

  // Filter requests for this staff member and sort by date
  const staffTimeOffRequests = timeOffRequests
    .filter(request => request.employeeId === staffMember.id)
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  
  const upcomingRequests = staffTimeOffRequests.filter(request => 
    request.status === "approved" && new Date(request.date) >= startOfDay(new Date())
  );
  
  const pendingRequests = staffTimeOffRequests.filter(request => request.status === "pending");
  const completedRequests = staffTimeOffRequests.filter(request =>
    request.status === "approved" && new Date(request.date) < startOfDay(new Date())
  );

  function handleSubmit() {
    if (!formData.startDate) return;

    const newRequest: TimeOffRequest = {
      id: `timeoff_${Date.now()}`,
      employeeId: staffMember.id,
      employeeName: staffMember.name,
      date: formData.startDate.toISOString().split('T')[0],
      endDate: formData.isDateRange && formData.endDate ? formData.endDate.toISOString().split('T')[0] : undefined,
      reason: formData.reason?.trim() || '',
      isPaid: formData.payrollImpact,
      status: "pending",
      submittedAt: new Date().toISOString()
    };

    onUpdate([...timeOffRequests, newRequest]);
    resetForm();
    setShowQuickAdd(false);
    toast({
      title: "Time Off Added",
      description: `Added time off for ${staffMember.name}`
    });
  }

  function resetForm() {
    setFormData({
      startDate: undefined,
      endDate: undefined,
      isDateRange: false,
      shiftType: "full",
      reason: "",
      payrollImpact: true
    });
  }

  const canSubmit = formData.startDate && (!formData.isDateRange || formData.endDate);

  return (
    <div className="h-full flex flex-col relative">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col h-full">
        <TabsList className="grid grid-cols-1 flex-shrink-0 w-auto mb-4">
          <TabsTrigger value="current" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Current Time Off
            {(upcomingRequests.length + pendingRequests.length) > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                {upcomingRequests.length + pendingRequests.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>
        
        <div className="flex-1 overflow-hidden">
          {/* Quick Add Form */}
          {showQuickAdd && (
            <div className="mb-4 p-4 border rounded-lg bg-muted/30 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Add Time Off for {staffMember.name}</h4>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowQuickAdd(false)}
                >
                  <XCircle className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Start Date</label>
                  <div className="flex gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "flex-1 justify-start text-left font-normal",
                            !formData.startDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.startDate ? format(formData.startDate, "PPP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <div className="p-3 border-b">
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setFormData(prev => ({ ...prev, startDate: new Date() }))}
                              className="text-xs"
                            >
                              Today
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const tomorrow = new Date();
                                tomorrow.setDate(tomorrow.getDate() + 1);
                                setFormData(prev => ({ ...prev, startDate: tomorrow }));
                              }}
                              className="text-xs"
                            >
                              Tomorrow
                            </Button>
                          </div>
                        </div>
                        {formData.isDateRange ? (
                          <Calendar
                            mode="range"
                            selected={formData.startDate && formData.endDate ? { from: formData.startDate, to: formData.endDate } : formData.startDate ? { from: formData.startDate, to: undefined } : undefined}
                            onSelect={(selected) => {
                              if (selected?.from) {
                                setFormData(prev => ({ ...prev, startDate: selected.from }));
                                if (selected.to) {
                                  setFormData(prev => ({ ...prev, endDate: selected.to }));
                                } else {
                                  setFormData(prev => ({ ...prev, endDate: undefined }));
                                }
                              }
                            }}
                            disabled={(date) => isBefore(date, startOfDay(new Date()))}
                            initialFocus
                            className="p-3 pointer-events-auto"
                          />
                        ) : (
                          <Calendar
                            mode="single"
                            selected={formData.startDate}
                            onSelect={(date) => setFormData(prev => ({ ...prev, startDate: date }))}
                            disabled={(date) => isBefore(date, startOfDay(new Date()))}
                            initialFocus
                            className="p-3 pointer-events-auto"
                          />
                        )}
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.isDateRange}
                    onCheckedChange={(checked) => {
                      setFormData(prev => ({ 
                        ...prev, 
                        isDateRange: checked,
                        endDate: checked ? prev.endDate : undefined
                      }));
                    }}
                  />
                  <span className="text-sm font-medium">Date Range</span>
                </div>

                {formData.isDateRange && (
                  <div className="text-sm text-muted-foreground">
                    {formData.startDate && formData.endDate 
                      ? `Selected range: ${format(formData.startDate, "MMM d")} - ${format(formData.endDate, "MMM d, yyyy")}`
                      : formData.startDate 
                        ? "Click on the calendar above to select end date or drag to select range"
                        : "Please select start date first"}
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium mb-2 block">Type</label>
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant={formData.shiftType === "full" ? "default" : "outline"}
                      onClick={() => setFormData(prev => ({ ...prev, shiftType: "full" }))}
                      className="flex-1"
                    >
                      Full Day Off
                    </Button>
                    <Button
                      type="button"
                      variant={formData.shiftType === "partial" ? "default" : "outline"}
                      onClick={() => setFormData(prev => ({ ...prev, shiftType: "partial" }))}
                      className="flex-1"
                    >
                      Partial Day Off
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Reason (Optional)</label>
                  <Textarea
                    placeholder="Enter reason for time off..."
                    value={formData.reason}
                    onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                    rows={3}
                    className="resize-none"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Payroll Impact</label>
                    <p className="text-xs text-muted-foreground">
                      Enable this to mark the time off as payroll impacting
                    </p>
                  </div>
                  <Switch
                    checked={formData.payrollImpact}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, payrollImpact: checked }))}
                  />
                </div>
                
                <div className="flex gap-3 pt-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => {
                      resetForm();
                      setShowQuickAdd(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                    className="flex-1"
                  >
                    Add
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Current Time Off Tab */}
          <TabsContent value="current" className="h-full data-[state=active]:flex data-[state=active]:flex-col">
            <ScrollArea className="flex-1">
              <div className="space-y-4 pr-4">
                {/* Upcoming Time Off */}
                {upcomingRequests.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-muted-foreground">Upcoming Time Off</h4>
                    {upcomingRequests.map((request) => (
                      <TimeOffCard key={request.id} request={request} />
                    ))}
                  </div>
                )}

                {/* Add Time Off Button */}
                <div className="flex justify-center py-2">
                  <Button 
                    onClick={() => setShowQuickAdd(!showQuickAdd)} 
                    size="sm" 
                    className="gap-2"
                    variant={showQuickAdd ? "default" : "outline"}
                  >
                    <Plus className="w-4 h-4" />
                    Time Off
                  </Button>
                </div>

                {/* Pending Requests */}
                {pendingRequests.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-muted-foreground">Pending Requests</h4>
                    {pendingRequests.map((request) => (
                      <TimeOffCard key={request.id} request={request} />
                    ))}
                  </div>
                )}

                {/* Recent Completed */}
                {completedRequests.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-muted-foreground">Recent Completed</h4>
                    {completedRequests.slice(0, 3).map((request) => (
                      <TimeOffCard key={request.id} request={request} />
                    ))}
                  </div>
                )}

                {staffTimeOffRequests.length === 0 && (
                  <div className="text-center py-12">
                    <CalendarIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h4 className="text-lg font-medium mb-2">No Time Off Records</h4>
                    <p className="text-sm text-muted-foreground">
                      {staffMember.name} has no time off requests yet.
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

// Time Off Card Component
interface TimeOffCardProps {
  request: TimeOffRequest;
}

function TimeOffCard({ request }: TimeOffCardProps) {
  const getStatusBadge = () => {
    switch (request.status) {
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-700 border-green-300 dark:bg-green-900 dark:text-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300 dark:bg-yellow-900 dark:text-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case "denied":
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Denied
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="hover:shadow-sm transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-semibold text-primary">
                {request.employeeName.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            
            <div className="space-y-2 flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{request.employeeName}</span>
                <Badge variant="outline" className="text-xs">
                  {format(new Date(request.submittedAt), "MMM d")}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarIcon className="w-3 h-3" />
                <span>
                  {request.endDate 
                    ? `${format(new Date(request.date), "MMM d")} - ${format(new Date(request.endDate), "MMM d, yyyy")}`
                    : format(new Date(request.date), "MMM d, yyyy")
                  }
                </span>
              </div>
              
              {request.reason && (
                <p className="text-sm text-muted-foreground line-clamp-2">{request.reason}</p>
              )}
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            {getStatusBadge()}
            {request.isPaid && (
              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200">
                <DollarSign className="w-3 h-3 mr-1" />
                Paid
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

