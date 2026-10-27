from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from contracts import MCX_SPECS, normalize_price
from quant_engine import calculate_spread_and_zscore, evaluate_no_signal_pipeline

app = FastAPI(title="GOLDSPREAD Engine", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class EvaluateRequest(BaseModel):
    sym_a: str
    sym_b: str
    price_a: float
    price_b: float
    vol_a: int
    vol_b: int
    dte_a: int
    dte_b: int
    hist_a: List[float]
    hist_b: List[float]
    z_threshold: float = 2.0

@app.get("/contracts")
def get_contracts():
    return MCX_SPECS

@app.post("/analyze")
def run_analysis(req: EvaluateRequest):
    norm_a = normalize_price(req.price_a, req.sym_a)
    norm_b = normalize_price(req.price_b, req.sym_b)
    
    # Calculate historical normalized spreads for rolling Z-score
    norm_hist_a = [normalize_price(p, req.sym_a) for p in req.hist_a]
    norm_hist_b = [normalize_price(p, req.sym_b) for p in req.hist_b]
    
    stat_metrics = calculate_spread_and_zscore(norm_hist_a, norm_hist_b)
    
    decision = evaluate_no_signal_pipeline(
        sym_a=req.sym_a,
        sym_b=req.sym_b,
        raw_p_a=req.price_a,
        raw_p_b=req.price_b,
        vol_a=req.vol_a,
        vol_b=req.vol_b,
        days_to_expiry_a=req.dte_a,
        days_to_expiry_b=req.dte_b,
        z_score=stat_metrics["z_score"],
        z_threshold=req.z_threshold
    )
    
    return {
        "normalized_price_a": norm_a,
        "normalized_price_b": norm_b,
        "spread_stats": stat_metrics,
        "pipeline_verdict": decision
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)