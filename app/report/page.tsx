'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import {
    ChevronLeft, AlertTriangle, Target, BookOpen,
    TrendingDown, FileText
} from 'lucide-react';

type SummaryData = {
    student_id: string;
    total_questions: number;
    wrong_count: number;
    wrong_rate: number;
    by_q_type: { q_type: string; count: number }[];
    by_area: { area: string; count: number }[];
    by_passage: { passage_group: string; count: number }[];
    by_week: { week: number; count: number }[];
    wrong_list: {
        week: number;
        session: number;
        q_slot: string;
        q_type: string;
        area: string;
        passage_group: string;
    }[];
};

const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'];

function ReportContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const studentId = searchParams.get('student_id');
    const fromWeek = searchParams.get('from');
    const toWeek = searchParams.get('to');

    const [data, setData] = useState<SummaryData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!studentId) return;

        const fetchData = async () => {
            try {
                const res = await fetch(`/api/summary?student_id=${studentId}&from=${fromWeek}&to=${toWeek}`);
                const json = await res.json();

                if (!res.ok) {
                    throw new Error(json.error || `Server Error (${res.status})`);
                }

                if (json.error) {
                    throw new Error(json.error);
                }

                setData(json);
            } catch (err: any) {
                setError(err.message || '알 수 없는 오류가 발생했습니다.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [studentId, fromWeek, toWeek]);

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-indigo-600 mb-4"></div>
                <p className="text-slate-500 font-medium animate-pulse">데이터 분석 중...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
                <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center space-y-6">
                    <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto">
                        <AlertTriangle className="w-10 h-10 text-red-500" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">오류가 발생했습니다</h3>
                        <p className="text-slate-500 break-keep">{error}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl text-xs text-slate-400 font-mono text-left overflow-auto max-h-32 mb-4">
                        Debug Info:<br />
                        ID: {studentId}<br />
                        Week: {fromWeek}~{toWeek}
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-transform active:scale-95"
                    >
                        다시 시도하기
                    </button>
                    <button
                        onClick={() => router.push('/')}
                        className="w-full py-3 text-slate-500 font-medium hover:text-slate-800 transition-colors"
                    >
                        홈으로 돌아가기
                    </button>
                </div>
            </div>
        );
    }

    if (!data) return null;

    // Helper for AI Insight text
    const getInsight = () => {
        const topType = data.by_q_type[0];
        const topArea = data.by_area[0];
        const topPassage = data.by_passage[0];

        const sentences = [];
        if (topType) sentences.push(`주로 <span class="font-bold text-yellow-200">'${topType.q_type}'</span> 유형에서 오답이 빈번합니다.`);
        if (topArea) sentences.push(`<span class="font-bold text-yellow-200">'${topArea.area}'</span> 영역에 대한 집중적인 학습이 필요합니다.`);
        if (topPassage) sentences.push(`특히 <span class="font-bold text-yellow-200">'${topPassage.passage_group}'</span> 지문 독해 시 더욱 주의가 필요합니다.`);

        return sentences.join(' ');
    };

    return (
        <main className="min-h-screen bg-slate-50/50 p-4 md:p-8 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-50 via-slate-50 to-slate-100">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/80 backdrop-blur-md p-6 rounded-3xl shadow-sm border border-slate-100 top-0 sticky z-50">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="p-3 hover:bg-slate-100 rounded-2xl transition-all hover:scale-105 active:scale-95 group"
                        >
                            <ChevronLeft className="w-6 h-6 text-slate-500 group-hover:text-slate-800" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">
                                {data.student_id} <span className="text-slate-300 font-light mx-1">|</span> 진단 리포트
                            </h1>
                            <p className="text-slate-500 text-sm mt-1 flex items-center gap-2 font-medium">
                                <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-xs font-bold">WEEK {fromWeek}-{toWeek}</span>
                                종합 분석 결과
                            </p>
                        </div>
                    </div>
                </header>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <KPICard
                        label="총 풀이 문항"
                        value={data.total_questions}
                        icon={BookOpen}
                        color="text-blue-600"
                        bg="bg-blue-50"
                        delay={1}
                    />
                    <KPICard
                        label="총 오답 수"
                        value={data.wrong_count}
                        icon={AlertTriangle}
                        color="text-red-500"
                        bg="bg-red-50"
                        delay={2}
                    />
                    <KPICard
                        label="오답률"
                        value={`${(data.wrong_rate * 100).toFixed(1)}%`}
                        icon={TrendingDown}
                        color="text-emerald-500"
                        bg="bg-emerald-50"
                        delay={3}
                    />
                    <KPICard
                        label="취약 유형"
                        value={data.by_q_type[0]?.q_type || '-'}
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
                        dangerouslySetInnerHTML={{ __html: getInsight() || "데이터가 충분하지 않아 분석할 수 없습니다." }}
                    />
                </div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Weak Type Chart */}
                    <ChartCard title="유형별 오답 분포" subtitle="가장 많이 틀린 문제 유형">
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.by_q_type.slice(0, 5)} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                    <XAxis type="number" hide />
                                    <YAxis
                                        type="category"
                                        dataKey="q_type"
                                        width={100}
                                        tick={{ fontSize: 12, fill: '#64748b' }}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#f8fafc' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        formatter={(val: any) => [`${val}개`, '오답']}
                                    />
                                    <Bar dataKey="count" fill="#3B82F6" radius={[0, 4, 4, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </ChartCard>

                    {/* Area Chart */}
                    <ChartCard title="영역별 취약도" subtitle="독해 vs 어휘 오답 비율">
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data.by_area}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="count"
                                    >
                                        {data.by_area.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </ChartCard>

                    {/* Weekly Trend */}
                    <ChartCard title="주차별 오답 추이" subtitle="오답 수 변화 그래프">
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={data.by_week}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="week" tickFormatter={w => `${w}주`} tick={{ fontSize: 12 }} />
                                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        formatter={(val: any) => [`${val}개`, '오답']}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="count"
                                        stroke="#8B5CF6"
                                        strokeWidth={3}
                                        dot={{ r: 4, fill: '#8B5CF6', strokeWidth: 2, stroke: '#fff' }}
                                        activeDot={{ r: 6 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </ChartCard>
                </div>

                {/* Wrong Answer Table */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-6 border-b border-slate-100">
                        <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-slate-400" />
                            상세 오답 내역
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 font-medium">
                                <tr>
                                    <th className="px-6 py-4">주차/회차</th>
                                    <th className="px-6 py-4">문항</th>
                                    <th className="px-6 py-4">영역</th>
                                    <th className="px-6 py-4">유형</th>
                                    <th className="px-6 py-4">지문 갈래</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {data.wrong_list.map((item, i) => (
                                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-900">
                                            {item.week}주차-{item.session}회
                                        </td>
                                        <td className="px-6 py-4 font-bold text-red-500">
                                            {item.q_slot}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${item.area === '독해' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                                                {item.area}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">{item.q_type}</td>
                                        <td className="px-6 py-4 text-slate-600">{item.passage_group}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {data.wrong_list.length === 0 && (
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
    icon: React.ElementType;
    color: string;
    bg: string;
    delay: number;
}

function KPICard({ label, value, icon: Icon, color, bg, delay }: KPICardProps) {
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
                <p className="text-2xl font-extrabold text-slate-800 tracking-tight">{value}</p>
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
        <Suspense fallback={<div className="p-10 text-center">Loading...</div>}>
            <ReportContent />
        </Suspense>
    );
}
