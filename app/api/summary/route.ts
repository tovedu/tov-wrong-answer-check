
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const GAS_WEBAPP_URL = process.env.GAS_WEBAPP_URL;

    if (!GAS_WEBAPP_URL) {
        return NextResponse.json({ error: 'GAS_WEBAPP_URL is not defined' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const student_id = searchParams.get('student_id');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const book = searchParams.get('book');

    if (!student_id || !from || !to) {
        return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const targetUrl = new URL(GAS_WEBAPP_URL);
    targetUrl.searchParams.set('action', 'summary');
    targetUrl.searchParams.set('student_id', student_id);
    targetUrl.searchParams.set('from_week', from);
    targetUrl.searchParams.set('to_week', to);
    if (book) targetUrl.searchParams.set('book', book);

    try {
        const response = await fetch(targetUrl.toString(), {
            cache: 'no-store',
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: 'Failed to fetch from GAS', status: response.status },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Proxy Error (Summary):', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
