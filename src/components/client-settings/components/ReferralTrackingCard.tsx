import React, { useState, useEffect } from 'react';
import type { Referral } from '../../../types';
import { referralsDB } from '../../../db/database';
import { Card, Badge, Button, Input } from './SharedComponents';

interface ReferralTrackingCardProps {
  clientId: string;
  referralCode?: string;
  referralCount: number;
  onGenerateCode?: () => void;
  onCopyCode?: (code: string) => void;
}

export const ReferralTrackingCard: React.FC<ReferralTrackingCardProps> = ({
  clientId,
  referralCode,
  referralCount,
  onGenerateCode,
  onCopyCode,
}) => {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const loadReferrals = async () => {
      try {
        setLoading(true);
        const clientReferrals = await referralsDB.getByReferrer(clientId);
        setReferrals(clientReferrals);
      } catch (error) {
        console.error('Failed to load referrals:', error);
      } finally {
        setLoading(false);
      }
    };
    loadReferrals();
  }, [clientId]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleCopyCode = () => {
    if (referralCode) {
      navigator.clipboard.writeText(referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      onCopyCode?.(referralCode);
    }
  };

  const completedReferrals = referrals.filter(r => r.completedAt);
  const pendingReferrals = referrals.filter(r => !r.completedAt);
  const totalEarned = completedReferrals.length * 25; // $25 per referral

  return (
    <Card title="Referral Program" description="Track referrals and rewards earned">
      {/* Referral Code Section */}
      <div className="p-4 bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 rounded-lg mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Personal Referral Code</p>
            {referralCode ? (
              <p className="text-2xl font-bold text-cyan-700 mt-1 font-mono tracking-wider">
                {referralCode}
              </p>
            ) : (
              <p className="text-sm text-gray-400 mt-1 italic">No code generated</p>
            )}
          </div>
          <div className="flex gap-2">
            {referralCode ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyCode}
                >
                  {copied ? (
                    <>
                      <CheckIcon className="w-4 h-4 text-green-500" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <CopyIcon className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowShareModal(true)}
                >
                  <ShareIcon className="w-4 h-4" />
                  Share
                </Button>
              </>
            ) : (
              <Button variant="primary" size="sm" onClick={onGenerateCode}>
                Generate Code
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <p className="text-3xl font-bold text-gray-900">{referralCount}</p>
          <p className="text-xs text-gray-500 mt-1">Total Referrals</p>
        </div>
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <p className="text-3xl font-bold text-green-600">{completedReferrals.length}</p>
          <p className="text-xs text-gray-500 mt-1">Completed</p>
        </div>
        <div className="text-center p-4 bg-cyan-50 rounded-lg">
          <p className="text-3xl font-bold text-cyan-600">${totalEarned}</p>
          <p className="text-xs text-gray-500 mt-1">Earned</p>
        </div>
      </div>

      {/* Referral List */}
      {loading ? (
        <div className="py-8 text-center">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading referrals...</p>
        </div>
      ) : referrals.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <UsersIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No referrals yet</p>
          <p className="text-xs text-gray-400 mt-1">
            Share your code to earn rewards for each new client!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">Referral History</h4>

          {/* Pending Referrals */}
          {pendingReferrals.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Pending</p>
              {pendingReferrals.map((referral) => (
                <div
                  key={referral.id}
                  className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                      <UserIcon className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {referral.referredClientName || 'New Client'}
                      </p>
                      <p className="text-xs text-gray-500">
                        Referred on {formatDate(referral.createdAt)}
                      </p>
                    </div>
                  </div>
                  <Badge variant="warning" size="sm">
                    Awaiting First Visit
                  </Badge>
                </div>
              ))}
            </div>
          )}

          {/* Completed Referrals */}
          {completedReferrals.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Completed</p>
              {completedReferrals.map((referral) => (
                <div
                  key={referral.id}
                  className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircleIcon className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {referral.referredClientName || 'Client'}
                      </p>
                      <p className="text-xs text-gray-500">
                        Completed {referral.completedAt ? formatDate(referral.completedAt) : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">+$25</p>
                    <Badge
                      variant={referral.referrerRewardIssued ? 'success' : 'warning'}
                      size="sm"
                    >
                      {referral.referrerRewardIssued ? 'Reward Issued' : 'Pending Reward'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Referral Program Info */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="flex items-start gap-3 text-sm text-gray-500">
          <InfoIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <p>
            Earn <span className="font-medium text-gray-700">$25</span> for each new client
            who books their first appointment using your referral code.
            New clients also receive <span className="font-medium text-gray-700">15% off</span> their first service!
          </p>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && referralCode && (
        <ShareReferralModal
          code={referralCode}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </Card>
  );
};

// Share Modal Component
const ShareReferralModal: React.FC<{
  code: string;
  onClose: () => void;
}> = ({ code, onClose }) => {
  const shareMessage = `Use my referral code ${code} and get 15% off your first visit!`;
  const [copied, setCopied] = useState(false);

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(shareMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="px-6 py-4 bg-cyan-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Share Referral Code</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <CloseIcon className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">{shareMessage}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleCopyMessage}
              className="flex items-center justify-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {copied ? <CheckIcon className="w-5 h-5 text-green-500" /> : <CopyIcon className="w-5 h-5 text-gray-500" />}
              <span className="text-sm font-medium">{copied ? 'Copied!' : 'Copy'}</span>
            </button>
            <button
              onClick={() => window.open(`sms:?body=${encodeURIComponent(shareMessage)}`)}
              className="flex items-center justify-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <MessageIcon className="w-5 h-5 text-gray-500" />
              <span className="text-sm font-medium">Text</span>
            </button>
            <button
              onClick={() => window.open(`mailto:?subject=Referral&body=${encodeURIComponent(shareMessage)}`)}
              className="flex items-center justify-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <MailIcon className="w-5 h-5 text-gray-500" />
              <span className="text-sm font-medium">Email</span>
            </button>
            <button
              onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(shareMessage)}`)}
              className="flex items-center justify-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <WhatsAppIcon className="w-5 h-5 text-green-500" />
              <span className="text-sm font-medium">WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Icons
const CopyIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const ShareIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
  </svg>
);

const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const CheckCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const UsersIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const UserIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const InfoIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const MessageIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const MailIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const WhatsAppIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

export default ReferralTrackingCard;
