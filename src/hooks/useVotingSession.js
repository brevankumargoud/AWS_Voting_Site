import { useState, useEffect, useCallback } from 'react';
import { dbService, supabase, isSupabaseConfigured } from '../services/supabase';

export const useVotingSession = () => {
  const [activeSession, setActiveSession] = useState(null);
  const [latestSession, setLatestSession] = useState(null);
  const [contestants, setContestants] = useState([]);
  const [results, setResults] = useState({ totalVotes: 0, breakdown: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch session data seamlessly (isBackground = true prevents full-page loader flashes)
  const fetchSessionData = useCallback(async (isBackground = false) => {
    try {
      if (!isBackground) {
        setLoading(true);
      }
      setError(null);

      const [active, latest] = await Promise.all([
        dbService.getActiveSession(),
        dbService.getLatestSession(),
      ]);

      setActiveSession((prev) => (JSON.stringify(prev) === JSON.stringify(active) ? prev : active));
      setLatestSession((prev) => (JSON.stringify(prev) === JSON.stringify(latest) ? prev : latest));

      const targetSessionId = active ? active.id : (latest ? latest.id : null);

      if (targetSessionId) {
        const [contestantsData, resultsData] = await Promise.all([
          dbService.getContestants(targetSessionId),
          dbService.getVoteResults(targetSessionId),
        ]);
        setContestants((prev) => (JSON.stringify(prev) === JSON.stringify(contestantsData) ? prev : contestantsData));
        setResults((prev) => (JSON.stringify(prev) === JSON.stringify(resultsData) ? prev : resultsData));
      } else {
        setContestants([]);
        setResults({ totalVotes: 0, breakdown: [] });
      }
    } catch (err) {
      console.error('Error fetching voting session data:', err);
      setError(err.message || 'Failed to load voting data');
    } finally {
      if (!isBackground) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    // Initial load shows spinner
    fetchSessionData(false);

    let channelInstance = null;
    let pollInterval = null;
    let bcInstance = null;

    const handleDataUpdate = () => {
      fetchSessionData(true);
    };

    // 1. Realtime Supabase PostgreSQL WebSockets
    if (isSupabaseConfigured && supabase) {
      try {
        const channelId = `realtime-voting-global-${Math.random().toString(36).substring(2, 7)}`;
        
        channelInstance = supabase
          .channel(channelId)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'votes' }, () => {
            handleDataUpdate();
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'voting_sessions' }, () => {
            handleDataUpdate();
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'contestants' }, () => {
            handleDataUpdate();
          })
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              console.log('Realtime vote subscription active.');
            }
          });
      } catch (err) {
        console.warn('Realtime channel subscription error:', err);
      }
    }

    // 2. Custom Events & Storage Events for 0ms Single-Page & Multi-Tab Sync
    window.addEventListener('aws_voting_data_change', handleDataUpdate);
    window.addEventListener('storage', handleDataUpdate);

    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        bcInstance = new BroadcastChannel('aws_voting_realtime_bus');
        bcInstance.onmessage = (e) => {
          if (e.data?.type === 'VOTE_DATA_CHANGED') {
            handleDataUpdate();
          }
        };
      } catch (err) {
        console.warn('BroadcastChannel error:', err);
      }
    }

    // 3. Silent background poll every 1.5 seconds for guaranteed fast live updates
    pollInterval = setInterval(() => {
      fetchSessionData(true);
    }, 1500);

    return () => {
      if (channelInstance && supabase) {
        try {
          supabase.removeChannel(channelInstance);
        } catch (e) {
          console.warn('Error removing channel:', e);
        }
      }
      window.removeEventListener('aws_voting_data_change', handleDataUpdate);
      window.removeEventListener('storage', handleDataUpdate);
      if (bcInstance) {
        try {
          bcInstance.close();
        } catch (e) {
          console.warn('Error closing BroadcastChannel:', e);
        }
      }
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [fetchSessionData]);

  return {
    activeSession,
    latestSession,
    contestants,
    results,
    loading,
    error,
    refresh: () => fetchSessionData(false),
  };
};
