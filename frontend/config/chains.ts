// Plain-constant chain config. No .env, no Vercel env vars — see project
// convention: this is the single place the deployed address lives.

export const CONTRACT_ADDRESS = "0x9bbB29978d437c70b9148362dB2C77149d84C439";

export const STUDIONET_CONFIG = {
  chainId: "0xF22F", // 61999
  chainName: "GenLayer StudioNet",
  rpcUrls: ["https://studio.genlayer.com/api"],
  nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 },
  blockExplorerUrls: ["https://explorer-studio.genlayer.com"],
};

export const EXPLORER_TX_URL = (hash: string) =>
  `https://explorer-studio.genlayer.com/tx/${hash}`;

export const EXPLORER_ADDRESS_URL = (address: string) =>
  `https://explorer-studio.genlayer.com/address/${address}`;
