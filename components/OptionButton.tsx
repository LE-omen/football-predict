'use client';

type Props = {
  label: string;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
};

export default function OptionButton({ label, active, disabled, onClick }: Props) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all ${
        active
          ? 'border-accent bg-accent/[0.08] text-accent shadow-glow'
          : 'border-black/[0.06] bg-white text-zinc-600 hover:border-accent/30 hover:bg-accent/[0.03] hover:text-zinc-900'
      } disabled:cursor-not-allowed disabled:opacity-30`}
    >
      {label}
    </button>
  );
}
