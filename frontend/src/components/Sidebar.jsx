import React, { useState } from 'react';
import { Layers, Plus, Star, Trash2, Edit2, Check, X } from 'lucide-react';
import { watchlistApi } from '../services/api';

export default function Sidebar({
  watchlists = [],
  activeWatchlistId = null,
  onSelectWatchlist,
  onRefreshWatchlists,
}) {
  const [isCreating, setIsCreating] = useState(false);
  const [newWatchlistName, setNewWatchlistName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newWatchlistName.trim()) return;
    try {
      const res = await watchlistApi.create(newWatchlistName.trim());
      setNewWatchlistName('');
      setIsCreating(false);
      onRefreshWatchlists();
      onSelectWatchlist(res.data.watchlist.id);
    } catch (err) {
      console.error('Failed to create watchlist:', err);
    }
  };

  const handleStartRename = (wl, e) => {
    e.stopPropagation();
    setEditingId(wl.id);
    setEditName(wl.name);
  };

  const handleSaveRename = async (id, e) => {
    e.stopPropagation();
    if (!editName.trim()) return;
    try {
      await watchlistApi.update(id, editName.trim());
      setEditingId(null);
      onRefreshWatchlists();
    } catch (err) {
      console.error('Failed to rename watchlist:', err);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this watchlist?')) return;
    try {
      await watchlistApi.delete(id);
      onRefreshWatchlists();
    } catch (err) {
      console.error('Failed to delete watchlist:', err);
    }
  };

  return (
    <aside className="w-full lg:w-64 shrink-0 space-y-4">
      <div className="bg-surface border border-surface-border rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3 px-2">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-brand-500" />
            <span>Watchlists</span>
          </h2>
          <button
            onClick={() => setIsCreating(true)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-surface-hover transition-colors"
            title="Create Watchlist"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Create Input Form */}
        {isCreating && (
          <form onSubmit={handleCreate} className="mb-3 p-2 bg-surface-subtle border border-surface-border rounded-xl">
            <input
              type="text"
              placeholder="Watchlist name..."
              value={newWatchlistName}
              onChange={(e) => setNewWatchlistName(e.target.value)}
              autoFocus
              className="w-full px-2.5 py-1.5 text-xs bg-surface border border-surface-border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 mb-2"
            />
            <div className="flex justify-end gap-1.5">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-2 py-1 text-[11px] text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-2.5 py-1 text-[11px] font-semibold bg-brand-500 hover:bg-brand-600 text-white rounded-md"
              >
                Create
              </button>
            </div>
          </form>
        )}

        {/* Watchlist list */}
        <div className="space-y-1">
          {watchlists.map((wl) => {
            const isActive = wl.id === activeWatchlistId;
            const isEditing = wl.id === editingId;

            return (
              <div
                key={wl.id}
                onClick={() => onSelectWatchlist(wl.id)}
                className={`group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                  isActive
                    ? 'bg-brand-500/15 text-white border border-brand-500/30 font-semibold'
                    : 'text-slate-300 hover:bg-surface-hover hover:text-white border border-transparent'
                }`}
              >
                {isEditing ? (
                  <div className="flex items-center gap-1.5 w-full" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-2 py-0.5 text-xs bg-surface border border-surface-border rounded text-white focus:outline-none focus:border-brand-500"
                      autoFocus
                    />
                    <button
                      onClick={(e) => handleSaveRename(wl.id, e)}
                      className="p-1 text-emerald-400 hover:bg-surface-hover rounded"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingId(null); }}
                      className="p-1 text-slate-400 hover:bg-surface-hover rounded"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Star className={`w-3.5 h-3.5 ${isActive ? 'text-brand-500 fill-brand-500' : 'text-slate-500'}`} />
                      <span className="text-xs truncate">{wl.name}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface border border-surface-border text-slate-400">
                        {wl.stock_count || wl.stocks?.length || 0}
                      </span>
                      {/* Action buttons on hover */}
                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
                        <button
                          onClick={(e) => handleStartRename(wl, e)}
                          className="p-1 text-slate-400 hover:text-slate-200"
                          title="Rename"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        {watchlists.length > 1 && (
                          <button
                            onClick={(e) => handleDelete(wl.id, e)}
                            className="p-1 text-slate-400 hover:text-rose-400"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
