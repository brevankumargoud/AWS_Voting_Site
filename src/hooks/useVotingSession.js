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

      setActiveSession(active);
      setLatestSession(latest);

      const targetSessionId = active ? active.id : (latest ? latest.id : null);

      if (targetSessionId) {
        const [contestantsData, resultsData] = await Promise.all([
          dbService.getContestants(targetSessionId),
          dbService.getVoteResults(targetSessionId),
        ]);
        setContestants(contestantsData);
        setResults(resultsData);
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

    if (isSupabaseConfigured && supabase) {
      try {
        const channelId = `realtime-voting-${Math.random().toString(36).substring(2, 9)}`;
        
        channelInstance = supabase
          .channel(channelId)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'votes' }, () => {
            fetchSessionData(true);
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'voting_sessions' }, () => {
            fetchSessionData(true);
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

    // Silent background poll every 6 seconds (no loader flash)
    pollInterval = setInterval(() => {
      fetchSessionData(true);
    }, 6000);

    return () => {
      if (channelInstance && supabase) {
        try {
          supabase.removeChannel(channelInstance);
        } catch (e) {
          console.warn('Error removing channel:', e);
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
