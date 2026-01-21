/**
 * SuccessStep Component
 *
 * Success message shown after successful user switch.
 */

import { CheckCircle } from 'lucide-react';
import type { SuccessStepProps } from './types';

export function SuccessStep({ selectedMember }: SuccessStepProps) {
  return (
    <div className="text-center py-6">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <CheckCircle className="w-8 h-8 text-green-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">
        Welcome, {selectedMember.firstName}!
      </h3>
      <p className="text-sm text-gray-500">
        You're now signed in to the front desk.
      </p>
    </div>
  );
}

export default SuccessStep;
