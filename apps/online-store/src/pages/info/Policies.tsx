'use client';

import { useEffect, useState } from "react";

import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { trackEvent } from "@/lib/analytics";

const trackNavClick = (page: string) => trackEvent({ event: 'nav_info_click', page });

const STORE_API_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/store`;

interface Policy {
  title: string;
  lastUpdated: string;
  content: string;
}

interface Policies {
  privacy: Policy;
  terms: Policy;
  refund: Policy;
}

export default function Policies() {
  const [policies, setPolicies] = useState<Policies | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPolicies();
    trackNavClick('Policies');
  }, []);

  const fetchPolicies = async () => {
    try {
      const response = await fetch(`${STORE_API_URL}/policies`);
      const data = await response.json();
      setPolicies(data);
    } catch (error) {
      console.error('Failed to fetch policies:', error);
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!policies) {
    return <div>Error loading policies</div>;
  }

  return (
    <>
      <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold">Our Policies</h1>
              <p className="text-xl text-muted-foreground">
                Important information about our services
              </p>
            </div>

            <Tabs defaultValue="privacy" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="privacy">Privacy Policy</TabsTrigger>
                <TabsTrigger value="terms">Terms of Service</TabsTrigger>
                <TabsTrigger value="refund">Refund Policy</TabsTrigger>
              </TabsList>
              
              <TabsContent value="privacy">
                <Card>
                  <CardContent className="p-6 md:p-8 space-y-4">
                    <div className="flex justify-between items-start">
                      <h2 className="text-2xl font-semibold">{policies.privacy.title}</h2>
                      <span className="text-sm text-muted-foreground">
                        Updated: {new Date(policies.privacy.lastUpdated).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-line">
                      {policies.privacy.content}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="terms">
                <Card>
                  <CardContent className="p-6 md:p-8 space-y-4">
                    <div className="flex justify-between items-start">
                      <h2 className="text-2xl font-semibold">{policies.terms.title}</h2>
                      <span className="text-sm text-muted-foreground">
                        Updated: {new Date(policies.terms.lastUpdated).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-line">
                      {policies.terms.content}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="refund">
                <Card>
                  <CardContent className="p-6 md:p-8 space-y-4">
                    <div className="flex justify-between items-start">
                      <h2 className="text-2xl font-semibold">{policies.refund.title}</h2>
                      <span className="text-sm text-muted-foreground">
                        Updated: {new Date(policies.refund.lastUpdated).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-line">
                      {policies.refund.content}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
      </div>
    </>
  );
}
