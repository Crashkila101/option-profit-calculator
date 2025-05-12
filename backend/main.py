from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import yfinance as yf
from typing import Literal
from black_scholes import calculate_heatmap_data  # You'll implement this

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
    price: float,
    type: Literal["call", "put"],
    expiry: str  # expected format: YYYY-MM-DD
):
    return {"heatmap": calculate_heatmap_data(ticker, strike, price, type, expiry)}

@app.get("/options")
def get_options(ticker: str):
    import yfinance as yf
    stock = yf.Ticker(ticker)
    expirations = stock.options
    if not expirations:
        return {"error": "No options found"}

    contracts = []
    for date in expirations[:3]:  # limit to nearest expiration for demo
        opt_chain = stock.option_chain(date)
        for call in opt_chain.calls.itertuples():
            contracts.append({
                "type": "call",
                "strike": call.strike,
                "price": call.lastPrice,
                "expiry": date
            })
        for put in opt_chain.puts.itertuples():
            contracts.append({
                "type": "put",
                "strike": put.strike,
                "price": put.lastPrice,
                "expiry": date
            })

    return {"contracts": contracts}