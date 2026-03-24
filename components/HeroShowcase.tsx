
import React, { useState, useEffect, CSSProperties } from 'react';
import { config } from '../config';

export const HeroShowcase: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  
  const videos = config.videos;
  const len = videos.length;

  useEffect(() => {
    if (!isAutoPlaying || len === 0) return;

    // Slayd almashish vaqti (4 soniya)
    const interval = setInterval(() => {
      setActiveIndex((current) => (current + 1) % len);
    }, 4000);

    return () => clearInterval(interval);
  }, [len, isAutoPlaying]);

  // Kartalar holatini hisoblash
  const getCardStyle = (index: number): CSSProperties => {
    // Aylanma indeks mantig'i
    const position = (index - activeIndex + len) % len;
    
    // ACTIVE (O'rtada)
    if (position === 0) {
      return {
        zIndex: 30,
        opacity: 1,
        transform: 'translateX(0) scale(1) rotate(0deg)',
        filter: 'blur(0px)',
        pointerEvents: 'auto',
      };
    }
    
    // PREVIOUS (Chapda) - oxirgi element
    if (position === len - 1) {
      return {
        zIndex: 10,
        opacity: 0.6,
        transform: 'translateX(-55%) scale(0.8) rotate(-6deg)',
        filter: 'blur(1px) grayscale(20%)',
        pointerEvents: 'none',
      };
    }
    
    // NEXT (O'ngda) - 1-element
    if (position === 1) {
      return {
        zIndex: 10,
        opacity: 0.6,
        transform: 'translateX(55%) scale(0.8) rotate(6deg)',
        filter: 'blur(1px) grayscale(20%)',
        pointerEvents: 'none',
      };
    }

    // Boshqalar (Orqada yashiringan)
    return {
      zIndex: 0,
      opacity: 0,
      transform: 'translateX(0) scale(0.5)',
      filter: 'blur(5px)',
      pointerEvents: 'none',
    };
  };

  if (len === 0) return null;

  return (
    <div className="relative w-full flex justify-center py-2 mb-4 h-[320px] overflow-visible perspective-1000">
      
      {/* Orqa fon yoritgichi */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-amber-100/50 rounded-full blur-[60px] -z-10 pointer-events-none mix-blend-multiply" />

      {/* Slayd konteyneri */}
      <div className="relative w-full max-w-[200px] h-full flex items-center justify-center">
        {videos.map((video, index) => {
          const style = getCardStyle(index);
          const isActive = (index - activeIndex + len) % len === 0;

          return (
            <div
              key={video.id}
              className="absolute top-2 w-full aspect-[9/14] bg-white rounded-2xl overflow-hidden shadow-[0_10px_30px_-8px_rgba(0,0,0,0.15)] transition-all duration-1000 ease-[cubic-bezier(0.2,0.8,0.2,1)] border-[2px] border-white"
              style={style}
            >
              {/* Rasm konteyneri */}
              <div className="relative w-full h-full overflow-hidden bg-stone-200">
                <img
                  src={video.image}
                  alt={video.title}
                  className={`
                    w-full h-full object-cover transition-transform duration-[4000ms] ease-linear
                    ${isActive ? 'scale-110' : 'scale-100'}
                  `}
                />
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />

                {/* Text Content (Small Aesthetic Badge) */}
                <div 
                  className={`
                    absolute bottom-6 left-0 right-0 text-center transition-all duration-700 delay-300 flex justify-center px-2
                    ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
                  `}
                >
                  <h3 className="inline-block px-4 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-[10px] font-semibold text-white tracking-[0.2em] uppercase shadow-sm">
                    {video.title}
                  </h3>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
