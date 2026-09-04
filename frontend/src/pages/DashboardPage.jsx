import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  RefreshCw, 
  Plus, 
  AlertCircle, 
  TrendingDown, 
  TrendingUp,
  CheckCheck,
  ChevronRight
} from 'lucide-react';
import { watchlistApi } from '../services/api';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import StockCard from '../components/StockCard';
import AddStockModal from '../components/AddStockModal';
import Footer from '../components/Footer';
import { CardSkeleton, SummarySkeleton } from '../components/SkeletonLoader';

export default function DashboardPage() {
  const navigate = useNavigate();

  const [watchlists, setWatchlists] = useState([]);
  const [activeWatchlistId, setActiveWatchlistId] = useState(null);
  const [summaryData, setSummaryData] = useState(null);

  const [isLoadingWatchlists, setIsLoadingWatchlists] = useState(true);
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const [isUpdatingCheckpoint, setIsUpdatingCheckpoint] = useState(false);
  const [error, setError] = useState(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // 1. Fetch user's watchlists
  const fetchWatchlists = async () => {
    try {
      const res = await watchlistApi.getAll();
      const lists = res.data.watchlists || [];
      setWatchlists(lists);

      if (lists.length > 0 && !activeWatchlistId) {
        setActiveWatchlistId(lists[0].id);
      }
    } catch (err) {
      console.error('Failed to load watchlists:', err);
      setError('Failed to load watchlists.');
    } finally {
      setIsLoadingWatchlists(false);
    }
  };

  useEffect(() => {
    fetchWatchlists();
  }, []);

  // 2. Fetch summary whenever activeWatchlistId changes
  const fetchSummary = async (watchlistId) => {
    if (!watchlistId) return;
    setIsLoadingSummary(true);
    setError(null);
    try {
      const res = await watchlistApi.getSummary(watchlistId);
      setSummaryData(res.data);
    } catch (err) {
      console.error('Failed to load summary:', err);
      setError('Failed to load watchlist summary.');
    } finally {
      setIsLoadingSummary(false);
    }
  };

  useEffect(() => {
    if (activeWatchlistId) {
      fetchSummary(activeWatchlistId);
    }
  }, [activeWatchlistId]);

  // Handle Mark as Reviewed / Update Checkpoint
  const handleUpdateCheckpoint = async () => {
    if (!activeWatchlistId) return;
    setIsUpdatingCheckpoint(true);
    try {
      await watchlistApi.updateCheckpoint(activeWatchlistId);
      // Refetch summary so changes recalculate against the new checkpoint
      await fetchSummary(activeWatchlistId);
    } catch (err) {
      console.error('Failed to update checkpoint:', err);
    } finally {
      setIsUpdatingCheckpoint(false);
    }
  };

  const handleRemoveStock = async (symbol) => {
    if (!activeWatchlistId) return;
    try {
      await watchlistApi.removeStock(activeWatchlistId, symbol);
      await fetchSummary(activeWatchlistId);
      await fetchWatchlists();
    } catch (err) {
      console.error('Failed to remove stock:', err);
    }
  };

  const handleStockAdded = async () => {
    if (activeWatchlistId) {
      await fetchSummary(activeWatchlistId);
      await fetchWatchlists();
    }
  };

  const formatLastChecked = (isoString) => {
    if (!isoString) return 'First visit (establishing initial checkpoint)';
    const date = new Date(isoString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return isToday ? `Today, ${timeStr}` : `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${timeStr}`;
  };

  const meaningfulCount = summaryData?.meaningfulChanges ?? 0;
  const stocks = summaryData?.stocks || [];
  const attention = summaryData?.attention || { critical: 0, important: 0, watch: 0, normal: 0 };
  const benchmark = summaryData?.benchmark;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar onScenarioChange={() => activeWatchlistId && fetchSummary(activeWatchlistId)} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Sidebar */}
          <Sidebar
            watchlists={watchlists}
            activeWatchlistId={activeWatchlistId}
            onSelectWatchlist={(id) => setActiveWatchlistId(id)}
            onRefreshWatchlists={fetchWatchlists}
          />

          {/* Main Content Area */}
          <div className="flex-1 w-full space-y-6">
            {/* Header / Since Last Check Hero Banner */}
            {isLoadingSummary ? (
              <SummarySkeleton />
            ) : error ? (
              <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5" />
                  <span>{error}</span>
                </div>
                <button
                  onClick={() => fetchSummary(activeWatchlistId)}
                  className="px-3 py-1 bg-surface rounded-lg text-xs font-semibold text-white hover:bg-surface-hover"
                >
                  Retry
                </button>
              </div>
            ) : (
              <div className="bg-surface border border-surface-border rounded-2xl p-6 shadow-xl relative overflow-hidden">
                {/* Background ambient glow */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/5 rounded-full blur-3xl pointer-events-none" />

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      <Clock className="w-3.5 h-3.5 text-brand-500" />
                      <span>Last checked:</span>
                      <span className="text-slate-200 font-mono">
                        {formatLastChecked(summaryData?.lastCheckedAt)}
                      </span>
                    </div>

                    <div className="mt-2 flex items-baseline gap-3">
                      <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                        {meaningfulCount === 0 ? (
                          <span>Watchlist is relatively quiet</span>
                        ) : (
                          <span>
                            <span className="text-brand-400">{meaningfulCount}</span> meaningful change{meaningfulCount !== 1 ? 's' : ''} since your last check
                          </span>
                        )}
                      </h1>
                    </div>

                    {/* Attention Breakdown Badges */}
                    <div className="mt-3.5 flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 font-medium">
                        <span className="w-2 h-2 rounded-full bg-rose-500" />
                        <span className="font-bold font-mono">{attention.critical}</span> Critical
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-medium">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        <span className="font-bold font-mono">{attention.important}</span> Important
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 font-medium">
                        <span className="w-2 h-2 rounded-full bg-yellow-500" />
                        <span className="font-bold font-mono">{attention.watch}</span> Watch
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-medium">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="font-bold font-mono">{attention.normal}</span> Normal
                      </span>

                      {benchmark && (
                        <span className="hidden sm:inline-flex items-center gap-1 text-slate-400 ml-auto text-[11px] font-mono">
                          Benchmark (SPY): {benchmark.changePercent >= 0 ? '+' : ''}{benchmark.changePercent}%
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions: Mark as Reviewed & Add Stock */}
                  <div className="flex flex-row md:flex-col sm:items-end gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-surface-border">
                    <button
                      onClick={handleUpdateCheckpoint}
                      disabled={isUpdatingCheckpoint || stocks.length === 0}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-surface-subtle hover:bg-surface-hover active:scale-[0.99] text-slate-200 border border-surface-border transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
                      title="Update checkpoint to current market state"
                    >
                      <CheckCheck className={`w-4 h-4 text-emerald-400 ${isUpdatingCheckpoint ? 'animate-spin' : ''}`} />
                      <span>{isUpdatingCheckpoint ? 'Updating...' : 'Mark as Reviewed'}</span>
                    </button>

                    <button
                      onClick={() => setIsAddModalOpen(true)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-brand-500 hover:bg-brand-600 active:scale-[0.99] text-white transition-all flex items-center gap-1.5 shadow-lg shadow-brand-500/20"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Stock</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Stocks List Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                    {summaryData?.watchlist?.name || 'Watchlist Assets'}
                  </h2>
                  <span className="text-xs text-slate-400">
                    ({stocks.length} tracked • ranked by Attention Score)
                  </span>
                </div>
              </div>

              {isLoadingSummary ? (
                <div className="grid grid-cols-1 gap-4">
                  <CardSkeleton />
                  <CardSkeleton />
                  <CardSkeleton />
                </div>
              ) : stocks.length === 0 ? (
                /* Empty Watchlist State */
                <div className="p-12 text-center rounded-2xl bg-surface border border-surface-border space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-surface-subtle border border-surface-border flex items-center justify-center text-slate-400 mx-auto">
                    <Plus className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">No stocks in this watchlist yet</h3>
                    <p className="text-xs text-slate-400 mt-1">Add symbols like NVDA, AMD, AAPL to begin tracking changes.</p>
                  </div>
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 shadow-lg shadow-brand-500/20"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add First Stock</span>
                  </button>
                </div>
              ) : (
                /* Ranked Stock Cards */
                <div className="grid grid-cols-1 gap-4">
                  {/* Quiet state notice if 0 meaningful changes */}
                  {meaningfulCount === 0 && (
                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3 text-emerald-400 text-xs">
                      <CheckCircle2 className="w-5 h-5 shrink-0" />
                      <div>
                        <span className="font-semibold">Nothing significant changed.</span> Your watchlist is relatively quiet since your last check.
                      </div>
                    </div>
                  )}

                  {stocks.map((stock) => (
                    <StockCard
                      key={stock.symbol}
                      stock={stock}
                      onRemove={handleRemoveStock}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Add Stock Modal */}
      <AddStockModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        watchlistId={activeWatchlistId}
        existingSymbols={stocks.map(s => s.symbol)}
        onStockAdded={handleStockAdded}
      />
    </div>
  );
}
