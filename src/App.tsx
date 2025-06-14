// @ts-ignore
import React, { useState, useRef, useEffect } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { MoonIcon, SunIcon } from './components/Icons';
import { SpeechToText } from './components/SpeechToText';
import { useAuth } from './contexts/AuthContext';
import { supabase } from './lib/supabase';
import type { JournalEntry } from './lib/supabase';
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';
import Modal from './components/Modal';
import PaymentPlans from './components/Payment';
import Calendar from 'react-calendar';
import type { CalendarType } from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { Calendar as CalendarIcon } from 'react-feather';
import './calendar-custom.css';

interface GuestEntry {
  id: string;
  created_at: string;
  content: string;
}

function App() {
  const [content, setContent] = useState('');
  const [entries, setEntries] = useState<(JournalEntry | GuestEntry)[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme-preference');
    return saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [isSignUp, setIsSignUp] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { user, signOut, loading: authLoading } = useAuth();
  const [showDebugModal, setShowDebugModal] = useState(false);
  const [showEmailConfirmedModal, setShowEmailConfirmedModal] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{ name: string; price: number; features: string[] } | null>(null);
  const [hasStartedJournaling, setHasStartedJournaling] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showCalendarModal, setShowCalendarModal] = useState(false);

  const plans = [
    {
      name: 'Free',
      price: 0,
      features: [
        'Unlimited journal entries',
        'Basic analytics',
        'Light & dark mode',
        'Export to PDF',
      ],
    },
    {
      name: 'Starter',
      price: 100,
      features: [
        'All Free features',
        'Priority email support',
        'Daily mood tracking',
        'Reminders & notifications',
        'Custom tags & search',
      ],
    },
    {
      name: 'Pro',
      price: 200,
      features: [
        'All Starter features',
        'Advanced analytics',
        'Collaboration tools',
        'Cloud backup',
        'Mobile app integration',
      ],
    },
  ];

  // Load entries based on auth state
  useEffect(() => {
    if (user) {
      setShowAuth(false);
      fetchEntriesFromSupabase();
    } else {
      // For guests, start with empty entries (no persistence)
      setEntries([]);
    }
  }, [user]);

  // Handle theme
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);

  useEffect(() => {
    localStorage.setItem('theme-preference', isDark ? 'dark' : 'light');
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Check for email confirmation in URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');
    if (params.get('type') === 'signup' && access_token && refresh_token) {
      setIsAuthLoading(true);
      supabase.auth.setSession({ access_token, refresh_token }).finally(() => {
        setIsAuthLoading(false);
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (params.get('type') === 'signup' && access_token) {
      setShowAuth(true);
      setIsSignUp(false);
      setShowEmailConfirmedModal(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const loadGuestEntries = () => {
    // No longer load from sessionStorage - start fresh each time
    setEntries([]);
  };

  const saveGuestEntries = (updatedEntries: GuestEntry[]) => {
    // Only update state, don't persist to sessionStorage
    setEntries(updatedEntries);
  };

  const fetchEntriesFromSupabase = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error('Error fetching entries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSaving) return;

    // Hide pricing when saving entry
    setHasStartedJournaling(true);
    setShowPricingModal(false);

    setIsSaving(true);
    try {
      if (user) {
        // Save to Supabase
        const newEntry = {
          content: content.trim(),
          user_id: user.id,
        };

        const { error } = await supabase
          .from('journal_entries')
          .insert([newEntry]);

        if (error) throw error;
        fetchEntriesFromSupabase();
      } else {
        // Save to session storage
        const newEntry: GuestEntry = {
          id: crypto.randomUUID(),
          created_at: new Date().toISOString(),
          content: content.trim(),
        };
        const updatedEntries = [newEntry, ...entries];
        saveGuestEntries(updatedEntries as GuestEntry[]);
      }
      setContent('');
    } catch (error) {
      console.error('Error saving entry:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteEntry = async (id: string) => {
    if (user) {
      try {
        const { error } = await supabase
          .from('journal_entries')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) throw error;
        fetchEntriesFromSupabase();
      } catch (error) {
        console.error('Error deleting entry:', error);
      }
    } else {
      // Delete from session storage
      const updatedEntries = entries.filter(entry => entry.id !== id);
      saveGuestEntries(updatedEntries as GuestEntry[]);
    }
  };

  const formatDate = (isoDate: string) => {
    return new Date(isoDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Handle content change and close pricing modal if open
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    // Hide pricing when user starts typing
    if (newContent.trim().length > 0 && !hasStartedJournaling) {
      setHasStartedJournaling(true);
      setShowPricingModal(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Hide pricing on any key press if not already hidden
    if (!hasStartedJournaling) {
      setHasStartedJournaling(true);
      setShowPricingModal(false);
    }
  };

  // Helper: get entries for selected date
  const entriesForSelectedDate = entries.filter(entry => {
    const entryDate = new Date(entry.created_at);
    return (
      entryDate.getFullYear() === selectedDate.getFullYear() &&
      entryDate.getMonth() === selectedDate.getMonth() &&
      entryDate.getDate() === selectedDate.getDate()
    );
  });

  // Helper: get all entry dates for calendar highlight
  const entryDates = entries.map(entry => {
    const d = new Date(entry.created_at);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).toDateString();
  });

  if (authLoading || isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (showAuth) {
    return (
      <div>
        {isSignUp ? (
          <SignUpPage onToggle={() => setIsSignUp(false)} onCancel={() => setShowAuth(false)} />
        ) : (
          <>
            <SignInPage onToggle={() => setIsSignUp(true)} onCancel={() => setShowAuth(false)} />
            <Modal isOpen={showEmailConfirmedModal} onClose={() => setShowEmailConfirmedModal(false)}>
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Email confirmed!</h3>
                <p className="mb-4">Your email has been successfully confirmed. Please log in.</p>
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  onClick={() => setShowEmailConfirmedModal(false)}
                >
                  OK
                </button>
              </div>
            </Modal>
          </>
        )}
      </div>
    );
  }

  return (
    <div className={isDark ? 'dark' : ''}>
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-bg-light)] dark:bg-[var(--color-bg-dark)] transition-colors duration-300">
        <div className="w-full max-w-2xl mx-auto px-2 py-8">
          <header className="flex flex-col items-center mb-10 relative">
            <h1 className="text-4xl md:text-5xl font-extrabold font-serif tracking-tight mb-2 text-center" style={{ fontFamily: 'Merriweather, Georgia, serif', color: '#bfa76a' }}>Reflecto Diary</h1>
            <div className="flex items-center gap-3 mt-2">
              <button
                onClick={() => setIsDark(!isDark)}
                className="p-2 rounded-full border border-[var(--color-accent)] bg-[var(--color-page-light)] dark:bg-[var(--color-page-dark)] text-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-white transition"
                aria-label="Toggle theme"
              >
                {isDark ? <SunIcon /> : <MoonIcon />}
              </button>
              <button
                className="p-2 rounded-full border border-[var(--color-accent)] bg-[var(--color-page-light)] dark:bg-[var(--color-page-dark)] text-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-white transition"
                onClick={() => setShowCalendarModal(true)}
                aria-label="Open calendar"
              >
                <CalendarIcon size={24} />
              </button>
              {user ? (
                <button
                  onClick={() => signOut()}
                  className="px-4 py-2 text-base font-semibold border rounded-lg bg-transparent text-[var(--color-accent)] border-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-white transition"
                >
                  Sign out
                </button>
              ) : (
                <button
                  onClick={() => setShowAuth(true)}
                  className="px-4 py-2 text-base font-semibold border rounded-lg bg-transparent text-[var(--color-accent)] border-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-white transition"
                >
                  Sign in to save your entries
                </button>
              )}
            </div>
          </header>

          {/* Calendar Modal */}
          <Modal isOpen={showCalendarModal} onClose={() => setShowCalendarModal(false)} className="react-calendar-modal">
            <div className="relative flex flex-col items-center p-6 md:p-10 bg-transparent">
              <h2 className="text-lg font-serif font-bold mb-2 text-[var(--color-accent)]">Pick a date</h2>
              <Calendar
                onChange={(date) => {
                  setSelectedDate(date as Date);
                  setShowCalendarModal(false);
                }}
                value={selectedDate}
                tileClassName={({ date }) =>
                  entryDates.includes(date.toDateString()) ? 'bg-[var(--color-accent)] text-white rounded-full' : ''
                }
                className="custom-diary-calendar rounded-xl shadow-md border-none bg-[var(--color-page-light)] dark:bg-[var(--color-page-dark)]"
                navigationLabel={({ label }) => (
                  <span
                    className="px-2 py-1 rounded font-bold text-[var(--color-accent)]"
                    style={{ minWidth: '60px', textAlign: 'center', fontSize: '0.9rem' }}
                  >
                    {label}
                  </span>
                )}
              />
            </div>
          </Modal>

          {!user && (
            <div className="mb-8 diary-page text-[var(--color-accent)] text-center text-base">
              <p>You're in guest mode. Your entries will be lost when you close or refresh the browser. Sign in to keep them forever!</p>
            </div>
          )}

          <div className="diary-page">
            <form onSubmit={handleSubmit} className="mb-8">
              <div className="group relative">
                <div className="absolute top-4 left-4 z-10">
                  <SpeechToText onTranscript={(text) => setContent(prev => prev + text)} />
                </div>
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={handleContentChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Dear diary..."
                  name="journal-entry"
                  autoComplete="new-password"
                  className="w-full diary-textarea pl-16 pr-4 placeholder:text-[var(--color-muted)] transition-all duration-200 overflow-y-auto"
                ></textarea>
              </div>
              <button
                type="submit"
                className="mt-2 w-[30%] text-lg font-bold tracking-wide border rounded-lg bg-[var(--color-accent)] text-white hover:opacity-90 transition"
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Entry'}
              </button>
            </form>

            {!user && !hasStartedJournaling && (
              <PaymentPlans 
                showPricingModal={showPricingModal}
                setShowPricingModal={setShowPricingModal}
              />
            )}

            {/* Only show entry for selected date as a page */}
            {entriesForSelectedDate.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-[var(--color-muted)]">No entry for this day. Start writing your thoughts above!</p>
              </div>
            ) : (
              entriesForSelectedDate.map((entry, idx) => (
                <div key={entry.id} className="entry-card group transition-all duration-200">
                  <div className="flex items-start justify-between mb-2">
                    <time className="text-xs text-[var(--color-muted)] font-medium" style={{ fontFamily: 'Merriweather, Georgia, serif' }}>
                      {formatDate(entry.created_at)}
                    </time>
                    <button
                      onClick={() => deleteEntry(entry.id)}
                      className="text-red-400 hover:text-red-300 text-xs font-semibold border-none bg-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    >
                      Delete
                    </button>
                  </div>
                  <p className="whitespace-pre-wrap text-[var(--color-text-light)] dark:text-[var(--color-text-dark)] leading-relaxed text-base" style={{ fontFamily: 'Merriweather, Georgia, serif' }}>
                    {entry.content}
                  </p>
                </div>
              ))
            )}
            {entries.length > 5 && (
              <div className="flex justify-between mt-6">
                <button
                  type="button"
                  className="text-[var(--color-accent)] font-bold hover:underline"
                  onClick={() => {
                    // Find previous day with entry
                    const prev = entries
                      .map(e => new Date(e.created_at))
                      .filter(d => d < selectedDate)
                      .sort((a, b) => b.getTime() - a.getTime())[0];
                    if (prev) setSelectedDate(prev);
                  }}
                  disabled={entries.filter(e => new Date(e.created_at) < selectedDate).length === 0}
                >
                  ← Previous
                </button>
                <button
                  type="button"
                  className="text-[var(--color-accent)] font-bold hover:underline"
                  onClick={() => {
                    // Find next day with entry
                    const next = entries
                      .map(e => new Date(e.created_at))
                      .filter(d => d > selectedDate)
                      .sort((a, b) => a.getTime() - b.getTime())[0];
                    if (next) setSelectedDate(next);
                  }}
                  disabled={entries.filter(e => new Date(e.created_at) > selectedDate).length === 0}
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App; 