import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Shield, UserCheck, LogOut, Home, BarChart3 } from 'lucide-react';
import { AwsLogo } from './AwsLogo';
import { authService } from '../services/auth';
import toast from 'react-hot-toast';

export const Navbar = ({ activeSession }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isAuth = authService.isAdminAuthenticated();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const showAdminControls = isAuth && isAdminRoute && location.pathname !== '/admin/login';

  const handleLogout = () => {
    authService.logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 glass-panel">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link to="/" className="flex items-center space-x-3.5 group">
          <div className="flex items-center justify-center py-1.5 px-3 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-md group-hover:scale-105 transition-transform duration-300">
            <AwsLogo className="h-8 sm:h-9 w-auto" />
          </div>
          <div>
            <span className="font-extrabold text-lg bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent tracking-tight">
              VoteLive
            </span>
            <span className="block text-[10px] text-amber-400 font-bold tracking-wider uppercase -mt-1">
              AWS Event Platform
            </span>
          </div>
        </Link>

        {/* Status Indicator & Controls */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          
          {/* Active Session Pill */}
          {activeSession ? (
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Voting Active</span>
            </div>
          ) : (
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span>No Active Session</span>
            </div>
          )}

          {/* Admin Navigation Quick Controls */}
          {showAdminControls && (
            <nav className="flex items-center space-x-1 sm:space-x-2">
              <Link
                to="/admin/dashboard"
                className={`p-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === '/admin/dashboard'
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
                title="Admin Dashboard"
              >
                <Home className="w-4 h-4" />
              </Link>
              
              <Link
                to="/admin/results"
                className={`p-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === '/admin/results'
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
                title="View Results"
              >
                <BarChart3 className="w-4 h-4" />
              </Link>

              <button
                onClick={handleLogout}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 border border-rose-500/20 transition-all ml-1"
                title="Logout"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Logout</span>
              </button>
            </nav>
          )}

          {/* Role Status Badge */}
          <Link
            to="/"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 text-xs font-medium transition-all"
          >
            {showAdminControls ? (
              <>
                <Shield className="w-3.5 h-3.5 text-indigo-400" />
                <span>Admin Portal</span>
              </>
            ) : (
              <>
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Voter Portal</span>
              </>
            )}
          </Link>

        </div>

      </div>
    </header>
  );
};
