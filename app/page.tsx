'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, ArrowRight, ChevronDown, FileText, CheckCircle2 } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [studentId, setStudentId] = useState('');

  // Mode State
  const [mode, setMode] = useState<'report' | 'input'>('report');

  // Report Mode State
  const [fromWeek, setFromWeek] = useState('1');
  const [toWeek, setToWeek] = useState('8');

  // Input Mode State
  const [week, setWeek] = useState('1');
  const [session, setSession] = useState('1');

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId.trim()) {
      alert('학생 ID를 입력해주세요.');
      return;
    }

    if (mode === 'report') {
      router.push(`/report?student_id=${studentId}&from=${fromWeek}&to=${toWeek}`);
    } else {
      router.push(`/input?student_id=${studentId}&week=${week}&session=${session}`);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-100 via-slate-50 to-white">
      <div className="w-full max-w-md">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/50 relative overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none"></div>

          <div className="relative z-10">
            {/* Logo & Title */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-tr from-indigo-500 to-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-500/30 transform rotate-3 hover:rotate-6 transition-transform duration-300">
                <BookOpen className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-2">
                TOV 국어 독해 진단
              </h1>
              <p className="text-slate-500 font-medium">학생별 맞춤형 취약점 분석 매니저</p>
            </div>

            {/* Mode Tabs */}
            <div className="flex p-1 bg-slate-100 rounded-2xl mb-8 relative">
              <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-xl shadow-sm transition-all duration-300 ease-spring ${mode === 'report' ? 'left-1' : 'left-[calc(50%+4px)]'}`}></div>
              <button
                type="button"
                onClick={() => setMode('report')}
                className={`flex-1 relative z-10 py-2.5 text-sm font-bold transition-colors duration-300 flex items-center justify-center gap-2 ${mode === 'report' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <FileText className="w-4 h-4" />
                분석 리포트
              </button>
              <button
                type="button"
                onClick={() => setMode('input')}
                className={`flex-1 relative z-10 py-2.5 text-sm font-bold transition-colors duration-300 flex items-center justify-center gap-2 ${mode === 'input' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <CheckCircle2 className="w-4 h-4" />
                오답 입력
              </button>
            </div>

            <form onSubmit={handleStart} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">학생 ID</label>
                <div className="relative group">
                  <input
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="예: STU001"
                    className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-semibold text-slate-700 placeholder:text-slate-300 group-hover:bg-white"
                  />
                </div>
              </div>

              {mode === 'report' ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">시작 주차</label>
                    <div className="relative">
                      <select
                        value={fromWeek}
                        onChange={(e) => setFromWeek(e.target.value)}
                        className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-semibold text-slate-700 appearance-none cursor-pointer hover:bg-white"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(w => (
                          <option key={w} value={w}>{w}주차</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">종료 주차</label>
                    <div className="relative">
                      <select
                        value={toWeek}
                        onChange={(e) => setToWeek(e.target.value)}
                        className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-semibold text-slate-700 appearance-none cursor-pointer hover:bg-white"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(w => (
                          <option key={w} value={w}>{w}주차</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">주차 (Week)</label>
                    <div className="relative">
                      <select
                        value={week}
                        onChange={(e) => setWeek(e.target.value)}
                        className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-semibold text-slate-700 appearance-none cursor-pointer hover:bg-white"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(w => (
                          <option key={w} value={w}>{w}주차</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">회차 (Session)</label>
                    <div className="relative">
                      <select
                        value={session}
                        onChange={(e) => setSession(e.target.value)}
                        className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-semibold text-slate-700 appearance-none cursor-pointer hover:bg-white"
                      >
                        {[1, 2, 3, 4, 5].map(s => (
                          <option key={s} value={s}>{s}회차</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-indigo-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
              >
                {mode === 'report' ? '분석 리포트 생성' : '오답 입력 시작'}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </form>
          </div>
        </div>

        <p className="text-center text-slate-400 mt-8 text-sm font-medium">
          © 2026 TOV Education. All rights reserved.
        </p>
      </div>
    </main>
  );
}
