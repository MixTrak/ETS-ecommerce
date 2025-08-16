import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import Admin, { IAdmin } from '@/models/Admin';
import connectDB from './mongo';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface TokenPayload {
  adminId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const generateToken = (payload: Omit<TokenPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

export const generateUserToken = (payload: { userId: string; email: string; role: string }): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

export const verifyToken = (token: string): TokenPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
};

export const getTokenFromRequest = (request: NextRequest): string | null => {
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    console.log('Admin token found in Authorization header');
    return authHeader.substring(7);
  }
  
  // Also check cookies
  const cookieToken = request.cookies.get('admin-token')?.value;
  console.log('Admin token in cookie:', !!cookieToken);
  return cookieToken || null;
};

export const verifyAdminToken = async (request: NextRequest): Promise<IAdmin | null> => {
  try {
    const token = getTokenFromRequest(request);
    console.log('Admin token verification - token found:', !!token);
    
    if (!token) {
      console.log('Admin token verification - no token found');
      return null;
    }

    const payload = verifyToken(token);
    console.log('Admin token verification - payload:', payload ? 'valid' : 'invalid');
    
    if (!payload) {
      console.log('Admin token verification - invalid payload');
      return null;
    }

    await connectDB();
    const admin = await Admin.findById(payload.adminId).select('-password');
    
    if (!admin || !admin.isActive) {
      console.log('Admin token verification - admin not found or inactive:', !!admin, admin?.isActive);
      return null;
    }

    console.log('Admin token verification - success for:', admin.email);
    return admin;
  } catch (error) {
    console.error('Admin token verification error:', error);
    return null;
  }
};

export const requireAdminRole = (requiredRoles: string[]) => {
  return async (request: NextRequest): Promise<IAdmin | null> => {
    const admin = await verifyAdminToken(request);
    if (!admin || !requiredRoles.includes(admin.role)) {
      return null;
    }
    return admin;
  };
};

// WhatsApp contact utility
export const getWhatsAppLink = (region: 'ci' | 'in' = 'ci', message: string = ''): string => {
  const phones = {
    ci: '+2250787942288', // Côte d'Ivoire
    in: '+919901884675'   // India
  };
  
  const phone = phones[region];
  const encodedMessage = encodeURIComponent(message);
  
  return `https://wa.me/${phone.replace('+', '')}${message ? `?text=${encodedMessage}` : ''}`;
};
