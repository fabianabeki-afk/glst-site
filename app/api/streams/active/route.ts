import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(req: NextRequest) {
  try {
    // Get active streams sorted by tier and viewer count
    const { data: streams, error } = await supabase
      .from('streams')
      .select('*')
      .eq('status', 'live')
      .order('tier', { ascending: false }) // verified first
      .order('viewer_count', { ascending: false })
      .order('started_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      streams: streams || [],
      count: streams?.length || 0,
    });

  } catch (error: any) {
    console.error('[STREAMS_LIST_ERROR]:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch streams' },
      { status: 500 }
    );
  }
}

// Mark stream as ended
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { streamId } = body;

    const { data, error } = await supabase
      .from('streams')
      .update({ status: 'ended', ended_at: new Date().toISOString() })
      .eq('id', streamId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, stream: data });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to end stream' },
      { status: 500 }
    );
  }
}
