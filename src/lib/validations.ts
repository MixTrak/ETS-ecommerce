import { z } from 'zod';

// User validation schemas
export const userRegistrationSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(50, 'Full name must be less than 50 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits').max(15, 'Phone number must be less than 15 digits'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100, 'Password must be less than 100 characters'),
});

export const userLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Admin validation schemas
export const adminRegistrationSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100, 'Password must be less than 100 characters'),
  role: z.enum(['admin', 'manager'], { message: 'Role must be either admin or manager' }),
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(50, 'Full name must be less than 50 characters'),
});

export const adminLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Product validation schemas
export const productSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters').max(100, 'Product name must be less than 100 characters'),
  price: z.union([z.number(), z.string()]).transform(val => typeof val === 'string' ? parseFloat(val) : val).refine(val => !isNaN(val) && val >= 0, 'Price must be a positive number'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(1000, 'Description must be less than 1000 characters'),
  category: z.string().min(2, 'Category must be at least 2 characters').max(50, 'Category must be less than 50 characters'),
  tags: z.union([
    z.array(z.string().min(1, 'Tag cannot be empty')),
    z.string().transform(val => val.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0))
  ]).optional().default([]),
  featured: z.union([z.boolean(), z.string()]).transform(val => typeof val === 'string' ? val === 'true' : val).optional().default(false),
  stockQuantity: z.union([z.number(), z.string()]).transform(val => typeof val === 'string' ? parseInt(val) : val).refine(val => !isNaN(val) && val >= 0, 'Stock quantity must be a positive number').optional().default(0),
  image: z.union([z.string().url('Image must be a valid URL'), z.any()]).optional(),
  imagePublicId: z.string().optional(), // Firebase Storage path
});

export const productUpdateSchema = productSchema.partial();

// Create input type for forms (before transformation)
export const productInputSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters').max(100, 'Product name must be less than 100 characters'),
  price: z.string().min(1, 'Price is required').refine(val => {
    const parsed = parseFloat(val);
    return !isNaN(parsed) && parsed >= 0;
  }, 'Price must be a positive number'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(1000, 'Description must be less than 1000 characters'),
  category: z.string().min(2, 'Category must be at least 2 characters').max(50, 'Category must be less than 50 characters'),
  tags: z.string(),
  featured: z.boolean(),
  stockQuantity: z.string().refine(val => {
    const parsed = parseInt(val);
    return !isNaN(parsed) && parsed >= 0;
  }, 'Stock quantity must be a positive number'),
  image: z.string(),
  imagePublicId: z.string(),
});

// Define the ProductInput type explicitly to ensure compatibility
export type ProductInput = {
  name: string;
  price: string;
  description: string;
  category: string;
  tags: string;
  featured: boolean;
  stockQuantity: string;
  image: string;
  imagePublicId: string;
};

// Search validation schema
export const searchSchema = z.object({
  query: z.string().min(1, 'Search query is required').max(100, 'Search query must be less than 100 characters'),
  category: z.string().optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  page: z.number().min(1).optional().default(1),
  limit: z.number().min(1).max(50).optional().default(12),
});

// File upload validation
export const imageUploadSchema = z.object({
  file: z.any().refine((file) => file instanceof File, 'File is required'),
}).refine((data) => {
  const file = data.file as File;
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  return validTypes.includes(file.type);
}, 'File must be a valid image (JPEG, PNG, WebP)')
.refine((data) => {
  const file = data.file as File;
  return file.size <= 5 * 1024 * 1024; // 5MB
}, 'File size must be less than 5MB');

// Contact form validation
export const contactFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be less than 50 characters'),
  email: z.string().email('Invalid email address'),
  subject: z.string().min(5, 'Subject must be at least 5 characters').max(100, 'Subject must be less than 100 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters').max(500, 'Message must be less than 500 characters'),
});

export type UserRegistration = z.infer<typeof userRegistrationSchema>;
export type UserLogin = z.infer<typeof userLoginSchema>;
export type AdminRegistration = z.infer<typeof adminRegistrationSchema>;
export type AdminLogin = z.infer<typeof adminLoginSchema>;
export type ProductData = z.infer<typeof productSchema>;
export type ProductWithId = ProductData & { _id: string };
export type SearchParams = z.infer<typeof searchSchema>;

export const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be less than 50 characters'),
  email: z.string().email('Invalid email address'),
  message: z.string().min(10, 'Message must be at least 10 characters').max(500, 'Message must be less than 500 characters'),
});
export type ContactForm = z.infer<typeof contactSchema>;