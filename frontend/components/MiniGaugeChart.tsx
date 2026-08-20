import React, { useEffect, useState } from "react";

export default function MiniGaugeChart({ score, grade, name }: { score: number, grade?: string, name?: string }) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    // Trigger animation on mount
    const timer = setTimeout(() => {
      setAnimatedScore(score);
    }, 50);
    return () => clearTimeout(timer);
  }, [score]);



  return (
    <div className="flex flex-col items-center justify-center w-full">
      {name && (
        <div className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-2 truncate max-w-full text-center px-1 border-b border-slate-100 dark:border-slate-800 pb-1.5 w-full">
          {name}
        </div>
      )}
      <div className="relative flex flex-col items-center justify-center w-[120px] h-[70px] select-none">
        <svg width="105" height="65" viewBox="0 0 160 95" className="overflow-visible">
          <defs>
            <linearGradient id="mini-gauge-rainbow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#EF4444" />
              <stop offset="50%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>
          </defs>
          <path
            d="M 20 85 A 60 60 0 0 1 140 85"
            fill="none"
            stroke="#E2E8F0"
            strokeWidth="12"
            strokeLinecap="round"
          />
          <path
            d="M 20 85 A 60 60 0 0 1 140 85"
            fill="none"
            stroke="url(#mini-gauge-rainbow)"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray="188.5"
            strokeDashoffset={188.5 - (188.5 * (Math.max(0, Math.min(100, animatedScore)) / 100))}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute top-[35px] flex flex-col items-center">
          <span className="text-xl font-black text-slate-800 dark:text-slate-100 leading-none">
            {score.toFixed(1)}
          </span>
          {grade && (
            <span className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
              GRADE {grade}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
