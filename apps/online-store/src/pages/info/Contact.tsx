import { useEffect, useState } from "react";
import { SEOHead } from "@/components/SEOHead";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MapPin, Phone, Mail, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { trackEvent } from "@/lib/analytics";

const trackNavClick = (page: string) => trackEvent({ event: 'nav_info_click', page });

const STORE_API_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/store`;

export default function Contact() {
  const [salonInfo, setSalonInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchSalonInfo();
    trackNavClick('Contact');
  }, []);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Placeholder - will be connected to backend later
    toast({
      title: "Message sent!",
      description: "We'll get back to you soon.",
    });
    setFormData({ name: '', email: '', phone: '', message: '' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!salonInfo) {
    return <div>Error loading contact information</div>;
  }

  const mapUrl = salonInfo.coordinates 
    ? `https://www.google.com/maps?q=${salonInfo.coordinates.lat},${salonInfo.coordinates.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${salonInfo.address.street}, ${salonInfo.address.city}, ${salonInfo.address.state}`)}`;

  return (
    <>
      <SEOHead 
        title={`Contact ${salonInfo.name}`}
        description={`Get in touch with ${salonInfo.name}. Book appointments, ask questions, or visit us at ${salonInfo.address.street}.`}
        canonical="/info/contact"
      />
      
      <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold">Contact Us</h1>
              <p className="text-xl text-muted-foreground">
                We'd love to hear from you
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <Card>
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-start gap-4">
                      <MapPin className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold mb-1">Visit Us</h3>
                        <p className="text-muted-foreground">
                          {salonInfo.address.street}<br />
                          {salonInfo.address.city}, {salonInfo.address.state} {salonInfo.address.zip}
                        </p>
                        <a 
                          href={mapUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline text-sm inline-block mt-2"
                        >
                          Get Directions →
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-start gap-4">
                      <Phone className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold mb-1">Call Us</h3>
                        <a 
                          href={`tel:${salonInfo.contact.phone}`}
                          className="text-muted-foreground hover:text-primary block"
                        >
                          {salonInfo.contact.phone}
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-start gap-4">
                      <Mail className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold mb-1">Email Us</h3>
                        <a 
                          href={`mailto:${salonInfo.contact.email}`}
                          className="text-muted-foreground hover:text-primary block"
                        >
                          {salonInfo.contact.email}
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Send us a message</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="name">Name</Label>
                      <Input 
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="phone">Phone (optional)</Label>
                      <Input 
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="message">Message</Label>
                      <Textarea 
                        id="message"
                        rows={5}
                        value={formData.message}
                        onChange={(e) => setFormData({...formData, message: e.target.value})}
                        required
                      />
                    </div>
                    
                    <Button type="submit" className="w-full">
                      <Send className="h-4 w-4 mr-2" />
                      Send Message
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
      </div>
    </>
  );
}
