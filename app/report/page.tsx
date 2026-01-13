'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, ReferenceLine
} from 'recharts';
import { BookOpen, AlertTriangle, TrendingUp, Target, FileText, CheckCircle, Percent } from 'lucide-react';

// --- Types ---
interface SummaryData {
    student_id: string;
    total_questions: number;
    total_wrong: number;
    overall?: {
        accuracy: number;
        reading_accuracy: number;
        vocab_accuracy: number;
    };
    by_q_type?: any; // relaxed type to handle legacy object vs array
    by_area?: any;
    by_passage_group?: any;
    by_week?: any;
    wrong_list?: any[];
    debug?: any;
}

const COLORS = {
    high: '#10B981', // Green >= 80
    mid: '#F59E0B',  // Yellow 60-79
    low: '#EF4444',  // Red < 60
    neutral: '#94A3B8'
};

const getColor = (accuracy: any) => {
    const score = Number(accuracy);
    if (isNaN(score)) return COLORS.neutral;
    if (score >= 80) return COLORS.high;
    if (score >= 60) return COLORS.mid;
    return COLORS.low;
};

// Helper to ensure array
const toArray = (input: any): any[] => {
    if (!input) return [];
    if (Array.isArray(input)) return input;
    // Handle legacy object format { "Reading": 10, ... } if necessary, or just return empty
    // Ideally we assume if it's not array, it's unusable for our new charts
    return [];
};

