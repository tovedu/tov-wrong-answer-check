import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const GAS_WEBAPP_URL = process.env.GAS_WEBAPP_URL;

    if (!GAS_WEBAPP_URL) {
        return NextResponse.json({ error: 'GAS_WEBAPP_URL is not defined' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const targetUrl = `${GAS_WEBAPP_URL}?${searchParams.toString()}`;

    try {
        const response = await fetch(targetUrl, {
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
        console.error('Proxy Error (GET):', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const GAS_WEBAPP_URL = process.env.GAS_WEBAPP_URL;

    if (!GAS_WEBAPP_URL) {
        return NextResponse.json({ error: 'GAS_WEBAPP_URL is not defined' }, { status: 500 });
    }

    try {
        const body = await request.json();

        // GAS requires POST requests to follow redirects usually, 
        // but the fetch API handles redirects by default.
        // However, google apps script web app post often requires 
        // handling simple requests.

        const response = await fetch(GAS_WEBAPP_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
            cache: 'no-store',
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: 'Failed to post to GAS', status: response.status },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Proxy Error (POST):', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
