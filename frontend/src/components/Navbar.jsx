import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Activity, Search, LogOut, User, BarChart2, ChevronDown, Zap, SlidersHorizontal, ArrowRight, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { stocksApi, marketApi } from '../services/api';
import AuthPromptModal from './AuthPromptModal';

export default function Navbar({ onScenarioChange = null }) {
  const { user, isAuthenticated, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const [providerMode, setProviderMode] = useState('live'); // 'live' | 'mock'
  const [currentScenario, setCurrentScenario] = useState('demo');
  const [isSwitching, setIsSwitching] = useState(false);

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const searchRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    marketApi.getProvider()
      .then(res => {
        if (res.data.mode) setProviderMode(res.data.mode);
        if (res.data.scenario) setCurrentScenario(res.data.scenario);
      })
      .catch(() => {});
  }, []);

  // Debounced search across live market & catalog
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await stocksApi.search(searchQuery.trim());
        setSearchResults(res.data.results || []);
        setShowResults(true);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowResults(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSwitchProvider = async (newMode) => {
    setIsSwitching(true);
    try {
      await marketApi.setProvider(newMode);
      setProviderMode(newMode);
      if (onScenarioChange) onScenarioChange();
    } catch (err) {
      console.error('Failed to change provider mode:', err);
    } finally {
      setIsSwitching(false);
    }
  };

  const handleSwitchScenario = async (newScenario) => {
    setIsSwitching(true);
    try {
      await marketApi.setScenario(newScenario);
      setCurrentScenario(newScenario);
      if (onScenarioChange) onScenarioChange();
    } catch (err) {
      console.error('Failed to change scenario:', err);
    } finally {
      setIsSwitching(false);
    }
  };

  const handleWatchlistClick = (e) => {
    if (!isAuthenticated) {
      e.preventDefault();
      setIsAuthModalOpen(true);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-surface-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Left: Brand Logo & Navigation Links */}
          <div className="flex items-center gap-6 shrink-0">
            <Link to={isAuthenticated ? "/dashboard" : "/"} className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-surface-subtle border border-surface-border flex items-center justify-center text-white group-hover:border-gray-400 transition-colors">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-bold tracking-tight text-white">Pulse</span>
                  <span className="text-[10px] uppercase font-mono tracking-wider px-1.5 py-0.5 rounded bg-surface-subtle text-gray-300 border border-surface-border">
                    MVP
                  </span>
                </div>
              </div>
            </Link>

            {/* Core Nav Links */}
            <nav className="hidden md:flex items-center space-x-1">
              <Link
                to="/"
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  location.pathname === '/' 
                    ? 'text-white bg-surface-subtle border border-surface-border' 
                    : 'text-gray-400 hover:text-white hover:bg-surface-subtle/50'
                }`}
              >
                Markets
              </Link>
              <Link
                to="/compare"
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  location.pathname === '/compare' 
                    ? 'text-white bg-surface-subtle border border-surface-border' 
                    : 'text-gray-400 hover:text-white hover:bg-surface-subtle/50'
                }`}
              >
                Comparison
              </Link>
              <button
                type="button"
                onClick={handleWatchlistClick}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  location.pathname === '/dashboard' 
                    ? 'text-white bg-surface-subtle border border-surface-border' 
                    : 'text-gray-400 hover:text-white hover:bg-surface-subtle/50'
                }`}
              >
                Watchlists
              </button>
            </nav>
          </div>

          {/* Center: Search Bar (Global for both authenticated & public) */}
          <div className="flex-1 max-w-sm relative hidden sm:block" ref={searchRef}>
            <div className="relative">
              <Search className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 ${isSearching ? 'text-white animate-pulse' : 'text-gray-500'}`} />
              <input
                type="text"
                placeholder="Search symbol or company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => { if (searchResults.length > 0) setShowResults(true); }}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-surface-subtle border border-surface-border rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-gray-400 transition-colors"
              />
            </div>

            {/* Autocomplete Dropdown */}
            {showResults && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-surface border border-surface-border rounded-lg shadow-2xl overflow-hidden z-50 max-h-80 flex flex-col">
                <div className="p-2 border-b border-surface-border flex items-center justify-between text-[11px] font-semibold text-gray-400 uppercase tracking-wider bg-surface-subtle">
                  <span>Results ({searchResults.length})</span>
                  <span className="text-[10px] text-gray-400 lowercase">select stock</span>
                </div>
                <div className="overflow-y-auto divide-y divide-surface-border">
                  {searchResults.length === 0 ? (
                    <div className="p-4 text-center text-xs text-gray-400">
                      No matching stocks found.
                    </div>
                  ) : (
                    searchResults.map((stock) => (
                      <div
                        key={stock.symbol}
                        onClick={() => {
                          setShowResults(false);
                          setSearchQuery('');
                          navigate(`/stocks/${stock.symbol}`);
                        }}
                        className="p-2.5 hover:bg-surface-hover cursor-pointer flex items-center justify-between transition-colors group"
                      >
                        <div className="min-w-0 pr-3">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-xs font-mono">
                              {stock.symbol}
                            </span>
                            <span className="text-xs text-gray-300 truncate">{stock.name}</span>
                          </div>
                          <span className="text-[10px] text-gray-500">{stock.sector}</span>
                        </div>
                        <span className="text-[10px] font-medium text-gray-300 bg-surface-subtle px-2 py-0.5 rounded border border-surface-border group-hover:bg-white group-hover:text-black transition-colors">
                          View →
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right: State-dependent Actions */}
          <div className="flex items-center gap-3">
            {/* Market Provider Mode Switcher (always visible for hackathon judging) */}
            <div className="flex items-center bg-surface-subtle border border-surface-border rounded-lg p-0.5 text-xs">
              <button
                onClick={() => handleSwitchProvider('live')}
                disabled={isSwitching}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                  providerMode === 'live'
                    ? 'bg-white text-black font-semibold'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="Real-time live quotes via Yahoo Finance"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${providerMode === 'live' ? 'bg-market-gain animate-pulse' : 'bg-gray-500'}`} />
                <span className="hidden sm:inline">Live</span>
              </button>

              <button
                onClick={() => handleSwitchProvider('mock')}
                disabled={isSwitching}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                  providerMode === 'mock'
                    ? 'bg-white text-black font-semibold'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="Deterministic mock scenarios for testing"
              >
                <Zap className="w-3 h-3" />
                <span className="hidden sm:inline">Demo</span>
              </button>
            </div>

            {/* Sub-scenario buttons when in Demo mode */}
            {providerMode === 'mock' && (
              <div className="hidden lg:flex items-center gap-1 bg-surface-subtle border border-surface-border rounded-lg p-0.5 text-[11px]">
                {['demo', 'quiet', 'volatile'].map((sc) => (
                  <button
                    key={sc}
                    onClick={() => handleSwitchScenario(sc)}
                    className={`px-2 py-0.5 rounded capitalize ${
                      currentScenario === sc 
                        ? 'bg-surface text-white font-bold border border-surface-border' 
                        : 'text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    {sc}
                  </button>
                ))}
              </div>
            )}

            {/* Theme Toggle Switcher */}
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-lg border border-surface-border bg-surface-subtle hover:bg-surface-hover transition-colors text-gray-400 hover:text-white"
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label="Toggle theme"
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>

            {/* Auth / Profile Area */}
            {isAuthenticated ? (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center space-x-2 p-1.5 rounded-lg border border-surface-border bg-surface-subtle hover:bg-surface-hover transition-colors text-left"
                  aria-expanded={isProfileMenuOpen}
                >
                  <div className="w-7 h-7 rounded-md bg-white text-black flex items-center justify-center font-bold text-xs">
                    {(user?.name ? user.name.charAt(0) : user?.email?.charAt(0) || 'U').toUpperCase()}
                  </div>
                  <div className="hidden md:block pr-1 text-left">
                    <p className="text-xs font-medium text-white truncate max-w-[110px]">
                      {user?.name || user?.email?.split('@')[0]}
                    </p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                </button>

                {/* Profile Dropdown Menu */}
                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-surface border border-surface-border rounded-lg shadow-xl py-1 z-50 animate-fadeIn">
                    <div className="px-4 py-2 border-b border-surface-border">
                      <p className="text-xs font-semibold text-white truncate">{user?.name || 'Investor'}</p>
                      <p className="text-[11px] text-gray-400 truncate">{user?.email}</p>
                    </div>
                    
                    <Link
                      to="/profile"
                      onClick={() => setIsProfileMenuOpen(false)}
                      className="flex items-center space-x-2.5 px-4 py-2 text-xs text-gray-300 hover:text-white hover:bg-surface-subtle transition-colors"
                    >
                      <User className="w-3.5 h-3.5 text-gray-400" />
                      <span>Profile and Analysis</span>
                    </Link>

                    <div className="border-t border-surface-border my-1" />

                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        logout();
                        navigate('/');
                      }}
                      className="w-full text-left flex items-center space-x-2.5 px-4 py-2 text-xs text-severity-critical hover:bg-surface-subtle transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-3 py-1.5 text-xs font-medium text-gray-300 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-3 py-1.5 bg-white text-black font-semibold text-xs rounded-lg hover:bg-gray-200 transition-colors shadow-sm"
                >
                  Get Started
                </Link>
              </div>
            )}

          </div>

        </div>
      </header>

      {/* Auth Prompt Modal */}
      <AuthPromptModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </>
  );
}
