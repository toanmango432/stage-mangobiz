/**
 * Referral Card Component
 * Displays and manages client's referral code and stats
 * Uses Supabase-based referral system (migration 036)
 */

import { useState, useEffect } from 'react';
import { Users, Copy, Mail, MessageSquare, Check, Plus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { toast } from '@/hooks/use-toast';
import { useAppDispatch } from '@/store/hooks';
import { generateClientReferralCode } from '@/store/slices/clientsSlice';
import { supabase } from '@/services/supabase/client';
import type { Client } from '@/types/client';

interface ReferralStats {
  totalReferrals: number;
  completedReferrals: number;
}

interface ReferralCardProps {
  client: Client;
  className?: string;
}

export function ReferralCard({ client, className }: ReferralCardProps) {
  const dispatch = useAppDispatch();
  const [stats, setStats] = useState<ReferralStats>({ totalReferrals: 0, completedReferrals: 0 });
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Get referral code from client (stored in clients.referral_code column)
  const referralCode = client.referralCode || client.loyaltyInfo?.referralCode;

  // Load referral stats
  useEffect(() => {
    const loadStats = async () => {
      if (!client.id) return;

      try {
        setLoading(true);

        // Query referral_tracking table for this client as referrer
        const { data, error } = await supabase
          .from('referral_tracking')
          .select('status')
          .eq('referrer_client_id', client.id);

        if (error) {
          console.error('Failed to load referral stats:', error);
          return;
        }

        const totalReferrals = data?.length || 0;
        const completedReferrals = data?.filter(r => r.status === 'completed').length || 0;

        setStats({ totalReferrals, completedReferrals });
      } catch (err) {
        console.error('Error loading referral stats:', err);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [client.id]);

  const handleGenerateCode = async () => {
    try {
      setGenerating(true);
      await dispatch(generateClientReferralCode({ clientId: client.id })).unwrap();

      toast({
        title: 'Referral Code Generated',
        description: 'A unique referral code has been created for this client.',
      });
    } catch (err) {
      console.error('Failed to generate referral code:', err);
      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description: 'Could not generate referral code. Please try again.',
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyCode = () => {
    if (!referralCode) return;

    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);

    toast({
        title: 'Copied!',
        description: 'Referral code copied to clipboard.',
    });
  };

  const handleShareSMS = () => {
    if (!referralCode) return;

    const message = `Use my referral code ${referralCode} for a discount on your first visit!`;
    const smsUrl = `sms:?body=${encodeURIComponent(message)}`;
    window.open(smsUrl, '_blank');
  };

  const handleShareEmail = () => {
    if (!referralCode) return;

    const subject = 'Referral Code';
    const body = `Use my referral code ${referralCode} for a discount on your first visit!`;
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl, '_blank');
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="w-5 h-5" />
          Referral Program
        </CardTitle>
        <CardDescription>
          Share your referral code and earn rewards
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Referral Code Section */}
        <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">Personal Referral Code</p>
              {referralCode ? (
                <p className="text-2xl font-bold text-blue-700 font-mono tracking-wider">
                  {referralCode}
                </p>
              ) : (
                <p className="text-sm text-gray-400 italic">No code generated</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              {referralCode ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyCode}
                    className="gap-2"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-green-600" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleShareSMS}
                    className="gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    SMS
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleShareEmail}
                    className="gap-2"
                  >
                    <Mail className="w-4 h-4" />
                    Email
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  onClick={handleGenerateCode}
                  disabled={generating}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {generating ? 'Generating...' : 'Generate Code'}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Referral Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-3xl font-bold text-gray-900">
              {loading ? '-' : stats.totalReferrals}
            </p>
            <p className="text-xs text-gray-500 mt-1">Total Referrals</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-3xl font-bold text-green-600">
              {loading ? '-' : stats.completedReferrals}
            </p>
            <p className="text-xs text-gray-500 mt-1">Successful Conversions</p>
          </div>
        </div>

        {/* Info Section */}
        <div className="text-sm text-muted-foreground">
          <p>
            Share your referral code with friends. When they book their first appointment,
            you both earn rewards based on the referral program settings.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
