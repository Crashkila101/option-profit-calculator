import React from 'react'
// import { useState } from 'react'
import Image from 'next/image'
import '../styles/global.scss';
import '../styles/Navbar.scss';
import logoLight from '../images/logo-light.png';
import logoDark from '../images/logo-dark.png';
import toggleDark from '../images/darkmode.png';
import toggleLight from '../images/lightmode.png'


const Navbar = ({theme, setTheme, model, setModel}) => {
  const toggle = () => {
    if (theme=='light')
      setTheme('dark');
    else if (theme=='dark')
      setTheme('light');
  }
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
      <Image src={theme == 'light' ? logoLight : logoDark} alt="" className="logo"></Image>
      <ul>
        <li>Home</li>
        <li>Black Scholes</li>
        <li>Monte Carlo</li>
        <li>Binomial</li>
      </ul>
      <Image onClick={()=>{toggle()}} src={theme == 'light' ? toggleDark : toggleLight} alt="" className="darkmode-toggle-icon"></Image>
    </div>
  );
};

export default Navbar;