import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { getDefaultRouteForRole } from './authRoutes';
import { Sparkles, LogIn, AlertCircle } from 'lucide-react';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';

export const LoginPage = () => {
  const { t } = useTranslation();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fields = new FormData(e.currentTarget);
    const username = String(fields.get('username') ?? '').trim();
    const password = String(fields.get('password') ?? '');
    setError('');
    setLoading(true);

    try {
      const user = await login(username, password);
      navigate(getDefaultRouteForRole(user.role), { replace: true });
    } catch (err) {
      setError(err.message || t('login.loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--wb-page)] p-6 text-sm">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-md">
        <div className="bg-white rounded-[14px] shadow-[0_8px_32px_rgba(48,43,59,0.06)] p-8 border border-[var(--wb-border)]">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="bg-[var(--wb-primary)] p-3 rounded-[10px] mb-4 shadow-[0_6px_24px_rgba(48,43,59,0.06)]">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-[28px] font-bold text-[var(--wb-text)] mb-2">{t('common.appName')}</h1>
            <p className="text-sm text-[var(--wb-muted)]">{t('login.welcome')}</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-[10px] p-3 flex items-center gap-2 text-red-700 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="login-username" className="block text-sm font-medium text-[var(--wb-text)] mb-2">
                {t('login.username')}
              </label>
              <input
                id="login-username"
                name="username"
                type="text"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                className="w-full px-4 py-2.5 border border-[var(--wb-border)] rounded-[10px] focus:ring-2 focus:ring-[var(--wb-selected-border)] focus:border-[var(--wb-selected-border)] outline-none transition-all min-h-11"
                placeholder={t('login.usernamePlaceholder')}
                required
              />
            </div>

            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-[var(--wb-text)] mb-2">
                {t('login.password')}
              </label>
              <input
                id="login-password"
                name="password"
                type="password"
                autoComplete="current-password"
                className="w-full px-4 py-2.5 border border-[var(--wb-border)] rounded-[10px] focus:ring-2 focus:ring-[var(--wb-selected-border)] focus:border-[var(--wb-selected-border)] outline-none transition-all min-h-11"
                placeholder={t('login.passwordPlaceholder')}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--wb-primary)] hover:bg-[var(--wb-primary-hover)] text-white font-medium py-2 rounded-[10px] flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm min-h-10 active:bg-[var(--wb-primary-active)]"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin" />
                  {t('login.loggingIn')}
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  {t('login.loginButton')}
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
