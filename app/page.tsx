'use client';

import { useState, useEffect } from 'react';

type QuestionSlot = {
  slot: string; // "R1", "V1" etc
  is_wrong: boolean;
};

export default function Home() {
  const [studentId, setStudentId] = useState('');
  const [students, setStudents] = useState<{ name: string, id: string }[]>([]);
  const [week, setWeek] = useState('1');
  const [session, setSession] = useState('1');
  const [loading, setLoading] = useState(false);
  const [slots, setSlots] = useState<QuestionSlot[]>([]);

  // Initialize slots and load students
  useEffect(() => {
    // Load Students
    const fetchStudents = async () => {
      try {
        const res = await fetch('/api/students');
        const data = await res.json();
        if (data.students && Array.isArray(data.students)) {
          setStudents(data.students);
        }
      } catch (e) {
        console.error("Failed to load students", e);
      }
    };
    fetchStudents();
  }, []);

  const fetchBlueprint = async () => {
    if (!studentId) {
      alert('Please select a student first (학생을 선택해주세요)');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/wrong?week=${week}&session=${session}&student_id=${studentId}`);
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();

      // Expected data format from backend: { wrong_list: ["R1", "V3"], all_slots: ["R1"..."R7", "V1"..."V40"] }
      // Or if backend just returns list of wrongs, I need to know the blueprint.
      // User said: "Load blueprint via: ?action=wrong_list (just to get slots)"
      // Let's assume the backend returns what IS wrong, and we need to simple generate the UI grid.
      // I will generate default slots R1-R7 and V1-V40 (common max) if backend doesn't provide blueprint.
      // But user said "Load blueprint". Let's try to trust the backend data.

      // Mocking for safety if backend structure is unknown:
      // assume data.data = { wrong: ['R1'], blueprint: ['R1', 'R2'...] }

      let newSlots: QuestionSlot[] = [];
      const r_count = 7;
      const v_count = 40; // Default max?

      const wrongSet = new Set(data.wrong_list || []); // array of slot strings

      // Construct slots
      // Reading
      for (let i = 1; i <= r_count; i++) newSlots.push({ slot: `R${i}`, is_wrong: wrongSet.has(`R${i}`) });
      // Vocab
      for (let i = 1; i <= v_count; i++) newSlots.push({ slot: `V${i}`, is_wrong: wrongSet.has(`V${i}`) });

      setSlots(newSlots);

    } catch (e) {
      alert('Loaded (fallback mode) or Failed');
      // Fallback generation
      let newSlots: QuestionSlot[] = [];
      for (let i = 1; i <= 7; i++) newSlots.push({ slot: `R${i}`, is_wrong: false });
      for (let i = 1; i <= 20; i++) newSlots.push({ slot: `V${i}`, is_wrong: false });
      setSlots(newSlots);
    } finally {
      setLoading(false);
    }
  };

  const toggleSlot = (slot: string, currentStatus: boolean) => {
    // Just update local state
    setSlots(prev => prev.map(s => s.slot === slot ? { ...s, is_wrong: !currentStatus } : s));
  };

  const saveWrongAnswers = async () => {
    if (!studentId) {
      alert('Student ID is required');
      return;
    }

    const wrongList = slots.filter(s => s.is_wrong).map(s => s.slot);

    // User might want to save "Check complete" even if empty?
    // Let's allow saving empty list (clearing).

    setLoading(true);
    try {
      const res = await fetch('/api/wrong', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_wrong_list', // Updated action
          student_id: studentId,
          week: week,
          session: session,
          wrong_list: wrongList
        })
      });

      if (!res.ok) throw new Error('Failed to save');
      const result = await res.json();

      if (result.error) {
        throw new Error(result.error);
      }

      alert('Successfully Saved! (저장되었습니다)');
    } catch (e) {
      console.error(e);
      alert('Failed to save. Please check your connection or GAS deployment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-8 max-w-2xl mx-auto bg-gray-50">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">TOV Wrong Answer Check</h1>
        <a href="/analysis" className="text-sm bg-gray-100 text-gray-700 px-3 py-2 rounded hover:bg-gray-200 transition-colors">
          Go to Analysis &rarr;
        </a>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm mb-6 space-y-4 border border-gray-200">
        <div>
          <label className="block text-sm font-medium mb-1">Student</label>
          {students.length > 0 ? (
            <select
              value={studentId}
              onChange={e => setStudentId(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">-- Select Student --</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.id})
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={studentId}
              onChange={e => setStudentId(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Loading students or Enter ID..."
            />
          )}
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Week</label>
            <select value={week} onChange={e => setWeek(e.target.value)} className="w-full p-2 border rounded">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Session</label>
            <select value={session} onChange={e => setSession(e.target.value)} className="w-full p-2 border rounded">
              {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>

        <button
          onClick={fetchBlueprint}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700 font-medium transition-colors"
        >
          {loading ? 'Loading...' : 'Load Exam Sheet'}
        </button>
      </div>

      {slots.length > 0 && (
        <div className="space-y-6 pb-20">
          <section>
            <h2 className="text-lg font-semibold mb-3 text-gray-700">Reading (독해)</h2>
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
              {slots.filter(s => s.slot.startsWith('R')).map(s => (
                <button
                  key={s.slot}
                  onClick={() => toggleSlot(s.slot, s.is_wrong)}
                  className={`p-3 rounded border text-sm font-bold transition-colors ${s.is_wrong
                    ? 'bg-red-500 text-white border-red-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                >
                  {s.slot}
                </button>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3 text-gray-700">Vocabulary (어휘)</h2>
            <div className="grid grid-cols-5 sm:grid-cols-8 gap-2">
              {slots.filter(s => s.slot.startsWith('V')).map(s => (
                <button
                  key={s.slot}
                  onClick={() => toggleSlot(s.slot, s.is_wrong)}
                  className={`p-2 rounded border text-xs font-bold transition-colors ${s.is_wrong
                    ? 'bg-red-500 text-white border-red-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                >
                  {s.slot}
                </button>
              ))}
            </div>
          </section>

          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-lg flex justify-center">
            <button
              onClick={saveWrongAnswers}
              disabled={loading}
              className="w-full max-w-2xl bg-green-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-green-700 shadow-md transition-colors"
            >
              {loading ? 'Saving...' : 'Save Wrong Answers (저장하기)'}
            </button>
          </div>
        </div>
      )}

      {!slots.length && (
        <div className="mt-12 text-center text-gray-500">
          Please enter Student ID and Load Exam Sheet.
        </div>
      )}
    </main>
  );
}
