# Pulse — Meaningful Change Engine Specification

## 1. Core Thesis

Traditional stock watchlists focus on raw quotes:
```text
AAPL  $241.20  +0.42%
NVDA  $184.32  -4.80%
AMD   $162.41  +2.30%
```

This forces investors to constantly scan rows of numbers and mentally compute:
- *Was this down when I checked earlier today, or did it drop just now?*
- *Is this volume normal or an anomaly?*
- *Is there a breaking corporate development behind this move?*

**Pulse reverses this burden.** It tracks the user's explicit checkpoint and computes:
$$\text{Current Market State} - \text{User Checkpoint} = \Delta \text{ Meaningful Changes}$$

---

## 2. Algorithmic Pipeline

```text
User Opens Pulse
       ↓
System Identifies User Checkpoint (Timestamp & Prior State)
       ↓
Fetch Current Quotes (Price, Volume, Average Volume)
       ↓
Fetch Recent Verified Events (Within Checkpoint Interval)
       ↓
Compute Delta & Normalized Signals:
  • Price Delta (%)
  • Volume Anomaly (Current / 30-Day Avg)
  • Event Importance & Recency
  • Benchmark Relative Decoupling (vs. S&P 500)
       ↓
Deterministic Attention Scoring Engine (0 – 100)
       ↓
Severity Classification (CRITICAL, IMPORTANT, WATCH, NORMAL)
       ↓
Non-Causal Natural Language Explanation Generation
       ↓
Ranked Output Sorted by Attention Score DESC
```

---

## 3. Attention Scoring Model

The Attention Score is bounded between **0 and 100** points across four orthogonal dimensions:

### A. Price Movement ($\le 40$ points)
Evaluates the magnitude of price deviation since the user's previous checkpoint:

| $|\Delta \text{ Price}|$ | Points | Classification |
| :--- | :--- | :--- |
| $\ge 4.0\%$ | **40 pts** | Major Price Shock |
| $2.5\% - 3.99\%$ | **25 pts** | Meaningful Movement |
| $1.0\% - 2.49\%$ | **10 pts** | Small Movement |
| $< 1.0\%$ | **0 pts** | Insignificant / Routine Noise |

### B. Volume Anomaly ($\le 25$ points)
Calculates trading activity ratio:
$$\text{Volume Ratio} = \frac{\text{Current Session Volume}}{\text{30-Day Average Volume}}$$

| Volume Ratio | Points | Classification |
| :--- | :--- | :--- |
| $\ge 3.0\times$ | **25 pts** | Extreme Institutional Surge |
| $2.0\times - 2.99\times$ | **18 pts** | Unusual Trading Activity |
| $1.5\times - 1.99\times$ | **8 pts** | Notable Turnover |
| $< 1.5\times$ | **0 pts** | Standard Baseline |

### C. Market Events & Recency ($\le 25$ points)
Considers qualitative regulatory, corporate earnings, guidance, and analyst actions with a time-decay factor:

| Importance Level | Base Points | Typical Triggers |
| :--- | :--- | :--- |
| **CRITICAL** | 25 pts | Regulatory indictments, CEO departures, emergency halt |
| **HIGH** | 20 pts | Earnings surprise, guidance cuts, antitrust investigations |
| **MEDIUM** | 10 pts | Major contract award, analyst rating changes |
| **LOW** | 0 pts | Routine press releases, neutral commentary |

**Recency Decay Factor ($R_f$):**
- Age $\le 2$ hours: $R_f = 1.0$
- $2 < \text{Age} \le 12$ hours: $R_f = 0.85$
- $\text{Age} > 12$ hours: $R_f = 0.60$
$$\text{Event Score} = \text{round}(\text{Base Points} \times R_f)$$

### D. Benchmark Relative Decoupling ($\le 10$ points)
Measures idiosyncratic movement against the market benchmark (S&P 500 / SPY ETF):
$$\text{Relative Performance} = \Delta \text{ Stock} - \Delta \text{ Benchmark}$$

| $|\text{Relative Performance}|$ | Points |
| :--- | :--- |
| $\ge 3.0\%$ | **10 pts** |
| $1.5\% - 2.99\%$ | **5 pts** |
| $< 1.5\%$ | **0 pts** |

---

## 4. Severity Mapping

$$\text{Attention Score} = \min(100, \text{Price} + \text{Volume} + \text{Event} + \text{Benchmark})$$

| Attention Score | Severity Tier | Visual Accent | UI Action |
| :--- | :--- | :--- | :--- |
| **75 – 100** | **CRITICAL** | 🔴 Red | Ranked #1, prominent alert |
| **50 – 74** | **IMPORTANT** | 🟠 Orange | Prominent placement |
| **25 – 49** | **WATCH** | 🟡 Yellow | Secondary placement |
| **0 – 24** | **NORMAL** | 🟢 Green | Subdued, collapsed if quiet |

---

## 5. Non-Causal Explanation Principles

Pulse strictly abides by financial communication integrity:
1. **Never assert causality without hard evidence**:
   - ❌ *“Antitrust lawsuit caused NVIDIA stock to collapse.”*
   - ✅ *“Price dropped 4.8% since your last check. A high-importance regulatory event coincided with the move.”*
2. **Confidence Attribution**:
   - Scores $\ge 70$: **HIGH CONFIDENCE** (multiple corroborating signals).
   - Scores $40 - 69$: **MODERATE CONFIDENCE** (single strong signal or mixed factors).
   - Scores $< 40$: **LOW / ROUTINE** (drift within standard volatility bands).

---

## 6. Why Deterministic Scoring vs. Machine Learning?

For a mission-critical financial watchlist MVP, deterministic explainable scoring is vastly superior to black-box machine learning:

1. **Complete Explainability**: Users can inspect the exact breakdown ($40 + 18 + 20 + 10 = 88$).
2. **Instant Reproducibility & Auditability**: Two identical market states produce identical scores.
3. **Zero Hallucinations**: Reasons are generated directly from verified market metrics.
4. **Deterministic Testing**: 100% testable via unit tests in milliseconds without GPU or network latency.
5. **No Cold-Start Penalty**: Works seamlessly on day one with zero training data.
