import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongo';
import Contact from '@/models/Contact';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const { name, email, message, topic } = await request.json();

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required' },
        { status: 400 }
      );
    }

    // Create new contact message
    const contact = new Contact({
      name,
      email,
      message,
      topic: topic || 'General Inquiry',
      createdAt: new Date()
    });

    await contact.save();

    return NextResponse.json(
      { message: 'Message sent successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Contact API error:', error);
    return NextResponse.json(
      { error: 'Failed to send message. Please try again later.' },
      { status: 500 }
    );
  }
}
