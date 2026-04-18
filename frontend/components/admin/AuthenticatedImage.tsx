'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';

interface AuthenticatedImageProps {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
}

export default function AuthenticatedImage({ src, alt, className, style }: AuthenticatedImageProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <>
      {loading && (
        <div className={`flex items-center justify-center bg-gray-100 ${className}`} style={style}>
          <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
        </div>
      )}

      {error ? (
        <div className={`flex items-center justify-center bg-gray-100 ${className}`} style={style}>
          <div className="text-center text-gray-500">
            <p className="text-sm">Failed to load image</p>
          </div>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          className={className}
          style={{ ...style, display: loading ? 'none' : undefined }}
          onLoad={() => setLoading(false)}
          onError={() => { setLoading(false); setError(true); }}
          referrerPolicy="no-referrer"
        />
      )}
    </>
  );
}
