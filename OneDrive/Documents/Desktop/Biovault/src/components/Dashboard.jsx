import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, QrCode, Clock, Shield, ChevronRight, LogOut,
  RefreshCw, ExternalLink, AlertTriangle, Cpu, Key,
  TrendingUp, Wallet, Home, Settings, Bell
} from 'lucide-react';
import { useBioVault } from '../context/BioVaultContext';
import { BalanceCounter, Skeleton, ThemeToggle } from './ui';
import { getTransactions, truncateAddress, truncateHash, etherscanTxUrl, etherscanAddressUrl } from '../utils/blockchain';
import SendModal from './SendModal';
import ReceiveModal from './ReceiveModal';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  Success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  Pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  Failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

// ─── Action Card ──────────────────────────────────────────────────────────────
function ActionCard({ icon: Icon, label, sublabel, onClick, id, gradient, iconBg }) {
  return (
    <motion.button
      id={id}
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="glass-card p-5 text-left w-full transition-all duration-300 hover:shadow-2xl group"
    >
      <div className={`w-12 h-12 rounded-2xl ${iconBg} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
        <Icon className="w-6 h-6 text-white"/>
      </div>
      <p className="font-semibold text-biovault-navy dark:text-white text-sm">{label}</p>
      {sublabel && <p className="text-xs text-biovault-slate dark:text-gray-400 mt-0.5">{sublabel}</p>}
      <ChevronRight className="w-4 h-4 text-biovault-slate dark:text-gray-500 mt-2 group-hover:translate-x-1 transition-transform"/>
    </motion.button>
  );
}

// ─── Transaction Row ──────────────────────────────────────────────────────────
function TxRow({ tx, index }) {
  return (
    <motion.tr
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="border-b border-gray-100 dark:border-gray-800 hover:bg-blue-50/50 dark:hover:bg-white/5 transition-colors"
    >
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            tx.type === 'sent'
              ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'
              : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
          }`}>
            {tx.type === 'sent' ? '↑ Sent' : '↓ Recv'}
          </span>
          <a
            href={etherscanTxUrl(tx.hash)}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-xs text-blue-500 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1"
          >
            {truncateHash(tx.hash, 8, 4)}
            <ExternalLink className="w-3 h-3"/>
          </a>
        </div>
      </td>
      <td className="py-3 px-4">
        <span className={`font-semibold text-sm ${tx.type === 'sent' ? 'text-orange-600 dark:text-orange-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
          {tx.type === 'sent' ? '-' : '+'}{tx.value} ETH
        </span>
      </td>
      <td className="py-3 px-4">
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLORS[tx.status] || STATUS_COLORS.Pending}`}>
          {tx.status}
        </span>
      </td>
      <td className="py-3 px-4 text-xs text-biovault-slate dark:text-gray-400 hidden sm:table-cell">
        {formatRelativeTime(tx.timestamp)}
      </td>
    </motion.tr>
  );
}

