import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'online',
    model_loaded: true,
    engine: 'EasyLoan Production Runtime',
  });
}
