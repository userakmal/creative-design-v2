import React, { useState, useRef, useEffect } from "react";
import { Play, ImageOff } from "lucide-react";

interface VideoCardProps {
  title: string;
  image: string;
  onClick: () => void;
}

export const VideoCard: React.FC<VideoCardProps> = ({
  title,
  image,
  onClick,
}) => {
  const [imgError, setImgError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  // IntersectionObserver bilan lazy loading — rasm faqat viewport ga yaqinlashganda yuklanadi
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: '200px', threshold: 0.01 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={imgRef}
      onClick={onClick}
      className={`group relative flex flex-col gap-2 cursor-pointer transition-all duration-500 ease-out active:scale-95`}
    >
      <div
        className={`
        relative w-full aspect-[9/16] rounded-[32px] overflow-hidden
        bg-stone-200 border border-stone-100/50
        transition-all duration-700 ease-out
        shadow-[0_25px_50px_-12px_rgba(0,0,0,0.4)]
        group-hover:shadow-[0_40px_80px_-15px_rgba(0,0,0,0.5)]
        group-hover:-translate-y-2
      `}
      >
        {/* Skeleton Placeholder — Rasm yuklanguncha */}
        {!isLoaded && !imgError && (
          <div className="absolute inset-0 bg-gradient-to-b from-stone-200 to-stone-300 animate-pulse" />
        )}

        {/* Thumbnail Image — Lazy loaded */}
        {shouldLoad && !imgError ? (
          <img
            src={image}
            alt={title}
            loading="lazy"
            decoding="async"
            onLoad={() => setIsLoaded(true)}
            onError={() => setImgError(true)}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          />
        ) : imgError ? (
          <div className="absolute inset-0 bg-stone-100 flex items-center justify-center">
            <ImageOff className="text-stone-300" size={24} />
          </div>
        ) : null}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />

        {/* Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="
            w-10 h-10 rounded-full bg-white/20 backdrop-blur-md 
            flex items-center justify-center border border-white/40
            transition-transform duration-300 group-hover:scale-110
          "
          >
            <Play size={16} className="fill-white text-white ml-1" />
          </div>
        </div>
      </div>

      <div className="px-1">
        <h3 className="text-xs font-medium text-stone-800 leading-tight line-clamp-1">
          {title}
        </h3>
      </div>
    </div>
  );
};
