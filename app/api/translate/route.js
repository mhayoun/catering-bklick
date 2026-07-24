import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import { translateOne } from '../../../lib/translate';

// Used by CatererForm for the live translation preview: when the owner
// switches the form's active language, a blank description/city field is
// filled in on the fly from whichever language they already typed.
export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { text, source, target } = await request.json().catch(() => ({}));
  if (!text || !source || !target) {
    return NextResponse.json({ error: 'missing fields' }, { status: 400 });
  }

  const translated = await translateOne(text, source, target);
  return NextResponse.json({ translated });
}
