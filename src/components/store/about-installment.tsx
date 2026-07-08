/**
 * GhestShop — SEO / informational content section (matches live site copy blocks).
 */

import type { ReactNode } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { glassClass } from '@/lib/glass';
import { cn } from '@/lib/utils';

const HIGHLIGHTS = [
  'اعتبارسنجی سریع و شفاف',
  'اقساط پایین و بازپرداخت راحت',
  'تحویل در شیراز و جهرم',
  'مشخصات فنی کامل هر گوشی',
] as const;

export interface AboutInstallmentProps {
  className?: string;
}

export function AboutInstallment({ className }: AboutInstallmentProps): ReactNode {
  return (
    <section
      id="installment-rules"
      dir="rtl"
      aria-labelledby="about-installment-heading"
      className={cn('grid grid-cols-1 gap-6 lg:grid-cols-2', className)}
    >
      <article className={cn(glassClass('card', 'flex flex-col gap-4 rounded-3xl p-6 sm:p-8'))}>
        <h2 id="about-installment-heading" className="text-xl font-bold text-foreground">
          با قسط شاپ گوشی موبایل اقساطی بخرید
        </h2>
        <p className="text-body leading-relaxed text-foreground/75">
          با در نظر گرفتن قیمت بالای گوشی‌ها، خرید اقساطی یکی از بهترین گزینه‌هاست. در قسط شاپ با
          اقساط پایین و راحتی خرید، می‌توانید خیلی سریع موبایل مورد نظر خود را تهیه کنید. گوشی‌های
          موجود در فروشگاه از سه برند برتر اپل، سامسونگ و شیائومی عرضه می‌شوند.
        </p>
        <ul className="flex flex-col gap-2.5">
          {HIGHLIGHTS.map((item) => (
            <li key={item} className="flex items-center gap-2.5 text-body text-foreground/85">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" aria-hidden />
              {item}
            </li>
          ))}
        </ul>
      </article>

      <article className={cn(glassClass('card', 'flex flex-col gap-4 rounded-3xl p-6 sm:p-8'))}>
        <h2 className="text-xl font-bold text-foreground">
          درباره فروش اقساطی موبایل در قسط شاپ
        </h2>
        <p className="text-body leading-relaxed text-foreground/75">
          فروشگاه اینترنتی قسط شاپ با هدف ایجاد زیرساختی آسان و سریع برای خرید اقساطی کالای دیجیتال،
          به‌ویژه گوشی موبایل در شهرهای شیراز و جهرم راه‌اندازی شده است. این سامانه دارای مجوز از
          مرکز توسعه تجارت الکترونیک و اتحادیه فروشندگان موبایل است.
        </p>
        <p className="text-body leading-relaxed text-foreground/75">
          در طول چهار سال فعالیت، بیش از ۱۷ هزار مشتری از قسط شاپ خرید کرده‌اند. لطفاً پیش از ثبت
          درخواست، شرایط ضمانت، مدارک مورد نیاز و قوانین خرید اقساطی را مطالعه کنید.
        </p>
        <p className="rounded-xl border border-border bg-muted/60 px-4 py-3 text-body leading-relaxed text-foreground/80">
          <strong className="font-bold text-foreground">توجه:</strong> فعلاً فروش گوشی فقط برای
          ساکنین شیراز و جهرم امکان‌پذیر است.
        </p>
      </article>
    </section>
  );
}

export default AboutInstallment;
