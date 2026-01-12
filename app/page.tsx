
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [studentId, setStudentId] = useState('');
  const [fromWeek, setFromWeek] = useState('1');
  const [toWeek, setToWeek] = useState('8');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId.trim()) {
      alert('학생 ID를 입력해주세요.');
      return;
    }
    setIsLoading(true);
    router.push(`/report?student_id=${studentId}&from=${fromWeek}&to=${toWeek}`);
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-200/30 rounded-full blur-3xl" />
      </div>

      <div className="bg-white/80 backdrop-blur-xl p-8 md:p-12 rounded-3xl shadow-2xl w-full max-w-lg border border-white/50 relative z-10 transition-all hover:shadow-blue-200/50 hover:scale-[1.005]">
        <div className="text-center mb-10">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/30 transform -rotate-3 hover:rotate-0 transition-transform duration-300">
            <BookOpen className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight mb-2">TOV 국어 독해 진단</h1>
          <p className="text-slate-500 font-medium">학생별 맞춤형 취약점 분석 매니저</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700 ml-1">학생 ID</label>
            <div className="relative group">
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="STU001"
                className="w-full px-5 py-4 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium text-lg placeholder:text-slate-400"
                autoFocus
              />
              <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-slate-200 pointer-events-none group-focus-within:ring-2 group-focus-within:ring-blue-500 transition-all" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700 ml-1">시작 주차</label>
              <div className="relative">
                <select
                  value={fromWeek}
                  onChange={(e) => setFromWeek(e.target.value)}
                  className="w-full px-5 py-4 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all appearance-none font-medium cursor-pointer"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((w) => (
                    <option key={w} value={w}>{w}주차</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                  <ChevronDownIcon />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700 ml-1">종료 주차</label>
              <div className="relative">
                <select
                  value={toWeek}
                  onChange={(e) => setToWeek(e.target.value)}
                  className="w-full px-5 py-4 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all appearance-none font-medium cursor-pointer"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((w) => (
                    <option key={w} value={w}>{w}주차</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                  <ChevronDownIcon />
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-500/30 disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-[0.98] flex items-center justify-center gap-2 group"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>데이터 분석 중...</span>
              </>
            ) : (
              <>
                <span>분석 리포트 생성</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-10 pt-6 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400 font-medium">© 2026 TOV Education. All rights reserved.</p>
        </div>
      </div>
    </main>
  );
}

const ChevronDownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6" />
  </svg>
);
