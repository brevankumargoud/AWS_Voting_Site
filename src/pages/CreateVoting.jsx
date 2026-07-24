import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Upload, ArrowLeft, Loader2, Play, Image as ImageIcon, Sparkles } from 'lucide-react';
import { dbService } from '../services/supabase';
import toast from 'react-hot-toast';

export const CreateVoting = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('AWS Event Final Vote 2026');
  const [description, setDescription] = useState('Select the best innovation project presentation');
  const [contestants, setContestants] = useState([
    { id: 1, name: '', file: null, previewUrl: '' },
    { id: 2, name: '', file: null, previewUrl: '' },
  ]);
  const [loading, setLoading] = useState(false);

  // Add new contestant field dynamically (Unlimited)
  const addContestant = () => {
    setContestants((prev) => [
      ...prev,
      { id: Date.now() + Math.random(), name: '', file: null, previewUrl: '' },
    ]);
  };

  // Remove contestant field
  const removeContestant = (index) => {
    if (contestants.length <= 2) {
      toast.error('At least 2 contestants are recommended for a voting session.');
      return;
    }
    setContestants((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle name change
  const handleNameChange = (index, value) => {
    setContestants((prev) => {
      const updated = [...prev];
      updated[index].name = value;
      return updated;
    });
  };

  // Handle image file select & local preview URL creation
  const handleFileChange = (index, file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, WebP, etc.).');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setContestants((prev) => {
      const updated = [...prev];
      updated[index].file = file;
      updated[index].previewUrl = previewUrl;
      return updated;
    });
  };

  // Form submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Please provide a session title.');
      return;
    }

    // Validate contestants
    for (let i = 0; i < contestants.length; i++) {
      if (!contestants[i].name.trim()) {
        toast.error(`Please enter a name for Contestant ${i + 1}.`);
        return;
      }
      if (!contestants[i].file && !contestants[i].previewUrl) {
        toast.error(`Please upload an image for Contestant ${i + 1} (${contestants[i].name}).`);
        return;
      }
    }

    try {
      setLoading(true);
      toast.loading('Uploading contestant images to Supabase Storage...', { id: 'create_voting' });

      // Prepare payload for Supabase insertion
      const contestantsPayload = contestants.map((c) => ({
        name: c.name.trim(),
        file: c.file,
        image_url: c.previewUrl || 'https://via.placeholder.com/400x400?text=Contestant',
      }));

      await dbService.createVotingSession({
        title: title.trim(),
        description: description.trim(),
        contestants: contestantsPayload,
      });

      toast.success('Voting session created and marked as ACTIVE!', { id: 'create_voting' });
      navigate('/admin/dashboard');
    } catch (err) {
      console.error('Error creating voting session:', err);
      toast.error(err.message || 'Failed to create voting session.', { id: 'create_voting' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/admin/dashboard')}
          className="inline-flex items-center space-x-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Admin Dashboard</span>
        </button>

        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Unlimited Contestants</span>
        </div>
      </div>

      {/* Main Form Box */}
      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Session Meta Information */}
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6">
          <h2 className="text-xl font-bold text-white border-b border-slate-800 pb-4">
            Session Configuration
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Event Session Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. AWS Idea Pitch 2026 Final Vote"
                className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description for voters..."
                rows={2}
                className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
              />
            </div>
          </div>
        </div>

        {/* Dynamic Contestants Input Sections */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Contestants List</h2>
            <span className="text-xs text-slate-400 font-medium">
              {contestants.length} Contestant{contestants.length > 1 ? 's' : ''} added
            </span>
          </div>

          <div className="space-y-6">
            {contestants.map((contestant, index) => (
              <div
                key={contestant.id}
                className="glass-card rounded-3xl p-6 border border-slate-800 relative transition-all hover:border-slate-700 space-y-4"
              >
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <span className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-600/30 text-indigo-300 flex items-center justify-center text-xs">
                      {index + 1}
                    </span>
                    <span>Contestant {index + 1}</span>
                  </span>

                  {contestants.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeContestant(index)}
                      className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
                      title="Remove Contestant"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                  
                  {/* Name Input */}
                  <div className="md:col-span-7 space-y-2">
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Contestant Name
                    </label>
                    <input
                      type="text"
                      value={contestant.name}
                      onChange={(e) => handleNameChange(index, e.target.value)}
                      placeholder={`Enter contestant ${index + 1} name`}
                      className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                      required
                    />
                  </div>

                  {/* Image Upload Input */}
                  <div className="md:col-span-5 space-y-2">
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Contestant Image
                    </label>

                    <div className="flex items-center space-x-4">
                      {/* Image Preview Thumbnail */}
                      <div className="w-16 h-16 rounded-xl bg-slate-900 border border-slate-700/80 overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {contestant.previewUrl ? (
                          <img
                            src={contestant.previewUrl}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="w-6 h-6 text-slate-600" />
                        )}
                      </div>

                      {/* Upload Button */}
                      <label className="flex-1 cursor-pointer flex items-center justify-center space-x-2 px-4 py-3 rounded-xl bg-slate-900 border border-dashed border-slate-700 hover:border-indigo-500 hover:bg-slate-800/80 text-xs font-medium text-slate-300 transition-all">
                        <Upload className="w-4 h-4 text-indigo-400" />
                        <span className="truncate">
                          {contestant.file ? contestant.file.name : 'Choose File'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(index, e.target.files[0])}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                </div>
              </div>
            ))}
          </div>

          {/* Add Contestant Button */}
          <button
            type="button"
            onClick={addContestant}
            className="w-full py-4 rounded-2xl border-2 border-dashed border-slate-800 hover:border-indigo-500/60 bg-slate-900/40 hover:bg-slate-900/80 text-indigo-400 hover:text-indigo-300 font-bold text-sm flex items-center justify-center space-x-2 transition-all"
          >
            <Plus className="w-5 h-5" />
            <span>+ Add Contestant</span>
          </button>
        </div>

        {/* Start Voting Submit Button */}
        <div className="pt-4 border-t border-slate-800">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-base tracking-wide shadow-xl shadow-indigo-600/30 glow-button flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Uploading Images & Creating Session...</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" />
                <span>Start Voting (Mark Session ACTIVE)</span>
              </>
            )}
          </button>
        </div>

      </form>

    </div>
  );
};
