import numpy as np
from scipy.stats import norm
from datetime import datetime
import yfinance as yf
# from jax import grad

# # Functions to solve for implied volatility using automatic differentiations
# def loss_function(S, K, T, b, r, sigma, premium, option_type):
#     """Minimise premium discrepancy (L1 Loss)"""
#     # Get premium estimate with our current guess for sigma
#     theoretical_premium = black_scholes(S, K, T, b, r, sigma, option_type)

#     # Minimise difference between theoretical and actual market premium
#     return (theoretical_premium - premium)

# # Partial derivative(gradient) of loss function w.r.t sigma
# sigma_grad = grad(loss_function, argnums=4)

# def get_implied_vol(S, K, T, b, r, sigma, premium, option_type):
#     """Compute implied volatility"""
#     epsilon = .001 # Maximum difference between theoretical and actual
#     max_iter = 20 # Stop at 20 iterations 
#     converged = False
#     for i in range(max_iter):
#         # Compute gradient of loss function w.r.t sigma
#         loss_gradient = sigma_grad(S, K, T, b, r, sigma, premium, option_type)
#         loss = loss_function(S, K, T, b, r, sigma, premium, option_type)
        
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

def black_scholes(S, K, T, b, r, sigma, option_type):
    """Black-Scholes evaluation"""
    d1 = (np.log(S / K) + (b + 0.5 * sigma**2) * T) / (sigma * np.sqrt(T))
    d2 = d1 - sigma * np.sqrt(T)
    if option_type == "call":
        """Black-Scholes call option price"""
        return S * np.exp((b-r)*T) * norm.cdf(d1) - K * np.exp(-r * T) * norm.cdf(d2)
    else: 
        """Black-Scholes put option price"""
        return -S * np.exp((b-r)*T) * norm.cdf(-d1) + K * np.exp(-r * T) * norm.cdf(-d2)
        
def binomial(S, K, T, b, r, sigma, N, option_type, option_style = "american"):
    """Binomial evaluation"""
    dt = T/N # timestep
    u = np.exp(sigma*np.sqrt(dt)) # CRR method
    d = 1/u
    q = (np.exp(b*dt) - d) / (u-d) # ~Probability of up move
    disc = np.exp(-r*dt)

    # Initialise asset prices at maturity
    asset_price = S * (d ** np.arange(N,-1,-1)) * (u ** np.arange(0,N+1,1))

    # Initialise option payoffs at maturity
    if option_type == "call":
        price = np.maximum(asset_price - K, 0)
    else:
        price = np.maximum(K - asset_price, 0)

    # Backwards induction
    for i in np.arange(N-1, -1, -1):
        price[:i+1] = disc * (q * price[1:i+2] + (1-q) * price[0:i+1])
        price = price[:-1]
        if option_style == "american":
            asset_price = S * (d ** np.arange(i,-1,-1)) * (u ** np.arange(0,i+1,1))
            if option_type == "call":
                price = np.maximum(asset_price - K, price)
            else:
                price = np.maximum(K - asset_price, price)

    return price[0]

def monte_carlo(S, K, T, r, sigma, N, option_type, option_style = "european"):
    """Monte-Carlo evaluation"""
    dt = T/N # Timestep t
    n = 100000 # Number of simulations

    # Preallocate array
    paths = np.zeros((N+1, n))
    paths[0] = S

    # Simulate paths
    for t in range(1, N+1):
        z = np.random.standard_normal(n)
        # Stock price at t
        paths[t] = paths[t-1] * np.exp((r - 0.5 * sigma**2) * dt + sigma * np.sqrt(dt) * z)


    # Payoff
    if option_style == "european":
        if option_type == "call":
            payoff = np.maximum(paths[-1] - K, 0)
        else:
            payoff = np.maximum(K - paths[-1], 0)
    elif option_style == "asian":
        if option_type == "call":
            avg_price = np.mean(paths, axis=0)
            payoff = np.maximum(avg_price - K, 0)
        else:
            avg_price = np.mean(paths, axis=0)
            payoff = np.maximum(K - avg_price, 0)
    else: raise ValueError("Unsupported option type")
    
    price = np.exp(-r * T) * np.mean(payoff)
    return price



