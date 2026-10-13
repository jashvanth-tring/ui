import React from "react";
import { PIPELINE_STAGES } from "./constants";
import type { ProcessingStage } from "./types";

interface Props {
  stage: ProcessingStage;
}

const ProcessingOverlay: React.FC<Props> = ({ stage }) => {
  const activeIdx = PIPELINE_STAGES.findIndex((s) => s.id === stage);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-white/70 backdrop-blur-sm">
      <div className="bg-white border border-gray-200 rounded-2xl p-8 w-[340px] flex flex-col items-center gap-5 shadow-xl">

        {/* Rings */}
        <div className="relative w-16 h-16 flex items-center justify-center">
          {[1, 2, 3].map((r) => (
            <div
              key={r}
              className="absolute rounded-full border border-blue-300/50 animate-ping"
              style={{
                width: r * 20 + 16,
                height: r * 20 + 16,
                animationDelay: `${r * 0.2}s`,
                animationDuration: "1.5s",
              }}
            />
          ))}
          <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center z-10">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" />
              <polyline points="14 2 14 8 20 8" stroke="#3b82f6" strokeWidth="2" />
              <line x1="8" y1="13" x2="16" y2="13" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <div className="text-center">
          <h3 className="text-gray-900 font-semibold text-lg">Analyzing</h3>
        </div>

        {/* Steps */}
        <div className="w-full flex flex-col gap-1.5">
          {PIPELINE_STAGES.map((s, i) => {
            const done   = i < activeIdx;
            const active = i === activeIdx;
            return (
              <div
                key={s.id}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all
                  ${active ? "bg-blue-50 border border-blue-200" : ""}
                `}
              >
                <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                  {done ? (
                    <svg className="w-4 h-4 text-emerald-500" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M3 8l4 4 6-6" />
                    </svg>
                  ) : active ? (
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-gray-300" />
                  )}
                </div>
                <span className={`text-sm
                  ${done ? "text-emerald-600" : active ? "text-blue-600 font-medium" : "text-gray-400"}
                `}>
                  {s.label}
                </span>
                {active && (
                  <div className="ml-auto w-16 h-1.5 bg-blue-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full animate-pulse w-2/3" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};

export default ProcessingOverlay;