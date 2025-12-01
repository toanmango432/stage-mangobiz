import React, { useState } from 'react';
import type { CommissionSettings, PayrollSettings, CommissionType, PayPeriod } from '../types';
import { Card, SectionHeader, Toggle, Button, Badge, Input, Select } from '../components/SharedComponents';

interface CommissionSectionProps {
  commission: CommissionSettings;
  payroll: PayrollSettings;
  onCommissionChange: (commission: CommissionSettings) => void;
  onPayrollChange: (payroll: PayrollSettings) => void;
}

export const CommissionSection: React.FC<CommissionSectionProps> = ({
  commission,
  payroll,
  onCommissionChange,
  onPayrollChange,
}) => {
  const [activeTab, setActiveTab] = useState<'commission' | 'payroll'>('commission');

  const commissionTypeOptions = [
    { value: 'percentage', label: 'Percentage Based' },
    { value: 'tiered', label: 'Tiered Commission' },
    { value: 'flat', label: 'Flat Amount' },
    { value: 'none', label: 'No Commission' },
  ];

  const tipHandlingOptions = [
    { value: 'keep_all', label: 'Keep All Tips' },
    { value: 'pool', label: 'Tip Pool' },
    { value: 'percentage', label: 'Percentage to House' },
  ];

  const payPeriodOptions = [
    { value: 'weekly', label: 'Weekly' },
    { value: 'bi-weekly', label: 'Bi-Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'per-service', label: 'Per Service' },
  ];

  const addTier = () => {
    const tiers = commission.tiers || [];
    const lastTier = tiers[tiers.length - 1];
    const minRevenue = lastTier ? (lastTier.maxRevenue || lastTier.minRevenue + 5000) : 0;

    onCommissionChange({
      ...commission,
      tiers: [
        ...tiers,
        { minRevenue, maxRevenue: minRevenue + 5000, percentage: commission.basePercentage + 5 },
      ],
    });
  };

  const updateTier = (index: number, field: string, value: number | undefined) => {
    const tiers = [...(commission.tiers || [])];
    tiers[index] = { ...tiers[index], [field]: value };
    onCommissionChange({ ...commission, tiers });
  };

  const removeTier = (index: number) => {
    const tiers = (commission.tiers || []).filter((_, i) => i !== index);
    onCommissionChange({ ...commission, tiers });
  };

  // Calculate example earnings
  const calculateExampleEarnings = (revenue: number): number => {
    if (commission.type === 'none') return 0;
    if (commission.type === 'flat') return commission.flatAmount || 0;
    if (commission.type === 'percentage') return revenue * (commission.basePercentage / 100);
    if (commission.type === 'tiered' && commission.tiers) {
      let earnings = 0;
      let remaining = revenue;
      for (const tier of commission.tiers) {
        if (remaining <= 0) break;
        const tierMax = tier.maxRevenue ? tier.maxRevenue - tier.minRevenue : remaining;
        const tierAmount = Math.min(remaining, tierMax);
        earnings += tierAmount * (tier.percentage / 100);
        remaining -= tierAmount;
      }
      return earnings;
    }
    return 0;
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card padding="md" className="text-center">
          <p className="text-2xl font-bold text-emerald-600">
            {commission.type === 'percentage' ? `${commission.basePercentage}%` :
             commission.type === 'flat' ? `$${commission.flatAmount || 0}` :
             commission.type === 'tiered' ? 'Tiered' : 'N/A'}
          </p>
          <p className="text-sm text-gray-500">Commission Rate</p>
        </Card>
        <Card padding="md" className="text-center">
          <p className="text-2xl font-bold text-cyan-600">
            {commission.tipHandling === 'keep_all' ? '100%' :
             commission.tipHandling === 'pool' ? 'Pooled' :
             `${100 - (commission.tipPercentageToHouse || 0)}%`}
          </p>
          <p className="text-sm text-gray-500">Tips Kept</p>
        </Card>
        <Card padding="md" className="text-center">
          <p className="text-2xl font-bold text-gray-900">
            {payroll.baseSalary ? `$${payroll.baseSalary.toLocaleString()}` :
             payroll.hourlyRate ? `$${payroll.hourlyRate}/hr` : 'Commission'}
          </p>
          <p className="text-sm text-gray-500">Base Pay</p>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
        {[
          { id: 'commission', label: 'Commission', icon: <PercentIcon className="w-4 h-4" /> },
          { id: 'payroll', label: 'Payroll', icon: <DollarIcon className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`
              flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium
              transition-all duration-200
              ${activeTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
              }
            `}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Commission Tab */}
      {activeTab === 'commission' && (
        <>
          {/* Commission Type */}
          <Card padding="lg">
            <SectionHeader
              title="Commission Structure"
              subtitle="How this team member earns commission"
              icon={<PercentIcon className="w-5 h-5" />}
            />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {commissionTypeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => onCommissionChange({ ...commission, type: option.value as CommissionType })}
                  className={`
                    p-4 rounded-xl border-2 text-center transition-all duration-200
                    ${commission.type === option.value
                      ? 'border-cyan-500 bg-cyan-50'
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <p className={`font-medium ${commission.type === option.value ? 'text-cyan-700' : 'text-gray-700'}`}>
                    {option.label}
                  </p>
                </button>
              ))}
            </div>

            {/* Percentage Based */}
            {commission.type === 'percentage' && (
              <div className="p-4 bg-gray-50 rounded-xl">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Commission Percentage
                </label>
                <div className="flex items-center gap-4">
                  <div className="relative flex-1 max-w-xs">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={commission.basePercentage}
                      onChange={(e) => onCommissionChange({ ...commission, basePercentage: Number(e.target.value) })}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>0%</span>
                      <span>50%</span>
                      <span>100%</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={commission.basePercentage}
                      onChange={(e) => onCommissionChange({ ...commission, basePercentage: Number(e.target.value) })}
                      className="w-20 px-3 py-2 text-center text-lg font-bold border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                    <span className="text-lg font-bold text-gray-400">%</span>
                  </div>
                </div>
              </div>
            )}

            {/* Tiered Commission */}
            {commission.type === 'tiered' && (
              <div className="space-y-4">
                <div className="space-y-3">
                  {(commission.tiers || []).map((tier, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-4">
                        <div className="flex-1 grid grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              From Revenue
                            </label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                              <input
                                type="number"
                                value={tier.minRevenue}
                                onChange={(e) => updateTier(index, 'minRevenue', Number(e.target.value))}
                                className="w-full pl-7 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              To Revenue
                            </label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                              <input
                                type="number"
                                value={tier.maxRevenue || ''}
                                onChange={(e) => updateTier(index, 'maxRevenue', e.target.value ? Number(e.target.value) : undefined)}
                                placeholder="Unlimited"
                                className="w-full pl-7 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              Commission %
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                value={tier.percentage}
                                onChange={(e) => updateTier(index, 'percentage', Number(e.target.value))}
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => removeTier(index)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="outline" size="sm" icon={<PlusIcon className="w-4 h-4" />} onClick={addTier}>
                  Add Tier
                </Button>
              </div>
            )}

            {/* Flat Amount */}
            {commission.type === 'flat' && (
              <div className="p-4 bg-gray-50 rounded-xl">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Flat Commission Amount (per pay period)
                </label>
                <div className="relative max-w-xs">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                  <input
                    type="number"
                    value={commission.flatAmount || ''}
                    onChange={(e) => onCommissionChange({ ...commission, flatAmount: Number(e.target.value) })}
                    className="w-full pl-7 pr-4 py-2 text-lg font-bold border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>
            )}
          </Card>

          {/* Additional Commission Settings */}
          <Card padding="lg">
            <SectionHeader
              title="Additional Commission"
              subtitle="Product sales and bonuses"
              icon={<GiftIcon className="w-5 h-5" />}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-gray-50 rounded-xl">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Commission
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={commission.productCommission}
                    onChange={(e) => onCommissionChange({ ...commission, productCommission: Number(e.target.value) })}
                    className="w-24 px-3 py-2 text-center border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                  <span className="text-gray-500">% of product sales</span>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Retail Commission
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={commission.retailCommission || ''}
                    onChange={(e) => onCommissionChange({ ...commission, retailCommission: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="0"
                    className="w-24 px-3 py-2 text-center border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                  <span className="text-gray-500">% of retail sales</span>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Client Bonus
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">$</span>
                  <input
                    type="number"
                    value={commission.newClientBonus || ''}
                    onChange={(e) => onCommissionChange({ ...commission, newClientBonus: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="0"
                    className="w-24 px-3 py-2 text-center border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                  <span className="text-gray-500">per new client</span>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rebook Bonus
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">$</span>
                  <input
                    type="number"
                    value={commission.rebookBonus || ''}
                    onChange={(e) => onCommissionChange({ ...commission, rebookBonus: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="0"
                    className="w-24 px-3 py-2 text-center border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                  <span className="text-gray-500">per rebooking</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Tip Handling */}
          <Card padding="lg">
            <SectionHeader
              title="Tip Handling"
              subtitle="How tips are distributed"
              icon={<HeartIcon className="w-5 h-5" />}
            />

            <div className="grid grid-cols-3 gap-3 mb-4">
              {tipHandlingOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => onCommissionChange({ ...commission, tipHandling: option.value as typeof commission.tipHandling })}
                  className={`
                    p-4 rounded-xl border-2 text-center transition-all duration-200
                    ${commission.tipHandling === option.value
                      ? 'border-cyan-500 bg-cyan-50'
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <p className={`font-medium ${commission.tipHandling === option.value ? 'text-cyan-700' : 'text-gray-700'}`}>
                    {option.label}
                  </p>
                </button>
              ))}
            </div>

            {commission.tipHandling === 'percentage' && (
              <div className="p-4 bg-gray-50 rounded-xl">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Percentage to House
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={commission.tipPercentageToHouse || 0}
                    onChange={(e) => onCommissionChange({ ...commission, tipPercentageToHouse: Number(e.target.value) })}
                    className="w-24 px-3 py-2 text-center border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                  <span className="text-gray-500">% goes to house</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Team member keeps {100 - (commission.tipPercentageToHouse || 0)}% of tips
                </p>
              </div>
            )}
          </Card>

          {/* Earnings Calculator */}
          <Card padding="lg" className="bg-gradient-to-br from-cyan-50 to-teal-50 border-cyan-200">
            <SectionHeader
              title="Earnings Calculator"
              subtitle="Example earnings based on current settings"
              icon={<CalculatorIcon className="w-5 h-5" />}
            />

            <div className="grid grid-cols-3 gap-6 mt-4">
              {[5000, 10000, 15000].map((revenue) => (
                <div key={revenue} className="text-center">
                  <p className="text-sm text-gray-600 mb-1">${revenue.toLocaleString()} revenue</p>
                  <p className="text-2xl font-bold text-cyan-700">
                    ${calculateExampleEarnings(revenue).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                  <p className="text-xs text-gray-500">commission earned</p>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      {/* Payroll Tab */}
      {activeTab === 'payroll' && (
        <>
          {/* Pay Period */}
          <Card padding="lg">
            <SectionHeader
              title="Pay Period"
              subtitle="How often this team member is paid"
              icon={<CalendarIcon className="w-5 h-5" />}
            />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {payPeriodOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => onPayrollChange({ ...payroll, payPeriod: option.value as PayPeriod })}
                  className={`
                    p-4 rounded-xl border-2 text-center transition-all duration-200
                    ${payroll.payPeriod === option.value
                      ? 'border-cyan-500 bg-cyan-50'
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <p className={`font-medium ${payroll.payPeriod === option.value ? 'text-cyan-700' : 'text-gray-700'}`}>
                    {option.label}
                  </p>
                </button>
              ))}
            </div>
          </Card>

          {/* Base Pay */}
          <Card padding="lg">
            <SectionHeader
              title="Base Pay"
              subtitle="Fixed salary or hourly rate"
              icon={<DollarIcon className="w-5 h-5" />}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-gray-50 rounded-xl">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Base Salary (per {payroll.payPeriod === 'monthly' ? 'month' : 'period'})
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                  <input
                    type="number"
                    value={payroll.baseSalary || ''}
                    onChange={(e) => onPayrollChange({ ...payroll, baseSalary: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="0"
                    className="w-full pl-7 pr-4 py-2 text-lg border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hourly Rate
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                  <input
                    type="number"
                    value={payroll.hourlyRate || ''}
                    onChange={(e) => onPayrollChange({ ...payroll, hourlyRate: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="0"
                    className="w-full pl-7 pr-4 py-2 text-lg border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">/hr</span>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Guaranteed Minimum
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                  <input
                    type="number"
                    value={payroll.guaranteedMinimum || ''}
                    onChange={(e) => onPayrollChange({ ...payroll, guaranteedMinimum: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="0"
                    className="w-full pl-7 pr-4 py-2 text-lg border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Minimum pay regardless of commission earned
                </p>
              </div>
            </div>
          </Card>

          {/* Overtime */}
          <Card padding="lg">
            <SectionHeader
              title="Overtime"
              subtitle="Overtime rate and threshold"
              icon={<ClockIcon className="w-5 h-5" />}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-gray-50 rounded-xl">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Overtime Rate Multiplier
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.5"
                    value={payroll.overtimeRate || 1.5}
                    onChange={(e) => onPayrollChange({ ...payroll, overtimeRate: Number(e.target.value) })}
                    className="w-24 px-3 py-2 text-center border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                  <span className="text-gray-500">x regular rate</span>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Weekly Hours Threshold
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={payroll.overtimeThreshold || 40}
                    onChange={(e) => onPayrollChange({ ...payroll, overtimeThreshold: Number(e.target.value) })}
                    className="w-24 px-3 py-2 text-center border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                  <span className="text-gray-500">hours per week</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Deductions */}
          <Card padding="lg">
            <SectionHeader
              title="Deductions"
              subtitle="Pre-tax and post-tax payroll deductions"
              icon={<MinusCircleIcon className="w-5 h-5" />}
            />

            <div className="space-y-3">
              {(payroll.deductions || []).map((deduction, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Deduction Type
                        </label>
                        <input
                          type="text"
                          value={deduction.type}
                          onChange={(e) => {
                            const deductions = [...(payroll.deductions || [])];
                            deductions[index] = { ...deductions[index], type: e.target.value };
                            onPayrollChange({ ...payroll, deductions });
                          }}
                          placeholder="e.g., Health Insurance"
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Amount
                        </label>
                        <div className="relative">
                          {!deduction.isPercentage && (
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                          )}
                          <input
                            type="number"
                            value={deduction.amount}
                            onChange={(e) => {
                              const deductions = [...(payroll.deductions || [])];
                              deductions[index] = { ...deductions[index], amount: Number(e.target.value) };
                              onPayrollChange({ ...payroll, deductions });
                            }}
                            className={`w-full ${deduction.isPercentage ? 'px-3' : 'pl-7 pr-3'} py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500`}
                          />
                          {deduction.isPercentage && (
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Type
                        </label>
                        <select
                          value={deduction.isPercentage ? 'percentage' : 'fixed'}
                          onChange={(e) => {
                            const deductions = [...(payroll.deductions || [])];
                            deductions[index] = { ...deductions[index], isPercentage: e.target.value === 'percentage' };
                            onPayrollChange({ ...payroll, deductions });
                          }}
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        >
                          <option value="fixed">Fixed Amount</option>
                          <option value="percentage">Percentage</option>
                        </select>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const deductions = (payroll.deductions || []).filter((_, i) => i !== index);
                        onPayrollChange({ ...payroll, deductions });
                      }}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {(!payroll.deductions || payroll.deductions.length === 0) && (
                <div className="p-6 text-center text-gray-400 bg-gray-50 rounded-xl">
                  <MinusCircleIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No deductions configured</p>
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                icon={<PlusIcon className="w-4 h-4" />}
                onClick={() => {
                  const deductions = [...(payroll.deductions || []), { type: '', amount: 0, isPercentage: false }];
                  onPayrollChange({ ...payroll, deductions });
                }}
              >
                Add Deduction
              </Button>
            </div>

            <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <div className="flex items-start gap-3">
                <InfoIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-800">Common Deductions</p>
                  <p className="text-xs text-blue-700 mt-0.5">
                    Health Insurance, 401(k), Dental, Vision, Life Insurance, HSA contributions
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

// Icons
const PercentIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z" />
  </svg>
);

const DollarIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const GiftIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
  </svg>
);

const HeartIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
);

const CalculatorIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
  </svg>
);

const CalendarIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const ClockIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const PlusIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const MinusCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const InfoIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export default CommissionSection;
