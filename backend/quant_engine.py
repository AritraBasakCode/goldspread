import numpy as np
import pandas as pd
from typing import Dict, Any, List
from contracts import MCX_SPECS, normalize_price

def calculate_spread_and_zscore(
    series_a: List[float], 
    series_b: List[float], 
    window: int = 14
) -> Dict[str, Any]:
    s_a = np.array(series_a)
    s_b = np.array(series_b)
    spread = s_a - s_b
    
    if len(spread) < window:
        mean_val = np.mean(spread)
        std_val = np.std(spread) or 1.0
    else:
        rolling_series = pd.Series(spread)
        mean_val = rolling_series.rolling(window).mean().iloc[-1]
        std_val = rolling_series.rolling(window).std().iloc[-1] or 1.0
        
    current_spread = spread[-1]
    z_score = (current_spread - mean_val) / std_val
    return {
        "current_spread": round(float(current_spread), 2),
        "mean": round(float(mean_val), 2),
        "std": round(float(std_val), 2),
        "z_score": round(float(z_score), 2)
    }

def evaluate_no_signal_pipeline(
    sym_a: str,
    sym_b: str,
    raw_p_a: float,
    raw_p_b: float,
    vol_a: int,
    vol_b: int,
    days_to_expiry_a: int,
    days_to_expiry_b: int,
    z_score: float,
    z_threshold: float = 2.0
) -> Dict[str, Any]:
    """
    The 4-stage kill-switch filter verifying whether an apparent dislocation survives market mechanics.
    """
    norm_a = normalize_price(raw_p_a, sym_a)
    norm_b = normalize_price(raw_p_b, sym_b)
    spread = norm_a - norm_b

    # Stage 1: Statistical Check
    stat_pass = abs(z_score) >= z_threshold
    if not stat_pass:
        return {
            "status": "SILENT (NO_SIGNAL)",
            "suppressed_stage": "Stage 1: Statistical Threshold",
            "reason": f"|Z-score| ({abs(z_score):.2f}) is within normal noise (threshold: {z_threshold}).",
            "actionable": False
        }

    # Stage 2: Liquidity Check
    spec_a, spec_b = MCX_SPECS[sym_a], MCX_SPECS[sym_b]
    liq_pass = (vol_a >= spec_a.min_volume_threshold) and (vol_b >= spec_b.min_volume_threshold)
    if not liq_pass:
        failing = sym_a if vol_a < spec_a.min_volume_threshold else sym_b
        return {
            "status": "SUPPRESSED (LIQUIDITY_DEFICIT)",
            "suppressed_stage": "Stage 2: Execution Depth",
            "reason": f"Contract {failing} volume is below the liquid depth threshold. Slippage will consume edge.",
            "actionable": False
        }

    # Stage 3: Friction & Cost Hurdle Check (Round-trip brokerage + CTT + stamp duty + slippage)
    round_trip_cost = (spec_a.typical_bid_ask_spread_inr + spec_b.typical_bid_ask_spread_inr) + 12.0
    net_edge = abs(spread) - round_trip_cost
    if net_edge <= 0:
        return {
            "status": "SUPPRESSED (FRICTION_ABSORBED)",
            "suppressed_stage": "Stage 3: Cost-Aware Hurdle",
            "reason": f"Gross spread ₹{abs(spread):.2f} is swallowed by round-trip transaction costs (₹{round_trip_cost:.2f}).",
            "actionable": False
        }

    # Stage 4: Lifecycle & Tender Period Check
    min_dte = min(days_to_expiry_a, days_to_expiry_b)
    if min_dte <= 5:
        return {
            "status": "SUPPRESSED (TENDER_LIFECYCLE)",
            "suppressed_stage": "Stage 4: Expiry Tender Window",
            "reason": f"Contract is within {min_dte} days of expiry. Spread divergence is due to physical delivery rollover.",
            "actionable": False
        }

    # All checks passed
    action = "BUY " + sym_a + " / SELL " + sym_b if z_score < -z_threshold else "SELL " + sym_a + " / BUY " + sym_b
    return {
        "status": "GENUINE_ALPHA_SIGNAL",
        "suppressed_stage": "None (Passed 4/4 Filters)",
        "reason": f"Statistically significant dislocation (|Z|={abs(z_score):.2f}) survives execution friction.",
        "action": action,
        "net_expected_edge": round(float(net_edge), 2),
        "actionable": True
    }