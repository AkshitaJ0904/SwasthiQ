import { createContext, useContext, useState, useCallback } from 'react';

const PharmacyContext = createContext(null);

export function PharmacyProvider({ children }) {
  const [refreshKey, setRefreshKey] = useState(0);

  const triggerRefresh = useCallback(() => {
    setRefreshKey(k => k + 1);
  }, []);

  return (
    <PharmacyContext.Provider value={{ refreshKey, triggerRefresh }}>
      {children}
    </PharmacyContext.Provider>
  );
}

export function usePharmacy() {
  return useContext(PharmacyContext);
}
