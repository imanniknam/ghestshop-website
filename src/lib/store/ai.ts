/**
 * GhestShop — Storefront "AI" intelligence (pure, deterministic, server-safe)
 * ------------------------------------------------------------------
 * Simulated client-side advisory logic shared by the comparison matrix, the
 * shopping consultant, and the installment planner. Pure functions only — no
 * 'use client', no side effects — so both Server and Client Components can call
 * them. All generated copy is Persian and contextual.
 */

import {
  ALLOWED_MONTHS,
  DTI_CEILING,
  calculateInstallment,
  type AllowedMonth,
} from '@/lib/finance/installment-engine';
import { formatToman, formatTomanCompact, toPersianDigits } from '@/lib/format';

// ---------------------------------------------------------------------------
//  Device model
// ---------------------------------------------------------------------------

export interface PowerProfile {
  readonly cpu: number; // 0..100
  readonly battery: number;
  readonly camera: number;
  readonly display: number;
}

export type Ecosystem = 'ios' | 'android';

export interface StoreDevice {
  readonly id: string;
  readonly name: string;
  readonly image: string;
  readonly cashPrice: number;
  readonly monthlyFrom: number;
  readonly brandLabel: string;
  readonly ecosystem: Ecosystem;
  readonly power: PowerProfile;
}

const POWER: Record<string, PowerProfile> = {
  'p-ip15pm': { cpu: 96, battery: 80, camera: 92, display: 95 },
  'p-ip15': { cpu: 88, battery: 76, camera: 85, display: 90 },
  'p-s24u': { cpu: 94, battery: 90, camera: 95, display: 97 },
  'p-mi14': { cpu: 90, battery: 85, camera: 88, display: 89 },
  'p-zflip6': { cpu: 91, battery: 72, camera: 84, display: 88 },
  'p-redmi13': { cpu: 72, battery: 88, camera: 70, display: 76 },
  'p-poco-f6': { cpu: 86, battery: 86, camera: 74, display: 82 },
  'p-ip14': { cpu: 82, battery: 78, camera: 80, display: 84 },
  'p-ipad-air': { cpu: 89, battery: 84, camera: 68, display: 92 },
};
const DEFAULT_POWER: PowerProfile = { cpu: 80, battery: 80, camera: 80, display: 80 };

export function getPowerProfile(id: string): PowerProfile {
  return POWER[id] ?? DEFAULT_POWER;
}

/** Lower price ⇒ higher installment value (0..100). */
export function installmentValueScore(cashPrice: number): number {
  return Math.max(45, Math.min(98, Math.round(100 - (cashPrice / 80_000_000) * 45)));
}

// ---------------------------------------------------------------------------
//  Comparison
// ---------------------------------------------------------------------------

export interface CompareMetric {
  readonly key: string;
  readonly label: string;
  readonly current: number;
  readonly competitor: number;
}

export interface DeviceAnalysis {
  readonly metrics: CompareMetric[];
  readonly verdict: string;
  /** «چرا بله؟» — benefits of choosing the current device. */
  readonly caseFor: string[];
  /** «چرا خیر؟» — honest trade-offs of the current device. */
  readonly caseAgainst: string[];
}

