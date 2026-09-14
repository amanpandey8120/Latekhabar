import React, { createContext, useContext } from 'react';
import { useAuth } from './AuthContext';

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
  const { user } = useAuth();

  if (context) {
    return context;
  }

  // Fallback to AuthContext user role if available
  const userRole = user?.role;
  const validRole: 'admin' | 'author' | 'writer' =
    userRole === 'author' || userRole === 'writer' || userRole === 'admin'
      ? userRole
      : 'admin';

  return {
    role: validRole,
    userId: user?.id || '',
  };
};

export default StaffAccessContext;
