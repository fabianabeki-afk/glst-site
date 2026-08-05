'use client';

import React, { useState, useEffect } from 'react';

interface Perk {
  id: number;
  tag: string;
  title: string;
  subtitle: string;
  action: string;
}

const perksData: Perk[] = [
  {
    id: 1,
    tag: "PRODUCER PIPELINE // 01",
    title: "AIR YOUR OWN PRODUCTIONS",
    subtitle: "Submit unreleased material directly to resident underground broadcast DJs.",
    action: "UPLOAD TRACK"
  },
  {
    id: 2,
    tag: "DIRECT MARKET // 02",
    title: "GET EXCLUSIVES & DUBPLATES",
    subtitle: "Bypass middlemen with 100% independent splits on rare vinyl & digital cuts.",
    action: "EXPLORE STORE"
  },
  {
    id: 3,
    tag: "ECOSYSTEM PASS // 03",
    title: "GET THE FULL ECO BUNDLE",
    subtitle: "Unlock unlimited streaming, PadPro tools, and RMT features for £9.99/mo.",
    action: "UPGRADE NOW"
  }
];

export default function PerksSlideshow() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % perksData.length);
        setIsAnimating(false);
      }, 300);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const currentPerk = perksData[currentIndex];

  return (
    <div className="w-full h-36 bg-neutral-950 border border-neutral-900 rounded-xl p-5 flex flex-col justify-between font-mono relative overflow-hidden shadow-xl group">
      <div className="absolute -right-10 -top-10 w-32 h-32 bg-[#D4AF37]/5 rounded-full blur-2xl pointer-events-none" />

      <div className="flex justify-between items-center z-10">
        <span className="text-[9px] font-bold tracking-[0.3em] text-[#D4AF37] uppercase">{currentPerk.tag}</span>
        <div className="flex items-center gap-1.5">
          {perksData.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setIsAnimating(true);
                setTimeout(() => {
                  setCurrentIndex(idx);
                  setIsAnimating(false);
                }, 200);
              }}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                currentIndex === idx ? 'w-5 bg-[#D4AF37]' : 'w-1.5 bg-neutral-800'
              }`}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      <div className={`flex flex-col gap-1 transition-all duration-300 z-10 ${isAnimating ? 'opacity-0 translate-y-1' : 'opacity-100 translate-y-0'}`}>
        <h3 className="text-xs sm:text-sm font-black tracking-widest text-white uppercase truncate">{currentPerk.title}</h3>
        <p className="text-[10px] text-neutral-400 tracking-wide line-clamp-1">{currentPerk.subtitle}</p>
      </div>

      <div className="flex justify-between items-center pt-2 border-t border-neutral-900/80 z-10 text-[9px] font-bold tracking-widest">
        <span className="text-neutral-500 uppercase">GUESTLIST ECOSYSTEM v2.4</span>
        <span className="text-[#D4AF37] group-hover:translate-x-1 transition-transform cursor-pointer">{`[ ${currentPerk.action} → ]`}</span>
      </div>
    </div>
  );
}
