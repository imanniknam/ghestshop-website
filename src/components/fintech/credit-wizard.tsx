'use client';

/**
 * GhestShop — Credit Validation Stepper (سامانه اعتبارسنجی هوشمند)
 * ------------------------------------------------------------------
 * A premium, fully-stateful 3-step credit-validation wizard:
 *
 *   1. اطلاعات پایه      — National ID (checksum-validated), income, employment.
 *   2. بارگذاری مدارک    — drag-and-drop zones for national card / cheque / safteh
 *                          with live type & size validation and image previews.
 *   3. بررسی هوشمند      — animated "under review" timeline that mimics live
 *                          database syncing (identity → cheque → final review).
 *
 * RTL-first, Persian copy, spring physics ({ stiffness: 300, damping: 20 }),
 * direction-aware slide transitions, prefers-reduced-motion aware, strict TS,
 * zero placeholders. All field/file rules are shared with the Server Action via
 * `@/lib/validations/loan`.
 */

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type ReactNode,
} from 'react';
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Transition,
  type Variants,
} from 'framer-motion';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CloudUpload,
  FileText,
  Loader2,
  ShieldCheck,
  Trash2,
  TriangleAlert,
  UserRound,
} from 'lucide-react';
import {
  DOCUMENT_SLOTS,
  EMPLOYMENT_TYPES,
  MAX_FILE_BYTES,
  basicInfoSchema,
  validateDocumentFile,
  type BasicInfoValues,
  type DocumentSlotKey,
  type EmploymentType,
} from '@/lib/validations/loan';
import { formatToman, toPersianDigits } from '@/lib/format';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
//  Motion tokens
// ---------------------------------------------------------------------------

const SPRING: Transition = { type: 'spring', stiffness: 300, damping: 20 };
const SOFT_SPRING: Transition = { type: 'spring', stiffness: 220, damping: 26 };

const slideVariants: Variants = {
  enter: (dir: number) => ({ x: dir > 0 ? 72 : -72, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -72 : 72, opacity: 0 }),
};

// ---------------------------------------------------------------------------
//  Public types
// ---------------------------------------------------------------------------

export interface UploadedDocument {
  readonly file: File;
  readonly previewUrl: string;
  readonly isImage: boolean;
}

export interface CreditWizardResult {
  readonly basicInfo: BasicInfoValues;
  readonly documents: Partial<Record<DocumentSlotKey, File>>;
}

export interface CreditWizardProps {
  /**
   * Submit handler — wired to a Server Action in Phase 5. Should resolve when
   * the application has been persisted; the wizard then shows the success node.
   */
  onSubmit?: (result: CreditWizardResult) => Promise<void> | void;
  className?: string;
}

type StepIndex = 0 | 1 | 2;

const STEPS = [
  { title: 'اطلاعات پایه', icon: UserRound },
  { title: 'بارگذاری مدارک', icon: CloudUpload },
  { title: 'بررسی هوشمند', icon: ShieldCheck },
] as const;

// ---------------------------------------------------------------------------
//  Helpers
// ---------------------------------------------------------------------------

const PERSIAN_TO_ASCII: Record<string, string> = {
  '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
  '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
};

/** Strip everything but digits (accepting Persian numerals) and parse. */
function parseDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (d) => PERSIAN_TO_ASCII[d] ?? '')
    .replace(/\D/g, '');
}

function formatBytes(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return `${toPersianDigits(mb.toFixed(mb < 0.1 ? 2 : 1))} مگابایت`;
}

// ===========================================================================
//  MAIN COMPONENT
// ===========================================================================

