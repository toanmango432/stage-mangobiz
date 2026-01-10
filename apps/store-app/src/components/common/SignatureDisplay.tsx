import { PenTool, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export interface SignatureDisplayProps {
  signatureBase64: string;
  signatureTimestamp?: string;
  className?: string;
  showTimestamp?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sizeStyles = {
  sm: {
    container: 'p-2',
    image: 'h-16',
    text: 'text-xs',
    icon: 14,
  },
  md: {
    container: 'p-3',
    image: 'h-24',
    text: 'text-sm',
    icon: 16,
  },
  lg: {
    container: 'p-4',
    image: 'h-32',
    text: 'text-base',
    icon: 18,
  },
};

export function SignatureDisplay({
  signatureBase64,
  signatureTimestamp,
  className = '',
  showTimestamp = true,
  size = 'md',
}: SignatureDisplayProps) {
  const styles = sizeStyles[size];

  const isValidBase64Image = (data: string): boolean => {
    return data.startsWith('data:image/') || /^[A-Za-z0-9+/=]+$/.test(data);
  };

  const getImageSrc = (data: string): string => {
    if (data.startsWith('data:image/')) {
      return data;
    }
    return `data:image/png;base64,${data}`;
  };

  if (!signatureBase64 || !isValidBase64Image(signatureBase64)) {
    return null;
  }

  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 shadow-sm ${styles.container} ${className}`}
    >
      <div className="flex items-center mb-2">
        <PenTool size={styles.icon} className="text-gray-500 mr-2" />
        <span className={`font-semibold text-gray-700 ${styles.text}`}>
          Customer Signature
        </span>
      </div>

      <div className="bg-gray-50 rounded-md p-2 border border-gray-100">
        <img
          src={getImageSrc(signatureBase64)}
          alt="Customer signature"
          className={`${styles.image} w-auto max-w-full object-contain mx-auto`}
        />
      </div>

      {showTimestamp && signatureTimestamp && (
        <div className="flex items-center mt-2 text-gray-500">
          <Calendar size={styles.icon - 2} className="mr-1" />
          <span className={`${styles.text}`}>
            Signed: {format(new Date(signatureTimestamp), 'MMM d, yyyy h:mm a')}
          </span>
        </div>
      )}
    </div>
  );
}
