import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { CreditWizard as CreditVerificationWizard } from '@/components/fintech/credit-wizard';

export const metadata: Metadata = {
  title: 'اعتبارسنجی و خرید اقساطی',
  description: 'سامانه اعتبارسنجی هوشمند — ثبت اطلاعات، بارگذاری مدارک و بررسی آنی اعتبار.',
};

export default function ApplyPage(): ReactNode {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-12">
      <header className="mb-8 text-center">
        <h1 className="text-2xl font-black text-foreground sm:text-3xl">سامانه اعتبارسنجی هوشمند</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-foreground/60">
          در سه گام ساده، اعتبار خرید اقساطی خود را بسنجید و مدارک را بارگذاری کنید.
        </p>
      </header>

      <CreditVerificationWizard />
    </main>
  );
}
