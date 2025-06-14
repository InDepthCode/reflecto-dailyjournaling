import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Modal from '../components/Modal';

interface SignInPageProps {
  onToggle: () => void;
  onCancel: () => void;
}

export default function SignInPage({ onToggle, onCancel }: SignInPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await signIn(email, password);
      onCancel();
    } catch (err: any) {
      if (err.message && err.message.toLowerCase().includes('confirm')) {
        setShowConfirmModal(true);
      } else {
        setError('Failed to sign in. Please check your credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center bg-[var(--color-bg-light)] dark:bg-[var(--color-bg-dark)] px-4 h-screen transition-colors duration-300">
      <div className="max-w-md mx-auto diary-page shadow-lg my-16 py-10 px-6">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold font-serif text-[var(--color-accent)]" style={{ fontFamily: 'Merriweather, Georgia, serif' }}>
            Sign in to your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/30 p-4">
              <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
            </div>
          )}
          <div className="space-y-4">
            <input
              id="email-address"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-[90%] mx-auto block border-[1.5px] border-[var(--color-accent)] rounded-lg bg-[var(--color-page-light)] dark:bg-[var(--color-page-dark)] text-[var(--color-text-light)] dark:text-[var(--color-text-dark)] px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] placeholder:text-[var(--color-muted)]"
              placeholder="Email address"
            />
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-[90%] mx-auto block border-[1.5px] border-[var(--color-accent)] rounded-lg bg-[var(--color-page-light)] dark:bg-[var(--color-page-dark)] text-[var(--color-text-light)] dark:text-[var(--color-text-dark)] px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] placeholder:text-[var(--color-muted)]"
              placeholder="Password"
            />
          </div>

          <div className="flex items-center justify-between mt-2">
            <button
              type="button"
              onClick={onToggle}
              className="text-sm font-medium text-[var(--color-accent)] hover:underline"
            >
              Don't have an account? Sign up
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="text-sm font-medium text-[var(--color-muted)] hover:underline"
            >
              Continue as guest
            </button>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-[90%] mx-auto block py-2 rounded-lg font-bold border bg-[var(--color-accent)] text-white hover:opacity-90 transition"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
      <Modal isOpen={showConfirmModal} onClose={() => setShowConfirmModal(false)}>
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2 font-serif text-[var(--color-accent)]">Please confirm your account!</h3>
          <p className="mb-4">Check your email for a confirmation link before logging in.</p>
          <button
            className="px-4 py-2 rounded-lg font-bold border bg-[var(--color-accent)] text-white hover:opacity-90 transition"
            onClick={() => setShowConfirmModal(false)}
          >
            OK
          </button>
        </div>
      </Modal>
    </div>
  );
} 