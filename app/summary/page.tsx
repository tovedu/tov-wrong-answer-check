'use client';

import { useState, useMemo } from 'react';
import { SummaryData } from '../lib/types';
import { generateInsight, InsightResult } from '../lib/insight-engine';
import { Search, TrendingUp, BookOpen, Brain, CheckCircle, ArrowRight } from 'lucide-react';

export default function SummaryPage() {
    const [studentId, setStudentId] = useState('');
    const [weekFrom, setWeekFrom] = useState('1');
    const [weekTo, setWeekTo] = useState('8');
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<SummaryData | null>(null);

    const insight = useMemo(() => {
        if (!data) return null;
        return generateInsight(data);
    }, [data]);

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
        <main className="min-h-screen p-6 md:p-8 max-w-5xl mx-auto bg-slate-50 font-sans">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Analytics Report</h1>
                    <p className="text-slate-500 mt-1">AI-powered student performance analysis</p>
                </div>
                <a href="/" className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                    &larr; Back to Checker
                </a>
            </div>

            {/* Search Bar */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-8 flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Student ID</label>
                    <div className="relative">
                        <input
                            type="text"
                            value={studentId}
                            onChange={e => setStudentId(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                            placeholder="Enter Student ID (e.g., tov-101)"
                        />
                        <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    </div>
                </div>
                <div className="w-28">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">From Week</label>
                    <select value={weekFrom} onChange={e => setWeekFrom(e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 outline-none">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                </div>
                <div className="w-28">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">To Week</label>
                    <select value={weekTo} onChange={e => setWeekTo(e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 outline-none">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                </div>
                <button
                    onClick={fetchSummary}
                    disabled={loading}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-lg shadow-indigo-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed h-[46px]"
                >
                    {loading ? 'Analyzing...' : 'Generate Report'}
                </button>
            </div>

            {data && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

                    {/* AI Insight Card */}
                    {insight && (
                        <div className="relative overflow-hidden bg-white rounded-3xl shadow-xl border border-indigo-50">
                            {/* Decorative Background */}
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-indigo-500"></div>

                            <div className="p-8">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-violet-100 rounded-lg">
                                        <Brain className="w-6 h-6 text-violet-600" />
                                    </div>
                                    <h2 className="text-xl font-bold text-slate-800">AI Analysis Insight</h2>
                                    <span className="px-3 py-1 bg-violet-50 text-violet-700 text-xs font-bold rounded-full border border-violet-100 uppercase tracking-wider">Premium Analysis</span>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {/* Left Column: Diagnosis & Causes */}
                                    <div className="space-y-6">
                                        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                                            <h3 className="text-sm font-bold text-slate-500 uppercase mb-4 flex items-center gap-2">
                                                <TrendingUp className="w-4 h-4" />
                                                Learning Diagnosis
                                            </h3>
                                            <div className="flex items-end gap-2 mb-2">
                                                <span className="text-4xl font-extrabold text-slate-900">{insight.diagnosis.weakness}</span>
                                                <span className="text-lg font-medium text-rose-500 mb-1">Risk High</span>
                                            </div>
                                            <p className="text-slate-600 leading-relaxed text-sm">
                                                Detected weak area with highest impact factor (x{insight.diagnosis.impact_factor}).
                                                Improving this area will significantly boost overall score.
                                            </p>
                                        </div>

                                        <div>
                                            <h3 className="text-sm font-bold text-slate-500 uppercase mb-3 px-1">Weakness Cause Hypothesis</h3>
                                            <ul className="space-y-3">
                                                {insight.causes.map((cause, idx) => (
                                                    <li key={idx} className="flex gap-3 text-slate-700 bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                                                        <div className="min-w-[4px] h-full bg-rose-400 rounded-full"></div>
                                                        <span className="text-sm font-medium">{cause}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>

                                    {/* Right Column: Prescription & Strength */}
                                    <div className="space-y-6">
                                        <div className="relative bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-6 text-white overflow-hidden shadow-lg shadow-indigo-200">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-10 -mt-10"></div>
                                            <h3 className="text-sm font-bold text-indigo-100 uppercase mb-4 flex items-center gap-2 relative z-10">
                                                <CheckCircle className="w-4 h-4" />
                                                Core Prescription Routine
                                            </h3>
                                            <div className="space-y-4 relative z-10">
                                                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/10">
                                                    <div className="text-xs font-bold text-indigo-200 mb-1">STEP 1. PRE-READING</div>
                                                    <div className="text-sm font-semibold">{insight.prescription.step1.replace('[읽기 전] ', '')}</div>
                                                </div>
                                                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/10">
                                                    <div className="text-xs font-bold text-indigo-200 mb-1">STEP 2. DURING READING</div>
                                                    <div className="text-sm font-semibold">{insight.prescription.step2.replace('[읽는 중] ', '')}</div>
                                                </div>
                                                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/10">
                                                    <div className="text-xs font-bold text-indigo-200 mb-1">STEP 3. PROBLEM SOLVING</div>
                                                    <div className="text-sm font-semibold">{insight.prescription.step3.replace('[문제 풀이] ', '')}</div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100">
                                            <h3 className="text-sm font-bold text-emerald-800 uppercase mb-2 flex items-center gap-2">
                                                <BookOpen className="w-4 h-4" />
                                                Strength Transfer Strategy
                                            </h3>
                                            <div className="text-emerald-900 font-bold mb-1">{insight.strength.area} (Highest Accuracy)</div>
                                            <p className="text-xs text-emerald-700 leading-relaxed font-medium">
                                                {insight.strength.strategy}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    {/* Area Achievement Comparison */}
                    {data.comparison && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-100 flex flex-col justify-between relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <BookOpen className="w-24 h-24 text-blue-500" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2 mb-4">
                                        <BookOpen className="w-4 h-4" />
                                        Reading Achievement (Lit vs Non-Lit)
                                    </h3>
                                    <div className="flex gap-8">
                                        <div>
                                            <div className="text-xs font-semibold text-slate-400 mb-1">Literature</div>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-3xl font-black text-slate-800">{data.comparison.literature.accuracy}%</span>
                                                <span className="text-xs text-slate-500">({data.comparison.literature.total - data.comparison.literature.wrong}/{data.comparison.literature.total})</span>
                                            </div>
                                            <div className="w-24 h-2 bg-slate-100 rounded-full mt-2 overflow-hidden">
                                                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${data.comparison.literature.accuracy}%` }}></div>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-xs font-semibold text-slate-400 mb-1">Non-Literature</div>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-3xl font-black text-slate-800">{data.comparison.non_literature.accuracy}%</span>
                                                <span className="text-xs text-slate-500">({data.comparison.non_literature.total - data.comparison.non_literature.wrong}/{data.comparison.non_literature.total})</span>
                                            </div>
                                            <div className="w-24 h-2 bg-slate-100 rounded-full mt-2 overflow-hidden">
                                                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${data.comparison.non_literature.accuracy}%` }}></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4 text-xs text-slate-400 bg-slate-50 p-2 rounded">
                                    * Strictly excludes Vocabulary questions.
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-100 flex flex-col justify-between relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <CheckCircle className="w-24 h-24 text-emerald-500" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2 mb-4">
                                        <CheckCircle className="w-4 h-4" />
                                        Vocabulary Achievement
                                    </h3>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl font-black text-slate-800">{data.overall.vocab_accuracy}%</span>
                                        <span className="text-sm font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">Separate Domain</span>
                                    </div>
                                    <div className="w-full h-3 bg-slate-100 rounded-full mt-4 overflow-hidden">
                                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${data.overall.vocab_accuracy}%` }}></div>
                                    </div>
                                </div>
                                <p className="mt-4 text-sm text-slate-500 leading-relaxed">
                                    Vocabulary precision is key to improving Reading accuracy.
                                </p>
                            </div>
                        </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center min-h-[140px]">
                            <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Total Wrong Answers</div>
                            <div className="text-5xl font-black text-slate-800 tracking-tight">{data.total_wrong}</div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center min-h-[140px]">
                            <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Worst Question Type</div>
                            <div className="text-2xl font-bold text-slate-800 text-center">
                                {data.by_q_type && data.by_q_type.length > 0 ? (data.by_q_type[0].q_type || data.by_q_type[0].name) : '-'}
                            </div>
                            {data.by_q_type && data.by_q_type[0] && (
                                <div className="mt-2 text-xs font-medium px-2 py-1 bg-rose-50 text-rose-600 rounded-full">
                                    {(100 - data.by_q_type[0].accuracy).toFixed(0)}% Error Rate
                                </div>
                            )}
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center min-h-[140px]">
                            <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Worst Area</div>
                            <div className="text-2xl font-bold text-slate-800">
                                {data.by_area && data.by_area.length > 0 ? (data.by_area[0].area || data.by_area[0].name) : '-'}
                            </div>
                            {data.by_area && data.by_area[0] && (
                                <div className="mt-2 text-xs font-medium px-2 py-1 bg-amber-50 text-amber-600 rounded-full">
                                    {(100 - data.by_area[0].accuracy).toFixed(0)}% Error Rate
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-200">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-slate-600">
                                <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-bold tracking-wider border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-4">Date</th>
                                        <th className="px-6 py-4">Week-Session</th>
                                        <th className="px-6 py-4 text-center">No.</th>
                                        <th className="px-6 py-4">Area</th>
                                        <th className="px-6 py-4">Type</th>
                                        <th className="px-6 py-4">Text Genre</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {data.wrong_list && data.wrong_list.map((row, idx) => (
                                        <tr key={idx} className="hover:bg-indigo-50/30 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-slate-400 font-medium text-xs">
                                                {row.date ? new Date(row.date).toISOString().split('T')[0] : '-'}
                                            </td>
                                            <td className="px-6 py-4 font-bold text-slate-700">
                                                W{row.week} - S{row.session}
                                            </td>
                                            <td className="px-6 py-4 font-black text-rose-500 text-center bg-rose-50/50 rounded-lg mx-2">
                                                {row.slot}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${row.area === 'Reading' || row.area === '독해'
                                                    ? 'bg-blue-100 text-blue-700'
                                                    : 'bg-emerald-100 text-emerald-700'
                                                    }`}>
                                                    {row.area}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-medium text-slate-600">{row.type}</td>
                                            <td className="px-6 py-4 text-slate-500 italic">
                                                {row.passage || '-'}
                                            </td>
                                        </tr>
                                    ))}
                                    {(!data.wrong_list || data.wrong_list.length === 0) && (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium">
                                                <CheckCircle className="w-8 h-8 mx-auto mb-3 text-slate-200" />
                                                No wrong answers found. Great job!
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
