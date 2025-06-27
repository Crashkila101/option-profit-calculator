import React from 'react'
import '../styles/global.scss';

let Header = ({ model, setModel }: { model: string; setModel: (model: string) => void }) => {
  return (
    // <header>
    //   <div>
    //     <h1>Options Profit Visualizer</h1>
    //     <div>
    //       <label htmlFor="model-select" className="text-sm">Pricing Model:</label>
    //       <select
    //         id="model-select"
    //         value={model}
    //         onChange={(e) => setModel(e.target.value)}
    //         className="bg-gray-700 text-white p-1 rounded-md"
    //       >
    //         <option value="black-scholes">Black-Scholes</option>
    //         <option value="binomial">Binomial</option>
    //         <option value="whaley">Whaley</option>
    //       </select>
    //     </div>
    //   </div>
    // </header>
    <header>
      <nav id="navbar" className="">
      <div className="">
        <a href="#" className="">
          <span className="">
            Options Profit Visualiser
          </span>
          <div>
          </div>
        </a>
      </div>
      </nav>
    </header>
  );
};

export default Header;