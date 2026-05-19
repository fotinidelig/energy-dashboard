import { createContext } from 'react';

export const sourceContext = createContext({
  selectedSource: 'combined',
  setSelectedSource: () => {},
});
