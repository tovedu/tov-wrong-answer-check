import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const GAS_WEBAPP_URL = process.env.GAS_WEBAPP_URL;
    if (!GAS_WEBAPP_URL) return NextResponse.json({ error: 'GAS Link Undefined' }, { status: 500 });

    const { searchParams } = new URL(request.url);
    const student_id = searchParams.get('student_id');
    const week_from = searchParams.get('week_from');
    const week_to = searchParams.get('week_to');

    const targetUrl = new URL(GAS_WEBAPP_URL);
    targetUrl.searchParams.set('action', 'summary');
    if (student_id) targetUrl.searchParams.set('student_id', student_id);
    if (week_from) targetUrl.searchParams.set('week_from', week_from);
    if (week_to) targetUrl.searchParams.set('week_to', week_to);

    try {
        const res = await fetch(targetUrl.toString(), { cache: 'no-store' });
        if (!res.ok) throw new Error('Fetch failed');
        const data = await res.json();
        return NextResponse.json(data);
    } catch (e) {
        return NextResponse.json({ error: 'Failed to fetch summary' }, { status: 500 });
    }
}
