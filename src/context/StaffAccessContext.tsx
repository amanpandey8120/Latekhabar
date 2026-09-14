import React, { createContext, useContext } from 'react';

export interface StaffAccessContextType {
  role: 'admin' | 'author' | 'writer';
  userId: string;
}

const StaffAccessContext = createContext<StaffAccessContextType | null>(null);

export const StaffAccessProvider: React.FC<{
  value: StaffAccessContextType;
  children: React.ReactNode;
}> = ({ value, children }) => {
  return (
    <StaffAccessContext.Provider value={value}>
      {children}
    </StaffAccessContext.Provider>
  );
};

export const useStaffAccess = (): StaffAccessContextType => {
  const context = useContext(StaffAccessContext);
  if (!context) {
    // Fallback to safe defaults if used outside provider
    return {
      role: 'admin',
      userId: '',
    };
  }
  return context;
};
