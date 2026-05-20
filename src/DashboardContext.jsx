import { createContext } from 'react';

export const sourceContext = createContext({
  selectedSource: 'combined',
  setSelectedSource: () => {},
});

export const countryContext = createContext({
    selectedCountry: 'World',
    setSelectedCountry: () => {},
  });

export const yearContext = createContext({
    selectedYear: 2024,
    setSelectedYear: () => {},
});