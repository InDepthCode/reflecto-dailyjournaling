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

  // Load entries based on auth state
  useEffect(() => {
    if (user) {
      setShowAuth(false);
      fetchEntriesFromSupabase();
    } else {
      loadGuestEntries();
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
    const sessionEntries = sessionStorage.getItem('guest-entries');
    if (sessionEntries) {
      setEntries(JSON.parse(sessionEntries));
    } else {
      setEntries([]);
    }
  };

  const saveGuestEntries = (updatedEntries: GuestEntry[]) => {
    sessionStorage.setItem('guest-entries', JSON.stringify(updatedEntries));
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <Analytics />
      <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
            Reflecto
          </h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsDark(!isDark)}
              className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-all duration-200 text-gray-800 dark:text-gray-200"
              aria-label="Toggle theme"
            >
              {isDark ? <SunIcon /> : <MoonIcon />}
            </button>
            {user ? (
              <button
                onClick={() => signOut()}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white"
              >
                Sign out
              </button>
            ) : (
              <button
                onClick={() => setShowAuth(true)}
                className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                Sign in to save your entries
              </button>
            )}
          </div>
        </header>

        {!user && (
          <div className="mb-8 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200">
            <p>You're in guest mode. Your entries will be saved until you close the browser. Sign in to keep them forever!</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mb-12">
          <div className="group relative">
            <div className="absolute top-4 left-4 z-10">
              <SpeechToText onTranscript={(text) => setContent(prev => prev + text)} />
            </div>
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind today?"
              name="journal-entry"
              autoComplete="new-password"
              className="w-full min-h-[150px] max-h-[400px] p-6 pl-20 rounded-2xl border-2 border-gray-200 dark:border-gray-700 \
                bg-white dark:bg-gray-800 text-gray-900\
                focus:ring-2 focus:ring-blue-500 focus:border-transparent\
                placeholder:text-gray-400 dark:placeholder:text-gray-300\
                resize-none transition-all duration-200 overflow-y-auto\
                shadow-sm hover:shadow-md text-lg"
              style={{
                color: document.documentElement.classList.contains('dark') ? '#fff' : undefined,
                backgroundColor: document.documentElement.classList.contains('dark') ? '#23272f' : undefined,
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(156, 163, 175, 0.5) transparent'
              }}
            />
            <div className="absolute bottom-4 right-4">
              <span className="text-sm text-gray-400 dark:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                Press Enter to save
              </span>
            </div>
          </div>
          <button
            type="submit"
            disabled={!content.trim() || isSaving}
            className="mt-4 px-6 py-2.5 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 
              text-white font-medium shadow-md hover:shadow-lg 
              disabled:opacity-50 disabled:cursor-not-allowed
              transform hover:-translate-y-0.5 active:translate-y-0
              transition-all duration-200"
          >
            {isSaving ? 'Saving...' : 'Save Entry'}
          </button>
        </form>

        <div className="space-y-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-500 dark:text-gray-400">Loading entries...</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                No entries yet. Start writing your thoughts above!
              </p>
            </div>
          ) : (
            entries.map((entry) => (
              <div 
                key={entry.id} 
                className="group p-6 rounded-xl bg-white dark:bg-gray-800 shadow-sm hover:shadow-md 
                  transition-all duration-200 border border-gray-100 dark:border-gray-700"
              >
                <div className="flex items-start justify-between mb-4">
                  <time className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                    {formatDate(entry.created_at)}
                  </time>
                  <button
                    onClick={() => deleteEntry(entry.id)}
                    className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300
                      opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  >
                    Delete
                  </button>
                </div>
                <p className="whitespace-pre-wrap text-gray-800 dark:text-gray-200 leading-relaxed">
                  {entry.content}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default App; 