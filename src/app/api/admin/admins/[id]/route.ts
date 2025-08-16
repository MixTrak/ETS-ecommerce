import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongo';
import Admin from '@/models/Admin';
import { verifyAdminToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

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

    // Only owners can update admins
    if (admin.role !== 'owner') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const { email, fullName, role, password } = body;

    // Find the admin to update
    const adminToUpdate = await Admin.findById(id);
    if (!adminToUpdate) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    // Prevent changing owner role
    if (adminToUpdate.role === 'owner' && role !== 'owner') {
      return NextResponse.json({ error: 'Cannot change owner role' }, { status: 400 });
    }

    // Prepare update data
    const updateData: Partial<{
      email: string;
      fullName: string;
      role: string;
      password?: string;
      updatedAt: Date;
    }> = {
      email,
      fullName,
      role,
      updatedAt: new Date(),
    };

    // Hash password if provided
    if (password && password.trim() !== '') {
      const saltRounds = 10;
      updateData.password = await bcrypt.hash(password, saltRounds);
    }

    // Update admin
    const updatedAdmin = await Admin.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    return NextResponse.json({ 
      message: 'Admin updated successfully',
      admin: updatedAdmin 
    }, { status: 200 });
  } catch (error) {
    console.error('Error updating admin:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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

    // Only owners can delete admins
    if (admin.role !== 'owner') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { id } = await context.params;

    // Find the admin to delete
    const adminToDelete = await Admin.findById(id);
    if (!adminToDelete) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    // Prevent deleting the owner
    if (adminToDelete.role === 'owner') {
      return NextResponse.json({ error: 'Cannot delete the owner account' }, { status: 400 });
    }

    // Prevent deleting yourself
    if (adminToDelete._id?.toString() === admin.id) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    await Admin.findByIdAndDelete(id);

    return NextResponse.json({ message: 'Admin deleted successfully' });
  } catch (error) {
    console.error('Error deleting admin:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
