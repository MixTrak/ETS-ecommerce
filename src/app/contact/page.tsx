'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { contactSchema, ContactForm } from '@/lib/validations';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  Phone, Mail, MapPin, Clock,
  MessageCircle, Home
} from 'lucide-react';
import UserAvatar from '@/components/UserAvatar';
import { AnimatedElement, StaggerContainer } from '@/components/animations';
import { motion } from 'framer-motion';

const DRAFT_KEY = 'contact_draft_v1';
const MESSAGE_MAX = 1000;

const ContactPage: React.FC = () => {
  const { firebaseUser, user } = useAuth();

  const currentUser = useMemo(() => {
    if (user) return user;
    if (!firebaseUser) return null;

    return {
      id: firebaseUser.uid,
      fullName: firebaseUser.displayName || 'User',
      email: firebaseUser.email || '',
      provider: 'google' as const,
      avatar: firebaseUser.photoURL || '',
    };
  }, [user, firebaseUser]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<number | null>(null);
  const [messageLen, setMessageLen] = useState(0);
  const autosaveTimer = useRef<number | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
    getValues,
  } = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: '', email: '', message: '' },
  });

  const watched = watch();

  // Track message length
  useEffect(() => {
    setMessageLen((watched.message || '').length);
  }, [watched.message]);

  // Load draft or prefill with user info
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<ContactForm & { savedAt?: number }>;
        reset({
          name: parsed.name || '',
          email: parsed.email || '',
          message: parsed.message || '',
        });
        if (parsed.savedAt) setDraftSavedAt(parsed.savedAt);
      } else if (currentUser) {
        if (currentUser.fullName) setValue('name', currentUser.fullName);
        if (currentUser.email) setValue('email', currentUser.email);
      }
    } catch (err) {
      console.warn('Could not load draft', err);
    }
  }, [reset, currentUser, setValue]);

  // Autosave draft
  useEffect(() => {
    if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);

    autosaveTimer.current = window.setTimeout(() => {
      const data = {
        name: getValues('name'),
        email: getValues('email'),
        message: getValues('message'),
        savedAt: Date.now(),
      };
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
        setDraftSavedAt(data.savedAt);
      } catch (e) {
        console.warn('Failed to save draft', e);
      }
    }, 700);

    return () => {
      if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);
    };
  }, [watched.name, watched.email, watched.message, getValues]);

  // Submit handler
  const onSubmit = async (data: ContactForm) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Message sent successfully!');
        reset();
        localStorage.removeItem(DRAFT_KEY);
        setDraftSavedAt(null);
        setTimeout(() => toast.dismiss(), 6000);
      } else {
        throw new Error(result.error || 'Failed to send message');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message.';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    reset();
    setDraftSavedAt(null);
    toast('Draft cleared');
  };

  return (
    <div className="min-h-screen bg-base-100 py-12 px-6">
      {/* Navbar */}
      <AnimatedElement variant="fadeInDown" duration={0.5}>
        <nav className="navbar bg-base-100 shadow-lg mb-10 rounded-xl px-4">
          <motion.div
            className="navbar-start"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Link href="/" className="btn btn-ghost text-xl font-bold">
              ETS Communication
            </Link>
          </motion.div>

          <motion.div
            className="navbar-center hidden lg:flex"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <ul className="menu menu-horizontal px-1">
              <motion.li whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link href="/products">Products</Link>
              </motion.li>
              <motion.li whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link href="/search">Search</Link>
              </motion.li>
              <motion.li whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link href="/contact" className="active">Contact</Link>
              </motion.li>
            </ul>
          </motion.div>

          <motion.div
            className="navbar-end"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {currentUser ? (
              <div className="dropdown dropdown-end">
                <motion.div
                  tabIndex={0}
                  role="button"
                  className="btn btn-ghost btn-circle avatar"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <UserAvatar user={currentUser} size="lg" />
                </motion.div>
                <ul
                  tabIndex={0}
                  className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52 border border-base-300"
                >
                  <li className="menu-title">
                    <span className="text-sm opacity-70">{currentUser.fullName}</span>
                  </li>
                  <li>
                    <Link href="/" className="flex items-center gap-2">
                      <Home className="w-4 h-4" /> Go to Home
                    </Link>
                  </li>

                  <li>
                    <Link href="/products">Products</Link>
                  </li>

                  <li>
                    <Link href="/search">Search</Link>
                  </li>
                </ul>
              </div>
            ) : (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href="/login"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Login
                </Link>
              </motion.div>
            )}
          </motion.div>
        </nav>
      </AnimatedElement>

      <main className="container mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Contact Card */}
        <AnimatedElement variant="fadeInLeft" duration={0.7}>
          <aside className="bg-gradient-to-br from-blue-50 to-blue-100 p-8 rounded-2xl shadow-lg flex flex-col gap-6">
            <AnimatedElement variant="fadeInUp" delay={0.2}>
              <h2 className="text-3xl font-bold mb-2">Get in Touch</h2>
              <p className="text-base-content/70">
                Reach us through any of the following channels, we are happy to help.
              </p>
            </AnimatedElement>

            <StaggerContainer className="space-y-4" delayChildren={0.3} staggerChildren={0.15}>
              <AnimatedElement variant="fadeInLeft">
                <div className="flex items-center gap-4">
                  <motion.div whileHover={{ rotate: 15, scale: 1.2 }} transition={{ type: 'spring' }}>
                    <Phone className="w-6 h-6 text-primary" />
                  </motion.div>
                  <span className="text-lg">+225 05 05 30 82 77</span>
                </div>
              </AnimatedElement>

              <AnimatedElement variant="fadeInLeft">
                <div className="flex items-center gap-4">
                  <motion.div whileHover={{ rotate: 15, scale: 1.2 }} transition={{ type: 'spring' }}>
                    <Mail className="w-6 h-6 text-primary" />
                  </motion.div>
                  <span className="text-lg">Kouakoujohnsonyao2@gmail.com</span>
                </div>
              </AnimatedElement>

              <AnimatedElement variant="fadeInLeft">
                <div className="flex items-center gap-4">
                  <motion.div whileHover={{ rotate: 15, scale: 1.2 }} transition={{ type: 'spring' }}>
                    <MapPin className="w-6 h-6 text-primary" />
                  </motion.div>
                  <span className="text-lg">Côte d&apos;Ivoire</span>
                </div>
              </AnimatedElement>

              <AnimatedElement variant="fadeInLeft">
                <div className="flex items-center gap-4">
                  <motion.div whileHover={{ rotate: 15, scale: 1.2 }} transition={{ type: 'spring' }}>
                    <Clock className="w-6 h-6 text-primary" />
                  </motion.div>
                  <span className="text-lg">Mon - Sat: 9am - 7pm</span>
                </div>
              </AnimatedElement>
            </StaggerContainer>

            <AnimatedElement variant="fadeInUp" delay={0.8}>
              <motion.a
                href="https://wa.me/2250505308277"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-success w-full flex items-center justify-center gap-2 mt-4 hover:shadow-xl transition no-underline"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <MessageCircle size={18} /> WhatsApp
              </motion.a>
            </AnimatedElement>
          </aside>
        </AnimatedElement>

        {/* Contact Form */}
        <AnimatedElement variant="fadeInRight" duration={0.7}>
          <section className="bg-base-200 p-8 rounded-2xl shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <AnimatedElement variant="fadeInUp" delay={0.2}>
                <h2 className="text-2xl font-semibold">Send us a message</h2>
              </AnimatedElement>
              <AnimatedElement variant="fadeIn" delay={0.4}>
                <div className="text-sm text-base-content/60">
                  Draft saved: {draftSavedAt ? new Date(draftSavedAt).toLocaleTimeString() : '—'}
                </div>
              </AnimatedElement>
            </div>

            <AnimatedElement variant="fadeInUp" delay={0.4}>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Name */}
                <div>
                  <label className="label">
                    <span className="label-text">Your name</span>
                  </label>
                  <input
                    {...register('name')}
                    type="text"
                    placeholder="Full name"
                    className={`input input-bordered w-full ${errors.name ? 'input-error' : ''}`}
                  />
                  {errors.name && (
                    <span className="text-error text-sm">{errors.name.message}</span>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="label">
                    <span className="label-text">Email</span>
                  </label>
                  <input
                    {...register('email')}
                    type="email"
                    placeholder="you@example.com"
                    className={`input input-bordered w-full ${errors.email ? 'input-error' : ''}`}
                  />
                  {errors.email && (
                    <span className="text-error text-sm">{errors.email.message}</span>
                  )}
                </div>

                {/* Message */}
                <div>
                  <label className="label flex justify-between">
                    <span className="label-text">Message</span>
                    <span>{messageLen} / {MESSAGE_MAX}</span>
                  </label>
                  <textarea
                    {...register('message')}
                    rows={6}
                    maxLength={MESSAGE_MAX}
                    placeholder="Write your message..."
                    className={`textarea textarea-bordered w-full ${errors.message ? 'textarea-error' : ''}`}
                  />
                  <div className="h-2 bg-base-300 rounded-full mt-2 overflow-hidden">
                    <div
                      style={{ width: `${Math.min((messageLen / MESSAGE_MAX) * 100, 100)}%` }}
                      className="h-full bg-primary transition-all"
                    />
                  </div>
                  {errors.message && (
                    <span className="text-error text-sm">{errors.message.message}</span>
                  )}
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                  <motion.button
                    type="submit"
                    disabled={isSubmitting}
                    className={`btn btn-primary ${isSubmitting ? 'loading' : ''}`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                  </motion.button>

                  <motion.button
                    type="button"
                    onClick={clearDraft}
                    className="btn btn-ghost"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Clear Draft
                  </motion.button>
                </div>
              </form>
            </AnimatedElement>
          </section>
        </AnimatedElement>
      </main>
    </div>
  );
};

export default ContactPage;