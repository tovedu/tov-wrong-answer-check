'use client';

import { useState } from 'react';
import Link from 'next/link';

type AnalysisItem = {
    slot: string;
    count: number;
    area: string;
    type: string;
};

export default function AnalysisPage() {
    const [week, setWeek] = useState('1');
    const [session, setSession] = useState('1');
    const [studentId, setStudentId] = useState('');
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<AnalysisItem[]>([]);
    const [executed, setExecuted] = useState(false);

    const fetchAnalysis = async () => {
        setLoading(true);
        setExecuted(true);
        try {
            // Build query params
            const params = new URLSearchParams({
                week,
                session,
            });
            if (studentId) params.append('student_id', studentId);

            const res = await fetch(`/api/analysis?${params.toString()}`);
            const json = await res.json();

            if (json.analysis && Array.isArray(json.analysis)) {
                setData(json.analysis);
            } else {
                setData([]);
            }
        } catch (error) {
            console.error(error);
            alert('Failed to load analysis data');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen p-8 max-w-4xl mx-auto bg-gray-50">
            <div className="flex items-center justify-between mb-8">
                <Link href="/" className="text-blue-600 hover:underline">
                    &larr; Back to Home
                </Link>
                <h1 className="text-2xl font-bold text-gray-800">Wrong Answer Analysis</h1>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm mb-8 border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium mb-1">Week</label>
                        <select
                            value={week}
                            onChange={e => setWeek(e.target.value)}
                            className="w-full p-2 border rounded"
                        >
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Session</label>
                        <select
                            value={session}
                            onChange={e => setSession(e.target.value)}
                            className="w-full p-2 border rounded"
                        >
                            {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Student ID (Optional)</label>
                        <input
                            type="text"
                            value={studentId}
                            onChange={e => setStudentId(e.target.value)}
                            placeholder="All Students"
                            className="w-full p-2 border rounded"
                        />
                    </div>
                    <div>
                        <button
                            onClick={fetchAnalysis}
                            disabled={loading}
                            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 font-medium transition-colors"
                        >
                            {loading ? 'Analyzing...' : 'Analyze'}
                        </button>
                    </div>
                </div>
            </div>

            {loading && (
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
                    <p className="mt-2 text-gray-500">Loading data...</p>
                </div>
            )}

            {!loading && executed && data.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                    No wrong answer data found for this selection.
                </div>
            )}

            {!loading && data.length > 0 && (
                <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Question Slot</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wrong Count</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type / Area</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {data.map((item, index) => (
                                <tr key={item.slot} className={index < 3 ? 'bg-red-50' : ''}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {index + 1}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                                        {item.slot}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-bold">
                                        {item.count}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {item.type} {item.area ? `(${item.area})` : ''}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </main>
    );
}
