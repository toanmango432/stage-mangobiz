/**
 * Signature Capture Component
 * PRD Reference: 2.3.4 Consultation Forms - Electronic Signature
 *
 * Supports:
 * - Draw signature (touch/mouse on canvas)
 * - Type signature (rendered in script font)
 * - Export as PNG data URL
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import type { SignatureData } from '../../types/form';

interface SignatureCaptureProps {
  value?: SignatureData;
  onChange: (signature: SignatureData | null) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

type SignatureMode = 'draw' | 'type';

export const SignatureCapture: React.FC<SignatureCaptureProps> = ({
  value,
  onChange,
  label = 'Your Signature',
  required = false,
  disabled = false,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<SignatureMode>(value?.type || 'draw');
  const [typedName, setTypedName] = useState(value?.typedName || '');
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [lastPos, setLastPos] = useState<{ x: number; y: number } | null>(null);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;  // Retina display
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);

    // Set drawing style
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Restore previous signature if exists
    if (value?.type === 'draw' && value.dataUrl) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
        setHasDrawn(true);
      };
      img.src = value.dataUrl;
    }
  }, []);

  // Get position from mouse/touch event
  const getPosition = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;

    if ('touches' in e) {
      const touch = e.touches[0];
      if (!touch) return null;
      clientX = touch.clientX;
      clientY = touch.clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  }, []);

  // Start drawing
  const handleStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (disabled || mode !== 'draw') return;
    e.preventDefault();

    const pos = getPosition(e);
    if (!pos) return;

    setIsDrawing(true);
    setLastPos(pos);
  }, [disabled, mode, getPosition]);

  // Draw
  const handleMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || disabled || mode !== 'draw') return;
    e.preventDefault();

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !lastPos) return;

    const pos = getPosition(e);
    if (!pos) return;

    ctx.beginPath();
    ctx.moveTo(lastPos.x, lastPos.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();

    setLastPos(pos);
    setHasDrawn(true);
  }, [isDrawing, disabled, mode, lastPos, getPosition]);

  // End drawing
  const handleEnd = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);
    setLastPos(null);

    // Save signature
    const canvas = canvasRef.current;
    if (canvas && hasDrawn) {
      const dataUrl = canvas.toDataURL('image/png');
      onChange({
        type: 'draw',
        dataUrl,
        timestamp: new Date().toISOString(),
      });
    }
  }, [isDrawing, hasDrawn, onChange]);

  // Clear canvas
  const handleClear = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    setTypedName('');
    onChange(null);
  }, [onChange]);

  // Handle typed signature change
  const handleTypedNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setTypedName(name);

    if (name.trim()) {
      // Render typed signature to canvas for data URL
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (ctx && canvas) {
        const rect = canvas.getBoundingClientRect();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = 'italic 32px "Dancing Script", "Brush Script MT", cursive';
        ctx.fillStyle = '#1a1a1a';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(name, rect.width / 2, rect.height / 2);

        const dataUrl = canvas.toDataURL('image/png');
        onChange({
          type: 'type',
          dataUrl,
          typedName: name,
          timestamp: new Date().toISOString(),
        });
      }
    } else {
      onChange(null);
    }
  }, [onChange]);

  // Switch mode
  const handleModeChange = useCallback((newMode: SignatureMode) => {
    setMode(newMode);
    handleClear();
  }, [handleClear]);

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Label */}
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>

        {/* Mode Toggle */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            type="button"
            onClick={() => handleModeChange('draw')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              mode === 'draw'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            disabled={disabled}
          >
            Draw
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('type')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              mode === 'type'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            disabled={disabled}
          >
            Type
          </button>
        </div>
      </div>

      {/* Signature Area */}
      <div className="relative">
        {mode === 'draw' ? (
          <>
            {/* Canvas for drawing */}
            <canvas
              ref={canvasRef}
              className={`
                w-full h-32 border-2 border-dashed rounded-lg cursor-crosshair
                ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
                ${hasDrawn ? 'border-cyan-300' : 'border-gray-300'}
              `}
              onMouseDown={handleStart}
              onMouseMove={handleMove}
              onMouseUp={handleEnd}
              onMouseLeave={handleEnd}
              onTouchStart={handleStart}
              onTouchMove={handleMove}
              onTouchEnd={handleEnd}
            />

            {/* Placeholder text */}
            {!hasDrawn && !disabled && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <p className="text-gray-400 text-sm">Sign here</p>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Input for typing */}
            <input
              type="text"
              value={typedName}
              onChange={handleTypedNameChange}
              placeholder="Type your full name"
              disabled={disabled}
              className={`
                w-full px-4 py-6 text-center text-2xl border-2 border-dashed rounded-lg
                ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
                ${typedName ? 'border-cyan-300' : 'border-gray-300'}
                focus:outline-none focus:border-cyan-500
              `}
              style={{ fontFamily: '"Dancing Script", "Brush Script MT", cursive' }}
            />

            {/* Hidden canvas for export */}
            <canvas
              ref={canvasRef}
              className="hidden"
              width={400}
              height={100}
            />
          </>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">
          {mode === 'draw'
            ? 'Use your mouse or finger to sign'
            : 'Type your name to create a signature'
          }
        </p>

        {(hasDrawn || typedName) && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="text-xs text-red-600 hover:text-red-700 font-medium"
          >
            Clear
          </button>
        )}
      </div>

      {/* Legal Notice */}
      <p className="text-xs text-gray-400">
        By signing, you agree that this electronic signature is as valid as a handwritten signature.
      </p>
    </div>
  );
};

export default SignatureCapture;
