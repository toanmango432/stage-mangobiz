'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getActiveAnnouncements } from '@/lib/api/promotions';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { AnnouncementCategory } from '@/types/announcement';
import { Clock, Calendar, AlertCircle, Bell } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function Updates() {
  const [selectedCategory, setSelectedCategory] = useState<AnnouncementCategory | 'all'>('all');

  const { data: announcements, isLoading, error } = useQuery({
    queryKey: ['announcements', 'active'],
    queryFn: getActiveAnnouncements,
  });

  const filteredAnnouncements = announcements?.filter(
    (a) => selectedCategory === 'all' || a.category === selectedCategory
  );

  const priorityColors = {
    urgent: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    important: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    normal: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    info: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  };

  const categoryLabels = {
    all: 'All Updates',
    hours: 'Hours & Availability',
    services: 'Services',
    staff: 'Staff & Team',
    policies: 'Policies',
    events: 'Events',
  };

  return (
    <>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 md:py-12 max-w-4xl">
          {/* Header */}
          <div className="text-center space-y-3 mb-8">
            <h1 className="text-3xl md:text-4xl font-bold">
              Updates & Announcements
            </h1>
            <p className="text-muted-foreground">
              Stay up to date with the latest news from Mango
            </p>
          </div>

          {/* Category Filter */}
          <Tabs value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as any)} className="mb-8">
            <TabsList className="w-full flex-wrap h-auto justify-start gap-2">
              {Object.entries(categoryLabels).map(([key, label]) => (
                <TabsTrigger key={key} value={key} className="flex-shrink-0">
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* Loading State */}
          {isLoading && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6 space-y-3">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Error State */}
          {error && (
            <Card className="border-destructive">
              <CardContent className="p-6 text-center">
                <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Unable to load announcements. Please try again later.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {!isLoading && !error && filteredAnnouncements && filteredAnnouncements.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Updates Right Now</h3>
                <p className="text-muted-foreground">
                  {selectedCategory === 'all' 
                    ? "There are no active announcements at the moment."
                    : `No announcements in the ${categoryLabels[selectedCategory]} category.`
                  }
                </p>
              </CardContent>
            </Card>
          )}

          {/* Announcements List */}
          {filteredAnnouncements && filteredAnnouncements.length > 0 && (
            <div className="space-y-4">
              {filteredAnnouncements.map((announcement) => (
                <Card key={announcement.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6 space-y-4">
                    {/* Header */}
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={priorityColors[announcement.priority]}>
                          {announcement.priority}
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                          {announcement.category}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(announcement.createdAt), { addSuffix: true })}
                        </span>
                        {announcement.endsAt && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Until {new Date(announcement.endsAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="space-y-2">
                      <h2 className="text-xl font-bold">
                        {announcement.title}
                      </h2>
                      <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                        {announcement.content}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
