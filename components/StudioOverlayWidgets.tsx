// components/StudioOverlayWidgets.tsx
"use client";

import React, { useState } from "react";
import Image from "next/image";

export function StudioOverlayWidgets() {
  const [showRmtModal, setShowRmtModal] = useState(false);

  return (
    <>
      {/* Floating Widget Bar - Fixed at Bottom */}
      <div className="fixed bottom-6 inset-x-6 pointer-events-none flex items-center justify-between z-40">
        {/* Bottom Left: PadPro Master Button */}
        <button
          onClick={() => alert("PadPro Control Active")}
          className="pointer-events-auto relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-900/80 backdrop-blur-md shadow-2xl hover:scale-105 active:scale-95 transition-all p-1 group"
          title="Open PadPro Engine"
        >
          <Image
            src="/PADPRO_MASTER_1024.png"
            alt="PadPro Master"
            fill
            className="object-contain p-1 group-hover:brightness-110"
          />
        </button>

        {/* Bottom Right: Rate My Transition Button */}
        <button
          onClick={() => setShowRmtModal(true)}
          className="pointer-events-auto relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-900/80 backdrop-blur-md shadow-2xl hover:scale-105 active:scale-95 transition-all p-1 group"
          title="Rate My Transition"
        >
          <Image
            src="/RMT_logo_official_logo_1Black_1024.png"
            alt="Rate My Transition Logo"
            fill
            className="object-contain p-1 group-hover:brightness-110"
          />
        </button>
      </div>

      {/* Rate My Transition Video Modal */}
      {showRmtModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl bg-neutral-950 border border-neutral-800 rounded-2xl p-6 flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
              <div className="flex items-center gap-3">
                <div className="relative w-8 h-8">
                  <Image
                    src="/RMT_logo_official_logo_1Black_1024.png"
                    alt="RMT Logo"
                    fill
                    className="object-contain"
                  />
                </div>
                <h3 className="text-xs font-mono font-bold tracking-widest text-[#D4AF37] uppercase">
                  RATE MY TRANSITION
                </h3>
              </div>
              <button
                onClick={() => setShowRmtModal(false)}
                className="text-neutral-500 hover:text-white font-mono text-xs px-2 py-1 rounded bg-neutral-900 border border-neutral-800"
              >
                [ CLOSE ]
              </button>
            </div>

            {/* Movie Player (.mov support) */}
            <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-neutral-900">
              <video
                src="/Rate_my_transition_movie.mov"
                controls
                autoPlay
                className="w-full h-full object-contain"
              >
                Your browser does not support QuickTime .mov playback.
              </video>
            </div>
          </div>
        </div>
      )}
    </>
  );
}