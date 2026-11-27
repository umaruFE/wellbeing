import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
  const { state } = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    const fields = new FormData(e.currentTarget);
    const username = String(fields.get('username') ?? '').trim();
    const password = String(fields.get('password') ?? '');
    setError('');
    setLoading(true);

    try {
      const user = await login(username, password);
      const destination = state?.returnTo;
      const localPath = typeof destination === 'string' && /^\/(?!\/)/.test(destination) && !destination.includes('\\');
      navigate(localPath ? destination : getDefaultRouteForRole(user.role), { replace: true });
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
        <div className="wb-surface-panel shadow-[var(--wb-shadow-hover)]">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="bg-[var(--wb-primary)] p-3 rounded-[10px] mb-4 shadow-[0_6px_24px_rgba(48,43,59,0.06)]">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-[length:var(--wb-title-size)] font-bold text-[var(--wb-text)] mb-2">{t('common.appName')}</h1>
            <p className="text-sm text-[var(--wb-muted)]">{t('login.welcome')}</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4" aria-busy={loading}>
            {error && (
              <div role="alert" className="bg-error-light border border-error-border rounded-sm p-3 flex items-center gap-2 text-error-active text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
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
                data-wb-field
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
                data-wb-field
                placeholder={t('login.passwordPlaceholder')}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              data-wb-button="primary"
              className="w-full"
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
