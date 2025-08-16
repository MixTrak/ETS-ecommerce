import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongo';
import Contact from '@/models/Contact';
import { verifyAdminToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Verify admin authentication
    const admin = await verifyAdminToken(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const isRead = searchParams.get('isRead');

    // Build query
    const query: { isRead?: boolean } = {};
    if (isRead !== null && isRead !== '') {
      query.isRead = isRead === 'true';
    }

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Fetch messages with pagination
    const messages = await Contact.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const totalMessages = await Contact.countDocuments(query);
    const totalPages = Math.ceil(totalMessages / limit);

    // Get unread count
    const unreadCount = await Contact.countDocuments({ isRead: false });

    return NextResponse.json({
      messages,
      pagination: {
        currentPage: page,
        totalPages,
        totalMessages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      unreadCount,
    });

  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await connectDB();

    // Verify admin authentication
    const admin = await verifyAdminToken(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { messageId, isRead } = await request.json();

    if (!messageId) {
      return NextResponse.json({ error: 'Message ID is required' }, { status: 400 });
    }

    // Update message read status
    const updatedMessage = await Contact.findByIdAndUpdate(
      messageId,
      { isRead },
      { new: true }
    );

    if (!updatedMessage) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'Message updated successfully',
      data: updatedMessage 
    });

  } catch (error) {
    console.error('Error updating message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();

    // Verify admin authentication
    const admin = await verifyAdminToken(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { messageId } = await request.json();

    if (!messageId) {
      return NextResponse.json({ error: 'Message ID is required' }, { status: 400 });
    }

    // Delete the message
    const deletedMessage = await Contact.findByIdAndDelete(messageId);

    if (!deletedMessage) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'Message deleted successfully',
      data: deletedMessage 
    });

  } catch (error) {
    console.error('Error deleting message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
