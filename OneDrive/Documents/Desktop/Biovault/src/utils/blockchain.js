/**
 * Blockchain utility for BioVault
 * Uses ethers.js v6 for Sepolia testnet interaction
 * Provides mock data when no provider is available
 */

// ─── Mock Data ───────────────────────────────────────────────────────────────

const MOCK_TRANSACTIONS = [
  {
    hash: '0x4a7b9c2d1e8f3a6b5c4d7e2f1a8b3c6d5e4f7a2b1c8d9e3f6a7b4c5d2e1f8a3b',
    to: '0x742d35Cc6634C0532925a3b8D4C9843e541b2f82',
    value: '0.05',
    status: 'Success',
    timestamp: Date.now() - 3600000,
    type: 'sent',
  },
  {
    hash: '0x9f8e7d6c5b4a3c2d1e0f9a8b7c6d5e4f3a2b1c9d8e7f6a5b4c3d2e1f0a9b8c7d',
    to: '0x1234567890abcdef1234567890abcdef12345678',
    value: '0.12',
    status: 'Success',
    timestamp: Date.now() - 86400000,
    type: 'received',
  },
  {
    hash: '0x2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c',
    to: '0xDeadBeef1234567890abcdef1234567890AbCdEf',
    value: '0.008',
    status: 'Pending',
    timestamp: Date.now() - 600000,
    type: 'sent',
  },
  {
    hash: '0x7c6b5a4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b',
    to: '0xAbCd1234EfGh5678IjKl9012MnOp3456QrSt7890',
    value: '0.25',
    status: 'Success',
    timestamp: Date.now() - 172800000,
    type: 'received',
  },
];

// ─── Address & formatting ─────────────────────────────────────────────────────

export function truncateAddress(address, start = 6, end = 4) {
  if (!address) return '';
  return `${address.slice(0, start)}...${address.slice(-end)}`;
}

export function truncateHash(hash, start = 8, end = 6) {
  if (!hash) return '';
  return `${hash.slice(0, start)}...${hash.slice(-end)}`;
}

export function formatDate(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return new Date(timestamp).toLocaleDateString();
}

export function etherscanTxUrl(hash, network = 'sepolia') {
  return `https://${network}.etherscan.io/tx/${hash}`;
}

export function etherscanAddressUrl(address, network = 'sepolia') {
  return `https://${network}.etherscan.io/address/${address}`;
}

// ─── Wallet generation (deterministic from credential ID) ───────────────────

export async function generateWalletFromCredential(credentialId) {
  // Derive a deterministic private key from the credentialId using PBKDF2
  // In production this would use a secure protocol; for demo we use a mock
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(credentialId),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: encoder.encode('BioVault-Sepolia-v1'),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );
  // Generate a mock wallet address from the derived bits
  const arr = new Uint8Array(derivedBits);
  const hex = Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
  const address = '0x' + hex.slice(0, 40);
  return {
    address,
    // Never expose private key - this is purely for address derivation demo
    network: 'Sepolia Testnet',
  };
}

// ─── Blockchain data fetching ─────────────────────────────────────────────────

export async function getBalance(address, provider = null) {
  if (!provider) {
    // Return mock balance with slight variation
    const base = 1.2847;
    return (base + Math.random() * 0.01).toFixed(4);
  }
  try {
    const { ethers } = await import('ethers');
    const balance = await provider.getBalance(address);
    return ethers.formatEther(balance);
  } catch {
    return '0.0000';
  }
}

export async function getGasPrice(provider = null) {
  if (!provider) {
    return {
      low: '0.000000020',
      medium: '0.000000025',
      high: '0.000000032',
      lowGwei: '20',
      mediumGwei: '25',
      highGwei: '32',
    };
  }
  try {
    const { ethers } = await import('ethers');
    const feeData = await provider.getFeeData();
    const baseGwei = Number(ethers.formatUnits(feeData.gasPrice || 0n, 'gwei'));
    return {
      lowGwei: (baseGwei * 0.8).toFixed(1),
      mediumGwei: baseGwei.toFixed(1),
      highGwei: (baseGwei * 1.3).toFixed(1),
    };
  } catch {
    return { lowGwei: '20', mediumGwei: '25', highGwei: '32' };
  }
}

export async function getTransactions(address) {
  // In production, use Etherscan API or The Graph
  await new Promise(r => setTimeout(r, 1200));
  return MOCK_TRANSACTIONS;
}

export async function sendTransaction({ from, to, amount, provider = null }) {
  // Mock transaction send
  await new Promise(r => setTimeout(r, 3000));

  // Validate address format
  if (!to.startsWith('0x') || to.length !== 42) {
    throw new Error('Invalid recipient address');
  }
  if (isNaN(amount) || parseFloat(amount) <= 0) {
    throw new Error('Invalid amount');
  }

  // Generate mock tx hash
  const randomHex = () => Math.random().toString(16).slice(2);
  const hash = '0x' + Array.from({ length: 8 }, randomHex).join('');

  return {
    hash,
    from,
    to,
    value: amount,
    network: 'Sepolia',
  };
}

export async function resolveENS(name, provider = null) {
  if (!name.endsWith('.eth')) return null;
  if (!provider) return null;
  try {
    const { ethers } = await import('ethers');
    const mainnetProvider = new ethers.JsonRpcProvider('https://mainnet.infura.io/v3/...');
    return await mainnetProvider.resolveName(name);
  } catch {
    return null;
  }
}

export async function connectMetaMask() {
  if (!window.ethereum) return null;
  try {
    const { ethers } = await import('ethers');
    const provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send('eth_requestAccounts', []);
    return provider;
  } catch {
    return null;
  }
}
