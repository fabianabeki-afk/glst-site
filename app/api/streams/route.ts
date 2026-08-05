import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Only create Supabase client if env vars are available
const getSupabase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  
  if (!url || !key) {
    console.warn('Supabase credentials not configured');
    return null;
  }
  
  return createClient(url, key);
};

// GET upcoming streams
export async function GET(req: NextRequest) {
  try {
    console.log('Fetching streams...');
    
    const supabase = getSupabase();
    
    // If Supabase is not configured, return empty streams
    if (!supabase) {
      console.log('Supabase not configured, returning empty streams');
      return NextResponse.json({ streams: [] });
    }
    
    const { searchParams } = new URL(req.url);
    const channel = searchParams.get('channel');
    const status = searchParams.get('status') || 'scheduled';
    
    let query = supabase
      .from('streams')
      .select('*, profiles(username, display_name)')
      .eq('status', status)
      .gte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(10);
    
    if (channel) {
      query = query.eq('channel', channel);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }
    
    return NextResponse.json({ streams: data || [] });
  } catch (err: any) {
    console.error('GET /api/streams error:', err);
    // Return empty streams instead of 500 error
    return NextResponse.json({ streams: [] });
  }
}

// POST create stream
export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabase();
    
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }
    
    const { djId, channel, title, description, scheduledAt } = await req.json();
    
    if (!djId || !channel || !scheduledAt) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    const { data, error } = await supabase
      .from('streams')
      .insert({
        dj_id: djId,
        channel,
        title: title || 'Untitled Stream',
        description: description || '',
        scheduled_at: scheduledAt,
        status: 'scheduled',
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return NextResponse.json({ stream: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH update stream status
export async function PATCH(req: NextRequest) {
  try {
    const supabase = getSupabase();
    
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }
    
    const { streamId, status } = await req.json();
    
    if (!streamId || !status) {
      return NextResponse.json({ error: 'Missing streamId or status' }, { status: 400 });
    }
    
    const updates: any = { status };
    if (status === 'live') updates.started_at = new Date().toISOString();
    if (status === 'ended') updates.ended_at = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('streams')
      .update(updates)
      .eq('id', streamId)
      .select()
      .single();
    
    if (error) throw error;
    
    return NextResponse.json({ stream: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
