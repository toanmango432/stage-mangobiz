import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface BillingAddress {
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface BillingAddressFormProps {
  onSubmit: (address: BillingAddress) => void;
}

export const BillingAddressForm = ({ onSubmit }: BillingAddressFormProps) => {
  const [address, setAddress] = useState<BillingAddress>({
    address1: '',
    address2: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!address.address1.trim()) newErrors.address1 = 'Address is required';
    if (!address.city.trim()) newErrors.city = 'City is required';
    if (!address.state.trim()) newErrors.state = 'State is required';
    if (!address.zipCode.trim()) newErrors.zipCode = 'Zip code is required';
    if (!address.country.trim()) newErrors.country = 'Country is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      onSubmit(address);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="address1">Address Line 1*</Label>
        <Input
          id="address1"
          value={address.address1}
          onChange={(e) => setAddress({ ...address, address1: e.target.value })}
          placeholder="5134 Hinkleville Rd"
          className={errors.address1 ? 'border-destructive' : ''}
        />
        {errors.address1 && <p className="text-sm text-destructive">{errors.address1}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="address2">Address Line 2</Label>
        <Input
          id="address2"
          value={address.address2}
          onChange={(e) => setAddress({ ...address, address2: e.target.value })}
          placeholder="Apartment, suite, unit, building, floor, etc."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="city">City*</Label>
        <Input
          id="city"
          value={address.city}
          onChange={(e) => setAddress({ ...address, city: e.target.value })}
          placeholder="Paducah"
          className={errors.city ? 'border-destructive' : ''}
        />
        {errors.city && <p className="text-sm text-destructive">{errors.city}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="state">State*</Label>
        <Input
          id="state"
          value={address.state}
          onChange={(e) => setAddress({ ...address, state: e.target.value })}
          placeholder="Kentucky"
          className={errors.state ? 'border-destructive' : ''}
        />
        {errors.state && <p className="text-sm text-destructive">{errors.state}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="zipCode">Zip Code*</Label>
        <Input
          id="zipCode"
          value={address.zipCode}
          onChange={(e) => setAddress({ ...address, zipCode: e.target.value })}
          placeholder="42001"
          className={errors.zipCode ? 'border-destructive' : ''}
        />
        {errors.zipCode && <p className="text-sm text-destructive">{errors.zipCode}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="country">Country*</Label>
        <Input
          id="country"
          value={address.country}
          onChange={(e) => setAddress({ ...address, country: e.target.value })}
          className={errors.country ? 'border-destructive' : ''}
        />
        {errors.country && <p className="text-sm text-destructive">{errors.country}</p>}
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSubmit}>Submit</Button>
      </div>
    </div>
  );
};
