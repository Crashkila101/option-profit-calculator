'use client';

import { useState } from 'react';
import axios from 'axios';
import Plot from '@/components/PlotlyChart';

type OptionContract = {
  type: 'call' | 'put';
  strike: number;
  price: number;
  expiry: string;
};

type HeatmapData = {
  x: number[];
  y: number[];
  z: number[][];
};

export default function Home() {
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
            price: selected.price,
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
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Options Profit Heatmap</h1>

      <div className="flex gap-2 mb-4">
        <input
          className="border px-2 py-1"
          placeholder="Enter ticker (e.g., AAPL)"
          value={ticker}
          onChange={(e) => setTicker(e.target.value.toUpperCase())}
        />
        <button
          className="bg-blue-500 text-white px-3 py-1 rounded"
          onClick={fetchContracts}
        >
          Get Options
        </button>
      </div>

      {contracts.length > 0 && (
        <select
          className="border px-2 py-1 mb-4"
          onChange={(e) => setSelectedIndex(Number(e.target.value))}
        >
          <option value="">Select an Option Contract</option>
          {contracts.map((c, i) => (
            <option key={i} value={i}>
              {c.type.toUpperCase()} ${c.strike} (premium: ${c.price}) exp: {c.expiry}
            </option>
          ))}
        </select>
      )}

      {selectedIndex !== null && (
        <button
          className="ml-2 bg-green-600 text-white px-3 py-1 rounded"
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
              colorscale: 'Viridis',
            },
          ]}
          layout={{
            title: {
                text:  `Profit Heatmap for ${ticker} ${contracts[selectedIndex!].type} $${contracts[selectedIndex!].strike}`
            },
            xaxis: { title: {text: 'Stock Price'} },
            yaxis: { title: {text: 'Days Until Expiry'} },
          }}
        />
      )}
    </div>
  );
}
