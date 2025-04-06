interface Line {
  label: string;
  value: string;
}

interface ReceiptCardProps {
  lines: Line[];
  title?: string;
  subtitle?: string;
  titleText?: string;
  fileCount?: number;
}

export default function ReceiptCard({
  lines,
  title = "Solana Receipts",
  subtitle = "Payment Proof",
  titleText,
  fileCount,
}: ReceiptCardProps) {
  return (
    <div className="max-w-sm mx-auto bg-white p-6 border border-dashed border-gray-800 rounded-lg shadow-md font-mono animate-fade-in">
      <div className="text-center mb-4">
        <h1 className="text-xl font-bold text-gray-900">{title}</h1>
        <p className="text-sm text-gray-600">{subtitle}</p>
        {titleText && (
          <p className="text-base text-[#512DA8] mt-2 font-medium">📝 {titleText}</p>
        )}
        {typeof fileCount === "number" && (
          <p className="text-sm text-gray-500 mt-1">
            📎 {fileCount} file{fileCount !== 1 ? "s" : ""} attached
          </p>
        )}
      </div>

      <div className="border-y border-dashed border-gray-400 py-4">
        {lines.map((line, i) => (
          <div
            key={i}
            className="flex justify-between text-sm text-gray-800 mb-3"
          >
            <span className="font-semibold">{line.label}</span>
            <span className="truncate max-w-[60%] text-right">{line.value}</span>
          </div>
        ))}
      </div>

      <div className="text-center mt-4 text-xs text-gray-600">
        <div className="flex justify-center items-center gap-1">
          <img src="/solreceipt.png" alt="SolReceipts Logo" className="h-5 w-auto" />
          <p>Thank you for using SolReceipts</p>
        </div>
      </div>
    </div>
  );
}
