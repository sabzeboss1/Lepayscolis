'use client';

import React, { useState } from 'react';

export interface RatingStarsProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onChange?: (rating: number) => void;
  className?: string;
}

export const RatingStars: React.FC<RatingStarsProps> = ({
  rating,
  maxRating = 5,
  size = 'md',
  interactive = false,
  onChange,
  className = '',
}) => {
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  const sizeStyles = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const displayRating = hoverRating !== null ? hoverRating : rating;

  const handleClick = (index: number) => {
    if (interactive && onChange) {
      onChange(index + 1);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent, index: number) => {
    if (!interactive || !onChange) return;

    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        onChange(index + 1);
        break;
      case 'ArrowRight':
      case 'ArrowUp':
        event.preventDefault();
        if (index < maxRating - 1) {
          setFocusedIndex(index + 1);
        }
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        event.preventDefault();
        if (index > 0) {
          setFocusedIndex(index - 1);
        }
        break;
      case 'Home':
        event.preventDefault();
        setFocusedIndex(0);
        break;
      case 'End':
        event.preventDefault();
        setFocusedIndex(maxRating - 1);
        break;
    }
  };

  const renderStar = (index: number) => {
    const starValue = index + 1;
    const fillPercentage = Math.max(0, Math.min(1, displayRating - index));
    
    const isFilled = fillPercentage === 1;
    const isHalf = fillPercentage > 0 && fillPercentage < 1;
    const isEmpty = fillPercentage === 0;

    const starElement = (
      <svg
        className={`${sizeStyles[size]} ${interactive ? 'cursor-pointer' : ''} transition-transform ${
          interactive && hoverRating === starValue ? 'scale-110' : ''
        }`}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <defs>
          {isHalf && (
            <linearGradient id={`half-${index}`}>
              <stop offset="50%" stopColor="#f97316" />
              <stop offset="50%" stopColor="transparent" />
            </linearGradient>
          )}
        </defs>
        <polygon
          points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
          fill={
            isFilled
              ? '#f97316'
              : isHalf
              ? `url(#half-${index})`
              : 'transparent'
          }
          className={isFilled || isHalf ? 'text-orange-500' : 'text-gray-300'}
          stroke={isFilled || isHalf ? '#f97316' : 'currentColor'}
        />
      </svg>
    );

    if (interactive) {
      return (
        <button
          key={index}
          type="button"
          onClick={() => handleClick(index)}
          onMouseEnter={() => setHoverRating(starValue)}
          onMouseLeave={() => setHoverRating(null)}
          onFocus={() => setFocusedIndex(index)}
          onBlur={() => setFocusedIndex(null)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          className="focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1 rounded min-w-[44px] min-h-[44px] inline-flex items-center justify-center"
          aria-label={`Rate ${starValue} out of ${maxRating} stars`}
          tabIndex={focusedIndex === index || (focusedIndex === null && index === 0) ? 0 : -1}
        >
          {starElement}
        </button>
      );
    }

    return <span key={index}>{starElement}</span>;
  };

  return (
    <div
      className={`inline-flex items-center gap-1 ${className}`}
      role={interactive ? 'radiogroup' : 'img'}
      aria-label={interactive ? `Rating: ${rating} out of ${maxRating} stars` : `${rating} out of ${maxRating} stars`}
    >
      {Array.from({ length: maxRating }, (_, index) => renderStar(index))}
    </div>
  );
};
