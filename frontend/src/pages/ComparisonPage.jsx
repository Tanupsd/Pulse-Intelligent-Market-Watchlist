import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Plus, X, ArrowLeft, TrendingUp, TrendingDown, Search, ArrowRight, BarChart2, Layers } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { stocksApi } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SkeletonLoader from '../components/SkeletonLoader';

const CHART_COLORS = ['#38BDF8', '#10B981', '#F59E0B', '#F43F5E', '#A855F7'];
const POPULAR_PICKS = ['AAPL', 'NVDA', 'MSFT', 'AMZN', 'GOOGL', 'TSLA'];

function StockSlot({ slotNumber, label, selectedSymbol, onSelect, onClear, otherSelected = [] }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsDropdownOpen(false);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await stocksApi.search(query.trim());
        setResults(res.data.results || []);
        setIsDropdownOpen(true);
      } catch (err) {
        console.warn('Search failed:', err);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="bg-surface border border-surface-border rounded-xl p-5 shadow-md flex flex-col justify-between relative">
      <div className="space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-surface-border">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            {label}
          </span>
          {selectedSymbol && (
            <button
              onClick={onClear}
              className="text-xs text-gray-400 hover:text-severity-critical flex items-center gap-1 transition-colors"
              title="Clear or change selection"
            >
              <X className="w-3.5 h-3.5" />
              <span>Change</span>
            </button>
          )}
        </div>

        {selectedSymbol ? (
          <div className="py-4 text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-surface-subtle border border-surface-border mx-auto flex items-center justify-center">
              <span className="font-mono font-bold text-lg text-white">
                {selectedSymbol}
              </span>
            </div>
            <div>
              <p className="font-bold text-base text-white">{selectedSymbol}</p>
              <p className="text-xs text-gray-400">Selected for comparison</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3 py-1">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => {
                  if (results.length > 0) setIsDropdownOpen(true);
                }}
                placeholder={`Search ${label} (e.g. NVDA, AAPL)...`}
                className="w-full pl-9 pr-3 py-2 text-xs bg-surface-subtle border border-surface-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-brand-500"
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {/* Autocomplete Dropdown */}
              {isDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-surface border border-surface-border rounded-lg shadow-2xl z-30 max-h-48 overflow-y-auto divide-y divide-surface-border">
                  {results.length === 0 ? (
                    <div className="p-3 text-center text-xs text-gray-500">
                      No matching stocks found.
                    </div>
                  ) : (
                    results.map((stock) => {
                      const isAlreadySelected = otherSelected.includes(stock.symbol);
                      return (
                        <div
                          key={stock.symbol}
                          onClick={() => {
                            if (!isAlreadySelected) {
                              onSelect(stock.symbol);
                              setQuery('');
                              setIsDropdownOpen(false);
                            }
                          }}
                          className={`p-2.5 flex items-center justify-between transition-colors ${
                            isAlreadySelected
                              ? 'opacity-40 cursor-not-allowed bg-surface-subtle'
                              : 'hover:bg-surface-hover cursor-pointer'
                          }`}
                        >
                          <div>
                            <span className="font-mono font-bold text-xs text-white">
                              {stock.symbol}
                            </span>
                            <span className="text-[11px] text-gray-400 ml-2">
                              {stock.name}
                            </span>
                          </div>
                          {isAlreadySelected ? (
                            <span className="text-[10px] text-gray-500">Selected</span>
                          ) : (
                            <span className="text-xs text-gray-400 hover:text-white font-medium">
                              Select →
                            </span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* Quick Pick Chips */}
            <div className="pt-1">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1.5">
                Quick Picks:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_PICKS.filter((sym) => !otherSelected.includes(sym)).slice(0, 4).map((sym) => (
                  <button
                    key={sym}
                    onClick={() => onSelect(sym)}
                    className="px-2 py-0.5 rounded text-[11px] font-mono bg-surface-subtle hover:bg-surface-hover border border-surface-border text-gray-300 transition-colors"
                  >
                    +{sym}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ComparisonPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isDark } = useTheme();

  // Selected symbols (defaults to empty unless provided in URL)
  const initialParam = searchParams.get('symbols');
  const [symbols, setSymbols] = useState(() => {
    if (initialParam) {
      return initialParam.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean);
    }
    return [];
  });

  const [range, setRange] = useState('1M');
  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Add 3rd-5th stock modal state
  const [isAddingStock, setIsAddingStock] = useState(false);
  const [addSearchQuery, setAddSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Sync symbols with URL search params
  useEffect(() => {
    if (symbols.length > 0) {
      setSearchParams({ symbols: symbols.join(','), range });
    } else {
      setSearchParams({});
    }
  }, [symbols, range]);

  // Fetch comparison data ONLY when at least 2 stocks are selected
  useEffect(() => {
    if (symbols.length < 2) {
      setComparisonData(null);
      setLoading(false);
      return;
    }

    async function fetchComparison() {
      setLoading(true);
      setError(null);
      try {
        const res = await stocksApi.compare(symbols, range);
        setComparisonData(res.data);
      } catch (err) {
        console.error('Failed to load comparison:', err);
        setError('Failed to load comparison data. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    fetchComparison();
  }, [symbols.join(','), range]);

  // Search autocomplete for adding additional stocks
  useEffect(() => {
    if (!addSearchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await stocksApi.search(addSearchQuery.trim());
        setSearchResults(res.data.results || []);
      } catch {
        // ignore
      } finally {
        setIsSearching(false);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [addSearchQuery]);

  const handleSelectSlot = (slotIndex, sym) => {
    const clean = sym.toUpperCase().trim();
    setSymbols((prev) => {
      const next = [...prev];
      next[slotIndex] = clean;
      return next.filter(Boolean);
    });
  };

  const handleClearSlot = (slotIndex) => {
    setSymbols((prev) => {
      const next = [...prev];
      next.splice(slotIndex, 1);
      return next;
    });
  };

  const handleAddSymbol = (sym) => {
    const clean = sym.toUpperCase().trim();
    if (!symbols.includes(clean) && symbols.length < 5) {
      setSymbols([...symbols, clean]);
    }
    setIsAddingStock(false);
    setAddSearchQuery('');
    setSearchResults([]);
  };

  const handleRemoveSymbol = (sym) => {
    setSymbols(symbols.filter((s) => s !== sym));
  };

  const handleResetAll = () => {
    setSymbols([]);
    setComparisonData(null);
  };

  const formatPrice = (val) =>
    Number(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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

  // Build merged chart dataset normalized by % return from period start
  const chartDataset = React.useMemo(() => {
    if (!comparisonData || !comparisonData.stocks || comparisonData.stocks.length === 0) {
      return [];
    }

    const baseHistory = comparisonData.stocks[0]?.history || [];
    if (baseHistory.length === 0) return [];

    return baseHistory.map((pt, idx) => {
      const dataPoint = {
        timeLabel: pt.timeLabel || `T-${idx}`,
        timestamp: pt.timestamp,
      };

      comparisonData.stocks.forEach((stock) => {
        const history = stock.history || [];
        const stockPt = history[idx] || history[history.length - 1];
        const basePtPrice = history[0]?.price || 1;

        if (stockPt && basePtPrice > 0) {
          const normReturn = ((stockPt.price - basePtPrice) / basePtPrice) * 100;
          dataPoint[`${stock.symbol}_pct`] = Number(normReturn.toFixed(2));
          dataPoint[`${stock.symbol}_price`] = stockPt.price;
        }
      });

      return dataPoint;
    });
  }, [comparisonData]);

  return (
    <div className="min-h-screen bg-background text-gray-100 flex flex-col">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6 flex-1">
        
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-border">
          <div>
            <div className="flex items-center space-x-2">
              <Link to="/" className="text-gray-400 hover:text-white transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <h1 className="text-2xl font-bold text-white tracking-tight">Stock Comparison</h1>
              <span className="text-xs font-mono uppercase bg-surface-subtle border border-surface-border px-2 py-0.5 rounded text-gray-300">
                Public Tool
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Side-by-side metrics and normalized historical returns for multi-asset analysis
            </p>
          </div>

          {/* Controls: Range Buttons & Add Stock Button (when >= 2 stocks selected) */}
          {symbols.length >= 2 && (
            <div className="flex items-center space-x-3">
              <div className="flex items-center bg-surface-subtle border border-surface-border rounded-lg p-0.5 text-xs font-mono">
                {['1D', '1W', '1M', '1Y'].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRange(r)}
                    className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                      range === r ? 'bg-white text-black' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>

              {symbols.length < 5 && (
                <button
                  onClick={() => setIsAddingStock(true)}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-white text-black font-semibold text-xs rounded-lg hover:bg-gray-200 transition-colors shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Stock</span>
                </button>
              )}

              <button
                onClick={handleResetAll}
                className="text-xs text-gray-400 hover:text-white transition-colors px-2 py-1"
                title="Reset comparison"
              >
                Reset
              </button>
            </div>
          )}
        </div>

        {/* When fewer than 2 stocks are selected, show the Empty Selection Slots */}
        {symbols.length < 2 && (
          <div className="space-y-6">
            <div className="text-center max-w-xl mx-auto space-y-2 pt-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface border border-surface-border text-xs font-medium text-gray-300">
                <Layers className="w-3.5 h-3.5 text-brand-500" />
                <span>Multi-Asset Intelligence</span>
              </div>
              <h2 className="text-xl font-bold text-white">Select Two Stocks to Compare</h2>
              <p className="text-xs text-gray-400">
                Choose any two assets to view side-by-side relative performance curves, volume anomalies, valuation multiples, and 52-week ranges.
              </p>
            </div>

            {/* Two Interactive Selection Slots */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <StockSlot
                slotNumber={1}
                label="Stock 1 (Primary)"
                selectedSymbol={symbols[0] || null}
                onSelect={(sym) => handleSelectSlot(0, sym)}
                onClear={() => handleClearSlot(0)}
                otherSelected={symbols[1] ? [symbols[1]] : []}
              />
              <StockSlot
                slotNumber={2}
                label="Stock 2 (Comparison)"
                selectedSymbol={symbols[1] || null}
                onSelect={(sym) => handleSelectSlot(1, sym)}
                onClear={() => handleClearSlot(1)}
                otherSelected={symbols[0] ? [symbols[0]] : []}
              />
            </div>
          </div>
        )}

        {/* Add Additional Stock Modal (for 3rd to 5th stocks) */}
        {isAddingStock && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-md bg-surface border border-surface-border rounded-xl p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-surface-border">
                <h3 className="text-sm font-bold text-white">Compare Another Stock</h3>
                <button
                  onClick={() => {
                    setIsAddingStock(false);
                    setAddSearchQuery('');
                  }}
                  className="text-gray-400 hover:text-white text-lg leading-none"
                >
                  &times;
                </button>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Search symbol (e.g. TSLA, AMD, GOOGL)..."
                  value={addSearchQuery}
                  onChange={(e) => setAddSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-surface-subtle border border-surface-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-400"
                />
              </div>

              <div className="max-h-60 overflow-y-auto divide-y divide-surface-border">
                {searchResults.length === 0 && addSearchQuery.trim() ? (
                  <div className="py-4 text-center text-xs text-gray-500">
                    No matching stocks found.
                  </div>
                ) : (
                  searchResults.map((item) => {
                    const alreadyIn = symbols.includes(item.symbol);
                    return (
                      <div
                        key={item.symbol}
                        onClick={() => !alreadyIn && handleAddSymbol(item.symbol)}
                        className={`p-2.5 flex items-center justify-between transition-colors ${
                          alreadyIn ? 'opacity-40 cursor-not-allowed' : 'hover:bg-surface-hover cursor-pointer'
                        }`}
                      >
                        <div>
                          <span className="font-mono font-bold text-xs text-white">{item.symbol}</span>
                          <span className="text-[11px] text-gray-400 ml-2">{item.name}</span>
                        </div>
                        {alreadyIn ? (
                          <span className="text-[10px] text-gray-500">Already Added</span>
                        ) : (
                          <span className="text-xs text-gray-400 hover:text-white font-medium">Add +</span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && symbols.length >= 2 && (
          <div className="space-y-4">
            <SkeletonLoader count={4} />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-4 bg-severity-critical/10 border border-severity-critical/20 rounded-lg text-xs text-severity-critical">
            {error}
          </div>
        )}

        {/* Comparison Content (Active when >= 2 stocks selected and data loaded) */}
        {!loading && comparisonData && symbols.length >= 2 && (
          <div className="space-y-8 animate-fadeIn">

            {/* 1. Comparative Chart Section */}
            <div className="bg-surface border border-surface-border rounded-xl p-5 shadow space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-surface-border">
                <div>
                  <h3 className="text-sm font-bold text-white">Relative Performance Curve ({range})</h3>
                  <p className="text-[11px] text-gray-400">Normalized percentage gain/loss from period start</p>
                </div>
                <div className="flex items-center space-x-3 text-xs font-mono">
                  {comparisonData.stocks.map((stock, i) => (
                    <div key={stock.symbol} className="flex items-center space-x-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                      />
                      <span className="text-white font-bold">{stock.symbol}</span>
                      <span className={`text-[11px] ${stock.periodReturn >= 0 ? 'text-market-gain' : 'text-market-loss'}`}>
                        {stock.periodReturn >= 0 ? `+${stock.periodReturn}%` : `${stock.periodReturn}%`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recharts Performance Line Chart */}
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartDataset} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#26282E' : '#E2E8F0'} vertical={false} />
                    <XAxis
                      dataKey="timeLabel"
                      stroke="#64748B"
                      fontSize={10}
                      tickLine={false}
                    />
                    <YAxis
                      stroke="#64748B"
                      fontSize={10}
                      tickLine={false}
                      unit="%"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? '#111215' : '#FFFFFF',
                        borderColor: isDark ? '#26282E' : '#CBD5E1',
                        borderRadius: '8px',
                        fontSize: '11px',
                        color: isDark ? '#F1F5F9' : '#0F172A',
                      }}
                      formatter={(val, name) => [`${val}%`, name.replace('_pct', '')]}
                    />
                    {comparisonData.stocks.map((stock, i) => (
                      <Line
                        key={stock.symbol}
                        type="monotone"
                        dataKey={`${stock.symbol}_pct`}
                        name={`${stock.symbol}_pct`}
                        stroke={CHART_COLORS[i % CHART_COLORS.length]}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 2. Side-by-Side Fundamentals Grid */}
            <div className="bg-surface border border-surface-border rounded-xl p-5 shadow space-y-4">
              <div className="pb-3 border-b border-surface-border flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">Side-by-Side Fundamentals</h3>
                <span className="text-[11px] text-gray-500">Comparing {comparisonData.stocks.length} assets</span>
              </div>

              {/* Horizontal Scroll wrapper for seamless 3+ stock views */}
              <div className="overflow-x-auto">
                <div
                  className="grid gap-4 min-w-[600px]"
                  style={{
                    gridTemplateColumns: `repeat(${comparisonData.stocks.length}, minmax(180px, 1fr))`,
                  }}
                >
                  {comparisonData.stocks.map((stock, i) => (
                    <div
                      key={stock.symbol}
                      className="bg-surface-subtle border border-surface-border rounded-lg p-4 space-y-3 relative group"
                    >
                      {/* Remove stock button */}
                      <button
                        onClick={() => handleRemoveSymbol(stock.symbol)}
                        className="absolute top-2 right-2 text-gray-500 hover:text-rose-400 p-1 rounded hover:bg-surface text-xs"
                        title="Remove from comparison"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>

                      {/* Stock Identity Header */}
                      <div className="pr-5">
                        <div className="flex items-center space-x-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                          />
                          <Link
                            to={`/stocks/${stock.symbol}`}
                            className="font-mono font-bold text-base text-white hover:text-gray-300 transition-colors"
                          >
                            {stock.symbol}
                          </Link>
                        </div>
                        <p className="text-[11px] text-gray-400 truncate mt-0.5">{stock.name}</p>
                        <span className="text-[10px] text-gray-500">{stock.sector}</span>
                      </div>

                      {/* Main Price & Today Change */}
                      <div className="pt-2 border-t border-surface-border/60">
                        <div className="font-mono text-lg font-extrabold text-white">
                          ${formatPrice(stock.price)}
                        </div>
                        <div className={`font-mono text-xs font-bold flex items-center space-x-1 ${stock.changePercent >= 0 ? 'text-market-gain' : 'text-market-loss'}`}>
                          {stock.changePercent >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          <span>{stock.changePercent >= 0 ? `+${stock.changePercent.toFixed(2)}%` : `${stock.changePercent.toFixed(2)}%`}</span>
                        </div>
                      </div>

                      {/* Breakdown Data Rows */}
                      <div className="space-y-2 pt-2 border-t border-surface-border/60 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Market Cap:</span>
                          <span className="font-mono font-semibold text-white">{formatMarketCap(stock.marketCap)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">P/E Ratio:</span>
                          <span className="font-mono font-semibold text-white">{stock.peRatio}x</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Volume:</span>
                          <span className="font-mono text-gray-300">{formatVolume(stock.volume)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Avg Volume:</span>
                          <span className="font-mono text-gray-400">{formatVolume(stock.averageVolume)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">52w High:</span>
                          <span className="font-mono text-gray-300">${formatPrice(stock.high52w)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">52w Low:</span>
                          <span className="font-mono text-gray-300">${formatPrice(stock.low52w)}</span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-surface-border/40">
                          <span className="text-gray-400">{range} Return:</span>
                          <span className={`font-mono font-bold ${stock.periodReturn >= 0 ? 'text-market-gain' : 'text-market-loss'}`}>
                            {stock.periodReturn >= 0 ? `+${stock.periodReturn}%` : `${stock.periodReturn}%`}
                          </span>
                        </div>
                      </div>

                      {/* Stock Analysis CTA */}
                      <div className="pt-2">
                        <Link
                          to={`/stocks/${stock.symbol}`}
                          className="w-full block text-center py-1.5 px-2 bg-surface hover:bg-surface-border border border-surface-border text-white text-xs font-medium rounded transition-colors"
                        >
                          Deep Intelligence →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
      <Footer />
    </div>
  );
}
