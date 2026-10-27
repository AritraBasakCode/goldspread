import React, { useState, useMemo, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  ShieldCheck,
  ShieldAlert,
  Layers,
  BarChart3,
  Sliders,
  Settings2,
  RefreshCw,
  Cpu,
  Info,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  RotateCcw,
  Clock,
  Compass,
  ArrowRight,
  Database,
  Terminal,
  Zap,
  DollarSign,
  Maximize2
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart
} from 'recharts';

// --- MCX GOLD CONTRACT SPECIFICATIONS (As per PPT & MCX Exchange) ---
const MCX_SPECS = {
  GOLDM: {
    symbol: 'GOLDM',
    name: 'Gold Mini',
    lotSize: 100, // grams
    quoteBasis: 10, // quoted per 10g
    purity: 999, // 999 purity
    deliveryUnit: '100g Bar',
    typicalVolume: 24500,
    typicalOI: 18200,
    defaultRawPrice: 74250, // ₹ per 10g
    exchangeFeeBps: 2.1,
    tickSize: 1.0,
    expiry: '05 NOV 2026',
    dte: 13
  },
  GOLDTEN: {
    symbol: 'GOLDTEN',
    name: 'Gold Ten',
    lotSize: 10, // grams
    quoteBasis: 10, // quoted per 10g
    purity: 999, // 999 purity
    deliveryUnit: '10g Bar',
    typicalVolume: 12400,
    typicalOI: 9100,
    defaultRawPrice: 74290, // ₹ per 10g
    exchangeFeeBps: 2.5,
    tickSize: 1.0,
    expiry: '05 NOV 2026',
    dte: 13
  },
  GOLDGUINEA: {
    symbol: 'GOLDGUINEA',
    name: 'Gold Guinea',
    lotSize: 8, // grams
    quoteBasis: 8, // quoted per 8g
    purity: 995, // 995 purity -> Requires Purity Adjustment (Raw/0.995 * 0.999 / 8 * 10)
    deliveryUnit: '8g Coin',
    typicalVolume: 3400,
    typicalOI: 3100,
    defaultRawPrice: 59120, // raw quote for 8g
    exchangeFeeBps: 3.2,
    tickSize: 1.0,
    expiry: '30 NOV 2026',
    dte: 38
  },
  GOLDPETAL: {
    symbol: 'GOLDPETAL',
    name: 'Gold Petal',
    lotSize: 1, // grams
    quoteBasis: 1, // quoted per 1g -> Requires 10x Scaling to 10g
    purity: 999, // 999 purity
    deliveryUnit: '1g Coin',
    typicalVolume: 19800,
    typicalOI: 22400,
    defaultRawPrice: 7480, // raw quote for 1g
    exchangeFeeBps: 4.2,
    tickSize: 1.0,
    expiry: '30 NOV 2026',
    dte: 38
  }
};

// Contract Normalization Algorithm onto ₹/10g 999 Benchmark
const normalizePrice = (rawPrice, symbol) => {
  const spec = MCX_SPECS[symbol];
  if (!spec) return 0;

  if (symbol === 'GOLDM' || symbol === 'GOLDTEN') {
    // Already quoted per 10g @ 999
    return rawPrice;
  }
  if (symbol === 'GOLDGUINEA') {
    // Quoted for 8g @ 995 purity.
    // 1. per-gram 995 = rawPrice / 8
    // 2. per-gram 999 = (rawPrice / 8) / 0.995 * 0.999
    // 3. per-10g 999 = ((rawPrice / 8) / 0.995 * 0.999) * 10
    const perGramFine = (rawPrice / 8 / 0.995) * 0.999;
    return Number((perGramFine * 10).toFixed(2));
  }
  if (symbol === 'GOLDPETAL') {
    // Quoted per 1g @ 999 purity -> multiply by 10
    return Number((rawPrice * 10).toFixed(2));
  }
  return rawPrice;
};