def calculate_heatmap_data(ticker, strike, premium, option_type, expiry, model):
    """Heatmap generation"""
    strike = float(strike)  # K (Strike Price)
    stock = yf.Ticker(ticker) 
    current_price = stock.history(period="1d")["Close"].iloc[-1] # S (Spot Price)
    expiry_date = datetime.strptime(expiry, "%Y-%m-%d") 
    today = datetime.today()
    r = 0.045  # 4.5% interest rate (Risk-free rate)
    b = r # Option is without dividend yield
    N = 100 # Number of timesteps for binomial
    
    try:
        # Accurate sigma (implied volatility)
        opt_chain = stock.option_chain(expiry)
        if option_type == "call":
            calls = opt_chain.calls
            sigma = calls.loc[calls['strike'] == strike, 'impliedVolatility'].iloc[0]
        else:
            puts = opt_chain.puts
            sigma = puts.loc[puts['strike'] == strike, 'impliedVolatility'].iloc[0]
    except:
        # Fallback to sigma estimate (annualised volatility)
        df = stock.history(period="1y")
        change = np.array(df["Close"].values)
        log_returns = np.log(change[1:] / change[:-1])
        sigma = np.std(log_returns) * np.sqrt(252.0)


    # Days from now until expiry
    days = (expiry_date - today).days+1
    if days <= 0:
        raise ValueError("Expiry date is in the past")
    T_curr = days / 365.25

    # Stock price range: ±10% of current
    prices = np.linspace(current_price * 1.1, current_price * 0.9, 25)
    times = np.append(np.arange(days, 0, -1), 0.0001) # Append intrinsic value (T=0) to end

    # Fill heatmap with cells x,y(time till expiry, stock price) with option profit Z
    Z = []
    for S in prices:
        row = []
        for t in times:
            T = t / 365.25
            # sigma = get_implied_vol(S, strike, T, r, sigma, premium, option_type)
            if model=='black-scholes':
                option_price = black_scholes(S, strike, T, b, r, sigma, option_type)
            elif model=='binomial':
                option_price = binomial(S, strike, T, b, r, sigma, N, option_type)
            elif model=='monte-carlo':
                option_price = monte_carlo(S, strike, T, r, sigma, N, option_type, option_style="european")
            else: raise ValueError("Unsupported pricing model")
            # intrinsic_value = max(S - strike, 0) if option_type == "call" else max(strike - S, 0)
            # extrinsic_value = option_price - intrinsic_value
            # profit = (intrinsic_value - premium + extrinsic_value) * 100
            profit = (option_price - premium) * 100
            # print("Value at expiry: " + str(profit) + " for price of underlying " + str(S))
            row.append(profit)
        Z.append(row)

    """Options Metrics"""

    # Breakeven price at expiry
    if option_type == "call":
        breakeven = strike + premium
    else:
        breakeven = strike - premium

    # Probability of profit (for long strategy)
    d1_breakeven = (np.log(current_price / breakeven) + (b + 0.5 * sigma**2) * T_curr) / (sigma * np.sqrt(T_curr))
    d2_breakeven = d1_breakeven - sigma * np.sqrt(T_curr)
    if option_type == "call":
        prob_profit = norm.cdf(d2_breakeven)
    else:
        prob_profit = norm.cdf(-d2_breakeven)

    prob_profit *= 100
    print(prob_profit)
    # Maximum risk (for long strategy)
    max_risk = premium * 100

    # Maximum return
    if option_type == "call":
        max_return = "Unlimited"
    else:
        max_return = (max(strike - 0, 0) - premium) * 100 # Stock price at 0

    """Greeks"""

    d1 = (np.log(S / strike) + (b + 0.5 * sigma**2) * T_curr) / (sigma * np.sqrt(T_curr))
    d2 = d1 - sigma * np.sqrt(T_curr)

    # Delta (Sensitivity of option price to change in price of underlying)
    if option_type == "call":
        delta = norm.cdf(d1)
    else:
        delta = norm.cdf(d1) - 1

    # Gamma (Sensitivity of option price to change in delta)
    gamma = norm.pdf(d1) / (current_price * sigma * np.sqrt(T_curr))

    # Theta (Sensitivity of option price to change in time)
    if option_type == "call":
        theta = (-(current_price * norm.pdf(d1) * sigma) / (2 * np.sqrt(T_curr)) - b * strike * np.exp(-b * T_curr) * norm.cdf(d2)) / 365
    else:
        theta = (-(current_price * norm.pdf(d1) * sigma) / (2 * np.sqrt(T_curr)) + b * strike * np.exp(-b * T_curr) * norm.cdf(-d2)) / 365
    
    # Vega (Sensitivity of option price to change in volatility)
    vega = current_price * np.sqrt(T_curr) * norm.pdf(d1) / 100

    # Rho (Sensitivity of option price to change in interest rate)
    if option_type == "call":
        rho = strike * T_curr * np.exp(-r * T_curr) * norm.cdf(d2) / 100
    else:
        rho = -strike * T_curr * np.exp(-r * T_curr) * norm.cdf(-d2) / 100


    return {
        "z": Z,
        "y": list(map(float, prices)),
        "x": list(map(int, times)),
        "metrics": {
            "current_price": round(current_price, 2),
            "strike": strike,
            "premium": premium,
            "entry_cost": round(max_risk, 2),
            "max_risk": round(max_risk, 2),
            "probability_profit": round(prob_profit, 2),
            "max_return": max_return,
            "breakeven_price": round(breakeven, 2),
            "delta": delta,
            "gamma": gamma,
            "theta": theta,
            "vega": vega,
            "rho": rho
        }
    }
