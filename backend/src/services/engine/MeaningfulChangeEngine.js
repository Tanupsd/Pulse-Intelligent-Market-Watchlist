/**
 * MeaningfulChangeEngine
 * 
 * Core differentiating intelligence of Pulse.
 * Implements an explainable, deterministic attention scoring model
 * that evaluates what changed since the user's previous checkpoint.
 */

class MeaningfulChangeEngine {
  /**
   * Evaluate a single stock's current quote against its previous checkpoint,
   * market events, and benchmark index performance.
   * 
   * @param {Object} params
   * @param {Object} params.quote - Current market quote
   * @param {Object|null} params.checkpoint - User's previous checkpoint
   * @param {Array} params.events - Relevant market events
   * @param {Object} params.benchmark - Benchmark performance (e.g. S&P 500 / SPY)
   * @returns {Object} Evaluated change intelligence report
   */
  evaluate({ quote, checkpoint = null, events = [], benchmark = null }) {
    const currentPrice = Number(quote.price);
    const hasCheckpoint = Boolean(checkpoint && checkpoint.price);
    const checkpointPrice = hasCheckpoint ? Number(checkpoint.price) : currentPrice;

    // 1. Calculate price movement since last check
    let sinceLastCheckPercent = 0;
    if (hasCheckpoint && checkpointPrice > 0) {
      sinceLastCheckPercent = Number((((currentPrice - checkpointPrice) / checkpointPrice) * 100).toFixed(2));
    } else {
      // First check: fallback to daily change % as proxy baseline
      sinceLastCheckPercent = Number((quote.changePercent || 0).toFixed(2));
    }

    const absPriceDelta = Math.abs(sinceLastCheckPercent);

    // Score: Price Movement (max 40)
    let priceScore = 0;
    let priceReason = null;

    if (absPriceDelta >= 4.0) {
      priceScore = 40;
      const direction = sinceLastCheckPercent > 0 ? 'surged' : 'fell';
      priceReason = {
        type: 'PRICE',
        severity: 'CRITICAL',
        text: `Price ${direction} ${absPriceDelta}% since your last check (major movement).`,
        metric: `${sinceLastCheckPercent > 0 ? '+' : ''}${sinceLastCheckPercent}%`
      };
    } else if (absPriceDelta >= 2.5) {
      priceScore = 25;
      const direction = sinceLastCheckPercent > 0 ? 'gained' : 'declined';
      priceReason = {
        type: 'PRICE',
        severity: 'IMPORTANT',
        text: `Price ${direction} ${absPriceDelta}% since your last check (meaningful change).`,
        metric: `${sinceLastCheckPercent > 0 ? '+' : ''}${sinceLastCheckPercent}%`
      };
    } else if (absPriceDelta >= 1.0) {
      priceScore = 10;
      const direction = sinceLastCheckPercent > 0 ? 'rose' : 'dropped';
      priceReason = {
        type: 'PRICE',
        severity: 'WATCH',
        text: `Price ${direction} ${absPriceDelta}% since your last check.`,
        metric: `${sinceLastCheckPercent > 0 ? '+' : ''}${sinceLastCheckPercent}%`
      };
    }

    // 2. Volume Anomaly (max 25)
    const currentVolume = Number(quote.volume || 0);
    const averageVolume = Number(quote.averageVolume || currentVolume || 1);
    const volumeRatio = Number((currentVolume / (averageVolume || 1)).toFixed(2));

    let volumeScore = 0;
    let volumeReason = null;

    if (volumeRatio >= 3.0) {
      volumeScore = 25;
      volumeReason = {
        type: 'VOLUME',
        severity: 'CRITICAL',
        text: `Trading volume is ${volumeRatio}× the 30-day average (extreme surge).`,
        metric: `${volumeRatio}× avg`
      };
    } else if (volumeRatio >= 2.0) {
      volumeScore = 18;
      volumeReason = {
        type: 'VOLUME',
        severity: 'IMPORTANT',
        text: `Trading volume is ${volumeRatio}× the recent average (unusual activity).`,
        metric: `${volumeRatio}× avg`
      };
    } else if (volumeRatio >= 1.5) {
      volumeScore = 8;
      volumeReason = {
        type: 'VOLUME',
        severity: 'WATCH',
        text: `Trading volume is elevated at ${volumeRatio}× average.`,
        metric: `${volumeRatio}× avg`
      };
    }

    // 3. Market Events & Recency (max 25)
    let eventScore = 0;
    let highestEvent = null;
    let eventReason = null;

    if (events && events.length > 0) {
      // Find the most critical recent event
      for (const ev of events) {
        const evTime = new Date(ev.timestamp).getTime();
        const ageHours = (Date.now() - evTime) / (1000 * 60 * 60);

        // Calculate recency decay factor
        let recencyFactor = 1.0;
        if (ageHours > 12) {
          recencyFactor = 0.6;
        } else if (ageHours > 2) {
          recencyFactor = 0.85;
        }

        let baseEventPts = 0;
        const imp = (ev.importance || 'LOW').toUpperCase();
        if (imp === 'CRITICAL') baseEventPts = 25;
        else if (imp === 'HIGH') baseEventPts = 20;
        else if (imp === 'MEDIUM') baseEventPts = 10;
        else baseEventPts = 0;

        const effectivePts = Math.round(baseEventPts * recencyFactor);
        if (effectivePts > eventScore) {
          eventScore = effectivePts;
          highestEvent = ev;
        }
      }

      if (highestEvent && eventScore > 0) {
        eventReason = {
          type: 'EVENT',
          severity: highestEvent.importance === 'CRITICAL' || highestEvent.importance === 'HIGH' ? 'IMPORTANT' : 'WATCH',
          text: `Event detected: ${highestEvent.title}`,
          metric: `${highestEvent.importance} (${highestEvent.eventType || 'NEWS'})`,
          event: highestEvent
        };
      }
    }

    // 4. Relative Market Performance vs Benchmark (max 10)
    let relativeScore = 0;
    let relativeReason = null;
    let relativePerformance = 0;

    if (benchmark && typeof benchmark.changePercent === 'number') {
      const benchmarkDelta = benchmark.changePercent;
      // Compare daily change against benchmark
      relativePerformance = Number((quote.changePercent - benchmarkDelta).toFixed(2));
      const absRel = Math.abs(relativePerformance);

      if (absRel >= 3.0) {
        relativeScore = 10;
        const relation = relativePerformance > 0 ? 'outperformed' : 'lagged';
        relativeReason = {
          type: 'BENCHMARK',
          severity: 'WATCH',
          text: `Stock ${relation} the S&P 500 benchmark by ${absRel}% today.`,
          metric: `${relativePerformance > 0 ? '+' : ''}${relativePerformance}% vs SPY`
        };
      } else if (absRel >= 1.5) {
        relativeScore = 5;
        const relation = relativePerformance > 0 ? 'outperformed' : 'lagged';
        relativeReason = {
          type: 'BENCHMARK',
          severity: 'WATCH',
          text: `Stock ${relation} benchmark by ${absRel}%.`,
          metric: `${relativePerformance > 0 ? '+' : ''}${relativePerformance}% vs SPY`
        };
      }
    }

    // 5. Calculate Total Attention Score (0 - 100)
    const rawTotal = priceScore + volumeScore + eventScore + relativeScore;
    const attentionScore = Math.min(100, Math.max(0, rawTotal));

    // 6. Map to Severity Level
    let severity = 'NORMAL';
    if (attentionScore >= 75) {
      severity = 'CRITICAL';
    } else if (attentionScore >= 50) {
      severity = 'IMPORTANT';
    } else if (attentionScore >= 25) {
      severity = 'WATCH';
    } else {
      severity = 'NORMAL';
    }

    // 7. Compile Explanations (Strictly non-causal)
    const reasons = [];
    if (priceReason) reasons.push(priceReason);
    if (volumeReason) reasons.push(volumeReason);
    if (eventReason) reasons.push(eventReason);
    if (relativeReason) reasons.push(relativeReason);

    // If quiet/normal
    if (reasons.length === 0) {
      reasons.push({
        type: 'CALM',
        severity: 'NORMAL',
        text: hasCheckpoint 
          ? 'No meaningful changes detected since your last check.'
          : 'Initial baseline established. No notable anomalies detected.',
        metric: 'Quiet'
      });
    }

    const isMeaningful = severity !== 'NORMAL';

    return {
      symbol: quote.symbol,
      name: quote.name,
      sector: quote.sector,
      price: currentPrice,
      dailyChange: quote.changePercent,
      sinceLastCheck: sinceLastCheckPercent,
      hasCheckpoint,
      checkpointPrice: hasCheckpoint ? checkpointPrice : null,
      checkpointTimestamp: checkpoint ? checkpoint.timestamp : null,
      attentionScore,
      severity,
      isMeaningful,
      scoreBreakdown: {
        priceMovement: priceScore,
        volumeAnomaly: volumeScore,
        marketEvent: eventScore,
        relativePerformance: relativeScore,
        total: attentionScore,
      },
      signals: {
        volumeRatio,
        currentVolume,
        averageVolume,
        relativePerformance,
        highestEventImportance: highestEvent ? highestEvent.importance : null,
      },
      reasons,
      dataStatus: quote.dataStatus || 'LIVE',
      source: quote.source || 'PROVIDER',
      timestamp: quote.timestamp || new Date().toISOString(),
    };
  }

