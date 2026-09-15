interface Props {
  onPrint: () => void;
}

export default function PrintButton({ onPrint }: Props) {
  return (
    <button
      onClick={onPrint}
      className="flex items-center gap-1.5 rounded-md bg-ink-900 px-3.5 py-1.5 text-sm font-medium text-white hover:bg-ink-800 transition-colors"
    >
      🖨 Imprimer A4
    </button>
  );
}