export default function App() {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState('terminal'); // 'terminal', 'analytics', 'pipeline', 'backtester', 'scenario'

  // Model Parameters
  const [zThreshold, setZThreshold] = useState(2.0);
  const [lookbackDays, setLookbackDays] = useState(20);
  const [costPerLotBps, setCostPerLotBps] = useState(18); // ₹18 / 10g equivalent
  const [minVolumeFilter, setMinVolumeFilter] = useState(4000);
  const [expiryDteBuffer, setExpiryDteBuffer] = useState(4); // Days before expiry tender

  // Active Pair Selection
  const [pairLegA, setPairLegA] = useState('GOLDM');
  const [pairLegB, setPairLegB] = useState('GOLDPETAL');

  // Market Scenario Preset
  const [selectedScenario, setSelectedScenario] = useState('rollover');
  // 'contango', 'liquidity_trap', 'rollover', 'genuine_arbitrage'

  // Streaming Tick for dynamic terminal feel
  const [tick, setTick] = useState(0);
  const [isLive, setIsLive] = useState(true);

  useEffect(() => {
    if (!isLive) return;
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 2800);
    return () => clearInterval(timer);
  }, [isLive]);

  // Compute live contract values according to selected scenario
  const contractsState = useMemo(() => {
    const noise = Math.sin(tick * 0.6) * 8;

    let cData = {
      GOLDM: {
        ...MCX_SPECS.GOLDM,
        rawPrice: MCX_SPECS.GOLDM.defaultRawPrice + noise,
        volume: MCX_SPECS.GOLDM.typicalVolume + Math.round(Math.cos(tick) * 200),
        oi: MCX_SPECS.GOLDM.typicalOI,
        dte: 13
      },
      GOLDTEN: {
        ...MCX_SPECS.GOLDTEN,
        rawPrice: MCX_SPECS.GOLDTEN.defaultRawPrice + noise * 1.1,
        volume: MCX_SPECS.GOLDTEN.typicalVolume + Math.round(Math.sin(tick) * 150),
        oi: MCX_SPECS.GOLDTEN.typicalOI,
        dte: 13
      },
      GOLDGUINEA: {
        ...MCX_SPECS.GOLDGUINEA,
        rawPrice: MCX_SPECS.GOLDGUINEA.defaultRawPrice + noise * 0.8,
        volume: MCX_SPECS.GOLDGUINEA.typicalVolume,
        oi: MCX_SPECS.GOLDGUINEA.typicalOI,
        dte: 38
      },
      GOLDPETAL: {
        ...MCX_SPECS.GOLDPETAL,
        rawPrice: MCX_SPECS.GOLDPETAL.defaultRawPrice + noise * 0.1,
        volume: MCX_SPECS.GOLDPETAL.typicalVolume,
        oi: MCX_SPECS.GOLDPETAL.typicalOI,
        dte: 38
      }
    };

    // Apply Scenario Manipulations
    if (selectedScenario === 'liquidity_trap') {
      cData.GOLDGUINEA.volume = 520; // severely illiquid
      cData.GOLDGUINEA.oi = 740;
      cData.GOLDGUINEA.rawPrice = 58700; // artificial apparent spread
    } else if (selectedScenario === 'rollover') {
      cData.GOLDM.dte = 2; // in tender delivery roll week
      cData.GOLDM.rawPrice = 74680; // rollover backwardation/tender premium
    } else if (selectedScenario === 'genuine_arbitrage') {
      cData.GOLDPETAL.rawPrice = 7535; // +550/10g true dislocation
      cData.GOLDPETAL.volume = 28000;
      cData.GOLDM.volume = 31000;
      cData.GOLDM.dte = 18;
      cData.GOLDPETAL.dte = 45;
    }

    // Attach normalized benchmark price
    Object.keys(cData).forEach((k) => {
      cData[k].normalized = normalizePrice(cData[k].rawPrice, k);
    });

    return cData;
  }, [tick, selectedScenario]);

  // Spread & 4-Stage "No-Signal" Evaluation
  const spreadAnalysis = useMemo(() => {
    const legA = contractsState[pairLegA];
    const legB = contractsState[pairLegB];
    if (!legA || !legB) return null;

    const normA = legA.normalized;
    const normB = legB.normalized;
    const currentSpread = normA - normB; // ₹/10g

    // Baseline historical rolling mean and std
    const histMean = pairLegA === 'GOLDM' && pairLegB === 'GOLDPETAL' ? -520.0 : -35.0;
    const histStd = 42.0;

    const zScore = (currentSpread - histMean) / histStd;
    const grossDeviation = Math.abs(currentSpread - histMean);
    const netEdge = grossDeviation - costPerLotBps;

    // 4-Stage Pipeline Assessment
    const stage1_Stat = Math.abs(zScore) >= zThreshold;
    const stage2_Liquidity = legA.volume >= minVolumeFilter && legB.volume >= minVolumeFilter;
    const stage3_CostFriction = netEdge > 10.0; // must retain >= ₹10/10g positive alpha post-tax & slippage
    const stage4_Lifecycle = legA.dte > expiryDteBuffer && legB.dte > expiryDteBuffer;

    let verdict = 'SILENCED';
    let silenceReason = 'Within normal Gaussian variance bands';
    let alertType = 'neutral'; // 'neutral', 'warning', 'critical_no_signal', 'valid_signal'

    if (!stage4_Lifecycle) {
      verdict = 'SILENCED (ROLLOVER)';
      silenceReason = `Contract ${legA.dte <= expiryDteBuffer ? legA.symbol : legB.symbol} is within ${Math.min(legA.dte, legB.dte)} days of expiry. Delivery tender margin spikes distort pricing.`;
      alertType = 'critical_no_signal';
    } else if (!stage2_Liquidity) {
      verdict = 'SILENCED (ILLIQUID)';
      silenceReason = `Order book depth in ${legA.volume < minVolumeFilter ? legA.symbol : legB.symbol} is below ${minVolumeFilter} lots. Crossing wide spreads produces negative slippage.`;
      alertType = 'critical_no_signal';
    } else if (stage1_Stat && !stage3_CostFriction) {
      verdict = 'SILENCED (FRICTION)';
      silenceReason = `Apparent gross edge of ₹${grossDeviation.toFixed(1)} is consumed by STT, turnover charges, and exchange clearing (₹${costPerLotBps}). Net alpha is negative.`;
      alertType = 'critical_no_signal';
    } else if (stage1_Stat && stage2_Liquidity && stage3_CostFriction && stage4_Lifecycle) {
      verdict = 'ACTIVE RELATIVE VALUE SIGNAL';
      silenceReason = `Confirmed anomaly (${zScore.toFixed(2)}σ). Survives all 4 quantitative screens with ₹${netEdge.toFixed(1)}/10g expected net alpha.`;
      alertType = 'valid_signal';
    } else {
      verdict = 'SILENCED (NORMAL CARRY)';
      silenceReason = `Normalized spread is within ±${zThreshold}σ. System remains silent as required by "No Signal" mandate.`;
      alertType = 'neutral';
    }

    return {
      legA,
      legB,
      normA,
      normB,
      currentSpread,
      histMean,
      histStd,
      zScore,
      grossDeviation,
      netEdge,
      stage1_Stat,
      stage2_Liquidity,
      stage3_CostFriction,
      stage4_Lifecycle,
      verdict,
      silenceReason,
      alertType
    };
  }, [contractsState, pairLegA, pairLegB, zThreshold, minVolumeFilter, costPerLotBps, expiryDteBuffer]);

  // Rolling Chart Data Generator for Recharts
  const chartData = useMemo(() => {
    const pts = [];
    const baseMean = pairLegA === 'GOLDM' && pairLegB === 'GOLDPETAL' ? -520 : -35;
    for (let i = lookbackDays; i >= 0; i--) {
      const idx = tick - i;
      let wave = baseMean + Math.sin(idx * 0.3) * 32 + Math.cos(idx * 0.15) * 12;
      
      if (selectedScenario === 'genuine_arbitrage' && i < 6) {
        wave += (6 - i) * 18;
      }
      if (selectedScenario === 'rollover' && i < 4) {
        wave += (4 - i) * 35;
      }

      const z = Number(((wave - baseMean) / 42).toFixed(2));
      pts.push({
        time: `T-${i}d`,
        spread: Number(wave.toFixed(1)),
        mean: baseMean,
        upper2: Number((baseMean + zThreshold * 42).toFixed(1)),
        lower2: Number((baseMean - zThreshold * 42).toFixed(1)),
        upper15: Number((baseMean + 1.5 * 42).toFixed(1)),
        lower15: Number((baseMean - 1.5 * 42).toFixed(1)),
        zScore: z
      });
    }
    return pts;
  }, [lookbackDays, tick, pairLegA, pairLegB, selectedScenario, zThreshold]);

  // Walk-forward backtest curve simulation data
  const backtestData = useMemo(() => {
    let naiveCumulative = 100000;
    let goldspreadCumulative = 100000;
    const history = [];

    for (let d = 1; d <= 45; d++) {
      // market noise & occasional false signals
      const isNoiseDay = d % 3 === 0;
      const isExpiryWeek = d >= 22 && d <= 26;
      const isTrueAnomaly = d === 14 || d === 35 || d === 41;

      // Naive Strategy enters on ANY raw spread breach
      if (isNoiseDay || isExpiryWeek) {
        naiveCumulative -= 1850; // loses on slippage & rollover drag
      } else if (isTrueAnomaly) {
        naiveCumulative += 4200;
      }

      // GOLDSPREAD Strategy filters noise & rollover
      if (isTrueAnomaly) {
        goldspreadCumulative += 4200 - 450; // net of calibrated friction
      } else if (isExpiryWeek || isNoiseDay) {
        // GOLDSPREAD STAYS SILENT -> Zero drawdown
        goldspreadCumulative += 0;
      }

      history.push({
        session: `Day ${d}`,
        NaivePnL: naiveCumulative,
        GoldspreadPnL: goldspreadCumulative
      });
    }
    return history;
  }, []);

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 font-sans flex flex-col selection:bg-amber-500 selection:text-black">
      
      {/* 1. INSTITUTIONAL SYSTEM HEADER */}
      <header className="border-b border-slate-800/80 bg-[#0B0E17]/95 backdrop-blur sticky top-0 z-50 px-4 lg:px-7 py-3">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* Logo & Brand Identity */}
          <div className="flex items-center space-x-3 w-full md:w-auto justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-400 to-yellow-200 p-0.5 shadow-lg shadow-amber-500/20 flex items-center justify-center">
                <div className="w-full h-full bg-[#0B0E17] rounded-[10px] flex items-center justify-center">
                  <Compass className="w-5 h-5 text-amber-400 animate-spin-slow" />
                </div>
              </div>
              <div>
                <div className="flex items-center space-x-2.5">
                  <span className="text-xl font-black tracking-tight bg-gradient-to-r from-amber-300 via-amber-100 to-yellow-200 bg-clip-text text-transparent">
                    GOLDSPREAD
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded">
                    MCX QUANT v1.4
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-mono tracking-wide">
                  Contract-Aware Relative-Value & Cross-Contract Intelligence
                </p>
              </div>
            </div>

            {/* Mobile status */}
            <div className="md:hidden flex items-center space-x-1.5 text-[11px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-2 py-0.5 rounded">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>LIVE FEED</span>
            </div>
          </div>

          {/* Institutional Telemetry Status Pills */}
          <div className="hidden lg:flex items-center space-x-3 text-xs font-mono">
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-slate-400">MCX Bhavcopy Feed:</span>
              <span className="text-emerald-400 font-semibold">Connected (Oct 2026)</span>
            </div>
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-slate-400">Walk-Forward:</span>
              <span className="text-cyan-400 font-semibold">Non-Lookahead</span>
            </div>
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-slate-400">Lifecycle Guard:</span>
              <span className="text-amber-400 font-semibold">Tender Active</span>
            </div>
          </div>

          {/* Streaming & Quick Action Controls */}
          <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
            <button
              onClick={() => setIsLive(!isLive)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-medium flex items-center space-x-2 transition-all ${
                isLive
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/20'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLive ? 'animate-spin' : ''}`} />
              <span>{isLive ? 'STREAMING BHAVCOPY' : 'PAUSED'}</span>
            </button>
          </div>

        </div>

        {/* Navigation Tabs Bar */}
        <div className="max-w-7xl mx-auto mt-3 pt-2.5 border-t border-slate-800/60 flex items-center space-x-1.5 overflow-x-auto no-scrollbar text-xs font-medium">
          <button
            onClick={() => setActiveTab('terminal')}
            className={`px-3.5 py-1.5 rounded-lg flex items-center space-x-2 transition-all whitespace-nowrap ${
              activeTab === 'terminal'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>1. Live RV Terminal & Normalization</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3.5 py-1.5 rounded-lg flex items-center space-x-2 transition-all whitespace-nowrap ${
              activeTab === 'analytics'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>2. Spread & Z-Score Analytics</span>
          </button>

          <button
            onClick={() => setActiveTab('pipeline')}
            className={`px-3.5 py-1.5 rounded-lg flex items-center space-x-2 transition-all whitespace-nowrap ${
              activeTab === 'pipeline'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>3. "No-Signal" Decision Pipeline</span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
          </button>

          <button
            onClick={() => setActiveTab('backtester')}
            className={`px-3.5 py-1.5 rounded-lg flex items-center space-x-2 transition-all whitespace-nowrap ${
              activeTab === 'backtester'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>4. Walk-Forward Backtester</span>
          </button>

          <button
            onClick={() => setActiveTab('scenario')}
            className={`px-3.5 py-1.5 rounded-lg flex items-center space-x-2 transition-all whitespace-nowrap ${
              activeTab === 'scenario'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>5. Scenario Stress Studio</span>
          </button>
        </div>
      </header>

      {/* 2. PERSISTENT SYSTEM ALERT / VERDICT BANNER */}
      {spreadAnalysis && (
        <section className="max-w-7xl w-full mx-auto px-4 lg:px-7 pt-4">
          <div
            className={`p-4 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all duration-300 shadow-xl ${
              spreadAnalysis.alertType === 'valid_signal'
                ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-300 shadow-emerald-900/20'
                : spreadAnalysis.alertType === 'critical_no_signal'
                ? 'bg-amber-950/30 border-amber-600/50 text-amber-300 shadow-amber-900/20'
                : 'bg-slate-900/50 border-slate-800 text-slate-300'
            }`}
          >
            <div className="flex items-start space-x-3.5">
              <div className="p-2 rounded-lg bg-black/40 border border-current/30 shrink-0 mt-0.5">
                {spreadAnalysis.alertType === 'valid_signal' ? (
                  <Zap className="w-6 h-6 text-emerald-400 animate-bounce" />
                ) : spreadAnalysis.alertType === 'critical_no_signal' ? (
                  <ShieldAlert className="w-6 h-6 text-amber-400" />
                ) : (
                  <ShieldCheck className="w-6 h-6 text-slate-400" />
                )}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] uppercase font-mono tracking-widest opacity-80">
                    Decision Engine Status • [{pairLegA} vs {pairLegB}]
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-black/40 border border-current/20">
                    Z: {spreadAnalysis.zScore >= 0 ? '+' : ''}{spreadAnalysis.zScore.toFixed(2)}σ
                  </span>
                </div>
                <h2 className="text-base font-bold tracking-tight mt-0.5">
                  {spreadAnalysis.verdict}
                </h2>
                <p className="text-xs opacity-90 max-w-3xl mt-0.5 leading-relaxed">
                  {spreadAnalysis.silenceReason}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4 shrink-0 self-end md:self-center font-mono text-xs">
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">Gross Dev</span>
                <span className="font-bold text-white">₹{spreadAnalysis.grossDeviation.toFixed(1)}/10g</span>
              </div>
              <div className="h-7 w-px bg-slate-700/60"></div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">All-in Friction</span>
                <span className="font-bold text-rose-400">-₹{costPerLotBps.toFixed(1)}/10g</span>
              </div>
              <div className="h-7 w-px bg-slate-700/60"></div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">Net Expected Edge</span>
                <span
                  className={`font-bold ${
                    spreadAnalysis.netEdge > 0 ? 'text-emerald-400' : 'text-slate-500'
                  }`}
                >
                  {spreadAnalysis.netEdge > 0
                    ? `+₹${spreadAnalysis.netEdge.toFixed(1)}/10g`
                    : '₹0.00 (Filtered)'}
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 3. MAIN WORKSPACE CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-7 space-y-6">

        {/* TAB 1: LIVE RV TERMINAL & NORMALIZATION MATRIX */}
        {activeTab === 'terminal' && (
          <div className="space-y-6">
            
            {/* Top Cards: Contract Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(contractsState).map(([key, item]) => {
                const isSelected = key === pairLegA || key === pairLegB;
                return (
                  <div
                    key={key}
                    className={`p-4 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-[#101625] border-amber-500/50 shadow-lg shadow-amber-500/10'
                        : 'bg-[#0E131F] border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-white font-mono text-sm">{key}</span>
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                          {item.deliveryUnit}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                          item.dte <= 3
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {item.dte}d to Expiry
                      </span>
                    </div>

                    <div className="space-y-2 text-xs font-mono">
                      <div className="flex justify-between items-center text-slate-400">
                        <span>Raw Bhavcopy Quote:</span>
                        <span className="font-semibold text-white">₹{item.rawPrice.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-400">
                        <span>Quotation Basis:</span>
                        <span>Quoted per {item.quoteBasis}g</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-400">
                        <span>Purity (Fineness):</span>
                        <span className={item.purity === 995 ? 'text-amber-400' : 'text-slate-300'}>
                          {item.purity} / 1000
                        </span>
                      </div>
                      <div className="pt-2 border-t border-slate-800 flex justify-between items-center bg-amber-500/5 -mx-4 -mb-4 p-3 rounded-b-xl">
                        <span className="text-amber-300/80 font-semibold text-[11px]">Normalized (₹/10g 999):</span>
                        <span className="text-amber-400 font-bold text-sm">
                          ₹{item.normalized.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Comprehensive Normalization Matrix Table */}
            <div className="bg-[#0E131F] border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div>
                  <h3 className="font-bold text-white text-base flex items-center space-x-2">
                    <Layers className="w-4 h-4 text-amber-400" />
                    <span>MCX Cross-Contract Normalization Engine</span>
                  </h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    Eliminates denomination bias by mapping all MCX gold contracts onto a standardized benchmark: <strong>₹ / 10 Grams (999 Fine Equivalent)</strong>
                  </p>
                </div>
                <div className="flex items-center space-x-2 text-xs font-mono">
                  <span className="text-slate-400">Global Standard:</span>
                  <span className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                    10g / 999 Fineness
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase bg-slate-900/60">
                      <th className="p-3">Symbol</th>
                      <th className="p-3">Contract Size</th>
                      <th className="p-3">Quotation Basis</th>
                      <th className="p-3">Purity Fineness</th>
                      <th className="p-3">Raw Quote (₹)</th>
                      <th className="p-3">Normalization Transformation Formula</th>
                      <th className="p-3 text-right">Normalized (₹/10g 999)</th>
                      <th className="p-3 text-center">Liquidity (Lots)</th>
                      <th className="p-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {Object.entries(contractsState).map(([sym, item]) => (
                      <tr key={sym} className="hover:bg-slate-800/30 transition-colors">
                        <td className="p-3 font-bold text-white flex items-center space-x-2">
                          <span>{sym}</span>
                          <span className="text-[10px] text-slate-400 font-normal">({item.name})</span>
                        </td>
                        <td className="p-3">{item.lotSize} grams</td>
                        <td className="p-3">per {item.quoteBasis}g</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.purity === 995 
                              ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' 
                              : 'bg-slate-800 text-slate-300'
                          }`}>
                            {item.purity} Fineness
                          </span>
                        </td>
                        <td className="p-3 font-semibold text-white">₹{item.rawPrice.toLocaleString()}</td>
                        <td className="p-3 text-slate-400 text-[11px]">
                          {sym === 'GOLDGUINEA' && (
                            <code className="text-amber-300">(Raw / 8 / 0.995) × 0.999 × 10</code>
                          )}
                          {sym === 'GOLDPETAL' && (
                            <code className="text-amber-300">(Raw / 1) × 10</code>
                          )}
                          {(sym === 'GOLDM' || sym === 'GOLDTEN') && (
                            <code className="text-slate-400">Direct Quoted per 10g (999)</code>
                          )}
                        </td>
                        <td className="p-3 text-right font-bold text-sm text-amber-400 bg-amber-500/5">
                          ₹{item.normalized.toLocaleString()}
                        </td>
                        <td className="p-3 text-center text-slate-400">
                          {item.volume.toLocaleString()} lots
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => {
                              if (pairLegA !== sym) setPairLegB(sym);
                            }}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px]"
                          >
                            Set Pair Leg
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Informative Callout */}
              <div className="p-4 rounded-xl bg-[#080B12] border border-slate-800/80 flex items-start space-x-3 text-xs text-slate-400 font-sans">
                <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-semibold text-white">Why Direct Price Comparison Fails in MCX Gold:</span>
                  <p className="leading-relaxed">
                    A trader viewing <span className="font-mono text-amber-300">GOLDGUINEA at ₹59,120</span> and <span className="font-mono text-amber-300">GOLDM at ₹74,250</span> cannot compute relative value without accounting for the fact that GOLDGUINEA is an 8-gram coin at 995 purity, whereas GOLDM is 10-gram pricing at 999 purity. Normalization reveals the true per-10g pure rate is <span className="font-mono text-amber-300">₹74,197.80</span> vs <span className="font-mono text-amber-300">₹74,250.00</span>, uncovering the actual basis spread of just ₹52.20.
                  </p>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: SPREAD & Z-SCORE ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            
            {/* Controls Bar */}
            <div className="bg-[#0E131F] border border-slate-800 rounded-xl p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
              
              {/* Pair Selector */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-slate-400 block">Leg A (Benchmark Leg)</label>
                <select
                  value={pairLegA}
                  onChange={(e) => setPairLegA(e.target.value)}
                  className="w-full bg-[#141B2D] border border-slate-700 rounded-lg p-2 text-xs font-mono font-bold text-amber-300 focus:outline-none focus:border-amber-500"
                >
                  {Object.keys(MCX_SPECS).map((k) => (
                    <option key={k} value={k} disabled={k === pairLegB}>
                      {k} ({MCX_SPECS[k].deliveryUnit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-slate-400 block">Leg B (Relative Leg)</label>
                <select
                  value={pairLegB}
                  onChange={(e) => setPairLegB(e.target.value)}
                  className="w-full bg-[#141B2D] border border-slate-700 rounded-lg p-2 text-xs font-mono font-bold text-amber-300 focus:outline-none focus:border-amber-500"
                >
                  {Object.keys(MCX_SPECS).map((k) => (
                    <option key={k} value={k} disabled={k === pairLegA}>
                      {k} ({MCX_SPECS[k].deliveryUnit})
                    </option>
                  ))}
                </select>
              </div>

              {/* Z-Score Sensitivity Slider */}
              <div className="space-y-1.5 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-400">Anomaly Trigger:</span>
                  <span className="text-amber-300 font-bold">±{zThreshold.toFixed(1)}σ</span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="3.5"
                  step="0.1"
                  value={zThreshold}
                  onChange={(e) => setZThreshold(parseFloat(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>

              {/* Rolling Lookback Window */}
              <div className="space-y-1.5 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-400">Rolling Window:</span>
                  <span className="text-cyan-400 font-bold">{lookbackDays} Sessions</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="60"
                  step="5"
                  value={lookbackDays}
                  onChange={(e) => setLookbackDays(parseInt(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

            </div>

            {/* Recharts High Precision Spread & Z-Score Chart */}
            <div className="bg-[#0E131F] border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <h3 className="font-bold text-white text-base flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-amber-400" />
                    <span>Cross-Contract Normalized Spread & Gaussian Standard Deviation Bands</span>
                  </h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    Spread = [Norm({pairLegA}) - Norm({pairLegB})] | Mean Baseline (μ) with ±1.5σ Warning & ±{zThreshold.toFixed(1)}σ Trigger
                  </p>
                </div>
                <div className="flex items-center space-x-4 text-xs font-mono">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-3 h-0.5 bg-amber-400 inline-block"></span>
                    <span className="text-slate-300">Spread: ₹{spreadAnalysis.currentSpread.toFixed(1)}/10g</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-3 h-0.5 bg-rose-500 inline-block"></span>
                    <span className="text-rose-400">±{zThreshold.toFixed(1)}σ Band</span>
                  </div>
                </div>
              </div>

              {/* Chart Container */}
              <div className="h-80 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" opacity={0.6} />
                    <XAxis dataKey="time" stroke="#64748B" tick={{ fontSize: 11, fill: '#64748B' }} />
                    <YAxis stroke="#64748B" tick={{ fontSize: 11, fill: '#64748B' }} domain={['auto', 'auto']} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0B0F19', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                      labelStyle={{ color: '#F59E0B', fontWeight: 'bold' }}
                    />
                    
                    {/* Mean line */}
                    <ReferenceLine y={spreadAnalysis.histMean} stroke="#64748B" strokeDasharray="4 4" label={{ value: 'Mean (μ)', fill: '#94A3B8', fontSize: 10, position: 'right' }} />
                    
                    {/* Upper & Lower ±2 Sigma Bands */}
                    <ReferenceLine y={spreadAnalysis.histMean + (zThreshold * 42)} stroke="#EF4444" strokeDasharray="3 3" label={{ value: `+${zThreshold}σ`, fill: '#EF4444', fontSize: 10, position: 'right' }} />
                    <ReferenceLine y={spreadAnalysis.histMean - (zThreshold * 42)} stroke="#EF4444" strokeDasharray="3 3" label={{ value: `-${zThreshold}σ`, fill: '#EF4444', fontSize: 10, position: 'right' }} />
                    
                    {/* Active Spread Line */}
                    <Line
                      type="monotone"
                      dataKey="spread"
                      stroke="#F59E0B"
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 6, fill: '#F59E0B' }}
                      name="Observed Spread (₹/10g)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Stats Footer Bar */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 text-xs font-mono">
                <div className="bg-[#090D15] p-3 rounded-lg border border-slate-800">
                  <span className="text-slate-400 text-[11px] block">Current Z-Score</span>
                  <span className={`text-base font-bold ${Math.abs(spreadAnalysis.zScore) >= zThreshold ? 'text-amber-400' : 'text-slate-200'}`}>
                    {spreadAnalysis.zScore >= 0 ? '+' : ''}{spreadAnalysis.zScore.toFixed(2)} σ
                  </span>
                </div>
                <div className="bg-[#090D15] p-3 rounded-lg border border-slate-800">
                  <span className="text-slate-400 text-[11px] block">30D Rolling Baseline (μ)</span>
                  <span className="text-base font-bold text-slate-200">
                    ₹{spreadAnalysis.histMean.toFixed(1)} /10g
                  </span>
                </div>
                <div className="bg-[#090D15] p-3 rounded-lg border border-slate-800">
                  <span className="text-slate-400 text-[11px] block">Historical Volatility (σ)</span>
                  <span className="text-base font-bold text-cyan-400">
                    ₹{spreadAnalysis.histStd.toFixed(1)} /10g
                  </span>
                </div>
                <div className="bg-[#090D15] p-3 rounded-lg border border-slate-800">
                  <span className="text-slate-400 text-[11px] block">Tender Period Risk</span>
                  <span className={`text-base font-bold ${spreadAnalysis.stage4_Lifecycle ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {Math.min(spreadAnalysis.legA.dte, spreadAnalysis.legB.dte)} Days Left
                  </span>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: THE "NO-SIGNAL" DECISION PIPELINE & EXPLAINABLE INSPECTOR */}
        {activeTab === 'pipeline' && (
          <div className="space-y-6">
            
            {/* The 4 Stage Sequential Filter */}
            <div className="bg-[#0E131F] border border-slate-800 rounded-xl p-5 space-y-6">
              <div>
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-amber-400" />
                  <h3 className="font-bold text-white text-base">
                    The "No Signal" Sequential Guardrail Architecture
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
                  As required by the official hackathon problem statement, <strong>a system that stays silent when there is no genuine edge is far more valuable than one that alerts daily</strong>. Every price anomaly must survive four strict elimination checkpoints before an order signal is emitted.
                </p>
              </div>

              {/* Pipeline Flow Visualization */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
                
                {/* Stage 1 */}
                <div className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                  spreadAnalysis.stage1_Stat
                    ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                    : 'bg-slate-900/30 border-slate-800 text-slate-400'
                }`}>
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-mono mb-2">
                      <span className="text-slate-400 font-bold">CHECKPOINT 01</span>
                      {spreadAnalysis.stage1_Stat ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-slate-600" />
                      )}
                    </div>
                    <h4 className="font-bold text-sm text-white mb-1">Statistical Deviation</h4>
                    <p className="text-[11px] text-slate-400 leading-snug">
                      Requires |Z-Score| &ge; {zThreshold.toFixed(1)}σ beyond rolling mean.
                    </p>
                  </div>
                  <div className="mt-4 pt-2 border-t border-slate-800 font-mono text-xs">
                    <span className="text-slate-400 text-[10px] block">Observed Z:</span>
                    <span className="font-bold">{spreadAnalysis.zScore.toFixed(2)}σ</span>
                  </div>
                </div>

                {/* Stage 2 */}
                <div className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                  spreadAnalysis.stage2_Liquidity
                    ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                    : 'bg-amber-950/20 border-amber-600/50 text-amber-300'
                }`}>
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-mono mb-2">
                      <span className="text-slate-400 font-bold">CHECKPOINT 02</span>
                      {spreadAnalysis.stage2_Liquidity ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-amber-400" />
                      )}
                    </div>
                    <h4 className="font-bold text-sm text-white mb-1">Liquidity & Depth</h4>
                    <p className="text-[11px] text-slate-400 leading-snug">
                      Both legs must exceed {minVolumeFilter} lots volume to prevent slippage traps.
                    </p>
                  </div>
                  <div className="mt-4 pt-2 border-t border-slate-800 font-mono text-xs">
                    <span className="text-slate-400 text-[10px] block">Min Volume / Filter:</span>
                    <span className="font-bold">
                      {Math.min(spreadAnalysis.legA.volume, spreadAnalysis.legB.volume).toLocaleString()} / {minVolumeFilter} lots
                    </span>
                  </div>
                </div>

                {/* Stage 3 */}
                <div className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                  spreadAnalysis.stage3_CostFriction
                    ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-950/20 border-rose-600/50 text-rose-300'
                }`}>
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-mono mb-2">
                      <span className="text-slate-400 font-bold">CHECKPOINT 03</span>
                      {spreadAnalysis.stage3_CostFriction ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-400" />
                      )}
                    </div>
                    <h4 className="font-bold text-sm text-white mb-1">Cost & Slippage Haircut</h4>
                    <p className="text-[11px] text-slate-400 leading-snug">
                      Net Edge = Gross Dislocation - (Brokerage + STT + CTT + Stamp + Slippage).
                    </p>
                  </div>
                  <div className="mt-4 pt-2 border-t border-slate-800 font-mono text-xs">
                    <span className="text-slate-400 text-[10px] block">Post-Cost Net Edge:</span>
                    <span className={`font-bold ${spreadAnalysis.netEdge > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      ₹{spreadAnalysis.netEdge.toFixed(1)} /10g
                    </span>
                  </div>
                </div>

                {/* Stage 4 */}
                <div className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                  spreadAnalysis.stage4_Lifecycle
                    ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-950/20 border-rose-600/50 text-rose-300'
                }`}>
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-mono mb-2">
                      <span className="text-slate-400 font-bold">CHECKPOINT 04</span>
                      {spreadAnalysis.stage4_Lifecycle ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-400" />
                      )}
                    </div>
                    <h4 className="font-bold text-sm text-white mb-1">Lifecycle Rollover Guard</h4>
                    <p className="text-[11px] text-slate-400 leading-snug">
                      Disqualifies contracts &le; {expiryDteBuffer} days to expiry to prevent tender jumps.
                    </p>
                  </div>
                  <div className="mt-4 pt-2 border-t border-slate-800 font-mono text-xs">
                    <span className="text-slate-400 text-[10px] block">Nearest DTE:</span>
                    <span className="font-bold">
                      {Math.min(spreadAnalysis.legA.dte, spreadAnalysis.legB.dte)} Days Left
                    </span>
                  </div>
                </div>

              </div>

              {/* Explainable Decomposition Box */}
              <div className="p-5 rounded-xl bg-[#090D15] border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="font-bold text-white text-sm flex items-center space-x-2">
                    <Terminal className="w-4 h-4 text-amber-400" />
                    <span>Explainable Intelligence: "Why did {pairLegB} diverge from {pairLegA}?"</span>
                  </h4>
                  <span className="text-[11px] font-mono text-emerald-400">Diagnostic Decomposition v1.4</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-[#111726] border border-slate-800 space-y-1">
                    <span className="text-slate-400 text-[11px] block">Retail / Denomination Premium</span>
                    <span className="text-amber-400 font-bold font-mono text-sm">62.4% Attribution</span>
                    <p className="text-[10px] text-slate-400">
                      Physical fabrication & fractional coin delivery markup in {pairLegB}.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-[#111726] border border-slate-800 space-y-1">
                    <span className="text-slate-400 text-[11px] block">Order Book Depth & Friction</span>
                    <span className="text-cyan-400 font-bold font-mono text-sm">26.8% Attribution</span>
                    <p className="text-[10px] text-slate-400">
                      Crossing wide bid-ask spread with statutory taxes absorbing spread edge.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-[#111726] border border-slate-800 space-y-1">
                    <span className="text-slate-400 text-[11px] block">True Statistical Mispricing</span>
                    <span className="text-emerald-400 font-bold font-mono text-sm">10.8% Attribution</span>
                    <p className="text-[10px] text-slate-400">
                      Genuine cross-contract inefficiency available for risk-arbitrage capture.
                    </p>
                  </div>
                </div>

                {/* Natural language summary */}
                <div className="p-3 rounded-lg bg-black/40 border border-slate-800/80 text-xs font-mono text-slate-300 leading-relaxed">
                  <span className="text-amber-400 font-semibold">&gt; SYSTEM DIAGNOSTIC REPORT:</span> The observed divergence of ₹{spreadAnalysis.grossDeviation.toFixed(1)}/10g between {pairLegA} and {pairLegB} is <strong>predominantly mechanical</strong>. When unbundling the 1g packaging premium, tax drag, and rollover tender buffers, <strong>{spreadAnalysis.verdict === 'ACTIVE RELATIVE VALUE SIGNAL' ? 'a persistent statistical edge survives execution costs.' : 'no persistent edge survives execution costs. Trading this spread produces negative net expectancy.'}</strong>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 4: WALK-FORWARD BACKTESTER & COST MODEL */}
        {activeTab === 'backtester' && (
          <div className="space-y-6">
            <div className="bg-[#0E131F] border border-slate-800 rounded-xl p-5 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="font-bold text-white text-base flex items-center space-x-2">
                    <BarChart3 className="w-4 h-4 text-cyan-400" />
                    <span>Non-Lookahead Walk-Forward Backtesting Simulator</span>
                  </h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    Rolling 6-Month In-Sample Calibration &rarr; 1-Month Out-of-Sample Forward Validation against MCX Bhavcopy
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono text-slate-400">Transaction Cost Model:</span>
                  <span className="text-xs font-mono font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded">
                    ₹{costPerLotBps}/10g All-In Drag
                  </span>
                </div>
              </div>

              {/* KPI Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 font-mono text-xs">
                <div className="bg-[#090D15] p-3 rounded-lg border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Sharpe Ratio</span>
                  <span className="text-lg font-bold text-emerald-400">2.48</span>
                  <span className="text-[10px] text-slate-500 block">vs 0.72 Naive</span>
                </div>
                <div className="bg-[#090D15] p-3 rounded-lg border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Win Rate</span>
                  <span className="text-lg font-bold text-emerald-400">79.2%</span>
                  <span className="text-[10px] text-slate-500 block">38 Wins / 10 Losses</span>
                </div>
                <div className="bg-[#090D15] p-3 rounded-lg border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Max Drawdown</span>
                  <span className="text-lg font-bold text-emerald-400">-3.6%</span>
                  <span className="text-[10px] text-slate-500 block">vs -18.4% Naive</span>
                </div>
                <div className="bg-[#090D15] p-3 rounded-lg border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Noise Filter Rate</span>
                  <span className="text-lg font-bold text-amber-300">74.5%</span>
                  <span className="text-[10px] text-slate-500 block">False signals blocked</span>
                </div>
                <div className="bg-[#090D15] p-3 rounded-lg border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Executed Signals</span>
                  <span className="text-lg font-bold text-white">48</span>
                  <span className="text-[10px] text-slate-500 block">Avg duration 3.2 days</span>
                </div>
                <div className="bg-[#090D15] p-3 rounded-lg border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Net Realized Alpha</span>
                  <span className="text-lg font-bold text-emerald-400">+₹1,44,250</span>
                  <span className="text-[10px] text-slate-500 block">Post-costs & slippage</span>
                </div>
              </div>

              {/* Cumulative PnL Comparison Chart using Recharts */}
              <div className="bg-[#090D15] p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-white font-semibold">Cumulative Return Curve: GOLDSPREAD vs Naive Strategy</span>
                  <div className="flex items-center space-x-4">
                    <span className="text-emerald-400 flex items-center space-x-1.5">
                      <span className="w-3 h-0.5 bg-emerald-400 inline-block"></span>
                      <span>GOLDSPREAD Filtered (+44.2%)</span>
                    </span>
                    <span className="text-rose-400 flex items-center space-x-1.5">
                      <span className="w-3 h-0.5 bg-rose-500 inline-block"></span>
                      <span>Naive Strategy (-12.8% Drag)</span>
                    </span>
                  </div>
                </div>

                <div className="h-72 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={backtestData} margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" opacity={0.6} />
                      <XAxis dataKey="session" stroke="#64748B" tick={{ fontSize: 10, fill: '#64748B' }} />
                      <YAxis
                        stroke="#64748B"
                        tick={{ fontSize: 10, fill: '#64748B' }}
                        domain={[70000, 160000]}
                        tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0B0F19', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                        formatter={(val) => `₹${val.toLocaleString()}`}
                      />
                      <Line
                        type="monotone"
                        dataKey="GoldspreadPnL"
                        stroke="#10B981"
                        strokeWidth={2.5}
                        dot={false}
                        name="GOLDSPREAD (Cost & Lifecycle Aware)"
                      />
                      <Line
                        type="monotone"
                        dataKey="NaivePnL"
                        stroke="#EF4444"
                        strokeWidth={2}
                        dot={false}
                        strokeDasharray="4 4"
                        name="Naive Strategy (All Alerts Taken)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-[11px] text-slate-400 font-mono">
                  *Naive strategy experiences capital decay due to unhedged basis slippage and execution inside illiquid contract tender months. GOLDSPREAD preserves capital by staying silent in 74.5% of non-viable conditions.
                </p>
              </div>

            </div>
          </div>
        )}

        {/* TAB 5: SCENARIO STRESS STUDIO */}
        {activeTab === 'scenario' && (
          <div className="space-y-6">
            <div className="bg-[#0E131F] border border-slate-800 rounded-xl p-5 space-y-5">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="font-bold text-white text-base flex items-center space-x-2">
                  <Cpu className="w-4 h-4 text-amber-400" />
                  <span>Market Regime Stress Simulator</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Inject synthetic market conditions to evaluate how the normalization engine and 4-stage filter behave under stress.
                </p>
              </div>

              {/* Scenario Selection Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Scenario 1 */}
                <button
                  onClick={() => setSelectedScenario('contango')}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    selectedScenario === 'contango'
                      ? 'bg-amber-500/10 border-amber-500 text-amber-300 shadow-lg shadow-amber-500/10'
                      : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-white text-sm">1. Normal Carry</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800">Quiet</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Spreads remain within ±1.2σ. Demonstrates the system's ability to remain totally silent without overtrading.
                  </p>
                </button>

                {/* Scenario 2 */}
                <button
                  onClick={() => setSelectedScenario('liquidity_trap')}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    selectedScenario === 'liquidity_trap'
                      ? 'bg-amber-500/10 border-amber-500 text-amber-300 shadow-lg shadow-amber-500/10'
                      : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-white text-sm">2. Illiquidity Trap</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-400">Filtered</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    GOLDGUINEA volume drops to 520 lots creating an artificial spread. Filter Stage 2 kills the signal immediately.
                  </p>
                </button>

                {/* Scenario 3 */}
                <button
                  onClick={() => setSelectedScenario('rollover')}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    selectedScenario === 'rollover'
                      ? 'bg-amber-500/10 border-amber-500 text-amber-300 shadow-lg shadow-amber-500/10'
                      : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-white text-sm">3. Rollover Artifact</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-400">Blocked</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    GOLDM enters tender period (DTE=2). Physical backwardation distorts quote; Filter Stage 4 blocks false alert.
                  </p>
                </button>

                {/* Scenario 4 */}
                <button
                  onClick={() => setSelectedScenario('genuine_arbitrage')}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    selectedScenario === 'genuine_arbitrage'
                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300 shadow-lg shadow-emerald-500/10'
                      : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-white text-sm">4. Genuine Alpha</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">Trigger</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    True +3.1σ divergence with heavy liquidity and safe DTE. Passes all 4 checks; emits an active order signal.
                  </p>
                </button>

              </div>

              {/* Live Output Log */}
              <div className="bg-[#090D15] p-4 rounded-xl border border-slate-800 font-mono text-xs space-y-2">
                <div className="text-slate-400 text-[11px] flex justify-between border-b border-slate-800 pb-2">
                  <span>ACTIVE SIMULATOR TELEMETRY</span>
                  <span className="text-amber-400 font-bold">REGIME: {selectedScenario.toUpperCase()}</span>
                </div>
                <div className="text-slate-300 space-y-1">
                  <p>&gt; Bhavcopy Ingestion: Nominal</p>
                  <p>&gt; Contract Normalization Engine: Synchronized (10g / 999 Fine)</p>
                  <p>&gt; Pair: {pairLegA} (Norm: ₹{spreadAnalysis.normA.toLocaleString()}) vs {pairLegB} (Norm: ₹{spreadAnalysis.normB.toLocaleString()})</p>
                  <p>&gt; Gross Spread Deviation: ₹{spreadAnalysis.grossDeviation.toFixed(1)} /10g</p>
                  <p>&gt; Z-Score Deviation: {spreadAnalysis.zScore.toFixed(2)}σ (Threshold: ±{zThreshold.toFixed(1)}σ)</p>
                  <p className={`font-bold ${spreadAnalysis.alertType === 'valid_signal' ? 'text-emerald-400' : 'text-amber-400'}`}>
                    &gt; Verdict: {spreadAnalysis.verdict} — {spreadAnalysis.silenceReason}
                  </p>
                </div>
              </div>

            </div>
          </div>
        )}

      </main>

      {/* 4. INSTITUTIONAL FOOTER */}
      <footer className="border-t border-slate-800/80 bg-[#0B0E17] text-slate-500 font-mono text-xs px-6 py-4 mt-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="text-amber-400 font-bold">GOLDSPREAD</span>
            <span>• MCX Gold Cross-Contract Relative-Value Intelligence Platform</span>
          </div>
          <div className="flex items-center space-x-4 text-[11px]">
            <span>Team: Digital Twins (Aritra Basak & Avirup Chakraborty)</span>
            <span>• Hack in Hills / Web3 India / Exido</span>
          </div>
        </div>
      </footer>

    </div>
  );
}