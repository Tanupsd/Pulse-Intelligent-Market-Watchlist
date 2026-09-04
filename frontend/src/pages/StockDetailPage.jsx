import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  TrendingDown, 
  TrendingUp, 
  Clock, 
  Activity, 
  HelpCircle, 
  Newspaper, 
  ExternalLink,
  Calendar,
  AlertTriangle,
  Lock,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { stocksApi, usersApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Navbar from '../components/Navbar';
import AttentionBadge from '../components/AttentionBadge';
import DataStatusPill from '../components/DataStatusPill';
import WhyChangedModal from '../components/WhyChangedModal';
import Footer from '../components/Footer';
import { ChartSkeleton, CardSkeleton } from '../components/SkeletonLoader';

export default function StockDetailPage() {
  const { symbol } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { isDark } = useTheme();

  const [stockData, setStockData] = useState(null);
  const [events, setEvents] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  const [selectedRange, setSelectedRange] = useState('1D');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingChart, setIsLoadingChart] = useState(true);
  const [error, setError] = useState(null);
  const [showWhyModal, setShowWhyModal] = useState(false);

  // Fetch stock detail and track visit
  useEffect(() => {
    async function loadStock() {
      if (!symbol) return;
      setIsLoading(true);
      setError(null);
      try {
        const res = await stocksApi.getDetail(symbol);
        setStockData(res.data.stock);
        setEvents(res.data.events || []);

        // Record stock visit for authenticated user telemetry
        if (isAuthenticated) {
          usersApi.recordVisit(symbol).catch(() => {});
        }
      } catch (err) {
        console.error('Error loading stock detail:', err);
        setError(`Could not find details for ${symbol}.`);
      } finally {
        setIsLoading(false);
      }
    }
    loadStock();
  }, [symbol, isAuthenticated]);

  // Fetch chart history
  useEffect(() => {
    async function loadHistory() {
      if (!symbol) return;
      setIsLoadingChart(true);
      try {
        const res = await stocksApi.getHistory(symbol, selectedRange);
        setHistoryData(res.data.points || []);
      } catch (err) {
        console.error('Error loading history:', err);
      } finally {
        setIsLoadingChart(false);
      }
    }
    loadHistory();
  }, [symbol, selectedRange]);

  const stock = stockData;
  const isDrop = (stock?.sinceLastCheck || 0) < 0;
  const isGain = (stock?.sinceLastCheck || 0) > 0;
  const absDelta = Math.abs(stock?.sinceLastCheck || 0);

  const dailyDrop = (stock?.dailyChange || 0) < 0;

  // Build event timeline
  const timelineItems = [];

  if (isAuthenticated && stock) {
    // Authenticated: Include baseline checkpoint
    if (stock.hasCheckpoint && stock.checkpointTimestamp) {
      timelineItems.push({
        time: new Date(stock.checkpointTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        title: 'You last checked',
        description: `Baseline checkpoint captured at $${stock.checkpointPrice ? stock.checkpointPrice.toFixed(2) : stock.price.toFixed(2)}`,
        type: 'CHECKPOINT',
        color: 'bg-brand-500',
      });
    }

    // Volume surge signal in timeline if anomalous
    if (stock.signals?.volumeRatio >= 1.8) {
      timelineItems.push({
        time: 'During session',
        title: `Trading volume surge (${stock.signals.volumeRatio}× average)`,
        description: 'Anomalous institutional trading activity recorded above baseline.',
        type: 'VOLUME',
        color: 'bg-indigo-400',
      });
    }
  }

  // Public events (available for both public and authenticated)
  if (events && events.length > 0) {
    events.forEach(ev => {
      timelineItems.push({
        time: new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        title: ev.title,
        description: ev.description,
        type: 'EVENT',
        importance: ev.importance,
        color: ev.importance === 'CRITICAL' || ev.importance === 'HIGH' ? 'bg-rose-500' : 'bg-amber-400',
        url: ev.url,
      });
    });
  }

  // Authenticated current state marker
  if (isAuthenticated && stock && stock.sinceLastCheck !== undefined) {
    timelineItems.push({
      time: 'Now',
      title: `Current Price: $${stock.price.toFixed(2)}`,
      description: `${isDrop ? 'Down' : isGain ? 'Up' : 'Flat'} ${absDelta}% since checkpoint`,
      type: 'CURRENT',
      color: isDrop ? 'bg-rose-500' : 'bg-emerald-500',
    });
  }

  const formatMarketCap = (val) => {
    const num = Number(val || 0);
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    return `$${num.toLocaleString()}`;
  };

  const formatVolume = (val) => {
    const num = Number(val || 0);
    if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            to={isAuthenticated ? "/dashboard" : "/"}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{isAuthenticated ? "Back to Watchlist Dashboard" : "Back to Market"}</span>
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-6">
            <CardSkeleton />
            <ChartSkeleton />
          </div>
        ) : error || !stock ? (
          <div className="p-8 rounded-2xl bg-surface border border-surface-border text-center space-y-4">
            <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto" />
            <h2 className="text-lg font-bold text-white">Asset Not Found</h2>
            <p className="text-xs text-slate-400">{error || 'Unable to retrieve asset details.'}</p>
            <Link
              to={isAuthenticated ? "/dashboard" : "/"}
              className="inline-block px-4 py-2 bg-brand-500 text-white text-xs font-semibold rounded-xl"
            >
              Return to Market
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Header Card */}
            <div className="bg-surface border border-surface-border rounded-2xl p-6 shadow-xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-extrabold text-white tracking-tight">{stock.symbol}</h1>
                    {/* Attention Badge: ONLY for authenticated users */}
                    {isAuthenticated && stock.attentionScore !== undefined && (
                      <AttentionBadge severity={stock.severity} score={stock.attentionScore} />
                    )}
                    <DataStatusPill status={stock.dataStatus} timestamp={stock.timestamp} />
                  </div>
                  <p className="text-sm text-slate-400 mt-1">{stock.name} • {stock.sector}</p>
                </div>

                {/* Price & Daily Change (Public Market Data) */}
                <div className="md:text-right">
                  <div className="text-3xl font-extrabold font-mono text-white tracking-tight">
                    ${stock.price.toFixed(2)}
                  </div>
                  <div className="flex items-center md:justify-end gap-1.5 mt-0.5">
                    <span
                      className={`text-sm font-bold font-mono inline-flex items-center ${
                        dailyDrop ? 'text-rose-400' : 'text-emerald-400'
                      }`}
                    >
                      {dailyDrop ? <TrendingDown className="w-4 h-4 mr-0.5" /> : <TrendingUp className="w-4 h-4 mr-0.5" />}
                      {dailyDrop ? '' : '+'}{stock.dailyChange?.toFixed(2)}% today
                    </span>
                  </div>
                </div>
              </div>

              {/* AUTHENTICATED: SINCE LAST CHECK Matrix */}
              {isAuthenticated && stock.attentionScore !== undefined ? (
                <div className="mt-6 pt-5 border-t border-surface-border grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-surface-subtle border border-surface-border">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Then (Previous Checkpoint)
                    </span>
                    <div className="text-xl font-bold font-mono text-slate-200 mt-1">
                      ${stock.checkpointPrice ? stock.checkpointPrice.toFixed(2) : stock.price.toFixed(2)}
                    </div>
                    <span className="text-[11px] text-slate-500 mt-0.5 block">
                      {stock.hasCheckpoint ? 'Captured during prior visit' : 'Initial baseline'}
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-surface-subtle border border-surface-border">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Now (Current State)
                    </span>
                    <div className="text-xl font-bold font-mono text-white mt-1">
                      ${stock.price.toFixed(2)}
                    </div>
                    <span className="text-[11px] text-slate-500 mt-0.5 block">
                      Real-time market snapshot
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-surface-subtle border border-surface-border">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Change Since Last Check
                    </span>
                    <div className="flex items-baseline justify-between mt-1">
                      <div
                        className={`text-xl font-bold font-mono ${
                          isDrop ? 'text-rose-400' : isGain ? 'text-emerald-400' : 'text-slate-200'
                        }`}
                      >
                        {isDrop ? '-' : isGain ? '+' : ''}{absDelta.toFixed(2)}%
                      </div>
                      <button
                        onClick={() => setShowWhyModal(true)}
                        className="px-2 py-1 text-xs font-semibold text-brand-400 bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/30 rounded-lg inline-flex items-center gap-1 transition-colors"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>Why it matters</span>
                      </button>
                    </div>
                    <span className="text-[11px] text-slate-500 mt-0.5 block">
                      Attention Score: {stock.attentionScore}/100 ({stock.severity})
                    </span>
                  </div>
                </div>
              ) : (
                /* PUBLIC: General Market Overview & Checkpoint Sign-In Banner */
                <div className="mt-6 pt-5 border-t border-surface-border space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-3.5 rounded-xl bg-surface-subtle border border-surface-border">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                        Market Cap
                      </span>
                      <div className="text-base font-bold font-mono text-white mt-1">
                        {formatMarketCap(stock.marketCap)}
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-surface-subtle border border-surface-border">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                        Volume
                      </span>
                      <div className="text-base font-bold font-mono text-white mt-1">
                        {formatVolume(stock.volume)}
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-surface-subtle border border-surface-border">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                        Avg Volume (30D)
                      </span>
                      <div className="text-base font-bold font-mono text-white mt-1">
                        {formatVolume(stock.averageVolume)}
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-surface-subtle border border-surface-border">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                        Sector
                      </span>
                      <div className="text-base font-bold text-white mt-1 truncate">
                        {stock.sector || 'Equities'}
                      </div>
                    </div>
                  </div>

                  {/* Public Sign-in CTA for Personal Checkpoints */}
                  <div className="p-4 rounded-xl bg-surface-subtle/80 border border-surface-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-surface border border-surface-border flex items-center justify-center shrink-0">
                        <Lock className="w-4 h-4 text-brand-500" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white">
                          Personalized Checkpoints & Attention Scoring
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Sign in to track what changed since your last visit, inspect volume anomalies, and receive explainable alerts.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                      <Link
                        to="/login"
                        className="px-3 py-1.5 bg-white text-black font-semibold text-xs rounded-lg hover:bg-gray-200 transition-colors shadow-sm"
                      >
                        Sign In
                      </Link>
                      <Link
                        to="/register"
                        className="px-3 py-1.5 bg-surface hover:bg-surface-hover text-white text-xs font-semibold rounded-lg border border-surface-border transition-colors"
                      >
                        Create Account
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Price Chart Section */}
            <div className="bg-surface border border-surface-border rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-white tracking-tight">Price History & Trajectory</h2>
                  <p className="text-xs text-slate-400">
                    {isAuthenticated ? 'Intraday and historical checkpoint movement' : 'Intraday and historical public price trend'}
                  </p>
                </div>

                {/* Range Selector */}
                <div className="flex items-center gap-1 bg-surface-subtle p-1 rounded-xl border border-surface-border self-start">
                  {['1D', '1W', '1M', '1Y'].map((rng) => (
                    <button
                      key={rng}
                      onClick={() => setSelectedRange(rng)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                        selectedRange === rng
                          ? 'bg-brand-500 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {rng}
                    </button>
                  ))}
                </div>
              </div>

              {isLoadingChart ? (
                <ChartSkeleton />
              ) : (
                <div className="h-72 w-full pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={historyData}>
                      <defs>
                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={dailyDrop ? '#EF4444' : '#6366F1'} stopOpacity={0.4} />
                          <stop offset="95%" stopColor={dailyDrop ? '#EF4444' : '#6366F1'} stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#26282E' : '#E2E8F0'} vertical={false} />
                      <XAxis
                        dataKey="timeLabel"
                        stroke="#6B7280"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="#6B7280"
                        fontSize={11}
                        domain={['auto', 'auto']}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(val) => `$${val}`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: isDark ? '#111827' : '#FFFFFF',
                          border: isDark ? '1px solid #374151' : '1px solid #CBD5E1',
                          borderRadius: '0.75rem',
                          color: isDark ? '#F3F4F6' : '#0F172A',
                          fontSize: '12px',
                        }}
                        formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Price']}
                      />
                      <Area
                        type="monotone"
                        dataKey="price"
                        stroke={dailyDrop ? '#EF4444' : '#6366F1'}
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#colorPrice)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Trading Volume & Timeline Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Volume Visualizer */}
              <div className="bg-surface border border-surface-border rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white tracking-tight">Trading Volume Activity</h3>
                    <p className="text-xs text-slate-400">Current session volume vs. 30-day baseline</p>
                  </div>
                  {isAuthenticated && stock.signals?.volumeRatio && (
                    <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                      {stock.signals.volumeRatio}× Average
                    </span>
                  )}
                </div>

                <div className="space-y-4 pt-2">
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-slate-400 font-medium">Current Session Volume</span>
                      <span className="font-mono font-bold text-white">
                        {((stock.signals?.currentVolume || stock.volume || 0) / 1000000).toFixed(1)}M shares
                      </span>
                    </div>
                    <div className="w-full h-3 bg-surface-subtle rounded-full overflow-hidden border border-surface-border">
                      <div
                        className="h-full bg-brand-500 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, ((stock.signals?.volumeRatio || (stock.volume && stock.averageVolume ? stock.volume / stock.averageVolume : 1))) * 33)}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-slate-400 font-medium">30-Day Average Volume</span>
                      <span className="font-mono text-slate-400">
                        {((stock.signals?.averageVolume || stock.averageVolume || 0) / 1000000).toFixed(1)}M shares
                      </span>
                    </div>
                    <div className="w-full h-2 bg-surface-subtle rounded-full overflow-hidden border border-surface-border">
                      <div className="h-full bg-slate-600 rounded-full w-[33%]" />
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-surface-subtle/80 border border-surface-border text-xs text-slate-300 space-y-1">
                    <span className="font-semibold text-white block">Volume Assessment:</span>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      {stock.signals?.volumeRatio >= 2.0
                        ? `Trading activity is ${stock.signals.volumeRatio}× higher than normal baseline, indicating high institutional participation.`
                        : stock.signals?.volumeRatio >= 1.5
                        ? 'Noticeable uptick in trading turnover compared to the past 30 trading sessions.'
                        : 'Trading volume remains within standard seasonal and historical variation parameters.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Event Timeline */}
              <div className="bg-surface border border-surface-border rounded-2xl p-6 shadow-xl space-y-4">
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    {isAuthenticated ? 'Change Event Timeline' : 'Market Events & News'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {isAuthenticated
                      ? 'Chronological sequence since your checkpoint'
                      : 'Public corporate announcements and market dispatches'}
                  </p>
                </div>

                {timelineItems.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No recent events recorded for {stock.symbol}.
                  </div>
                ) : (
                  <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-surface-border">
                    {timelineItems.map((item, idx) => (
                      <div key={idx} className="relative group">
                        {/* Timeline dot */}
                        <span
                          className={`absolute -left-[27px] top-1 w-3 h-3 rounded-full border-2 border-surface ${item.color}`}
                        />
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-mono font-semibold text-slate-400">
                              {item.time}
                            </span>
                            {item.importance && (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                {item.importance}
                              </span>
                            )}
                          </div>
                          <h4 className="text-xs font-bold text-slate-100">{item.title}</h4>
                          <p className="text-xs text-slate-400 leading-relaxed">{item.description}</p>
                          {item.url && (
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] text-brand-400 hover:underline pt-1"
                            >
                              <span>Read source dispatch</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />

      {/* Why Changed Modal: ONLY for authenticated users */}
      {isAuthenticated && (
        <WhyChangedModal
          stock={stock}
          isOpen={showWhyModal}
          onClose={() => setShowWhyModal(false)}
        />
      )}
    </div>
  );
}
