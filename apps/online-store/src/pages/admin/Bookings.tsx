import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { BookingsCalendar } from '@/components/admin/bookings/BookingsCalendar';
import { BookingsList } from '@/components/admin/bookings/BookingsList';
import { CreateBookingForm } from '@/components/admin/bookings/CreateBookingForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const Bookings = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <div className="min-h-screen pb-20 md:pb-8">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Bookings Management</h1>
            <p className="text-muted-foreground">
              Manage appointments, view schedules, and handle bookings
            </p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Booking
          </Button>
        </div>

        <Tabs defaultValue="list" className="space-y-6">
          <TabsList>
            <TabsTrigger value="list">List View</TabsTrigger>
            <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          </TabsList>

          <TabsContent value="list">
            <BookingsList />
          </TabsContent>

          <TabsContent value="calendar">
            <BookingsCalendar />
          </TabsContent>
        </Tabs>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Booking</DialogTitle>
            </DialogHeader>
            <CreateBookingForm onClose={() => setIsCreateOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Bookings;
