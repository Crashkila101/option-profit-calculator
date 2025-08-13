import numpy as np
from scipy.stats import norm
from datetime import datetime
import yfinance as yf
from jax import config

config.update("jax_debug_nans", True)

def black_scholes(S, K, T, b, sigma, option_type):
    """Black-Scholes evaluation"""
    d1 = (np.log(S / K) + (b + 0.5 * sigma**2) * T) / (sigma * np.sqrt(T))
    d2 = d1 - sigma * np.sqrt(T)
    if option_type == "call":
        """Black-Scholes call option price"""
        return S * norm.cdf(d1) - K * np.exp(-b * T) * norm.cdf(d2)
    else: 
        """Black-Scholes put option price"""
        return -S * norm.cdf(-d1) + K * np.exp(-b * T) * norm.cdf(-d2)

# def loss_function(S, K, T, r, sigma, premium, option_type):
#     """Minimise premium discrepancy (L1 Loss)"""
#     # Get premium estimate with our current guess for sigma
#     theoretical_premium = black_scholes(S, K, T, r, sigma, option_type)

#     # Minimise difference between theoretical and actual market premium
#     return (theoretical_premium - premium)

# # Partial derivative(gradient) of loss function w.r.t sigma
# sigma_grad = grad(loss_function, argnums=4)

# def get_implied_vol(S, K, T, r, sigma, premium, option_type):
#     """Compute implied volatility"""
#     epsilon = .001 # Maximum difference between theoretical and actual
#     max_iter = 20 # Stop at 20 iterations 
#     converged = False
#     for i in range(max_iter):
#         # Compute gradient of loss function w.r.t sigma
#         loss_gradient = sigma_grad(S, K, T, r, sigma, premium, option_type)
#         loss = loss_function(S, K, T, r, sigma, premium, option_type)
        
#         print(f"Iter {i}: sigma = {sigma:.6f}, loss = {loss:.6f}, grad = {loss_gradient:.6f}")
        
#         # If discrepancy is less than tolerance, stop
#         if abs(loss) < epsilon:
#             converged = True
#             break
#         else:   
#             # Update sigma according to Newton's method
#             sigma = sigma - loss / loss_gradient
#     if not converged:
#         print("Did not converge")
#     return sigma
# vol = get_implied_vol(200, 210, 10/365.25, .05, 1.2, 13.35, "call")
# print(vol)

def calculate_heatmap_data(ticker, strike, premium, option_type, expiry):
    """Heatmap generation"""
    strike = float(strike)  # K (Strike Price)
    stock = yf.Ticker(ticker) 
    current_price = stock.history(period="1d")["Close"].iloc[-1] # S (Spot Price)
    expiry_date = datetime.strptime(expiry, "%Y-%m-%d") 
    today = datetime.today()
    r = 0.01  # 1% interest rate (Risk-free rate)
    
    # Sigma estimate (annualised volatility)
    df = stock.history(period="1y")
    prices = np.array(df["Close"].values)
    log_returns = np.log(prices[1:] / prices[:-1])
    sigma = np.std(log_returns) * np.sqrt(252.0)

    # Stock price range: ±10% of current
    prices = np.linspace(current_price * 1.1, current_price * 0.9, 25)
    
    # Days from now until expiry
    days = (expiry_date - today).days
    if days <= 0:
        return {"error": "Expiry date is in the past"}

    times = np.linspace(days, 1, days) # T (time until expiry)
    # Fill heatmap with cells x,y(time till expiry, stock price) with option profit Z
    Z = []
    for S in prices:
        row = []
        for t in times:
            T = t / 365.25
            # sigma = get_implied_vol(S, strike, T, r, sigma, premium, option_type)
            option_price = black_scholes(S, strike, T, r, sigma, option_type)
            # intrinsic_value = max(S - strike, 0) if option_type == "call" else max(strike - S, 0)
            # extrinsic_value = option_price - intrinsic value
            # profit = intrinsic_value - premium + extrinsic value
            profit = (option_price - premium) * 100
            # print("Value at expiry: " + str(profit) + " for price of underlying " + str(S))
            row.append(profit)
        Z.append(row)

    return {
        "z": Z,
        "y": list(map(float, prices)),
        "x": list(map(int, times)),
    }     