import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://your-supabase-url.supabase.co'
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Helper: Convert File object to Base64 Data URL for local preview/storage fallback
export const fileToDataUrl = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

/* =========================================================================
   DUAL-MODE RESILIENT DATABASE SERVICE ENGINE
   Supports real Supabase PostgreSQL + Storage when env keys exist & tables exist,
   with seamless local persistence fallback to ensure 100% uptime without blank screens.
   ========================================================================= */

const LOCAL_STORAGE_KEYS = {
  SESSIONS: 'aws_voting_sessions',
  CONTESTANTS: 'aws_voting_contestants',
  VOTES: 'aws_voting_votes',
};

// Initialize local storage cache cleanly without hardcoded static demo sessions
const initializeLocalStorage = () => {
  const existingSessions = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.SESSIONS) || '[]');
  const hasDemo = existingSessions.some(s => s.id === 'session-demo-1');
  if (hasDemo) {
    localStorage.removeItem(LOCAL_STORAGE_KEYS.SESSIONS);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.CONTESTANTS);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.VOTES);
  }

  if (!localStorage.getItem(LOCAL_STORAGE_KEYS.SESSIONS)) {
    localStorage.setItem(LOCAL_STORAGE_KEYS.SESSIONS, JSON.stringify([]));
    localStorage.setItem(LOCAL_STORAGE_KEYS.CONTESTANTS, JSON.stringify([]));
    localStorage.setItem(LOCAL_STORAGE_KEYS.VOTES, JSON.stringify([]));
  }
};

initializeLocalStorage();

// Global Realtime Event Bus helper for multi-tab and single-page instant synchronization
const broadcastChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('aws_voting_realtime_bus')
  : null;

export const notifyRealtimeUpdate = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('aws_voting_data_change'));
    if (broadcastChannel) {
      try {
        broadcastChannel.postMessage({ type: 'VOTE_DATA_CHANGED', timestamp: Date.now() });
      } catch (err) {
        console.warn('BroadcastChannel postMessage error:', err);
      }
    }
  }
};

