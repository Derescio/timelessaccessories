import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const countryId = searchParams.get('countryId');
    const stateId = searchParams.get('stateId');
    const search = searchParams.get('search');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    if (!countryId || !stateId) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Country ID and State ID are required' 
        },
        { status: 400 }
      );
    }

    const where: any = {
      countryId: parseInt(countryId),
      stateId: parseInt(stateId),
      isActive: true,
    };
    
    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive',
      };
    }

    const cities = await prisma.city.findMany({
      where,
      select: {
        id: true,
        name: true,
        latitude: true,
        longitude: true,
        country: {
          select: {
            id: true,
            name: true,
            iso2: true,
            emoji: true,
          }
        },
        state: {
          select: {
            id: true,
            name: true,
            stateCode: true,
          }
        }
      },
      orderBy: { name: 'asc' },
      skip: offset ? parseInt(offset) : 0,
      take: limit ? parseInt(limit) : 100, // Default limit of 100 cities
    });

    // Get total count for pagination
    const totalCount = await prisma.city.count({ where });

    return NextResponse.json({
      success: true,
      data: cities,
      count: cities.length,
      totalCount,
      hasMore: (offset ? parseInt(offset) : 0) + cities.length < totalCount,
    });
  } catch (error) {
    console.error('Error fetching cities:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch cities',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, countryId, stateId, name, latitude, longitude } = body;

    if (!id || !countryId || !stateId || !name) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Missing required fields: id, countryId, stateId, name' 
        },
        { status: 400 }
      );
    }

    // Verify country and state exist
    const [country, state] = await Promise.all([
      prisma.country.findUnique({ where: { id: parseInt(countryId) } }),
      prisma.state.findUnique({ where: { id: parseInt(stateId) } })
    ]);

    if (!country) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Country not found' 
        },
        { status: 404 }
      );
    }

    if (!state) {
      return NextResponse.json(
        { 
          success: false,
          error: 'State not found' 
        },
        { status: 404 }
      );
    }

    const city = await prisma.city.create({
      data: {
        id: parseInt(id),
        countryId: parseInt(countryId),
        stateId: parseInt(stateId),
        name,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
      },
    });

    return NextResponse.json({
      success: true,
      data: city,
    });
  } catch (error) {
    console.error('Error creating city:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to create city',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 