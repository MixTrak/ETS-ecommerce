import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongo';
import Product from '@/models/Product';
import Admin from '@/models/Admin';
import { verifyAdminToken } from '@/lib/auth';
import { GridFSService } from '@/lib/gridfsService';

interface ProductUpdateData {
  name: string;
  price: number;
  description: string;
  category: string;
  tags: string[];
  featured: boolean;
  stockQuantity: number;
  updatedAt: Date;
  updatedBy: string;
  image?: string;
  imagePublicId?: string;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await context.params;
    const product = await Product.findById(id).populate('createdBy', 'fullName email');

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    // Verify admin token
    const admin = await verifyAdminToken(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions
    const adminDoc = await Admin.findById(admin.id);
    if (!adminDoc) { // Null check added
        return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }
    const permissions = Admin.getPermissions(adminDoc.role);
    
    if (!permissions.canCreateProducts) {
      return NextResponse.json({ error: 'Insufficient permissions to update products' }, { status: 403 });
    }

    const { id } = await context.params;
    
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
    
    // Validate required fields
    if (!name || !price || !description || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get existing product to check for image
    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Handle image upload if new image is provided
    let imageResult = null;
    if (imageFile) {
      try {
        imageResult = await GridFSService.uploadProductImage(imageFile);
        
        // Delete old image if it exists
        if (existingProduct.imagePublicId) {
          try {
            await GridFSService.deleteImage(existingProduct.imagePublicId);
          } catch (imageError) {
            console.error('Error deleting old image:', imageError);
            // Continue even if old image deletion fails
          }
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return NextResponse.json(
          { error: `Image upload failed: ${errorMessage}` },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: ProductUpdateData = {
      name,
      price,
      description,
      category,
      tags,
      featured,
      stockQuantity,
      updatedAt: new Date(),
      updatedBy: admin.id,
    };

    // Add image data if new image was uploaded
    if (imageResult) {
      updateData.image = imageResult.url;
      updateData.imagePublicId = imageResult.fileId;
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'fullName email role');

    if (!updatedProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'Product updated successfully',
      product: updatedProduct 
    }, { status: 200 });
  } catch (error: unknown) {
    console.error('Error updating product:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ 
      error: errorMessage
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    // Verify admin token
    const admin = await verifyAdminToken(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions based on role
    const adminDoc = await Admin.findById(admin.id);
    if (!adminDoc) { // Null check added
        return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }
    const permissions = Admin.getPermissions(adminDoc.role);
    
    if (!permissions.canDeleteProducts) {
      return NextResponse.json({ error: 'Insufficient permissions to delete products' }, { status: 403 });
    }

    const { id } = await context.params;

    // Get product first to check for associated image
    const product = await Product.findById(id);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Delete associated GridFS image if it exists
    if (product.imagePublicId) {
      try {
        await GridFSService.deleteImage(product.imagePublicId);
      } catch (imageError) {
        console.error('Error deleting associated image:', imageError);
        // Continue with product deletion even if image deletion fails
      }
    }

    // Delete the product
    await Product.findByIdAndDelete(id);

    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}