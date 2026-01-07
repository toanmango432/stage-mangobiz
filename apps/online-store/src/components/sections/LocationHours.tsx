import React, { useEffect, useState } from 'react';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getSalonInfo } from '@/lib/api/store';
import { SalonInfo } from '@/types/store';

interface LocationHoursProps {
  title?: string;
}

export function LocationHours({
  title = "Visit Us"
}: LocationHoursProps) {
  const [salonInfo, setSalonInfo] = useState<SalonInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInfo = async () => {
      const data = await getSalonInfo();
      setSalonInfo(data);
      setLoading(false);
    };
    fetchInfo();
  }, []);

  if (loading || !salonInfo) {
    return (
      <section className="py-16 px-4">
        <div className="container mx-auto text-center">
          <p className="text-muted-foreground">Loading location info...</p>
        </div>
      </section>
    );
  }

  const address = `${salonInfo.address.street}, ${salonInfo.address.city}, ${salonInfo.address.state} ${salonInfo.address.zip}`;
  
  const handleDirections = () => {
    const encodedAddress = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
  };

  const handleCall = () => {
    window.location.href = `tel:${salonInfo.phone.replace(/\D/g, '')}`;
  };

  const handleEmail = () => {
    window.location.href = `mailto:${salonInfo.email}`;
  };

  // Check if currently open
  const now = new Date();
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const currentDay = dayNames[now.getDay()];
  const currentTime = now.getHours() * 60 + now.getMinutes();
  
  const todayHours = salonInfo.hours[currentDay as keyof typeof salonInfo.hours];
  let isOpenNow = false;
  
  if (todayHours && todayHours !== 'Closed') {
    const [open, close] = todayHours.split(' - ');
    const [openHour, openMin] = open.match(/\d+/g)?.map(Number) || [0, 0];
    const [closeHour, closeMin] = close.match(/\d+/g)?.map(Number) || [0, 0];
    
    const openTime = (open.includes('PM') && openHour !== 12 ? openHour + 12 : openHour) * 60 + openMin;
    const closeTime = (close.includes('PM') && closeHour !== 12 ? closeHour + 12 : closeHour) * 60 + closeMin;
    
    isOpenNow = currentTime >= openTime && currentTime < closeTime;
  }

  return (
    <section className="py-16 px-4">
      <div className="container mx-auto">
        <h2 className="text-4xl font-bold text-center mb-12">{title}</h2>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Map */}
          <div className="relative rounded-lg overflow-hidden shadow-lg h-[400px] bg-muted">
            {salonInfo.coordinates ? (
              <iframe
                src={`https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d3024.2219901290355!2d${salonInfo.coordinates.lng}!3d${salonInfo.coordinates.lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2sus!4v1234567890123!5m2!1sen!2sus`}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Salon Location Map"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Map view</p>
                </div>
              </div>
            )}
          </div>

          {/* Contact & Hours */}
          <div className="space-y-6">
            {/* Contact Info Card */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="text-xl font-semibold mb-4">Contact Information</h3>
                
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Address</p>
                    <p className="text-muted-foreground">{address}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Phone</p>
                    <button 
                      onClick={handleCall}
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      {salonInfo.phone}
                    </button>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Email</p>
                    <button 
                      onClick={handleEmail}
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      {salonInfo.email}
                    </button>
                  </div>
                </div>

                <Button onClick={handleDirections} className="w-full mt-4">
                  Get Directions
                </Button>
              </CardContent>
            </Card>

            {/* Hours Card */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    Hours of Operation
                  </h3>
                  {todayHours && (
                    <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                      isOpenNow 
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {isOpenNow ? 'Open Now' : 'Closed'}
                    </span>
                  )}
                </div>
                
                <div className="space-y-2">
                  {Object.entries(salonInfo.hours).map(([day, time]) => (
                    <div 
                      key={day}
                      className={`flex justify-between py-2 border-b last:border-b-0 ${
                        day === currentDay ? 'font-semibold text-primary' : ''
                      }`}
                    >
                      <span className="capitalize">{day}</span>
                      <span className="text-muted-foreground">{time}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
