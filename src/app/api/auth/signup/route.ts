import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongo';
import User from '@/models/User';
import { userRegistrationSchema } from '@/lib/validations';
import { hashPassword, generateUserToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const validatedData = userRegistrationSchema.parse(body);

    // Check if user already exists
    const existingUser = await User.findOne({ email: validatedData.email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(validatedData.password);

    // Create user
    const user = new User({
      ...validatedData,
      password: hashedPassword,
      provider: 'email',
    });

    await user.save();

    // Generate token
    const token = generateUserToken({
      userId: user._id.toString(),
      email: user.email,
      role: 'user',
    });

    return NextResponse.json(
      {
        message: 'User registered successfully',
        token,
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Registration error:', error);
    
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input data', details: 'errors' in error ? error.errors : [] },
        { status: 400 }
      );
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: `Registration failed: ${errorMessage}` },
      { status: 500 }
    );
  }
}
