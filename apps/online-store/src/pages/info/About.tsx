'use client';

import { useEffect, useState } from "react";

import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Phone, Mail, Clock, Instagram, Facebook, Twitter } from "lucide-react";
import { localBusinessSchema, injectSchema } from "@/lib/seoSchema";
import { trackEvent } from "@/lib/analytics";

export const trackNavClick = (page: string) => {
  trackEvent({ event: 'nav_info_click', page });
};

const STORE_API_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/store`;

interface SalonInfo {
  name: string;
  tagline: string;
  description: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  contact: {
    phone: string;
    email: string;
  };
  hours: Record<string, string>;
  social: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
  };
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export default function About() {
  const [salonInfo, setSalonInfo] = useState<SalonInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSalonInfo();
  }, []);

  useEffect(() => {
    if (salonInfo) {
      const cleanup = injectSchema(localBusinessSchema(salonInfo));
      return cleanup;
    }
  }, [salonInfo]);

  const fetchSalonInfo = async () => {
    try {
      const response = await fetch(`${STORE_API_URL}/salon-info`);
      const data = await response.json();
      setSalonInfo(data.info);
    } catch (error) {
      console.error('Failed to fetch salon info:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    trackNavClick('About');
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!salonInfo) {
    return <div>Error loading salon information</div>;
  }

  const mapUrl = salonInfo.coordinates 
    ? `https://www.google.com/maps?q=${salonInfo.coordinates.lat},${salonInfo.coordinates.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${salonInfo.address.street}, ${salonInfo.address.city}, ${salonInfo.address.state}`)}`;

  return (
    <>
      <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold">{salonInfo.name}</h1>
              <p className="text-xl text-muted-foreground">{salonInfo.tagline}</p>
            </div>

            <Card>
              <CardContent className="p-6 md:p-8">
                <h2 className="text-2xl font-semibold mb-4">Our Story</h2>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                  {salonInfo.description}
                </p>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardContent className="p-6 space-y-4">
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    Location
                  </h3>
                  <div className="space-y-2 text-muted-foreground">
                    <p>{salonInfo.address.street}</p>
                    <p>{salonInfo.address.city}, {salonInfo.address.state} {salonInfo.address.zip}</p>
                    <a 
                      href={mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-block"
                    >
                      View on Google Maps →
                    </a>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 space-y-4">
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    <Phone className="h-5 w-5 text-primary" />
                    Contact
                  </h3>
                  <div className="space-y-2">
                    <a 
                      href={`tel:${salonInfo.contact.phone}`}
                      className="text-muted-foreground hover:text-primary block"
                    >
                      {salonInfo.contact.phone}
                    </a>
                    <a 
                      href={`mailto:${salonInfo.contact.email}`}
                      className="text-muted-foreground hover:text-primary block flex items-center gap-2"
                    >
                      <Mail className="h-4 w-4" />
                      {salonInfo.contact.email}
                    </a>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Hours
                </h3>
                <div className="grid md:grid-cols-2 gap-3">
                  {Object.entries(salonInfo.hours).map(([day, hours]) => (
                    <div key={day} className="flex justify-between items-center">
                      <span className="font-medium capitalize">{day}</span>
                      <span className="text-muted-foreground">{hours}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {salonInfo.social && (
              <Card>
                <CardContent className="p-6 space-y-4">
                  <h3 className="text-xl font-semibold">Connect With Us</h3>
                  <div className="flex gap-4">
                    {salonInfo.social.instagram && (
                      <a 
                        href={salonInfo.social.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                        aria-label="Instagram"
                      >
                        <Instagram className="h-5 w-5" />
                        <span>Instagram</span>
                      </a>
                    )}
                    {salonInfo.social.facebook && (
                      <a 
                        href={salonInfo.social.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                        aria-label="Facebook"
                      >
                        <Facebook className="h-5 w-5" />
                        <span>Facebook</span>
                      </a>
                    )}
                    {salonInfo.social.twitter && (
                      <a 
                        href={salonInfo.social.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                        aria-label="Twitter"
                      >
                        <Twitter className="h-5 w-5" />
                        <span>Twitter</span>
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
      </div>
    </>
  );
}
