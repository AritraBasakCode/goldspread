GOLDSPREAD: MCX Cross-Contract Relative-Value Engine

A quantitative research and decision-support terminal for MCX gold derivatives: GOLDM, GOLDTEN, GOLDGUINEA, and GOLDPETAL.

Hackathon: Hack in Hills
Team: Digital Twins
Team Members: Aritra Basak and Avirup Chakraborty


1. PROBLEM STATEMENT

MCX lists multiple gold futures contracts linked to the same underlying metal. However, comparing their raw prices directly can produce misleading results because of differences in contract specifications and trading conditions.

Key Challenges:

• Contract Size and Quotation Basis: GOLDM and GOLDTEN represent 10 grams, GOLDGUINEA represents 8 grams, and GOLDPETAL represents 1 gram.

• Purity Differences: Contracts may differ in gold purity specifications, including 995 and 999 fineness.

• Liquidity and Slippage: Bid-ask spreads, trading volumes, and order book depth vary across contracts.

• Expiry and Delivery Effects: Price differences may arise from expiry dates, delivery obligations, and tender periods rather than genuine pricing inefficiencies.

Comparing raw prices can generate false arbitrage signals. After accounting for transaction costs, liquidity constraints, and execution slippage, these opportunities may no longer be profitable.

GOLDSPREAD addresses this problem by standardizing contract prices, analyzing relative-value deviations, and filtering unreliable trading signals.


2. KEY FEATURES

2.1 Contract Normalization

Converts contract prices into a common benchmark expressed in Indian rupees per 10 grams of gold at 999 fineness. This enables meaningful comparisons across contracts with different sizes and purity specifications.

2.2 Relative-Value Analytics

Tracks normalized price spreads and calculates rolling statistical baselines and Z-scores to identify unusual deviations from historical relationships.

2.3 The No Signal Architecture

Uses a four-stage filtering mechanism to suppress unreliable signals before they reach the dashboard.

Stage 1 — Statistical Noise Filter:
Rejects deviations that do not exceed the configured Z-score threshold.

Stage 2 — Liquidity Filter:
Rejects potential trades when available order book depth is insufficient for the intended trade size.

Stage 3 — Transaction Cost Filter:
Rejects opportunities that fail to cover estimated brokerage, Commodity Transaction Tax (CTT), stamp duty, bid-ask spreads, and slippage.

Stage 4 — Expiry and Delivery Filter:
Suppresses signals within five days of contract expiry to reduce exposure to delivery-related distortions and rollover risks.

A signal proceeds to further analysis only after passing all four filters.

2.4 Walk-Forward Backtesting

Evaluates the strategy using historical data in chronological order. Parameters are estimated using past observations and tested on subsequent unseen periods to reduce look-ahead bias.

Performance evaluation includes estimated transaction costs and execution friction to assess net returns.

2.5 Explainable Anomaly Diagnostics

Generates natural-language explanations for detected price divergences, highlighting statistical deviations and relevant factors such as liquidity, transaction costs, contract specifications, and expiry proximity.


3. SYSTEM ARCHITECTURE

MCX Daily Bhavcopy and Settlement Data
                 |
                 v
        Data Validation Layer
                 |
                 v
       Contract Metadata Engine
                 |
                 v
         Normalization Pipeline
        (INR per 10g, 999 Fineness)
                 |
                 v
      Relative-Value Analytics Engine
        (Spread and Z-Score Analysis)
                 |
                 v
        Four-Stage Signal Filter
                 |
                 v
         Signal Generation
                 |
                 v
       Walk-Forward Backtesting
                 |
                 v
        React + Vite Dashboard


4. TECHNOLOGY STACK

Data Sources:
MCX daily Bhavcopy and settlement data.

Data Processing:
Data validation, contract metadata mapping, and price normalization.

Analytics:
Relative-value spread calculations, rolling statistics, and Z-score analysis.

Signal Validation:
Statistical thresholds, liquidity checks, transaction cost estimation, and expiry filters.

Backtesting:
Walk-forward historical evaluation with transaction cost adjustments.

Frontend:
React and Vite for the interactive intelligence dashboard.


5. PROJECT OBJECTIVE

GOLDSPREAD aims to make cross-contract gold price analysis more reliable by distinguishing genuine relative-value deviations from differences caused by contract specifications and market mechanics.

The system is designed as a quantitative research and decision-support tool. Rather than assuming every price divergence represents an arbitrage opportunity, it identifies, validates, and explains potential opportunities before they are considered for execution.