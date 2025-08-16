import { NextRequest, NextResponse } from 'next/server';
import { GridFSService } from '@/lib/gridfsService';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      );
    }

    // Validate and upload image
    const result = await GridFSService.uploadProductImage(file);

    return NextResponse.json({
      message: 'Image uploaded successfully',
      fileId: result.fileId,
      url: result.url,
      path: result.path,
      filename: result.filename
    });

  } catch (error: unknown) {
    console.error('Image upload error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: `Image upload failed: ${errorMessage}` },
      { status: 500 }
    );
  }
}
