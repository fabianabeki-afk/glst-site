"use client";
import { useRef, useState, useCallback, useEffect } from 'react';

export interface SignalLog {
  id: number;
  msg: string;
  time: string;
}

export const useDrmShield = () => {
  const [isActive, setIsActive] = useState(false);
  const [logs, setLogs] = useState<SignalLog[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const interceptorRef = useRef<BiquadFilterNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const jitterIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const addLog = useCallback((msg: string) => {
    setLogs(prev => [{
      id: Date.now(),
      msg,
      time: new Date().toLocaleTimeString([], { hour12: false })
    }, ...prev].slice(0, 5));
  }, []);

  const scramble = useCallback(() => {
    if (!interceptorRef.current || !audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    // Massive immediate shift to break bot tracking
    const burst = (Math.random() - 0.5) * 15; 
    interceptorRef.current.detune.exponentialRampToValueAtTime(35 + burst, ctx.currentTime + 0.1);
    interceptorRef.current.detune.exponentialRampToValueAtTime(20, ctx.currentTime + 0.8);
    addLog("MANUAL_SCRAMBLE: DEPTH_MAX");
  }, [addLog]);

  const toggleShield = useCallback(async () => {
    if (isActive) {
      audioCtxRef.current?.close();
      streamRef.current?.getTracks().forEach(track => track.stop());
      if (jitterIntervalRef.current) clearInterval(jitterIntervalRef.current);
      setIsActive(false);
      addLog("SHIELD_OFFLINE");
      return;
    }

    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioCtxRef.current = ctx;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const source = ctx.createMediaStreamSource(stream);
      const interceptor = ctx.createBiquadFilter();
      interceptor.type = "allpass";
      interceptor.detune.setValueAtTime(20, ctx.currentTime);
      interceptorRef.current = interceptor;

      // Ghost Heartbeat
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 0.2;
      lfoGain.gain.value = 10;
      lfo.connect(lfoGain);
      lfoGain.connect(interceptor.detune);
      lfo.start();

      source.connect(interceptor);
      interceptor.connect(ctx.destination);
      
      setIsActive(true);
      addLog("CLOAK_ACTIVE");

      jitterIntervalRef.current = setInterval(() => {
        const jitter = (Math.random() - 0.5) * 4;
        interceptor.detune.exponentialRampToValueAtTime(20 + jitter, ctx.currentTime + 1);
        addLog("JITTER_SYNC_OK");
      }, 4000);

    } catch (err) {
      addLog("HARDWARE_ERROR");
    }
  }, [isActive, addLog]);

  return { isActive, toggleShield, logs, scramble };
};