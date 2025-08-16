import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongo';
import Admin from '@/models/Admin';
import { adminLoginSchema } from '@/lib/validations';
import { comparePassword, generateToken } from '@/lib/auth';
import { ObjectId } from 'mongodb'; // Import ObjectId for casting

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const validatedData = adminLoginSchema.parse(body);

    // Find admin
    const admin = await Admin.findOne({ email: validatedData.email, isActive: true });
    if (!admin) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check password
    const isPasswordValid = await comparePassword(validatedData.password, admin.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Generate token
    // Corrected line with explicit type casting
    const token = generateToken({
      adminId: (admin._id as ObjectId).toString(),
      email: admin.email,
      role: admin.role,
    });

    // Get permissions
    const permissions = Admin.getPermissions(admin.role);

    const response = NextResponse.json(
      {
        message: 'Login successful',
        admin: {
          // Corrected lines with explicit type casting
          id: (admin._id as ObjectId).toString(),
          fullName: admin.fullName,
          email: admin.email,
          role: admin.role,
          permissions,
        },
      },
      { status: 200 }
    );

    // Set token as HTTP-only cookie
    response.cookies.set('admin-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return response;
  } catch (error: unknown) {
    console.error('Admin login error:', error);
    
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input data', details: 'errors' in error ? error.errors : [] },
        { status: 400 }
      );
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: `Authentication failed: ${errorMessage}` },
      { status: 500 }
    );
  }
}