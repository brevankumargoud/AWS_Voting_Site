import React from 'react';
import { Check, Sparkles } from 'lucide-react';

export const ContestantCard = ({ contestant, isSelected, onSelect, disabled = false }) => {
  return (
    <div
      onClick={() => !disabled && onSelect(contestant)}
      className={`group relative rounded-2xl transition-all duration-300 cursor-pointer overflow-hidden flex flex-col h-full ${
        isSelected
          ? 'glass-card-active ring-2 ring-indigo-500 scale-[1.02] -translate-y-1 shadow-2xl shadow-indigo-500/20'
          : 'glass-card hover:border-indigo-500/40 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/60'
      } ${disabled ? 'opacity-70 cursor-not-allowed' : ''}`}
    >
      {/* Selected Indicator Badge */}
      {isSelected && (
        <div className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/40 animate-bounce">
          <Check className="w-5 h-5 stroke-[3]" />
        </div>
      )}

      {/* Contestant Image Container */}
      <div className="relative aspect-square w-full bg-slate-900/80 overflow-hidden">
        <img
          src={contestant.image_url || 'https://via.placeholder.com/400x400?text=No+Image'}
          alt={contestant.name}
          className={`w-full h-full object-cover transition-transform duration-500 ${
            isSelected ? 'scale-105 filter brightness-105' : 'group-hover:scale-105'
          }`}
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity"></div>
      </div>

      {/* Candidate Name & Info */}
      <div className="p-5 flex-1 flex flex-col justify-between bg-slate-900/40">
        <div>
          <h3 className={`font-bold text-base sm:text-lg tracking-tight transition-colors line-clamp-2 ${
            isSelected ? 'text-indigo-300' : 'text-slate-100 group-hover:text-indigo-200'
          }`}>
            {contestant.name}
          </h3>
        </div>

        {/* Visual Cue */}
        <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs">
          <span className={`font-medium transition-colors ${
            isSelected ? 'text-indigo-400 font-semibold' : 'text-slate-400 group-hover:text-slate-300'
          }`}>
            {isSelected ? 'Selected Choice' : 'Click to Select'}
          </span>
          {isSelected && (
            <Sparkles className="w-4 h-4 text-indigo-400 animate-spin" style={{ animationDuration: '4s' }} />
          )}
        </div>
      </div>

      {/* Active Glowing Border Overlay */}
      {isSelected && (
        <div className="absolute inset-0 rounded-2xl border-2 border-indigo-500 pointer-events-none"></div>
      )}
    </div>
  );
};
