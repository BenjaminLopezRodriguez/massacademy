import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const progressBarVariants = cva("", {
  variants: {
    variant: {
      default: "mt-2 h-1.5 w-full overflow-hidden rounded-full bg-rule",
      representative: "relative h-3 w-full",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

type ProgressBarProps = {
  value: number;
  color?: string;
  className?: string;
} & VariantProps<typeof progressBarVariants>;

function clampProgress(value: number) {
  return Math.min(100, Math.max(0, value));
}

function ProgressBar({
  value,
  color,
  variant = "default",
  className,
}: ProgressBarProps) {
  const progress = clampProgress(value);

  if (variant === "representative") {
    return (
      <div
        className={cn(progressBarVariants({ variant }), className)}
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="bg-stipple absolute inset-0" aria-hidden />
        <div
          className={cn("absolute inset-y-0 left-0 transition-[width]", color ?? "bg-ink")}
          style={{ width: `${progress}%` }}
          aria-hidden
        />
      </div>
    );
  }

  return (
    <div
      className={cn(progressBarVariants({ variant }), className)}
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn("h-full rounded-full transition-all", color ?? "bg-ink")}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

export { ProgressBar, progressBarVariants };
