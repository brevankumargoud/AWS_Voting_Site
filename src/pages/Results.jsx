import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Vote, Users, RefreshCw, ArrowLeft, Trophy, Sparkles } from 'lucide-react';
import { useVotingSession } from '../hooks/useVotingSession';
import { Loader } from '../components/Loader';

// Import Chart.js modules
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Register ChartJS elements
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export const Results = () => {
  const navigate = useNavigate();
  const { latestSession, results, loading, refresh } = useVotingSession();

  if (loading) {
    return <Loader text="Calculating live vote totals..." fullScreen={false} />;
  }

  const { totalVotes, breakdown } = results;

  // Chart.js Configuration Data
  const chartLabels = breakdown.map((c) => c.name);
  const chartVoteCounts = breakdown.map((c) => c.vote_count);

  const chartData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Total Votes Received',
        data: chartVoteCounts,
        backgroundColor: [
          'rgba(99, 102, 241, 0.85)',
          'rgba(16, 185, 129, 0.85)',
          'rgba(236, 72, 153, 0.85)',
          'rgba(245, 158, 11, 0.85)',
          'rgba(14, 165, 233, 0.85)',
          'rgba(168, 85, 247, 0.85)',
        ],
        borderColor: [
          '#6366f1',
          '#10b981',
          '#ec4899',
          '#f59e0b',
          '#0ea5e9',
          '#a855f7',
        ],
        borderWidth: 2,
        borderRadius: 12,
        borderSkipped: false,
      },
    ],
  };

  const chartOptions = {
    indexAxis: 'y', // Horizontal Bar Chart
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#0f172a',
        titleColor: '#f8fafc',
        bodyColor: '#c7d2fe',
        borderColor: 'rgba(99, 102, 241, 0.3)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 12,
        displayColors: false,
        callbacks: {
          label: (context) => ` ${context.raw} Votes (${totalVotes > 0 ? ((context.raw / totalVotes) * 100).toFixed(1) : 0}%)`,
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          color: '#94a3b8',
          stepSize: 1,
          font: { family: 'Inter', size: 12 },
        },
        grid: {
          color: 'rgba(51, 65, 85, 0.3)',
        },
      },
      y: {
        ticks: {
          color: '#f1f5f9',
          font: { family: 'Outfit', size: 13, weight: 'bold' },
        },
        grid: {
          display: false,
        },
      },
    },
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="space-y-1">
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="inline-flex items-center space-x-2 text-xs font-medium text-slate-400 hover:text-white transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center space-x-3">
            <span>Voting Results</span>
            <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold">
              Live Real-Time
            </span>
          </h1>
          <p className="text-slate-400 text-sm">
            {latestSession ? latestSession.title : 'Event Session Results'}
          </p>
        </div>

        <button
          onClick={refresh}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-sm font-semibold transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh Results</span>
        </button>
      </div>

      {/* Summary Total Votes Counter Card */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
        <div className="flex items-center space-x-5">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30 shadow-lg shadow-indigo-500/10">
            <Vote className="w-8 h-8" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Total Votes Cast
            </span>
            <span className="text-4xl font-black text-white tracking-tight">
              {totalVotes}
            </span>
          </div>
        </div>

        {breakdown[0] && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/30 text-amber-300 flex items-center space-x-3">
            <Trophy className="w-6 h-6 text-amber-400" />
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 block">Current Winner</span>
              <span className="font-bold text-sm text-white">{breakdown[0].name} ({breakdown[0].vote_count} votes)</span>
            </div>
          </div>
        )}
      </div>

      {/* Chart.js Bar Chart Card */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-indigo-400" />
            <span>Vote Distribution Chart</span>
          </h2>
          <span className="text-xs text-slate-400">Horizontal Bar View</span>
        </div>

        <div className="h-[350px] sm:h-[400px] w-full pt-4">
          {breakdown.length > 0 ? (
            <Bar
              data={chartData}
              options={chartOptions}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500 text-sm">
              No contestant data available for chart rendering.
            </div>
          )}
        </div>
      </div>

      {/* Detailed Contestant Breakdown List (Image, Name, Vote Count, Progress Bar) */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6">
        <h2 className="text-xl font-bold text-white border-b border-slate-800 pb-4 flex items-center justify-between">
          <span>Contestant Breakdown</span>
          <span className="text-xs text-slate-400 font-normal">Ranked by vote tally</span>
        </h2>

        <div className="space-y-4">
          {breakdown.map((contestant, index) => (
            <div
              key={contestant.id}
              className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 transition-all hover:border-slate-700"
            >
              {/* Contestant Image & Info */}
              <div className="flex items-center space-x-4 w-full sm:w-auto">
                <span className="w-7 h-7 rounded-full bg-slate-800 text-slate-300 font-bold text-xs flex items-center justify-center flex-shrink-0">
                  #{index + 1}
                </span>

                <img
                  src={contestant.image_url}
                  alt={contestant.name}
                  className="w-14 h-14 rounded-xl object-cover border border-slate-700 flex-shrink-0"
                />

                <div>
                  <h4 className="font-bold text-slate-100 text-base">{contestant.name}</h4>
                  <p className="text-xs text-slate-400">
                    {contestant.vote_count} {contestant.vote_count === 1 ? 'vote' : 'votes'}
                  </p>
                </div>
              </div>

              {/* Progress Bar & Percentage */}
              <div className="w-full sm:w-64 space-y-1.5 text-right">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-slate-400">Share</span>
                  <span className="text-indigo-400 font-mono">{contestant.percentage}%</span>
                </div>
                <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden border border-slate-700/50">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-700"
                    style={{ width: `${contestant.percentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
