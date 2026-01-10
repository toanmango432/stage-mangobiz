/**
 * SettingsPage - Comprehensive Settings/Configuration Screen
 * US-011: Full customization of the Pad experience
 * Accessible via hidden gesture (4-finger long press) or PIN entry
 */

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  Wifi,
  DollarSign,
  Monitor,
  SplitSquareHorizontal,
  Image,
  Check,
  X,
  Plus,
  Trash2,
  Download,
  Upload,
  RotateCcw,
  ChevronRight,
  Edit2,
  Eye,
  EyeOff,
  Percent,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setScreen } from '@/store/slices/padSlice';
import {
  setConfig,
  setSalonId,
  setMqttBrokerUrl,
  setTipSettings,
  addPromoSlide,
  removePromoSlide,
  setBrandColors,
  setAccessibilitySettings,
  resetConfig,
  importConfig,
} from '@/store/slices/configSlice';
import type { PadConfig, PromoSlide } from '@/types';
import { v4 as uuidv4 } from 'uuid';

type SettingsTab =
  | 'connection'
  | 'payment'
  | 'idle'
  | 'display'
  | 'split'
  | 'advanced';

interface TabButtonProps {
  id: SettingsTab;
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}

function TabButton({ label, icon, active, onClick }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 w-full px-4 py-4 text-left rounded-xl transition-all min-h-[56px] ${
        active
          ? 'bg-indigo-600 text-white'
          : 'bg-white text-gray-700 hover:bg-gray-50'
      }`}
    >
      {icon}
      <span className="text-lg font-medium">{label}</span>
      <ChevronRight className={`w-5 h-5 ml-auto ${active ? 'text-white' : 'text-gray-400'}`} />
    </button>
  );
}

interface ToggleSwitchProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  label: string;
  description?: string;
}

function ToggleSwitch({ enabled, onChange, label, description }: ToggleSwitchProps) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-lg font-medium text-gray-900">{label}</p>
        {description && <p className="text-base text-gray-500">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`relative w-14 h-8 rounded-full transition-colors ${
          enabled ? 'bg-indigo-600' : 'bg-gray-300'
        }`}
        aria-label={`Toggle ${label}`}
      >
        <motion.div
          className="absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow"
          animate={{ x: enabled ? 24 : 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </button>
    </div>
  );
}

interface NumberInputProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
  description?: string;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

function NumberInput({
  value,
  onChange,
  label,
  description,
  min = 0,
  max = 999,
  step = 1,
  unit,
}: NumberInputProps) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex-1">
        <p className="text-lg font-medium text-gray-900">{label}</p>
        {description && <p className="text-base text-gray-500">{description}</p>}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          min={min}
          max={max}
          step={step}
          className="w-24 h-12 px-3 text-lg text-center border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {unit && <span className="text-lg text-gray-600">{unit}</span>}
      </div>
    </div>
  );
}

interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  description?: string;
  placeholder?: string;
  type?: 'text' | 'url' | 'password';
}

function TextInput({
  value,
  onChange,
  label,
  description,
  placeholder,
  type = 'text',
}: TextInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="py-3">
      <p className="text-lg font-medium text-gray-900 mb-1">{label}</p>
      {description && <p className="text-base text-gray-500 mb-2">{description}</p>}
      <div className="relative">
        <input
          type={type === 'password' && showPassword ? 'text' : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full h-12 px-4 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {type === 'password' && (
          <button
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        )}
      </div>
    </div>
  );
}

interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
}

function ColorPicker({ value, onChange, label }: ColorPickerProps) {
  return (
    <div className="flex items-center justify-between py-3">
      <p className="text-lg font-medium text-gray-900">{label}</p>
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-12 h-12 rounded-lg cursor-pointer border-0"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-28 h-12 px-3 text-center font-mono text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
    </div>
  );
}

interface TipValuesEditorProps {
  tipType: 'percentage' | 'dollar';
  values: number[];
  onChange: (values: number[]) => void;
}

function TipValuesEditor({ tipType, values, onChange }: TipValuesEditorProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setEditValue(values[index].toString());
  };

  const handleSave = (index: number) => {
    const newValues = [...values];
    newValues[index] = Number(editValue);
    onChange(newValues);
    setEditingIndex(null);
  };

  const handleAdd = () => {
    onChange([...values, tipType === 'percentage' ? 25 : 15]);
  };

  const handleRemove = (index: number) => {
    onChange(values.filter((_, i) => i !== index));
  };

  return (
    <div className="py-3">
      <p className="text-lg font-medium text-gray-900 mb-3">Tip Suggestions</p>
      <div className="flex flex-wrap gap-3">
        {values.map((val, index) => (
          <div
            key={index}
            className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2"
          >
            {editingIndex === index ? (
              <>
                <input
                  type="number"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="w-16 h-10 px-2 text-center text-lg border border-indigo-500 rounded-lg"
                  autoFocus
                />
                <button
                  onClick={() => handleSave(index)}
                  className="p-2 text-green-600 hover:bg-green-100 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  <Check className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setEditingIndex(null)}
                  className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </>
            ) : (
              <>
                <span className="text-lg font-medium px-2">
                  {tipType === 'percentage' ? `${val}%` : `$${val}`}
                </span>
                <button
                  onClick={() => handleEdit(index)}
                  className="p-2 text-gray-500 hover:bg-gray-200 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                {values.length > 1 && (
                  <button
                    onClick={() => handleRemove(index)}
                    className="p-2 text-red-500 hover:bg-red-100 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </>
            )}
          </div>
        ))}
        {values.length < 6 && (
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 min-h-[44px]"
          >
            <Plus className="w-5 h-5" />
            <span className="text-lg">Add</span>
          </button>
        )}
      </div>
    </div>
  );
}

interface SlideEditorProps {
  slides: PromoSlide[];
  onAdd: (slide: PromoSlide) => void;
  onRemove: (id: string) => void;
}

function SlideEditor({ slides, onAdd, onRemove }: SlideEditorProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newSlide, setNewSlide] = useState<Partial<PromoSlide>>({
    type: 'announcement',
    title: '',
    subtitle: '',
  });

  const handleAdd = () => {
    onAdd({
      id: uuidv4(),
      type: newSlide.type || 'announcement',
      title: newSlide.title || 'New Slide',
      subtitle: newSlide.subtitle,
      imageUrl: newSlide.imageUrl,
    });
    setNewSlide({ type: 'announcement', title: '', subtitle: '' });
    setIsAdding(false);
  };

  return (
    <div className="py-3">
      <div className="flex items-center justify-between mb-4">
        <p className="text-lg font-medium text-gray-900">Promo Slides</p>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 min-h-[44px]"
        >
          <Plus className="w-5 h-5" />
          <span>Add Slide</span>
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gray-50 rounded-xl p-4 mb-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-base font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  value={newSlide.type}
                  onChange={(e) =>
                    setNewSlide({ ...newSlide, type: e.target.value as PromoSlide['type'] })
                  }
                  className="w-full h-12 px-3 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="announcement">Announcement</option>
                  <option value="promotion">Promotion</option>
                  <option value="staff-spotlight">Staff Spotlight</option>
                  <option value="testimonial">Testimonial</option>
                  <option value="social-qr">Social QR</option>
                </select>
              </div>
              <div>
                <label className="block text-base font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={newSlide.title || ''}
                  onChange={(e) => setNewSlide({ ...newSlide, title: e.target.value })}
                  placeholder="Slide title"
                  className="w-full h-12 px-3 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-base font-medium text-gray-700 mb-1">
                  Subtitle
                </label>
                <input
                  type="text"
                  value={newSlide.subtitle || ''}
                  onChange={(e) => setNewSlide({ ...newSlide, subtitle: e.target.value })}
                  placeholder="Slide subtitle"
                  className="w-full h-12 px-3 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-base font-medium text-gray-700 mb-1">
                  Image URL
                </label>
                <input
                  type="url"
                  value={newSlide.imageUrl || ''}
                  onChange={(e) => setNewSlide({ ...newSlide, imageUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full h-12 px-3 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleAdd}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 min-h-[44px]"
              >
                <Check className="w-5 h-5" />
                <span>Add</span>
              </button>
              <button
                onClick={() => setIsAdding(false)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 min-h-[44px]"
              >
                <X className="w-5 h-5" />
                <span>Cancel</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3">
        {slides.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No slides configured. Add some promotional content!
          </p>
        ) : (
          slides.map((slide) => (
            <div
              key={slide.id}
              className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center text-white ${
                    slide.type === 'promotion'
                      ? 'bg-orange-500'
                      : slide.type === 'staff-spotlight'
                        ? 'bg-purple-500'
                        : slide.type === 'testimonial'
                          ? 'bg-blue-500'
                          : slide.type === 'social-qr'
                            ? 'bg-green-500'
                            : 'bg-indigo-500'
                  }`}
                >
                  <Image className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-lg font-medium text-gray-900">{slide.title}</p>
                  <p className="text-base text-gray-500">
                    {slide.type.replace('-', ' ')}
                    {slide.subtitle && ` • ${slide.subtitle.slice(0, 30)}...`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => onRemove(slide.id)}
                className="p-3 text-red-500 hover:bg-red-100 rounded-lg min-w-[48px] min-h-[48px] flex items-center justify-center"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function SettingsPage() {
  const dispatch = useAppDispatch();
  const config = useAppSelector((state) => state.config.config);
  const [activeTab, setActiveTab] = useState<SettingsTab>('connection');
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [testConnectionStatus, setTestConnectionStatus] = useState<
    'idle' | 'testing' | 'success' | 'failed'
  >('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const dataStr = JSON.stringify(config, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const link = document.createElement('a');
    link.setAttribute('href', dataUri);
    link.setAttribute('download', `mango-pad-config-${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedConfig = JSON.parse(e.target?.result as string) as PadConfig;
        dispatch(importConfig(importedConfig));
        alert('Settings imported successfully!');
      } catch {
        alert('Invalid configuration file. Please check the format.');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleTestConnection = async () => {
    setTestConnectionStatus('testing');
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setTestConnectionStatus(config.mqttBrokerUrl ? 'success' : 'failed');
    setTimeout(() => setTestConnectionStatus('idle'), 3000);
  };

  const handleReset = () => {
    dispatch(resetConfig());
    setShowConfirmReset(false);
  };

  const handleExit = () => {
    dispatch(setScreen('idle'));
  };

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: 'connection', label: 'Connection', icon: <Wifi className="w-5 h-5" /> },
    { id: 'payment', label: 'Payment Flow', icon: <DollarSign className="w-5 h-5" /> },
    { id: 'idle', label: 'Idle Screen', icon: <Image className="w-5 h-5" /> },
    { id: 'display', label: 'Display', icon: <Monitor className="w-5 h-5" /> },
    { id: 'split', label: 'Split Payments', icon: <SplitSquareHorizontal className="w-5 h-5" /> },
    { id: 'advanced', label: 'Advanced', icon: <Settings className="w-5 h-5" /> },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'connection':
        return (
          <div className="space-y-6">
            <TextInput
              label="Salon ID"
              description="Unique identifier for this salon location"
              value={config.salonId}
              onChange={(val) => dispatch(setSalonId(val))}
              placeholder="Enter salon ID"
            />
            <TextInput
              label="MQTT Broker URL"
              description="WebSocket URL for MQTT broker connection"
              value={config.mqttBrokerUrl}
              onChange={(val) => dispatch(setMqttBrokerUrl(val))}
              placeholder="ws://localhost:1883"
              type="url"
            />
            <div className="py-3">
              <button
                onClick={handleTestConnection}
                disabled={testConnectionStatus === 'testing'}
                className={`flex items-center justify-center gap-2 w-full py-4 rounded-xl text-lg font-medium transition-colors min-h-[56px] ${
                  testConnectionStatus === 'success'
                    ? 'bg-green-500 text-white'
                    : testConnectionStatus === 'failed'
                      ? 'bg-red-500 text-white'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {testConnectionStatus === 'testing' ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1 }}
                    >
                      <Wifi className="w-5 h-5" />
                    </motion.div>
                    Testing Connection...
                  </>
                ) : testConnectionStatus === 'success' ? (
                  <>
                    <Check className="w-5 h-5" />
                    Connection Successful
                  </>
                ) : testConnectionStatus === 'failed' ? (
                  <>
                    <X className="w-5 h-5" />
                    Connection Failed
                  </>
                ) : (
                  <>
                    <Wifi className="w-5 h-5" />
                    Test Connection
                  </>
                )}
              </button>
            </div>
          </div>
        );

      case 'payment':
        return (
          <div className="space-y-6">
            <ToggleSwitch
              label="Enable Tip Screen"
              description="Show tip selection during checkout"
              enabled={config.tipEnabled}
              onChange={(enabled) => dispatch(setTipSettings({ enabled }))}
            />
            {config.tipEnabled && (
              <>
                <div className="py-3">
                  <p className="text-lg font-medium text-gray-900 mb-3">Tip Type</p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => dispatch(setTipSettings({ type: 'percentage' }))}
                      className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl text-lg font-medium transition-colors min-h-[56px] ${
                        config.tipType === 'percentage'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <Percent className="w-5 h-5" />
                      Percentage
                    </button>
                    <button
                      onClick={() => dispatch(setTipSettings({ type: 'dollar' }))}
                      className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl text-lg font-medium transition-colors min-h-[56px] ${
                        config.tipType === 'dollar'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <DollarSign className="w-5 h-5" />
                      Dollar Amount
                    </button>
                  </div>
                </div>
                <TipValuesEditor
                  tipType={config.tipType}
                  values={config.tipSuggestions}
                  onChange={(values) => dispatch(setTipSettings({ suggestions: values }))}
                />
              </>
            )}
            <ToggleSwitch
              label="Require Signature"
              description="Collect customer signature for authorization"
              enabled={config.signatureRequired}
              onChange={(enabled) => dispatch(setConfig({ signatureRequired: enabled }))}
            />
            <ToggleSwitch
              label="Show Receipt Options"
              description="Allow customers to choose receipt delivery method"
              enabled={config.showReceiptOptions}
              onChange={(enabled) => dispatch(setConfig({ showReceiptOptions: enabled }))}
            />
            <NumberInput
              label="Payment Timeout"
              description="Seconds to wait for card terminal response"
              value={config.paymentTimeout}
              onChange={(val) => dispatch(setConfig({ paymentTimeout: val }))}
              min={30}
              max={180}
              unit="sec"
            />
          </div>
        );

      case 'idle':
        return (
          <div className="space-y-6">
            <TextInput
              label="Logo URL"
              description="URL to your salon logo image"
              value={config.logoUrl || ''}
              onChange={(val) => dispatch(setConfig({ logoUrl: val || undefined }))}
              placeholder="https://example.com/logo.png"
              type="url"
            />
            <NumberInput
              label="Slide Duration"
              description="Seconds to display each promo slide"
              value={config.slideDuration}
              onChange={(val) => dispatch(setConfig({ slideDuration: val }))}
              min={3}
              max={30}
              unit="sec"
            />
            <div className="py-3">
              <p className="text-lg font-medium text-gray-900 mb-3">Brand Colors</p>
              <div className="space-y-3">
                <ColorPicker
                  label="Primary Color"
                  value={config.brandColors.primary}
                  onChange={(val) =>
                    dispatch(setBrandColors({ ...config.brandColors, primary: val }))
                  }
                />
                <ColorPicker
                  label="Secondary Color"
                  value={config.brandColors.secondary}
                  onChange={(val) =>
                    dispatch(setBrandColors({ ...config.brandColors, secondary: val }))
                  }
                />
              </div>
            </div>
            <SlideEditor
              slides={config.promoSlides}
              onAdd={(slide) => dispatch(addPromoSlide(slide))}
              onRemove={(id) => dispatch(removePromoSlide(id))}
            />
          </div>
        );

      case 'display':
        return (
          <div className="space-y-6">
            <NumberInput
              label="Thank You Delay"
              description="Seconds to show thank you screen before returning to idle"
              value={config.thankYouDelay}
              onChange={(val) => dispatch(setConfig({ thankYouDelay: val }))}
              min={2}
              max={15}
              unit="sec"
            />
            <ToggleSwitch
              label="High Contrast Mode"
              description="Increase color contrast for better visibility"
              enabled={config.highContrastMode}
              onChange={(enabled) => dispatch(setAccessibilitySettings({ highContrastMode: enabled }))}
            />
            <ToggleSwitch
              label="Large Text Mode"
              description="Increase font sizes for better readability"
              enabled={config.largeTextMode}
              onChange={(enabled) => dispatch(setAccessibilitySettings({ largeTextMode: enabled }))}
            />
          </div>
        );

      case 'split':
        return (
          <div className="space-y-6">
            <ToggleSwitch
              label="Enable Split Payments"
              description="Allow customers to split the bill across multiple cards"
              enabled={config.splitPaymentEnabled}
              onChange={(enabled) => dispatch(setConfig({ splitPaymentEnabled: enabled }))}
            />
            {config.splitPaymentEnabled && (
              <NumberInput
                label="Maximum Splits"
                description="Maximum number of ways a bill can be split"
                value={config.maxSplits}
                onChange={(val) => dispatch(setConfig({ maxSplits: val }))}
                min={2}
                max={4}
              />
            )}
          </div>
        );

      case 'advanced':
        return (
          <div className="space-y-6">
            <div className="border-b border-gray-200 pb-6">
              <p className="text-lg font-medium text-gray-900 mb-4">Export/Import Settings</p>
              <div className="flex gap-3">
                <button
                  onClick={handleExport}
                  className="flex-1 flex items-center justify-center gap-2 py-4 bg-indigo-100 text-indigo-700 rounded-xl text-lg font-medium hover:bg-indigo-200 min-h-[56px]"
                >
                  <Download className="w-5 h-5" />
                  Export Settings
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 flex items-center justify-center gap-2 py-4 bg-indigo-100 text-indigo-700 rounded-xl text-lg font-medium hover:bg-indigo-200 min-h-[56px]"
                >
                  <Upload className="w-5 h-5" />
                  Import Settings
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </div>
            </div>

            <div className="pt-2">
              <p className="text-lg font-medium text-gray-900 mb-4">Reset to Defaults</p>
              <p className="text-base text-gray-500 mb-4">
                This will reset all settings to their default values. This action cannot be undone.
              </p>
              {showConfirmReset ? (
                <div className="flex gap-3">
                  <button
                    onClick={handleReset}
                    className="flex-1 flex items-center justify-center gap-2 py-4 bg-red-600 text-white rounded-xl text-lg font-medium hover:bg-red-700 min-h-[56px]"
                  >
                    <Check className="w-5 h-5" />
                    Confirm Reset
                  </button>
                  <button
                    onClick={() => setShowConfirmReset(false)}
                    className="flex-1 flex items-center justify-center gap-2 py-4 bg-gray-200 text-gray-700 rounded-xl text-lg font-medium hover:bg-gray-300 min-h-[56px]"
                  >
                    <X className="w-5 h-5" />
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowConfirmReset(true)}
                  className="flex items-center justify-center gap-2 w-full py-4 bg-red-100 text-red-700 rounded-xl text-lg font-medium hover:bg-red-200 min-h-[56px]"
                >
                  <RotateCcw className="w-5 h-5" />
                  Reset All Settings
                </button>
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-80 bg-white border-r border-gray-200 p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center">
            <Settings className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="text-base text-gray-500">Mango Pad</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          {tabs.map((tab) => (
            <TabButton
              key={tab.id}
              id={tab.id}
              label={tab.label}
              icon={tab.icon}
              active={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
            />
          ))}
        </nav>

        <button
          onClick={handleExit}
          className="flex items-center justify-center gap-2 w-full py-4 bg-gray-100 text-gray-700 rounded-xl text-lg font-medium hover:bg-gray-200 mt-6 min-h-[56px]"
        >
          <X className="w-5 h-5" />
          Exit Settings
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {tabs.find((t) => t.id === activeTab)?.label}
            </h2>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {renderTabContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}
