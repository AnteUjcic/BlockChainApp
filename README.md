# ETH Sender

Minimal app for sending ETH on Ethereum mainnet or Sepolia. The backend proxies JSON-RPC to Alchemy so the API key never reaches the browser; MetaMask signs transactions.

## Run

```bash
npm install
export API_ALCHEMY=your_alchemy_api_key
export NETWORK=sepolia   # or mainnet (default)
npm start
```

Open http://localhost:3000.
