'use client';

import * as React from 'react';
import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { cn } from "@/lib/utils";
import { supabase } from '@/lib/supabase';
import { useI18n } from '@/hooks/use-i18n';
import { 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff,
  Loader2,
  Globe,
} from 'lucide-react';
import { GoogleLoginButton } from '@/components/auth/google-login-button';

// Types
type AuthMode = 'login' | 'signup' | 'reset';

interface AuthFormMinimalProps {
  /**
   * Callback triggered when authentication is successful
   */
  onSuccess?: (userData: { email: string; name?: string }) => void;
  /**
   * Callback triggered when the form should close
   */
  onClose?: () => void;
  /**
   * Initial authentication mode
   * @default 'login'
   */
  initialMode?: AuthMode;
  /**
   * Additional CSS classes
   */
  className?: string;
}

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  agreeToTerms: boolean;
  rememberMe: boolean;
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  phone?: string;
  agreeToTerms?: string;
  general?: string;
}

/**
 * AuthFormMinimal - A minimal and beautiful authentication form component
 * 
 * Clean, modern authentication interface with login and signup flows.
 */
export function AuthFormMinimal({
  onSuccess,
  onClose,
  initialMode = 'login',
  className,
}: AuthFormMinimalProps) {
  // Hooks
  const { t, locale, changeLocale } = useI18n();
  
  // State
  const [authMode, setAuthMode] = useState<AuthMode>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    agreeToTerms: false,
    rememberMe: false,
  });
  const [errors, setErrors] = useState<FormErrors>({});

  // Load saved email on mount
  React.useEffect(() => {
    const savedEmail = localStorage.getItem('userEmail');
    const rememberMe = localStorage.getItem('rememberMe') === 'true';
    if (savedEmail && authMode === 'login') {
      setFormData(prev => ({ ...prev, email: savedEmail, rememberMe }));
    }
  }, [authMode]);

  // Field validation
  const validateField = useCallback((field: keyof FormData, value: string | boolean) => {
    let error = '';
    
    switch (field) {
      case 'name':
        if (typeof value === 'string' && authMode === 'signup' && !value.trim()) {
          error = 'Name is required';
        }
        break;
        
      case 'email':
        if (!value || (typeof value === 'string' && !value.trim())) {
          error = 'Email is required';
        } else if (typeof value === 'string' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = 'Please enter a valid email address';
        }
        break;
        
      case 'password':
        if (!value) {
          error = 'Password is required';
        } else if (typeof value === 'string' && value.length < 8) {
          error = 'Password must be at least 8 characters';
        }
        break;
        
      case 'confirmPassword':
        if (authMode === 'signup' && value !== formData.password) {
          error = 'Passwords do not match';
        }
        break;
        
      case 'phone':
        if (typeof value === 'string' && value && !/^\+?[\d\s\-()]+$/.test(value)) {
          error = 'Please enter a valid phone number';
        }
        break;
        
      case 'agreeToTerms':
        if (authMode === 'signup' && !value) {
          error = 'You must agree to the terms and conditions';
        }
        break;
    }
    
    return error;
  }, [formData.password, authMode]);

  // Handle input changes
  const handleInputChange = useCallback((field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  }, []);

  // Validate form
  const validateForm = useCallback(() => {
    const newErrors: FormErrors = {};
    const fieldsToValidate: (keyof FormErrors)[] = ['email', 'password'];
    
    if (authMode === 'signup') {
      fieldsToValidate.push('name', 'confirmPassword', 'agreeToTerms');
    }

    fieldsToValidate.forEach(field => {
      const value = formData[field as keyof FormData];
      const error = validateField(field as keyof FormData, value);
      if (error) newErrors[field] = error;
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [authMode, formData, validateField]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsLoading(true);
    setErrors({});
    
    try {
      if (authMode === 'login') {
        // Login with Supabase
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) {
          setErrors({ general: error.message });
          return;
        }

        if (!data.session) {
          setErrors({ general: 'Não foi possível iniciar a sessão. Tente novamente.' });
          return;
        }

        // Save email if remember me is checked
        if (formData.rememberMe) {
          localStorage.setItem('userEmail', formData.email);
          localStorage.setItem('rememberMe', 'true');
        } else {
          localStorage.removeItem('userEmail');
          localStorage.removeItem('rememberMe');
        }

        onSuccess?.({ email: formData.email });

      } else if (authMode === 'signup') {
        // Sign up with Supabase
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              name: formData.name,
            },
          },
        });

        if (error) {
          // Mensagens de erro mais amigáveis
          let errorMessage = error.message
          if (error.message.includes('already registered')) {
            errorMessage = 'Este email já está cadastrado. Faça login ou recupere sua senha.'
          } else if (error.message.includes('Invalid email')) {
            errorMessage = 'Email inválido. Verifique e tente novamente.'
          } else if (error.message.includes('Password')) {
            errorMessage = 'A senha deve ter pelo menos 6 caracteres.'
          } else if (error.status === 500) {
            errorMessage = 'Erro no servidor. Por favor, contate o suporte ou tente novamente mais tarde.'
          }
          
          setErrors({ general: errorMessage });
          return;
        }

        if (data.user && !data.session) {
          // Email confirmation required
          setErrors({ 
            general: 'Conta criada! Verifique seu email para confirmar o cadastro.' 
          });
          return;
        }

        onSuccess?.({ email: formData.email, name: formData.name });

      } else if (authMode === 'reset') {
        // Reset password with Supabase
        const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
          redirectTo: `${window.location.origin}/auth/reset`,
        });

        if (error) {
          setErrors({ general: error.message });
          return;
        }

        setErrors({ 
          general: 'Email de recuperação enviado! Verifique sua caixa de entrada.' 
        });
        
        setTimeout(() => setAuthMode('login'), 3000);
      }
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao autenticar. Tente novamente.';
      setErrors({ general: message });
    } finally {
      setIsLoading(false);
    }
  };

  // Reset password form
  if (authMode === 'reset') {
    return (
      <div className={cn("w-full max-w-sm mx-auto p-4 sm:p-5", className)}>
        <div className="text-center mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex-1" />
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-serif font-bold text-foreground">
                Revenify.co
              </h1>
            </div>
            <div className="flex-1 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  const nextLocale = locale === 'pt-BR' ? 'en' : locale === 'en' ? 'es' : 'pt-BR';
                  changeLocale(nextLocale);
                }}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                title="Change language"
              >
                <Globe className="h-3.5 w-3.5" />
                <span className="uppercase font-medium">
                  {locale === 'pt-BR' ? 'PT' : locale === 'en' ? 'EN' : 'ES'}
                </span>
              </button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mb-0.5">
            {t('auth.resetPassword')}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {t('auth.resetInstructions')}
          </p>
        </div>

        {/* Error/Success Message */}
        {errors.general && (
          <div className={cn(
            "mb-3 p-2 rounded-lg text-xs",
            errors.general.includes('sucesso') || errors.general.includes('enviado') || errors.general.includes('criada')
              ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800"
              : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800"
          )}>
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="email"
              placeholder={t('auth.email')}
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary text-primary-foreground font-medium py-2.5 px-4 rounded-lg text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : t('auth.sendResetEmail')}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setAuthMode('login')}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {t('auth.backToLogin')}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className={cn("w-full max-w-sm mx-auto p-4 sm:p-5", className)}>
      {/* Header */}
      <div className="text-center mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <img src="/pwa-512x512.png" alt="ISACAR" className="h-8 w-8" />
            <h1 className="text-2xl font-serif font-bold text-foreground">
              Isacar.dev
            </h1>
          </div>
          <div className="flex-1 flex justify-end">
            <button
              type="button"
              onClick={() => {
                const nextLocale = locale === 'pt-BR' ? 'en' : locale === 'en' ? 'es' : 'pt-BR';
                changeLocale(nextLocale);
              }}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              title="Change language"
            >
              <Globe className="h-3.5 w-3.5" />
              <span className="uppercase font-medium">
                {locale === 'pt-BR' ? 'PT' : locale === 'en' ? 'EN' : 'ES'}
              </span>
            </button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {authMode === 'login' ? 'Sign in to your account' : 'Create a new account'}
        </p>
      </div>

      {/* Error/Success Message */}
      {errors.general && (
        <div className={cn(
          "mb-3 p-2 rounded-lg text-xs",
          errors.general.includes('sucesso') || errors.general.includes('enviado') || errors.general.includes('criada')
            ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800"
            : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800"
        )}>
          {errors.general}
        </div>
      )}

      {/* Mode Toggle Tabs */}
      <div className="flex bg-muted rounded-xl p-1 mb-4">
        <button
          onClick={() => setAuthMode('login')}
          className={cn(
            "flex-1 py-2 px-4 rounded-lg text-xs font-medium transition-all",
            authMode === 'login'
              ? "bg-background text-foreground shadow-sm" 
              : "text-muted-foreground hover:text-foreground"
          )}
          type="button"
        >
          {t('auth.login')}
        </button>
        <button
          onClick={() => setAuthMode('signup')}
          className={cn(
            "flex-1 py-2 px-4 rounded-lg text-xs font-medium transition-all",
            authMode === 'signup'
              ? "bg-background text-foreground shadow-sm" 
              : "text-muted-foreground hover:text-foreground"
          )}
          type="button"
        >
          {t('auth.register')}
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Name field - only for signup */}
        {authMode === 'signup' && (
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={t('auth.fullName')}
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
            />
            {errors.name && (
              <p className="text-red-500 text-[10px] mt-0.5">{errors.name}</p>
            )}
          </div>
        )}

        {/* Email field */}
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="email"
            placeholder={t('auth.email')}
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
          />
          {errors.email && (
            <p className="text-red-500 text-[10px] mt-0.5">{errors.email}</p>
          )}
        </div>

        {/* Password field */}
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type={showPassword ? "text" : "password"}
            placeholder={t('auth.password')}
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            className="w-full pl-9 pr-10 py-2 text-sm bg-background border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
          {errors.password && (
            <p className="text-red-500 text-[10px] mt-0.5">{errors.password}</p>
          )}
        </div>

        {/* Confirm Password - only for signup */}
        {authMode === 'signup' && (
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder={t('auth.confirmPassword')}
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              className="w-full pl-9 pr-10 py-2 text-sm bg-background border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
            {errors.confirmPassword && (
              <p className="text-red-500 text-[10px] mt-0.5">{errors.confirmPassword}</p>
            )}
          </div>
        )}

        {/* Remember me / Forgot password - Login */}
        {authMode === 'login' && (
          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.rememberMe}
                onChange={(e) => handleInputChange('rememberMe', e.target.checked)}
                className="w-3.5 h-3.5 rounded border-input text-primary focus:ring-ring"
              />
              <span className="text-muted-foreground">{t('auth.rememberMe')}</span>
            </label>
            <button
              type="button"
              onClick={() => setAuthMode('reset')}
              className="text-primary hover:underline"
            >
              {t('auth.forgotPassword')}
            </button>
          </div>
        )}

        {/* Terms and conditions - Signup */}
        {authMode === 'signup' && (
          <label className="flex items-start gap-2 cursor-pointer text-xs">
            <input
              type="checkbox"
              checked={formData.agreeToTerms}
              onChange={(e) => handleInputChange('agreeToTerms', e.target.checked)}
              className="w-3.5 h-3.5 mt-0.5 rounded border-input text-primary focus:ring-ring"
            />
            <span className="text-muted-foreground">
              {t('auth.agreeToThe')}{' '}
              <Link to="/terms-of-service" className="text-primary hover:underline" target="_blank">
                {t('auth.termsOfService')}
              </Link>{' '}
              {t('auth.and')}{' '}
              <Link to="/privacy-policy" className="text-primary hover:underline" target="_blank">
                {t('auth.privacyPolicy')}
              </Link>
            </span>
          </label>
        )}

        {errors.agreeToTerms && (
          <p className="text-red-500 text-[10px]">{errors.agreeToTerms}</p>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-primary text-primary-foreground font-medium py-2.5 px-4 rounded-lg text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin mx-auto" />
          ) : (
            authMode === 'login' ? t('auth.login') : t('auth.register')
          )}
        </button>
      </form>

      {/* Divisor */}
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border"></div>
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-card px-2 text-muted-foreground">
            Ou continue com
          </span>
        </div>
      </div>

      {/* Google Login Button */}
      <GoogleLoginButton />

      {/* Toggle link */}
      <div className="text-center mt-4">
        <p className="text-xs text-muted-foreground">
          {authMode === 'login' ? t('auth.noAccount') + ' ' : t('auth.alreadyHaveAccount') + ' '}
          <button
            type="button"
            onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
            className="text-primary font-medium hover:underline"
          >
            {authMode === 'login' ? t('auth.register') : t('auth.login')}
          </button>
        </p>
      </div>
    </div>
  );
}
