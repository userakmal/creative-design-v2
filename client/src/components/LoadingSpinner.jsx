import React, { useEffect, useRef } from 'react';

/**
 * Lottie Loading Spinner Component
 * 
 * Usage:
 * 1. Download a Lottie JSON animation from https://lottiefiles.com/
 * 2. Place it in /public/loading_spinner.json
 * 3. Install lottie-web: npm install lottie-web
 * 
 * @param {number} width - Width in pixels
 * @param {number} height - Height in pixels
 * @param {string} color - Primary color (if animation supports theming)
 */
export default function LoadingSpinner({ 
  width = 120, 
  height = 120,
  color = '#3B82F6' 
}) {
  const containerRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    // Dynamically import lottie-web
    const loadLottie = async () => {
      try {
        const lottie = (await import('lottie-web')).default;
        
        if (containerRef.current) {
          // Try to load from public folder
          animationRef.current = lottie.loadAnimation({
            container: containerRef.current,
            renderer: 'svg',
            loop: true,
            autoplay: true,
            path: '/loading_spinner.json', // Place your Lottie file in /public
          });
        }
      } catch (error) {
        console.warn('Lottie not available, using fallback spinner');
      }
    };

    loadLottie();

    return () => {
      if (animationRef.current) {
        animationRef.current.destroy();
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center">
      {/* Lottie Container */}
      <div
        ref={containerRef}
        style={{ width, height }}
        className="loading-lottie-container"
      />
      
      {/* Fallback CSS Spinner (shows if Lottie fails to load) */}
      <style jsx>{`
        .loading-lottie-container:empty {
          display: block;
        }
        
        .loading-lottie-container:empty + .fallback-spinner {
          display: block;
        }
        
        .fallback-spinner {
          display: none;
        }
      `}</style>
      
      {/* Fallback Spinner */}
      <div className="fallback-spinner">
        <div 
          className="animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"
          style={{ width, height }}
        />
      </div>
      
      {/* Loading Text */}
      <p className="mt-4 text-gray-600 font-medium animate-pulse">
        Yuklanmoqda...
      </p>
    </div>
  );
}

/**
 * Simple CSS-only Loading Spinner (no dependencies)
 */
export function SimpleLoadingSpinner({ size = 'md' }) {
  const sizeClasses = {
    sm: 'w-8 h-8 border-2',
    md: 'w-12 h-12 border-3',
    lg: 'w-16 h-16 border-4',
    xl: 'w-24 h-24 border-4',
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div 
        className={`${sizeClasses[size]} animate-spin rounded-full border-blue-600 border-t-transparent`}
      />
      <p className="mt-3 text-gray-600 text-sm font-medium">
        {size === 'sm' ? '' : 'Yuklanmoqda...'}
      </p>
    </div>
  );
}
