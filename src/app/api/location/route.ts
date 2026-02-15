import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

// In-memory store (resets on cold start, but Vercel keeps it warm)
// For persistence, we'd use a KV store, but this works for now
let currentLocation: {
  lat: number;
  lon: number;
  acc: number;
  batt?: number;
  timestamp: number;
  address?: string;
} | null = null;

// Simple auth token - change this
const AUTH_TOKEN = process.env.LOCATION_TOKEN || 'molt-location-2026';

export async function POST(request: NextRequest) {
  // Check auth
  const authHeader = (await headers()).get('authorization');
  const token = authHeader?.replace('Bearer ', '') || request.nextUrl.searchParams.get('token');
  
  if (token !== AUTH_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    
    // OwnTracks sends _type: "location" for location updates
    if (body._type === 'location' || (body.lat && body.lon)) {
      currentLocation = {
        lat: body.lat,
        lon: body.lon,
        acc: body.acc || 0,
        batt: body.batt,
        timestamp: body.tst ? body.tst * 1000 : Date.now(),
      };
      
      // Try to reverse geocode (optional, async)
      reverseGeocode(body.lat, body.lon).then(addr => {
        if (currentLocation && addr) {
          currentLocation.address = addr;
        }
      }).catch(() => {});
      
      return NextResponse.json({ ok: true });
    }
    
    // OwnTracks also sends other message types, just ack them
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
}

export async function GET(request: NextRequest) {
  // Check auth
  const token = request.nextUrl.searchParams.get('token');
  const authHeader = (await headers()).get('authorization');
  const providedToken = authHeader?.replace('Bearer ', '') || token;
  
  if (providedToken !== AUTH_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!currentLocation) {
    return NextResponse.json({ error: 'No location data yet' }, { status: 404 });
  }

  const age = Date.now() - currentLocation.timestamp;
  const ageMinutes = Math.floor(age / 60000);
  
  return NextResponse.json({
    ...currentLocation,
    age: ageMinutes < 60 
      ? `${ageMinutes}m ago` 
      : `${Math.floor(ageMinutes / 60)}h ago`,
  });
}

async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
      { headers: { 'User-Agent': 'HQ-Dashboard' } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    // Return neighborhood/suburb + city
    const parts = [
      data.address?.neighbourhood || data.address?.suburb || data.address?.hamlet,
      data.address?.city || data.address?.town || data.address?.village,
    ].filter(Boolean);
    return parts.join(', ') || data.display_name?.split(',').slice(0, 2).join(',');
  } catch {
    return null;
  }
}
