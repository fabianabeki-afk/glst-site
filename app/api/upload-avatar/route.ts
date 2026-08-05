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

export async function POST(req: NextRequest) {
  try {
    console.log('Avatar upload request received');
    
    const supabase = getSupabaseClient();
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;

    console.log('File:', file?.name, 'Size:', file?.size, 'UserId:', userId);

    if (!file || !userId) {
      console.log('Missing file or userId');
      return NextResponse.json({ error: 'Missing file or userId' }, { status: 400 });
    }

    // Check if bucket exists, if not create it
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(b => b.name === 'dj-avatars');
    
    if (!bucketExists) {
      console.log('Creating dj-avatars bucket...');
      const { error: bucketError } = await supabase.storage.createBucket('dj-avatars', {
        public: true,
        fileSizeLimit: 5242880, // 5MB
      });
      if (bucketError) {
        console.error('Bucket creation error:', bucketError);
      }
    }

    // Upload to Supabase Storage
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    console.log('Uploading to:', filePath);

    // Convert file to buffer for upload
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const { data, error } = await supabase
      .storage
      .from('dj-avatars')
      .upload(filePath, buffer, {
        contentType: file.type || 'image/jpeg',
        upsert: true,
      });

    if (error) {
      console.error('Storage upload error:', error);
      throw new Error(`Storage upload failed: ${error.message}`);
    }

    console.log('Upload successful:', data);

    // Get public URL
    const { data: { publicUrl } } = supabase
      .storage
      .from('dj-avatars')
      .getPublicUrl(filePath);

    console.log('Public URL:', publicUrl);

    // Update profile with new avatar URL
    const { error: updateError } = await supabase
      .from('profiles')
      .upsert({ 
        id: userId, 
        avatar_url: publicUrl,
        updated_at: new Date().toISOString()
      });

    if (updateError) {
      console.error('Profile update error:', updateError);
    }

    return NextResponse.json({ url: publicUrl });
  } catch (err: any) {
    console.error('Avatar upload error:', err);
    return NextResponse.json({ 
      error: err.message || 'Upload failed',
      details: err.stack 
    }, { status: 500 });
  }
}