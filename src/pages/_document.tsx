import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <title>SolReceipts - On-chain Payment Receipts on Solana</title>
        <meta name="description" content="Generate and verify on-chain payment receipts on Solana. Secure, verifiable, and decentralized with SolReceipts." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#512DA8" />
        <meta property="og:title" content="SolReceipts" />
        <meta property="og:description" content="Generate and verify on-chain payment receipts on Solana." />
        <meta property="og:image" content="/solreceipt.png" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://solreceipts.netlify.app/" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="SolReceipts" />
        <meta name="twitter:description" content="Create receipts for your Solana payments, on-chain and verifiable." />
        <meta name="twitter:image" content="/solreceipt.png" />
        <link rel="icon" href="/solreceipt.png" />
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
