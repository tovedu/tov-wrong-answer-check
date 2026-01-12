
import { NextResponse } from 'next/server';

export async function GET() {
    const GAS_URL = process.env.GAS_WEBAPP_URL;

    if (!GAS_URL) {
        return NextResponse.json({ error: 'GAS_WEBAPP_URL not defined' }, { status: 500 });
    }

    try {
        const res = await fetch(`${GAS_URL}?action=get_student_list`);

        if (!res.ok) {
            const text = await res.text();
            console.error(`GAS Error (${res.status}):`, text);
            throw new Error(`GAS responded with ${res.status}: ${text.substring(0, 100)}`);
        }

        const text = await res.text();
        try {
            const data = JSON.parse(text);
            return NextResponse.json(data);
        } catch (e) {
            console.error('JSON Parse Error. Raw response:', text);
            throw new Error(`Invalid JSON received: ${text.substring(0, 100)}...`);
        }
    } catch (error) {
        console.error('Failed to fetch students:', error);
        const userMessage = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: userMessage }, { status: 500 });
    }
}