export function analyzeDevices(a: StoreDevice, b: StoreDevice): DeviceAnalysis {
  const metrics: CompareMetric[] = [
    { key: 'cpu', label: 'قدرت پردازش (CPU)', current: a.power.cpu, competitor: b.power.cpu },
    { key: 'battery', label: 'طول عمر باتری', current: a.power.battery, competitor: b.power.battery },
    { key: 'camera', label: 'کیفیت دوربین', current: a.power.camera, competitor: b.power.camera },
    { key: 'display', label: 'کیفیت نمایشگر', current: a.power.display, competitor: b.power.display },
    {
      key: 'value',
      label: 'ارزش خرید اقساطی',
      current: installmentValueScore(a.cashPrice),
      competitor: installmentValueScore(b.cashPrice),
    },
  ];

  const cpuWinner = a.power.cpu >= b.power.cpu ? a : b;
  const camWinner = a.power.camera >= b.power.camera ? a : b;
  const batWinner = a.power.battery >= b.power.battery ? a : b;
  const cheaper = a.cashPrice <= b.cashPrice ? a : b;
  const valWinner = installmentValueScore(a.cashPrice) >= installmentValueScore(b.cashPrice) ? a : b;

  const verdict = [
    `بر اساس تحلیل هوشمند، در عکاسی و ضبط محتوا ${camWinner.name} برتر است و برای اجرای بازی‌های سنگین و چندوظیفگی، پردازنده‌ی ${cpuWinner.name} روان‌تر عمل می‌کند.`,
    `اگر بیشتر در سفر هستید یا مصرف باتری بالایی دارید، شارژدهی ${batWinner.name} انتخاب مطمئن‌تری است.`,
    `از نظر ارزش خرید اقساطی، ${valWinner.name} فشار کمتری بر بودجه ماهانه وارد می‌کند؛ اقساط ${cheaper.name} از ${formatToman(cheaper.monthlyFrom)} در ماه آغاز می‌شود.`,
    `جمع‌بندی: برای کاربری حرفه‌ای و عکاسی ${camWinner.name} و برای اقتصادی‌ترین انتخاب ${cheaper.name} پیشنهاد می‌شود.`,
  ].join(' ');

  // «چرا بله؟» — where the current device (a) leads over the rival (b).
  const caseFor: string[] = [];
  if (a.power.cpu >= b.power.cpu) caseFor.push('پردازنده‌ی قوی‌تر برای اجرای روان بازی‌ها و چندوظیفگی سنگین.');
  if (a.power.camera >= b.power.camera) caseFor.push('دوربین دقیق‌تر برای عکاسی حرفه‌ای و تولید محتوا.');
  if (a.power.battery >= b.power.battery) caseFor.push('باتری بادوام‌تر برای استفاده‌ی طولانی و سفر.');
  if (a.power.display >= b.power.display) caseFor.push('نمایشگر چشم‌نوازتر و باکیفیت‌تر.');
  if (a.cashPrice <= b.cashPrice)
    caseFor.push(`قیمت اقتصادی‌تر و اقساط سبک‌تر؛ شروع از ${formatToman(a.monthlyFrom)} در ماه.`);
  if (caseFor.length === 0)
    caseFor.push('کیفیت ساخت قابل‌اعتماد همراه با گارانتی رسمی و خدمات پس از فروش.');

  // «چرا خیر؟» — honest trade-offs of the current device (a).
  const caseAgainst: string[] = [];
  if (a.power.cpu < b.power.cpu) caseAgainst.push(`قدرت پردازش پایین‌تر نسبت به ${b.name} در کارهای سنگین.`);
  if (a.power.camera < b.power.camera) caseAgainst.push(`دوربین ضعیف‌تر در مقایسه با ${b.name}.`);
  if (a.power.battery < b.power.battery) caseAgainst.push('شارژدهی کمتر برای کاربران پرمصرف.');
  if (a.power.display < b.power.display) caseAgainst.push(`نمایشگر یک پله پایین‌تر از ${b.name}.`);
  if (a.cashPrice > b.cashPrice) caseAgainst.push('قیمت بالاتر؛ پیش‌پرداخت و قسط ماهانه‌ی سنگین‌تر.');
  if (caseAgainst.length === 0)
    caseAgainst.push('قیمت متناسب با امکانات بالاست؛ اگر بودجه محدود است، گزینه‌های اقتصادی‌تر را هم بسنجید.');

  return { metrics, verdict, caseFor, caseAgainst };
}

// ---------------------------------------------------------------------------
//  Shopping consultant
// ---------------------------------------------------------------------------

export type UseCase = 'gaming' | 'photography' | 'business';

export interface AdvisorPrefs {
  readonly budget: number;
  readonly useCase: UseCase;
  readonly ecosystem: Ecosystem | 'any';
}

export interface Recommendation {
  readonly device: StoreDevice;
  readonly matchPercent: number;
  readonly reason: string;
}

const USE_CASE_SCORE: Record<UseCase, (p: PowerProfile) => number> = {
  gaming: (p) => p.cpu * 0.6 + p.display * 0.3 + p.battery * 0.1,
  photography: (p) => p.camera * 0.6 + p.display * 0.25 + p.cpu * 0.15,
  business: (p) => p.battery * 0.4 + p.cpu * 0.3 + p.display * 0.3,
};

const USE_CASE_LABEL: Record<UseCase, string> = {
  gaming: 'بازی و گرافیک',
  photography: 'عکاسی و تولید محتوا',
  business: 'کار و بهره‌وری',
};

