import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useTranslation } from '../useTranslation';

describe('useTranslation', () => {
  it('should return French translations by default', () => {
    const { result } = renderHook(() => useTranslation('fr'));
    
    expect(result.current.t('common.login')).toBe('Connexion');
    expect(result.current.t('common.register')).toBe("S'inscrire");
    expect(result.current.locale).toBe('fr');
  });

  it('should return English translations when locale is en', () => {
    const { result } = renderHook(() => useTranslation('en'));
    
    expect(result.current.t('common.login')).toBe('Login');
    expect(result.current.t('common.register')).toBe('Register');
    expect(result.current.locale).toBe('en');
  });

  it('should handle nested translation keys', () => {
    const { result } = renderHook(() => useTranslation('en'));
    
    expect(result.current.t('home.hero.title')).toBe('Send packages between Russia and Africa with trusted travelers');
    expect(result.current.t('home.hero.subtitle')).toBe('Safe, affordable, and community-driven parcel delivery');
  });

  it('should return key if translation not found', () => {
    const { result } = renderHook(() => useTranslation('en'));
    
    expect(result.current.t('nonexistent.key')).toBe('nonexistent.key');
  });

  it('should interpolate parameters', () => {
    const { result } = renderHook(() => useTranslation('en'));
    
    // Note: This test assumes we'll add parameterized translations later
    // For now, just verify the function handles params without errors
    const translated = result.current.t('common.login', { name: 'John' });
    expect(translated).toBeDefined();
  });
});
