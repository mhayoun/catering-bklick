import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import { searchCaterers, upsertCaterer } from '../../../lib/store';
import { autoTranslate } from '../../../lib/translate';

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  const filters = {
    keyword: searchParams.get('keyword') || '',
    districts: searchParams.getAll('districts'),
    kashrutLevels: searchParams.getAll('kashrutLevels'),
    cateringTypes: searchParams.getAll('cateringTypes'),
    eventTypes: searchParams.getAll('eventTypes'),
    minGuests: searchParams.get('minGuests') || '',
    menuCategories: searchParams.getAll('menuCategories'),
    beverageTypes: searchParams.getAll('beverageTypes'),
    services: searchParams.getAll('services')
  };

  const results = await searchCaterers(filters);
  // Public search only ever shows admin-approved listings.
  const approved = results.filter((c) => c.status === 'approved');
  return NextResponse.json({ results: approved });
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const body = await request.json();

  if (!body.businessName || !body.districts?.length || !body.cateringTypes?.length) {
    return NextResponse.json({ error: 'missing required fields' }, { status: 400 });
  }

  const description = await autoTranslate(body.description, body.descriptionLang);

  const record = await upsertCaterer(
    { ...body, description, id: undefined, ownerEmail: session.user.email },
    session.user.email
  );

  return NextResponse.json({ caterer: record }, { status: 201 });
}
