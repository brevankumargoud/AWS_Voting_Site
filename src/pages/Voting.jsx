import React, { useState, useEffect } from 'react';

import { useNavigate } from 'react-router-dom';
import { Vote, CheckCircle2, AlertCircle, ArrowLeft, Loader2, Sparkles, ShieldCheck } from 'lucide-react';
import { useVotingSession } from '../hooks/useVotingSession';
import { useVoterId } from '../hooks/useVoterId';
import { ContestantCard } from '../components/ContestantCard';
import { Loader } from '../components/Loader';
import { dbService } from '../services/supabase';
import toast from 'react-hot-toast';

export const Voting = () => {
  const navigate = useNavigate();
  const voterId = useVoterId();
  const { activeSession, contestants, loading: sessionLoading } = useVotingSession();

  const [selectedContestant, setSelectedContestant] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [checkingVoteState, setCheckingVoteState] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Check if current browser UUID has already voted for active session
  useEffect(() => {
    let isMounted = true;
    const checkVotedStatus = async () => {
      if (activeSession && voterId) {
        try {
          const voted = await dbService.hasVoted(activeSession.id, voterId);
          if (isMounted) setHasVoted(voted);
        } catch (err) {
          console.error('Error checking voter status:', err);
        } finally {
          if (isMounted) setCheckingVoteState(false);
        }
      } else {
        if (isMounted) setCheckingVoteState(false);
      }
    };

    checkVotedStatus();
    return () => { isMounted = false; };
  }, [activeSession, voterId]);

  // Handle Submit Vote Action
  const handleSubmitVote = async () => {
    if (!selectedContestant) {
      toast.error('Please select a candidate before submitting.');
      return;
    }
    if (!activeSession) {
      toast.error('No active voting session.');
      return;
    }

    try {
      setSubmitting(true);
      await dbService.submitVote({
        sessionId: activeSession.id,
        contestantId: selectedContestant.id,
        voterId,
      });

      setHasVoted(true);
      toast.success('Your vote has been submitted successfully!');
    } catch (err) {
      console.error('Vote submission error:', err);
      toast.error(err.message || 'Failed to submit vote.');
      // If error is duplicate vote, update local state
      if (err.message?.includes('already')) {
        setHasVoted(true);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (sessionLoading || checkingVoteState) {
    return <Loader text="Checking voting status..." fullScreen={false} />;
  }

  /* -------------------------------------------------------------------------
     EMPTY STATE: Voting has not started yet
     ------------------------------------------------------------------------- */
  if (!activeSession) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
        <div className="max-w-md w-full glass-card rounded-3xl p-8 border border-slate-800 text-center space-y-6 animate-fade-in shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">Voting Has Not Started Yet</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              There is currently no active voting session configured by the administrator. Please check back shortly or ask the event host to launch voting.
            </p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm transition-colors border border-slate-700"
          >
            Return to Role Selection
          </button>
        </div>
      </div>
    );
  }

  /* -------------------------------------------------------------------------
     THANK YOU STATE: Vote already submitted on this device
     ------------------------------------------------------------------------- */
  if (hasVoted) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
        <div className="max-w-lg w-full glass-card rounded-3xl p-8 border border-emerald-500/30 text-center space-y-6 animate-fade-in shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>

          <div className="w-20 h-20 rounded-3xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40 shadow-lg shadow-emerald-500/20">
            <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
          </div>

          <div className="space-y-3">
            <h2 className="text-3xl font-extrabold text-white">Thank You!</h2>
            <p className="text-emerald-400 font-semibold text-base">
              Your vote has been submitted successfully.
            </p>
            <p className="text-slate-400 text-sm max-w-sm mx-auto leading-relaxed">
              Your response has been securely recorded for <span className="text-white font-medium">{activeSession.title}</span>. Duplicate votes from the same device/browser are disabled.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400 font-mono flex items-center justify-between">
            <span>Browser Device ID:</span>
            <span className="text-slate-200 truncate max-w-[200px]">{voterId}</span>
          </div>

          <div className="pt-2 flex items-center justify-center space-x-4">
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm transition-colors border border-slate-700"
            >
              Role Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* -------------------------------------------------------------------------
     ACTIVE VOTING CARD SELECTION GRID
     ------------------------------------------------------------------------- */
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in pb-32">

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Active Session Vote</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            {activeSession.title}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {activeSession.description || 'Click any contestant card below to select your choice, then press Submit Vote.'}
          </p>
        </div>

        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400 text-xs font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Device Protected</span>
        </div>
      </div>

      {/* Contestants Responsive Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {contestants.map((contestant) => (
          <ContestantCard
            key={contestant.id}
            contestant={contestant}
            isSelected={selectedContestant?.id === contestant.id}
            onSelect={(candidate) => setSelectedContestant(candidate)}
          />
        ))}
      </div>

      {/* Floating Bottom Sticky Action Bar for Submit Vote */}
      <div className="fixed bottom-0 left-0 right-0 z-30 p-4 sm:p-6 glass-panel border-t border-slate-800/80 shadow-2xl">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">

          {/* Selected Candidate Summary */}
          <div className="text-center sm:text-left">
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block">
              Selected Candidate:
            </span>
            <span className="text-base font-bold text-white">
              {selectedContestant ? (
                <span className="text-indigo-300 flex items-center space-x-1.5 justify-center sm:justify-start">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 inline" />
                  <span>{selectedContestant.name}</span>
                </span>
              ) : (
                <span className="text-slate-500 italic">None selected yet</span>
              )}
            </span>
          </div>

          {/* Submit Vote Button */}
          <button
            onClick={handleSubmitVote}
            disabled={!selectedContestant || submitting}
            className={`px-8 py-3.5 rounded-2xl font-extrabold text-sm sm:text-base tracking-wide transition-all shadow-xl flex items-center space-x-2 ${selectedContestant && !submitting
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-emerald-500/25 glow-button scale-105'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
              }`}
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Recording Vote...</span>
              </>
            ) : (
              <>
                <Vote className="w-5 h-5" />
                <span>Submit Vote</span>
              </>
            )}
          </button>

        </div>
      </div>

    </div>
  );
};
