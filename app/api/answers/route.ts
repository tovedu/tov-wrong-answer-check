import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('student_id');
    const week = searchParams.get('week');
    const session = searchParams.get('session');

    if (!studentId || !week || !session) {
        return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const baseUrl = new URL(request.url).origin;

    try {
        const res = await fetch(`${baseUrl}/api/gas?action=getAnswers&student_id=${studentId}&week=${week}&session=${session}`, {
            cache: 'no-store'
        });

        if (!res.ok) throw new Error('Failed to fetch answers');

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch answers' }, { status: 500 });
    }
}
