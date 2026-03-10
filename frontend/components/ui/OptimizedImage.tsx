import React from 'react';
import Image, { ImageProps } from 'next/image';

export interface OptimizedImageProps extends Omit<ImageProps, 'src'> {
  src: string;
  alt: string;
  priority?: boolean;
}

/**
 * OptimizedImage - Wrapper around next/image with best practices
 * 
 * Features:
 * - Automatic format optimization (WebP, AVIF)
 * - Lazy loading by default
 * - Responsive sizing
 * - Blur placeholder
 * 
 * Usage:
 * <OptimizedImage
 *   src="/images/hero.jpg"
 *   alt="Hero image"
 *   width={1200}
 *   height={600}
 *   priority={false} // Set to true for above-the-fold images
 * />
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  priority = false,
  quality = 85,
  placeholder = 'blur',
  blurDataURL,
  ...props
}) => {
  // Generate a simple blur placeholder if not provided
  const defaultBlurDataURL = 
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNlNWU3ZWIiLz48L3N2Zz4=';

  return (
    <Image
      src={src}
      alt={alt}
      quality={quality}
      priority={priority}
      placeholder={placeholder}
      blurDataURL={blurDataURL || defaultBlurDataURL}
      {...props}
    />
  );
};
