import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2 } from 'lucide-react';
import { useBioVault } from '../context/BioVaultContext';
import { FingerprintIcon, SuccessCheckmark, GasGauge } from './ui';
import { authenticateWithBiometric } from '../utils/webauthn';
import { sendTransaction, resolveENS, truncateHash, etherscanTxUrl } from '../utils/blockchain';
import toast from 'react-hot-toast';

export default function SendModal({ onClose }) {
  const { wallet, credentialId, provider, refreshBalance } = useBioVault();

  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [gasLevel, setGasLevel] = useState('medium');
  const [gasPrices] = useState({ lowGwei: '18', mediumGwei: '24', highGwei: '35' });
  const [ensResolved, setEnsResolved] = useState(null);
  const [ensLoading, setEnsLoading] = useState(false);

  const [phase, setPhase] = useState('form'); // form | verify | loading | success | error
  const [txResult, setTxResult] = useState(null);
  const [errors, setErrors] = useState({});

  // ENS resolution
  useEffect(() => {
    if (!toAddress.endsWith('.eth')) {
      setEnsResolved(null);
      return;
    }
    const t = setTimeout(async () => {
      setEnsLoading(true);
      const addr = await resolveENS(toAddress, provider);
      setEnsResolved(addr);
      setEnsLoading(false);
    }, 600);
    return () => clearTimeout(t);
  }, [toAddress, provider]);

  const validate = () => {
    const e = {};
    if (!toAddress) e.to = 'Recipient address is required';
    else if (!toAddress.endsWith('.eth') && (!/^0x[a-fA-F0-9]{40}$/.test(toAddress) && !/^0x[a-fA-F0-9]{39}$/.test(toAddress)))
      e.to = 'Invalid Ethereum address';
    if (!amount) e.amount = 'Amount is required';
    else if (isNaN(amount) || parseFloat(amount) <= 0) e.amount = 'Enter a valid positive amount';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSend = async () => {
    if (!validate()) return;
    setPhase('verify');
  };

  const handleBiometricConfirm = async () => {
    setPhase('loading');
    try {
      // Step 1: Biometric auth
      await authenticateWithBiometric(credentialId);

      // Step 2: Send transaction
      const result = await sendTransaction({
        from: wallet.address,
        to: ensResolved || toAddress,
        amount,
        provider,
      });

      setTxResult(result);
      setPhase('success');
      await refreshBalance();
      toast.success('Transaction sent! 🚀');
    } catch (err) {
      setPhase('error');
      toast.error(err.message || 'Transaction failed');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="glass-modal w-full sm:max-w-md max-h-[95vh] overflow-y-auto modal-scroll"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center">
              <Send className="w-5 h-5 text-white"/>
            </div>
            <div>
              <h2 className="text-lg font-bold text-biovault-navy dark:text-white">Send ETH</h2>
              <p className="text-xs text-biovault-slate dark:text-gray-400">Sepolia Testnet</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost p-2 rounded-xl">
            <X className="w-5 h-5"/>
          </button>
        </div>

        <div className="p-6 space-y-5">
          <AnimatePresence mode="wait">
            {/* ─── FORM ─────────────────────────────────────────────────── */}
            {phase === 'form' && (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                {/* Recipient */}
                <div>
                  <label className="block text-xs font-semibold text-biovault-slate dark:text-gray-400 mb-1.5 uppercase tracking-wider">
                    Recipient Address or ENS
                  </label>
                  <input
                    id="send-to-input"
                    type="text"
                    value={toAddress}
                    onChange={e => setToAddress(e.target.value)}
                    placeholder="0x... or name.eth"
                    className={`w-full px-4 py-3 rounded-xl border font-mono text-sm bg-white/50 dark:bg-white/5 text-biovault-navy dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all ${
                      errors.to ? 'border-red-400' : 'border-gray-200 dark:border-gray-700'
                    }`}
                  />
                  {/* ENS indicator */}
                  {ensLoading && (
                    <p className="text-xs text-blue-500 mt-1 flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin"/> Resolving ENS...
                    </p>
                  )}
                  {ensResolved && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
                      ✓ Resolves to: {ensResolved.slice(0,12)}...{ensResolved.slice(-6)}
                    </p>
                  )}
                  {errors.to && <p className="text-xs text-red-500 mt-1">{errors.to}</p>}
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-xs font-semibold text-biovault-slate dark:text-gray-400 mb-1.5 uppercase tracking-wider">
                    Amount (ETH)
                  </label>
                  <div className="relative">
                    <input
                      id="send-amount-input"
                      type="number"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      placeholder="0.00"
                      min="0"
                      step="0.001"
                      className={`w-full px-4 py-3 pr-16 rounded-xl border text-sm bg-white/50 dark:bg-white/5 text-biovault-navy dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all ${
                        errors.amount ? 'border-red-400' : 'border-gray-200 dark:border-gray-700'
                      }`}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-biovault-slate dark:text-gray-400">
                      ETH
                    </span>
                  </div>
                  {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
                </div>

                {/* Gas Gauge */}
                <GasGauge selected={gasLevel} onSelect={setGasLevel} prices={gasPrices}/>

                {/* From address */}
                <div className="p-3 rounded-xl bg-biovault-primary/50 dark:bg-blue-900/20 border border-blue-200/50 dark:border-blue-800/50">
                  <p className="text-xs text-biovault-slate dark:text-gray-400">Sending from</p>
                  <code className="text-xs font-mono text-biovault-navy dark:text-blue-300">
                    {wallet?.address?.slice(0,12)}...{wallet?.address?.slice(-6)}
                  </code>
                </div>

                <button
                  onClick={handleSend}
                  id="proceed-send-btn"
                  className="w-full btn-primary py-4 text-base"
                >
                  <Send className="w-5 h-5"/>
                  Review Transaction
                </button>
              </motion.div>
            )}

            {/* ─── VERIFY (biometric) ────────────────────────────────────── */}
            {phase === 'verify' && (
              <motion.div
                key="verify"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="text-center space-y-6 py-4"
              >
                {/* Transaction Summary */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-biovault-primary/60 to-biovault-secondary/30 dark:from-blue-900/40 dark:to-emerald-900/20 border border-blue-200/50 dark:border-blue-800/50 text-left space-y-2">
                  <p className="text-xs font-semibold text-biovault-slate dark:text-gray-400 uppercase tracking-wider">Transaction Summary</p>
                  <div className="flex justify-between">
                    <span className="text-sm text-biovault-slate dark:text-gray-400">To</span>
                    <code className="text-sm font-mono text-biovault-navy dark:text-white">
                      {(ensResolved || toAddress).slice(0,10)}...{(ensResolved || toAddress).slice(-6)}
                    </code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-biovault-slate dark:text-gray-400">Amount</span>
                    <span className="text-sm font-bold text-biovault-navy dark:text-white">{amount} ETH</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-biovault-slate dark:text-gray-400">Gas</span>
                    <span className="text-sm text-biovault-slate dark:text-gray-300">{gasPrices[`${gasLevel}Gwei`]} Gwei</span>
                  </div>
                </div>

                {/* Biometric prompt */}
                <div className="relative flex items-center justify-center py-2">
                  <div className="relative w-28 h-28">
                    <div className="absolute inset-0 rounded-full border-2 border-blue-400 ripple-ring"/>
                    <div className="absolute inset-0 rounded-full border-2 border-blue-400 ripple-ring" style={{ animationDelay: '0.5s' }}/>
                    <div className="flex items-center justify-center w-full h-full">
                      <FingerprintIcon size={72} color="#60A5FA"/>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-base font-semibold text-biovault-navy dark:text-white">Verify with Biometric</p>
                  <p className="text-sm text-biovault-slate dark:text-gray-400 mt-1">Confirm transaction using fingerprint or Face ID</p>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setPhase('form')} className="flex-1 btn-secondary">
                    ← Back
                  </button>
                  <button
                    onClick={handleBiometricConfirm}
                    id="confirm-biometric-send-btn"
                    className="flex-1 btn-primary fingerprint-glow"
                  >
                    <FingerprintIcon size={18} color="white"/>
                    Verify & Send
                  </button>
                </div>
              </motion.div>
            )}

            {/* ─── LOADING ───────────────────────────────────────────────── */}
            {phase === 'loading' && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center space-y-6 py-8"
              >
                <div className="flex justify-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                    className="w-20 h-20 rounded-full border-4 border-blue-100 border-t-blue-500 dark:border-gray-700 dark:border-t-blue-400"
                  />
                </div>
                <div>
                  <p className="text-lg font-semibold text-biovault-navy dark:text-white">Broadcasting Transaction</p>
                  <p className="text-sm text-biovault-slate dark:text-gray-400 mt-1">Waiting for biometric verification & network...</p>
                </div>
              </motion.div>
            )}

            {/* ─── SUCCESS ───────────────────────────────────────────────── */}
            {phase === 'success' && txResult && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-5 py-4"
              >
                <div className="flex justify-center">
                  <SuccessCheckmark size={80}/>
                </div>
                <div>
                  <p className="text-lg font-semibold text-biovault-navy dark:text-white">Transaction Sent! 🚀</p>
                  <p className="text-sm text-biovault-slate dark:text-gray-400 mt-1">Your ETH is on its way</p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200/50 dark:border-emerald-800/50 text-left space-y-2">
                  <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Transaction Hash</p>
                  <code className="text-xs font-mono text-biovault-navy dark:text-white break-all">{txResult.hash}</code>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => navigator.clipboard.writeText(txResult.hash).then(() => toast.success('Hash copied!'))}
                      className="flex-1 text-xs btn-ghost border border-gray-200 dark:border-gray-700 py-1.5 rounded-xl"
                    >
                      ⎘ Copy Hash
                    </button>
                    <a
                      href={etherscanTxUrl(txResult.hash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 text-xs text-center btn-ghost border border-gray-200 dark:border-gray-700 py-1.5 rounded-xl"
                    >
                      View on Etherscan ↗
                    </a>
                  </div>
                </div>

                <button onClick={onClose} className="w-full btn-primary py-3">
                  Close
                </button>
              </motion.div>
            )}

            {/* ─── ERROR ─────────────────────────────────────────────────── */}
            {phase === 'error' && (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center space-y-5 py-4"
              >
                <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto">
                  <X className="w-10 h-10 text-red-500"/>
                </div>
                <div>
                  <p className="text-lg font-semibold text-biovault-navy dark:text-white">Transaction Failed</p>
                  <p className="text-sm text-biovault-slate dark:text-gray-400 mt-1">Something went wrong. Please try again.</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={onClose} className="flex-1 btn-secondary">Close</button>
                  <button onClick={() => setPhase('form')} className="flex-1 btn-primary">Try Again</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
