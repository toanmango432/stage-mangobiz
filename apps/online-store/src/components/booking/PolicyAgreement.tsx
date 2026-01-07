import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface PolicyAgreementProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export const PolicyAgreement = ({ checked, onCheckedChange }: PolicyAgreementProps) => {
  return (
    <div className="space-y-4 rounded-lg bg-[#F5F1E8] p-6 dark:bg-[#3A3630]">
      <div className="flex items-start space-x-3">
        <Checkbox
          id="policyAgreement"
          checked={checked}
          onCheckedChange={onCheckedChange}
        />
        <Label 
          htmlFor="policyAgreement" 
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          I authorize my credit card to be stored in accordance with the terms of the MiniLuxe privacy policy.
        </Label>
      </div>

      <div className="space-y-3 text-sm">
        <p>
          I understand that my credit card information will be saved on file for future transactions on my account and{' '}
          <strong>will not be charged until the day of my appointment.</strong>
        </p>

        <div className="space-y-2">
          <p className="font-semibold">Cancellation Policy:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              We ask that you <strong>contact us 4 hours</strong> prior to your service to avoid charges.
            </li>
            <li>
              If you need to cancel less than 4 hours before your appointment; you will be{' '}
              <strong>charged 50% of your services</strong> with the credit card on file.
            </li>
            <li>
              Missed appointments will be <strong>full-service amount</strong>.
            </li>
          </ul>
        </div>

        <p>
          Please visit our{' '}
          <a href="/faq" className="text-primary underline">
            FAQ
          </a>{' '}
          for full policy.
        </p>
      </div>
    </div>
  );
};
