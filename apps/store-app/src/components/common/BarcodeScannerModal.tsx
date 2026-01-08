/**
 * BarcodeScannerModal - Camera-based barcode/QR code scanner
 *
 * Uses BarcodeDetector API (Chrome/Edge) with fallback for other browsers.
 * Opens camera, detects barcodes, and returns the scanned value.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Camera, RefreshCw, AlertCircle } from 'lucide-react';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
  title?: string;
}

export function BarcodeScannerModal({
  isOpen,
  onClose,
  onScan,
  title = 'Scan Barcode',
}: BarcodeScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [lastScanned, setLastScanned] = useState<string | null>(null);

  // Check if BarcodeDetector is available
  const hasBarcodeDetector = 'BarcodeDetector' in window;

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      setError(null);
      setIsScanning(true);

      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        // Start scanning
        if (hasBarcodeDetector) {
          startBarcodeDetection();
        }
      }
    } catch (err) {
      console.error('Camera error:', err);
      setError('Unable to access camera. Please allow camera permissions.');
      setIsScanning(false);
    }
  }, [facingMode, hasBarcodeDetector]);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  }, []);

  // Barcode detection loop using BarcodeDetector API
  const startBarcodeDetection = useCallback(async () => {
    if (!videoRef.current || !hasBarcodeDetector) return;

    try {
      // @ts-ignore - BarcodeDetector is not in TypeScript types yet
      const barcodeDetector = new window.BarcodeDetector({
        formats: ['code_128', 'code_39', 'code_93', 'ean_13', 'ean_8', 'upc_a', 'upc_e', 'qr_code', 'data_matrix'],
      });

      const detect = async () => {
        if (!videoRef.current || !isScanning) return;

        try {
          const barcodes = await barcodeDetector.detect(videoRef.current);

          if (barcodes.length > 0) {
            const code = barcodes[0].rawValue;
            if (code && code !== lastScanned) {
              setLastScanned(code);
              // Vibrate on successful scan (if supported)
              if (navigator.vibrate) {
                navigator.vibrate(100);
              }
              onScan(code);
              stopCamera();
              onClose();
              return;
            }
          }
        } catch (err) {
          // Detection failed, continue scanning
        }

        animationRef.current = requestAnimationFrame(detect);
      };

      animationRef.current = requestAnimationFrame(detect);
    } catch (err) {
      console.error('BarcodeDetector error:', err);
      setError('Barcode detection not supported. Please enter manually.');
    }
  }, [hasBarcodeDetector, isScanning, lastScanned, onScan, onClose, stopCamera]);

  // Toggle camera facing mode
  const toggleCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  // Start camera when modal opens
  useEffect(() => {
    if (isOpen) {
      setLastScanned(null);
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);

  // Restart camera when facing mode changes
  useEffect(() => {
    if (isOpen && isScanning) {
      startCamera();
    }
  }, [facingMode]);

  if (!isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3 flex items-center justify-between bg-gray-800">
          <div className="flex items-center gap-2 text-white">
            <Camera size={20} />
            <span className="font-medium">{title}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleCamera}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-all"
              title="Switch camera"
            >
              <RefreshCw size={18} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-all"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Camera View */}
        <div className="relative aspect-[4/3] bg-black">
          {error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6 text-center">
              <AlertCircle size={48} className="text-red-400 mb-4" />
              <p className="text-sm">{error}</p>
              <button
                onClick={startCamera}
                className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm font-medium transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
              />

              {/* Scanning overlay */}
              <div className="absolute inset-0 pointer-events-none">
                {/* Scanning frame */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative w-64 h-40">
                    {/* Corner markers */}
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />

                    {/* Scanning line animation */}
                    <div className="absolute inset-x-0 top-1/2 h-0.5 bg-emerald-400/50 animate-pulse" />
                  </div>
                </div>

                {/* Dark overlay outside frame */}
                <div className="absolute inset-0 bg-black/40" style={{
                  clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 0, calc(50% - 128px) calc(50% - 80px), calc(50% - 128px) calc(50% + 80px), calc(50% + 128px) calc(50% + 80px), calc(50% + 128px) calc(50% - 80px), calc(50% - 128px) calc(50% - 80px))'
                }} />
              </div>

              {/* Hidden canvas for detection */}
              <canvas ref={canvasRef} className="hidden" />
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-gray-800 text-center">
          <p className="text-sm text-gray-400">
            {isScanning ? 'Position barcode within the frame' : 'Starting camera...'}
          </p>
          {!hasBarcodeDetector && (
            <p className="text-xs text-amber-400 mt-1">
              Note: Your browser may not support automatic detection. Try Chrome or Edge.
            </p>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

export default BarcodeScannerModal;
