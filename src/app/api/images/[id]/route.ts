import { NextRequest, NextResponse } from 'next/server';
import { GridFSService } from '@/lib/gridfsService';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const { id } = await context.params;

    if (!id) {
      return new NextResponse('Image ID is required', { status: 400 });
    }

    // Get image info first
    const imageInfo = await GridFSService.getImageInfo(id);
    if (!imageInfo) {
      return new NextResponse('Image not found', { status: 404 });
    }

    // Get image stream
    const imageStream = await GridFSService.getImageStream(id);

    // Convert stream to buffer
    const chunks: Buffer[] = [];
    
    return new Promise<Response>((resolve, reject) => {
      imageStream.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      imageStream.on('end', () => {
        const buffer = Buffer.concat(chunks);
        
        const response = new NextResponse(buffer, {
          status: 200,
          headers: {
            'Content-Type': imageInfo.contentType || 'image/jpeg',
            'Content-Length': buffer.length.toString(),
            'Cache-Control': 'public, max-age=31536000, immutable',
          },
        });
        
        resolve(response);
      });

      imageStream.on('error', (error) => {
        console.error('Error streaming image:', error);
        reject(new NextResponse('Error retrieving image', { status: 500 }));
      });
    });

  } catch (error: unknown) {
    console.error('Error retrieving image:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new NextResponse(`Image retrieval failed: ${errorMessage}`, { status: 500 });
  }
}
