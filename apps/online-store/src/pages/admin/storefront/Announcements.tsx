import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useMarketingSettings, useUpdateMarketingSettings } from '@/hooks/useMarketingSettings';
import { useAnnouncements, useArchiveAnnouncement, useDuplicateAnnouncement } from '@/hooks/useAnnouncements';
import { toast } from '@/hooks/use-toast';
import { Plus, ExternalLink, Edit, Copy, Archive, ChevronDown, ChevronUp, AlertCircle, AlertTriangle, Info, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { AnnouncementDialog } from '@/components/admin/announcements/AnnouncementDialog';
import { Announcement } from '@/types/announcement';

const Announcements = () => {
  const { data: settings, isLoading: settingsLoading } = useMarketingSettings();
  const { data: activeAnnouncements, isLoading: activeLoading } = useAnnouncements('active');
  const { data: archivedAnnouncements, isLoading: archivedLoading } = useAnnouncements('archived');
  const updateSettings = useUpdateMarketingSettings();
  const archiveAnnouncement = useArchiveAnnouncement();
  const duplicateAnnouncement = useDuplicateAnnouncement();

  const [showArchived, setShowArchived] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);

  const handleMasterToggle = (enabled: boolean) => {
    updateSettings.mutate(
      { enableAnnouncements: enabled },
      {
        onSuccess: () => toast({ title: enabled ? 'Announcements enabled' : 'Announcements disabled' }),
        onError: () => toast({ title: 'Failed to update', variant: 'destructive' }),
      }
    );
  };

  const handlePlacementToggle = (key: string, value: boolean) => {
    updateSettings.mutate(
      { defaults: { ...settings?.defaults, announcements: { ...settings?.defaults.announcements, [key]: value } } },
      {
        onSuccess: () => toast({ title: 'Settings updated' }),
        onError: () => toast({ title: 'Failed to update', variant: 'destructive' }),
      }
    );
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setDialogOpen(true);
  };

  const handleDuplicate = async (id: string) => {
    duplicateAnnouncement.mutate(id, {
      onSuccess: () => toast({ title: 'Announcement duplicated' }),
      onError: () => toast({ title: 'Failed to duplicate', variant: 'destructive' }),
    });
  };

  const handleArchive = async (id: string) => {
    archiveAnnouncement.mutate(id, {
      onSuccess: () => toast({ title: 'Announcement archived' }),
      onError: () => toast({ title: 'Failed to archive', variant: 'destructive' }),
    });
  };

  const handleNewAnnouncement = () => {
    setEditingAnnouncement(null);
    setDialogOpen(true);
  };

  const priorityIcons = {
    urgent: AlertCircle,
    important: AlertTriangle,
    normal: Bell,
    info: Info,
  };

  const priorityColors = {
    urgent: 'text-red-500 bg-red-50',
    important: 'text-yellow-600 bg-yellow-50',
    normal: 'text-blue-500 bg-blue-50',
    info: 'text-gray-500 bg-gray-50',
  };

  if (settingsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Announcements</h1>
            <p className="text-muted-foreground">
              Create and manage store announcements
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to="/" target="_blank">
                <ExternalLink className="h-4 w-4 mr-2" />
                View Storefront
              </Link>
            </Button>
            <Button onClick={handleNewAnnouncement}>
              <Plus className="h-4 w-4 mr-2" />
              New Announcement
            </Button>
          </div>
        </div>

        {/* Master Control */}
        <Card>
          <CardHeader>
            <CardTitle>Master Control</CardTitle>
            <CardDescription>Enable or disable all announcements globally</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Label htmlFor="enable-announcements" className="text-base">Show Announcements</Label>
              <Switch
                id="enable-announcements"
                checked={settings?.enableAnnouncements}
                onCheckedChange={handleMasterToggle}
              />
            </div>
          </CardContent>
        </Card>

        {/* Default Placement Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Default Placement Settings</CardTitle>
            <CardDescription>Control where announcements appear by default</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="global-bar" className="text-base">
                  Global Top Bar
                </Label>
                <p className="text-sm text-muted-foreground">Sticky bar at top of all pages</p>
              </div>
              <Switch
                id="global-bar"
                checked={settings?.defaults.announcements.globalBarEnabled}
                onCheckedChange={(v) => handlePlacementToggle('globalBarEnabled', v)}
                disabled={!settings?.enableAnnouncements}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="home-banner-ann" className="text-base">
                  Home Page Banner
                </Label>
                <p className="text-sm text-muted-foreground">Banner block on homepage</p>
              </div>
              <Switch
                id="home-banner-ann"
                checked={settings?.defaults.announcements.homeBannerEnabled}
                onCheckedChange={(v) => handlePlacementToggle('homeBannerEnabled', v)}
                disabled={!settings?.enableAnnouncements}
              />
            </div>
          </CardContent>
        </Card>

        {/* Active Announcements */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Active Announcements</CardTitle>
                <CardDescription>
                  {activeAnnouncements?.length || 0} active
                </CardDescription>
              </div>
              {activeAnnouncements && activeAnnouncements.length > 0 && (
                <Badge variant="secondary">{activeAnnouncements.length} active</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {activeLoading ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : !activeAnnouncements || activeAnnouncements.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No active announcements</p>
                <Button variant="outline" onClick={handleNewAnnouncement} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Announcement
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {activeAnnouncements.map((announcement) => {
                  const Icon = priorityIcons[announcement.priority];
                  return (
                    <Card key={announcement.id} className="shadow-sm">
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          {/* Header */}
                          <div className="flex items-start gap-4">
                            <div className={`p-2 rounded-lg ${priorityColors[announcement.priority]}`}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <div className="flex-1 space-y-1">
                              <div className="flex items-start justify-between gap-4">
                                <h3 className="font-semibold text-lg">{announcement.title}</h3>
                                <Badge variant="outline" className="capitalize">
                                  {announcement.priority}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <span className="capitalize">{announcement.category}</span>
                                <span>•</span>
                                <span>
                                  {format(new Date(announcement.startsAt), 'MMM d')} -{' '}
                                  {announcement.endsAt ? format(new Date(announcement.endsAt), 'MMM d, yyyy') : 'No end date'}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                                {announcement.content}
                              </p>
                            </div>
                          </div>

                          <Separator />

                          {/* Actions */}
                          <div className="flex items-center justify-between">
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => handleEdit(announcement)}>
                                <Edit className="h-3 w-3 mr-1" />
                                Edit
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleDuplicate(announcement.id)}>
                                <Copy className="h-3 w-3 mr-1" />
                                Duplicate
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleArchive(announcement.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Archive className="h-3 w-3 mr-1" />
                                Archive
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Archived Announcements */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowArchived(!showArchived)}>
              <div>
                <CardTitle>Archived Announcements</CardTitle>
                <CardDescription>
                  {archivedAnnouncements?.length || 0} archived
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm">
                {showArchived ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          </CardHeader>
          {showArchived && (
            <CardContent>
              {archivedLoading ? (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : !archivedAnnouncements || archivedAnnouncements.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No archived announcements</p>
              ) : (
                <div className="space-y-3">
                  {archivedAnnouncements.map((announcement) => (
                    <div
                      key={announcement.id}
                      className="flex items-center justify-between p-3 border rounded-lg opacity-60"
                    >
                      <div>
                        <p className="font-medium">{announcement.title}</p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {announcement.category} • {announcement.priority}
                        </p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => handleDuplicate(announcement.id)}>
                        <Copy className="h-3 w-3 mr-1" />
                        Restore as Copy
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          )}
        </Card>
      </div>

      {/* Dialog */}
      <AnnouncementDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        announcement={editingAnnouncement}
      />
    </>
  );
};

export default Announcements;
