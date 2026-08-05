"use client";

import React, { useState, useEffect } from 'react';

const perksSetOne = [
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
 }
];

const perksSetTwo = [
 {
 tag: "ECOSYSTEM PASS // 03",
 title: "GET THE FULL ECO BUNDLE",
 subtitle: "Unlock unlimited streaming, PadPro tools, and RMT features for £9.99/mo.",
 action: "UPGRADE NOW"
 },
 {
 tag: "COMMUNITY FEED // 04",
 title: "RATE MY TRANSITION PRO",
 subtitle: "Pressure-test your DJ mixes and get direct community feedback globally.",
 action: "JOIN FEED"
 }
];

export function DualPerksSlideshow() {
 const [indexOne, setIndexOne] = useState(0);
 const [indexTwo, setIndexTwo] = useState(0);
 const [animatingOne, setAnimatingOne] = useState(false);
 const [animatingTwo, setAnimatingTwo] = useState(false);

 useEffect(() => {
 const timer1 = setInterval(() => {
 setAnimatingOne(true);
 setTimeout(() => {
 setIndexOne((prev) => (prev + 1) % perksSetOne.length);
 setAnimatingOne(false);
 }, 300);
 }, 6000);

 const timer2 = setInterval(() => {
 setAnimatingTwo(true);
 setTimeout(() => {
 setIndexTwo((prev) => (prev + 1) % perksSetTwo.length);
 setAnimatingTwo(false);
 }, 300);
 }, 7500);

 return () => {
 clearInterval(timer1);
 clearInterval(timer2);
 };
 }, []);

 const perkOne = perksSetOne[indexOne];
 const perkTwo = perksSetTwo[indexTwo];

 return (
 <div className="w-full bg-black py-4 px-6 flex items-center justify-between gap-4 font-mono">
 
 <div className="flex-shrink-0 w-24 h-28 bg-neutral-950 border border-neutral-900 rounded-xl flex items-center justify-center p-2 shadow-lg">
 <div className="text-center">
 <span className="text-[10px] font-black tracking-widest text-[#D4AF37] block">PAD</span>
 <span className="text-[10px] font-black tracking-widest text-white block">PRO</span>
 </div>
 </div>

 <div className="flex-1 h-28 bg-neutral-950 border border-neutral-900 rounded-xl p-3.5 flex flex-col justify-between relative overflow-hidden shadow-xl">
 <div className="flex justify-between items-center relative z-10">
 <span className="text-[8px] font-bold tracking-[0.2em] text-[#D4AF37] uppercase">{perkOne.tag}</span>
 </div>
 <div className={`flex flex-col gap-0.5 relative z-10 transition-opacity duration-300 ${animatingOne ? 'opacity-0' : 'opacity-100'}`}>
 <h3 className="text-xs font-black tracking-wider text-white uppercase truncate">{perkOne.title}</h3>
 <p className="text-[9px] text-neutral-400 tracking-wide line-clamp-1">{perkOne.subtitle}</p>
 </div>
 <div className="flex justify-between items-center pt-1 border-t border-neutral-900 relative z-10 text-[8px] font-bold tracking-widest">
 <span className="text-neutral-500 uppercase">GUESTLIST</span>
 <span className="text-[#D4AF37] cursor-pointer hover:underline">{`[ ${perkOne.action} → ]`}</span>
 </div>
 </div>

 <div className="flex-1 h-28 bg-neutral-950 border border-neutral-900 rounded-xl p-3.5 flex flex-col justify-between relative overflow-hidden shadow-xl">
 <div className="flex justify-between items-center relative z-10">
 <span className="text-[8px] font-bold tracking-[0.2em] text-[#D4AF37] uppercase">{perkTwo.tag}</span>
 </div>
 <div className={`flex flex-col gap-0.5 relative z-10 transition-opacity duration-300 ${animatingTwo ? 'opacity-0' : 'opacity-100'}`}>
 <h3 className="text-xs font-black tracking-wider text-white uppercase truncate">{perkTwo.title}</h3>
 <p className="text-[9px] text-neutral-400 tracking-wide line-clamp-1">{perkTwo.subtitle}</p>
 </div>
 <div className="flex justify-between items-center pt-1 border-t border-neutral-900 relative z-10 text-[8px] font-bold tracking-widest">
 <span className="text-neutral-500 uppercase">ECOSYSTEM</span>
 <span className="text-[#D4AF37] cursor-pointer hover:underline">{`[ ${perkTwo.action} → ]`}</span>
 </div>
 </div>

 <div className="flex-shrink-0 w-24 h-28 bg-neutral-950 border border-neutral-900 rounded-xl flex items-center justify-center p-2 shadow-lg">
 <div className="text-center border border-[#D4AF37]/30 rounded p-1">
 <span className="text-[9px] font-black tracking-wider text-[#D4AF37] block">RMT</span>
 <span className="text-[7px] text-neutral-400 uppercase tracking-tighter block">FEEDBACK</span>
 </div>
 </div>

 </div>
 );
}