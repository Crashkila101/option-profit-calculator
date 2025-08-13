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
};

type HeatmapData = {
  x: number[];
  y: number[];
  z: number[][];
};

export default function Home() {
  const [model, setModel] = useState('black-scholes');
  const [ticker, setTicker] = useState<string>('');
  const [contracts, setContracts] = useState<OptionContract[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [heatmap, setHeatmap] = useState<HeatmapData | null>(null);

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
          },
        }
      );
      setHeatmap(res.data.heatmap);
    } catch (error) {
      console.error('Error fetching heatmap:', error);
    }
  };

  return (
    <div className="">
      <div className="nav-container">
        <Navbar model={model} setModel={setModel} />
      </div>
      <div className="">
        <input
          className=""
          placeholder="Enter ticker (e.g., AAPL)"
          value={ticker}
          onChange={(e) => setTicker(e.target.value.toUpperCase())}
        />
        <button
          className=""
          onClick={fetchContracts}
        >
          Get Options
        </button>
      </div>

      {contracts.length > 0 && (
        <select
          className=""
          onChange={(e) => setSelectedIndex(Number(e.target.value))}
        >
          <option value="">Select an Option Contract</option>
          {contracts.map((c, i) => (
            <option key={i} value={i}>
              {c.type.toUpperCase()} ${c.strike} (premium: ${c.premium}) exp: {c.expiry}
            </option>
          ))}
        </select>
      )}

      {selectedIndex !== null && (
        <button
          onClick={fetchHeatmap}
        >
          Show Heatmap
        </button>
      )}

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
                [0.47, 'rgb(255, 150, 150)'],// light red
                [0.5, 'rgb(255, 255, 255)'], // white at zero
                [0.53, 'rgb(193, 255, 193)'],// light green
                [1.0, 'rgb(0, 255, 0)'],     // full green
              ],
              zmid: 0,  // center color scale at 0
            },
          ]}
          layout={{
            title: { text: `Profit Heatmap for ${ticker} ${contracts[selectedIndex!].type} $${contracts[selectedIndex!].strike}` },
            xaxis: {
              title: { text: 'Days Until Expiry' },
              autorange: 'reversed',
            },
            yaxis: {
              title: { text: 'Stock Price' },
            },
          }}
        />
      )}
    </div>
  );
}
