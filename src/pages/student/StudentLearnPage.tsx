import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, CheckCircle2, ArrowRight, Code2, ChevronRight, Lock } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';

export const StudentLearnPage: React.FC = () => {
  const [activeUnit, setActiveUnit] = useState('loops');

  const curriculum = [
    {
      course: 'Python Programming Fundamentals',
      modules: [
        {
          id: 'mod_1',
          title: 'Module 1: Programming Fundamentals',
          units: [
            { id: 'vars', title: 'Variables & Scope', completed: true },
            { id: 'datatypes', title: 'Data Types & Mutability', completed: true },
            { id: 'io', title: 'Standard Input / Output', completed: true },
            { id: 'operators', title: 'Arithmetic & Logical Operators', completed: true },
          ]
        },
        {
          id: 'mod_2',
          title: 'Module 2: Control Flow & Loops',
          units: [
            { id: 'conditions', title: 'Conditional Statements', completed: true },
            { id: 'loops', title: 'While & For Loops', completed: false, active: true },
            { id: 'nested', title: 'Nested Loops & Iteration', completed: false },
            { id: 'patterns', title: 'Pattern Generation', completed: false },
          ]
        }
      ]
    }
  ];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-150">
      <div>
        <h1 className="text-2xl font-black text-zinc-950 tracking-tight">Curriculum & Learning</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Structured pedagogical progression from fundamentals to algorithmic mastery
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Course Navigation Sidebar */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-zinc-200 p-4 shadow-sm space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Course Syllabus
          </div>

          <div className="space-y-4">
            {curriculum[0].modules.map((m) => (
              <div key={m.id} className="space-y-1.5">
                <h4 className="text-xs font-bold text-zinc-900 leading-tight">{m.title}</h4>
                <div className="space-y-1 pl-2 border-l border-zinc-200">
                  {m.units.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => setActiveUnit(u.id)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${
                        activeUnit === u.id
                          ? 'bg-red-50 text-[#EE3124] font-bold'
                          : u.completed
                          ? 'text-zinc-600 hover:bg-zinc-50'
                          : 'text-zinc-400 hover:bg-zinc-50'
                      }`}
                    >
                      <span className="truncate">{u.title}</span>
                      {u.completed ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : activeUnit === u.id ? (
                        <ChevronRight className="w-3.5 h-3.5 text-[#EE3124] shrink-0" />
                      ) : null}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Learning Unit Content */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-zinc-200 p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#EE3124]">
                Module 2 • Lesson 2
              </span>
              <h2 className="text-2xl font-black text-zinc-950 mt-1">While & For Loops in Python</h2>
            </div>
            <Badge variant="red" size="sm">+25 XP</Badge>
          </div>

          <div className="prose prose-zinc text-xs text-zinc-700 space-y-4 leading-relaxed max-w-none">
            <p>
              In programming, loops allow you to execute a specific block of instructions repeatedly until a termination condition is met. Python offers two fundamental loop constructs:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
              <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200">
                <h4 className="text-xs font-bold text-zinc-900 mb-1">1. Count-Controlled (<code className="text-[#EE3124]">for</code> loop)</h4>
                <p className="text-[11px] text-zinc-500">
                  Used when the number of iterations is known in advance, iterating over a sequence such as <code className="text-zinc-700">range()</code>.
                </p>
              </div>
              <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200">
                <h4 className="text-xs font-bold text-zinc-900 mb-1">2. Condition-Controlled (<code className="text-[#EE3124]">while</code> loop)</h4>
                <p className="text-[11px] text-zinc-500">
                  Used when the execution continues as long as a boolean assertion evaluates to true.
                </p>
              </div>
            </div>

            <h3 className="text-sm font-bold text-zinc-900 mt-6 mb-2">Code Example: Nested Patterns</h3>
            <pre className="p-4 bg-zinc-900 text-zinc-100 font-mono text-xs rounded-xl overflow-x-auto">
{`# Printing a right-angled triangle pattern
n = 5
for i in range(1, n + 1):
    for j in range(1, i + 1):
        print(j, end=" ")
    print()
`}
            </pre>

            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs my-4">
              <strong>Pedagogical Note:</strong> Always verify the boundary values of your inner loop. An off-by-one error in nested loops is the most common cause of test case failures.
            </div>
          </div>

          {/* Bottom Call to Practice */}
          <div className="pt-6 border-t border-zinc-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-zinc-900">Required Practice Problem</p>
              <p className="text-[11px] text-zinc-500">Solve this problem in the Monaco IDE to complete this unit</p>
            </div>
            <Link
              to="/student/practice"
              className="px-6 py-2.5 bg-[#EE3124] hover:bg-[#C91F13] text-white text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center gap-2 w-fit"
            >
              Continue to Practice <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
