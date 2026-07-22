import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: 'Blob storage is not configured. Add BLOB_READ_WRITE_TOKEN in your Vercel project.' },
      { status: 500 }
    );
  }

  const { put } = await import('@vercel/blob');

  const formData = await request.formData();
  const file = formData.get('file');
  if (!file) return NextResponse.json({ error: 'no file provided' }, { status: 400 });

  const filename = `caterers/${session.user.email}/${Date.now()}-${file.name}`;
  const blob = await put(filename, file, { access: 'public' });

  return NextResponse.json({ url: blob.url });
}
