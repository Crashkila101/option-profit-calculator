from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from typing import Literal
from model_options import calculate_heatmap_data

app = FastAPI()

# Enable CORS for local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/heatmap")
def generate_heatmap(
    ticker: str,
    strike: float,
    premium: float,
    type: Literal["call", "put"],
    expiry: str,
    model: str
):
    return {"heatmap": calculate_heatmap_data(ticker, strike, premium, type, expiry, model)}

@app.get("/options")
def get_options(ticker: str):
    import yfinance as yf
    stock = yf.Ticker(ticker)
    expirations = stock.options
    if not expirations:
        return {"error": "No options found"}

    contracts = []
    for date in expirations[:3]:
        opt_chain = stock.option_chain(date)
        for call in opt_chain.calls.itertuples():
            contracts.append({
                "type": "call",
                "strike": call.strike,
                "premium": call.lastPrice,
                "expiry": date
            })
        for put in opt_chain.puts.itertuples():
            contracts.append({
                "type": "put",
                "strike": put.strike,
                "premium": put.lastPrice,
                "expiry": date
            })

    return {"contracts": contracts}