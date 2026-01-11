
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const GAS_WEBAPP_URL = process.env.GAS_WEBAPP_URL;
    if (!GAS_WEBAPP_URL) return NextResponse.json({ error: 'GAS Link Undefined' }, { status: 500 });

    // Disable caching for fetch requests to ensure fresh data
    const { searchParams } = new URL(request.url);
    const week = searchParams.get('week');
    const session = searchParams.get('session');
    const student_id = searchParams.get('student_id');

    const targetUrl = new URL(GAS_WEBAPP_URL);
    targetUrl.searchParams.set('action', 'get_analysis_data');
    if (week) targetUrl.searchParams.set('week', week);
    if (session) targetUrl.searchParams.set('session', session);
    if (student_id) targetUrl.searchParams.set('student_id', student_id);

    try {
        const res = await fetch(targetUrl.toString(), { cache: 'no-store' });
        if (!res.ok) throw new Error('Fetch failed');
        const data = await res.json();
        return NextResponse.json(data);
    } catch (e) {
        return NextResponse.json({ error: 'Failed to fetch analysis data' }, { status: 500 });
    }
}
