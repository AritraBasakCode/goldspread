from pydantic import BaseModel
from typing import Dict

class ContractSpec(BaseModel):
    symbol: str
    name: str
    unit_size_grams: float
    quote_basis_grams: float
    purity_fineness: float  # e.g. 995.0 or 999.0
    tick_size: float
    typical_bid_ask_spread_inr: float
    min_volume_threshold: int

# Official MCX Gold Contract Specs
MCX_SPECS: Dict[str, ContractSpec] = {
    "GOLDM": ContractSpec(
        symbol="GOLDM",
        name="Gold Mini",
        unit_size_grams=100.0,
        quote_basis_grams=10.0,
        purity_fineness=995.0,
        tick_size=1.0,
        typical_bid_ask_spread_inr=3.0,
        min_volume_threshold=1500
    ),
    "GOLDTEN": ContractSpec(
        symbol="GOLDTEN",
        name="Gold Ten",
        unit_size_grams=10.0,
        quote_basis_grams=10.0,
        purity_fineness=995.0,
        tick_size=1.0,
        typical_bid_ask_spread_inr=6.0,
        min_volume_threshold=600
    ),
    "GOLDGUINEA": ContractSpec(
        symbol="GOLDGUINEA",
        name="Gold Guinea",
        unit_size_grams=8.0,
        quote_basis_grams=8.0,
        purity_fineness=999.0,
        tick_size=1.0,
        typical_bid_ask_spread_inr=14.0,
        min_volume_threshold=250
    ),
    "GOLDPETAL": ContractSpec(
        symbol="GOLDPETAL",
        name="Gold Petal",
        unit_size_grams=1.0,
        quote_basis_grams=1.0,
        purity_fineness=999.0,
        tick_size=1.0,
        typical_bid_ask_spread_inr=22.0,
        min_volume_threshold=80
    )
}

BENCHMARK_PURITY = 999.0
BENCHMARK_BASIS_GRAMS = 10.0

def normalize_price(raw_price: float, symbol: str) -> float:
    """
    Normalizes any MCX raw quoted price to an equivalent 
    Benchmark ₹ per 10g at 999 Purity.
    """
    spec = MCX_SPECS[symbol]
    price_per_gram_native = raw_price / spec.quote_basis_grams
    price_per_gram_999 = price_per_gram_native * (BENCHMARK_PURITY / spec.purity_fineness)
    return round(price_per_gram_999 * BENCHMARK_BASIS_GRAMS, 2)