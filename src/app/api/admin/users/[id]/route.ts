import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongo';
import User from '@/models/User';
import Admin from '@/models/Admin';
import { verifyAdminToken } from '@/lib/auth';

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

    // Check permissions
    const permissions = Admin.getPermissions(admin.role);
    if (!permissions.canDeleteUsers) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { id } = await context.params;

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'User deleted successfully' },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Error deleting user:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: `Failed to delete user: ${errorMessage}` },
      { status: 500 }
    );
  }
}
