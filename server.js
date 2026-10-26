import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const API_KEY = process.env.API_ALCHEMY;
if (!API_KEY) {
  console.error("Missing API_ALCHEMY environment variable (your Alchemy API key).");
  process.exit(1);
}

const NETWORKS = {
  mainnet: { chainId: 1, name: "Ethereum Mainnet", alchemy: "eth-mainnet", explorer: "https://etherscan.io" },
  sepolia: { chainId: 11155111, name: "Sepolia Testnet", alchemy: "eth-sepolia", explorer: "https://sepolia.etherscan.io" },
};
const NETWORK_NAME = process.env.NETWORK || "mainnet";
const NETWORK = NETWORKS[NETWORK_NAME];
if (!NETWORK) {
  console.error(`Unknown NETWORK "${NETWORK_NAME}". Use one of: ${Object.keys(NETWORKS).join(", ")}`);
  process.exit(1);
}

const ALCHEMY_URL = `https://${NETWORK.alchemy}.g.alchemy.com/v2/${API_KEY}`;
const PORT = process.env.PORT || 3000;

// Only these JSON-RPC methods are forwarded, so the proxy can't be abused
// to burn your Alchemy quota on arbitrary calls.
const ALLOWED_METHODS = new Set([
  "eth_chainId",
  "eth_blockNumber",
  "eth_getBalance",
  "eth_getTransactionCount",
  "eth_gasPrice",
  "eth_maxPriorityFeePerGas",
  "eth_feeHistory",
  "eth_estimateGas",
  "eth_getBlockByNumber",
  "eth_getTransactionByHash",
  "eth_getTransactionReceipt",
  "eth_sendRawTransaction",
  "eth_call",
  "net_version",
]);

const app = express();
app.use(express.json({ limit: "100kb" }));
app.use(express.static(path.join(__dirname, "public")));
app.use("/vendor", express.static(path.join(__dirname, "node_modules/ethers/dist")));

app.get("/config", (req, res) => {
  const { chainId, name, explorer } = NETWORK;
  res.json({ chainId, name, explorer, testnet: NETWORK_NAME !== "mainnet" });
});

app.post("/rpc", async (req, res) => {
  const calls = Array.isArray(req.body) ? req.body : [req.body];
  const blocked = calls.find((c) => !c || !ALLOWED_METHODS.has(c.method));
  if (blocked) {
    return res.status(403).json({
      jsonrpc: "2.0",
      id: blocked?.id ?? null,
      error: { code: -32601, message: `Method not allowed: ${blocked?.method}` },
    });
  }

  try {
    const upstream = await fetch(ALCHEMY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });
    res.status(upstream.status).type("application/json").send(await upstream.text());
  } catch (err) {
    console.error("Alchemy request failed:", err);
    res.status(502).json({ jsonrpc: "2.0", id: null, error: { code: -32000, message: "Upstream error" } });
  }
});

app.listen(PORT, () => {
  console.log(`Running on http://localhost:${PORT} (${NETWORK.name})`);
});
