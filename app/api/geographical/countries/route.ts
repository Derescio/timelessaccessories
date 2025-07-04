import { NextRequest, NextResponse } from 'next/server';
import { getCachedCountries } from '@/lib/cache/geographical';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const region = searchParams.get('region');
    const search = searchParams.get('search');
    const hasStates = searchParams.get('hasStates');
    const limit = searchParams.get('limit');

    const countries = await getCachedCountries({
      region: region || undefined,
      search: search || undefined,
      hasStates: hasStates ? hasStates === 'true' : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });

    return NextResponse.json({
      success: true,
      data: countries,
      count: Array.isArray(countries) ? countries.length : 0,
    });
  } catch (error) {
    console.error('Error fetching countries:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch countries',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, iso2, iso3, emoji, phoneCode, hasStates, region, capital } = body;

    if (!id || !name || !iso2 || !iso3) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Missing required fields: id, name, iso2, iso3' 
        },
        { status: 400 }
      );
    }

    const country = await prisma.country.create({
      data: {
        id: parseInt(id),
        name,
        iso2: iso2.toUpperCase(),
        iso3: iso3.toUpperCase(),
        emoji,
        phoneCode,
        hasStates: hasStates || false,
        region,
        capital,
      },
    });

    return NextResponse.json({
      success: true,
      data: country,
    });
  } catch (error) {
    console.error('Error creating country:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to create country',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 