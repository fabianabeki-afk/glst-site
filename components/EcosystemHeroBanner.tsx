"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface Perk {
 tag: string;
 title: string;
 subtitle: string;
 action: string;
}

const perksData: Perk[] = [
 {
 tag: "PRODUCER PIPELINE // 01",
 title: "AIR YOUR OWN PRODUCTIONS",
 subtitle: "Submit unreleased material directly to resident underground broadcast DJs.",
 action: "UPLOAD TRACK"
 },
 {
 tag: "DIRECT MARKET // 02",
 title: "GET EXCLUSIVES & DUBPLATES",
 subtitle: "Bypass middlemen with 100% independent splits on rare vinyl & digital cuts.",
 action: "EXPLORE STORE"
 },
 {
 tag: "ECOSYSTEM PASS // 03",
 title: "GET THE FULL ECO BUNDLE",
 subtitle: "Unlock unlimited streaming, PadPro tools, and RMT features for £9.99/mo.",
 action: "UPGRADE NOW"
 }
];

export function EcosystemHeroBanner() {
 const [currentIndex, setCurrentIndex] = useState(0);
 const [isAnimating, setIsAnimating] = useState(false);

 useEffect(() => {
 const interval = setInterval(() => {
 setIsAnimating(true);
 setTimeout(() => {
 setCurrentIndex((prev) => (prev + 1) % perksData.length);
 setIsAnimating(false);
 }, 300);
 }, 5500);

 return () => clearInterval(interval);
 }, []);

 const currentPerk = perksData[currentIndex];

 return (
 <div className="w-full bg-black py-4 px-6 flex flex-row items-center justify-between gap-3 font-mono">
 
 <Link 
 href="https://apps.apple.com/gb/app/padpro-dj/id6738889086"
 target="_blank"
 rel="noopener noreferrer"
 className="w-24 md:w-32 h-20 md:h-24 bg-neutral-950 border border-neutral-900 rounded-xl overflow-hidden relative shadow-xl flex-shrink-0 group cursor-pointer block"
 >
 <video
 src="/PADPRO_SPLASH_MOVIE.mp4"
 autoPlay
 loop
 muted
 playsInline
 className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
 />
 <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
 <div className="absolute bottom-1.5 left-1.5 right-1.5 flex justify-between items-center">
 <span className="text-[6px] md:text-[7px] font-black tracking-widest text-[#D4AF37] uppercase bg-black/90 px-1 py-0.5 rounded border border-neutral-800">
 PADPRO
 </span>
 <span className="text-[6px] md:text-[7px] font-bold text-neutral-400 group-hover:text-white transition-colors">
 [ → ]
 </span>
 </div>
 </Link>

 <div className="flex-1 min-w-0 h-20 md:h-24 bg-neutral-950 border border-neutral-900 rounded-xl p-2 md:p-3 flex flex-col justify-between relative overflow-hidden shadow-xl">
 <div className="absolute -right-10 -top-10 w-32 h-32 bg-[#D4AF37]/5 rounded-full blur-2xl pointer-events-none" />

 <div className="flex justify-between items-center relative z-10">
 <span className="text-[7px] md:text-[8px] font-bold tracking-[0.3em] text-[#D4AF37] uppercase">
 {currentPerk.tag}
 </span>
 <div className="flex items-center gap-1">
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
 className={`h-1 rounded-full transition-all duration-300 cursor-pointer ${
 currentIndex === idx ? 'w-4 bg-[#D4AF37]' : 'w-1 bg-neutral-800'
 }`}
 aria-label={`Slide ${idx + 1}`}
 />
 ))}
 </div>
 </div>

 <div className={`flex flex-col gap-0.5 transition-opacity duration-300 relative z-10 ${isAnimating ? 'opacity-0 translate-y-1' : 'opacity-100 translate-y-0'}`}>
 <h3 className="text-xs md:text-sm font-black tracking-widest text-white uppercase truncate">
 {currentPerk.title}
 </h3>
 <p className="text-[9px] md:text-[10px] text-neutral-400 tracking-wide line-clamp-1">
 {currentPerk.subtitle}
 </p>
 </div>

 <div className="flex justify-between items-center pt-1.5 border-t border-neutral-900/80 relative z-10 text-[7px] md:text-[8px] font-bold tracking-widest">
 <span className="text-neutral-500 uppercase hidden md:inline">GUESTLIST ECOSYSTEM</span>
 <span className="text-[#D4AF37] hover:underline cursor-pointer">
 {`[ ${currentPerk.action} → ]`}
 </span>
 </div>
 </div>

 <Link 
 href="ratemytransition://"
 className="w-24 md:w-32 h-20 md:h-24 bg-neutral-950 border border-neutral-900 rounded-xl overflow-hidden relative shadow-xl flex-shrink-0 group cursor-pointer block"
 >
 <video
 src="/Rate_my_transition_movie.mov"
 autoPlay
 loop
 muted
 playsInline
 className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
 />
 <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
 <div className="absolute bottom-1.5 left-1.5 right-1.5 flex justify-between items-center">
 <span className="text-[6px] md:text-[7px] font-black tracking-widest text-[#D4AF37] uppercase bg-black/90 px-1 py-0.5 rounded border border-neutral-800">
 RMT
 </span>
 <span className="text-[6px] md:text-[7px] font-bold text-neutral-400 group-hover:text-white transition-colors">
 [ → ]
 </span>
 </div>
 </Link>

 </div>
 );
}