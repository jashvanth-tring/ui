import React, { useState } from "react";

interface Props {
  skills:   string[];
  error?:   string;
  onAdd:    (skill: string) => void;
  onRemove: (skill: string) => void;
}

const SkillInput: React.FC<Props> = ({ skills, error, onAdd, onRemove }) => {
  const [newSkill, setNewSkill] = useState("");

  const handleAdd = () => {
    const trimmed = newSkill.trim();
    if (trimmed && !skills.includes(trimmed)) {
      onAdd(trimmed);
    }
    setNewSkill("");
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className={`min-h-[52px] bg-gray-50 border rounded-lg p-2.5 flex flex-wrap gap-1.5
        ${error ? "border-red-400" : "border-gray-200"}`}>
        {skills.length === 0 ? (
          <span className="text-xs text-gray-400">Skills will appear after parsing…</span>
        ) : (
          skills.map((s) => (
            <button key={s} onClick={() => onRemove(s)}
              className="flex items-center gap-1 px-2.5 py-0.5 bg-blue-50 border
                border-blue-200 text-blue-700 text-xs rounded-full
                hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors">
              {s}<span className="ml-0.5 opacity-60">×</span>
            </button>
          ))
        )}
      </div>
      {error && <span className="text-[11px] text-red-500 mt-0.5">{error}</span>}
      <div className="flex gap-2">
        <input
          value={newSkill}
          onChange={(e) => setNewSkill(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Add a skill manually…"
          className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2
            text-sm text-gray-900 placeholder-gray-400 outline-none
            focus:border-blue-500 transition-colors"
        />
        <button onClick={handleAdd} disabled={!newSkill.trim()}
          className="px-4 py-2 border text-sm font-medium rounded-lg transition-colors
            bg-gray-100 border-gray-300 text-gray-700
            hover:bg-gray-200
            disabled:bg-gray-50 disabled:border-gray-200 disabled:text-gray-300 
            disabled:cursor-not-allowed disabled:hover:bg-gray-50">
          + Add
        </button>
      </div>
    </div>
  );
};

export default SkillInput;