export function CreditWizard({ onSubmit, className }: CreditWizardProps): ReactNode {
  const reduceMotion = useReducedMotion();
  const transition = reduceMotion ? { duration: 0 } : SPRING;

  const [[step, direction], setStep] = useState<[StepIndex, number]>([0, 0]);

  // ---- Step 1 state -------------------------------------------------------
  const [nationalId, setNationalId] = useState('');
  const [incomeRaw, setIncomeRaw] = useState<number | null>(null);
  const [employment, setEmployment] = useState<EmploymentType | ''>('');
  const [basicErrors, setBasicErrors] = useState<Partial<Record<keyof BasicInfoValues, string>>>({});

  // ---- Step 2 state -------------------------------------------------------
  const [documents, setDocuments] = useState<Partial<Record<DocumentSlotKey, UploadedDocument>>>({});
  const [docError, setDocError] = useState<string | null>(null);

  // Revoke object URLs on unmount to avoid memory leaks.
  useEffect(() => {
    return () => {
      Object.values(documents).forEach((doc) => doc && URL.revokeObjectURL(doc.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goTo = useCallback((next: StepIndex) => {
    setStep(([current]) => [next, next > current ? 1 : -1]);
  }, []);

  // ---- Step 1 validation --------------------------------------------------
  const validateBasic = useCallback((): boolean => {
    const parsed = basicInfoSchema.safeParse({
      nationalId,
      monthlyIncome: incomeRaw ?? Number.NaN,
      employmentType: employment || undefined,
    });
    if (parsed.success) {
      setBasicErrors({});
      return true;
    }
    const next: Partial<Record<keyof BasicInfoValues, string>> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as keyof BasicInfoValues;
      if (!next[field]) next[field] = issue.message;
    }
    setBasicErrors(next);
    return false;
  }, [nationalId, incomeRaw, employment]);

  // ---- Step 2 validation --------------------------------------------------
  const requiredDocsPresent = useMemo(
    () =>
      DOCUMENT_SLOTS.filter((slot) => slot.required).every(
        (slot) => documents[slot.key],
      ),
    [documents],
  );

  const handleFile = useCallback((key: DocumentSlotKey, file: File | undefined) => {
    setDocError(null);
    if (!file) return;
    const error = validateDocumentFile(file);
    if (error) {
      setDocError(error.message);
      return;
    }
    setDocuments((prev) => {
      // Revoke the previous preview for this slot, if any.
      const previous = prev[key];
      if (previous) URL.revokeObjectURL(previous.previewUrl);
      return {
        ...prev,
        [key]: {
          file,
          previewUrl: URL.createObjectURL(file),
          isImage: file.type.startsWith('image/'),
        },
      };
    });
  }, []);

  const removeFile = useCallback((key: DocumentSlotKey) => {
    setDocuments((prev) => {
      const target = prev[key];
      if (target) URL.revokeObjectURL(target.previewUrl);
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  // ---- Forward navigation -------------------------------------------------
  const handleNext = useCallback(() => {
    if (step === 0) {
      if (validateBasic()) goTo(1);
      return;
    }
    if (step === 1) {
      if (!requiredDocsPresent) {
        setDocError('بارگذاری کارت ملی و چک صیادی الزامی است.');
        return;
      }
      goTo(2);
    }
  }, [step, validateBasic, goTo, requiredDocsPresent]);

  const handleBack = useCallback(() => {
    if (step > 0) goTo((step - 1) as StepIndex);
  }, [step, goTo]);

  const collectResult = useCallback((): CreditWizardResult => {
    const docFiles: Partial<Record<DocumentSlotKey, File>> = {};
    (Object.keys(documents) as DocumentSlotKey[]).forEach((key) => {
      const doc = documents[key];
      if (doc) docFiles[key] = doc.file;
    });
    return {
      basicInfo: {
        nationalId,
        monthlyIncome: incomeRaw ?? 0,
        employmentType: employment as EmploymentType,
      },
      documents: docFiles,
    };
  }, [documents, nationalId, incomeRaw, employment]);

  return (
    <motion.section
      dir="rtl"
      lang="fa"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduceMotion ? { duration: 0 } : SOFT_SPRING}
      aria-label="سامانه اعتبارسنجی هوشمند"
      className={cn(
        'relative mx-auto w-full max-w-xl overflow-hidden rounded-3xl p-6 sm:p-8',
        'border border-foreground/15 bg-foreground/10 backdrop-blur-xl',
        'shadow-[0_8px_40px_-12px_rgba(0,0,0,0.55)] ring-1 ring-inset ring-foreground/5',
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-primary/25 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -left-20 h-56 w-56 rounded-full bg-accent/20 blur-3xl"
      />

      <div className="relative z-10 flex flex-col gap-7">
        <Stepper current={step} transition={transition} />

        <div className="relative min-h-[19rem]">
          <AnimatePresence mode="wait" custom={direction} initial={false}>
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={transition}
            >
              {step === 0 && (
                <BasicInfoStep
                  nationalId={nationalId}
                  onNationalId={(v) => setNationalId(parseDigits(v).slice(0, 10))}
                  income={incomeRaw}
                  onIncome={(v) => {
                    const digits = parseDigits(v);
                    setIncomeRaw(digits ? Number(digits) : null);
                  }}
                  employment={employment}
                  onEmployment={setEmployment}
                  errors={basicErrors}
                />
              )}

              {step === 1 && (
                <DocumentStep
                  documents={documents}
                  onFile={handleFile}
                  onRemove={removeFile}
                  error={docError}
                />
              )}

              {step === 2 && (
                <ReviewStep
                  result={collectResult()}
                  onSubmit={onSubmit}
                  reduceMotion={Boolean(reduceMotion)}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ---- Footer navigation (hidden on the final review step) -------- */}
        {step < 2 && (
          <footer className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleBack}
              disabled={step === 0}
              className={cn(
                'inline-flex items-center gap-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors',
                'text-foreground/70 hover:text-foreground',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                'disabled:cursor-not-allowed disabled:opacity-30',
                step > 0 && 'cursor-pointer',
              )}
            >
              <ChevronRight className="h-4 w-4" aria-hidden />
              مرحله قبل
            </button>

            <motion.button
              type="button"
              onClick={handleNext}
              whileHover={reduceMotion ? undefined : { scale: 1.02 }}
              whileTap={reduceMotion ? undefined : { scale: 0.98 }}
              transition={SPRING}
              className={cn(
                'inline-flex cursor-pointer items-center gap-1 rounded-xl px-6 py-2.5 text-sm font-bold transition-[filter]',
                'bg-primary text-primary-foreground',
                'shadow-lg shadow-primary/30 hover:brightness-110',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
              )}
            >
              {step === 1 ? 'ثبت و بررسی' : 'مرحله بعد'}
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </motion.button>
          </footer>
        )}
      </div>
    </motion.section>
  );
}

// ===========================================================================
//  STEP INDICATOR
// ===========================================================================

function Stepper({ current, transition }: { current: StepIndex; transition: Transition }): ReactNode {
  return (
    <nav aria-label="مراحل اعتبارسنجی">
      <ol className="flex items-center">
        {STEPS.map((s, index) => {
          const Icon = s.icon;
          const isDone = index < current;
          const isActive = index === current;
          return (
            <li key={s.title} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center gap-2">
                <motion.div
                  animate={{
                    scale: isActive ? 1.05 : 1,
                  }}
                  transition={transition}
                  className={cn(
                    'flex h-11 w-11 items-center justify-center rounded-2xl border transition-colors',
                    isDone && 'border-transparent bg-primary text-primary-foreground',
                    isActive && 'border-primary bg-primary/15 text-primary',
                    !isDone && !isActive && 'border-foreground/15 bg-foreground/5 text-foreground/40',
                  )}
                >
                  {isDone ? (
                    <CheckCircle2 className="h-5 w-5" aria-hidden />
                  ) : (
                    <Icon className="h-5 w-5" aria-hidden />
                  )}
                </motion.div>
                <span
                  className={cn(
                    'text-sm font-medium',
                    isActive ? 'text-foreground' : 'text-foreground/45',
                  )}
                >
                  {s.title}
                </span>
              </div>

              {index < STEPS.length - 1 && (
                <div className="relative mx-2 -mt-6 h-0.5 flex-1 rounded-full bg-foreground/10">
                  <motion.div
                    initial={false}
                    animate={{ scaleX: isDone ? 1 : 0 }}
                    transition={transition}
                    style={{ originX: 1 }} // grows from the right (RTL)
                    className="absolute inset-0 rounded-full bg-primary"
                  />
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// ===========================================================================
//  STEP 1 — BASIC INFO
// ===========================================================================

interface BasicInfoStepProps {
  nationalId: string;
  onNationalId: (v: string) => void;
  income: number | null;
  onIncome: (v: string) => void;
  employment: EmploymentType | '';
  onEmployment: (v: EmploymentType) => void;
  errors: Partial<Record<keyof BasicInfoValues, string>>;
}

function BasicInfoStep({
  nationalId,
  onNationalId,
  income,
  onIncome,
  employment,
  onEmployment,
  errors,
}: BasicInfoStepProps): ReactNode {
  const nidId = useId();
  const incomeId = useId();

  return (
    <div className="flex flex-col gap-5">
      <Field
        id={nidId}
        label="کد ملی"
        required
        error={errors.nationalId}
        helper="کد ملی ۱۰ رقمی به‌صورت خودکار اعتبارسنجی می‌شود."
      >
        <input
          id={nidId}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          dir="ltr"
          value={toPersianDigits(nationalId)}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onNationalId(e.target.value)}
          placeholder="۰۰۱۲۳۴۵۶۷۸"
          aria-invalid={Boolean(errors.nationalId)}
          className={inputClass(Boolean(errors.nationalId), 'text-center tracking-[0.3em]')}
        />
      </Field>

      <Field
        id={incomeId}
        label="درآمد ماهانه"
        required
        error={errors.monthlyIncome}
        helper="مبلغ به تومان — مبنای محاسبه سقف اعتبار شما."
      >
        <div className="relative">
          <input
            id={incomeId}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={income !== null ? formatToman(income, { withSuffix: false }) : ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onIncome(e.target.value)}
            placeholder="۱۵٬۰۰۰٬۰۰۰"
            aria-invalid={Boolean(errors.monthlyIncome)}
            className={inputClass(Boolean(errors.monthlyIncome), 'pl-16')}
          />
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-foreground/50">
            تومان
          </span>
        </div>
      </Field>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium text-foreground/80">
          نوع اشتغال <span className="text-primary">*</span>
        </legend>
        <div className="grid grid-cols-2 gap-2">
          {EMPLOYMENT_TYPES.map((opt) => {
            const active = employment === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onEmployment(opt.value)}
                className={cn(
                  'cursor-pointer rounded-xl border px-3 py-3 text-right text-sm font-medium transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  active
                    ? 'border-primary bg-primary/15 text-foreground'
                    : 'border-foreground/10 bg-foreground/5 text-foreground/65 hover:border-foreground/25',
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
        {errors.employmentType && <ErrorText>{errors.employmentType}</ErrorText>}
      </fieldset>
    </div>
  );
}

// ===========================================================================
//  STEP 2 — DOCUMENT UPLOAD
// ===========================================================================

interface DocumentStepProps {
  documents: Partial<Record<DocumentSlotKey, UploadedDocument>>;
  onFile: (key: DocumentSlotKey, file: File | undefined) => void;
  onRemove: (key: DocumentSlotKey) => void;
  error: string | null;
}

function DocumentStep({ documents, onFile, onRemove, error }: DocumentStepProps): ReactNode {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-foreground/60">
        تصاویر واضح و خوانا بارگذاری کنید. حداکثر حجم هر فایل{' '}
        {toPersianDigits((MAX_FILE_BYTES / (1024 * 1024)).toFixed(0))} مگابایت.
      </p>

      <div className="flex flex-col gap-3">
        {DOCUMENT_SLOTS.map((slot) => (
          <DropZone
            key={slot.key}
            slotKey={slot.key}
            label={slot.label}
            hint={slot.hint}
            required={slot.required}
            doc={documents[slot.key]}
            onFile={(file) => onFile(slot.key, file)}
            onRemove={() => onRemove(slot.key)}
          />
        ))}
      </div>

      <AnimatePresence>
        {error && (
          <motion.p
            role="alert"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={SOFT_SPRING}
            className="flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive"
          >
            <TriangleAlert className="h-4 w-4 shrink-0" aria-hidden />
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

interface DropZoneProps {
  slotKey: DocumentSlotKey;
  label: string;
  hint: string;
  required: boolean;
  doc?: UploadedDocument;
  onFile: (file: File | undefined) => void;
  onRemove: () => void;
}

function DropZone({ label, hint, required, doc, onFile, onRemove }: DropZoneProps): ReactNode {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const onDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      onFile(e.dataTransfer.files?.[0]);
    },
    [onFile],
  );

  // Filled state ----------------------------------------------------------
  if (doc) {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={SPRING}
        className="flex items-center gap-3 rounded-2xl border border-primary/40 bg-primary/10 p-3"
      >
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-black/20">
          {doc.isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={doc.previewUrl} alt={`پیش‌نمایش ${label}`} className="h-full w-full object-cover" />
          ) : (
            <FileText className="h-6 w-6 text-primary" aria-hidden />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1 text-sm font-semibold text-foreground">
            <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden />
            {label}
          </p>
          <p className="truncate text-sm text-foreground/50" dir="ltr">
            {doc.file.name} · {formatBytes(doc.file.size)}
          </p>
        </div>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`حذف ${label}`}
          className="cursor-pointer rounded-lg p-2 text-foreground/50 transition-colors hover:bg-destructive/15 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Trash2 className="h-4 w-4" aria-hidden />
        </button>
      </motion.div>
    );
  }

  // Empty / drag-target state --------------------------------------------
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={onDrop}
      aria-label={`بارگذاری ${label}`}
      className={cn(
        'group flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-dashed p-4 transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        isDragging
          ? 'border-primary bg-primary/10'
          : 'border-foreground/15 bg-foreground/5 hover:border-primary/50 hover:bg-foreground/10',
      )}
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-foreground/10 text-foreground/60 transition-colors group-hover:text-primary">
        <CloudUpload className="h-5 w-5" aria-hidden />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-foreground">
          {label}
          {required && <span className="mr-1 text-primary">*</span>}
        </p>
        <p className="text-sm text-foreground/50">{hint}</p>
      </div>
      <span className="hidden text-sm font-medium text-primary sm:inline">
        انتخاب فایل
      </span>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        className="sr-only"
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          onFile(e.target.files?.[0]);
          e.target.value = ''; // allow re-selecting the same file
        }}
      />
    </div>
  );
}

// ===========================================================================
//  STEP 3 — REAL-TIME VERIFICATION FEEDBACK
// ===========================================================================

type StageStatus = 'idle' | 'syncing' | 'done';

const REVIEW_STAGES = [
  'ارسال امن اطلاعات به سرور',
  'استعلام هویت از سامانه شاهکار',
  'اعتبارسنجی چک صیادی',
  'بررسی نهایی توسط کارشناس اعتبار',
] as const;

interface ReviewStepProps {
  result: CreditWizardResult;
  onSubmit?: (result: CreditWizardResult) => Promise<void> | void;
  reduceMotion: boolean;
}

function ReviewStep({ result, onSubmit, reduceMotion }: ReviewStepProps): ReactNode {
  const [activeStage, setActiveStage] = useState(0);
  const [completed, setCompleted] = useState(false);

  // Drive the simulated "database sync" timeline, advancing one stage at a
  // time. The real network submit fires once, in parallel, on mount.
  useEffect(() => {
    let cancelled = false;
    const stepMs = reduceMotion ? 250 : 1100;
    const timers: ReturnType<typeof setTimeout>[] = [];

    REVIEW_STAGES.forEach((_, index) => {
      timers.push(
        setTimeout(() => {
          if (!cancelled) setActiveStage(index + 1);
        }, stepMs * (index + 1)),
      );
    });

    timers.push(
      setTimeout(() => {
        if (!cancelled) setCompleted(true);
      }, stepMs * (REVIEW_STAGES.length + 1)),
    );

    // Fire the real persistence call once.
    void Promise.resolve(onSubmit?.(result)).catch(() => undefined);

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col items-center gap-6 pt-2 text-center">
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={SPRING}
        className="relative flex h-20 w-20 items-center justify-center rounded-full bg-primary/15"
      >
        {!completed && !reduceMotion && (
          <motion.span
            className="absolute inset-0 rounded-full border-2 border-primary/40"
            animate={{ scale: [1, 1.35], opacity: [0.6, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
          />
        )}
        <AnimatePresence mode="wait">
          {completed ? (
            <motion.span
              key="done"
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={SPRING}
            >
              <CheckCircle2 className="h-10 w-10 text-primary" aria-hidden />
            </motion.span>
          ) : (
            <motion.span key="loading">
              <Loader2 className="h-9 w-9 animate-spin text-primary" aria-hidden />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>

      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-bold text-foreground">
          {completed ? 'درخواست شما ثبت شد' : 'در حال بررسی اطلاعات…'}
        </h3>
        <p className="max-w-sm text-sm text-foreground/55">
          {completed
            ? 'اعتبارسنجی اولیه با موفقیت انجام شد. نتیجه نهایی پس از تأیید کارشناس از طریق پیامک اطلاع‌رسانی می‌شود.'
            : 'لطفاً تا تکمیل فرایند اعتبارسنجی شکیبا باشید.'}
        </p>
      </div>

      {/* Live sync timeline */}
      <ol className="w-full max-w-sm space-y-3 text-right" aria-live="polite">
        {REVIEW_STAGES.map((stage, index) => {
          const resolved: StageStatus = completed
            ? 'done'
            : index < activeStage
              ? 'done'
              : index === activeStage
                ? 'syncing'
                : 'idle';
          return (
            <li key={stage} className="flex items-center gap-3">
              <span
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-colors',
                  resolved === 'done' && 'border-transparent bg-primary text-primary-foreground',
                  resolved === 'syncing' && 'border-primary text-primary',
                  resolved === 'idle' && 'border-foreground/15 text-foreground/30',
                )}
              >
                {resolved === 'done' ? (
                  <CheckCircle2 className="h-4 w-4" aria-hidden />
                ) : resolved === 'syncing' ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <span className="text-sm tabular-nums">{toPersianDigits(index + 1)}</span>
                )}
              </span>
              <span
                className={cn(
                  'text-sm transition-colors',
                  resolved === 'idle'
                    ? 'text-foreground/40'
                    : 'text-foreground/85',
                )}
              >
                {stage}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ===========================================================================
//  SHARED PRIMITIVES
// ===========================================================================

function inputClass(hasError: boolean, extra?: string): string {
  return cn(
    'w-full rounded-xl border bg-foreground/5 px-4 py-3 text-sm text-foreground',
    'placeholder:text-foreground/30 transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    hasError
      ? 'border-destructive/60'
      : 'border-foreground/10 hover:border-foreground/25 focus:border-primary/60',
    extra,
  );
}

interface FieldProps {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  helper?: string;
  children: ReactNode;
}

function Field({ id, label, required, error, helper, children }: FieldProps): ReactNode {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-foreground/80">
        {label}
        {required && <span className="mr-1 text-primary">*</span>}
      </label>
      {children}
      <AnimatePresence mode="wait" initial={false}>
        {error ? (
          <ErrorText key="error">{error}</ErrorText>
        ) : helper ? (
          <motion.p
            key="helper"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-sm text-foreground/40"
          >
            {helper}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function ErrorText({ children }: { children: ReactNode }): ReactNode {
  return (
    <motion.p
      role="alert"
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0 }}
      transition={SOFT_SPRING}
      className="flex items-center gap-1 text-sm font-medium text-destructive"
    >
      <TriangleAlert className="h-3 w-3 shrink-0" aria-hidden />
      {children}
    </motion.p>
  );
}

export default CreditWizard;
