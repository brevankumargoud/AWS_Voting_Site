import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://your-supabase-url.supabase.co'
);

if (!isSupabaseConfigured) {
  console.warn('Supabase environment variables (VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY) are missing or unconfigured.');
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

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

/* =========================================================================
   PURE SUPABASE DATABASE SERVICE
   Single source of truth relying strictly on Supabase PostgreSQL + Storage.
   ========================================================================= */

export const dbService = {
  // 1. Get Current Active Voting Session
  async getActiveSession() {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase client is not configured.');
    }

    const { data, error } = await supabase
      .from('voting_sessions')
      .select('*')
      .eq('status', 'ACTIVE')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to fetch active voting session: ${error.message}`);
    }

    return data || null;
  },

  // 2. Get Latest Voting Session (Active, Completed, or Draft)
  async getLatestSession() {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase client is not configured.');
    }

    const { data, error } = await supabase
      .from('voting_sessions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to fetch latest voting session: ${error.message}`);
    }

    return data || null;
  },

  // 3. Get Contestants for a Session
  async getContestants(sessionId) {
    if (!sessionId) return [];
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase client is not configured.');
    }

    const { data, error } = await supabase
      .from('contestants')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch contestants for session (${sessionId}): ${error.message}`);
    }

    return data || [];
  },

  // 4. Upload Contestant Image to Storage Bucket ('contestants')
  async uploadContestantImage(file) {
    if (!file) {
      throw new Error('No image file provided for upload.');
    }
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase client is not configured.');
    }

    const fileExt = file.name ? file.name.split('.').pop() : 'png';
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `public/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('contestants')
      .upload(filePath, file, { cacheControl: '3600', upsert: true });

    if (uploadError) {
      throw new Error(`Image upload failed: ${uploadError.message}`);
    }

    const { data: urlData } = supabase.storage
      .from('contestants')
      .getPublicUrl(filePath);

    if (!urlData?.publicUrl) {
      throw new Error('Failed to retrieve public URL for uploaded contestant image.');
    }

    return urlData.publicUrl;
  },

  // 5. Create Voting Session with Contestants (Atomic Rollback Safety)
  async createVotingSession({ title, description, contestants }) {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase client is not configured.');
    }

    // A. Upload contestant image files to Storage in parallel
    const processedContestants = await Promise.all(
      contestants.map(async (item) => {
        let imageUrl = item.image_url;
        if (item.file) {
          imageUrl = await this.uploadContestantImage(item.file);
        }
        if (!imageUrl) {
          imageUrl = `https://via.placeholder.com/400x400?text=${encodeURIComponent(item.name || 'Contestant')}`;
        }
        return {
          name: item.name,
          image_url: imageUrl,
        };
      })
    );

    // B. Deactivate any currently active voting sessions
    const { error: deactError } = await supabase
      .from('voting_sessions')
      .update({ status: 'COMPLETED' })
      .eq('status', 'ACTIVE');

    if (deactError) {
      throw new Error(`Failed to update existing active sessions: ${deactError.message}`);
    }

    // C. Insert New ACTIVE Voting Session
    const { data: sessionData, error: sessionError } = await supabase
      .from('voting_sessions')
      .insert([{ title, description, status: 'ACTIVE' }])
      .select()
      .single();

    if (sessionError) {
      throw new Error(`Failed to create voting session: ${sessionError.message}`);
    }

    // D. Insert Contestants with Rollback Safety
    try {
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
        throw contestantsError;
      }

      notifyRealtimeUpdate();
      return { session: sessionData, contestants: contestantsData };
    } catch (err) {
      // Rollback session creation to prevent orphan session records without contestants
      await supabase.from('voting_sessions').delete().eq('id', sessionData.id);
      throw new Error(`Contestant creation failed: ${err.message}. Voting session creation has been rolled back.`);
    }
  },

  // 6. Check if Voter ID has already voted for this session
  async hasVoted(sessionId, voterId) {
    if (!sessionId || !voterId) return false;
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase client is not configured.');
    }

    const { data, error } = await supabase
      .from('votes')
      .select('id')
      .eq('session_id', sessionId)
      .eq('voter_id', voterId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to check voter status: ${error.message}`);
    }

    return Boolean(data);
  },

  // 7. Submit Vote (Database Constraint Protection)
  async submitVote({ sessionId, contestantId, voterId }) {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase client is not configured.');
    }

    const alreadyVoted = await this.hasVoted(sessionId, voterId);
    if (alreadyVoted) {
      throw new Error('You have already submitted a vote for this voting session.');
    }

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
        throw new Error('You have already submitted a vote from this device.');
      }
      throw new Error(`Failed to record vote in database: ${error.message}`);
    }

    notifyRealtimeUpdate();
    return data;
  },

  // 8. Get Vote Results & Analytics for a Session
  async getVoteResults(sessionId) {
    if (!sessionId) return { totalVotes: 0, breakdown: [] };
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase client is not configured.');
    }

    const [contestantsList, { data: votesData, error: votesError }] = await Promise.all([
      this.getContestants(sessionId),
      supabase.from('votes').select('*').eq('session_id', sessionId)
    ]);

    if (votesError) {
      throw new Error(`Failed to fetch vote results: ${votesError.message}`);
    }

    const votesList = votesData || [];
    const totalVotes = votesList.length;

    const countsMap = {};
    votesList.forEach((v) => {
      countsMap[v.contestant_id] = (countsMap[v.contestant_id] || 0) + 1;
    });

    const breakdown = contestantsList.map((c) => {
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

  // 9. Admin Session Control: Update Session Status ('DRAFT', 'ACTIVE', 'COMPLETED')
  async updateSessionStatus(sessionId, status) {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase client is not configured.');
    }

    const { data, error } = await supabase
      .from('voting_sessions')
      .update({ status })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update session status: ${error.message}`);
    }

    notifyRealtimeUpdate();
    return data;
  },

  // 10. Verify Admin Credentials via PL/pgSQL RPC Function ('verify_admin_credentials')
  async verifyAdminLogin(username, password) {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase client is not configured.');
    }

    const { data, error } = await supabase.rpc('verify_admin_credentials', {
      p_username: username,
      p_password: password
    });

    if (error) {
      throw new Error(`Admin authentication database error: ${error.message}`);
    }

    return Boolean(data);
  }
};
