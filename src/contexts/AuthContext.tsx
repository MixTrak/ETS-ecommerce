'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User as FirebaseUser, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import toast from 'react-hot-toast';

interface User {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  avatar?: string;
  provider: 'email' | 'google';
}

interface Admin {
  id: string;
  fullName: string;
  email: string;
  role: 'owner' | 'admin' | 'manager';
  permissions: {
    canCreateUsers: boolean;
    canDeleteUsers: boolean;
    canCreateProducts: boolean;
    canDeleteProducts: boolean;
    canCreateAdmins: boolean;
  };
}

interface AuthContextProps {
  // User auth
  user: User | null;
  currentUser: User | null; // ✅ alias for UI convenience
  firebaseUser: FirebaseUser | null;
  userLoading: boolean;
  
  // Admin auth
  admin: Admin | null;
  adminLoading: boolean;
  
  // User methods
  signupUser: (data: { fullName: string; email: string; phone: string; password: string }) => Promise<void>;
  loginUser: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logoutUser: () => Promise<void>;
  
  // Admin methods
  loginAdmin: (email: string, password: string) => Promise<void>;
  logoutAdmin: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [adminLoading, setAdminLoading] = useState(true);

  // Firebase auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser);
      setUserLoading(false);
      
      if (firebaseUser) {
        // Check if user is from Google (has photoURL and providerId)
        const isGoogleUser = firebaseUser.providerData.some(provider => 
          provider.providerId === 'google.com'
        );
        
        const userData: User = {
          id: firebaseUser.uid,
          fullName: firebaseUser.displayName || '',
          email: firebaseUser.email || '',
          avatar: isGoogleUser && firebaseUser.photoURL ? firebaseUser.photoURL : '',
          provider: isGoogleUser ? 'google' : 'email',
        };
        setUser(userData);
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Check for admin token on mount
  const checkAdminAuth = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/me', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        const adminWithPermissions = {
          ...data.admin,
          permissions: getPermissionsForRole(data.admin.role)
        };
        setAdmin(adminWithPermissions);
      }
    } catch (error) {
      console.error('Admin auth check failed:', error);
    } finally {
      setAdminLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAdminAuth();
  }, [checkAdminAuth]);

  const getPermissionsForRole = (role: string) => {
    const permissions = {
      owner: {
        canCreateUsers: true,
        canDeleteUsers: true,
        canCreateProducts: true,
        canDeleteProducts: true,
        canCreateAdmins: true,
      },
      admin: {
        canCreateUsers: false,
        canDeleteUsers: true,
        canCreateProducts: true,
        canDeleteProducts: true,
        canCreateAdmins: false,
      },
      manager: {
        canCreateUsers: false,
        canDeleteUsers: false,
        canCreateProducts: true,
        canDeleteProducts: true,
        canCreateAdmins: false,
      },
    };
    
    return permissions[role as keyof typeof permissions] || permissions.manager;
  };

  // User signup
  const signupUser = async (data: { fullName: string; email: string; phone: string; password: string }) => {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      
      localStorage.setItem('user-token', result.token);
      setUser(result.user);
      toast.success('Signup successful!');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Signup failed';
      toast.error(errorMessage);
      throw error;
    }
  };

  // User login
  const loginUser = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      
      localStorage.setItem('user-token', result.token);
      setUser(result.user);
      toast.success('Login successful!');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      toast.error(errorMessage);
      throw error;
    }
  };

  // Google login
  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const googleUser = result.user;
      
      // Check if this is actually a Google user
      const isGoogleUser = googleUser.providerData.some(provider => 
        provider.providerId === 'google.com'
      );
      
      if (!isGoogleUser) {
        throw new Error('Not a valid Google user');
      }
      
      // Send Google user data to our backend
      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: {
            uid: googleUser.uid,
            email: googleUser.email,
            displayName: googleUser.displayName,
            photoURL: googleUser.photoURL,
          }
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to authenticate with backend');
      }
      
      const data = await response.json();
      
      // Update local state with user data from backend
      setUser(data.user);
      localStorage.setItem('user-token', data.token);
      
      toast.success('Google login successful!');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Google login failed';
      toast.error(errorMessage);
      throw error;
    }
  };

  // User logout
  const logoutUser = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('user-token');
      setUser(null);
      setFirebaseUser(null);
      toast.success('Logged out successfully');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Logout failed';
      toast.error(errorMessage);
    }
  };

  // Admin login
  const loginAdmin = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      
      const adminWithPermissions = {
        ...result.admin,
        permissions: getPermissionsForRole(result.admin.role)
      };
      setAdmin(adminWithPermissions);
      toast.success('Admin login successful!');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Admin login failed';
      toast.error(errorMessage);
      throw error;
    }
  };

  // Admin logout
  const logoutAdmin = async () => {
    try {
      await fetch('/api/admin/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      setAdmin(null);
      toast.success('Admin logged out successfully');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Admin logout failed';
      toast.error(errorMessage);
    }
  };

  const value: AuthContextProps = {
    // User auth
    user,
    currentUser: user, // ✅ alias so UI can use currentUser
    firebaseUser,
    userLoading,
    
    // Admin auth
    admin,
    adminLoading,
    
    // User methods
    signupUser,
    loginUser,
    loginWithGoogle,
    logoutUser,
    
    // Admin methods
    loginAdmin,
    logoutAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
