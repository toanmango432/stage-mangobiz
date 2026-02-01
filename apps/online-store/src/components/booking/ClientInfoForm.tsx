import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { CheckCircle, User, Mail, Phone, MapPin, Save, Eye, EyeOff } from 'lucide-react';

interface ClientInfoFormProps {
  formData: any;
  updateFormData: (data: any) => void;
  isLoggedIn?: boolean;
  userInfo?: any;
  onComplete: () => void;
}

export const ClientInfoForm = ({
  formData,
  updateFormData,
  isLoggedIn = false,
  userInfo,
  onComplete,
}: ClientInfoFormProps) => {
  const [clientInfo, setClientInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    dateOfBirth: '',
    emergencyContact: '',
    emergencyPhone: '',
    notes: '',
    preferences: {
      emailNotifications: true,
      smsNotifications: true,
      marketingEmails: false,
      rememberInfo: true,
    },
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Pre-fill with user info if logged in
  useEffect(() => {
    if (isLoggedIn && userInfo) {
      setClientInfo(prev => ({
        ...prev,
        firstName: userInfo.firstName || '',
        lastName: userInfo.lastName || '',
        email: userInfo.email || '',
        phone: userInfo.phone || '',
        address: userInfo.address || '',
        city: userInfo.city || '',
        state: userInfo.state || '',
        zipCode: userInfo.zipCode || '',
      }));
    }
  }, [isLoggedIn, userInfo]);

  // Pre-fill with existing form data
  useEffect(() => {
    if (formData.clientInfo) {
      setClientInfo(prev => ({ ...prev, ...formData.clientInfo }));
    }
  }, [formData.clientInfo]);

  const handleInputChange = (field: string, value: any) => {
    setClientInfo(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePreferenceChange = (preference: string, value: boolean) => {
    setClientInfo(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [preference]: value,
      },
    }));
  };

  const handleComplete = () => {
    updateFormData({ 
      clientInfo: {
        ...clientInfo,
        isCreatingAccount,
        password: isCreatingAccount ? password : undefined,
      }
    });
    onComplete();
  };

  const validateForm = () => {
    const required: (keyof Pick<typeof clientInfo, 'firstName' | 'lastName' | 'email' | 'phone'>)[] = ['firstName', 'lastName', 'email', 'phone'];
    const isValid = required.every(field => clientInfo[field].trim());
    
    if (isCreatingAccount) {
      return isValid && password.length >= 6 && password === confirmPassword;
    }
    
    return isValid;
  };

  const canProceed = validateForm();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Contact Information</h2>
        <p className="text-muted-foreground">
          {isLoggedIn 
            ? "We've pre-filled your information. Please review and update if needed."
            : "Please provide your contact information to complete your booking."
          }
        </p>
      </div>

      {/* Account Creation Toggle */}
      {!isLoggedIn && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Create Account (Optional)</h3>
                <p className="text-sm text-muted-foreground">
                  Save your information for faster future bookings
                </p>
              </div>
              <Switch
                checked={isCreatingAccount}
                onCheckedChange={setIsCreatingAccount}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={clientInfo.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                placeholder="Enter your first name"
                className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={clientInfo.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                placeholder="Enter your last name"
                className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email Address *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={clientInfo.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="your@email.com"
                  className="pl-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="phone">Phone Number *</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  value={clientInfo.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="(555) 123-4567"
                  className="pl-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="dateOfBirth">Date of Birth (Optional)</Label>
            <Input
              id="dateOfBirth"
              type="date"
              value={clientInfo.dateOfBirth}
              onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
              className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </CardContent>
      </Card>

      {/* Address Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Address (Optional)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="address">Street Address</Label>
            <Input
              id="address"
              value={clientInfo.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="123 Main Street"
              className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={clientInfo.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder="City"
                className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={clientInfo.state}
                onChange={(e) => handleInputChange('state', e.target.value)}
                placeholder="State"
                className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <Label htmlFor="zipCode">ZIP Code</Label>
              <Input
                id="zipCode"
                value={clientInfo.zipCode}
                onChange={(e) => handleInputChange('zipCode', e.target.value)}
                placeholder="12345"
                className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Contact */}
      <Card>
        <CardHeader>
          <CardTitle>Emergency Contact (Optional)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="emergencyContact">Emergency Contact Name</Label>
              <Input
                id="emergencyContact"
                value={clientInfo.emergencyContact}
                onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                placeholder="Emergency contact name"
                className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <Label htmlFor="emergencyPhone">Emergency Contact Phone</Label>
              <Input
                id="emergencyPhone"
                type="tel"
                value={clientInfo.emergencyPhone}
                onChange={(e) => handleInputChange('emergencyPhone', e.target.value)}
                placeholder="(555) 123-4567"
                className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Creation Fields */}
      {isCreatingAccount && (
        <Card>
          <CardHeader>
            <CardTitle>Create Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="password">Password *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  className="pr-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
              />
              {password && confirmPassword && password !== confirmPassword && (
                <p className="text-sm text-red-600 mt-1">Passwords do not match</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Communication Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive booking confirmations and reminders
                </p>
              </div>
              <Switch
                checked={clientInfo.preferences.emailNotifications}
                onCheckedChange={(checked) => handlePreferenceChange('emailNotifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>SMS Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive text message reminders
                </p>
              </div>
              <Switch
                checked={clientInfo.preferences.smsNotifications}
                onCheckedChange={(checked) => handlePreferenceChange('smsNotifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Marketing Emails</Label>
                <p className="text-sm text-muted-foreground">
                  Receive special offers and promotions
                </p>
              </div>
              <Switch
                checked={clientInfo.preferences.marketingEmails}
                onCheckedChange={(checked) => handlePreferenceChange('marketingEmails', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Remember Information</Label>
                <p className="text-sm text-muted-foreground">
                  Save this information for future bookings
                </p>
              </div>
              <Switch
                checked={clientInfo.preferences.rememberInfo}
                onCheckedChange={(checked) => handlePreferenceChange('rememberInfo', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Notes (Optional)</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={clientInfo.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            placeholder="Any special requests or notes for your appointment..."
            rows={3}
            className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
          />
        </CardContent>
      </Card>

      {/* Action */}
      <div className="flex justify-end">
        <Button
          size="lg"
          onClick={handleComplete}
          disabled={!canProceed}
          className="px-8"
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          Continue to Policies
        </Button>
      </div>
    </div>
  );
};



