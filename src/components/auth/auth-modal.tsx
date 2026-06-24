'use client';

/**
 * GhestShop — Liquid Glass Authentication Gateway
 * ------------------------------------------------------------------
 * Unified login/registration on the `glassHero` token. A high-inertia slide
 * container toggles between «ورود کاربر» (phone → OTP, with national-id) and
 * «دسترسی مدیریت» (phone + password). Validates phone, national code, password
 * and OTP. On success it sets the client auth store and routes to the correct
 * dashboard. Strict RTL, reduced-motion aware.
 */

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, KeyRound, Lock, Phone, ShieldCheck, Sparkles, UserRound, X } from 'lucide-react';
import { dashboardHref, useAuthStore } from '@/stores/auth-store';
import {
  toAsciiDigits,
  validateCode,
  validateNationalId,
  validatePassword,
  validatePhone,
} from '@/lib/auth-validation';
import { SPRING } from '@/lib/motion';
import { glassClass } from '@/lib/glass';
import { toPersianDigits } from '@/lib/format';
import { cn } from '@/lib/utils';

type Mode = 'user' | 'admin';
type Step = 'credentials' | 'otp';

export function AuthModal(): ReactNode {
  const reduceMotion = Boolean(useReducedMotion());
  const router = useRouter();
  const isOpen = useAuthStore((s) => s.modalOpen);
  const closeModal = useAuthStore((s) => s.closeModal);
  const login = useAuthStore((s) => s.login);

  const [mode, setMode] = useState<Mode>('user');
  const [step, setStep] = useState<Step>('credentials');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Reset on close.
  useEffect(() => {
    if (!isOpen) {
      setMode('user');
      setStep('credentials');
      setName('');
      setPhone('');
      setNationalId('');
      setPassword('');
      setCode('');
      setError(null);
    }
  }, [isOpen]);

  // Esc to close.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, closeModal]);

  const switchMode = (m: Mode): void => {
    setMode(m);
    setStep('credentials');
    setError(null);
  };

  const requestOtp = (): void => {
    const e = validatePhone(phone) ?? (name.trim().length < 2 ? 'نام و نام خانوادگی را وارد کنید.' : null) ?? validateNationalId(nationalId);
    if (e) {
      setError(e);
      return;
    }
    setError(null);
    setStep('otp');
  };

  const finishUser = (): void => {
    const e = validateCode(code);
    if (e) {
      setError(e);
      return;
    }
    login({ name: name.trim(), role: 'buyer', phone: toAsciiDigits(phone) });
    router.push(dashboardHref('buyer'));
  };

  const finishAdmin = (): void => {
    const e = validatePhone(phone) ?? validatePassword(password);
    if (e) {
      setError(e);
      return;
    }
    login({ name: 'مدیر سیستم', role: 'admin', phone: toAsciiDigits(phone) });
    router.push(dashboardHref('admin'));
  };

  const slide = (dir: number) =>
    reduceMotion
      ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
      : {
          initial: { opacity: 0, x: dir * 40 },
          animate: { opacity: 1, x: 0 },
          exit: { opacity: 0, x: dir * -40 },
          transition: SPRING,
        };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            aria-label="بستن"
            onClick={closeModal}
            className="absolute inset-0 cursor-default bg-black/55 backdrop-blur-sm"
          />

          <motion.div
            dir="rtl"
            role="dialog"
            aria-modal="true"
            aria-label="ورود و ثبت‌نام"
            initial={reduceMotion ? false : { scale: 0.94, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { scale: 0.96, opacity: 0, y: 16 }}
            transition={SPRING}
            className={cn(glassClass('hero', 'relative z-10 w-[min(26rem,94vw)] overflow-hidden rounded-3xl p-6 sm:p-8'))}
          >
            <button
              type="button"
              onClick={closeModal}
              aria-label="بستن"
              className="absolute left-4 top-4 cursor-pointer rounded-lg p-2 text-foreground/50 transition-colors hover:bg-foreground/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B]"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>

            <header className="mb-5 flex flex-col items-center gap-2 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#F59E0B] to-[#7C3AED] text-white">
                <Sparkles className="h-6 w-6" aria-hidden />
              </span>
              <h2 className="text-xl font-black text-foreground">ورود به قسط‌شاپ</h2>
              <p className="text-xs text-foreground/55">برای خرید اقساطی و مدیریت حساب وارد شوید</p>
            </header>

            {/* Mode toggle */}
            <div className="mb-5 grid grid-cols-2 gap-1 rounded-2xl bg-foreground/5 p-1">
              {(['user', 'admin'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => switchMode(m)}
                  aria-pressed={mode === m}
                  className={cn(
                    'relative rounded-xl py-2.5 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B]',
                    mode === m ? 'text-[#1C1917]' : 'text-foreground/60 hover:text-foreground',
                  )}
                >
                  {mode === m && (
                    <motion.span
                      layoutId="auth-mode-pill"
                      transition={SPRING}
                      className="absolute inset-0 -z-10 rounded-xl bg-[#F59E0B] shadow-lg shadow-[#F59E0B]/25"
                    />
                  )}
                  {m === 'user' ? 'ورود کاربر' : 'دسترسی مدیریت'}
                </button>
              ))}
            </div>

            {/* Forms */}
            <AnimatePresence mode="wait" initial={false}>
              {mode === 'user' && step === 'credentials' && (
                <motion.div key="user-cred" {...slide(1)} className="flex flex-col gap-3">
                  <Field icon={UserRound} placeholder="نام و نام خانوادگی" value={name} onChange={setName} />
                  <Field icon={Phone} placeholder="شماره موبایل (۰۹...)" value={phone} onChange={setPhone} inputMode="numeric" dir="ltr" />
                  <Field icon={ShieldCheck} placeholder="کد ملی" value={nationalId} onChange={setNationalId} inputMode="numeric" dir="ltr" />
                  <Submit onClick={requestOtp}>دریافت کد تأیید</Submit>
                </motion.div>
              )}

              {mode === 'user' && step === 'otp' && (
                <motion.div key="user-otp" {...slide(1)} className="flex flex-col gap-3">
                  <p className="text-center text-xs text-foreground/60">
                    کد تأیید به شماره <span dir="ltr" className="font-bold text-foreground">{toPersianDigits(toAsciiDigits(phone))}</span> ارسال شد.
                  </p>
                  <Field icon={KeyRound} placeholder="کد ۶ رقمی" value={code} onChange={setCode} inputMode="numeric" dir="ltr" center />
                  <p className="text-center text-[10px] text-foreground/40">کد آزمایشی: ۱۲۳۴۵۶</p>
                  <Submit onClick={finishUser}>ورود به حساب</Submit>
                  <button
                    type="button"
                    onClick={() => setStep('credentials')}
                    className="inline-flex items-center justify-center gap-1 text-xs text-foreground/55 transition-colors hover:text-gold"
                  >
                    <ArrowLeft className="h-3.5 w-3.5 rotate-180" aria-hidden />
                    ویرایش شماره
                  </button>
                </motion.div>
              )}

              {mode === 'admin' && (
                <motion.div key="admin" {...slide(-1)} className="flex flex-col gap-3">
                  <Field icon={Phone} placeholder="شماره موبایل مدیر" value={phone} onChange={setPhone} inputMode="numeric" dir="ltr" />
                  <Field icon={Lock} placeholder="رمز عبور" value={password} onChange={setPassword} type="password" />
                  <Submit onClick={finishAdmin}>
                    <ShieldCheck className="h-4 w-4" aria-hidden />
                    ورود امن مدیریت
                  </Submit>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.p
                  role="alert"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 rounded-xl border border-[var(--color-destructive)]/40 bg-[var(--color-destructive)]/10 px-3 py-2 text-center text-xs font-medium text-[var(--color-destructive)]"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ---------------------------------------------------------------------------
//  Field + Submit primitives
// ---------------------------------------------------------------------------

function Field({
  icon: Icon,
  placeholder,
  value,
  onChange,
  type = 'text',
  inputMode,
  dir,
  center = false,
}: {
  icon: typeof Phone;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  inputMode?: 'numeric' | 'text';
  dir?: 'ltr' | 'rtl';
  center?: boolean;
}): ReactNode {
  return (
    <label className="flex items-center gap-2 rounded-xl border border-foreground/15 bg-foreground/[0.04] px-3 transition-colors focus-within:border-[#F59E0B]/50">
      <Icon className="h-4 w-4 shrink-0 text-foreground/45" aria-hidden />
      <input
        type={type}
        inputMode={inputMode}
        dir={dir}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'h-11 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-foreground/40',
          center && 'text-center tracking-[0.3em]',
        )}
      />
    </label>
  );
}

function Submit({ children, onClick }: { children: ReactNode; onClick: () => void }): ReactNode {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'mt-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#F59E0B] py-3 text-sm font-bold text-[#1C1917]',
        'shadow-lg shadow-[#F59E0B]/25 transition-[filter] hover:brightness-110',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
      )}
    >
      {children}
    </button>
  );
}

export default AuthModal;
