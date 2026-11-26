import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShieldX, Home } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getDefaultRouteForRole } from './authRoutes';

export const UnauthorizedPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--wb-page)] p-6 text-sm">
      <div className="text-center">
        <div className="bg-error-light p-6 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
          <ShieldX className="w-12 h-12 text-error" />
        </div>
        <h1 className="text-[28px] font-bold text-[var(--wb-text)] mb-2">{t('unauthorized.title')}</h1>
        <p className="text-[var(--wb-muted)] mb-8">{t('unauthorized.description')}</p>
        <button
          type="button"
          onClick={() => navigate(getDefaultRouteForRole(user?.role), { replace: true })}
          data-wb-button="primary"
        >
          <Home className="w-4 h-4" />
          {t('unauthorized.home')}
        </button>
      </div>
    </div>
  );
};


