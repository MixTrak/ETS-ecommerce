import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongo';
import Product from '@/models/Product';
import Admin from '@/models/Admin';
import { verifyAdminToken } from '@/lib/auth';
import { GridFSService } from '@/lib/gridfsService';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Verify admin token and permissions
    const currentAdmin = await verifyAdminToken(request);
    if (!currentAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check permissions
    const permissions = Admin.getPermissions(currentAdmin.role);
    if (!permissions.canCreateProducts) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const price = parseFloat(formData.get('price') as string);
    const description = formData.get('description') as string;
    const category = formData.get('category') as string;
    const tagsString = formData.get('tags') as string;
    const tags = tagsString ? tagsString.split(',').map(tag => tag.trim()) : [];
    const featured = formData.get('featured') === 'true';
    const stockQuantity = parseInt(formData.get('stockQuantity') as string) || 0;
    const imageFile = formData.get('image') as File;

    if (!imageFile) {
      return NextResponse.json(
        { error: 'Product image is required' },
        { status: 400 }
      );
    }

    // Upload image using GridFSService
    let imageResult;
    try {
      imageResult = await GridFSService.uploadProductImage(imageFile);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return NextResponse.json(
        { error: `Image upload failed: ${errorMessage}` },
        { status: 400 }
      );
    }

    // Create product
    const product = new Product({
      name,
      price,
      description,
      category,
      tags,
      featured,
      stockQuantity,
      image: imageResult.url,
      imagePublicId: imageResult.fileId,
      createdBy: currentAdmin._id,
    });

    await product.save();

    return NextResponse.json(
      {
        message: 'Product created successfully',
        product: {
          id: product._id,
          name: product.name,
          price: product.price,
          description: product.description,
          category: product.category,
          tags: product.tags,
          featured: product.featured,
          stockQuantity: product.stockQuantity,
          image: product.image,
          sku: product.sku,
          createdAt: product.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Product creation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: `Product creation failed: ${errorMessage}` },
      { status: 500 }
    );
  }
}
