import React from 'react'
// import { useState } from 'react'
import Image from 'next/image'
import '../styles/global.scss';
import '../styles/Navbar.scss';
import logoLight from '../images/logo-light.png';
import logoDark from '../images/logo-dark.png';
import toggleDark from '../images/darkmode.png';
import toggleLight from '../images/lightmode.png'


const Navbar = ({ theme, setTheme, model, setModel, onReset }:
  { theme: string; setTheme: (model: string) => void; model: string; setModel: (model: string) => void; onReset: () => void }
) => {

  const toggle = () => {
    if (theme == 'light')
      setTheme('dark');
    else if (theme == 'dark')
      setTheme('light');
  }
  // for rendering models dynamically
  const navItems = [
    { label: 'Home', value: 'black-scholes', action: 'reset' },
    { label: 'Black Scholes', value: 'black-scholes' },
    { label: 'Monte Carlo', value: 'monte-carlo' },
    { label: 'Binomial', value: 'binomial' }
  ];

  return (
    <div className="navbar">
      <Image src={theme == 'light' ? logoLight : logoDark} alt="" className="logo"></Image>
      <ul>
        {navItems.map((item, idx) => (
          <li
            key={idx}
            onClick={() => {
              if (item.action === 'reset')
                onReset();
              setModel(item.value)
            }
            }
            className={model === item.value ? 'active' : ''}
          >
            {item.label}
          </li>
        ))}
      </ul>
      <Image onClick={() => { toggle() }} src={theme == 'light' ? toggleDark : toggleLight} alt="" className="darkmode-toggle-icon"></Image>
    </div>
  );
};

export default Navbar;