function formatRelativeTime(ts) {
  const diff = Date.now() - ts;
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

// ─── Skeleton rows ─────────────────────────────────────────────────────────────
function TxSkeleton() {
  return (
    <tr className="border-b border-gray-100 dark:border-gray-800">
      {[1,2,3,4].map(i => (
        <td key={i} className="py-4 px-4">
          <div className="skeleton h-4 rounded-lg" style={{ width: `${60 + i * 10}%` }}/>
        </td>
      ))}
    </tr>
  );
}

// ─── Security Status Card ─────────────────────────────────────────────────────
function SecurityCard() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="glass-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-biovault-navy dark:text-white text-sm flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-500"/>
          Security Status
        </h3>
        <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
          Secure
        </span>
      </div>

      <div className="space-y-3">
        {[
          { icon: '✅', label: 'Hardware-Backed Biometric', value: 'Active', color: 'text-emerald-600 dark:text-emerald-400' },
          { icon: '🔐', label: 'Authenticator', value: 'TPM / Secure Enclave', color: 'text-blue-600 dark:text-blue-400' },
          { icon: '🔑', label: 'Recovery Method', value: 'Device + PIN', color: 'text-purple-600 dark:text-purple-400' },
          { icon: '🌐', label: 'Network', value: 'Sepolia Testnet', color: 'text-orange-600 dark:text-orange-400' },
        ].map(item => (
          <div key={item.label} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
            <div className="flex items-center gap-2">
              <span className="text-base">{item.icon}</span>
              <span className="text-xs text-biovault-slate dark:text-gray-400">{item.label}</span>
            </div>
            <span className={`text-xs font-semibold ${item.color}`}>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Fallback Recovery Card ───────────────────────────────────────────────────
function FallbackCard() {
  const [open, setOpen] = useState(false);

  const options = [
    { label: 'Re-register Device', icon: '📲', desc: 'Register a new biometric on this device' },
    { label: 'PIN Fallback', icon: '🔢', desc: 'Use your backup PIN to access wallet' },
    { label: 'Trusted Device Recovery', icon: '🔗', desc: 'Recover via a previously paired device' },
  ];

  return (
    <div className="glass-card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-biovault-fallback/30 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-red-500"/>
          </div>
          <div>
            <p className="text-sm font-semibold text-biovault-navy dark:text-white">Fallback Recovery</p>
            <p className="text-xs text-biovault-slate dark:text-gray-400">Biometric not working?</p>
          </div>
        </div>
        <motion.div animate={{ rotate: open ? 90 : 0 }}>
          <ChevronRight className="w-5 h-5 text-gray-400"/>
        </motion.div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-2">
              {options.map(opt => (
                <button
                  key={opt.label}
                  onClick={() => toast(`${opt.label} – Coming soon in production version`, { icon: '🔧' })}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left border border-gray-100 dark:border-gray-800"
                >
                  <span className="text-xl">{opt.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-biovault-navy dark:text-white">{opt.label}</p>
                    <p className="text-xs text-biovault-slate dark:text-gray-400">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Mobile Bottom Nav ────────────────────────────────────────────────────────
function MobileNav({ active, onChange }) {
  const items = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'send', icon: Send, label: 'Send' },
    { id: 'receive', icon: QrCode, label: 'Receive' },
    { id: 'history', icon: Clock, label: 'History' },
  ];

  return (
    <div className="mobile-bottom-nav glass-card rounded-none border-t border-gray-200 dark:border-gray-800 px-4 py-2 md:hidden">
      <div className="flex justify-around">
        {items.map(item => (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={`flex flex-col items-center gap-0.5 p-2 rounded-xl transition-colors ${
              active === item.id
                ? 'text-blue-500'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
            }`}
          >
            <item.icon className="w-5 h-5"/>
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const { wallet, balance, deviceName, theme, toggleTheme, logout, refreshBalance } = useBioVault();
  const [transactions, setTransactions] = useState([]);
  const [txLoading, setTxLoading] = useState(true);
  const [sendOpen, setSendOpen] = useState(false);
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [mobileActive, setMobileActive] = useState('home');

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    setTxLoading(true);
    const txs = await getTransactions(wallet?.address);
    setTransactions(txs);
    setTxLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshBalance();
    await loadTransactions();
    setRefreshing(false);
    toast.success('Data refreshed');
  };

  const handleMobileAction = (action) => {
    setMobileActive(action);
    if (action === 'send') setSendOpen(true);
    if (action === 'receive') setReceiveOpen(true);
    if (action === 'home') { setSendOpen(false); setReceiveOpen(false); }
  };

  return (
    <div className="min-h-screen bg-biovault-bg dark:bg-biovault-bg-dark bg-mesh pb-24 md:pb-0">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-400/5 rounded-full blur-3xl"/>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-400/5 rounded-full blur-3xl"/>
      </div>

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-40 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border-b border-white/40 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center shadow-md">
              <Shield className="w-5 h-5 text-white"/>
            </div>
            <div>
              <h1 className="font-bold text-biovault-navy dark:text-white text-base leading-tight">BioVault</h1>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"/>
                <span className="text-xs text-biovault-slate dark:text-gray-400">Sepolia Testnet</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              className="btn-ghost p-2 rounded-xl"
              aria-label="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}/>
            </button>
            <ThemeToggle theme={theme} onToggle={toggleTheme}/>
            <button
              onClick={() => { logout(); toast('Logged out successfully'); }}
              className="btn-ghost p-2 rounded-xl text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4"/>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 page-transition">
        {/* ── GREETING + BALANCE ── */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Balance Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 glass-card p-6 relative overflow-hidden"
          >
            {/* Decorative glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"/>

            <div className="relative">
              <p className="text-sm text-biovault-slate dark:text-gray-400">Welcome back, <span className="font-semibold text-biovault-navy dark:text-white">{deviceName}</span> 👋</p>

              <div className="mt-4">
                <p className="text-xs font-medium text-biovault-slate dark:text-gray-500 uppercase tracking-widest mb-1">Total Balance</p>
                <div className="flex items-end gap-3">
                  <h2 className="text-5xl font-bold text-biovault-navy dark:text-white tracking-tight">
                    {balance !== null ? (
                      <BalanceCounter value={balance}/>
                    ) : (
                      <Skeleton className="w-48"/>
                    )}
                  </h2>
                  <span className="text-xl font-semibold text-biovault-slate dark:text-gray-400 mb-1">ETH</span>
                </div>
                {balance && (
                  <p className="text-sm text-biovault-slate dark:text-gray-400 mt-1">
                    ≈ ${(parseFloat(balance) * 2200).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                  </p>
                )}
              </div>

              <div className="mt-6 flex items-center gap-3">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"/>
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Sepolia Testnet</span>
                </div>
                {wallet?.address && (
                  <a
                    href={etherscanAddressUrl(wallet.address)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-biovault-slate dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                  >
                    <span className="font-mono">{truncateAddress(wallet.address)}</span>
                    <ExternalLink className="w-3 h-3"/>
                  </a>
                )}
              </div>
            </div>
          </motion.div>

          {/* Security Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <SecurityCard/>
          </motion.div>
        </section>

        {/* ── ACTION BUTTONS ── */}
        <section>
          <h2 className="text-sm font-semibold text-biovault-slate dark:text-gray-400 uppercase tracking-wider mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <ActionCard
              id="send-action-card"
              icon={Send}
              label="Send ETH"
              sublabel="Biometric verified transfer"
              onClick={() => setSendOpen(true)}
              iconBg="bg-gradient-to-br from-blue-500 to-blue-600"
            />
            <ActionCard
              id="receive-action-card"
              icon={QrCode}
              label="Receive ETH"
              sublabel="Show QR code or address"
              onClick={() => setReceiveOpen(true)}
              iconBg="bg-gradient-to-br from-emerald-500 to-teal-600"
            />
            <ActionCard
              id="history-action-card"
              icon={TrendingUp}
              label="Transaction History"
              sublabel="View all past transactions"
              onClick={() => document.getElementById('tx-history')?.scrollIntoView({ behavior: 'smooth' })}
              iconBg="bg-gradient-to-br from-purple-500 to-indigo-600"
            />
          </div>
        </section>

        {/* ── TRANSACTION HISTORY + FALLBACK ── */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Transaction table */}
          <div id="tx-history" className="lg:col-span-2">
            <div className="glass-card overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
                <h2 className="font-semibold text-biovault-navy dark:text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-biovault-slate dark:text-gray-400"/>
                  Recent Transactions
                </h2>
                <a
                  href={wallet?.address ? etherscanAddressUrl(wallet.address) : '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-500 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1"
                >
                  View all on Etherscan
                  <ExternalLink className="w-3 h-3"/>
                </a>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-biovault-slate dark:text-gray-400 uppercase tracking-wider">Hash</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-biovault-slate dark:text-gray-400 uppercase tracking-wider">Amount</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-biovault-slate dark:text-gray-400 uppercase tracking-wider">Status</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-biovault-slate dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {txLoading
                      ? Array.from({ length: 4 }).map((_, i) => <TxSkeleton key={i}/>)
                      : transactions.map((tx, i) => <TxRow key={tx.hash} tx={tx} index={i}/>)
                    }
                  </tbody>
                </table>
                {!txLoading && transactions.length === 0 && (
                  <div className="py-12 text-center text-biovault-slate dark:text-gray-400">
                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-30"/>
                    <p>No transactions yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <FallbackCard/>

            {/* Quick stats */}
            <div className="glass-card p-5 space-y-4">
              <h3 className="font-semibold text-biovault-navy dark:text-white text-sm flex items-center gap-2">
                <Wallet className="w-4 h-4 text-biovault-slate dark:text-gray-400"/>
                Wallet Info
              </h3>
              {[
                { label: 'Network', value: 'Sepolia', icon: '🌐' },
                { label: 'Auth Method', value: 'FIDO2/WebAuthn', icon: '🔑' },
                { label: 'Seed Phrase', value: 'Not Required', icon: '✅' },
                { label: 'Standard', value: 'ERC-4337', icon: '📋' },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{s.icon}</span>
                    <span className="text-xs text-biovault-slate dark:text-gray-400">{s.label}</span>
                  </div>
                  <span className="text-xs font-semibold text-biovault-navy dark:text-white">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Mobile bottom nav */}
      <MobileNav active={mobileActive} onChange={handleMobileAction}/>

      {/* Modals */}
      <AnimatePresence>
        {sendOpen && <SendModal onClose={() => { setSendOpen(false); setMobileActive('home'); }}/>}
        {receiveOpen && <ReceiveModal onClose={() => { setReceiveOpen(false); setMobileActive('home'); }}/>}
      </AnimatePresence>
    </div>
  );
}
