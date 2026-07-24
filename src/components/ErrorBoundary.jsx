import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled Application Error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
          <div className="max-w-md w-full glass-card rounded-3xl p-8 border border-slate-800 text-center space-y-6 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/30">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white">Something Went Wrong</h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                An unforeseen rendering error occurred. Don't worry, you can return to the home screen or reload the app.
              </p>
              {this.state.error && (
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-rose-300 text-left overflow-auto max-h-28">
                  {this.state.error.toString()}
                </div>
              )}
            </div>

            <button
              onClick={this.handleReload}
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-lg flex items-center justify-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Return to Home Screen</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
