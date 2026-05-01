
import React from 'react';
import { config } from '../config';

export const Header: React.FC = () => {
  return (
    <header className="w-full flex flex-col items-center justify-center pt-6 pb-2 px-6 animate-fade-in relative z-10">
      <div className="mb-3 relative group cursor-default">
        {/* Orqa fondagi nur effekti */}
        <div className="absolute inset-0 bg-amber-200 blur-2xl opacity-40 rounded-full group-hover:opacity-60 transition-opacity duration-700"></div>
        
        {/* LOGO */}
        <div className="w-16 h-16 rounded-full border border-white/60 bg-white/40 backdrop-blur-md flex items-center justify-center shadow-[0_4px_20px_rgb(0,0,0,0.04)] relative z-10 ring-1 ring-white/50 overflow-hidden">
           <img 
            src={config.logoUrl} 
            alt="Creative Design Logo" 
            width={64}
            height={64}
            className="w-full h-full object-cover"
           />
        </div>
      </div>
      
      {/* SAYT NOMI */}
      <h1 className="text-2xl font-serif text-center text-stone-900 tracking-tight drop-shadow-sm">
        {config.brandName}
      </h1>
      
      <div className="flex items-center gap-3 my-2 opacity-60" aria-hidden="true">
        <div className="h-[1px] w-6 bg-gradient-to-r from-transparent to-stone-400"></div>
        <div className="w-0.5 h-0.5 rounded-full bg-stone-400"></div>
        <div className="h-[1px] w-6 bg-gradient-to-l from-transparent to-stone-400"></div>
      </div>

      <p className="text-[10px] text-stone-600 font-semibold tracking-[0.2em] uppercase text-center">
        {config.subTitle}
      </p>
    </header>
  );
};
