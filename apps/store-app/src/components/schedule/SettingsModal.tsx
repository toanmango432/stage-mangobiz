import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Settings,
  Clock,
  Eye,
  Save,
  RotateCcw,
  Users,
  Calendar,
  BarChart3,
  Bell
} from "lucide-react";

import { toast } from "@/hooks/use-toast";

export interface FullTimeSettings {
  minHoursPerWeek: number;
  minDaysPerWeek: number;
  consecutiveHoursThreshold: number;
  overtimeThreshold: number;
  enableMinHours: boolean;
  enableMinDays: boolean;
  enableConsecutiveHours: boolean;
  enableOvertime: boolean;
}

export interface DashboardCardSettings {
  showScheduleStats: boolean;
  showOnboardingTips: boolean;
  showSalonHours: boolean;
  showUpcomingTimeOff: boolean;
  showTeamSummary: boolean;
  showPerformanceMetrics: boolean;
}

export interface AppSettings {
  fullTimeSettings: FullTimeSettings;
  dashboardCards: DashboardCardSettings;
}

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: AppSettings;
  onSettingsChange: (settings: AppSettings) => void;
}

export function SettingsModal({ open, onOpenChange, settings, onSettingsChange }: SettingsModalProps) {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [hasChanges, setHasChanges] = useState(false);

  const updateSettings = (updates: Partial<AppSettings>) => {
    const newSettings = { ...localSettings, ...updates };
    setLocalSettings(newSettings);
    setHasChanges(JSON.stringify(newSettings) !== JSON.stringify(settings));
  };

  const updateFullTimeSettings = (updates: Partial<FullTimeSettings>) => {
    updateSettings({
      fullTimeSettings: { ...localSettings.fullTimeSettings, ...updates }
    });
  };

  const updateDashboardCards = (updates: Partial<DashboardCardSettings>) => {
    updateSettings({
      dashboardCards: { ...localSettings.dashboardCards, ...updates }
    });
  };

  const handleSave = () => {
    onSettingsChange(localSettings);
    setHasChanges(false);
    toast({
      title: "Settings Saved",
      description: "Your preferences have been updated successfully."
    });
  };

  const handleReset = () => {
    setLocalSettings(settings);
    setHasChanges(false);
  };

  const dashboardCardOptions = [
    { key: 'showScheduleStats', label: 'Schedule Statistics', description: 'Weekly hours and team metrics', icon: BarChart3 },
    { key: 'showOnboardingTips', label: 'Onboarding Tips', description: 'Helpful tips for new users', icon: Bell },
    { key: 'showSalonHours', label: 'Salon Hours Bar', description: 'Business operating hours display', icon: Clock },
    { key: 'showUpcomingTimeOff', label: 'Upcoming Time Off', description: 'Staff time off requests and approvals', icon: Calendar },
    { key: 'showTeamSummary', label: 'Team Summary', description: 'Quick overview of team status', icon: Users },
    { key: 'showPerformanceMetrics', label: 'Performance Metrics', description: 'Productivity and efficiency stats', icon: BarChart3 }
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-4xl flex flex-col">
        <SheetHeader className="flex-shrink-0 pb-4 border-b">
          <SheetTitle className="flex items-center gap-2 text-xl font-semibold">
            <Settings className="w-5 h-5" />
            Settings & Preferences
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="criteria" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-2 flex-shrink-0 mt-4">
              <TabsTrigger value="criteria" className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4" />
                Full-Time Criteria
              </TabsTrigger>
              <TabsTrigger value="dashboard" className="flex items-center gap-2 text-sm">
                <Eye className="w-4 h-4" />
                Dashboard Cards
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto mt-6 pr-2">
              {/* Full-Time Criteria Tab */}
              <TabsContent value="criteria" className="space-y-6 data-[state=active]:flex data-[state=active]:flex-col">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Full-Time Employee Criteria</CardTitle>
                    <CardDescription>
                      Configure the requirements that define full-time employment status
                    </CardDescription>
                  </CardHeader>
                   <CardContent className="space-y-6">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-3">
                         <div className="flex items-center justify-between">
                           <Label htmlFor="minHours" className="text-sm font-medium">Minimum Hours per Week</Label>
                           <Switch
                             checked={localSettings.fullTimeSettings.enableMinHours}
                             onCheckedChange={(checked) => updateFullTimeSettings({ enableMinHours: checked })}
                           />
                         </div>
                         <div className={`space-y-2 ${!localSettings.fullTimeSettings.enableMinHours ? 'opacity-50' : ''}`}>
                           <div className="flex items-center gap-2">
                             <Input
                               id="minHours"
                               type="number"
                               min="0"
                               max="80"
                               value={localSettings.fullTimeSettings.minHoursPerWeek}
                               onChange={(e) => updateFullTimeSettings({ 
                                 minHoursPerWeek: parseInt(e.target.value) || 0 
                               })}
                               className="w-24"
                               disabled={!localSettings.fullTimeSettings.enableMinHours}
                             />
                             <span className="text-sm text-muted-foreground">hours</span>
                           </div>
                           <p className="text-xs text-muted-foreground">
                             Standard full-time is typically 32-40 hours
                           </p>
                         </div>
                       </div>

                       <div className="space-y-3">
                         <div className="flex items-center justify-between">
                           <Label htmlFor="minDays" className="text-sm font-medium">Minimum Days per Week</Label>
                           <Switch
                             checked={localSettings.fullTimeSettings.enableMinDays}
                             onCheckedChange={(checked) => updateFullTimeSettings({ enableMinDays: checked })}
                           />
                         </div>
                         <div className={`space-y-2 ${!localSettings.fullTimeSettings.enableMinDays ? 'opacity-50' : ''}`}>
                           <div className="flex items-center gap-2">
                             <Input
                               id="minDays"
                               type="number"
                               min="1"
                               max="7"
                               value={localSettings.fullTimeSettings.minDaysPerWeek}
                               onChange={(e) => updateFullTimeSettings({ 
                                 minDaysPerWeek: parseInt(e.target.value) || 1 
                               })}
                               className="w-24"
                               disabled={!localSettings.fullTimeSettings.enableMinDays}
                             />
                             <span className="text-sm text-muted-foreground">days</span>
                           </div>
                           <p className="text-xs text-muted-foreground">
                             Minimum working days per week
                           </p>
                         </div>
                       </div>

                       <div className="space-y-3">
                         <div className="flex items-center justify-between">
                           <Label htmlFor="consecutiveHours" className="text-sm font-medium">Daily Hours Threshold</Label>
                           <Switch
                             checked={localSettings.fullTimeSettings.enableConsecutiveHours}
                             onCheckedChange={(checked) => updateFullTimeSettings({ enableConsecutiveHours: checked })}
                           />
                         </div>
                         <div className={`space-y-2 ${!localSettings.fullTimeSettings.enableConsecutiveHours ? 'opacity-50' : ''}`}>
                           <div className="flex items-center gap-2">
                             <Input
                               id="consecutiveHours"
                               type="number"
                               min="0"
                               max="16"
                               value={localSettings.fullTimeSettings.consecutiveHoursThreshold}
                               onChange={(e) => updateFullTimeSettings({ 
                                 consecutiveHoursThreshold: parseInt(e.target.value) || 0 
                               })}
                               className="w-24"
                               disabled={!localSettings.fullTimeSettings.enableConsecutiveHours}
                             />
                             <span className="text-sm text-muted-foreground">hours/day</span>
                           </div>
                           <p className="text-xs text-muted-foreground">
                             Minimum hours per working day
                           </p>
                         </div>
                       </div>

                       <div className="space-y-3">
                         <div className="flex items-center justify-between">
                           <Label htmlFor="overtimeThreshold" className="text-sm font-medium">Overtime Threshold</Label>
                           <Switch
                             checked={localSettings.fullTimeSettings.enableOvertime}
                             onCheckedChange={(checked) => updateFullTimeSettings({ enableOvertime: checked })}
                           />
                         </div>
                         <div className={`space-y-2 ${!localSettings.fullTimeSettings.enableOvertime ? 'opacity-50' : ''}`}>
                           <div className="flex items-center gap-2">
                             <Input
                               id="overtimeThreshold"
                               type="number"
                               min="0"
                               max="60"
                               value={localSettings.fullTimeSettings.overtimeThreshold}
                               onChange={(e) => updateFullTimeSettings({ 
                                 overtimeThreshold: parseInt(e.target.value) || 0 
                               })}
                               className="w-24"
                               disabled={!localSettings.fullTimeSettings.enableOvertime}
                             />
                             <span className="text-sm text-muted-foreground">hours/week</span>
                           </div>
                           <p className="text-xs text-muted-foreground">
                             Hours beyond which overtime applies
                           </p>
                         </div>
                       </div>
                     </div>

                    <Separator />

                     <div className="bg-muted/50 rounded-lg p-4">
                       <h4 className="font-medium mb-2">Active Classification Rules</h4>
                       <div className="grid grid-cols-2 gap-4 text-sm">
                         <div>
                           <span className="text-muted-foreground">Full-Time Requirements:</span>
                           <div className="flex flex-wrap items-center gap-1 mt-1">
                             {localSettings.fullTimeSettings.enableMinHours && (
                               <Badge variant="secondary">≥ {localSettings.fullTimeSettings.minHoursPerWeek}h/week</Badge>
                             )}
                             {localSettings.fullTimeSettings.enableMinDays && (
                               <Badge variant="secondary">≥ {localSettings.fullTimeSettings.minDaysPerWeek} days</Badge>
                             )}
                             {localSettings.fullTimeSettings.enableConsecutiveHours && (
                               <Badge variant="secondary">≥ {localSettings.fullTimeSettings.consecutiveHoursThreshold}h/day</Badge>
                             )}
                             {!localSettings.fullTimeSettings.enableMinHours && 
                              !localSettings.fullTimeSettings.enableMinDays && 
                              !localSettings.fullTimeSettings.enableConsecutiveHours && (
                               <span className="text-xs text-muted-foreground">No active criteria</span>
                             )}
                           </div>
                         </div>
                         <div>
                           <span className="text-muted-foreground">Overtime:</span>
                           <div className="mt-1">
                             {localSettings.fullTimeSettings.enableOvertime ? (
                               <Badge variant="destructive">≥ {localSettings.fullTimeSettings.overtimeThreshold}h/week</Badge>
                             ) : (
                               <span className="text-xs text-muted-foreground">Disabled</span>
                             )}
                           </div>
                         </div>
                       </div>
                     </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Dashboard Cards Tab */}
              <TabsContent value="dashboard" className="space-y-6 data-[state=active]:flex data-[state=active]:flex-col">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Dashboard Card Visibility</CardTitle>
                    <CardDescription>
                      Choose which cards and widgets to display on your dashboard
                    </CardDescription>
                  </CardHeader>
                   <CardContent>
                     {/* Master toggle */}
                     <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                       <div className="flex items-start gap-3">
                         <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                           <Eye className="w-5 h-5 text-primary" />
                         </div>
                         <div className="flex-1">
                           <div className="font-medium">Show All Dashboard Cards</div>
                           <p className="text-sm text-muted-foreground">Master toggle to show or hide all dashboard cards</p>
                         </div>
                       </div>
                       <Switch
                         checked={Object.values(localSettings.dashboardCards).some(value => value)}
                         onCheckedChange={(checked) => {
                           const updates: Partial<DashboardCardSettings> = {};
                           dashboardCardOptions.forEach(option => {
                             updates[option.key as keyof DashboardCardSettings] = checked;
                           });
                           updateDashboardCards(updates);
                         }}
                       />
                     </div>
                     
                     <div className="grid gap-4">
                      {dashboardCardOptions.map((option) => (
                        <div key={option.key} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                              <option.icon className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1">
                              <div className="font-medium">{option.label}</div>
                              <p className="text-sm text-muted-foreground">{option.description}</p>
                            </div>
                          </div>
                          <Switch
                            checked={localSettings.dashboardCards[option.key as keyof DashboardCardSettings]}
                            onCheckedChange={(checked) => 
                              updateDashboardCards({ 
                                [option.key]: checked 
                              } as Partial<DashboardCardSettings>)
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

            </div>
          </Tabs>
        </div>

        {/* Fixed Footer */}
        <div className="flex items-center justify-between pt-4 border-t bg-background flex-shrink-0">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {hasChanges && (
              <>
                <div className="w-2 h-2 bg-warning rounded-full" />
                Unsaved changes
              </>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleReset} disabled={!hasChanges}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
            <Button onClick={handleSave} disabled={!hasChanges}>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}