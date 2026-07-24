import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Vote, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { AwsLogo } from '../components/AwsLogo';

export const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-xl w-full space-y-8 text-center animate-fade-in">
        
        {/* AWS Brand Header Hero Banner */}
        <div className="flex justify-center mb-4">
          <div className="px-6 py-4 rounded-3xl bg-slate-900/90 border border-slate-800/90 shadow-2xl shadow-indigo-500/10 inline-flex items-center space-x-5 backdrop-blur-md">
            <AwsLogo className="h-14 sm:h-16 w-auto" />
            <div className="border-l border-slate-700/80 pl-4 text-left">
              <span className="text-sm font-black uppercase tracking-widest text-amber-400 block">
                Idea Pitch 2026
              </span>
              <span className="text-xs text-slate-400 font-medium block">
                Official Event Voting
              </span>
            </div>
          </div>
        </div>

        {/* Header Hero */}
        <div className="space-y-4">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Official Event Voting Platform</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            AWS Event <span className="bg-gradient-to-r from-amber-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">Voting Portal</span>
          </h1>

          <p className="text-slate-400 text-sm sm:text-base max-w-md mx-auto leading-relaxed">
            Welcome to the single-event live decision portal. Select your role below to cast your vote or manage event statistics.
          </p>
        </div>

        {/* Role Selection Box */}
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl space-y-6">
          <div className="text-xs font-bold uppercase tracking-widest text-slate-400 border-b border-slate-800 pb-4">
            Select Your Role
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Admin Option */}
            <button
              onClick={() => navigate('/admin/login')}
              className="group relative p-6 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-900/50 border border-slate-800 hover:border-indigo-500/60 hover:bg-slate-800/80 transition-all duration-300 text-left flex flex-col justify-between hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1"
            >
              <div className="w-12 h-12 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-white group-hover:text-indigo-300 transition-colors flex items-center justify-between">
                  <span>Admin</span>
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Login to create contestants, control voting session, & view live results.
                </p>
              </div>
            </button>

            {/* Voter Option */}
            <button
              onClick={() => navigate('/voter')}
              className="group relative p-6 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-900/50 border border-slate-800 hover:border-emerald-500/60 hover:bg-slate-800/80 transition-all duration-300 text-left flex flex-col justify-between hover:shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-1"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                <Vote className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-white group-hover:text-emerald-300 transition-colors flex items-center justify-between">
                  <span>Voter</span>
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Cast your vote for active event contestants. One vote per device.
                </p>
              </div>
            </button>

          </div>

          <div className="pt-2 flex items-center justify-center space-x-6 text-xs text-slate-400">
            <span className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Real-time Sync</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Duplicate Prevention</span>
            </span>
          </div>

        </div>

      </div>
    </div>
  );
};
