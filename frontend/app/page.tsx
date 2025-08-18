/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import axios from 'axios';
import Plot from '@/components/PlotlyChart';
import Navbar from '@/components/NavBar';
import '../styles/global.scss';

type OptionContract = {
  type: 'call' | 'put';
  strike: number;
  premium: number;
  expiry: string;
  model: 'black-scholes' | 'monte-carlo' | 'binomial'
};


type HeatmapData = {
  x: number[] | string[];
  y: number[] | string[];
  z: number[][];
  metrics: any;
};

export default function Home() {
  const [model, setModel] = useState('black-scholes');
  const [ticker, setTicker] = useState<string>('');
  const [contracts, setContracts] = useState<OptionContract[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [heatmap, setHeatmap] = useState<HeatmapData | null>(null);
  const [theme, setTheme] = useState('light');


  // When home is clicked
  const resetApp = () => {
    setTicker('');
    setContracts([]);
    setSelectedIndex(null);
    setHeatmap(null);
  };

  // Fetch options chains
  const fetchContracts = async () => {
    try {
      const res = await axios.get<{ contracts: OptionContract[] }>(
        `http://localhost:8000/options?ticker=${ticker}`
      );
      setContracts(res.data.contracts);
      setSelectedIndex(null);
      setHeatmap(null);
    } catch (error) {
      console.error('Error fetching contracts:', error);
    }
  };

  // Fetch heatmap data
  const fetchHeatmap = async () => {
    if (selectedIndex === null) return;

    const selected = contracts[selectedIndex];
    try {
      const res = await axios.get<{ heatmap: HeatmapData }>(
        `http://localhost:8000/heatmap`,
        {
          params: {
            ticker,
            strike: selected.strike,
            premium: selected.premium,
            type: selected.type,
            expiry: selected.expiry,
            model: model
          },
        }
      );
      setHeatmap(res.data.heatmap);
    } catch (error) {
      console.error('Error fetching heatmap:', error);
    }
  };

  return (
    <div className={`container ${theme}`}>
      <Navbar theme={theme} setTheme={setTheme} model={model} setModel={setModel} onReset={resetApp} />
      <div className="content-wrapper">
        <div className="ticker-input-group">
          <input
            className="ticker-input"
            placeholder="Enter ticker (e.g., AAPL)"
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
          />
          <button
            className="get-options-button"
            onClick={fetchContracts}
          >
            Get Options
          </button>
        </div>

        {contracts.length > 0 && (
          <select
            className="contract-select"
            onChange={(e) => setSelectedIndex(Number(e.target.value))}
          >
            <option value="">Select an Option Contract</option>
            {/* Group contracts by expiry */}
            {Object.entries(
              contracts.reduce((groups: Record<string, Array<OptionContract & { index: number }>>, contract, i) => {
                if (!groups[contract.expiry]) groups[contract.expiry] = [];
                groups[contract.expiry].push({ ...contract, index: i });
                return groups;
              }, {} as Record<string, Array<OptionContract & { index: number }>>)
            ).map(([expiry, contractsForExpiry]) => (
              <optgroup key={expiry} label={`Expiry: ${expiry}`}>
                {contractsForExpiry.map((c) => (
                  <option key={c.index} value={c.index}>
                    {c.type.toUpperCase()} ${c.strike} (premium: ${c.premium})
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        )}
        {selectedIndex !== null && (
          <button onClick={fetchHeatmap} className="show-heatmap-button">
            Show Heatmap
          </button>
        )}
        <div className="heatmap-container">
          {heatmap && (
            <Plot
              data={[
                {
                  z: heatmap.z,
                  x: heatmap.x,
                  y: heatmap.y,
                  type: 'heatmap',
                  colorscale: [
                    [0.0, 'rgb(255, 0, 0)'],     // full red
                    [0.5, 'rgb(255, 255, 255)'], // white at zero
                    [1.0, 'rgb(0, 255, 0)'],     // full green
                  ],
                  texttemplate: "%{z:.0f}",
                  textfont: {
                    size: 10,
                    color: "auto"
                  },
                  hovertemplate: 'DTE: %{x}<br>Price: $%{y}<br>P&L: $%{z:.2f}<extra></extra>'
                }
              ]}
              layout={{
                title: { text: `Profit Heatmap for $${contracts[selectedIndex!].strike} ${ticker} ${contracts[selectedIndex!].type} expiring at ${contracts[selectedIndex!].expiry}` },
                xaxis: {
                  title: { text: 'Days Until Expiry' },
                  autorange: 'reversed',
                },
                yaxis: {
                  title: { text: 'Stock Price' },
                },
                width: 800,
                height: 700
              }}
            />
          )}
        </div>
        <div className="option-metrics-container">
          {heatmap && (
              <div className="option-metrics">
        
                <h3>Estimated returns:</h3>
                <div className="metrics-grid">
                  <div className="metric-card current-price">
                    <h4>Current Price</h4>
                    <div className="metric-value">${heatmap.metrics.current_price}</div>
                  </div>

                  <div className="metric-card strike">
                    <h4>Strike Price</h4>
                    <div className="metric-value">${heatmap.metrics.strike}</div>
                  </div>
                  
                  <div className="metric-card premium">
                    <h4>Premium</h4>
                    <div className="metric-value">${heatmap.metrics.premium} x 100 contracts</div>
                  </div>

                  <div className="metric-card probability">
                    <h4>Probability of Profit</h4>
                    <div className="metric-value">{heatmap.metrics.probability_profit}%</div>
                  </div>

                  <div className="metric-card entry-cost">
                    <h4>Entry Cost</h4>
                    <div className="metric-value">${heatmap.metrics.entry_cost}</div>
                  </div>

                  <div className="metric-card risk">
                    <h4>Maximum Risk</h4>
                    <div className="metric-value">${heatmap.metrics.max_risk}</div>
                  </div>

                  <div className="metric-card return">
                    <h4>Maximum Return</h4>
                    <div className="metric-value">${heatmap.metrics.max_return}</div>
                  </div>

                  <div className="metric-card breakeven">
                    <h4>Breakeven Price at Expiry</h4>
                    <div className="metric-value">${heatmap.metrics.breakeven_price}</div>
                  </div>
                </div>

                <h3>Greeks:</h3>
                <div className="metrics-grid">
                  <div className="metric-card delta">
                    <h4>Delta (Δ)</h4>
                    <div className="metric-value">{heatmap.metrics.delta}<br/>Sensitivity of option premium to change in price of the underlying stock</div>
                  </div>

                  <div className="metric-card gamma">
                    <h4>Gamma (Γ)</h4>
                    <div className="metric-value">{heatmap.metrics.gamma}<br/>Sensitivity of option premium to change in delta</div>
                  </div>

                  <div className="metric-card theta">
                    <h4>Theta (Θ)</h4>
                    <div className="metric-value">{heatmap.metrics.theta}<br/>Sensitivity of option premium to change in time</div>
                  </div>

                  <div className="metric-card vega">
                    <h4>Vega (ν)</h4>
                    <div className="metric-value">{heatmap.metrics.vega}<br/>Sensitivity of option premium to change in volatility</div>
                  </div>

                  <div className="metric-card rho">
                    <h4>Rho (ρ)</h4>
                    <div className="metric-value">{heatmap.metrics.rho}<br/>Sensitivity of option premium to change in interest rate</div>
                  </div>
                </div>
              </div>
          )}
        </div>
      </div>
    </div>
  );
}
