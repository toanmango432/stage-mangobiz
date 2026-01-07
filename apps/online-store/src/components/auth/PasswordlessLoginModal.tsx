import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { mockAuthApi } from '@/lib/api/mockAuth';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, X } from 'lucide-react';

interface PasswordlessLoginModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (userId: string) => void;
  onSwitchToPassword: () => void;
}

type Stage = 'input' | 'verify' | 'register';

export const PasswordlessLoginModal = ({
  open,
  onClose,
  onSuccess,
  onSwitchToPassword,
}: PasswordlessLoginModalProps) => {
  const [stage, setStage] = useState<Stage>('input');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [phone, setPhone] = useState('');
  const [emailPrefs, setEmailPrefs] = useState(true);
  const [smsPrefs, setSmsPrefs] = useState(true);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendCode = async () => {
    if (!emailOrPhone.trim()) {
      toast({ title: 'Please enter email or phone', variant: 'destructive' });
      return;
    }

    setLoading(true);
    const result = await mockAuthApi.sendVerificationCode(emailOrPhone);
    setLoading(false);

    if (result.success) {
      setStage('verify');
      setCountdown(300);
      toast({ title: 'Code sent! Use: 123456' });
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  const handleVerifyCode = async () => {
    if (code.length !== 6) {
      toast({ title: 'Please enter 6 digits', variant: 'destructive' });
      return;
    }

    setLoading(true);
    const result = await mockAuthApi.verifyCode(emailOrPhone, code);
    setLoading(false);

    if (result.success && !result.isNewUser) {
      toast({ title: 'Welcome back!' });
      onSuccess(result.userId!);
      onClose();
    } else if (result.success && result.isNewUser) {
      setStage('register');
    } else {
      toast({ title: 'Invalid code', description: result.error, variant: 'destructive' });
    }
  };

  const handleRegister = async () => {
    if (!firstName || !lastName) {
      toast({ title: 'Please fill required fields', variant: 'destructive' });
      return;
    }

    setLoading(true);
    const result = await mockAuthApi.createProfile({
      email: emailOrPhone.includes('@') ? emailOrPhone : '',
      phone: emailOrPhone.includes('@') ? phone : emailOrPhone,
      firstName,
      lastName,
      dateOfBirth,
      communicationPrefs: { email: emailPrefs, sms: smsPrefs },
    });
    setLoading(false);

    if (result.success) {
      toast({ title: 'Account created!' });
      onSuccess(result.user!.id);
      onClose();
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            {stage !== 'input' && (
              <Button variant="ghost" size="icon" onClick={() => setStage(stage === 'register' ? 'verify' : 'input')}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <DialogTitle>
              {stage === 'input' && 'Verification'}
              {stage === 'verify' && 'Enter Code'}
              {stage === 'register' && 'Additional Details'}
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        {stage === 'input' && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Enter email or mobile number</Label>
              <Input value={emailOrPhone} onChange={(e) => setEmailOrPhone(e.target.value)} />
            </div>
            <Button onClick={handleSendCode} disabled={loading} className="w-full">
              Generate verification code
            </Button>
            <div className="relative"><div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Or</span></div></div>
            <Button variant="outline" onClick={onSwitchToPassword} className="w-full">Log in with password</Button>
          </div>
        )}

        {stage === 'verify' && (
          <div className="space-y-4 py-4">
            <p className="text-sm">We sent code to <strong>{emailOrPhone}</strong></p>
            <div className="space-y-2">
              <Label>Enter verification code</Label>
              <Input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} maxLength={6} />
            </div>
            <div className="flex justify-between text-sm">
              <span>{Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}</span>
              <Button variant="link" onClick={handleSendCode} disabled={countdown > 0} className="p-0 h-auto">Resend</Button>
            </div>
            <Button onClick={handleVerifyCode} disabled={loading} className="w-full">Confirm</Button>
          </div>
        )}

        {stage === 'register' && (
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>First Name *</Label><Input value={firstName} onChange={(e) => setFirstName(e.target.value)} /></div>
              <div><Label>Last Name *</Label><Input value={lastName} onChange={(e) => setLastName(e.target.value)} /></div>
            </div>
            <div><Label>Date of Birth</Label><Input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} /></div>
            <div><Label>Email *</Label><Input value={emailOrPhone.includes('@') ? emailOrPhone : ''} disabled={emailOrPhone.includes('@')} /></div>
            <div><Label>Mobile *</Label><Input value={emailOrPhone.includes('@') ? phone : emailOrPhone} onChange={(e) => setPhone(e.target.value)} disabled={!emailOrPhone.includes('@')} /></div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2"><Checkbox id="e" checked={emailPrefs} onCheckedChange={(c) => setEmailPrefs(c as boolean)} /><Label htmlFor="e">Email</Label></div>
              <div className="flex items-center space-x-2"><Checkbox id="s" checked={smsPrefs} onCheckedChange={(c) => setSmsPrefs(c as boolean)} /><Label htmlFor="s">SMS</Label></div>
            </div>
            <Button onClick={handleRegister} disabled={loading} className="w-full">Save</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
