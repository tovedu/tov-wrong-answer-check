'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ChevronLeft, Save, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

function InputContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const studentId = searchParams.get('student_id');
    const week = searchParams.get('week');
    const session = searchParams.get('session');

    const [questions, setQuestions] = useState<string[]>([]);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Initial Data Fetch
    useEffect(() => {
        if (!studentId || !week || !session) return;

        const init = async () => {
            try {
                // 1. Fetch Blueprint (Questions List)
                // If API fails or returns empty, fallback to default R1-15, V1-20
                let qList: string[] = [];
                try {
                    const bpRes = await fetch(`/api/blueprint?week=${week}&session=${session}`);
                    if (bpRes.ok) {
                        const bpData = await bpRes.json();
                        if (bpData.questions && Array.isArray(bpData.questions)) {
                            qList = bpData.questions;
                        }
                    }
                } catch (e) {
                    console.warn('Blueprint fetch failed, using default');
                }

                // Fallback if empty
                if (qList.length === 0) {
                    // Default Structure: R1-R15, V1-V25 (Adjust as needed)
                    const r = Array.from({ length: 15 }, (_, i) => `R${i + 1}`);
                    const v = Array.from({ length: 25 }, (_, i) => `V${i + 1}`);
                    qList = [...r, ...v];
                }
                setQuestions(qList);

                // 2. Fetch Existing Wrong Answers
                const wrongRes = await fetch(`/api/wrong?student_id=${studentId}&week=${week}&session=${session}`);
                if (wrongRes.ok) {
                    const wData = await wrongRes.json();
                    if (wData.wrong_list && Array.isArray(wData.wrong_list)) {
                        setSelected(new Set(wData.wrong_list));
                    }
                }
            } catch (error) {
                console.error('Initialization error:', error);
                alert('데이터를 불러오는 중 오류가 발생했습니다.');
            } finally {
                setLoading(false);
            }
        };

        init();
    }, [studentId, week, session]);

    const toggleQuestion = (q: string) => {
        const next = new Set(selected);
        if (next.has(q)) next.delete(q);
        else next.add(q);
        setSelected(next);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/wrong', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'save_wrong_list',
                    student_id: studentId,
                    week: week,
                    session: session,
                    wrong_list: Array.from(selected)
                })
            });

            if (!res.ok) throw new Error('Save failed');

            alert('저장되었습니다!');
            // Optional: Go back or stay
        } catch (error) {
            console.error(error);
            alert('저장에 실패했습니다.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
                <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
                <p className="text-slate-500 font-medium">문항 정보 로딩 중...</p>
            </div>
        );
    }

    // Split questions into Reading (R) and Vocabulary (V)
    const readingQ = questions.filter(q => q.startsWith('R'));
    const vocabQ = questions.filter(q => q.startsWith('V'));
    const otherQ = questions.filter(q => !q.startsWith('R') && !q.startsWith('V'));

    return (
        <main className="min-h-screen bg-slate-50 p-4 md:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <header className="flex items-center justify-between bg-white p-6 rounded-3xl shadow-sm border border-slate-100 sticky top-4 z-50">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                        >
                            <ChevronLeft className="w-6 h-6 text-slate-500" />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-slate-800">오답 입력</h1>
                            <p className="text-sm text-slate-500 font-medium">
                                <span className="text-indigo-600 font-bold">{studentId}</span> | Week {week} - Session {session}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-2 shadow-lg shadow-indigo-200"
                    >
                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        {saving ? '저장 중...' : '저장하기'}
                    </button>
                </header>

                {/* Question Grids */}
                <div className="grid gap-6">
                    {/* Reading Section */}
                    <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                        <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                            독해 (Reading)
                        </h2>
                        <div className="grid grid-cols-5 md:grid-cols-8 lg:grid-cols-10 gap-3">
                            {readingQ.map(q => (
                                <button
                                    key={q}
                                    onClick={() => toggleQuestion(q)}
                                    className={`aspect-square rounded-2xl font-bold text-lg transition-all duration-200 flex items-center justify-center border-2 ${selected.has(q)
                                            ? 'bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-200 scale-105'
                                            : 'bg-white border-slate-100 text-slate-400 hover:border-indigo-200 hover:text-indigo-500'
                                        }`}
                                >
                                    {q.replace('R', '')}
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Vocabulary Section */}
                    {(vocabQ.length > 0) && (
                        <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-green-500"></span>
                                어휘 (Vocabulary)
                            </h2>
                            <div className="grid grid-cols-5 md:grid-cols-8 lg:grid-cols-10 gap-3">
                                {vocabQ.map(q => (
                                    <button
                                        key={q}
                                        onClick={() => toggleQuestion(q)}
                                        className={`aspect-square rounded-2xl font-bold text-lg transition-all duration-200 flex items-center justify-center border-2 ${selected.has(q)
                                                ? 'bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-200 scale-105'
                                                : 'bg-white border-slate-100 text-slate-400 hover:border-indigo-200 hover:text-indigo-500'
                                            }`}
                                    >
                                        {q.replace('V', '')}
                                    </button>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Other Section (if any) */}
                    {otherQ.length > 0 && (
                        <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                            <h2 className="text-lg font-bold text-slate-800 mb-6">기타 문항</h2>
                            <div className="grid grid-cols-5 gap-3">
                                {otherQ.map(q => (
                                    <button
                                        key={q}
                                        onClick={() => toggleQuestion(q)}
                                        className={`p-4 rounded-2xl font-bold transition-all ${selected.has(q)
                                                ? 'bg-rose-500 text-white shadow-lg'
                                                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                                            }`}
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </main>
    );
}

export default function InputPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <InputContent />
        </Suspense>
    );
}
