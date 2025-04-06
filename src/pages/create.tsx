import { AnchorProvider, Idl, Program, web3 } from "@coral-xyz/anchor";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { sha256 } from "js-sha256";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

import ReceiptCard from "../components/ReceiptCard";
import idl from "../idl/solana_receipts.json";

const network = "https://api.devnet.solana.com";

export default function CreateReceipt() {
  const wallet = useWallet();
  const router = useRouter();
  const { query } = router;
  const { connection } = useConnection();
  const [txHash, setTxHash] = useState("");
  const [program, setProgram] = useState<Program | null>(null);
  const [description, setDescription] = useState("");
  const [preview, setPreview] = useState<any>(null);
  const [status, setStatus] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [title, setTitle] = useState("");

  useEffect(() => {
    if (wallet.connected && wallet.publicKey) {
      const provider = new AnchorProvider(connection, wallet as any, {});
      const program = new Program(idl as Idl, provider);
      setProgram(program);
    }
  }, [wallet.connected, wallet.publicKey, connection]);

  const uploadDocuments = async () => {
    const uploaded = await Promise.all(
      files.map(async (file) => {
        const buffer = await file.arrayBuffer();
        const hash = sha256(new Uint8Array(buffer));
        return {
          name: file.name,
          hash: String(hash),
        };
      })
    );
    return uploaded;
  };

  const fetchTxData = async () => {
    try {
      const connection = new Connection(network);
      const tx = await connection.getParsedTransaction(txHash, {
        maxSupportedTransactionVersion: 0,
      });

      if (!tx) {
        setStatus("Transaction not found. Please make sure it’s on the correct network (currently using devnet).");
        return;
      }

      const payer = tx.transaction.message.accountKeys[0].pubkey.toBase58();
      const instr = tx.transaction.message.instructions[0];

      console.log("🧾 Raw instruction[0]:", instr);

      let to = "-";
      let amount = "-";

      if ("parsed" in instr && instr.parsed?.info) {
        to = instr.parsed.info.destination || "-";
        amount = instr.parsed.info.lamports
          ? (instr.parsed.info.lamports / web3.LAMPORTS_PER_SOL).toFixed(2) + " SOL"
          : "-";
      }

      const time = tx.blockTime ? new Date(tx.blockTime * 1000).toLocaleString() : "-";

      setPreview({ payer, to, amount, date: time });
      setStatus("");
    } catch (err) {
      console.error(err);
      setStatus("An error occurred while reading the transaction.");
    }
  };

  const createReceipt = async () => {
    if (!wallet || !preview) {
      setStatus("Wallet not connected or transaction preview missing.");
      return;
    }

    try {
      const receiptKeypair = Keypair.generate();

      const uploadedFiles = await uploadDocuments();
      const fileHashes: string[] = uploadedFiles
        .map((f) => String(f.hash))
        .filter((hash) => typeof hash === "string" && hash.length > 0);

      await program?.methods
        .createReceipt(new PublicKey(preview.payer), txHash, title, description, fileHashes)
        .accounts({
          receipt: receiptKeypair.publicKey,
          user: wallet.publicKey!,
          systemProgram: web3.SystemProgram.programId,
        })
        .signers([receiptKeypair])
        .rpc();

      router.push(`/receipt/${receiptKeypair.publicKey.toBase58()}`);
    } catch (err) {
      console.error("createReceipt error:", err);
      setStatus("An error occurred while creating the receipt.");
    }
  };

  useEffect(() => {
    if (query.tx && typeof query.tx === "string") {
      setTxHash(query.tx);
    }
  }, [query]);

  useEffect(() => {
    if (txHash) {
      fetchTxData();
    }
  }, [txHash]);

  useEffect(() => {
    if (!wallet.connected) {
      router.push("/");
    }
  }, [wallet.connected]);

  return (
    <main className="min-h-screen px-4 py-10 bg-[var(--background)] text-[var(--foreground)] font-sans">
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
        <div className="max-w-xl mx-auto bg-white shadow-md rounded-2xl p-6 space-y-6">
          <h1 className="text-2xl font-bold text-gray-900">Create a Receipt</h1>

          <div className="space-y-4">
            <input
              type="text"
              placeholder="Transaction hash"
              value={txHash}
              onChange={(e) => setTxHash(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#512DA8] text-sm text-gray-800 placeholder-gray-500"
            />
            <input
              type="text"
              placeholder="Title (optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#512DA8] text-sm text-gray-800 placeholder-gray-500"
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#512DA8] text-sm text-gray-800 placeholder-gray-500"
            />
            <input
              type="file"
              multiple
              onChange={(e) => setFiles(Array.from(e.target.files || []))}
              className="w-full px-3 py-2 border border-dashed border-gray-300 text-sm text-gray-700 rounded-xl file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-[#b9abdc] file:text-[#381f75] hover:file:bg-[#7356b9]"
            />

            <button
              onClick={fetchTxData}
              className="w-full inline-flex justify-center items-center gap-2 rounded-full bg-[#482897] text-white px-6 py-3 text-sm font-medium shadow-sm hover:bg-[#381f75] transition"
            >
              🔍 Preview Transaction
            </button>
          </div>

          {preview && (
            <>
              <div className="mt-4">
                <ReceiptCard
                  lines={[
                    { label: "Transaction", value: txHash.slice(0, 12) + "..." },
                    { label: "From", value: preview.payer },
                    { label: "To", value: preview.to },
                    { label: "Amount", value: `${preview.amount} SOL` },
                    { label: "Date", value: preview.date },
                  ]}
                  titleText={title}
                  fileCount={files.length}
                />
              </div>

              <button
                onClick={createReceipt}
                className="w-full inline-flex justify-center items-center gap-2 rounded-full bg-green-600 text-white px-6 py-3 text-sm font-medium shadow-sm hover:bg-green-700 transition"
              >
                ✅ Confirm & Save Receipt
              </button>
            </>
          )}

          {status && (
            <p className="text-sm text-red-600 font-medium text-center mt-2">{status}</p>
          )}
        </div>
      </div>
    </main>
  );
}
