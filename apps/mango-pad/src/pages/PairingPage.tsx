/**
 * Pairing Page
 *
 * Screen for entering a pairing code to connect Mango Pad with a Store App station.
 * Auto-uppercases input and formats with dash for display.
 * Supports QR code scanning as alternative to manual entry (US-015).
 *
 * Part of: Device Pairing System (US-006, US-007, US-015)
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Link, Loader2, Camera, X } from 'lucide-react';
import { Html5Qrcode, Html5QrcodeResult } from 'html5-qrcode';
import { verifyPairingCode } from '../services/pairingService';
import type { PairingQRPayload } from '../types';

// Parse input: remove dashes/spaces, uppercase, limit to 6 chars
function parseCode(input: string): string {
  return input
    .replace(/[-\s]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 6);
}

// Format code for display: ABC-123
function formatCode(code: string): string {
  if (code.length <= 3) return code;
  return `${code.slice(0, 3)}-${code.slice(3)}`;
}

// Validate QR payload structure
function isValidPairingPayload(data: unknown): data is PairingQRPayload {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;
  return (
    obj.type === 'mango-pad-pairing' &&
    typeof obj.pairingCode === 'string' &&
    obj.pairingCode.length === 6
  );
}

export function PairingPage() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerRef = useRef<HTMLDivElement>(null);

  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);

  // Focus input on mount
  useEffect(() => {
    if (!showScanner) {
      inputRef.current?.focus();
    }
  }, [showScanner]);

  // Clean up scanner on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, []);

  // Handle input change
  const handleCodeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const parsed = parseCode(e.target.value);
      setCode(parsed);
      setError(null);
    },
    []
  );

  // Handle key press (submit on Enter)
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && code.length === 6 && !isVerifying) {
        handleConnect();
      }
    },
    [code, isVerifying]
  );

  // Handle connect button click
  const handleConnect = useCallback(async () => {
    if (code.length !== 6 || isVerifying) return;

    setIsVerifying(true);
    setError(null);

    try {
      const result = await verifyPairingCode(code);

      if (result.success) {
        // Success! Navigate to waiting page
        // Clear demo mode flag if it was set
        localStorage.removeItem('mango_pad_demo_mode');
        navigate('/');
      } else {
        // Handle specific error types
        switch (result.error) {
          case 'invalid_code':
            setError('Invalid pairing code. Please check and try again.');
            break;
          case 'not_configured':
            setError('Pairing service not available. Please try again later.');
            break;
          case 'network_error':
          default:
            setError('Connection failed. Please check your internet.');
            break;
        }
      }
    } catch {
      setError('Connection failed. Please check your internet.');
    } finally {
      setIsVerifying(false);
    }
  }, [code, isVerifying, navigate]);

  // Handle back navigation
  const handleBack = useCallback(() => {
    navigate('/welcome');
  }, [navigate]);

  // Handle QR code success
  const handleQrSuccess = useCallback(
    async (_decodedText: string, result: Html5QrcodeResult) => {
      try {
        // Parse the QR code data
        const data = JSON.parse(result.decodedText);

        // Validate the payload
        if (!isValidPairingPayload(data)) {
          setScannerError('Invalid QR code. Please scan the code from your checkout station.');
          return;
        }

        // Stop scanner
        if (scannerRef.current) {
          await scannerRef.current.stop();
          scannerRef.current = null;
        }
        setShowScanner(false);

        // Set the code and auto-submit
        setCode(data.pairingCode);
        setIsVerifying(true);
        setError(null);

        const verifyResult = await verifyPairingCode(data.pairingCode);

        if (verifyResult.success) {
          localStorage.removeItem('mango_pad_demo_mode');
          navigate('/');
        } else {
          switch (verifyResult.error) {
            case 'invalid_code':
              setError('Invalid pairing code. Please check and try again.');
              break;
            case 'not_configured':
              setError('Pairing service not available. Please try again later.');
              break;
            case 'network_error':
            default:
              setError('Connection failed. Please check your internet.');
              break;
          }
        }
      } catch {
        setScannerError('Invalid QR code format. Please scan the code from your checkout station.');
      } finally {
        setIsVerifying(false);
      }
    },
    [navigate]
  );

  // Start QR scanner
  const startScanner = useCallback(async () => {
    setShowScanner(true);
    setScannerError(null);

    // Wait for container to mount
    await new Promise((resolve) => setTimeout(resolve, 100));

    if (!scannerContainerRef.current) {
      setScannerError('Scanner container not available.');
      return;
    }

    try {
      const scanner = new Html5Qrcode('qr-scanner-container');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        handleQrSuccess,
        () => {
          // QR code not detected in frame - ignore
        }
      );
    } catch (err) {
      console.error('[PairingPage] Scanner error:', err);
      if (err instanceof Error) {
        if (err.message.includes('NotAllowedError') || err.message.includes('Permission')) {
          setScannerError('Camera access required. Please enable in settings.');
        } else if (err.message.includes('NotFoundError')) {
          setScannerError('No camera found on this device.');
        } else {
          setScannerError('Could not start camera. Please try again.');
        }
      } else {
        setScannerError('Could not start camera. Please try again.');
      }
    }
  }, [handleQrSuccess]);

  // Stop QR scanner
  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch {
        // Ignore stop errors
      }
      scannerRef.current = null;
    }
    setShowScanner(false);
    setScannerError(null);
  }, []);

  const isCodeComplete = code.length === 6;

  // QR Scanner View
  if (showScanner) {
    return (
      <div className="min-h-screen bg-black flex flex-col">
        {/* Header */}
        <div className="bg-black/80 px-4 py-3 flex items-center justify-between">
          <h2 className="text-white font-semibold">Scan QR Code</h2>
          <button
            onClick={stopScanner}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Cancel"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Scanner */}
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <div
            id="qr-scanner-container"
            ref={scannerContainerRef}
            className="w-full max-w-md rounded-xl overflow-hidden"
          />

          {scannerError && (
            <div className="mt-4 bg-red-500/90 text-white px-4 py-3 rounded-lg max-w-md text-center">
              {scannerError}
            </div>
          )}

          <p className="text-white/70 text-sm text-center mt-6 max-w-sm">
            Point your camera at the QR code on your checkout station's device settings
          </p>
        </div>

        {/* Cancel button */}
        <div className="p-4">
          <button
            onClick={stopScanner}
            className="w-full py-3 px-6 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex flex-col p-8">
      {/* Header with back button */}
      <div className="flex items-center mb-8">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
          disabled={isVerifying}
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back</span>
        </button>
      </div>

      {/* Main content - centered */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full">
        {/* Icon */}
        <div className="mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Link className="w-10 h-10 text-white" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">
          Pair with Store
        </h1>
        <p className="text-gray-600 text-center mb-8">
          Enter the 6-digit code shown on your checkout station
        </p>

        {/* Code input */}
        <div className="w-full mb-4">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={formatCode(code)}
              onChange={handleCodeChange}
              onKeyDown={handleKeyDown}
              placeholder="ABC-123"
              maxLength={7} // 6 chars + dash
              disabled={isVerifying}
              className={`
                w-full text-center text-4xl font-mono font-bold tracking-[0.3em]
                py-4 px-6 rounded-xl border-2 transition-all duration-200
                placeholder:text-gray-300 placeholder:tracking-[0.3em]
                focus:outline-none focus:ring-4
                ${
                  error
                    ? 'border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-100'
                    : 'border-gray-200 bg-white focus:border-orange-400 focus:ring-orange-100'
                }
                ${isVerifying ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              autoCapitalize="characters"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
          </div>

          {/* Error message */}
          {error && (
            <p className="text-red-500 text-sm text-center mt-3">{error}</p>
          )}
        </div>

        {/* Scan QR Code button (US-015) */}
        <button
          onClick={startScanner}
          disabled={isVerifying}
          className="flex items-center justify-center gap-2 w-full py-3 px-6 mb-4 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-xl border-2 border-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Camera className="w-5 h-5" />
          Scan QR Code
        </button>

        {/* Connect button */}
        <button
          onClick={handleConnect}
          disabled={!isCodeComplete || isVerifying}
          className={`
            flex items-center justify-center gap-3 w-full py-4 px-6
            text-lg font-semibold rounded-xl shadow-lg
            transition-all duration-200 transform
            ${
              isCodeComplete && !isVerifying
                ? 'bg-orange-500 hover:bg-orange-600 text-white hover:scale-[1.02] active:scale-[0.98]'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }
          `}
        >
          {isVerifying ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Verifying...
            </>
          ) : (
            <>
              <Link className="w-5 h-5" />
              Connect
            </>
          )}
        </button>

        {/* Help text */}
        <p className="text-gray-400 text-sm text-center mt-8">
          Can't find the code? Open Settings → Devices on your checkout station
        </p>
      </div>
    </div>
  );
}
