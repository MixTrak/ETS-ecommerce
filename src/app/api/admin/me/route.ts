import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/auth';
import Admin from '@/models/Admin';

export async function GET(request: NextRequest) {
  try {
    const admin = await verifyAdminToken(request);
    
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const permissions = Admin.getPermissions(admin.role);

    return NextResponse.json({
      admin: {
        id: admin._id,
        fullName: admin.fullName,
        email: admin.email,
        role: admin.role,
        permissions,
        lastLogin: admin.lastLogin,
      }
    });
  } catch (error: unknown) {
    console.error('Admin session check error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: `Session verification failed: ${errorMessage}` },
      { status: 500 }
    );
  }
}
