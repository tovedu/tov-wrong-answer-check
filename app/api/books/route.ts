import { NextResponse } from 'next/server';

export async function GET() {
    const GAS_URL = process.env.GAS_WEBAPP_URL;

    if (!GAS_URL) {
        return NextResponse.json({ error: 'GAS_WEBAPP_URL not defined' }, { status: 500 });
    }

    try {
        const res = await fetch(`${GAS_URL}?action=get_book_list`, {
            cache: 'no-store'
        });

        if (!res.ok) {
            throw new Error(`GAS responded with ${res.status}`);
        }

        const data = await res.json();

        // Expected data: { books: ["TOV-R1", "TOV-R2", ...] }
        return NextResponse.json(data);
    } catch (error) {
        console.error('Failed to fetch books:', error);
        return NextResponse.json({ error: 'Failed to fetch books', details: String(error) }, { status: 500 });
    }
}
