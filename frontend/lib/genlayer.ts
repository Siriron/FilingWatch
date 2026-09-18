import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { TransactionStatus } from "genlayer-js/types";
import { CONTRACT_ADDRESS, STUDIONET_CONFIG, EXPLORER_TX_URL } from "@/config/chains";

export class TimeoutError extends Error {
  txHash: string;
  isTimeout = true;
  constructor(hash: string) {
    super(
      `Consensus is taking longer than expected. Your transaction was submitted — check its status directly: ${EXPLORER_TX_URL(hash)}`
    );
    this.txHash = hash;
  }
}

export async function ensureChain() {
  const eth = (window as any).ethereum;
  if (!eth) return;
  try {
    await eth.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: STUDIONET_CONFIG.chainId }],
    });
  } catch (err: any) {
    if (err && err.code === 4902) {
      await eth.request({ method: "wallet_addEthereumChain", params: [STUDIONET_CONFIG] });
      await eth.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: STUDIONET_CONFIG.chainId }],
      });
    } else if (err && err.code === -32002) {
      await new Promise((r) => setTimeout(r, 3000));
    } else {
      throw err;
    }
  }
}

export function getReadClient() {
  return createClient({ chain: studionet });
}

export async function getWriteClient(account: `0x${string}`) {
  const eth = (window as any).ethereum;
  const client = createClient({ chain: studionet, account, provider: eth });
  if (typeof (client as any).connect === "function") {
    try {
      await (client as any).connect("studionet");
    } catch {
      /* older SDKs without this method — safe to ignore */
    }
  }
  return client;
}

export async function readContract(functionName: string, args: any[] = []) {
  const client = getReadClient();
  const result = await client.readContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    functionName,
    args,
  });
  if (typeof result === "string") {
    try {
      return JSON.parse(result);
    } catch {
      return result;
    }
  }
  return result;
}

export async function writeContract(
  account: `0x${string}`,
  functionName: string,
  args: any[] = []
) {
  await ensureChain();
  const client = await getWriteClient(account);
  const hash = await client.writeContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    functionName,
    args,
    value: BigInt(0),
  });
  try {
    const receipt = await client.waitForTransactionReceipt({
      hash,
      status: TransactionStatus.ACCEPTED,
      retries: 120,
      interval: 4000,
    });
    return { hash, receipt };
  } catch {
    throw new TimeoutError(hash);
  }
}
