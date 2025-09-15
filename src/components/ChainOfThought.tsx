import { useState } from 'react';

interface ChainOfThoughtProps {
  content?: string
}

export function ChainOfThought({ content }: ChainOfThoughtProps) {
  const [open, setOpen] = useState(true);

  return (
    <div className="mt-8 border border-blue-100 rounded-2xl shadow-lg bg-blue-50 overflow-hidden">
      <button
        type="button"
        className="reasoning-header flex items-center justify-between w-full px-6 py-4 bg-blue-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 group"
        onClick={() => setOpen(!open)}
      >
        <span className="flex items-center gap-2">
          <svg className="w-7 h-7 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01" />
          </svg>
          <span className="text-base font-semibold tracking-wide text-blue-600">Chain of Thought</span>
        </span>
        <svg
          className={`w-7 h-7 text-blue-500 transform transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        className={`transition-all duration-300 ${open ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'} bg-white`}
        style={{overflow: open ? 'auto' : 'hidden'}}
      >
        <div className="px-6 py-4 space-y-4 max-h-[300px] overflow-y-auto animate-fade-in">
          {content && (
            <div className="p-4 bg-gradient-to-br from-black-50 to-blue-50 border border-blue-100 rounded-xl shadow-inner text-base text-gray-800 text-sm italic whitespace-pre-wrap">
              {content}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
