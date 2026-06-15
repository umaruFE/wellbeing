import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

export function LanguageSwitcher({ className = '', dropdownClassName = '' }) {
  const { i18n, t } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  const current = i18n.language?.startsWith('en') ? 'en' : 'zh';

  return (
    <div className={`relative group ${className}`}>
      <button
        type="button"
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm hover:bg-black/5 transition-colors"
        title={t('common.language')}
      >
        <Globe size={15} />
        <span className="hidden sm:inline">{current === 'zh' ? '中文' : 'English'}</span>
      </button>
      <div className={`absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50 min-w-[120px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all ${dropdownClassName}`}>
        <button
          type="button"
          onClick={() => changeLanguage('zh')}
          className={`w-full px-3 py-2 text-left text-[13px] hover:bg-gray-50 transition-colors ${current === 'zh' ? 'text-blue-600 font-bold' : 'text-gray-700'}`}
        >
          中文
        </button>
        <button
          type="button"
          onClick={() => changeLanguage('en')}
          className={`w-full px-3 py-2 text-left text-[13px] hover:bg-gray-50 transition-colors ${current === 'en' ? 'text-blue-600 font-bold' : 'text-gray-700'}`}
        >
          English
        </button>
      </div>
    </div>
  );
}

export default LanguageSwitcher;
