import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { mockAuthApi } from '@/lib/api/mockAuth';
import { toast } from '@/hooks/use-toast';
import { X } from 'lucide-react';

interface PasswordLoginDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (userId: string) => void;
  onBackToPasswordless: () => void;
}

export const PasswordLoginDialog = ({
  open,
  onClose,
  onSuccess,
  onBackToPasswordless,
}: PasswordLoginDialogProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      toast({ title: 'Please fill all fields', variant: 'destructive' });
      return;
    }

    setLoading(true);
    const result = await mockAuthApi.loginWithPassword(email, password);
    setLoading(false);

    if (result.success) {
      toast({ title: 'Welcome back!' });
      onSuccess(result.user!.id);
      onClose();
    } else {
      toast({ title: 'Login failed', description: result.error, variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Log In</DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
          </div>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div><Label>Password</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          <Button variant="link" className="p-0 h-auto text-sm">Forgot password?</Button>
          <Button onClick={handleLogin} disabled={loading} className="w-full">Log In</Button>
          <Button variant="outline" onClick={onBackToPasswordless} className="w-full">Back to passwordless</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
