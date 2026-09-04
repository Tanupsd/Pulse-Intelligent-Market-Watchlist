import React, { useState } from 'react';
import { X, Search, Plus, Check, Loader2 } from 'lucide-react';
import { stocksApi, watchlistApi } from '../services/api';

export default function AddStockModal({ isOpen, onClose, watchlistId, onStockAdded, existingSymbols = [] }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [addingSymbol, setAddingSymbol] = useState(null);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await stocksApi.search(query.trim());
      setResults(res.data.results || []);
    } catch (err) {
      setError('Failed to search stocks.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = async (symbol) => {
    setAddingSymbol(symbol);
    setError(null);
    try {
      await watchlistApi.addStock(watchlistId, symbol);
      onStockAdded(symbol);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || `Failed to add ${symbol}.`);
    } finally {
      setAddingSymbol(null);
    }
  };

  const popularSymbols = [
    'NVDA', 'AAPL', 'MSFT', 'TSLA', 'AMD', 'AMZN', 
    'NFLX', 'PLTR', 'COIN', 'META', 'GOOGL', 'SPY'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="bg-surface border border-surface-border rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl">
        <div className="px-6 py-4 border-b border-surface-border flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Add Any Global Stock</h3>
            <p className="text-[11px] text-slate-400">Search by company name (e.g. Netflix, Palantir) or ticker symbol</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-surface-hover"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Search Input */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search symbol or name (e.g. NFLX, Palantir, Boeing)..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
                className="w-full pl-9 pr-3 py-2 text-xs bg-surface-subtle border border-surface-border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-white rounded-xl transition-colors flex items-center gap-1.5 shrink-0"
            >
              {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              <span>Search</span>
            </button>
          </form>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400">
              {error}
            </div>
          )}

          {/* Quick Add Popular Stocks */}
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Popular Stocks & ETFs
            </span>
            <div className="flex flex-wrap gap-1.5">
              {popularSymbols.map((sym) => {
                const isAlreadyAdded = existingSymbols.includes(sym);
                const isAddingThis = addingSymbol === sym;

                return (
                  <button
                    key={sym}
                    onClick={() => !isAlreadyAdded && handleAdd(sym)}
                    disabled={isAlreadyAdded || isAddingThis}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
                      isAlreadyAdded
                        ? 'bg-surface-subtle text-slate-500 cursor-not-allowed border border-surface-border'
                        : 'bg-surface-hover hover:bg-brand-500 hover:text-white text-slate-300 border border-surface-border'
                    }`}
                  >
                    {isAlreadyAdded ? (
                      <span className="flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-400" />
                        {sym}
                      </span>
                    ) : isAddingThis ? (
                      <span className="flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        {sym}
                      </span>
                    ) : (
                      `+ ${sym}`
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search Results */}
          {results.length > 0 && (
            <div className="space-y-2 mt-4 max-h-56 overflow-y-auto">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Search Results ({results.length})
              </span>
              <div className="divide-y divide-surface-border/50 rounded-xl bg-surface-subtle border border-surface-border overflow-hidden">
                {results.map((stock) => {
                  const isAdded = existingSymbols.includes(stock.symbol);
                  const isAddingThis = addingSymbol === stock.symbol;

                  return (
                    <div
                      key={stock.symbol}
                      className="p-3 flex items-center justify-between hover:bg-surface-hover transition-colors"
                    >
                      <div className="min-w-0 pr-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-white font-mono">{stock.symbol}</span>
                          <span className="text-xs text-slate-300 truncate">{stock.name}</span>
                        </div>
                        <span className="text-[11px] text-slate-500">{stock.sector}</span>
                      </div>
                      <button
                        onClick={() => handleAdd(stock.symbol)}
                        disabled={isAdded || isAddingThis}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1 shrink-0 transition-colors ${
                          isAdded
                            ? 'bg-surface border border-surface-border text-slate-500 cursor-not-allowed'
                            : 'bg-brand-500 hover:bg-brand-600 text-white'
                        }`}
                      >
                        {isAdded ? (
                          'Added'
                        ) : isAddingThis ? (
                          <><Loader2 className="w-3 h-3 animate-spin" /> Adding</>
                        ) : (
                          <><Plus className="w-3 h-3" /> Add to Watchlist</>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
