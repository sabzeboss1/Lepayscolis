'use client';

import React from 'react';

interface ImagePlaceholderProps {
  city: string;
  gradient: string;
  className?: string;
}

export function ImagePlaceholder({ city, gradient, className = '' }: ImagePlaceholderProps) {
  return (
    <div 
      className={`relative overflow-hidden ${className}`}
      style={{
        background: `linear-gradient(135deg, ${gradient})`
      }}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-6xl mb-4">
            {city === 'Moscou' && '🏛️'}
            {city === 'Dakar' && '🌴'}
            {city === 'Abidjan' && '🌆'}
            {city === 'Lagos' && '🏙️'}
            {city === 'Airport' && '✈️'}
          </div>
          <h3 className="text-3xl font-bold drop-shadow-lg">{city}</h3>
        </div>
      </div>
      {/* Overlay pattern */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
        backgroundSize: '20px 20px'
      }}></div>
    </div>
  );
}
