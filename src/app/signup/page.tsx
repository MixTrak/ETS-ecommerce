'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { userRegistrationSchema, UserRegistration } from '@/lib/validations';

const SignupPage: React.FC = () => {
  const { signupUser, loginWithGoogle } = useAuth();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UserRegistration>({
    resolver: zodResolver(userRegistrationSchema),
  });

  const [loading, setLoading] = useState(false);

  const handleSignup = async (data: UserRegistration) => {
    setLoading(true);
    try {
      await signupUser(data);
      router.push('/');
    } catch {
      // handled in context
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
      router.push('/');
    } catch {
      // handled in context
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 p-6">
      <div className="w-full max-w-lg bg-base-100 rounded-2xl shadow-2xl p-8">
        <header className="mb-6 text-center">
          <Link href="/" className="inline-block text-3xl font-bold text-primary">
            KKG E-Commerce
          </Link>
          <h2 className="mt-2 text-lg text-base-content">Create a new account</h2>
          <p className="mt-1 text-sm text-base-content/70">
            Or{' '}
            <Link href="/login" className="font-medium text-primary hover:underline">
              sign in to your existing account
            </Link>
          </p>
        </header>

        <form className="space-y-4" onSubmit={handleSubmit(handleSignup)} noValidate>
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium">
              Full Name
            </label>
            <input
              id="fullName"
              {...register('fullName')}
              type="text"
              className={`input input-bordered w-full ${errors.fullName ? 'input-error' : ''}`}
              placeholder="Enter your full name"
            />
            {errors.fullName && <p className="mt-1 text-xs text-error">{String(errors.fullName?.message)}</p>}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium">
              Email address
            </label>
            <input
              id="email"
              {...register('email')}
              type="email"
              className={`input input-bordered w-full ${errors.email ? 'input-error' : ''}`}
              placeholder="you@example.com"
            />
            {errors.email && <p className="mt-1 text-xs text-error">{String(errors.email?.message)}</p>}
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium">
              Phone Number
            </label>
            <input
              id="phone"
              {...register('phone')}
              type="tel"
              className={`input input-bordered w-full ${errors.phone ? 'input-error' : ''}`}
              placeholder="Enter your phone number"
            />
            {errors.phone && <p className="mt-1 text-xs text-error">{String(errors.phone?.message)}</p>}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              {...register('password')}
              type="password"
              className={`input input-bordered w-full ${errors.password ? 'input-error' : ''}`}
              placeholder="Enter your password"
            />
            {errors.password && <p className="mt-1 text-xs text-error">{String(errors.password?.message)}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`btn btn-primary w-full ${loading ? 'loading' : ''}`}
          >
            {loading ? 'Signing Up…' : 'Sign Up'}
          </button>

          <div className="divider text-sm">OR</div>

          <button
            type="button"
            onClick={handleGoogleSignup}
            disabled={loading}
            className="btn btn-outline w-full"
          >
            Continue with Google
          </button>
        </form>
      </div>
    </div>
  );
};

export default SignupPage;
