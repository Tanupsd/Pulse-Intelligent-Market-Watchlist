import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthProvider } from '../src/context/AuthContext';
import { ThemeProvider } from '../src/context/ThemeContext';
import AuthPromptModal from '../src/components/AuthPromptModal';
import Navbar from '../src/components/Navbar';
import HomePage from '../src/pages/HomePage';
import ComparisonPage from '../src/pages/ComparisonPage';
import ProfilePage from '../src/pages/ProfilePage';
import StockDetailPage from '../src/pages/StockDetailPage';
import * as api from '../src/services/api';

// Mock Recharts ResponsiveContainer to render children cleanly in JSDOM
vi.mock('recharts', async () => {
  const actual = await vi.importActual('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children }) => <div className="recharts-mock-container" style={{ width: 500, height: 300 }}>{children}</div>,
  };
});

function renderWithProviders(ui, { route = '/' } = {}) {
  return render(
    <ThemeProvider>
      <AuthProvider>
        <MemoryRouter initialEntries={[route]}>
          {ui}
        </MemoryRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

describe('Pulse Major Enhancements Frontend Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(api.marketApi, 'getProvider').mockResolvedValue({
      data: { mode: 'live', scenario: 'demo' }
    });
  });

  describe('AuthPromptModal', () => {
    it('renders explanation of checkpoints and auth actions', () => {
      const onClose = vi.fn();
      render(
        <BrowserRouter>
          <AuthPromptModal isOpen={true} onClose={onClose} />
        </BrowserRouter>
      );

      expect(screen.getByText('Watchlists & Checkpoints')).toBeInTheDocument();
      expect(screen.getByText(/Pulse watchlists are built around/i)).toBeInTheDocument();
      expect(screen.getByText('Sign In')).toBeInTheDocument();
      expect(screen.getByText('Create Account')).toBeInTheDocument();

      fireEvent.click(screen.getByLabelText('Close modal'));
      expect(onClose).toHaveBeenCalled();
    });

    it('does not render when isOpen is false', () => {
      const { container } = render(
        <BrowserRouter>
          <AuthPromptModal isOpen={false} onClose={() => {}} />
        </BrowserRouter>
      );
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Navbar (Public & Authenticated Modes, Theme Switcher)', () => {
    it('renders public navigation links and theme toggle when logged out', () => {
      renderWithProviders(<Navbar />);

      expect(screen.getByText('Pulse')).toBeInTheDocument();
      expect(screen.getByText('Markets')).toBeInTheDocument();
      expect(screen.getByText('Comparison')).toBeInTheDocument();
      expect(screen.getByText('Watchlists')).toBeInTheDocument();
      expect(screen.getByText('Sign In')).toBeInTheDocument();
      expect(screen.getByText('Get Started')).toBeInTheDocument();
      expect(screen.getByLabelText('Toggle theme')).toBeInTheDocument();
    });

    it('opens AuthPromptModal when unauthenticated user clicks Watchlists', async () => {
      renderWithProviders(<Navbar />);

      const watchlistsBtn = screen.getByRole('button', { name: 'Watchlists' });
      fireEvent.click(watchlistsBtn);

      await waitFor(() => {
        expect(screen.getByText('Watchlists & Checkpoints')).toBeInTheDocument();
      });
    });

    it('merges profile and visit analytics into single "Profile and Analysis" option in user dropdown', async () => {
      localStorage.setItem('pulse_token', 'mock_token');
      localStorage.setItem('pulse_user', JSON.stringify({
        id: 'user-1',
        name: 'Demo Investor',
        email: 'demo@example.com'
      }));

      vi.spyOn(api.authApi, 'getMe').mockResolvedValue({
        data: { user: { id: 'user-1', name: 'Demo Investor', email: 'demo@example.com' } }
      });

      renderWithProviders(<Navbar />);

      // Find user dropdown button
      await waitFor(() => {
        expect(screen.getByText('Demo Investor')).toBeInTheDocument();
      });

      const profileBtn = screen.getByText('Demo Investor').closest('button');
      fireEvent.click(profileBtn);

      // Verify merged "Profile and Analysis" exists
      expect(screen.getByText('Profile and Analysis')).toBeInTheDocument();
      expect(screen.getByText('Sign Out')).toBeInTheDocument();

      // Verify the old separate options NO LONGER exist
      expect(screen.queryByText('Profile & Settings')).not.toBeInTheDocument();
      expect(screen.queryByText('Visit Analytics')).not.toBeInTheDocument();
    });

    it('toggles light and dark themes using the theme switcher', () => {
      renderWithProviders(<Navbar />);

      const toggleBtn = screen.getByLabelText('Toggle theme');
      expect(toggleBtn).toBeInTheDocument();

      // Default is dark
      expect(localStorage.getItem('pulse_theme') || 'dark').toBe('dark');

      // Click to toggle to light
      fireEvent.click(toggleBtn);
      expect(localStorage.getItem('pulse_theme')).toBe('light');

      // Click again to toggle back to dark
      fireEvent.click(toggleBtn);
      expect(localStorage.getItem('pulse_theme')).toBe('dark');
    });
  });

  describe('HomePage', () => {
    beforeEach(() => {
      vi.spyOn(api.marketApi, 'getTopPerformers').mockResolvedValue({
        data: {
          items: [
            { symbol: 'NVDA', name: 'NVIDIA Corporation', price: 184.32, changePercent: 5.2, volume: 80000000 },
            { symbol: 'AMD', name: 'Advanced Micro Devices Inc.', price: 162.41, changePercent: 3.1, volume: 50000000 },
          ],
          total: 2,
        }
      });
      vi.spyOn(api.marketApi, 'getTopLosers').mockResolvedValue({
        data: {
          items: [
            { symbol: 'TSLA', name: 'Tesla Inc.', price: 220.80, changePercent: -4.5, volume: 60000000 },
            { symbol: 'INTC', name: 'Intel Corporation', price: 21.30, changePercent: -2.8, volume: 30000000 },
          ],
          total: 2,
        }
      });
    });

    it('renders hero value proposition and 1-click demo login', async () => {
      renderWithProviders(<HomePage />);

      expect(screen.getByText(/See what changed/i)).toBeInTheDocument();
      expect(screen.getByText(/A normal watchlist tells you what stocks are doing/i)).toBeInTheDocument();
      expect(screen.getByText(/meaningfully changed while you were away/i)).toBeInTheDocument();
      expect(screen.getByText('1-Click Demo')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('Market Movers')).toBeInTheDocument();
        expect(screen.getByText(/Top 5 Performers/i)).toBeInTheDocument();
        expect(screen.getByText(/Top 5 Losers/i)).toBeInTheDocument();
      });
    });
  });

  describe('ComparisonPage', () => {
    beforeEach(() => {
      vi.spyOn(api.stocksApi, 'compare').mockResolvedValue({
        data: {
          symbols: ['AAPL', 'NVDA'],
          range: '1M',
          stocks: [
            {
              symbol: 'AAPL',
              name: 'Apple Inc.',
              sector: 'Technology',
              price: 232.10,
              changePercent: 1.25,
              volume: 45000000,
              averageVolume: 52000000,
              marketCap: 3500000000000,
              peRatio: 33.4,
              high52w: 237.23,
              low52w: 164.08,
              periodReturn: 4.2,
              history: [
                { timeLabel: 'Day 1', price: 220.0, timestamp: '2026-08-01T00:00:00Z' },
                { timeLabel: 'Day 2', price: 232.1, timestamp: '2026-08-02T00:00:00Z' },
              ]
            },
            {
              symbol: 'NVDA',
              name: 'NVIDIA Corporation',
              sector: 'Semiconductors',
              price: 184.32,
              changePercent: -4.80,
              volume: 84000000,
              averageVolume: 40000000,
              marketCap: 4520000000000,
              peRatio: 35.2,
              high52w: 195.0,
              low52w: 120.0,
              periodReturn: -3.8,
              history: [
                { timeLabel: 'Day 1', price: 191.6, timestamp: '2026-08-01T00:00:00Z' },
                { timeLabel: 'Day 2', price: 184.3, timestamp: '2026-08-02T00:00:00Z' },
              ]
            }
          ]
        }
      });
    });

    it('renders empty comparison slots when opening /compare without prefilled stocks', () => {
      const compareSpy = vi.spyOn(api.stocksApi, 'compare');
      renderWithProviders(<ComparisonPage />, { route: '/compare' });

      expect(screen.getByText('Stock Comparison')).toBeInTheDocument();
      expect(screen.getByText('Select Two Stocks to Compare')).toBeInTheDocument();
      expect(screen.getByText('Stock 1 (Primary)')).toBeInTheDocument();
      expect(screen.getByText('Stock 2 (Comparison)')).toBeInTheDocument();

      // Ensure no market compare API request was fired
      expect(compareSpy).not.toHaveBeenCalled();
    });

    it('renders comparison tools, range selector, and stock metrics when 2 stocks are passed in query', async () => {
      renderWithProviders(<ComparisonPage />, { route: '/compare?symbols=AAPL,NVDA' });

      expect(screen.getByText('Stock Comparison')).toBeInTheDocument();
      expect(screen.getByText('Public Tool')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('Side-by-Side Fundamentals')).toBeInTheDocument();
        expect(screen.getByText('1M')).toBeInTheDocument();
        expect(screen.getAllByText('AAPL').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('NVDA').length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe('StockDetailPage (Public vs Authenticated Privacy)', () => {
    it('unauthenticated view omits checkpoint matrix and attention badge, showing public data and sign-in CTA', async () => {
      vi.spyOn(api.stocksApi, 'getDetail').mockResolvedValue({
        data: {
          stock: {
            symbol: 'AAPL',
            name: 'Apple Inc.',
            sector: 'Technology',
            price: 232.10,
            dailyChange: 1.25,
            volume: 45000000,
            averageVolume: 52000000,
            marketCap: 3500000000000,
            dataStatus: 'LIVE',
            timestamp: new Date().toISOString(),
            isAuthenticated: false,
          },
          events: [],
          benchmark: { symbol: 'SPY', changePercent: 0.5 },
        }
      });
      vi.spyOn(api.stocksApi, 'getHistory').mockResolvedValue({
        data: { points: [{ timeLabel: '9:30', price: 230.0 }] }
      });

      renderWithProviders(
        <Routes>
          <Route path="/stocks/:symbol" element={<StockDetailPage />} />
        </Routes>,
        { route: '/stocks/AAPL' }
      );

      await waitFor(() => {
        expect(screen.getByText('AAPL')).toBeInTheDocument();
        expect(screen.getByText('$232.10')).toBeInTheDocument();
      });

      // Check that public CTA for checkpoints is rendered
      expect(screen.getByText(/Personalized Checkpoints & Attention Scoring/i)).toBeInTheDocument();

      // Check that private checkpoint information is NOT rendered
      expect(screen.queryByText(/Then \(Previous Checkpoint\)/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Change Since Last Check/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Attention Score:/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Why it matters/i)).not.toBeInTheDocument();
    });
  });

  describe('ProfilePage', () => {
    beforeEach(() => {
      vi.spyOn(api.usersApi, 'getProfile').mockResolvedValue({
        data: {
          user: {
            id: 'mock-user-id',
            name: 'Demo Investor',
            phone: '+1 555 019 2834',
            email: 'demo@example.com',
          }
        }
      });
      vi.spyOn(api.usersApi, 'getAnalytics').mockResolvedValue({
        data: {
          analytics: [
            { symbol: 'NVDA', visits: 15 },
            { symbol: 'AAPL', visits: 10 },
          ],
          totalVisits: 25,
        }
      });
      vi.spyOn(api.authApi, 'getMe').mockResolvedValue({
        data: {
          user: {
            id: 'mock-user-id',
            email: 'demo@example.com',
            name: 'Demo Investor',
          }
        }
      });
      localStorage.setItem('pulse_token', 'mock_token');
      localStorage.setItem('pulse_user', JSON.stringify({
        id: 'mock-user-id',
        email: 'demo@example.com',
        name: 'Demo Investor',
      }));
    });

    it('renders personal details, change password, and analytics visualization', async () => {
      renderWithProviders(<ProfilePage />);

      expect(screen.getByText('Account & Analytics')).toBeInTheDocument();
      expect(screen.getByText('Personal Information')).toBeInTheDocument();
      expect(screen.getByText('Security & Password')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('Most Visited Stocks')).toBeInTheDocument();
        expect(screen.getByText('Total: 25 visits')).toBeInTheDocument();
      });
    });
  });
});
