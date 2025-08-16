import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongo';
import Product from '@/models/Product';
import Admin from '@/models/Admin';
import { verifyAdminToken } from '@/lib/auth';

type MongoFilter = {
  isActive?: boolean;
  category?: { $regex: string; $options: string };
  featured?: boolean;
  price?: { $gte?: number; $lte?: number };
  $or?: Array<{
    name?: { $regex: string; $options: string };
    description?: { $regex: string; $options: string };
    tags?: { $in: RegExp[] };
  }>;
};

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const query = searchParams.get('query') || '';
    const category = searchParams.get('category') || '';
    const featured = searchParams.get('featured') || '';
    const minPrice = searchParams.get('minPrice') || '';
    const maxPrice = searchParams.get('maxPrice') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const skip = (page - 1) * limit;

    // Build filter object
    const filter: MongoFilter = { isActive: true };

    if (category) {
      filter.category = { $regex: category, $options: 'i' };
    }

    if (featured === 'true') {
      filter.featured = true;
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    if (query) {
      // Text search across name, description, and tags
      filter.$or = [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { tags: { $in: [new RegExp(query, 'i')] } },
      ];
    }

    // Build sort object
    const sort: Record<string, 1 | -1> = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute queries
    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('createdBy', 'fullName email role')
        .lean(),
      Product.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      }
    });
  } catch (error: unknown) {
    console.error('Products fetch error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: `Failed to fetch products: ${errorMessage}` },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Verify admin token
    const admin = await verifyAdminToken(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions
    const adminDoc = await Admin.findById(admin.id);
    if (!adminDoc) { // Add null check for adminDoc
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }
    const permissions = Admin.getPermissions(adminDoc.role);
    
    if (!permissions.canCreateProducts) {
      return NextResponse.json({ error: 'Insufficient permissions to create products' }, { status: 403 });
    }

    const body = await request.json();
    
    // Process tags if they're a string
    if (typeof body.tags === 'string') {
      body.tags = body.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0);
    }

    // Convert price to number if it's a string
    if (typeof body.price === 'string') {
      body.price = parseFloat(body.price);
    }

    // Convert stockQuantity to number if it's a string
    if (typeof body.stockQuantity === 'string') {
      body.stockQuantity = parseInt(body.stockQuantity);
    }

    // Set required fields
    body.createdBy = admin.id;
    body.isActive = true;

    const product = new Product(body);
    await product.save();

    const populatedProduct = await Product.findById(product._id)
      .populate('createdBy', 'fullName email role');

    return NextResponse.json({ product: populatedProduct }, { status: 201 });
  } catch (error: unknown) {
    console.error('Product creation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: `Product creation failed: ${errorMessage}` },
      { status: 500 }
    );
  }
}