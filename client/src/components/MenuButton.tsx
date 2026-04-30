
import React from 'react';
import { ChevronRight } from 'lucide-react';
import { ButtonProps } from '../types';

export const MenuButton: React.FC<ButtonProps> = ({ label, icon: Icon, onClick, delayMs = 0 }) => {
  return (
    <button
      onClick={onClick}
      style={{ animationDelay: `${delayMs}ms` }}
      className={`
        group relative w-full bg-white/70 backdrop-blur-xl
        rounded-2xl p-5 mb-3.5
        flex items-center justify-between
        shadow-[0_4px_15px_rgb(0,0,0,0.03)] 
        hover:shadow-[0_12px_30px_rgb(0,0,0,0.06)]
        border border-white/60 hover:border-white/90
        transform transition-all duration-500 ease-out
        hover:-translate-y-1
        active:scale-[0.98]
        opacity-0 animate-fade-in-up
        ring-1 ring-stone-100/50
        fill-mode-forwards
      `}
    >
      <div className="flex items-center gap-5">
        <div className="
          w-10 h-10 flex items-center justify-center rounded-[20px]
          bg-stone-100/50 backdrop-blur-md
          text-stone-600 border border-stone-200/50
          group-hover:bg-stone-900 group-hover:text-white group-hover:border-transparent
          transition-all duration-500 shadow-sm
        ">
          <Icon size={18} strokeWidth={1.5} />
        </div>
        <span className="text-[15px] font-semibold tracking-wide text-stone-700 group-hover:text-black transition-colors font-sans">
          {label}
        </span>
      </div>
      
      <div className="text-stone-300 group-hover:text-stone-800 transition-all duration-500 group-hover:translate-x-1 opacity-60 group-hover:opacity-100">
        <ChevronRight size={20} strokeWidth={2} />
      </div>
    </button>
  );
};
