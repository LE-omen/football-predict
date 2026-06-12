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
      className={`rounded-xl border px-3 py-2 text-sm transition ${
        active
          ? 'border-emerald-400 bg-emerald-500/20 text-emerald-200'
          : 'border-white/10 bg-white/5 text-white/80 hover:bg-white/10'
      } disabled:cursor-not-allowed disabled:opacity-50`}
    >
      {label}
    </button>
  );
}
