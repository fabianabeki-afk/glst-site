import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseClient() {
 const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
 const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
 
 if (!url || !key) {
 throw new Error('Supabase credentials not configured');
 }
 
 return createClient(url, key);
}

export async function GET(req: NextRequest) {
 try {
 const supabase = getSupabaseClient();
 const { searchParams } = new URL(req.url);
 const userId = searchParams.get('userId');
 
 if (!userId) {
 return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
 }
 
 const { data: profile, error } = await supabase
 .from('profiles')
 .select('*')
 .eq('id', userId)
 .single();
 
 if (error) throw error;
 
 return NextResponse.json({ profile });
 } catch (err: any) {
 return NextResponse.json({ error: err.message }, { status: 500 });
 }
}

export async function POST(req: NextRequest) {
 try {
 const supabase = getSupabaseClient();
 const { userId, display_name, bio, genres, social_links, avatar_url, payout_method, paypal_email } = await req.json();
 
 if (!userId) {
 return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
 }
 
 const updateData: any = {
 id: userId,
 updated_at: new Date().toISOString(),
 };
 
 if (display_name !== undefined) updateData.display_name = display_name;
 if (bio !== undefined) updateData.bio = bio;
 if (genres !== undefined) updateData.genres = genres;
 if (social_links !== undefined) updateData.social_links = social_links;
 if (avatar_url !== undefined) updateData.avatar_url = avatar_url;
 if (payout_method !== undefined) updateData.payout_method = payout_method;
 if (paypal_email !== undefined) updateData.paypal_email = paypal_email;
 
 const { data: profile, error } = await supabase
 .from('profiles')
 .upsert(updateData)
 .select()
 .single();
 
 if (error) throw error;
 
 return NextResponse.json({ profile });
 } catch (err: any) {
 console.error('Profile save error:', err);
 return NextResponse.json({ error: err.message }, { status: 500 });
 }
}