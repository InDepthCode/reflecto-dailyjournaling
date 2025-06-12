import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

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

  const validatePassword = (password: string) => {
    const minLength = 6;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const errors = [];
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-gray-100">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Password must contain:
          </p>
          <ul className="mt-1 list-disc list-inside text-center text-sm text-gray-600 dark:text-gray-400">
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
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border 
                  border-gray-300 dark:border-gray-700 placeholder-gray-500 dark:placeholder-gray-400 
                  text-gray-900 dark:text-gray-100 rounded-t-md 
                  bg-white dark:bg-gray-800
                  focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border 
                  border-gray-300 dark:border-gray-700 placeholder-gray-500 dark:placeholder-gray-400 
                  text-gray-900 dark:text-gray-100
                  bg-white dark:bg-gray-800
                  focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Password"
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="sr-only">
                Confirm Password
              </label>
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border 
                  border-gray-300 dark:border-gray-700 placeholder-gray-500 dark:placeholder-gray-400 
                  text-gray-900 dark:text-gray-100 rounded-b-md 
                  bg-white dark:bg-gray-800
                  focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Confirm Password"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onToggle}
              className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500"
            >
              Already have an account? Sign in
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-500"
            >
              Continue as guest
            </button>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading || cooldownTime > 0}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent 
                text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating account...' : 
               cooldownTime > 0 ? `Try again in ${Math.floor(cooldownTime / 60)}:${(cooldownTime % 60).toString().padStart(2, '0')}` : 
               'Sign up'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 