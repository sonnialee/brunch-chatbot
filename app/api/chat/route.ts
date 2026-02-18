import { NextResponse } from 'next/server';
import { chat } from '@/lib/claude-client';

export async function POST(request: Request) {
  try {
    const { message, history } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const response = await chat(message, history || []);

    return NextResponse.json({
      success: true,
      response
    });
  } catch (error) {
    console.error('Chat error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: 'Failed to generate response', details: errorMessage },
      { status: 500 }
    );
  }
}