function ReportContent() {
    const searchParams = useSearchParams();
    const studentId = searchParams.get('student_id');
    const fromWeek = searchParams.get('from');
    const toWeek = searchParams.get('to');
    const book = searchParams.get('book');

    const [data, setData] = useState<SummaryData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (!studentId) return;

        const fetchData = async () => {
            try {
                const res = await fetch(`/api/summary?student_id=${studentId}&from=${fromWeek}&to=${toWeek}&book=${book || ''}`);
                const json = await res.json();

                if (!res.ok) {
                    throw new Error(json.error || `Server Error (${res.status})`);
                }

                setData(json);
            } catch (err: any) {
                console.error(err);
                setError(err.message || '데이터를 불러오는데 실패했습니다.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [studentId, fromWeek, toWeek]);

    const getInsight = () => {
        if (!data) return '';

        const qTypes = toArray(data.by_q_type);
        // Safe sort
        const sortedTypes = [...qTypes].sort((a, b) => (Number(a.accuracy) || 0) - (Number(b.accuracy) || 0));
        const weakType1 = sortedTypes[0];
        const weakType2 = sortedTypes[1];

        const groups = toArray(data.by_passage_group);
        const lit = groups.find(p => p.passage_group && p.passage_group.includes('문학')) || { accuracy: 0 };
        const nonLit = groups.find(p => p.passage_group && (p.passage_group.includes('독서') || p.passage_group.includes('비문학'))) || { accuracy: 0 };

        const litAcc = Number(lit.accuracy) || 0;
        const nonLitAcc = Number(nonLit.accuracy) || 0;
        const comparison = litAcc > nonLitAcc ? '문학이 비문학보다 강점입니다.' : '비문학이 문학보다 강점입니다.';

        if (!weakType1) return '아직 데이터가 충분하지 않습니다.';

        return `
            <span class="font-bold text-yellow-300">${studentId}</span> 학생은 
            <span class="font-bold text-yellow-300">Week ${fromWeek}~${toWeek}</span> 동안<br/>
            <span class="font-bold text-red-300">'${weakType1.q_type || '알 수 없음'}'</span> (${weakType1.accuracy || 0}%) 유형이 가장 취약합니다.<br/>
            ${weakType2 ? `다음으로 <span class='text-red-200'>'${weakType2.q_type || '알 수 없음'}'</span> (${weakType2.accuracy || 0}%) 유형 보완이 필요하며,` : ''}
            <br/>${comparison}
        `;
    };

    if (loading) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
        </div>
    );

    if (error) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white p-6 rounded-2xl shadow-xl max-w-md w-full text-center">
                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-slate-800 mb-2">데이터를 불러오지 못했습니다</h2>
                <p className="text-slate-500 mb-6">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition-colors"
                >
                    다시 시도하기
                </button>
            </div>
        </div>
    );

    if (!data) return null;

    // Safe Accessors
    const overall = data.overall || { accuracy: 0, reading_accuracy: 0, vocab_accuracy: 0 };
    const qTypes = toArray(data.by_q_type);
    const passageGroups = toArray(data.by_passage_group);
    const weeks = toArray(data.by_week);
    const wrongList = toArray(data.wrong_list);

    return (
        <main className="min-h-screen bg-slate-50 p-4 md:p-8 font-nanum">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header with Debug Info */}
                <header className="flex flex-col gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <button onClick={() => window.location.href = '/'} className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
                                <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                            </button>
                            <div>
                                <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                                    {studentId} <span className="text-slate-300">|</span> 학습 진단 리포트
                                </h1>
                                <p className="text-sm font-bold text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full w-fit mt-1">
                                    WEEK {fromWeek}-{toWeek} <span className="text-slate-400 ml-1">종합 성취도 분석</span> • {book}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* DEBUG PANEL */}
                    <details className="w-full text-xs text-slate-400 bg-slate-50 p-2 rounded border border-slate-200">
                        <summary className="cursor-pointer font-bold hover:text-indigo-500">🛠️ Debug Info (클릭)</summary>
                        <div className="mt-2 space-y-1 font-mono break-all whitespace-pre-wrap">
                            <p><strong>Student:</strong> {studentId}</p>
                            <p><strong>Book Param:</strong> {book}</p>
                            <p><strong>API Request:</strong> /api/summary?student_id={studentId}&from={fromWeek}&to={toWeek}&book={book}</p>
                            <p><strong>Data Loaded:</strong> {data ? 'YES' : 'NO'}</p>
                            <p><strong>Wrong Count:</strong> {data?.total_wrong}</p>
                            <div className="bg-slate-100 p-2 mt-1 rounded text-[10px] leading-tight text-slate-600">
                                <strong>Backend Debug Details:</strong><br />
                                {JSON.stringify(data?.debug || {}, null, 2)}
                            </div>
                        </div>
                    </details>
                </header>

                {/* KPI Cards (Section A) */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <KPICard
                        label="독해 정답률"
                        value={`${overall.reading_accuracy ?? 0}%`}
                        icon={BookOpen}
                        color="text-blue-600"
                        bg="bg-blue-50"
                        delay={1}
                    />
                    <KPICard
                        label="어휘 정답률"
                        value={`${overall.vocab_accuracy ?? 0}%`}
                        icon={CheckCircle}
                        color="text-green-600"
                        bg="bg-green-50"
                        delay={2}
                    />
                    <KPICard
                        label="취약 유형 1위"
                        value={qTypes[0]?.q_type || '-'}
                        subValue={qTypes[0] ? `${qTypes[0].accuracy}%` : ''}
                        icon={AlertTriangle}
                        color="text-red-500"
                        bg="bg-red-50"
                        delay={3}
                    />
                    <KPICard
                        label="취약 유형 2위"
                        value={qTypes[1]?.q_type || '-'}
                        subValue={qTypes[1] ? `${qTypes[1].accuracy}%` : ''}
                        icon={Target}
                        color="text-amber-500"
                        bg="bg-amber-50"
                        delay={4}
                    />
                </div>

                {/* AI Insight */}
                <div className="bg-gradient-to-r from-slate-800 to-indigo-900 rounded-3xl p-8 shadow-xl text-white relative overflow-hidden group hover:scale-[1.01] transition-transform duration-500">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none group-hover:bg-white/10 transition-colors"></div>
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-indigo-200">
                        <span className="animate-pulse">✨</span> AI 분석 인사이트
                    </h2>
                    <p
                        className="text-lg md:text-xl leading-relaxed font-medium text-slate-100"
                        dangerouslySetInnerHTML={{ __html: getInsight() }}
                    />
                </div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                    {/* Skill Weakness Chart (Section B) */}
                    <ChartCard title="유형별 성취도" subtitle="정답률 80% 이상 목표">
                        <div className="h-64">
                            {isClient && (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={qTypes} layout="vertical" margin={{ left: 10, right: 10 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                        <XAxis type="number" domain={[0, 100]} hide />
                                        <YAxis
                                            type="category"
                                            dataKey="q_type"
                                            width={80}
                                            tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                                        />
                                        <Tooltip
                                            cursor={{ fill: '#f8fafc' }}
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            formatter={(val: any) => [`${val}%`, '정답률']}
                                        />
                                        <Bar dataKey="accuracy" radius={[0, 4, 4, 0]} barSize={16}>
                                            {qTypes.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={getColor(entry?.accuracy)} />
                                            ))}
                                        </Bar>
                                        <ReferenceLine x={80} stroke="#10B981" strokeDasharray="3 3" label={{ value: '목표', fill: '#10B981', fontSize: 10 }} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </ChartCard>

                    {/* Lit vs Non-Lit (Section C) */}
                    <ChartCard title="영역별 성취도 비교" subtitle="문학 vs 비문학(독서)">
                        <div className="h-64 flex flex-col justify-center gap-6 px-4">
                            {/* Custom Visualization for simple comparison */}
                            {passageGroups
                                .filter(p => !['Unknown', ''].includes(p.passage_group))
                                .map((item, i) => (
                                    <div key={i}>
                                        <div className="flex justify-between text-sm font-bold text-slate-700 mb-1">
                                            <span>{item.passage_group}</span>
                                            <span className={`${(item.accuracy || 0) >= 80 ? 'text-green-600' : 'text-red-500'
                                                }`}>{item.accuracy || 0}%</span>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all duration-1000 ease-out"
                                                style={{
                                                    width: `${item.accuracy || 0}%`,
                                                    backgroundColor: getColor(item.accuracy)
                                                }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </ChartCard>

                    {/* Weekly Progress (Section D) */}
                    <ChartCard title="주차별 성장 추이" subtitle="종합 정답률 변화">
                        <div className="h-64">
                            {isClient && (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={weeks} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis
                                            dataKey="week"
                                            tick={{ fontSize: 12 }}
                                            tickFormatter={(value) => String(value).replace('주차', 'W')}
                                        />
                                        <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            formatter={(val: any) => [`${val}%`, '정답률']}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="accuracy"
                                            stroke="#4F46E5"
                                            strokeWidth={3}
                                            dot={{ r: 4, fill: '#4F46E5', strokeWidth: 2, stroke: '#fff' }}
                                            activeDot={{ r: 6 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </ChartCard>
                </div>

                {/* Detail Table (Section E) */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-6 border-b border-slate-100">
                        <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-indigo-500" />
                            상세 오답 내역
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-slate-500">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                                <tr>
                                    <th className="px-6 py-4 rounded-tl-lg">일자</th>
                                    <th className="px-6 py-4">주차/회차</th>
                                    <th className="px-6 py-4">문항</th>
                                    <th className="px-6 py-4">영역</th>
                                    <th className="px-6 py-4">유형</th>
                                    <th className="px-6 py-4 rounded-tr-lg">지문 갈래</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {wrongList.map((item, i) => (
                                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 text-slate-400 font-mono text-xs">
                                            {item.date ? String(item.date).substring(0, 10) : '-'}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-900">
                                            {item.week}주차-{item.session}회
                                        </td>
                                        <td className="px-6 py-4 font-bold text-red-500">
                                            {item.slot}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${item.area === 'Reading' || item.area === '독해' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                                                {item.area}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">{item.type}</td>
                                        <td className="px-6 py-4 text-slate-600">{item.passage}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {wrongList.length === 0 && (
                        <div className="p-12 text-center text-slate-400">
                            오답 내역이 없습니다. (완벽합니다! 🎉)
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}

interface KPICardProps {
    label: string;
    value: string | number;
    subValue?: string;
    icon: React.ElementType;
    color: string;
    bg: string;
    delay: number;
}

function KPICard({ label, value, subValue, icon: Icon, color, bg, delay }: KPICardProps) {
    return (
        <div
            className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-5 hover:shadow-lg transition-all hover:-translate-y-1 group"
            style={{ animationDelay: `${delay * 100}ms` }}
        >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${bg} ${color} group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                <Icon className="w-7 h-7" />
            </div>
            <div>
                <p className="text-sm font-semibold text-slate-400 mb-0.5">{label}</p>
                <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-extrabold text-slate-800 tracking-tight">{value}</p>
                    {subValue && <span className="text-sm font-bold text-red-500">{subValue}</span>}
                </div>
            </div>
        </div>
    );
}

interface ChartCardProps {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
}

function ChartCard({ title, subtitle, children }: ChartCardProps) {
    return (
        <div className="bg-white p-7 rounded-3xl shadow-sm border border-slate-100 h-full hover:shadow-md transition-shadow">
            <div className="mb-8">
                <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2.5">
                    <span className="w-1.5 h-6 bg-indigo-500 rounded-full inline-block"></span>
                    {title}
                </h3>
                {subtitle && <p className="text-slate-400 text-sm ml-4 mt-1">{subtitle}</p>}
            </div>
            {children}
        </div>
    );
}

export default function ReportPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ReportContent />
        </Suspense>
    );
}
