import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { ArrowLeft, Camera, QrCode, AlertCircle, RefreshCw } from 'lucide-react';

type ScanStatus = 'requesting' | 'scanning' | 'processing' | 'error' | 'denied';

export function QrScanPage() {
  const navigate = useNavigate();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [status, setStatus] = useState<ScanStatus>('requesting');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let mounted = true;

    const initScanner = async () => {
      if (!containerRef.current) return;

      try {
        const scanner = new Html5Qrcode('qr-reader');
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1,
          },
          (decodedText) => {
            // QR code detected
            if (mounted) {
              handleQrDetected(decodedText);
            }
          },
          () => {
            // QR code not detected (ignore)
          }
        );

        if (mounted) {
          setStatus('scanning');
        }
      } catch (err: any) {
        console.error('Scanner error:', err);
        if (mounted) {
          if (err.name === 'NotAllowedError' || err.message?.includes('Permission')) {
            setStatus('denied');
            setErrorMessage('Camera access was denied. Please allow camera access to scan QR codes.');
          } else {
            setStatus('error');
            setErrorMessage(err.message || 'Failed to start camera');
          }
        }
      }
    };

    initScanner();

    return () => {
      mounted = false;
      if (scannerRef.current) {
        const scanner = scannerRef.current;
        if (scanner.getState() === Html5QrcodeScannerState.SCANNING) {
          scanner.stop().catch(console.error);
        }
      }
    };
  }, []);

  const handleQrDetected = async (qrData: string) => {
    setStatus('processing');

    // Stop scanner
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch (e) {
        console.error('Error stopping scanner:', e);
      }
    }

    // Parse QR code - expecting format: "mango:client:{clientId}" or just a phone number
    let clientId = '';
    let phone = '';

    if (qrData.startsWith('mango:client:')) {
      clientId = qrData.replace('mango:client:', '');
    } else if (/^\d{10}$/.test(qrData.replace(/\D/g, ''))) {
      // It's a phone number
      phone = qrData.replace(/\D/g, '');
    } else {
      // Invalid QR code
      setStatus('error');
      setErrorMessage('Invalid QR code. Please try again or use your phone number.');
      return;
    }

    // Navigate to verify page
    if (clientId) {
      navigate(`/verify?clientId=${clientId}`);
    } else if (phone) {
      navigate(`/verify?phone=${phone}`);
    }
  };

  const handleRetry = () => {
    setStatus('requesting');
    setErrorMessage('');
    // Re-mount component to restart scanner
    window.location.reload();
  };

  const handleBack = () => {
    navigate('/');
  };

  const handleUsePhone = () => {
    navigate('/');
  };

  return (
    <div className="kiosk-mode min-h-screen bg-[#faf9f7] relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-[#1a5f4a]/8 to-transparent" />
        <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full bg-gradient-to-tr from-[#d4a853]/10 to-transparent" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between p-6">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-[#6b7280] hover:text-[#1a5f4a] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-['Work_Sans']">Back</span>
          </button>

          <div className="text-center">
            <h1 className="font-['Plus_Jakarta_Sans'] text-xl font-bold text-[#1f2937]">
              Scan QR Code
            </h1>
          </div>

          <div className="w-20" />
        </header>

        {/* Scanner Area */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-lg w-full">
            {/* Status: Requesting Permission */}
            {status === 'requesting' && (
              <div className="text-center">
                <div className="w-24 h-24 bg-[#e8f5f0] rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <Camera className="w-12 h-12 text-[#1a5f4a] animate-pulse" />
                </div>
                <h2 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-[#1f2937] mb-3">
                  Camera Access Required
                </h2>
                <p className="font-['Work_Sans'] text-[#6b7280] mb-6">
                  Please allow camera access to scan your QR code
                </p>
                <div className="w-8 h-8 border-3 border-[#1a5f4a]/20 border-t-[#1a5f4a] rounded-full animate-spin mx-auto" />
              </div>
            )}

            {/* Status: Scanning */}
            {status === 'scanning' && (
              <div className="text-center">
                <div className="relative mb-6">
                  {/* Scanner container */}
                  <div
                    id="qr-reader"
                    ref={containerRef}
                    className="mx-auto rounded-2xl overflow-hidden bg-black"
                    style={{ width: 300, height: 300 }}
                  />

                  {/* Scanning overlay */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-[250px] h-[250px] border-2 border-[#1a5f4a] rounded-xl relative">
                      <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#1a5f4a] rounded-tl-xl" />
                      <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#1a5f4a] rounded-tr-xl" />
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#1a5f4a] rounded-bl-xl" />
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#1a5f4a] rounded-br-xl" />

                      {/* Scanning line */}
                      <div className="absolute left-4 right-4 h-0.5 bg-[#1a5f4a] animate-scan" />
                    </div>
                  </div>
                </div>

                <h2 className="font-['Plus_Jakarta_Sans'] text-xl font-bold text-[#1f2937] mb-2">
                  Position QR Code in Frame
                </h2>
                <p className="font-['Work_Sans'] text-[#6b7280]">
                  Hold your loyalty card QR code steady
                </p>
              </div>
            )}

            {/* Status: Processing */}
            {status === 'processing' && (
              <div className="text-center">
                <div className="w-24 h-24 bg-[#e8f5f0] rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <QrCode className="w-12 h-12 text-[#1a5f4a]" />
                </div>
                <h2 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-[#1f2937] mb-3">
                  QR Code Detected!
                </h2>
                <p className="font-['Work_Sans'] text-[#6b7280] mb-6">
                  Looking you up...
                </p>
                <div className="w-8 h-8 border-3 border-[#1a5f4a]/20 border-t-[#1a5f4a] rounded-full animate-spin mx-auto" />
              </div>
            )}

            {/* Status: Error or Denied */}
            {(status === 'error' || status === 'denied') && (
              <div className="text-center">
                <div className="w-24 h-24 bg-[#fef2f2] rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <AlertCircle className="w-12 h-12 text-[#ef4444]" />
                </div>
                <h2 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-[#1f2937] mb-3">
                  {status === 'denied' ? 'Camera Access Denied' : 'Something Went Wrong'}
                </h2>
                <p className="font-['Work_Sans'] text-[#6b7280] mb-8">
                  {errorMessage}
                </p>

                <div className="space-y-3">
                  <button
                    onClick={handleRetry}
                    className="w-full py-4 rounded-xl bg-[#1a5f4a] text-white font-['Plus_Jakarta_Sans'] font-semibold shadow-lg shadow-[#1a5f4a]/25 hover:bg-[#154d3c] transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-5 h-5" />
                    Try Again
                  </button>

                  <button
                    onClick={handleUsePhone}
                    className="w-full py-4 rounded-xl bg-white border-2 border-[#e5e7eb] text-[#1f2937] font-['Plus_Jakarta_Sans'] font-semibold hover:border-[#1a5f4a] transition-all"
                  >
                    Enter Phone Number Instead
                  </button>
                </div>
              </div>
            )}

            {/* Fallback link */}
            {status === 'scanning' && (
              <button
                onClick={handleUsePhone}
                className="mt-8 w-full text-center font-['Work_Sans'] text-[#6b7280] hover:text-[#1a5f4a] transition-colors"
              >
                Having trouble? <span className="underline">Enter phone number instead</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* CSS for scanning animation */}
      <style>{`
        @keyframes scan {
          0% {
            top: 10%;
          }
          50% {
            top: 85%;
          }
          100% {
            top: 10%;
          }
        }

        .animate-scan {
          animation: scan 2s ease-in-out infinite;
        }

        #qr-reader video {
          border-radius: 16px;
        }

        #qr-reader__scan_region {
          background: transparent !important;
        }

        #qr-reader__dashboard {
          display: none !important;
        }
      `}</style>
    </div>
  );
}

export default QrScanPage;