export function recommendDevices(devices: StoreDevice[], prefs: AdvisorPrefs): Recommendation[] {
  const withinBudget = devices.filter((d) => d.cashPrice <= prefs.budget * 1.05);
  const pool = withinBudget.length > 0 ? withinBudget : devices;

  const ecoPool =
    prefs.ecosystem === 'any'
      ? pool
      : pool.filter((d) => d.ecosystem === prefs.ecosystem).length > 0
        ? pool.filter((d) => d.ecosystem === prefs.ecosystem)
        : pool;

  const score = USE_CASE_SCORE[prefs.useCase];
  const ranked = [...ecoPool]
    .map((device) => ({ device, raw: score(device.power) }))
    .sort((x, y) => y.raw - x.raw)
    .slice(0, 3);

  return ranked.map(({ device, raw }) => ({
    device,
    matchPercent: Math.min(99, Math.round(raw)),
    reason: buildAdvisorReason(device, prefs),
  }));
}

function buildAdvisorReason(device: StoreDevice, prefs: AdvisorPrefs): string {
  const useLabel = USE_CASE_LABEL[prefs.useCase];
  const overBudget = device.cashPrice > prefs.budget;
  const strength =
    prefs.useCase === 'gaming'
      ? `پردازنده‌ی قدرتمند و نمایشگر روان`
      : prefs.useCase === 'photography'
        ? `دوربین حرفه‌ای و نمایشگر دقیق`
        : `باتری بادوام و کارایی پایدار`;

  const budgetNote = overBudget
    ? `کمی بالاتر از بودجه‌ی شماست، اما با اقساط از ${formatToman(device.monthlyFrom)} در ماه قابل تهیه است.`
    : `در محدوده‌ی بودجه‌ی شما قرار دارد و اقساط آن از ${formatToman(device.monthlyFrom)} در ماه آغاز می‌شود.`;

  return `${device.name} برای ${useLabel} با ${strength} انتخاب هوشمندانه‌ای است. ${budgetNote}`;
}

const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
function normalizeDigits(text: string): string {
  return text.replace(/[۰-۹]/g, (d) => String(PERSIAN_DIGITS.indexOf(d)));
}

/** Parse free-text chat input into advisor preferences (budget/use-case/ecosystem). */
export function parseAdvisorQuery(text: string, prev: AdvisorPrefs): AdvisorPrefs {
  const t = normalizeDigits(text).toLowerCase();

  let budget = prev.budget;
  const m = t.match(/(\d+(?:\.\d+)?)\s*(میلیارد|میلیون|m)?/);
  if (m) {
    let n = parseFloat(m[1]);
    const unit = m[2];
    if (unit === 'میلیارد') n *= 1_000_000_000;
    else if (unit === 'میلیون' || unit === 'm') n *= 1_000_000;
    else if (n < 1000) n *= 1_000_000; // a bare small number ⇒ millions of Toman
    if (n >= 1_000_000) budget = Math.round(n);
  }

  let useCase = prev.useCase;
  if (/بازی|گیم|game|gaming/.test(t)) useCase = 'gaming';
  else if (/عکاس|دوربین|عکس|محتوا|photo|تولید/.test(t)) useCase = 'photography';
  else if (/کار|اداری|آفیس|بیزینس|office|business|بهره/.test(t)) useCase = 'business';

  let ecosystem = prev.ecosystem;
  if (/اپل|آیفون|ایفون|ios/.test(t)) ecosystem = 'ios';
  else if (/اندروید|سامسونگ|شیائومی|android/.test(t)) ecosystem = 'android';

  return { budget, useCase, ecosystem };
}

/** Contextual assistant reply line that precedes the recommendation cards. */
export function buildAdvisorReply(prefs: AdvisorPrefs, recommendations: Recommendation[]): string {
  if (recommendations.length === 0) {
    return 'در این محدوده دستگاهی پیدا نکردم. اگر بودجه را کمی افزایش دهید یا فیلتر اکوسیستم را باز بگذارید، گزینه‌های بهتری معرفی می‌کنم.';
  }
  return `بر اساس بودجه‌ی حدود ${formatTomanCompact(prefs.budget)} و کاربری «${USE_CASE_LABEL[prefs.useCase]}»، این گزینه‌ها را پیشنهاد می‌کنم:`;
}

