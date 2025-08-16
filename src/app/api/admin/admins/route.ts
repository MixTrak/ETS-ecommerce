import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongo';
import Admin from '@/models/Admin';
import { verifyAdminToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Verify admin token
    const admin = await verifyAdminToken(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only owners can view all admins
    if (admin.role !== 'owner') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const admins = await Admin.find({})
      .select('-password')
      .sort({ createdAt: -1 });

    return NextResponse.json({ admins });
  } catch (error: unknown) {
    console.error('Error fetching admins:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: `Failed to fetch admins: ${errorMessage}` },
      { status: 500 }
    );
  }
}