  /**
   * Batch evaluate multiple stocks in a watchlist and rank by attention score DESC.
   */
  rankWatchlistChanges({ quotes, checkpoints = {}, eventsBySymbol = {}, benchmark = null }) {
    const evaluated = quotes.map(quote => {
      const sym = quote.symbol.toUpperCase();
      const cp = checkpoints[sym] || null;
      const events = eventsBySymbol[sym] || [];
      return this.evaluate({ quote, checkpoint: cp, events, benchmark });
    });

    // Rank primarily by Attention Score DESC, secondarily by absolute price delta DESC
    evaluated.sort((a, b) => {
      if (b.attentionScore !== a.attentionScore) {
        return b.attentionScore - a.attentionScore;
      }
      return Math.abs(b.sinceLastCheck) - Math.abs(a.sinceLastCheck);
    });

    const meaningfulCount = evaluated.filter(s => s.isMeaningful).length;
    const attentionCounts = {
      critical: evaluated.filter(s => s.severity === 'CRITICAL').length,
      important: evaluated.filter(s => s.severity === 'IMPORTANT').length,
      watch: evaluated.filter(s => s.severity === 'WATCH').length,
      normal: evaluated.filter(s => s.severity === 'NORMAL').length,
    };

    return {
      meaningfulChanges: meaningfulCount,
      attention: attentionCounts,
      stocks: evaluated,
    };
  }
}

module.exports = new MeaningfulChangeEngine();
