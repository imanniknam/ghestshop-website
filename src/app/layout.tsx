import type { Metadata, Viewport } from 'next';
import { Vazirmatn, IBM_Plex_Sans } from 'next/font/google';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { CartSheet } from '@/components/store/cart-sheet';
import { AuthModal } from '@/components/auth/auth-modal';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { SmoothScrollProvider } from '@/components/providers/smooth-scroll-provider';
import { cn } from '@/lib/utils';
import './globals.css';

/**
 * Pre-paint theme init — runs synchronously before the body renders so the
 * correct `.dark` class is on <html> before first paint (no flash). Honours an
 * explicit stored choice, otherwise defaults to LIGHT mode (we intentionally do
 * NOT follow the OS `prefers-color-scheme` — light is the default experience).
 */
const THEME_INIT = `(function(){try{var k='ghestshop-theme';var s=localStorage.getItem(k);var d=s==='dark';var e=document.documentElement;e.classList.toggle('dark',d);e.style.colorScheme=d?'dark':'light';}catch(e){}})();`;

/**
 * Primary Persian UI face — Vazirmatn (variable). Exposed as --font-vazir.
 * Secondary Latin/numeric face — IBM Plex Sans. Exposed as --font-plex.
 * globals.css wires body font-family to these variables.
 */
const vazirmatn = Vazirmatn({
  subsets: ['arabic', 'latin'],
  variable: '--font-vazir',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-plex',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'قسط شاپ | خرید اقساطی موبایل و کالای دیجیتال',
    template: '%s | قسط شاپ',
  },
  description:
    'خرید گوشی قسطی سامسونگ، شیائومی و اپل در شیراز و جهرم. فروش اقساطی موبایل با اعتبارسنجی هوشمند و شرایط شفاف.',
  applicationName: 'GhestShop',
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#407DC0',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>): React.ReactNode {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning className={cn(vazirmatn.variable, ibmPlexSans.variable)}>
      <body
        className={cn(
          vazirmatn.className,
          'flex min-h-dvh flex-col bg-background bg-brand-aura bg-fixed font-sans text-body text-foreground antialiased',
        )}
      >
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
        <SmoothScrollProvider>
          <Header />
          <div className="flex-1">{children}</div>
          <Footer />
        </SmoothScrollProvider>
        {/* Fixed-position chrome lives outside the scroll context */}
        <CartSheet />
        <AuthModal />
        <div className="fixed bottom-5 left-5 z-[55]">
          <ThemeToggle />
        </div>
      </body>
    </html>
  );
}