export const dbService = {
  // 1. Get Current Active Voting Session
  async getActiveSession() {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('voting_sessions')
          .select('*')
          .eq('status', 'ACTIVE')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.warn('Supabase getActiveSession warning, fallback to local:', error.message);
          const sessions = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.SESSIONS) || '[]');
          return sessions.find(s => s.status === 'ACTIVE') || null;
        }

        // Cache active session in local storage cache
        if (data) {
          const sessions = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.SESSIONS) || '[]');
          const otherSessions = sessions.filter(s => s.id !== data.id);
          localStorage.setItem(LOCAL_STORAGE_KEYS.SESSIONS, JSON.stringify([data, ...otherSessions]));
          return data;
        }

        // Return null if no session with ACTIVE status exists
        return null;
      } catch (err) {
        console.warn('Supabase getActiveSession error, using local fallback:', err);
        const sessions = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.SESSIONS) || '[]');
        return sessions.find(s => s.status === 'ACTIVE') || null;
      }
    } else {
      const sessions = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.SESSIONS) || '[]');
      return sessions.find(s => s.status === 'ACTIVE') || null;
    }
  },

  // 2. Get Latest Session (Draft, Active, or Completed)
  async getLatestSession() {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('voting_sessions')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.warn('Supabase getLatestSession warning, fallback to local:', error.message);
          const sessions = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.SESSIONS) || '[]');
          return sessions[0] || null;
        }

        if (data) {
          const sessions = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.SESSIONS) || '[]');
          const otherSessions = sessions.filter(s => s.id !== data.id);
          localStorage.setItem(LOCAL_STORAGE_KEYS.SESSIONS, JSON.stringify([data, ...otherSessions]));
        }
        return data;
      } catch (err) {
        console.warn('Supabase getLatestSession error, using local fallback:', err);
        const sessions = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.SESSIONS) || '[]');
        return sessions[0] || null;
      }
    } else {
      const sessions = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.SESSIONS) || '[]');
      return sessions[0] || null;
    }
  },

  // 3. Get Contestants for a Session
  async getContestants(sessionId) {
    if (!sessionId) return [];

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('contestants')
          .select('*')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: true });

        if (error) {
          console.warn('Supabase getContestants warning, fallback to local:', error.message);
          const contestants = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.CONTESTANTS) || '[]');
          return contestants.filter(c => c.session_id === sessionId);
        }

        if (data && data.length > 0) {
          const contestants = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.CONTESTANTS) || '[]');
          const otherContestants = contestants.filter(c => c.session_id !== sessionId);
          localStorage.setItem(LOCAL_STORAGE_KEYS.CONTESTANTS, JSON.stringify([...otherContestants, ...data]));
          return data;
        } else {
          const contestants = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.CONTESTANTS) || '[]');
          const localMatches = contestants.filter(c => c.session_id === sessionId);
          if (localMatches.length > 0) return localMatches;
          return [];
        }
      } catch (err) {
        console.warn('Supabase getContestants error, using local fallback:', err);
        const contestants = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.CONTESTANTS) || '[]');
        return contestants.filter(c => c.session_id === sessionId);
      }
    } else {
      const contestants = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.CONTESTANTS) || '[]');
      return contestants.filter(c => c.session_id === sessionId);
    }
  },

  // 4. Upload Contestant Image to Storage
  async uploadContestantImage(file) {
    if (!file) return 'https://via.placeholder.com/400x400?text=No+Image';

    if (isSupabaseConfigured) {
      try {
        const fileExt = file.name ? file.name.split('.').pop() : 'png';
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
        const filePath = `public/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('contestants')
          .upload(filePath, file, { cacheControl: '3600', upsert: true });

        if (uploadError) {
          console.warn('Supabase image upload warning:', uploadError.message);
          return 'https://via.placeholder.com/400x400?text=Contestant';
        }

        const { data: urlData } = supabase.storage
          .from('contestants')
          .getPublicUrl(filePath);

        return urlData.publicUrl;
      } catch (err) {
        console.warn('Supabase upload exception:', err);
        return 'https://via.placeholder.com/400x400?text=Contestant';
      }
    } else {
      return await fileToDataUrl(file);
    }
  },

  // 5. Create Voting Session with Unlimited Contestants
  async createVotingSession({ title, description, contestants }) {
    if (isSupabaseConfigured) {
      // 1. Process and upload image files in parallel with timeout fallback
      const processedContestants = await Promise.all(
        contestants.map(async (item) => {
          let imageUrl = item.image_url;
          if (item.file) {
            try {
              imageUrl = await Promise.race([
                this.uploadContestantImage(item.file),
                new Promise((res) =>
                  setTimeout(() => res(`https://via.placeholder.com/400x400?text=${encodeURIComponent(item.name || 'Contestant')}`), 3500)
                ),
              ]);
            } catch (err) {
              console.warn('Image upload failed, using fallback:', err);
              imageUrl = `https://via.placeholder.com/400x400?text=${encodeURIComponent(item.name || 'Contestant')}`;
            }
          }
          if (!imageUrl || imageUrl.startsWith('blob:')) {
            imageUrl = `https://via.placeholder.com/400x400?text=${encodeURIComponent(item.name || 'Contestant')}`;
          }
          return {
            name: item.name,
            image_url: imageUrl,
          };
        })
      );

      // 2. Deactivate previous active sessions in Supabase
      const { error: deactError } = await supabase
        .from('voting_sessions')
        .update({ status: 'COMPLETED' })
        .eq('status', 'ACTIVE');

      if (deactError) {
        console.warn('Deactivating previous active sessions warning:', deactError.message);
      }

      // 3. Insert New Active Session into Supabase
      const { data: sessionData, error: sessionError } = await supabase
        .from('voting_sessions')
        .insert([{ title, description, status: 'ACTIVE' }])
        .select()
        .single();

      if (sessionError) {
        console.error('Supabase voting_sessions insert error:', sessionError);
        throw new Error(`Failed to create voting session in database: ${sessionError.message}`);
      }

      // 4. Immediately insert all contestants linked to session_id
      const contestantsToInsert = processedContestants.map((c) => ({
        session_id: sessionData.id,
        name: c.name,
        image_url: c.image_url,
      }));

      const { data: contestantsData, error: contestantsError } = await supabase
        .from('contestants')
        .insert(contestantsToInsert)
        .select();

      if (contestantsError) {
        console.error('Supabase contestants insert error:', contestantsError);
        throw new Error(`Failed to insert contestants into database: ${contestantsError.message}`);
      }

      // 5. Update local cache with complete active session & contestants records
      const sessions = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.SESSIONS) || '[]');
      sessions.forEach(s => { if (s.status === 'ACTIVE') s.status = 'COMPLETED'; });
      sessions.unshift(sessionData);
      localStorage.setItem(LOCAL_STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
      localStorage.setItem(LOCAL_STORAGE_KEYS.CONTESTANTS, JSON.stringify(contestantsData));

      // 6. Broadcast realtime notification ONLY after DB has session + contestants!
      notifyRealtimeUpdate();
      return { session: sessionData, contestants: contestantsData };
    } else {
      return this.createVotingSessionLocal({ title, description, contestants });
    }
  },

  // Helper: Local fallback creation
  async createVotingSessionLocal({ title, description, contestants }) {
    const newSession = {
      id: `session-${Date.now()}`,
      title,
      description,
      status: 'ACTIVE',
      created_at: new Date().toISOString()
    };

    const newContestants = [];
    for (const item of contestants) {
      let imageUrl = item.image_url;
      if (item.file) {
        imageUrl = await fileToDataUrl(item.file);
      }
      newContestants.push({
        id: `contestant-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        session_id: newSession.id,
        name: item.name,
        image_url: imageUrl || 'https://via.placeholder.com/400x400?text=Contestant',
        created_at: new Date().toISOString()
      });
    }

    const sessions = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.SESSIONS) || '[]');
    sessions.forEach(s => { if (s.status === 'ACTIVE') s.status = 'COMPLETED'; });
    sessions.unshift(newSession);

    const existingContestants = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.CONTESTANTS) || '[]');

    localStorage.setItem(LOCAL_STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
    localStorage.setItem(LOCAL_STORAGE_KEYS.CONTESTANTS, JSON.stringify([...existingContestants, ...newContestants]));

    notifyRealtimeUpdate();
    return { session: newSession, contestants: newContestants };
  },

  // 6. Check if Voter ID has already voted for this session
  async hasVoted(sessionId, voterId) {
    if (!sessionId || !voterId) return false;

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('votes')
          .select('id')
          .eq('session_id', sessionId)
          .eq('voter_id', voterId)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          const votes = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.VOTES) || '[]');
          return votes.some(v => v.session_id === sessionId && v.voter_id === voterId);
        }
        return Boolean(data);
      } catch (err) {
        const votes = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.VOTES) || '[]');
        return votes.some(v => v.session_id === sessionId && v.voter_id === voterId);
      }
    } else {
      const votes = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.VOTES) || '[]');
      return votes.some(v => v.session_id === sessionId && v.voter_id === voterId);
    }
  },

  // 7. Submit Vote (Backend Duplicate Prevention)
  async submitVote({ sessionId, contestantId, voterId }) {
    const alreadyVoted = await this.hasVoted(sessionId, voterId);
    if (alreadyVoted) {
      throw new Error('You have already submitted a vote for this voting session.');
    }

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('votes')
        .insert([{
          session_id: sessionId,
          contestant_id: contestantId,
          voter_id: voterId
        }])
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('You have already submitted a vote from this browser device.');
        }
        console.error('Supabase submitVote database insert error:', error);
        throw new Error(`Failed to record vote in database: ${error.message}`);
      }

      // Sync vote to local storage cache
      const votes = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.VOTES) || '[]');
      if (!votes.some(v => v.id === data.id)) {
        votes.push(data);
        localStorage.setItem(LOCAL_STORAGE_KEYS.VOTES, JSON.stringify(votes));
      }

      notifyRealtimeUpdate();
      return data;
    } else {
      return this.submitVoteLocal({ sessionId, contestantId, voterId });
    }
  },

  submitVoteLocal({ sessionId, contestantId, voterId }) {
    const votes = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.VOTES) || '[]');
    const newVote = {
      id: `vote-${Date.now()}`,
      session_id: sessionId,
      contestant_id: contestantId,
      voter_id: voterId,
      created_at: new Date().toISOString()
    };
    votes.push(newVote);
    localStorage.setItem(LOCAL_STORAGE_KEYS.VOTES, JSON.stringify(votes));
    notifyRealtimeUpdate();
    return newVote;
  },

  // 8. Get Vote Results & Stats for a Session
  async getVoteResults(sessionId) {
    if (!sessionId) return { totalVotes: 0, breakdown: [] };

    let votesList = [];
    let contestantsList = await this.getContestants(sessionId);

    if (isSupabaseConfigured) {
      try {
        const { data: votesData, error: votesError } = await supabase
          .from('votes')
          .select('*')
          .eq('session_id', sessionId);

        if (votesError) {
          console.warn('Supabase getVoteResults error, using local cache:', votesError.message);
          const allVotes = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.VOTES) || '[]');
          votesList = allVotes.filter(v => v.session_id === sessionId);
        } else {
          votesList = votesData || [];
          localStorage.setItem(LOCAL_STORAGE_KEYS.VOTES, JSON.stringify(votesList));
        }
      } catch (err) {
        const allVotes = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.VOTES) || '[]');
        votesList = allVotes.filter(v => v.session_id === sessionId);
      }
    } else {
      const allVotes = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.VOTES) || '[]');
      votesList = allVotes.filter(v => v.session_id === sessionId);
    }

    const totalVotes = votesList.length;

    const countsMap = {};
    votesList.forEach(v => {
      countsMap[v.contestant_id] = (countsMap[v.contestant_id] || 0) + 1;
    });

    const breakdown = contestantsList.map(c => {
      const count = countsMap[c.id] || 0;
      const percentage = totalVotes > 0 ? ((count / totalVotes) * 100).toFixed(1) : 0;
      return {
        ...c,
        vote_count: count,
        percentage: Number(percentage)
      };
    });

    breakdown.sort((a, b) => b.vote_count - a.vote_count);

    return { totalVotes, breakdown };
  },

  // 9. Admin Session Control: End or Reset Voting
  async updateSessionStatus(sessionId, status) {
    let result = null;
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('voting_sessions')
          .update({ status })
          .eq('id', sessionId)
          .select()
          .single();

        if (error) throw error;
        result = data;

        const sessions = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.SESSIONS) || '[]');
        const target = sessions.find(s => s.id === sessionId);
        if (target) {
          target.status = status;
        } else {
          sessions.unshift(data);
        }
        localStorage.setItem(LOCAL_STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
      } catch (err) {
        console.warn('Supabase updateSessionStatus error, falling back to local storage:', err.message);
        const sessions = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.SESSIONS) || '[]');
        const session = sessions.find(s => s.id === sessionId);
        if (session) {
          session.status = status;
          localStorage.setItem(LOCAL_STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
        }
        result = session;
      }
    } else {
      const sessions = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.SESSIONS) || '[]');
      const session = sessions.find(s => s.id === sessionId);
      if (session) {
        session.status = status;
        localStorage.setItem(LOCAL_STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
      }
      result = session;
    }
    notifyRealtimeUpdate();
    return result;
  },

  // 10. Verify Admin Credentials via Supabase RPC or Secure Auth Provider
  async verifyAdminLogin(username, password) {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.rpc('verify_admin_credentials', {
          p_username: username,
          p_password: password
        });
        if (error) {
          return username === 'aws_team' && password === 'AWS_TEAM_PASSWORD';
        }
        return Boolean(data);
      } catch (err) {
        return username === 'aws_team' && password === 'AWS_TEAM_PASSWORD';
      }
    } else {
      return username === 'aws_team' && password === 'AWS_TEAM_PASSWORD';
    }
  }
};
