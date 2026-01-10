
import { NextResponse } from 'next/server';

export async function GET() {
    const GAS_URL = process.env.GAS_WEBAPP_URL;

    if (!GAS_URL) {
        return NextResponse.json({ error: 'GAS_WEBAPP_URL not defined' }, { status: 500 });
    }

    try {
        const res = await fetch(`${GAS_URL}?action=get_student_list`);
        if (!res.ok) {
            throw new Error(`GAS responded with ${res.status}`);
        }
        const data = await res.json();

        // data should look like { students: [{name, id}, ...] }
        return NextResponse.json(data);
    } catch (error) {
        console.error('Failed to fetch students:', error);
        return NextResponse.json({ error: 'Failed to fetch students', details: String(error) }, { status: 500 });
    }
}
