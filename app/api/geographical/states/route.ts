import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const countryId = searchParams.get('countryId');
    const search = searchParams.get('search');
    const hasCities = searchParams.get('hasCities');
    const limit = searchParams.get('limit');

    if (!countryId) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Country ID is required' 
        },
        { status: 400 }
      );
    }

    const where: any = {
      countryId: parseInt(countryId),
      isActive: true,
    };
    
    if (search) {
      where.OR = [
        {
          name: {
            contains: search,
            mode: 'insensitive',
          }
        },
        {
          stateCode: {
            contains: search,
            mode: 'insensitive',
          }
        }
      ];
    }

    if (hasCities !== null && hasCities !== undefined) {
      where.hasCities = hasCities === 'true';
    }

    const states = await prisma.state.findMany({
      where,
      select: {
        id: true,
        name: true,
        stateCode: true,
        hasCities: true,
        latitude: true,
        longitude: true,
        country: {
          select: {
            id: true,
            name: true,
            iso2: true,
            emoji: true,
          }
        }
      },
      orderBy: { name: 'asc' },
      take: limit ? parseInt(limit) : undefined,
    });

    return NextResponse.json({
      success: true,
      data: states,
      count: states.length,
    });
  } catch (error) {
    console.error('Error fetching states:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch states',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, countryId, name, stateCode, hasCities, latitude, longitude } = body;

    if (!id || !countryId || !name) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Missing required fields: id, countryId, name' 
        },
        { status: 400 }
      );
    }

    // Verify country exists
    const country = await prisma.country.findUnique({
      where: { id: parseInt(countryId) }
    });

    if (!country) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Country not found' 
        },
        { status: 404 }
      );
    }

    const state = await prisma.state.create({
      data: {
        id: parseInt(id),
        countryId: parseInt(countryId),
        name,
        stateCode,
        hasCities: hasCities || false,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
      },
    });

    return NextResponse.json({
      success: true,
      data: state,
    });
  } catch (error) {
    console.error('Error creating state:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to create state',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 