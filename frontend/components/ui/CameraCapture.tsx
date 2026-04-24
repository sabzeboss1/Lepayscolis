'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Camera, X, RotateCcw, Check, AlertCircle } from 'lucide-react';
import { Button } from './Button';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onCancel: () => void;
  isOpen: boolean;
  title?: string;
  instructions?: string[];
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({
  onCapture,
  onCancel,
  isOpen,
  title = "Prendre un selfie",
  instructions = []
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      
      // Stop existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Votre navigateur ne supporte pas l\'accès à la caméra. Veuillez utiliser Safari sur iOS.');
        return;
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Important for iOS: wait for metadata to load before playing
        await new Promise<void>((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => {
              resolve();
            };
          }
        });
        
        await videoRef.current.play();
        setIsStreaming(true);
      }
    } catch (err: any) {
      console.error('Error accessing camera:', err);
      
      let errorMessage = 'Impossible d\'accéder à la caméra.';
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage = 'Permission refusée. Veuillez autoriser l\'accès à la caméra dans les réglages de votre navigateur.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMessage = 'Aucune caméra détectée sur cet appareil.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMessage = 'La caméra est déjà utilisée par une autre application.';
      } else if (err.name === 'OverconstrainedError') {
        errorMessage = 'Les paramètres de la caméra ne sont pas supportés.';
      } else if (err.name === 'SecurityError') {
        errorMessage = 'Accès à la caméra bloqué pour des raisons de sécurité. Assurez-vous d\'utiliser HTTPS.';
      }
      
      setError(errorMessage);
    }
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to blob and create file
    canvas.toBlob((blob) => {
      if (blob) {
        const timestamp = new Date().getTime();
        const file = new File([blob], `selfie_${timestamp}.jpg`, {
          type: 'image/jpeg',
          lastModified: timestamp
        });
        
        // Create preview URL
        const imageUrl = URL.createObjectURL(blob);
        setCapturedImage(imageUrl);
        
        // Stop camera after capture
        stopCamera();
      }
    }, 'image/jpeg', 0.9);
  }, [stopCamera]);

  const confirmCapture = useCallback(() => {
    if (!capturedImage || !canvasRef.current) return;

    canvasRef.current.toBlob((blob) => {
      if (blob) {
        const timestamp = new Date().getTime();
        const file = new File([blob], `selfie_${timestamp}.jpg`, {
          type: 'image/jpeg',
          lastModified: timestamp
        });
        onCapture(file);
      }
    }, 'image/jpeg', 0.9);
  }, [capturedImage, onCapture]);

  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    startCamera();
  }, [startCamera]);

  const switchCamera = useCallback(() => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  }, []);

  const handleCancel = useCallback(() => {
    stopCamera();
    setCapturedImage(null);
    onCancel();
  }, [stopCamera, onCancel]);

  // Start camera when component opens
  useEffect(() => {
    if (isOpen && !capturedImage) {
      startCamera();
    }
    
    return () => {
      stopCamera();
    };
  }, [isOpen, capturedImage, startCamera, stopCamera]);

  // Update camera when facing mode changes
  useEffect(() => {
    if (isOpen && isStreaming && !capturedImage) {
      startCamera();
    }
  }, [facingMode, isOpen, isStreaming, capturedImage, startCamera]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-[9999] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/50 text-white relative z-10">
        <h2 className="text-lg font-semibold">{title}</h2>
        <button
          onClick={handleCancel}
          className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Instructions */}
      {instructions.length > 0 && !capturedImage && (
        <div className="px-4 py-2 bg-blue-600/90 text-white text-sm relative z-10">
          <ul className="space-y-1">
            {instructions.map((instruction, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-blue-200">•</span>
                {instruction}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* iOS Help Banner */}
      {!capturedImage && !isStreaming && !error && (
        <div className="px-4 py-3 bg-yellow-600/90 text-white text-xs relative z-10">
          <p className="font-semibold mb-1">📱 Sur iPhone ?</p>
          <p>Assurez-vous d'autoriser l'accès à la caméra quand Safari vous le demande.</p>
        </div>
      )}

      {/* Camera View */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20 p-4">
            <div className="text-center text-white max-w-md">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
              <p className="text-lg font-semibold mb-2">Erreur de caméra</p>
              <p className="text-sm text-gray-300 mb-4">{error}</p>
              
              {/* iOS specific help */}
              {error.includes('Permission') && (
                <div className="bg-blue-600/20 border border-blue-400/30 rounded-lg p-3 mb-4 text-left text-xs">
                  <p className="font-semibold mb-2">📱 Sur iPhone :</p>
                  <ol className="space-y-1 list-decimal list-inside">
                    <li>Ouvrez Réglages iOS</li>
                    <li>Cherchez "Safari"</li>
                    <li>Activez "Caméra"</li>
                    <li>Revenez ici et réessayez</li>
                  </ol>
                </div>
              )}
              
              <div className="flex gap-2 justify-center">
                <Button
                  onClick={startCamera}
                  variant="primary"
                  size="sm"
                >
                  Réessayer
                </Button>
                <Button
                  onClick={handleCancel}
                  variant="secondary"
                  size="sm"
                  className="bg-white/20 text-white border-white/30"
                >
                  Annuler
                </Button>
              </div>
            </div>
          </div>
        )}

        {capturedImage ? (
          // Preview captured image
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              src={capturedImage}
              alt="Selfie capturé"
              className="max-w-full max-h-full object-contain"
            />
          </div>
        ) : (
          // Live camera feed
          <div className="relative w-full h-full flex items-center justify-center">
            <video
              ref={videoRef}
              className="max-w-full max-h-full object-contain transform scale-x-[-1]"
              playsInline
              autoPlay
              muted
              webkit-playsinline="true"
            />
            
            {/* Camera overlay guide */}
            <div className="absolute inset-0 pointer-events-none z-10">
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-64 h-80 border-2 border-white/50 rounded-2xl relative">
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-white text-sm text-center whitespace-nowrap">
                    Placez votre visage dans le cadre
                  </div>
                  {/* Corner guides */}
                  <div className="absolute top-2 left-2 w-6 h-6 border-l-4 border-t-4 border-white rounded-tl-lg"></div>
                  <div className="absolute top-2 right-2 w-6 h-6 border-r-4 border-t-4 border-white rounded-tr-lg"></div>
                  <div className="absolute bottom-2 left-2 w-6 h-6 border-l-4 border-b-4 border-white rounded-bl-lg"></div>
                  <div className="absolute bottom-2 right-2 w-6 h-6 border-r-4 border-b-4 border-white rounded-br-lg"></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hidden canvas for capture */}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Controls */}
      <div className="p-6 bg-black/50 relative z-20">
        {capturedImage ? (
          // Preview controls
          <div className="flex items-center justify-center gap-4">
            <Button
              onClick={retakePhoto}
              variant="secondary"
              size="lg"
              className="bg-white/20 text-white border-white/30 hover:bg-white/30"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              Reprendre
            </Button>
            <Button
              onClick={confirmCapture}
              variant="primary"
              size="lg"
              className="bg-green-600 hover:bg-green-700"
            >
              <Check className="w-5 h-5 mr-2" />
              Confirmer
            </Button>
          </div>
        ) : (
          // Camera controls
          <div className="flex items-center justify-between max-w-md mx-auto">
            <Button
              onClick={switchCamera}
              variant="secondary"
              size="sm"
              className="bg-white/20 text-white border-white/30 hover:bg-white/30 shrink-0"
              disabled={!isStreaming}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Changer
            </Button>

            <button
              onClick={capturePhoto}
              disabled={!isStreaming}
              className="w-20 h-20 bg-white rounded-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors shadow-lg shrink-0"
              aria-label="Prendre une photo"
            >
              <div className="w-16 h-16 bg-white border-4 border-gray-300 rounded-full flex items-center justify-center">
                <Camera className="w-8 h-8 text-gray-600" />
              </div>
            </button>

            <div className="w-16 shrink-0"></div> {/* Spacer for centering */}
          </div>
        )}
      </div>
    </div>
  );
};