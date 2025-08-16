import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongo';
import User from '@/models/User';
import { userLoginSchema } from '@/lib/validations';
import { comparePassword, generateUserToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const validatedData = userLoginSchema.parse(body);

    // Find user
    const user = await User.findOne({ email: validatedData.email });
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check password
    const isPasswordValid = await comparePassword(validatedData.password, user.password || '');
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Generate token
    const token = generateUserToken({
      userId: user._id.toString(),
      email: user.email,
      role: 'user',
    });

    return NextResponse.json(
      {
        message: 'Login successful',
        token,
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          avatar: user.avatar,
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Login error:', error);
    
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input data', details: 'errors' in error ? error.errors : [] },
        { status: 400 }
      );
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: `Login failed: ${errorMessage}` },
      { status: 500 }
    );
  }
}
