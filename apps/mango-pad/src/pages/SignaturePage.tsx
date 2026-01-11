import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PenTool, RotateCcw, Check } from 'lucide-react';
import { ConnectionIndicator } from '../components/ConnectionIndicator';
import { DemoBanner, isDemoMode } from '../components/DemoBanner';
import { usePadMqtt } from '../providers/PadMqttProvider';

export function SignaturePage() {
  const navigate = useNavigate();
  const { setCurrentScreen } = usePadMqtt();
  const [isDemo] = useState(() => isDemoMode());
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  // Update current screen for heartbeat (skip in demo mode)
  useEffect(() => {
    if (!isDemo) {
      setCurrentScreen('signature');
    }
  }, [setCurrentScreen, isDemo]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasSignature(true);

    const rect = canvas.getBoundingClientRect();
    let x, y;

    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let x, y;

    if ('touches' in e) {
      e.preventDefault();
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1f2937';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleComplete = () => {
    // In real implementation, save signature and send back to POS
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Demo banner (US-016) */}
      <DemoBanner />

      {/* Header */}
      <div className="bg-white border-b px-6 py-4 relative">
        <div className="flex items-center justify-center">
          <PenTool className="w-6 h-6 text-orange-500 mr-2" />
          <h1 className="text-xl font-semibold text-gray-800">Sign Below</h1>
        </div>
        {/* Connection status indicator - top right - hide in demo mode */}
        {!isDemo && <ConnectionIndicator className="absolute top-3 right-4" />}
      </div>

      {/* Content */}
      <div className="flex-1 p-6 flex flex-col">
        <div className="flex-1 max-w-2xl mx-auto w-full">
          {/* Instructions */}
          <p className="text-gray-600 text-center mb-4">
            Please sign in the box below to complete your transaction
          </p>

          {/* Signature Canvas */}
          <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 relative overflow-hidden">
            <canvas
              ref={canvasRef}
              width={600}
              height={300}
              className="w-full touch-none cursor-crosshair"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />

            {/* Signature line */}
            <div className="absolute bottom-8 left-8 right-8 border-b border-gray-300" />
            <div className="absolute bottom-4 left-8 text-xs text-gray-400">
              Sign here
            </div>
          </div>

          {/* Clear Button */}
          <button
            onClick={clearSignature}
            className="mt-4 flex items-center justify-center text-gray-600 hover:text-gray-800 mx-auto"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Clear Signature
          </button>
        </div>
      </div>

      {/* Complete Button */}
      <div className="p-6 bg-white border-t">
        <button
          onClick={handleComplete}
          disabled={!hasSignature}
          className={`w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center transition-colors ${
            hasSignature
              ? 'bg-green-500 text-white hover:bg-green-600'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          <Check className="w-5 h-5 mr-2" />
          Complete Transaction
        </button>
      </div>
    </div>
  );
}
