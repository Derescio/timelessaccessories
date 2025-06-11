import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { writeFile } from 'fs/promises';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const name = formData.get('name') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!name) {
      return NextResponse.json({ error: 'Design name is required' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 });
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 });
    }

    // Create unique filename
    const timestamp = Date.now();
    const extension = file.name.split('.').pop() || 'png';
    const filename = `design-${timestamp}.${extension}`;
    
    // Save file to public/uploads/designs directory
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'designs');
    const filePath = join(uploadDir, filename);
    
    // Create directory if it doesn't exist
    const fs = require('fs');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    await writeFile(filePath, buffer);
    
    // Get image dimensions (simplified - in production you'd use a proper image library)
    const imageUrl = `/uploads/designs/${filename}`;
    
    // Create design record in database
    const design = await prisma.design.create({
      data: {
        name,
        imageUrl,
        width: 1000, // Default width - you'd get this from actual image
        height: 1000, // Default height - you'd get this from actual image
        fileSize: file.size,
        fileType: file.type,
        userId: session.user.id
      }
    });

    return NextResponse.json({
      success: true,
      design: {
        id: design.id,
        name: design.name,
        imageUrl: design.imageUrl,
        width: design.width,
        height: design.height
      }
    });

  } catch (error) {
    console.error('Error uploading design:', error);
    return NextResponse.json(
      { error: 'Failed to upload design' },
      { status: 500 }
    );
  }
} 