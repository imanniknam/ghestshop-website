'use client';

/**
 * GhestShop — Live Conversational Shopping Consultant
 * ------------------------------------------------------------------
 * A real chat: the user types free-text goals and the assistant parses budget,
 * use-case, and ecosystem (`parseAdvisorQuery`), then replies with a contextual
 * line plus interactive product recommendation cards linked to the item sheets.
 * Quick-reply chips offer shortcuts. The transcript lives in a scrolling
 * glassInset window that auto-scrolls to the newest message. Strict RTL.
 */

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, Bot, Send, User } from 'lucide-react';
import {
  buildAdvisorReply,
  parseAdvisorQuery,
  recommendDevices,
  type AdvisorPrefs,
  type Recommendation,
  type StoreDevice,
} from '@/lib/store/ai';
import { EASE_EXPO } from '@/lib/motion';
import { glassClass, glassInset } from '@/lib/glass';
import { formatToman, toPersianDigits } from '@/lib/format';
import { cn } from '@/lib/utils';

interface ChatMessage {
  readonly id: number;
  readonly role: 'assistant' | 'user';
  readonly text: string;
  readonly recommendations?: Recommendation[];
}

const INITIAL_PREFS: AdvisorPrefs = { budget: 40_000_000, useCase: 'business', ecosystem: 'any' };

const QUICK_REPLIES = [
  'بودجه ۳۰ میلیون',
  'گوشی برای بازی',
  'عکاسی حرفه‌ای',
  'کار اداری',
  'آیفون می‌خواهم',
] as const;

const INTRO: ChatMessage = {
  id: 0,
  role: 'assistant',
  text: 'سلام! من مشاور خرید هوشمند قسط‌شاپ هستم. کافی است بودجه و نوع استفاده‌تان را بنویسید — مثلاً «بودجه ۳۵ میلیون برای بازی» — تا بهترین گوشی‌ها را با شرایط اقساطی پیشنهاد بدهم.',
};

export interface AiAdvisorChatProps {
  devices: StoreDevice[];
  className?: string;
}

export function AiAdvisorChat({ devices, className }: AiAdvisorChatProps): ReactNode {
  const reduceMotion = Boolean(useReducedMotion());
  const [messages, setMessages] = useState<ChatMessage[]>([INTRO]);
  const [prefs, setPrefs] = useState<AdvisorPrefs>(INITIAL_PREFS);
  const [input, setInput] = useState('');
  const idRef = useRef(1);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Keep the latest message in view.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const send = (raw: string): void => {
    const text = raw.trim();
    if (!text) return;

    const userMsg: ChatMessage = { id: idRef.current++, role: 'user', text };
    const nextPrefs = parseAdvisorQuery(text, prefs);
    const recommendations = recommendDevices(devices, nextPrefs);
    const assistantMsg: ChatMessage = {
      id: idRef.current++,
      role: 'assistant',
      text: buildAdvisorReply(nextPrefs, recommendations),
      recommendations,
    };

    setPrefs(nextPrefs);
    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput('');
  };

  const onSubmit = (e: FormEvent): void => {
    e.preventDefault();
    send(input);
  };

  return (
    <section dir="rtl" className={cn('flex flex-col gap-4', className)}>
      <header className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F59E0B]/15 text-gold">
          <Bot className="h-5 w-5" aria-hidden />
        </span>
        <h2 className="text-lg font-black tracking-tight text-foreground">گفت‌وگوی زنده با مشاور هوشمند</h2>
      </header>

      <div className={cn(glassClass('hero', 'flex flex-col gap-3 rounded-3xl p-4 sm:p-5'))}>
        {/* Transcript */}
        <div
          ref={scrollRef}
          className="flex max-h-[26rem] flex-col gap-3 overflow-y-auto pr-1 [scrollbar-width:thin]"
          aria-live="polite"
        >
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: EASE_EXPO }}
              >
                {msg.role === 'assistant' ? (
                  <div className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#F59E0B] to-[#7C3AED] text-white">
                      <Bot className="h-4 w-4" aria-hidden />
                    </span>
                    <div className="flex max-w-[88%] flex-col gap-3">
                      <div className={cn('rounded-2xl rounded-tr-sm px-4 py-3 text-sm leading-relaxed text-foreground', glassInset)}>
                        {msg.text}
                      </div>
                      {msg.recommendations && msg.recommendations.length > 0 && (
                        <div className="flex flex-col gap-2">
                          {msg.recommendations.map((rec) => (
                            <RecommendationCard key={rec.device.id} rec={rec} />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-end gap-2.5">
                    <div className="max-w-[88%] rounded-2xl rounded-tl-sm bg-[#F59E0B] px-4 py-2.5 text-sm font-bold text-[#1C1917]">
                      {msg.text}
                    </div>
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-foreground/10 text-foreground/70">
                      <User className="h-4 w-4" aria-hidden />
                    </span>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Quick replies */}
        <div className="flex flex-wrap gap-2">
          {QUICK_REPLIES.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => send(q)}
              className="cursor-pointer rounded-xl border border-foreground/15 bg-foreground/[0.04] px-3 py-1.5 text-xs font-medium text-foreground/80 transition-colors hover:border-[#F59E0B]/50 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B]"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Composer */}
        <form onSubmit={onSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="نیاز خود را بنویسید… مثلاً: بودجه ۲۵ میلیون برای عکاسی"
            aria-label="پیام به مشاور"
            className={cn(
              'h-11 flex-1 rounded-xl border border-foreground/15 bg-foreground/[0.04] px-4 text-sm text-foreground',
              'placeholder:text-foreground/40 transition-colors focus-within:border-[#F59E0B]/50',
              'focus-visible:outline-none focus-visible:border-[#F59E0B]/50',
            )}
          />
          <button
            type="submit"
            disabled={input.trim().length === 0}
            aria-label="ارسال"
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F59E0B] text-[#1C1917]',
              'shadow-lg shadow-[#F59E0B]/25 transition-[filter] hover:brightness-110',
              'disabled:cursor-not-allowed disabled:opacity-40',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B]',
            )}
          >
            <Send className="h-4 w-4" aria-hidden />
          </button>
        </form>
      </div>
    </section>
  );
}

function RecommendationCard({ rec }: { rec: Recommendation }): ReactNode {
  return (
    <Link
      href={`/product/${rec.device.id}`}
      className={cn(
        'group flex items-center gap-3 rounded-2xl p-3 transition-colors hover:bg-foreground/5',
        glassInset,
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B]',
      )}
    >
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-foreground/5">
        {rec.device.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={rec.device.image} alt={rec.device.name} className="h-full w-full object-cover" />
        ) : null}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-bold text-foreground">{rec.device.name}</p>
          <span className="shrink-0 rounded-full bg-[#F59E0B]/15 px-2 py-0.5 text-[10px] font-black text-gold">
            ٪{toPersianDigits(rec.matchPercent)} تطابق
          </span>
        </div>
        <p className="line-clamp-2 text-[11px] leading-relaxed text-foreground/60">{rec.reason}</p>
        <span className="inline-flex items-center gap-1 text-xs font-black text-gold">
          اقساط از {formatToman(rec.device.monthlyFrom, { withSuffix: false })} تومان / ماه
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" aria-hidden />
        </span>
      </div>
    </Link>
  );
}

export default AiAdvisorChat;
