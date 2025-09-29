import React, { createContext, useContext } from 'react';
import { colors } from './colors.js';
import { spacing } from './spacing.js';
import { typography } from './typography.js';

export { colors, spacing, typography };

// Theme context (placeholder for now)
const ThemeContext = createContext({
  colors,
  spacing,
  typography,
  isDark: true
});

export function ThemeProvider({ children }) {
  // TODO: Add theme switching logic later
  const theme = {
    colors,
    spacing,
    typography,
    isDark: true
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}


