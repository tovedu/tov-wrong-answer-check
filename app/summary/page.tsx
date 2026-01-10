'use client';

import { useState } from 'react';

type SummaryData = {
    total_wrong: number;
    most_freq_type: string;
    most_freq_area: string;
    details: {
        week: string;
        session: string;
        q_slot: string;
        q_type: string;
        area: string;
    }[];
};

export default function SummaryPage() {
    const [studentId, setStudentId] = useState('');
    const [weekFrom, setWeekFrom] = useState('1');
    const [weekTo, setWeekTo] = useState('8');
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<SummaryData | null>(null);

    const fetchSummary = async () => {
        if (!studentId) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/summary?student_id=${studentId}&week_from=${weekFrom}&week_to=${weekTo}`);
            if (!res.ok) throw new Error('Failed');
            const json = await res.json();
            setData(json);
        } catch {
            alert('Failed to load summary');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen p-8 max-w-4xl mx-auto bg-gray-50">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold text-gray-800">Analytics</h1>
                <a href="/" className="text-sm text-blue-600 hover:underline">&larr; Back to Checker</a>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm mb-8 border border-gray-200 flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-sm font-medium mb-1">Student ID</label>
                    <input
                        type="text"
                        value={studentId}
                        onChange={e => setStudentId(e.target.value)}
                        className="w-full p-2 border rounded"
                        placeholder="Student ID"
                    />
                </div>
                <div className="w-24">
                    <label className="block text-sm font-medium mb-1">From Week</label>
                    <select value={weekFrom} onChange={e => setWeekFrom(e.target.value)} className="w-full p-2 border rounded">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                </div>
                <div className="w-24">
                    <label className="block text-sm font-medium mb-1">To Week</label>
                    <select value={weekTo} onChange={e => setWeekTo(e.target.value)} className="w-full p-2 border rounded">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                </div>
                <button
                    onClick={fetchSummary}
                    disabled={loading}
                    className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 font-medium h-[42px]"
                >
                    {loading ? 'Searching...' : 'Analyze'}
                </button>
            </div>

            {data && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white p-6 rounded shadow-sm border-t-4 border-red-500 text-center">
                            <div className="text-gray-500 text-sm uppercase font-semibold">Total Wrong</div>
                            <div className="text-4xl font-bold mt-2 text-gray-800">{data.total_wrong}</div>
                        </div>
                        <div className="bg-white p-6 rounded shadow-sm border-t-4 border-blue-500 text-center">
                            <div className="text-gray-500 text-sm uppercase font-semibold">Worst Type</div>
                            <div className="text-xl font-bold mt-2 text-gray-800 truncate" title={data.most_freq_type}>{data.most_freq_type || '-'}</div>
                        </div>
                        <div className="bg-white p-6 rounded shadow-sm border-t-4 border-yellow-500 text-center">
                            <div className="text-gray-500 text-sm uppercase font-semibold">Worst Area</div>
                            <div className="text-xl font-bold mt-2 text-gray-800">{data.most_freq_area || '-'}</div>
                        </div>
                    </div>

                    <div className="bg-white rounded shadow-sm overflow-hidden border border-gray-200">
                        <table className="w-full text-sm text-left text-gray-600">
                            <thead className="bg-gray-100 text-gray-700 uppercase text-xs font-semibold">
                                <tr>
                                    <th className="px-6 py-3">Week</th>
                                    <th className="px-6 py-3">Session</th>
                                    <th className="px-6 py-3">Slot</th>
                                    <th className="px-6 py-3">Type</th>
                                    <th className="px-6 py-3">Area</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {data.details && data.details.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50">
                                        <td className="px-6 py-3">{row.week}</td>
                                        <td className="px-6 py-3">{row.session}</td>
                                        <td className="px-6 py-3 font-medium text-gray-900">{row.q_slot}</td>
                                        <td className="px-6 py-3">{row.q_type}</td>
                                        <td className="px-6 py-3">{row.area}</td>
                                    </tr>
                                ))}
                                {(!data.details || data.details.length === 0) && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                                            No wrong answers found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </main>
    );
}
