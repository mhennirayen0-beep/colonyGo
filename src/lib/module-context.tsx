'use client';

import * as React from 'react';

export type ColonyModule = 'sales' | 'admin';

type ModuleState = {
  module: ColonyModule;
  setModule: (m: ColonyModule) => void;
};

const ModuleContext = React.createContext<ModuleState | null>(null);

const STORAGE_KEY = 'colonygo:module';

export function ModuleProvider({ children }: { children: React.ReactNode }) {
  const [module, setModuleState] = React.useState<ColonyModule>('sales');

  React.useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY) as ColonyModule | null;
      if (saved === 'sales' || saved === 'admin') setModuleState(saved);
    } catch {
      // ignore
    }
  }, []);

  const setModule = (m: ColonyModule) => {
    setModuleState(m);
    try {
      window.localStorage.setItem(STORAGE_KEY, m);
    } catch {
      // ignore
    }
  };

  return (
    <ModuleContext.Provider value={{ module, setModule }}>
      {children}
    </ModuleContext.Provider>
  );
}

export function useColonyModule() {
  const ctx = React.useContext(ModuleContext);
  if (!ctx) throw new Error('useColonyModule must be used inside ModuleProvider');
  return ctx;
}
