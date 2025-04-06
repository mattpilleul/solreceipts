import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Program, AnchorProvider, Idl } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { useRouter } from "next/router";

import idl from "../idl/solana_receipts.json";

const programID = new PublicKey(idl.address);

export default function Home() {
  const router = useRouter();
  const { connection } = useConnection();
  const { publicKey, wallet, connected } = useWallet();
  const [txs, setTxs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [receipts, setReceipts] = useState<any[]>([]);

  useEffect(() => {
    if (!publicKey) {
      setTxs([]);
      return;
    }

    const fetchTxs = async () => {
      setLoading(true);
      try {
        const sigs = await connection.getSignaturesForAddress(publicKey, { limit: 15 });
        const parsed = await Promise.all(
          sigs.map(async ({ signature }) => {
            const tx = await connection.getParsedTransaction(signature, {
              maxSupportedTransactionVersion: 0,
            });
            return { signature, tx };
          })
        );

        const cleaned = parsed.filter(({ tx }) => tx !== null);
        setTxs(cleaned);
      } catch (error) {
        console.error("Error fetching transactions:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchReceipts = async () => {
      try {
        const provider = new AnchorProvider(connection, wallet as any, {});
        const program = new Program(idl as Idl, provider);
        const allReceipts = await program.account.receipt.all([
          {
            memcmp: {
              offset: 8,
              bytes: publicKey.toBase58(),
            },
          },
        ]);
        setReceipts(allReceipts);
      } catch (err) {
        console.error("Error loading receipts:", err);
      }
    };

    fetchReceipts();
    fetchTxs();
  }, [publicKey, connection, wallet, connected]);

  const getStatus = (tx: any) => {
    if (!tx?.meta) return "Pending";
    return tx.meta.err ? "Failed" : "Success";
  };

  const getTypeAvatar = (tx: any) => {
    const ix = tx?.transaction?.message?.instructions?.[0];

    const isCreateReceipt =
      ix?.programId?.toBase58?.() === "xoDRdJoAhZ4Vzqzh9vRFr5U5yMH2H4emUVqwfvLSKMb";

    if (isCreateReceipt) return "📄";

    const type = ix?.parsed?.type || "transfer";
    switch (type) {
      case "transfer":
        return "🔁";
      case "buy":
        return "🟢";
      case "sell":
        return "🔻";
      default:
        return "💸";
    }
  };

  const findMatchingReceipt = (sig: string) => {
    return receipts.find((r) => {
      const hash = r.account.txHash?.trim();
      const match = hash === sig;
      console.log("🔍 Checking receipt match:");
      console.log("Decoded txHash from receipt:", hash);
      console.log("Current tx we're mapping over:", sig);
      console.log("Match:", match);
      return match;
    });
  };

  return (
    <main className="min-h-screen px-6 py-8" style={{ background: "var(--background)", color: "var(--foreground)" }}>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <h1
            onClick={() => router.push("/")}
            className="text-2xl flex items-center font-extrabold tracking-tight cursor-pointer hover:opacity-80 transition"
          >
            <img src="/solreceipt.png" alt="Solana Receipts Logo" className="h-10 w-auto mr-2" />
            SolReceipts
          </h1>
          <div className="flex items-center gap-4">
            <Link href="/create">
              <button className="inline-flex items-center gap-2 rounded-full bg-[#512DA8] text-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-[#381f75] cursor-pointer transition">
                <Plus className="w-4 h-4" /> Add Transaction
              </button>
            </Link>
            <WalletMultiButton className="!bg-[#512DA8] !text-white !rounded-full !px-6 !py-2 !hover:bg-[#381f75] transition" />
          </div>
        </div>
        <h2 className="text-xl font-bold mb-4">
          {publicKey ? `${txs.length} Transaction${txs.length !== 1 ? "s" : ""}` : "0 Transactions"}
        </h2>
        {!publicKey ? (
          <div className="flex justify-center items-center h-40 text-sm text-gray-500">
            🔐 Please connect your wallet to view your transactions.
          </div>
        ) : loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="w-10 h-10 border-4 border-[#6242b0] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {txs.map(({ signature, tx }) => {
              const instr = tx.transaction.message.instructions[0];
              const programId = instr?.programId?.toBase58();
              const isReceiptCreation = programId === "xoDRdJoAhZ4Vzqzh9vRFr5U5yMH2H4emUVqwfvLSKMb";
              const info = instr?.parsed?.info;
              const destination = info?.destination || "-";
              const amount = info?.lamports ? (info.lamports / 1e9).toFixed(2) + " SOL" : "-";
              const status = getStatus(tx);
              const typeAvatar = isReceiptCreation ? "🧾" : getTypeAvatar(tx);
              const matchingReceipt = findMatchingReceipt(signature);

              return (
                <div
                  key={signature}
                  className="flex items-center justify-between border border-gray-200 rounded-xl px-6 py-4 shadow-sm hover:shadow-md bg-white transition"
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#b9abdc] flex items-center justify-center text-xl shadow-sm mr-4">
                    {typeAvatar}
                  </div>
                  <div className="flex flex-col text-sm text-gray-800 flex-1 min-w-0">
                    <p className="font-bold text-gray-900 truncate">
                      Tx: <span className="font-mono">{signature.slice(0, 16)}...</span>
                    </p>
                    {tx.transaction.message.instructions[0]?.programId?.toBase58() === "xoDRdJoAhZ4Vzqzh9vRFr5U5yMH2H4emUVqwfvLSKMb" ? (
                      <p className="text-sm text-purple-700 font-medium">This transaction created a receipt.</p>
                    ) : (
                      <>
                        <p className="text-gray-500 truncate text-sm">
                          Destination:{" "}
                          {destination && destination !== "-" ? destination.slice(0, 18) + "..." : "Unavailable"}
                        </p>
                        <p className="text-gray-500 text-sm">
                          Amount: {amount && amount !== "-" ? amount : "Unavailable"}
                        </p>
                      </>
                    )}
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium text-center ${status === "Success"
                        ? "bg-green-100 text-green-700"
                        : status === "Failed"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                        }`}
                    >
                      {status}
                    </span>
                  </div>
                  {matchingReceipt && (
                    <div className="ml-6 flex-shrink-0">
                      <Link href={`/receipt/${matchingReceipt.publicKey.toBase58()}`}>
                        <button className="inline-flex items-center gap-2 rounded-full bg-[#482897] text-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-[#381f75] cursor-pointer transition">
                          📄 Show Receipt
                        </button>
                      </Link>
                    </div>
                  )}

                  {!matchingReceipt && !isReceiptCreation && (
                    <div className="ml-6 flex-shrink-0">
                      <Link href={`/create?tx=${signature}`}>
                        <button className="inline-flex items-center gap-2 rounded-full bg-[#482897] text-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-[#381f75] cursor-pointer transition">
                          🧾 Create Receipt
                        </button>
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