// ---------------------------------------------------------------------------
//  Installment planner
// ---------------------------------------------------------------------------

export interface PlanOption {
  readonly months: AllowedMonth;
  readonly monthly: number;
  readonly totalProfit: number;
  readonly dtiPercent: number;
  readonly affordable: boolean;
}

export interface InstallmentPlan {
  readonly feasible: boolean;
  readonly optimal: PlanOption | null;
  readonly options: PlanOption[];
  readonly advice: string;
  readonly suggestedExtraDown: number;
}

export interface PlannerInput {
  readonly price: number;
  readonly downPayment: number;
  readonly monthlyIncome: number;
  readonly annualRateBps?: number;
}

export function planInstallment(input: PlannerInput): InstallmentPlan {
  const annualRateBps = input.annualRateBps ?? 1800;
  const ceiling = input.monthlyIncome * DTI_CEILING;

  const options: PlanOption[] = ALLOWED_MONTHS.map((months) => {
    const quote = calculateInstallment({
      cashPrice: input.price,
      downPayment: input.downPayment,
      months,
      annualRateBps,
    });
    const dtiPercent =
      input.monthlyIncome > 0 ? Math.round((quote.monthlyPayment / input.monthlyIncome) * 100) : 100;
    return {
      months,
      monthly: quote.monthlyPayment,
      totalProfit: quote.totalProfit,
      dtiPercent,
      affordable: input.monthlyIncome > 0 && quote.monthlyPayment <= ceiling,
    };
  });

  const affordable = options.filter((o) => o.affordable);
  // Optimal = the SHORTEST affordable term (lowest interest, fastest payoff).
  const optimal = affordable.length > 0
    ? affordable.reduce((best, o) => (o.months < best.months ? o : best))
    : null;
  const feasible = optimal !== null;
  const longest = options[options.length - 1];

  let advice: string;
  let suggestedExtraDown = 0;

  if (feasible && optimal) {
    const saved = Math.max(0, longest.totalProfit - optimal.totalProfit);
    const savedNote =
      saved > 0
        ? `با انتخاب این مدت کوتاه‌تر نسبت به ۲۴ ماه، حدود ${formatToman(saved)} در سود اقساط صرفه‌جویی می‌کنید.`
        : 'این کوتاه‌ترین و کم‌هزینه‌ترین گزینه‌ی ممکن برای شماست.';
    advice =
      `با درآمد اعلامی شما، امن‌ترین انتخاب بازپرداخت ${toPersianDigits(optimal.months)} ماهه است: ` +
      `قسط ماهانه حدود ${formatToman(optimal.monthly)} و تنها ${toPersianDigits(optimal.dtiPercent)}٪ از درآمد شماست ` +
      `که در محدوده‌ی امن مالی قرار دارد و فشاری به بودجه‌ی شما وارد نمی‌کند. ${savedNote} ` +
      `این انتخاب به حفظ سلامت سابقه‌ی اعتباری شما کمک می‌کند.`;
  } else {
    suggestedExtraDown = estimateExtraDown(input, annualRateBps, ceiling);
    advice =
      `قسط ماهانه در همه‌ی بازه‌ها بیش از ۴۰٪ درآمد اعلامی شماست و از نظر اعتبارسنجی پرریسک محسوب می‌شود. ` +
      (suggestedExtraDown > 0
        ? `پیشنهاد هوشمند: حدود ${formatToman(suggestedExtraDown)} به پیش‌پرداخت اضافه کنید تا قسط به محدوده‌ی امن برسد، `
        : `پیشنهاد می‌کنیم درآمد دقیق‌تری وارد کنید یا `) +
      `یا دستگاهی اقتصادی‌تر انتخاب کنید تا بازپرداخت بدون آسیب به اعتبار شما مدیریت شود.`;
  }

  return { feasible, optimal, options, advice, suggestedExtraDown };
}

function estimateExtraDown(input: PlannerInput, annualRateBps: number, ceiling: number): number {
  if (ceiling <= 0) return 0;
  const q = calculateInstallment({
    cashPrice: input.price,
    downPayment: input.downPayment,
    months: 24,
    annualRateBps,
  });
  if (q.monthlyPayment <= ceiling || q.principal <= 0) return 0;
  const targetPrincipal = q.principal * (ceiling / q.monthlyPayment);
  const extra = q.principal - targetPrincipal;
  return Math.max(0, Math.round(extra / 100_000) * 100_000);
}

