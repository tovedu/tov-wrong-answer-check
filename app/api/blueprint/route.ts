import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const week = searchParams.get('week');
    const session = searchParams.get('session');

    if (!week || !session) {
        return NextResponse.json({ error: 'Missing week or session' }, { status: 400 });
    }

    // Use the internal proxy URL (localhost) or call the function directly? 
    // Calling the proxy URL via fetch is easier to keep logic consistent.
    const baseUrl = new URL(request.url).origin;

    try {
        const res = await fetch(`${baseUrl}/api/gas?action=getSessionBlueprint&week=${week}&session=${session}`, {
            cache: 'no-store'
        });

        if (!res.ok) throw new Error('Failed to fetch blueprint');

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch blueprint' }, { status: 500 });
    }
}
