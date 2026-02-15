import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Try to fetch from Clawdbot gateway
    const gatewayUrl = process.env.CLAWDBOT_GATEWAY_URL || 'http://localhost:18789';
    const token = process.env.CLAWDBOT_TOKEN || '';
    
    const res = await fetch(`${gatewayUrl}/api/cron/list`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error('Gateway not available');
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    // Return empty if Clawdbot not available
    return NextResponse.json({ jobs: [] });
  }
}
