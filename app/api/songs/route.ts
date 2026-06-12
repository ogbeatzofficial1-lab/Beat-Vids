import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    message: "Songs API route is working!" 
  });
}
