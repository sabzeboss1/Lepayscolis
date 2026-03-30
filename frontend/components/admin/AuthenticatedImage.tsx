'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api/client';

interface AuthenticatedImageProps {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
}

export default function AuthenticatedImage({ src, alt, className, style }: AuthenticatedImageProps) {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loadImage = async () => {
      try {
        setLoading(true);
        setError(false);
        
        const token = document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1];
        const csrfToken = document.cookie.split('; ').find(row => row.startsWith('XSRF-TOKEN='))?.split('=')[1];
        
        // Prepend backend base URL if src is a relative path
        const url = src.startsWith('http') ? src : `${apiClient.baseUrl}${src}`;

        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-XSRF-TOKEN': csrfToken ? decodeURIComponent(csrfToken) : '',
          },
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to load image');
        }

        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        setImageSrc(objectUrl);
      } catch (err) {
        console.error('Failed to load authenticated image:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    if (src) {
      loadImage();
    }

    // Cleanup object URL on unmount
    return () => {
      if (imageSrc) {
        URL.revokeObjectURL(imageSrc);
      }
    };
  }, [src]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`} style={style}>
        <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`} style={style}>
        <div className="text-center text-gray-500">
          <p className="text-sm">Failed to load image</p>
        </div>
      </div>
    );
  }

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      style={style}
    />
  );
}
