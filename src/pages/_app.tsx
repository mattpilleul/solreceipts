import "@solana/wallet-adapter-react-ui/styles.css";
import "../styles/globals.css";
import type { AppProps } from "next/app";
import { WalletConnectionProvider } from "../wallet/WalletConnectionProvider";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <WalletConnectionProvider>
      <Component {...pageProps} />
    </WalletConnectionProvider>
  );
}