'use client';

import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext({
  colorTheme: 'bw',
  setColorTheme: () => {},
  isLoading: false
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }) {
  const [colorTheme, setColorTheme] = useState('bw');

  // Apply theme class to document
  useEffect(() => {
    const root = document.documentElement;
    // Remove all theme classes
    root.classList.remove('lowkey');

    // Add the current theme class (bw is default, no class needed)
    if (colorTheme === 'lowkey') {
      root.classList.add('lowkey');
    }
  }, [colorTheme]);

  return (
    <ThemeContext.Provider value={{ colorTheme, setColorTheme, isLoading: false }}>
      {children}
    </ThemeContext.Provider>
  );
}
