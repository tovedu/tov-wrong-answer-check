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
                if (!res.ok) throw new Error('Data fetch failed');
                const json = await res.json();
                if (json.error) throw new Error(json.error);
                setData(json);
            } catch (err) {
                setError('데이터를 불러오는데 실패했습니다.');
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
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600 mb-4"></div>
                <p className="text-slate-500 font-medium animate-pulse">데이터 분석 중...</p>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
                <div className="bg-white p-8 rounded-2xl border border-red-100 shadow-xl max-w-md text-center">
                    <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle className="w-8 h-8 text-red-500" />
                    </div>
                    <h3 className="font-bold text-lg mb-2 text-slate-800">오류 발생</h3>
                    <p className="text-slate-500 mb-6">{error || '데이터가 없습니다.'}</p>
                    <button
                        onClick={() => router.back()}
                        className="px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors font-medium shadow-lg shadow-slate-200"
                    >
                        다시 시도하기
                    </button>
                </div>
            </div>
        );
    }

    // AI Insight Generator
    const getWeaknessText = () => {
        if (data.wrong_count === 0) return "완벽합니다! 오답이 없습니다. 꾸준한 학습 태도를 유지해주세요.";

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
                        icon={FileText}
                        color="text-indigo-600"
                        bg="bg-indigo-50"
                        delay={0}
                    />
                    <KPICard
                        label="오답 문항 수"
                        value={data.wrong_count}
                        icon={AlertTriangle}
                        color="text-rose-600"
                        bg="bg-rose-50"
                        delay={1}
                    />
                    <KPICard
                        label="현재 오답률"
                        value={`${(data.wrong_rate * 100).toFixed(1)}%`}
                        icon={TrendingDown}
                        color="text-orange-600"
                        bg="bg-orange-50"
                        delay={2}
                    />
                    <KPICard
                        label="취약 유형 1위"
                        value={data.by_q_type[0]?.q_type || '-'}
                        icon={Target}
                        color="text-emerald-600"
                        bg="bg-emerald-50"
                        delay={3}
                    />
                </div>

                {/* AI Insight */}
                <div className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white p-8 rounded-3xl shadow-xl shadow-indigo-200/50 relative overflow-hidden transform transition-all hover:scale-[1.01]">
                    <div className="relative z-10">
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2 opacity-90">
                            <span className="bg-white/20 p-1.5 rounded-lg"><BookOpen className="w-5 h-5" /></span>
                            AI 학습 제언
                        </h3>
                        <p
                            className="text-indigo-50 leading-relaxed font-medium text-lg md:text-xl"
                            dangerouslySetInnerHTML={{ __html: getWeaknessText() }}
                        />
                    </div>
                    <div className="absolute top-0 right-0 w-80 h-80 bg-white opacity-5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-60 h-60 bg-blue-500 opacity-10 rounded-full -ml-10 -mb-10 blur-3xl"></div>
                </div>

                {/* Charts Area */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Bar Chart: Wrong by Question Type */}
                    <ChartCard title="유형별 오답 분포" subtitle="가장 많이 틀린 문제 유형">
                        <ResponsiveContainer width="100%" height={320}>
                            <BarChart data={data.by_q_type} layout="vertical" margin={{ left: 40, right: 30, top: 10, bottom: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="q_type"
                                    type="category"
                                    width={100}
                                    tick={{ fontSize: 13, fill: '#64748b', fontWeight: 500 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip
                                    cursor={{ fill: '#f1f5f9' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="count" fill="#6366f1" radius={[0, 6, 6, 0]} barSize={28} name="오답 수">
                                    {data.by_q_type.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index === 0 ? '#4f46e5' : '#818cf8'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>

                    {/* Line Chart: Wrong Trend */}
                    <ChartCard title="주차별 오답 추이" subtitle="주차별 오답 수 변화 흐름">
                        <ResponsiveContainer width="100%" height={320}>
                            <LineChart data={data.by_week} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis
                                    dataKey="week"
                                    tickFormatter={(v) => `${v}주`}
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                    axisLine={false}
                                    tickLine={false}
                                    dy={10}
                                />
                                <YAxis
                                    allowDecimals={false}
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    formatter={(val: any) => [`${val}개`, '오답']}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="count"
                                    stroke="#f43f5e"
                                    strokeWidth={4}
                                    dot={{ r: 4, fill: '#fff', stroke: '#f43f5e', strokeWidth: 2 }}
                                    activeDot={{ r: 7, fill: '#f43f5e', stroke: '#fff', strokeWidth: 2 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </ChartCard>

                    {/* Pie Charts */}
                    <ChartCard title="영역별 취약점" subtitle="독해 영역별 오답 비율">
                        <div className="flex items-center justify-center h-[320px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data.by_area}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={70}
                                        outerRadius={100}
                                        paddingAngle={4}
                                        dataKey="count"
                                        stroke="none"
                                        cornerRadius={4}
                                    >
                                        {data.by_area.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </ChartCard>

                    <ChartCard title="지문 유형별 오답" subtitle="지문 종류에 따른 취약점">
                        <div className="flex items-center justify-center h-[320px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data.by_passage}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={70}
                                        outerRadius={100}
                                        paddingAngle={4}
                                        dataKey="count"
                                        stroke="none"
                                        cornerRadius={4}
                                    >
                                        {data.by_passage.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={['#10b981', '#f59e0b', '#6366f1', '#ec4899'][index % 4]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </ChartCard>
                </div>

                {/* Detailed Table */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                        <div>
                            <h3 className="font-bold text-lg text-slate-800">상세 오답 내역</h3>
                            <p className="text-slate-400 text-sm mt-1">틀린 문제들의 상세 정보를 확인하세요.</p>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-xs">
                                <tr>
                                    <th className="px-6 py-4">주차 / 회차</th>
                                    <th className="px-6 py-4">문항 번호</th>
                                    <th className="px-6 py-4">유형</th>
                                    <th className="px-6 py-4">영역</th>
                                    <th className="px-6 py-4">지문 유형</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {data.wrong_list.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-indigo-50/30 transition-colors group">
                                        <td className="px-6 py-4 font-medium text-slate-700">
                                            <span className="bg-slate-100 px-2 py-1 rounded text-xs font-bold mr-2 text-slate-500">W{item.week}</span>
                                            Session {item.session}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-bold text-rose-500 bg-rose-50 px-3 py-1 rounded-full group-hover:bg-rose-100 transition-colors">
                                                {item.q_slot}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 font-medium">{item.q_type}</td>
                                        <td className="px-6 py-4 text-slate-600">
                                            <span className="inline-flex items-center gap-1.5">
                                                <span className={`w-1.5 h-1.5 rounded-full ${item.area === 'Facts' ? 'bg-blue-400' : 'bg-green-400'}`}></span>
                                                {item.area}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">{item.passage_group}</td>
                                    </tr>
                                ))}
                                {data.wrong_list.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-2">
                                                    <BookOpen className="w-6 h-6 text-slate-300" />
                                                </div>
                                                <p>오답 내역이 없습니다.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </main>
    );
}

export default function ReportPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600 mb-4"></div>
                <p className="text-slate-500 font-medium animate-pulse">페이지 로딩 중...</p>
            </div>
        }>
            <ReportContent />
        </Suspense>
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
