
import React, { useState, useEffect, CSSProperties, useCallback } from 'react';
import { config } from '../config';

// Faqat ko'rinadigan 3 ta rasmni render qilish uchun helper
function getVisibleIndices(activeIndex: number, len: number): Set<number> {
  if (len === 0) return new Set();
  const indices = new Set<number>();
  indices.add(activeIndex);
  indices.add((activeIndex + 1) % len);
  indices.add((activeIndex - 1 + len) % len);
  // Pre-load next one too for smooth transition
  indices.add((activeIndex + 2) % len);
  return indices;
}

export const HeroShowcase: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoPlaying] = useState(true);
  
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

  // Kartalar holatini hisoblash — GPU-composited properties faqat
  const getCardStyle = useCallback((index: number): CSSProperties => {
    // Aylanma indeks mantig'i
    const position = (index - activeIndex + len) % len;
    
    // ACTIVE (O'rtada) — blur va grayscale yo'q
    if (position === 0) {
      return {
        zIndex: 30,
        opacity: 1,
        transform: 'translateX(0) translateZ(0) scale(1) rotate(0deg)',
        pointerEvents: 'auto',
      };
    }
    
    // PREVIOUS (Chapda) — faqat opacity + transform (GPU composited)
    if (position === len - 1) {
      return {
        zIndex: 10,
        opacity: 0.5,
        transform: 'translateX(-55%) translateZ(0) scale(0.8) rotate(-6deg)',
        pointerEvents: 'none',
      };
    }
    
    // NEXT (O'ngda) — faqat opacity + transform (GPU composited)
    if (position === 1) {
      return {
        zIndex: 10,
        opacity: 0.5,
        transform: 'translateX(55%) translateZ(0) scale(0.8) rotate(6deg)',
        pointerEvents: 'none',
      };
    }

    // Boshqalar (Orqada yashiringan) — GPU composited
    return {
      zIndex: 0,
      opacity: 0,
      transform: 'translateX(0) translateZ(0) scale(0.5)',
      pointerEvents: 'none',
    };
  }, [activeIndex, len]);

  if (len === 0) return null;

  // Faqat aktiv + yonidagi rasmlarni ko'rsatish (48 ta emas, 4 ta!)
  const visibleIndices = getVisibleIndices(activeIndex, len);

  return (
    <div className="relative w-full flex justify-center py-2 mb-4 h-[320px] overflow-visible perspective-1000">
      
      {/* Orqa fon yoritgichi — static, no animation */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full -z-10 bg-blur-static"
        style={{ background: 'rgba(251, 243, 219, 0.5)', filter: 'blur(60px)' }}
        aria-hidden="true"
      />

      {/* Slayd konteyneri */}
      <div className="relative w-full max-w-[200px] h-full flex items-center justify-center">
        {videos.map((video, index) => {
          // Ko'rinmaydigan kartalarni umuman render qilmaymiz (performance uchun)
          if (!visibleIndices.has(index)) return null;

          const style = getCardStyle(index);
          const isActive = (index - activeIndex + len) % len === 0;

          return (
            <div
              key={video.id}
              className="absolute top-2 w-full aspect-[9/14] bg-white rounded-2xl overflow-hidden shadow-[0_10px_30px_-8px_rgba(0,0,0,0.15)] border-[2px] border-white gpu-accelerated"
              style={{
                ...style,
                transition: 'transform 1s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 1s cubic-bezier(0.2, 0.8, 0.2, 1)',
              }}
            >
              {/* Rasm konteyneri */}
              <div className="relative w-full h-full overflow-hidden bg-stone-200">
                <img
                  src={video.image}
                  alt={video.title}
                  width={200}
                  height={311}
                  loading={isActive ? "eager" : "lazy"}
                  decoding="async"
                  fetchPriority={isActive ? "high" : "low"}
                  className="w-full h-full object-cover gpu-accelerated"
                  style={{
                    transform: isActive ? 'scale(1.1)' : 'scale(1)',
                    transition: 'transform 4s linear',
                  }}
                />
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" aria-hidden="true" />

                {/* Text Content (Small Aesthetic Badge) */}
                <div 
                  className="absolute bottom-6 left-0 right-0 text-center flex justify-center px-2"
                  style={{
                    opacity: isActive ? 1 : 0,
                    transform: isActive ? 'translateY(0)' : 'translateY(8px)',
                    transition: 'opacity 0.7s 0.3s, transform 0.7s 0.3s',
                  }}
                >
                  <span className="inline-block px-4 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-[10px] font-semibold text-white tracking-[0.2em] uppercase shadow-sm">
                    {video.title}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
