import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Card, SectionHeader, Input, Button } from '../components/SharedComponents';

// Icon components
const InfoIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CardIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
);

const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

interface LoginCredentialsProps {
  email: string;
  cardId?: string | null;
  onPasswordChange?: (newPassword: string) => Promise<void>;
  onPinChange?: (newPin: string) => Promise<void>;
  onCardIdChange?: (cardId: string | null) => Promise<void>;
}

export const LoginCredentialsSection: React.FC<LoginCredentialsProps> = ({
  email,
  cardId,
  onPasswordChange,
  onPinChange,
  onCardIdChange,
}) => {
  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // PIN change state
  const [showPinForm, setShowPinForm] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinSaving, setPinSaving] = useState(false);
  const [pinSuccess, setPinSuccess] = useState(false);

  // Staff Card state
  const [showCardForm, setShowCardForm] = useState(false);
  const [cardScanActive, setCardScanActive] = useState(false);
  const [scannedCardId, setScannedCardId] = useState('');
  const [cardError, setCardError] = useState<string | null>(null);
  const [cardSaving, setCardSaving] = useState(false);
  const [cardSuccess, setCardSuccess] = useState(false);

  // Card reader detection refs
  const cardBufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);
  const cardTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const CARD_INPUT_TIMEOUT = 100; // ms

  // Password validation and save
  const handlePasswordSave = useCallback(async () => {
    setPasswordError(null);

    // Validate
    if (!newPassword) {
      setPasswordError('Password is required');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    setPasswordSaving(true);
    try {
      await onPasswordChange?.(newPassword);
      setPasswordSuccess(true);
      setShowPasswordForm(false);
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to update password');
    } finally {
      setPasswordSaving(false);
    }
  }, [newPassword, confirmPassword, onPasswordChange]);

  // PIN validation and save
  const handlePinSave = useCallback(async () => {
    setPinError(null);

    // Validate
    if (!newPin) {
      setPinError('PIN is required');
      return;
    }
    if (!/^\d{4,6}$/.test(newPin)) {
      setPinError('PIN must be 4-6 digits');
      return;
    }
    if (newPin !== confirmPin) {
      setPinError('PINs do not match');
      return;
    }

    setPinSaving(true);
    try {
      await onPinChange?.(newPin);
      setPinSuccess(true);
      setShowPinForm(false);
      setNewPin('');
      setConfirmPin('');
      setTimeout(() => setPinSuccess(false), 3000);
    } catch (err: any) {
      setPinError(err.message || 'Failed to update PIN');
    } finally {
      setPinSaving(false);
    }
  }, [newPin, confirmPin, onPinChange]);

  const handleCancelPassword = useCallback(() => {
    setShowPasswordForm(false);
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError(null);
  }, []);

  const handleCancelPin = useCallback(() => {
    setShowPinForm(false);
    setNewPin('');
    setConfirmPin('');
    setPinError(null);
  }, []);

  // Staff Card save
  const handleCardSave = useCallback(async () => {
    if (!scannedCardId) {
      setCardError('Please scan a card first');
      return;
    }

    setCardSaving(true);
    setCardError(null);
    try {
      await onCardIdChange?.(scannedCardId);
      setCardSuccess(true);
      setShowCardForm(false);
      setScannedCardId('');
      setTimeout(() => setCardSuccess(false), 3000);
    } catch (err: unknown) {
      const error = err as { message?: string };
      setCardError(error.message || 'Failed to save card');
    } finally {
      setCardSaving(false);
    }
  }, [scannedCardId, onCardIdChange]);

  // Remove Staff Card
  const handleRemoveCard = useCallback(async () => {
    setCardSaving(true);
    setCardError(null);
    try {
      await onCardIdChange?.(null);
      setCardSuccess(true);
      setTimeout(() => setCardSuccess(false), 3000);
    } catch (err: unknown) {
      const error = err as { message?: string };
      setCardError(error.message || 'Failed to remove card');
    } finally {
      setCardSaving(false);
    }
  }, [onCardIdChange]);

  const handleCancelCard = useCallback(() => {
    setShowCardForm(false);
    setScannedCardId('');
    setCardError(null);
    setCardScanActive(false);
    cardBufferRef.current = '';
  }, []);

  // Global keyboard listener for card reader detection (when form is open)
  useEffect(() => {
    if (!showCardForm) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const now = Date.now();
      const timeSinceLastKey = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      // If Enter key and we have buffered card data
      if (e.key === 'Enter' && cardBufferRef.current.length >= 4) {
        e.preventDefault();
        setScannedCardId(cardBufferRef.current);
        cardBufferRef.current = '';
        setCardScanActive(false);
        return;
      }

      // Detect rapid input (card reader behavior)
      if (timeSinceLastKey < CARD_INPUT_TIMEOUT && e.key.length === 1) {
        cardBufferRef.current += e.key;
        setCardScanActive(true);
        e.preventDefault();

        // Clear any existing timeout
        if (cardTimeoutRef.current) {
          clearTimeout(cardTimeoutRef.current);
        }

        // Set timeout to finalize card data
        cardTimeoutRef.current = setTimeout(() => {
          if (cardBufferRef.current.length >= 4) {
            setScannedCardId(cardBufferRef.current);
          }
          cardBufferRef.current = '';
          setCardScanActive(false);
        }, 300);
      } else if (e.key.length === 1) {
        // Start of potential card swipe
        cardBufferRef.current = e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      if (cardTimeoutRef.current) {
        clearTimeout(cardTimeoutRef.current);
      }
    };
  }, [showCardForm]);

  return (
    <div className="space-y-6">
      {/* Login Email */}
      <Card padding="lg">
        <SectionHeader
          title="Login Credentials"
          subtitle="Manage login email and password for user switching"
          icon={<KeyIcon className="w-5 h-5" />}
        />

        <div className="space-y-4">
          {/* Email (read-only display) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Login Email
            </label>
            <div className="flex items-center gap-3">
              <div className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-700">
                {email || 'No email set'}
              </div>
              <span className="text-xs text-gray-400">
                Edit in Profile section
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              This email is used to sign in when switching users at the front desk.
            </p>
          </div>

          {/* Password Section */}
          <div className="pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Password</h4>
                <p className="text-xs text-gray-500">
                  Used for user switching at shared terminals
                </p>
              </div>
              {!showPasswordForm && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPasswordForm(true)}
                >
                  Change Password
                </Button>
              )}
            </div>

            {passwordSuccess && (
              <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg mb-3">
                <CheckIcon className="w-4 h-4" />
                <span className="text-sm">Password updated successfully</span>
              </div>
            )}

            {showPasswordForm && (
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <Input
                  label="New Password"
                  type="password"
                  value={newPassword}
                  onChange={setNewPassword}
                  placeholder="Enter new password"
                  error={passwordError && newPassword === '' ? passwordError : undefined}
                />
                <Input
                  label="Confirm Password"
                  type="password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  placeholder="Confirm new password"
                  error={passwordError && confirmPassword !== '' ? passwordError : undefined}
                />
                {passwordError && (
                  <p className="text-sm text-red-500">{passwordError}</p>
                )}
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancelPassword}
                    disabled={passwordSaving}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handlePasswordSave}
                    disabled={passwordSaving || !newPassword || !confirmPassword}
                  >
                    {passwordSaving ? 'Saving...' : 'Save Password'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* PIN Section */}
      <Card padding="lg">
        <SectionHeader
          title="Security PIN"
          subtitle="PIN for accessing restricted pages within the app"
          icon={<LockIcon className="w-5 h-5" />}
        />

        <div className="space-y-4">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-3">
              <InfoIcon className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-amber-800">What is the PIN for?</h4>
                <p className="text-xs text-amber-700 mt-1">
                  The PIN is used to access restricted features within the app after logging in,
                  such as viewing reports, processing refunds, or accessing admin settings.
                  It is NOT used for user switching (use password for that).
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Current PIN</h4>
              <p className="text-xs text-gray-500">
                4-6 digit PIN for restricted access
              </p>
            </div>
            {!showPinForm && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPinForm(true)}
              >
                Change PIN
              </Button>
            )}
          </div>

          {pinSuccess && (
            <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg">
              <CheckIcon className="w-4 h-4" />
              <span className="text-sm">PIN updated successfully</span>
            </div>
          )}

          {showPinForm && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <Input
                label="New PIN"
                type="password"
                value={newPin}
                onChange={(val) => setNewPin(val.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter 4-6 digit PIN"
              />
              <Input
                label="Confirm PIN"
                type="password"
                value={confirmPin}
                onChange={(val) => setConfirmPin(val.replace(/\D/g, '').slice(0, 6))}
                placeholder="Confirm PIN"
              />
              {pinError && (
                <p className="text-sm text-red-500">{pinError}</p>
              )}
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelPin}
                  disabled={pinSaving}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handlePinSave}
                  disabled={pinSaving || !newPin || !confirmPin}
                >
                  {pinSaving ? 'Saving...' : 'Save PIN'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Staff Card Section */}
      <Card padding="lg">
        <SectionHeader
          title="Staff Card"
          subtitle="NFC or magnetic stripe card for quick authentication"
          icon={<CardIcon className="w-5 h-5" />}
        />

        <div className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <InfoIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-blue-800">What is the Staff Card for?</h4>
                <p className="text-xs text-blue-700 mt-1">
                  Staff cards provide a quick way to authenticate at the front desk without typing a PIN.
                  Simply scan or swipe your card to verify your identity.
                </p>
              </div>
            </div>
          </div>

          {/* Current Card Status */}
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">
                {cardId ? 'Card Registered' : 'No Card Registered'}
              </h4>
              <p className="text-xs text-gray-500">
                {cardId
                  ? `Card ID: ${cardId.slice(0, 4)}...${cardId.slice(-4)}`
                  : 'Scan a card to register it for this member'}
              </p>
            </div>
            {!showCardForm && (
              <div className="flex gap-2">
                {cardId && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveCard}
                    disabled={cardSaving}
                  >
                    Remove Card
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCardForm(true)}
                >
                  {cardId ? 'Change Card' : 'Register Card'}
                </Button>
              </div>
            )}
          </div>

          {cardSuccess && (
            <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg">
              <CheckIcon className="w-4 h-4" />
              <span className="text-sm">Card updated successfully</span>
            </div>
          )}

          {cardError && !showCardForm && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg">
              <span className="text-sm">{cardError}</span>
            </div>
          )}

          {showCardForm && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              {/* Card Scan Area */}
              <div className={`
                p-6 border-2 border-dashed rounded-xl text-center transition-all
                ${cardScanActive ? 'border-purple-400 bg-purple-50' : 'border-gray-300 bg-white'}
                ${scannedCardId ? 'border-green-400 bg-green-50' : ''}
              `}>
                <CardIcon className={`w-12 h-12 mx-auto mb-3 ${
                  cardScanActive ? 'text-purple-500 animate-pulse' :
                  scannedCardId ? 'text-green-500' : 'text-gray-400'
                }`} />

                {scannedCardId ? (
                  <>
                    <p className="text-sm font-medium text-green-700">Card Detected!</p>
                    <p className="text-xs text-green-600 mt-1">
                      Card ID: {scannedCardId.slice(0, 6)}...{scannedCardId.slice(-4)}
                    </p>
                  </>
                ) : cardScanActive ? (
                  <>
                    <p className="text-sm font-medium text-purple-700">Reading card...</p>
                    <p className="text-xs text-purple-600 mt-1">Please wait</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium text-gray-700">Scan or Swipe Staff Card</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Position the card near the reader or swipe through
                    </p>
                    <div className="flex items-center justify-center gap-2 mt-3 text-gray-400">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <span className="text-xs">Listening for card...</span>
                    </div>
                  </>
                )}
              </div>

              {cardError && (
                <p className="text-sm text-red-500">{cardError}</p>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelCard}
                  disabled={cardSaving}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleCardSave}
                  disabled={cardSaving || !scannedCardId}
                >
                  {cardSaving ? 'Saving...' : 'Save Card'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

// Icons
const KeyIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
  </svg>
);

const LockIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

export default LoginCredentialsSection;
