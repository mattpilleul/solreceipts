import { useRouter } from "next/router";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { AnchorProvider, Program, Idl } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { useEffect, useState } from "react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

import idl from "../../idl/solana_receipts.json";
import ReceiptCard from "../../components/ReceiptCard";

export default function ReceiptPage() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const router = useRouter();
  const { id } = router.query;

  const [receipt, setReceipt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [program, setProgram] = useState<Program | null>(null);

  useEffect(() => {
    if (wallet.connected && wallet.publicKey) {
      const provider = new AnchorProvider(connection, wallet as any, {});
      const program = new Program(idl as Idl, provider);
      setProgram(program);
    }
  }, [wallet.connected, wallet.publicKey, connection]);

  useEffect(() => {
    if (!wallet.connected) {
      router.push("/");
    }
  }, [wallet.connected]);

  useEffect(() => {
    const fetchReceipt = async () => {
      if (!program || !id || typeof id !== "string") return;

      setLoading(true);
      setError("");

      try {
        const receiptAccount = await program?.account?.receipt?.fetch(new PublicKey(id));

        setReceipt(receiptAccount);
      } catch (err) {
        setError("Receipt not found or failed to load.");
      } finally {
        setLoading(false);
      }
    };

    fetchReceipt();
  }, [id, program]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500 text-lg">
        ⏳ Loading receipt...
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600 font-semibold text-lg">
        ❌ {error || "Receipt not found"}
      </div>
    );
  }

  const txHash = Buffer.from(receipt.txHash).toString("utf-8").trim();

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] px-4 py-10 font-sans">
      <div className="max-w-xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <h1
            onClick={() => router.push("/")}
            className="text-2xl flex items-center font-extrabold tracking-tight cursor-pointer hover:opacity-80 transition"
          >
            <img src="/solreceipt.png" alt="Solana Receipts Logo" className="h-10 w-auto mr-2" />
            SolReceipts
          </h1>
          <div className="flex items-center gap-4">
            <WalletMultiButton className="!bg-[#512DA8] !text-white !rounded-full !px-6 !py-2 !hover:bg-[#381f75] transition" />
          </div>
        </div>
        <h2 className="text-xl font-bold mb-4">
          Receipt:
        </h2>
        <ReceiptCard
          title={receipt.title}
          subtitle="On-chain Receipt"
          lines={[
            { label: "Transaction", value: txHash.slice(0, 16) + "..." },
            { label: "Payer", value: receipt.payer.toBase58() },
            { label: "Created by", value: receipt.creator.toBase58() },
            { label: "Date", value: new Date(receipt.timestamp * 1000).toLocaleString() },
            { label: "Description", value: receipt.description },
            {
              label: "Attached Files",
              value: receipt.files.length > 0
                ? receipt.files.map((f: any, i: number) =>
                  `📎 ${f.name} (${f.hash.slice(0, 8)}...)`
                ).join(", ")
                : "No file attached"
            },
          ]}
        />
      </div>
    </main>
  );
}
