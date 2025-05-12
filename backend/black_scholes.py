import numpy as np
from scipy.stats import norm
from datetime import datetime
import yfinance as yf

def black_scholes_call(S, K, t, r, sigma):
    """Black-Scholes call option price."""
    d1 = (np.log(S / K) + (r + 0.5 * sigma**2) * t) / (sigma * np.sqrt(t))
    d2 = d1 - sigma * np.sqrt(t)
    return S * norm.cdf(d1) - K * np.exp(-r * t) * norm.cdf(d2)

def black_scholes_put(S, K, t, r, sigma):
    """Black-Scholes put option price."""
    d1 = (np.log(S / K) + (r + 0.5 * sigma**2) * t) / (sigma * np.sqrt(t))
    d2 = d1 - sigma * np.sqrt(t)
    return -S * norm.cdf(-d1) + K * np.exp(-r * t) * norm.cdf(-d2)


def calculate_heatmap_data(ticker, strike, premium, option_type, expiry):
    strike = float(strike)
    stock = yf.Ticker(ticker)
    current_price = stock.history(period="1d")["Close"].iloc[-1]
    expiry_date = datetime.strptime(expiry, "%Y-%m-%d")
    today = datetime.today()
    r = 0.04  # 4% interest rate
    sigma = stock.history(period="1y")["Close"].pct_change().std() * np.sqrt(252)  # annualized volatility

    # Stock price range: ±40% of current
    prices = np.linspace(current_price * 0.6, current_price * 1.4, 50)
    # Days from now until expiry
    days = (expiry_date - today).days
    if days <= 0:
        return {"error": "Expiry date is in the past"}

    times = np.linspace(1, days, days)

    Z = []
    for t in times:
        row = []
        for S in prices:
            T = t / 365.25
            print(T)
            if option_type == "call":
                option_price = black_scholes_call(S, strike, T, r, sigma)
            else:
                option_price = black_scholes_put(S, strike, T, r, sigma)
            intrinsic_value = max(S - strike, 0) if option_type == "call" else max(strike - S, 0)
            profit = intrinsic_value - option_price * 100
            row.append(profit)
        Z.append(row)

    return {
        "z": Z,
        "x": list(map(float, prices)),
        "y": list(map(int, times)),
    }