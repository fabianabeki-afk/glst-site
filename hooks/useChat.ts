// ... existing code ...
import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient, type RealtimeChannel } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
throw new Error('Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const useChat = (playerName: string) => {
const [messages, setMessages] = useState<{ user: string; text: string; time: string }[]>([]);
const channelRef = useRef<RealtimeChannel | null>(null);

useEffect(() => {
  const channel = supabase.channel('glst_mesh_network');
  channelRef.current = channel;

  channel.on('broadcast', { event: 'chat' }, ({ payload }) => {
    setMessages(prev => [
      {
        ...payload,
        time: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })
      },
      ...prev
    ].slice(0, 20));
  });

  channel.subscribe();

  return () => {
    channel.unsubscribe();
    channelRef.current = null;
  };
}, []);

const sendMessage = useCallback((text: string) => {
  if (!text.trim()) return;

  const payload = { user: playerName, text };
  channelRef.current?.send({
    type: 'broadcast',
    event: 'chat',
    payload
  });

  setMessages(prev => [{ ...payload, time: 'NOW' }, ...prev]);
}, [playerName]);

return { messages, sendMessage };
};