// ---------------------------------------------------------------------------
//  AI No-Code CMS — generate Persian product content from a name/model
// ---------------------------------------------------------------------------

export interface GeneratedSpec {
  readonly label: string;
  readonly value: string;
}

export interface GeneratedContent {
  readonly category: string;
  readonly tagline: string;
  readonly description: string;
  readonly specs: GeneratedSpec[];
}

export function generateProductContent(rawName: string): GeneratedContent {
  const name = rawName.trim() || 'دستگاه جدید';
  const t = name.toLowerCase();

  const isLaptop = /لپ.?تاپ|مک.?بوک|laptop|macbook/.test(t);
  const isTablet = /آیپد|تبلت|ipad|tab/.test(t);
  const isApple = /آیفون|اپل|مک|iphone|ipad|macbook|apple/.test(t);
  const isSamsung = /سامسونگ|گلکسی|samsung|galaxy/.test(t);

  const kind = isLaptop ? 'لپ‌تاپ' : isTablet ? 'تبلت' : 'گوشی موبایل';
  const brandLabel = isApple ? 'اپل' : isSamsung ? 'سامسونگ' : 'برترین برندها';
  const category = isApple ? `${kind} / اپل` : isSamsung ? `${kind} / سامسونگ` : kind;
  const os = isApple
    ? isLaptop
      ? 'macOS'
      : isTablet
        ? 'iPadOS ۱۷'
        : 'iOS ۱۷'
    : isLaptop
      ? 'ویندوز ۱۱'
      : 'اندروید ۱۴';

  const useCaseLine = isLaptop
    ? 'برای کارهای حرفه‌ای، برنامه‌نویسی و طراحی گرافیک ساخته شده است'
    : 'برای عکاسی، بازی و چندوظیفگی روزمره بهینه شده است';

  const tagline = `${name}؛ تجربه‌ای فراتر از انتظار با شرایط اقساطی شفاف قسط شاپ.`;

  const description =
    `${name} یکی از بهترین گزینه‌های ${kind} در رده‌ی محصولات ${brandLabel} است که ${useCaseLine}. ` +
    `این محصول با بهره‌گیری از سخت‌افزار قدرتمند، نمایشگری چشم‌نواز و سیستم‌عامل ${os}، تجربه‌ای روان و بی‌نقص ارائه می‌دهد. ` +
    `اکنون می‌توانید ${name} را با پیش‌پرداخت دلخواه و بازپرداخت تا ۲۴ ماه، تنها با اعتبارسنجی آنی و بدون ضامن، از قسط شاپ تهیه کنید. ` +
    `تمامی دستگاه‌ها دارای گارانتی رسمی ۱۸ ماهه و خدمات پس از فروش معتبر هستند.`;

  const specs: GeneratedSpec[] = isLaptop
    ? [
        { label: 'دسته‌بندی', value: category },
        { label: 'پردازنده', value: isApple ? 'تراشه‌ی Apple Silicon' : 'Intel Core i7 نسل جدید' },
        { label: 'حافظه رم', value: '۱۶ گیگابایت' },
        { label: 'حافظه داخلی', value: '۵۱۲ گیگابایت SSD' },
        { label: 'نمایشگر', value: '۱۴ اینچ Liquid Retina' },
        { label: 'سیستم‌عامل', value: os },
        { label: 'گارانتی', value: '۱۸ ماه گارانتی رسمی' },
      ]
    : [
        { label: 'دسته‌بندی', value: category },
        { label: 'حافظه رم', value: '۸ گیگابایت' },
        { label: 'حافظه داخلی', value: '۲۵۶ گیگابایت' },
        { label: 'نمایشگر', value: 'OLED ۶.۷ اینچ، ۱۲۰ هرتز' },
        { label: 'دوربین اصلی', value: '۴۸ مگاپیکسل' },
        { label: 'باتری', value: '۵۰۰۰ میلی‌آمپرساعت' },
        { label: 'سیستم‌عامل', value: os },
        { label: 'گارانتی', value: '۱۸ ماه گارانتی رسمی' },
      ];

  return { category, tagline, description, specs };
}
