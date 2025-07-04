import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const withCounts = searchParams.get('withCounts') === 'true';

    if (withCounts) {
      // Get regions with country counts
      const regions = await prisma.country.groupBy({
        by: ['region'],
        where: {
          isActive: true,
          region: {
            not: null,
          },
        },
        _count: {
          region: true,
        },
        orderBy: {
          region: 'asc',
        },
      });

      const formattedRegions = regions.map(region => ({
        name: region.region,
        countryCount: region._count.region,
      }));

      return NextResponse.json({
        success: true,
        data: formattedRegions,
        count: formattedRegions.length,
      });
    } else {
      // Get unique regions only
      const regions = await prisma.country.findMany({
        where: {
          isActive: true,
          region: {
            not: null,
          },
        },
        select: {
          region: true,
        },
        distinct: ['region'],
        orderBy: {
          region: 'asc',
        },
      });

      const regionNames = regions
        .map(r => r.region)
        .filter(Boolean)
        .sort();

      return NextResponse.json({
        success: true,
        data: regionNames,
        count: regionNames.length,
      });
    }
  } catch (error) {
    console.error('Error fetching regions:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch regions',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 