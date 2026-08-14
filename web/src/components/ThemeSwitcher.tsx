'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useTheme } from '@/lib/theme-context';
import type { ThemeMode } from '@/lib/theme-storage';
import { MenuDropdown } from './MenuDropdown';

export function ThemeSwitcher() {
  const t = useTranslations('prefs');
  const { theme, setTheme } = useTheme();

  const options: { value: ThemeMode; label: string; icon: React.ReactNode }[] = [
    { value: 'light', label: t('themeLight'), icon: <Sun size={16} aria-hidden="true" /> },
    { value: 'dark', label: t('themeDark'), icon: <Moon size={16} aria-hidden="true" /> },
    { value: 'system', label: t('themeSystem'), icon: <Monitor size={16} aria-hidden="true" /> },
  ];

  const triggerIcon =
    theme === 'dark' ? (
      <Moon size={16} aria-hidden="true" />
    ) : theme === 'light' ? (
      <Sun size={16} aria-hidden="true" />
    ) : (
      <Monitor size={16} aria-hidden="true" />
    );

  return (
    <MenuDropdown
      label={t('theme')}
      value={theme}
      icon={triggerIcon}
      options={options}
      onChange={setTheme}
    />
  );
}
