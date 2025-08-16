import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongo';
import User from '@/models/User';
import { generateUserToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const { user: googleUser } = await request.json();
    
    if (!googleUser || !googleUser.uid || !googleUser.email) {
      return NextResponse.json(
        { error: 'Invalid Google user data' },
        { status: 400 }
      );
    }

    // Check if user already exists
    let user = await User.findOne({ 
      $or: [
        { email: googleUser.email },
        { providerId: googleUser.uid }
      ]
    });

    if (user) {
      // Update existing user with latest Google info
      user.fullName = googleUser.displayName || user.fullName;
      // Only update avatar if it's a Google user with photoURL
      if (googleUser.photoURL) {
        user.avatar = googleUser.photoURL;
      }
      user.provider = 'google';
      user.providerId = googleUser.uid;
      await user.save();
    } else {
      // Create new user
      user = new User({
        fullName: googleUser.displayName || '',
        email: googleUser.email,
        provider: 'google',
        providerId: googleUser.uid,
        avatar: googleUser.photoURL || '', // Use photoURL from Google
        phone: '', // Google users don't provide phone initially
      });
      await user.save();
    }

    // Generate token
    const token = generateUserToken({
      userId: user._id.toString(),
      email: user.email,
      role: 'user',
    });

    return NextResponse.json({
      message: 'Google login successful',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        provider: user.provider,
      },
    });
  } catch (error: unknown) {
    console.error('Google login error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: `Google login failed: ${errorMessage}` },
      { status: 500 }
    );
  }
}
