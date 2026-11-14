import React, { createContext, useContext, useState, useEffect } from 'react';

export type AppTheme = 'olive' | 'red-black';

export interface ThemeColors {
  bg: string;
  surface: string;
  surfaceLight: string;
  surfaceHover: string;
  border: string;
  accent: string;
  accentHover: string;
  accentDim: string;
  accentLight: string;
  text: string;
  textMuted: string;
  textDim: string;
  chartGrid: string;
}

const themeColorMap: Record<AppTheme, ThemeColors> = {
  olive: {
    bg: '#28301C',
    surface: '#323D25',
    surfaceLight: '#3D4A2E',
    surfaceHover: '#445334',
    border: '#485736',
    accent: '#9A7E3B',
    accentHover: '#B29246',
    accentDim: '#7A642E',
    accentLight: '#D2CF9A',
    text: '#D2CF9A',
    textMuted: '#AAA87D',
    textDim: '#7E7C58',
    chartGrid: '#3D4A2E',
  },
  'red-black': {
    bg: '#0C0C0E',
    surface: '#151518',
    surfaceLight: '#1E1E23',
    surfaceHover: '#26262D',
    border: '#282830',
    accent: '#E11D48',
    accentHover: '#F43F5E',
    accentDim: '#9F1239',
    accentLight: '#FECDD3',
    text: '#F4F4F6',
    textMuted: '#A1A1AA',
    textDim: '#71717A',
    chartGrid: '#282830',
  },
};

interface ThemeContextType {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'olive',
  setTheme: () => {},
  colors: themeColorMap.olive,
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<AppTheme>('olive');

  useEffect(() => {
    const saved = localStorage.getItem('tracker_theme') as AppTheme;
    if (saved === 'olive' || saved === 'red-black') {
      setThemeState(saved);
      document.documentElement.setAttribute('data-theme', saved);
    } else {
      document.documentElement.setAttribute('data-theme', 'olive');
    }
  }, []);

  const setTheme = (newTheme: AppTheme) => {
    setThemeState(newTheme);
    localStorage.setItem('tracker_theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, colors: themeColorMap[theme] }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
