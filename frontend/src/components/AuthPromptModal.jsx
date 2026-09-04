import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function AuthPromptModal({ isOpen, onClose }) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div 
        className="relative w-full max-w-md bg-surface border border-surface-border rounded-xl shadow-2xl p-6 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle Top Indicator Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gray-600 via-white to-gray-600" />

        <div className="flex items-center justify-between pb-4 border-b border-surface-border">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-surface-subtle border border-surface-border flex items-center justify-center text-white font-bold text-sm">
              P
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Watchlists & Checkpoints</h3>
              <p className="text-xs text-gray-400">Account required for personalized monitoring</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-surface-subtle text-lg leading-none"
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>

        <div className="py-5 space-y-3">
          <p className="text-sm text-gray-300 leading-relaxed">
            Pulse watchlists are built around <strong className="text-white">checkpoints</strong>. We track your last visited state to calculate exactly what meaningfully changed while you were away.
          </p>
          <div className="p-3.5 bg-surface-subtle border border-surface-border rounded-lg space-y-2 text-xs text-gray-300">
            <div className="flex items-center space-x-2 text-gray-200 font-medium">
              <span className="w-2 h-2 rounded-full bg-market-gain"></span>
              <span>Personalized "Since Your Last Check" diffs</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-200 font-medium">
              <span className="w-2 h-2 rounded-full bg-severity-important"></span>
              <span>Explainable Attention Scores & Volume Anomalies</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-200 font-medium">
              <span className="w-2 h-2 rounded-full bg-white"></span>
              <span>Multi-watchlist custom portfolios</span>
            </div>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={() => {
              onClose();
              navigate('/login');
            }}
            className="w-full sm:flex-1 py-2.5 px-4 bg-white text-black font-semibold text-sm rounded-lg hover:bg-gray-200 transition-colors shadow"
          >
            Sign In
          </button>
          <button
            onClick={() => {
              onClose();
              navigate('/register');
            }}
            className="w-full sm:flex-1 py-2.5 px-4 bg-surface-subtle hover:bg-surface-active text-white border border-surface-border font-semibold text-sm rounded-lg transition-colors"
          >
            Create Account
          </button>
        </div>

        <div className="mt-4 text-center">
          <button
            onClick={onClose}
            className="text-xs text-gray-400 hover:text-gray-200 transition-colors"
          >
            Continue browsing public markets
          </button>
        </div>
      </div>
    </div>
  );
}
