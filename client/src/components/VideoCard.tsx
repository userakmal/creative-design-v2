import React, { useState } from "react";
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

  return (
    <div
      onClick={onClick}
      className="group relative flex flex-col gap-2 cursor-pointer active:scale-95 transition-all duration-500 ease-out 
                 group-hover/list:scale-[0.94] group-hover/list:opacity-50 group-hover/list:blur-[1px]
                 hover:!scale-[1.06] hover:!opacity-100 hover:!blur-0"
    >
      <div
        className={`
        relative w-full aspect-[9/16] rounded-2xl overflow-hidden
        bg-stone-200 shadow-sm border border-stone-100
        transition-all duration-500 ease-out
        group-hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.2)]
        group-hover:border-stone-200
      `}
      >
        {/* Thumbnail Image */}
        {!imgError ? (
          <img
            src={image}
            alt={title}
            onError={() => setImgError(true)}
            className="absolute inset-0 w-full h-full object-cover opacity-95 transition-opacity duration-700"
          />
        ) : (
          <div className="absolute inset-0 bg-stone-100 flex items-center justify-center">
            <ImageOff className="text-stone-300" size={24} />
          </div>
        )}

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
