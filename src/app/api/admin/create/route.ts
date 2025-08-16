import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongo';
import Admin from '@/models/Admin';
import { adminRegistrationSchema } from '@/lib/validations';
import { hashPassword, verifyAdminToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    // Verify admin token and role
    const currentAdmin = await verifyAdminToken(request);
    if (!currentAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only owners can create admins
    const permissions = Admin.getPermissions(currentAdmin.role);
    if (!permissions.canCreateAdmins) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = adminRegistrationSchema.parse(body);

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: validatedData.email });
    if (existingAdmin) {
      return NextResponse.json(
        { error: 'Admin with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(validatedData.password);

    // Create admin
    const admin = new Admin({
      ...validatedData,
      password: hashedPassword,
      createdBy: currentAdmin._id,
    });

    await admin.save();

    return NextResponse.json(
      {
        message: 'Admin created successfully',
        admin: {
          id: admin._id,
          fullName: admin.fullName,
          email: admin.email,
          role: admin.role,
          createdAt: admin.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Admin creation error:', error);
    
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input data', details: 'errors' in error ? error.errors : [] },
        { status: 400 }
      );
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: `Admin creation failed: ${errorMessage}` },
      { status: 500 }
    );
  }
}
