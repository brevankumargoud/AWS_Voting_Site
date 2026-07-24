import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, BarChart3, Vote, Users, CheckCircle2, PlayCircle, StopCircle, RefreshCw, AlertCircle } from 'lucide-react';
import { useVotingSession } from '../hooks/useVotingSession';
import { dbService } from '../services/supabase';
import { Loader } from '../components/Loader';
import toast from 'react-hot-toast';

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const { activeSession, latestSession, contestants, results, loading, refresh } = useVotingSession();

  const handleEndVoting = async () => {
    if (!activeSession) return;
    try {
      await dbService.updateSessionStatus(activeSession.id, 'COMPLETED');
      toast.success('Voting session completed!');
      refresh();
    } catch (err) {
      toast.error('Failed to end voting session');
    }
  };

  const handleReactivateSession = async () => {
    if (!latestSession) return;
    try {
      await dbService.updateSessionStatus(latestSession.id, 'ACTIVE');
      toast.success('Voting session is now ACTIVE!');
      refresh();
    } catch (err) {
      toast.error('Failed to update voting session');
    }
  };

  if (loading) {
    return <Loader text="Loading Admin Dashboard..." fullScreen={false} />;
  }

  const hasSession = Boolean(latestSession);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Admin Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage single-event voting sessions, upload contestants, and inspect live results.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={refresh}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => navigate('/admin/create-voting')}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all glow-button"
          >
            <PlusCircle className="w-4.5 h-4.5" />
            <span>Create Voting</span>
          </button>
        </div>
      </div>

      {/* Current Session Status Hero Card */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Session Control
              </span>
              {activeSession ? (
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>ACTIVE</span>
                </span>
              ) : latestSession?.status === 'COMPLETED' ? (
                <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  <span>COMPLETED</span>
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-400 text-xs font-semibold">
                  NO ACTIVE SESSION
                </span>
              )}
            </div>

            <h2 className="text-2xl font-bold text-white">
              {latestSession ? latestSession.title : 'No Voting Session Created Yet'}
            </h2>
            <p className="text-slate-400 text-sm max-w-xl">
              {latestSession
                ? latestSession.description || 'Single-event candidate selection.'
                : 'Click "Create Voting" to set up your candidates and launch an active voting session.'}
            </p>
          </div>

          {/* Action Buttons based on Session Status */}
          <div className="flex flex-wrap items-center gap-3">
            {activeSession && (
              <button
                onClick={handleEndVoting}
                className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 text-sm font-semibold transition-all"
              >
                <StopCircle className="w-4 h-4" />
                <span>End Voting</span>
              </button>
            )}

            {!activeSession && latestSession && (
              <button
                onClick={handleReactivateSession}
                className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-sm font-semibold transition-all"
              >
                <PlayCircle className="w-4 h-4" />
                <span>Resume Voting</span>
              </button>
            )}

            <button
              onClick={() => navigate('/admin/results')}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold transition-all border border-slate-700"
            >
              <BarChart3 className="w-4 h-4 text-indigo-400" />
              <span>View Results</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="glass-card rounded-2xl p-6 border border-slate-800 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Contestants</p>
            <p className="text-2xl font-black text-white">{contestants.length}</p>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 border border-slate-800 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
            <Vote className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Votes Logged</p>
            <p className="text-2xl font-black text-white">{results.totalVotes}</p>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 border border-slate-800 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Leader</p>
            <p className="text-lg font-bold text-white truncate max-w-[150px]">
              {results.breakdown[0] ? results.breakdown[0].name : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Create Voting Tile */}
        <div
          onClick={() => navigate('/admin/create-voting')}
          className="group glass-card rounded-3xl p-8 border border-slate-800 hover:border-indigo-500/50 cursor-pointer transition-all duration-300 hover:-translate-y-1 space-y-4"
        >
          <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all">
            <PlusCircle className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white group-hover:text-indigo-300 transition-colors">
              Create Voting Session
            </h3>
            <p className="text-slate-400 text-sm mt-1">
              Add unlimited contestant names & images. Upload to Supabase Storage and activate the live voting session.
            </p>
          </div>
        </div>

        {/* View Results Tile */}
        <div
          onClick={() => navigate('/admin/results')}
          className="group glass-card rounded-3xl p-8 border border-slate-800 hover:border-emerald-500/50 cursor-pointer transition-all duration-300 hover:-translate-y-1 space-y-4"
        >
          <div className="w-14 h-14 rounded-2xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all">
            <BarChart3 className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white group-hover:text-emerald-300 transition-colors">
              View Analytics & Bar Chart
            </h3>
            <p className="text-slate-400 text-sm mt-1">
              Inspect Chart.js interactive bar chart visualization, total vote tallies, candidate images, and percentage splits.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
};
