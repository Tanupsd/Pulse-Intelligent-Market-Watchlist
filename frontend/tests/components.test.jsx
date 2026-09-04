import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import AttentionBadge from '../src/components/AttentionBadge';
import StockCard from '../src/components/StockCard';
import DataStatusPill from '../src/components/DataStatusPill';
import WhyChangedModal from '../src/components/WhyChangedModal';

describe('Frontend Component Tests', () => {
  describe('AttentionBadge', () => {
    it('renders CRITICAL badge with score and red accent', () => {
      render(<AttentionBadge severity="CRITICAL" score={82} />);
      expect(screen.getByText('Critical')).toBeInTheDocument();
      expect(screen.getByText('82')).toBeInTheDocument();
    });

    it('renders NORMAL badge with score and green accent', () => {
      render(<AttentionBadge severity="NORMAL" score={12} />);
      expect(screen.getByText('Normal')).toBeInTheDocument();
      expect(screen.getByText('12')).toBeInTheDocument();
    });

    it('renders WATCH and IMPORTANT badges correctly', () => {
      const { rerender } = render(<AttentionBadge severity="WATCH" score={35} />);
      expect(screen.getByText('Watch')).toBeInTheDocument();

      rerender(<AttentionBadge severity="IMPORTANT" score={65} />);
      expect(screen.getByText('Important')).toBeInTheDocument();
    });
  });

  describe('DataStatusPill', () => {
    it('renders Live status pill', () => {
      render(<DataStatusPill status="LIVE" />);
      expect(screen.getByText('Live')).toBeInTheDocument();
    });

    it('renders Stale status pill with warning indicator', () => {
      render(<DataStatusPill status="STALE" showDetails={true} />);
      expect(screen.getByText('Stale Data')).toBeInTheDocument();
      expect(screen.getByText(/Market data may be outdated/i)).toBeInTheDocument();
    });

    it('renders Delayed status pill', () => {
      render(<DataStatusPill status="DELAYED" />);
      expect(screen.getByText(/Delayed/i)).toBeInTheDocument();
    });
  });

  describe('StockCard & Since Last Check', () => {
    const mockStock = {
      symbol: 'NVDA',
      name: 'NVIDIA Corporation',
      sector: 'Semiconductors',
      price: 184.32,
      dailyChange: -4.8,
      sinceLastCheck: -4.8,
      checkpointPrice: 193.61,
      attentionScore: 82,
      severity: 'CRITICAL',
      dataStatus: 'LIVE',
      reasons: [
        { type: 'PRICE', text: 'Price fell 4.8% since your last check (major movement).' },
        { type: 'VOLUME', text: 'Trading volume is 2.1× the recent average.' },
      ],
    };

    it('renders stock symbol, price, and prominent since last check delta', () => {
      render(
        <BrowserRouter>
          <StockCard stock={mockStock} />
        </BrowserRouter>
      );

      expect(screen.getByText('NVDA')).toBeInTheDocument();
      expect(screen.getByText('$184.32')).toBeInTheDocument();
      expect(screen.getByText('-4.80%')).toBeInTheDocument();
      expect(screen.getByText(/was \$193.61/i)).toBeInTheDocument();
      expect(screen.getByText('Critical')).toBeInTheDocument();
    });

    it('renders reasons and why-did-this-change trigger button', () => {
      render(
        <BrowserRouter>
          <StockCard stock={mockStock} />
        </BrowserRouter>
      );

      expect(screen.getByText(/Price fell 4.8%/i)).toBeInTheDocument();
      expect(screen.getByText(/Why did this change\?/i)).toBeInTheDocument();
    });

    it('opens WhyChangedModal when clicking why did this change button', () => {
      render(
        <BrowserRouter>
          <StockCard stock={mockStock} />
        </BrowserRouter>
      );

      const whyButton = screen.getByText(/Why did this change\?/i);
      fireEvent.click(whyButton);

      expect(screen.getByText(/Why NVDA Matters Right Now/i)).toBeInTheDocument();
      expect(screen.getByText(/HIGH CONFIDENCE/i)).toBeInTheDocument();
      expect(screen.getByText(/Methodology Note:/i)).toBeInTheDocument();
    });
  });

  describe('WhyChangedModal', () => {
    const mockStock = {
      symbol: 'AMD',
      name: 'Advanced Micro Devices',
      price: 162.41,
      checkpointPrice: 158.75,
      sinceLastCheck: 2.3,
      attentionScore: 55,
      severity: 'IMPORTANT',
      reasons: [
        { type: 'VOLUME', text: 'Trading volume is 2.5× average.', metric: '2.5× avg' },
      ],
    };

    it('renders signal breakdown and non-causal explanation note', () => {
      render(<WhyChangedModal stock={mockStock} isOpen={true} onClose={vi.fn()} />);

      expect(screen.getByText(/Why AMD Matters Right Now/i)).toBeInTheDocument();
      expect(screen.getByText(/Trading volume is 2.5× average/i)).toBeInTheDocument();
      expect(screen.getByText(/Pulse identifies statistical anomalies and correlated developments/i)).toBeInTheDocument();
    });
  });
});
