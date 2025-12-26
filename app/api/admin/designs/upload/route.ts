import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/utils/auth-helpers';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import { join, basename } from 'path';
import { randomBytes } from 'crypto';

// Allowed image MIME types
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
];

// Map MIME types to file extensions
const MIME_TO_EXTENSION: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
};

// Validate file is actually an image by checking magic bytes
function isValidImageFile(buffer: Buffer): { valid: boolean; mimeType?: string } {
  // Check magic bytes for common image formats
  const signatures: Record<string, number[][]> = {
    'image/jpeg': [[0xFF, 0xD8, 0xFF]],
    'image/png': [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],
    'image/gif': [[0x47, 0x49, 0x46, 0x38, 0x37, 0x61], [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]],
    'image/webp': [[0x52, 0x49, 0x46, 0x46]], // RIFF header, need to check more bytes for WEBP
  };

  for (const [mimeType, sigs] of Object.entries(signatures)) {
    for (const sig of sigs) {
      if (buffer.length >= sig.length) {
        const matches = sig.every((byte, index) => buffer[index] === byte);
        if (matches) {
          // For WEBP, verify it's actually WEBP format
          if (mimeType === 'image/webp') {
            const webpCheck = buffer.slice(8, 12).toString('ascii');
            if (webpCheck === 'WEBP') {
              return { valid: true, mimeType };
            }
          } else {
            return { valid: true, mimeType };
          }
        }
      }
    }
  }

  return { valid: false };
}

export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    const authResult = await requireAdmin();
    if (authResult.error) {
      return authResult.error;
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const name = formData.get('name') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Design name is required' }, { status: 400 });
    }

    // Sanitize design name (remove potentially dangerous characters)
    const sanitizedName = name.trim().replace(/[<>:"/\\|?*]/g, '').substring(0, 100);

    // Validate file type by MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed' 
      }, { status: 400 });
    }

    // Validate file size (5MB max)
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ 
        error: 'File size must be less than 5MB' 
      }, { status: 400 });
    }

    if (file.size === 0) {
      return NextResponse.json({ error: 'File is empty' }, { status: 400 });
    }

    // Read file buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Validate file is actually an image by checking magic bytes
    const imageValidation = isValidImageFile(buffer);
    if (!imageValidation.valid || !imageValidation.mimeType) {
      return NextResponse.json({ 
        error: 'File does not appear to be a valid image' 
      }, { status: 400 });
    }

    // Use validated MIME type to determine extension (not user-provided filename)
    const extension = MIME_TO_EXTENSION[imageValidation.mimeType] || 'png';

    // Generate secure random filename to prevent path traversal and filename collisions
    const randomId = randomBytes(16).toString('hex');
    const timestamp = Date.now();
    const filename = `design-${timestamp}-${randomId}.${extension}`;
    
    // Sanitize filename - use basename to prevent any path traversal attempts
    const safeFilename = basename(filename);
    
    // Define upload directory (outside public for better security, or use proper CDN)
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'designs');
    const filePath = join(uploadDir, safeFilename);
    
    // Ensure we're writing to the intended directory (prevent path traversal)
    const resolvedPath = join(uploadDir, basename(safeFilename));
    if (resolvedPath !== filePath) {
      return NextResponse.json({ error: 'Invalid file path' }, { status: 400 });
    }
    
    // Create directory if it doesn't exist
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (error) {
      // Directory might already exist, that's okay
      if (error && (error as NodeJS.ErrnoException).code !== 'EEXIST') {
        throw error;
      }
    }
    
    await writeFile(filePath, buffer);
    
    // Get image dimensions (simplified - in production you'd use a proper image library)
    const imageUrl = `/uploads/designs/${safeFilename}`;
    
    // Create design record in database
    const design = await prisma.design.create({
      data: {
        name: sanitizedName,
        imageUrl,
        width: 1000, // Default width - you'd get this from actual image
        height: 1000, // Default height - you'd get this from actual image
        fileSize: file.size,
        fileType: imageValidation.mimeType, // Use validated MIME type
        userId: authResult.user.id
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