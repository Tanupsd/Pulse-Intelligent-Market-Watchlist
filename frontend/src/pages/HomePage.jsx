import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, ArrowRight, CheckCircle2, Zap, Shield, RefreshCw, BarChart2, Eye } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { marketApi } from '../services/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SkeletonLoader from '../components/SkeletonLoader';

export default function HomePage() {
  const { user, isAuthenticated, login, register } = useAuth();
  const navigate = useNavigate();

  // Top rankings states
  const [topPerformers, setTopPerformers] = useState([]);
  const [topLosers, setTopLosers] = useState([]);
  const [loadingRankings, setLoadingRankings] = useState(true);

  // "View More" 50 stocks state
  const [extendedStocks, setExtendedStocks] = useState([]);
  const [extendedType, setExtendedType] = useState('gainers'); // 'gainers' | 'losers'
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasLoadedMore, setHasLoadedMore] = useState(false);

  // Quick Auth Card State
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authError, setAuthError] = useState('');
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);

  // Fetch initial top 5 performers and top 5 losers
  useEffect(() => {
    async function fetchRankings() {
      setLoadingRankings(true);
      try {
        const [perfRes, losersRes] = await Promise.all([
          marketApi.getTopPerformers(5, 0),
          marketApi.getTopLosers(5, 0),
        ]);
        setTopPerformers(perfRes.data.items || []);
        setTopLosers(losersRes.data.items || []);
      } catch (err) {
        console.error('Failed to load top market movers:', err);
      } finally {
        setLoadingRankings(false);
      }
    }
    fetchRankings();
  }, []);

  // Handle "View More" 50 stocks
  const handleLoadMore = async (type = 'gainers') => {
    setIsLoadingMore(true);
    setExtendedType(type);
    try {
      if (type === 'gainers') {
        const res = await marketApi.getTopPerformers(50, 5);
        setExtendedStocks(res.data.items || []);
      } else {
        const res = await marketApi.getTopLosers(50, 5);
        setExtendedStocks(res.data.items || []);
      }
      setHasLoadedMore(true);
    } catch (err) {
      console.error('Failed to load extended market universe:', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Quick Auth Submit
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setIsSubmittingAuth(true);
    try {
      if (authMode === 'login') {
        await login(authEmail, authPassword);
      } else {
        await register(authEmail, authPassword, authName);
      }
      navigate('/dashboard');
    } catch (err) {
      setAuthError(err.response?.data?.error || 'Authentication failed. Please check your details.');
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  // 1-Click Demo Login
  const handleDemoLogin = async () => {
    setAuthError('');
    setIsSubmittingAuth(true);
    try {
      await login('demo@example.com', 'password123');
      navigate('/dashboard');
    } catch (err) {
      setAuthError('Demo account login failed.');
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const formatPrice = (val) => Number(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formatVolume = (val) => {
    const num = Number(val || 0);
    if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <div className="min-h-screen bg-background text-gray-100 flex flex-col">
      <Navbar />
      {/* Main Hero & Market Movers Grid */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 w-full">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Hero Pitch & Quick Access (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Value Proposition */}
            <div className="space-y-4">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-surface-subtle border border-surface-border text-xs font-mono text-gray-300">
                <span className="w-2 h-2 rounded-full bg-market-gain"></span>
                <span>Pulse</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
                See what changed. <br />
                <span className="text-gray-400">Know what matters.</span>
              </h1>

              <p className="text-sm sm:text-base text-gray-400 leading-relaxed">
                A normal watchlist tells you what stocks are doing right now. <strong className="text-white">Pulse</strong> tells you what meaningfully changed while you were away with personalized checkpoints and explainable Attention Scores.
              </p>
            </div>

            {/* Quick Auth / Get Started Box */}
            <div className="bg-surface border border-surface-border rounded-xl p-5 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-gray-700 via-white to-gray-700" />

              {isAuthenticated ? (
                <div className="space-y-4 py-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-surface-subtle border border-surface-border flex items-center justify-center text-white font-bold">
                      {(user?.name ? user.name.charAt(0) : user?.email?.charAt(0) || 'U').toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Signed in as</p>
                      <h3 className="text-sm font-bold text-white">{user?.name || user?.email}</h3>
                    </div>
                  </div>

                  <div className="p-3 bg-surface-subtle border border-surface-border rounded-lg text-xs text-gray-300 space-y-1">
                    <p className="font-semibold text-white">Your Checkpoints Active</p>
                    <p className="text-[11px] text-gray-400">Watchlists are evaluating signals against your previous checkpoint timestamps.</p>
                  </div>

                  <Link
                    to="/dashboard"
                    className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-white text-black font-semibold text-sm rounded-lg hover:bg-gray-200 transition-colors shadow"
                  >
                    <span>Open Your Watchlists</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Mode Tabs: Login vs Register */}
                  <div className="flex items-center justify-between border-b border-surface-border pb-3">
                    <div className="flex items-center space-x-4">
                      <button
                        type="button"
                        onClick={() => { setAuthMode('login'); setAuthError(''); }}
                        className={`text-xs font-bold transition-colors pb-1 ${
                          authMode === 'login'
                            ? 'text-white border-b-2 border-white'
                            : 'text-gray-400 hover:text-gray-200'
                        }`}
                      >
                        Sign In
                      </button>
                      <button
                        type="button"
                        onClick={() => { setAuthMode('register'); setAuthError(''); }}
                        className={`text-xs font-bold transition-colors pb-1 ${
                          authMode === 'register'
                            ? 'text-white border-b-2 border-white'
                            : 'text-gray-400 hover:text-gray-200'
                        }`}
                      >
                        Create Account
                      </button>
                    </div>

                    {/* 1-Click Demo Button */}
                    <button
                      type="button"
                      onClick={handleDemoLogin}
                      disabled={isSubmittingAuth}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 bg-surface-subtle hover:bg-surface-active border border-surface-border rounded text-[11px] font-semibold text-gray-200 transition-colors"
                      title="Instant demo credentials: demo@example.com"
                    >
                      <Zap className="w-3 h-3 text-white" />
                      <span>1-Click Demo</span>
                    </button>
                  </div>

                  {authError && (
                    <div className="p-2.5 bg-severity-critical/10 border border-severity-critical/20 rounded text-xs text-severity-critical">
                      {authError}
                    </div>
                  )}

                  <form onSubmit={handleAuthSubmit} className="space-y-3">
                    {authMode === 'register' && (
                      <div>
                        <label className="block text-[11px] font-medium text-gray-400 mb-1">Full Name</label>
                        <input
                          type="text"
                          required
                          value={authName}
                          onChange={(e) => setAuthName(e.target.value)}
                          placeholder="Jane Doe"
                          className="w-full px-3 py-1.5 text-xs bg-surface-subtle border border-surface-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-400"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-[11px] font-medium text-gray-400 mb-1">Email Address</label>
                      <input
                        type="email"
                        required
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        placeholder="investor@example.com"
                        className="w-full px-3 py-1.5 text-xs bg-surface-subtle border border-surface-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-400"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-gray-400 mb-1">Password</label>
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3 py-1.5 text-xs bg-surface-subtle border border-surface-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-400"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingAuth}
                      className="w-full py-2.5 px-4 bg-white text-black font-semibold text-xs rounded-lg hover:bg-gray-200 transition-colors shadow flex items-center justify-center space-x-1.5 mt-2"
                    >
                      {isSubmittingAuth ? (
                        <span>Processing...</span>
                      ) : (
                        <>
                          <span>{authMode === 'login' ? 'Sign In' : 'Create Free Account'}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Quick Feature Pillars */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 bg-surface border border-surface-border rounded-lg">
                <div className="text-white font-semibold text-xs flex items-center space-x-1.5 mb-1">
                  <BarChart2 className="w-3.5 h-3.5 text-gray-400" />
                  <span>Public Comparison</span>
                </div>
                <p className="text-[11px] text-gray-400">
                  Compare multiple stocks side-by-side with interactive charts without login.
                </p>
              </div>

              <div className="p-3 bg-surface border border-surface-border rounded-lg">
                <div className="text-white font-semibold text-xs flex items-center space-x-1.5 mb-1">
                  <Shield className="w-3.5 h-3.5 text-gray-400" />
                  <span>Non-Causal Insights</span>
                </div>
                <p className="text-[11px] text-gray-400">
                  Strictly explains price, volume, and event co-occurrences without false causality.
                </p>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Live Market Sections (Top 5 Performers & Losers) (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Section Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Market Movers</h2>
                <p className="text-xs text-gray-400">Ranked strictly by daily percentage change</p>
              </div>
              <Link
                to="/compare"
                className="text-xs text-gray-300 hover:text-white flex items-center space-x-1 font-medium bg-surface-subtle px-3 py-1.5 rounded-lg border border-surface-border transition-colors"
              >
                <span>Stock Comparison</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {loadingRankings ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SkeletonLoader count={5} />
                <SkeletonLoader count={5} />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Top 5 Performers Card */}
                <div className="bg-surface border border-surface-border rounded-xl p-4 shadow flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-surface-border mb-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 rounded bg-market-gain/10 border border-market-gain/20 flex items-center justify-center text-market-gain">
                          <TrendingUp className="w-3.5 h-3.5" />
                        </div>
                        <h3 className="text-xs font-bold text-white uppercase tracking-wider">Top 5 Performers</h3>
                      </div>
                      <span className="text-[10px] text-gray-500 font-mono">gainers</span>
                    </div>

                    <div className="divide-y divide-surface-border">
                      {topPerformers.map((stock) => (
                        <div
                          key={stock.symbol}
                          onClick={() => navigate(`/stocks/${stock.symbol}`)}
                          className="py-2.5 flex items-center justify-between hover:bg-surface-hover px-2 -mx-2 rounded cursor-pointer transition-colors group"
                        >
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-mono font-bold text-xs text-white group-hover:text-gray-300">
                                {stock.symbol}
                              </span>
                              <span className="text-[11px] text-gray-400 truncate max-w-[110px]">
                                {stock.name}
                              </span>
                            </div>
                            <span className="text-[10px] text-gray-500">Vol: {formatVolume(stock.volume)}</span>
                          </div>

                          <div className="text-right">
                            <div className="font-mono text-xs font-semibold text-white">
                              ${formatPrice(stock.price)}
                            </div>
                            <div className="font-mono text-xs font-bold text-market-gain">
                              +{stock.changePercent > 0 ? stock.changePercent.toFixed(2) : stock.changePercent}%
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-surface-border mt-2">
                    <button
                      onClick={() => handleLoadMore('gainers')}
                      disabled={isLoadingMore}
                      className="w-full py-1.5 px-3 bg-surface-subtle hover:bg-surface-active text-gray-300 hover:text-white border border-surface-border text-xs font-medium rounded transition-colors flex items-center justify-center space-x-1"
                    >
                      <span>View More Gainers (50+)</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Top 5 Losers Card */}
                <div className="bg-surface border border-surface-border rounded-xl p-4 shadow flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-surface-border mb-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 rounded bg-market-loss/10 border border-market-loss/20 flex items-center justify-center text-market-loss">
                          <TrendingDown className="w-3.5 h-3.5" />
                        </div>
                        <h3 className="text-xs font-bold text-white uppercase tracking-wider">Top 5 Losers</h3>
                      </div>
                      <span className="text-[10px] text-gray-500 font-mono">decliners</span>
                    </div>

                    <div className="divide-y divide-surface-border">
                      {topLosers.map((stock) => (
                        <div
                          key={stock.symbol}
                          onClick={() => navigate(`/stocks/${stock.symbol}`)}
                          className="py-2.5 flex items-center justify-between hover:bg-surface-hover px-2 -mx-2 rounded cursor-pointer transition-colors group"
                        >
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-mono font-bold text-xs text-white group-hover:text-gray-300">
                                {stock.symbol}
                              </span>
                              <span className="text-[11px] text-gray-400 truncate max-w-[110px]">
                                {stock.name}
                              </span>
                            </div>
                            <span className="text-[10px] text-gray-500">Vol: {formatVolume(stock.volume)}</span>
                          </div>

                          <div className="text-right">
                            <div className="font-mono text-xs font-semibold text-white">
                              ${formatPrice(stock.price)}
                            </div>
                            <div className="font-mono text-xs font-bold text-market-loss">
                              {stock.changePercent.toFixed(2)}%
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-surface-border mt-2">
                    <button
                      onClick={() => handleLoadMore('losers')}
                      disabled={isLoadingMore}
                      className="w-full py-1.5 px-3 bg-surface-subtle hover:bg-surface-active text-gray-300 hover:text-white border border-surface-border text-xs font-medium rounded transition-colors flex items-center justify-center space-x-1"
                    >
                      <span>View More Losers (50+)</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

              </div>
            )}

            {/* Asynchronously Loaded Extended Universe (50+ Stocks) */}
            {hasLoadedMore && (
              <div className="bg-surface border border-surface-border rounded-xl p-5 shadow space-y-4 animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-surface-border">
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      Extended Market Universe ({extendedStocks.length} Stocks)
                    </h3>
                    <p className="text-[11px] text-gray-400">
                      Loaded asynchronously without page reload
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleLoadMore('gainers')}
                      className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                        extendedType === 'gainers'
                          ? 'bg-white text-black font-semibold'
                          : 'bg-surface-subtle text-gray-400 hover:text-white border border-surface-border'
                      }`}
                    >
                      Gainers
                    </button>
                    <button
                      onClick={() => handleLoadMore('losers')}
                      className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                        extendedType === 'losers'
                          ? 'bg-white text-black font-semibold'
                          : 'bg-surface-subtle text-gray-400 hover:text-white border border-surface-border'
                      }`}
                    >
                      Losers
                    </button>
                  </div>
                </div>

                {isLoadingMore ? (
                  <SkeletonLoader count={6} />
                ) : (
                  <div className="overflow-x-auto max-h-96">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-surface-border text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                          <th className="py-2.5 px-3">Stock</th>
                          <th className="py-2.5 px-3">Sector</th>
                          <th className="py-2.5 px-3 text-right">Price</th>
                          <th className="py-2.5 px-3 text-right">Change %</th>
                          <th className="py-2.5 px-3 text-right">Volume</th>
                          <th className="py-2.5 px-3 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-border text-xs font-mono">
                        {extendedStocks.map((st) => (
                          <tr
                            key={st.symbol}
                            className="hover:bg-surface-hover cursor-pointer transition-colors"
                            onClick={() => navigate(`/stocks/${st.symbol}`)}
                          >
                            <td className="py-2.5 px-3">
                              <div className="font-bold text-white">{st.symbol}</div>
                              <div className="text-[10px] text-gray-400 font-sans truncate max-w-[130px]">{st.name}</div>
                            </td>
                            <td className="py-2.5 px-3 font-sans text-[11px] text-gray-400">
                              {st.sector || 'Equities'}
                            </td>
                            <td className="py-2.5 px-3 text-right text-white font-semibold">
                              ${formatPrice(st.price)}
                            </td>
                            <td className={`py-2.5 px-3 text-right font-bold ${st.changePercent >= 0 ? 'text-market-gain' : 'text-market-loss'}`}>
                              {st.changePercent >= 0 ? `+${st.changePercent.toFixed(2)}%` : `${st.changePercent.toFixed(2)}%`}
                            </td>
                            <td className="py-2.5 px-3 text-right text-gray-400">
                              {formatVolume(st.volume)}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className="text-[10px] font-sans px-2 py-0.5 rounded bg-surface-subtle border border-surface-border text-gray-300 hover:text-white">
                                View
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

          </div>

        </div>

      </main>
      <Footer />
    </div>
  );
}
