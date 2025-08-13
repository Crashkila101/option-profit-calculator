import React from 'react'
import Image from 'next/image'
import '../styles/global.scss';
import '../styles/Navbar.scss';
import logoLight from '../images/logo-light.png';
// import logoDark from '../images/logo-dark.png';


const Navbar = ({ model, setModel }: { model: string; setModel: (model: string) => void }) => {
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
    <div className="navbar">
      <Image src={logoLight} alt="" className="logo"></Image>
      <ul>
        <li>Home</li>
        <li>Black Scholes</li>
        <li>Monte Carlo</li>
        <li>Binomial</li>
      </ul>
      {/* <Image src={} alt="" className="darkmode-toggle-icon"></Image> */}
    </div>
  );
};

export default Navbar;