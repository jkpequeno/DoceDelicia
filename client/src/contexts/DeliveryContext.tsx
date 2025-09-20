import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface DeliveryContextType {
  cep: string;
  available: boolean | null;
  city: string;
  state: string;
  checkedAt: number | null;
  setCep: (cep: string) => void;
  setDeliveryInfo: (info: { available: boolean; city: string; state: string; cep: string }) => void;
  clearDeliveryInfo: () => void;
}

const DeliveryContext = createContext<DeliveryContextType | undefined>(undefined);

interface DeliveryProviderProps {
  children: ReactNode;
}

export function DeliveryProvider({ children }: DeliveryProviderProps) {
  const [cep, setCep] = useState('');
  const [available, setAvailable] = useState<boolean | null>(null);
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [checkedAt, setCheckedAt] = useState<number | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('delivery-check');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Only use saved data if it's recent (within 24 hours)
        const now = Date.now();
        if (parsed.checkedAt && (now - parsed.checkedAt) < 24 * 60 * 60 * 1000) {
          setCep(parsed.cep || '');
          setAvailable(parsed.available);
          setCity(parsed.city || '');
          setState(parsed.state || '');
          setCheckedAt(parsed.checkedAt);
        }
      } catch (error) {
        // Invalid saved data, ignore
        localStorage.removeItem('delivery-check');
      }
    }
  }, []);

  // Save to localStorage when delivery info changes
  useEffect(() => {
    if (checkedAt) {
      const dataToSave = {
        cep,
        available,
        city,
        state,
        checkedAt
      };
      localStorage.setItem('delivery-check', JSON.stringify(dataToSave));
    }
  }, [cep, available, city, state, checkedAt]);

  const setDeliveryInfo = (info: { available: boolean; city: string; state: string; cep: string }) => {
    setCep(info.cep);
    setAvailable(info.available);
    setCity(info.city);
    setState(info.state);
    setCheckedAt(Date.now());
  };

  const clearDeliveryInfo = () => {
    setCep('');
    setAvailable(null);
    setCity('');
    setState('');
    setCheckedAt(null);
    localStorage.removeItem('delivery-check');
  };

  return (
    <DeliveryContext.Provider value={{
      cep,
      available,
      city,
      state,
      checkedAt,
      setCep,
      setDeliveryInfo,
      clearDeliveryInfo
    }}>
      {children}
    </DeliveryContext.Provider>
  );
}

export function useDelivery() {
  const context = useContext(DeliveryContext);
  if (context === undefined) {
    throw new Error('useDelivery must be used within a DeliveryProvider');
  }
  return context;
}