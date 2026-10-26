import { ethers } from "/vendor/ethers.min.js";

const config = await (await fetch("/config")).json();

// Reads (balance, gas, receipts) go through our backend, which forwards to Alchemy.
const alchemy = new ethers.JsonRpcProvider(`${location.origin}/rpc`, config.chainId, { staticNetwork: true });

const $ = (id) => document.getElementById(id);
$("network").textContent = config.name;
if (!config.testnet) $("warn").classList.remove("hidden");
let signer;

function setStatus(html, kind = "") {
  $("status").className = `status ${kind}`;
  $("status").innerHTML = html;
}

async function refresh() {
  const address = await signer.getAddress();
  const [balance, fee] = await Promise.all([alchemy.getBalance(address), alchemy.getFeeData()]);
  $("addr").textContent = address;
  $("balance").textContent = `${Number(ethers.formatEther(balance)).toFixed(6)} ${config.testnet ? "SepoliaETH" : "ETH"}`;
  $("gas").textContent = `${Number(ethers.formatUnits(fee.gasPrice, "gwei")).toFixed(2)} gwei`;
}

async function connect() {
  if (!window.ethereum) {
    setStatus("MetaMask not found. Install it from metamask.io.", "err");
    return;
  }
  try {
    await window.ethereum.request({ method: "eth_requestAccounts" });
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: ethers.toQuantity(config.chainId) }],
    });
    signer = await new ethers.BrowserProvider(window.ethereum).getSigner();
    $("connect").classList.add("hidden");
    $("account").classList.remove("hidden");
    $("send").classList.remove("hidden");
    setStatus("");
    await refresh();
  } catch (err) {
    setStatus(err.shortMessage || err.message, "err");
  }
}

async function updateEstimate() {
  const to = $("to").value.trim();
  const amount = $("amount").value.trim();
  if (!signer || !ethers.isAddress(to) || !amount) {
    $("estimate").textContent = "";
    return;
  }
  try {
    const value = ethers.parseEther(amount);
    const from = await signer.getAddress();
    const [gas, fee] = await Promise.all([
      alchemy.estimateGas({ from, to, value }),
      alchemy.getFeeData(),
    ]);
    const cost = gas * (fee.maxFeePerGas ?? fee.gasPrice);
    $("estimate").textContent = `Max network fee ≈ ${Number(ethers.formatEther(cost)).toFixed(6)} ETH`;
  } catch {
    $("estimate").textContent = "Could not estimate fee (check amount / balance).";
  }
}

async function send(e) {
  e.preventDefault();
  const to = $("to").value.trim();
  const amount = $("amount").value.trim();

  if (!ethers.isAddress(to)) return setStatus("Invalid recipient address.", "err");
  let value;
  try {
    value = ethers.parseEther(amount);
  } catch {
    return setStatus("Invalid amount.", "err");
  }
  if (value <= 0n) return setStatus("Amount must be greater than 0.", "err");

  $("submit").disabled = true;
  try {
    setStatus("Confirm the transaction in MetaMask…");
    const tx = await signer.sendTransaction({ to: ethers.getAddress(to), value });
    const link = `<a href="${config.explorer}/tx/${tx.hash}" target="_blank" rel="noopener">${tx.hash}</a>`;
    setStatus(`Submitted: ${link}<br>Waiting for confirmation…`);

    const receipt = await alchemy.waitForTransaction(tx.hash);
    if (receipt.status === 1) {
      setStatus(`Confirmed in block ${receipt.blockNumber}: ${link}`, "ok");
    } else {
      setStatus(`Transaction failed: ${link}`, "err");
    }
    await refresh();
  } catch (err) {
    setStatus(err.shortMessage || err.message, "err");
  } finally {
    $("submit").disabled = false;
  }
}

$("connect").addEventListener("click", connect);
$("send").addEventListener("submit", send);
$("to").addEventListener("change", updateEstimate);
$("amount").addEventListener("change", updateEstimate);

window.ethereum?.on?.("accountsChanged", () => location.reload());
window.ethereum?.on?.("chainChanged", () => location.reload());
