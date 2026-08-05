import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
// create client only if both values exist
const supabase =
  supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey)
    : null;

export interface ChatMessage {
  user: string;
  text: string;
  time: string;
}

export async function postChatMessage(message: ChatMessage) {
  if (!supabase) {
    console.warn('Supabase client not configured, skipping chat message');
    return;
  }
  const channel = supabase.channel('glst_mesh_network');
  await channel.send({
    type: 'broadcast',
    event: 'chat',
    payload: message,
  });
}