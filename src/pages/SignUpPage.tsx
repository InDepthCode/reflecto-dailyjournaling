import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Modal from '../components/Modal';

interface SignUpPageProps {
  onToggle: () => void;
  onCancel: () => void;
}

export default function SignUpPage({ onToggle, onCancel }: SignUpPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(0);
  const { signUp } = useAuth();
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldownTime > 0) {
      timer = setInterval(() => {
        setCooldownTime(time => time - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [cooldownTime]);

  // Automatically redirect to login after showing success modal
  useEffect(() => {
    if (showSuccessModal) {
      const timer = setTimeout(() => {
        setShowSuccessModal(false);
        onToggle();
      }, 15000); 
      return () => clearTimeout(timer);
    }
  }, [showSuccessModal, onToggle]);

  const validatePassword = (password: string) => {
    const minLength = 6;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const errors: string[] = [];
    if (password.length < minLength) {
      errors.push(`Password must be at least ${minLength} characters long`);
    }
    if (!hasUpperCase) {
      errors.push('Include at least one uppercase letter');
    }
    if (!hasLowerCase) {
      errors.push('Include at least one lowercase letter');
    }
    if (!hasNumbers) {
      errors.push('Include at least one number');
    }
    if (!hasSpecialChar) {
      errors.push('Include at least one special character');
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (cooldownTime > 0) {
      setError(`Please wait ${cooldownTime} seconds before trying again.`);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      setError(`Password requirements:\n${passwordErrors.join('\n')}`);
      return;
    }

    setIsLoading(true);
    try {
      await signUp(email, password);
      setShowSuccessModal(true);
    } catch (err: any) {
      setError(err.message);
      if (err.message.includes('Too many signup attempts')) {
        setCooldownTime(300); // 5 minutes cooldown
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
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-[var(--color-muted)]">
            Password must contain:
          </p>
          <ul className="mt-1 list-disc list-inside text-center text-sm text-[var(--color-muted)]">
            <li>At least 6 characters</li>
            <li>One uppercase letter</li>
            <li>One lowercase letter</li>
            <li>One number</li>
            <li>One special character (!@#$%^&*(),.?":{}|&lt;&gt;)</li>
          </ul>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/30 p-4">
              <p className="text-sm text-red-700 dark:text-red-200 whitespace-pre-line">{error}</p>
              {cooldownTime > 0 && (
                <p className="mt-2 text-sm text-red-700 dark:text-red-200">
                  You can try again in {Math.floor(cooldownTime / 60)}:{(cooldownTime % 60).toString().padStart(2, '0')}
                </p>
              )}
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
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-[90%] mx-auto block border-[1.5px] border-[var(--color-accent)] rounded-lg bg-[var(--color-page-light)] dark:bg-[var(--color-page-dark)] text-[var(--color-text-light)] dark:text-[var(--color-text-dark)] px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] placeholder:text-[var(--color-muted)]"
              placeholder="Password"
            />
            <input
              id="confirm-password"
              name="confirm-password"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-[90%] mx-auto block border-[1.5px] border-[var(--color-accent)] rounded-lg bg-[var(--color-page-light)] dark:bg-[var(--color-page-dark)] text-[var(--color-text-light)] dark:text-[var(--color-text-dark)] px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] placeholder:text-[var(--color-muted)]"
              placeholder="Confirm Password"
            />
          </div>

          <div className="flex items-center justify-between mt-2">
            <button
              type="button"
              onClick={onToggle}
              className="text-sm font-medium text-[var(--color-accent)] hover:underline"
            >
              Already have an account? Sign in
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
              {isLoading ? 'Signing up...' : 'Sign up'}
            </button>
          </div>
        </form>
      </div>
      <Modal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)}>
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2 font-serif text-[var(--color-accent)]">Check your email!</h3>
          <p className="mb-4">A confirmation link has been sent to your email. Please confirm your account before logging in.</p>
          <button
            className="px-4 py-2 rounded-lg font-bold border bg-[var(--color-accent)] text-white hover:opacity-90 transition"
            onClick={() => setShowSuccessModal(false)}
          >
            OK
          </button>
        </div>
      </Modal>
    </div>
  );
} 