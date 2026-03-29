import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Fingerprint, Shield, Zap, Eye, EyeOff, X, ChevronRight } from 'lucide-react';
import { useBioVault } from '../context/BioVaultContext';
import { FingerprintIcon, SuccessCheckmark } from './ui';
import toast from 'react-hot-toast';

const STEPS = ['Biometric', 'On-Chain', 'Complete'];

export default function RegisterPage() {
  const { register, setPage, wallet } = useBioVault();
  const [step, setStep] = useState(0); // 0=ready, 1=scanning, 2=onchain, 3=done
  const [isMock, setIsMock] = useState(false);
  const [localWallet, setLocalWallet] = useState(null);
  const [error, setError] = useState(null);
  const [showAddress, setShowAddress] = useState(false);

  const handleRegister = async () => {
    setError(null);
    setStep(1);

    const result = await register();
    if (!result.success) {
      setStep(0);
      setError(result.error || 'Registration failed. Please try again.');
      toast.error('Registration failed');
      return;
    }

    setIsMock(result.isMock);
    setStep(2);
    await new Promise(r => setTimeout(r, 1500));
    setLocalWallet(result.wallet);
    setStep(3);
    toast.success('Wallet created successfully! 🎉');
  };

  const stepIndex = step === 0 ? -1 : step === 1 ? 0 : step === 2 ? 1 : 2;

  return (
    <div className="min-h-screen bg-biovault-bg dark:bg-biovault-bg-dark flex items-center justify-center p-4 bg-mesh">
      {/* Background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl"/>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl"/>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-md"
      >
        {/* Back button */}
        <button
          onClick={() => setPage('landing')}
          className="absolute -top-12 left-0 btn-ghost text-sm"
        >
          ← Back
        </button>

        <div className="glass-modal p-8 space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-emerald-500 mb-4 shadow-lg shadow-blue-500/30">
              <Shield className="w-8 h-8 text-white"/>
            </div>
            <h1 className="text-2xl font-bold text-biovault-navy dark:text-white">Create BioVault</h1>
            <p className="text-sm text-biovault-slate dark:text-gray-400 mt-1">Register your biometric to secure your wallet</p>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center justify-between">
            {STEPS.map((label, i) => (
              <div key={label} className="flex items-center">
                <div className="flex flex-col items-center gap-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 ${
                    i < stepIndex + 1
                      ? 'bg-gradient-to-br from-blue-500 to-emerald-500 text-white shadow-lg shadow-blue-500/30'
                      : i === stepIndex + 1
                      ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-500 border-2 border-blue-400'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                  }`}>
                    {i < stepIndex + 1 ? '✓' : i + 1}
                  </div>
                  <span className={`text-[10px] font-medium ${
                    i <= stepIndex ? 'text-blue-500' : 'text-gray-400'
                  }`}>{label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 mb-4 transition-all duration-500 ${
                    i < stepIndex ? 'bg-gradient-to-r from-blue-500 to-emerald-500' : 'bg-gray-200 dark:bg-gray-700'
                  }`}/>
                )}
              </div>
            ))}
          </div>

          {/* Main Content Area */}
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div
                key="ready"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-center space-y-6"
              >
                {/* Fingerprint illustration */}
                <div className="relative flex items-center justify-center py-4">
                  <div className="relative">
                    <motion.div
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    >
                      <FingerprintIcon size={120} color="#60A5FA"/>
                    </motion.div>
                    <div className="absolute inset-0 rounded-full bg-blue-400/10 animate-ping" style={{ animationDuration: '3s' }}/>
                  </div>
                </div>

                <div className="space-y-2">
                  <h2 className="text-lg font-semibold text-biovault-navy dark:text-white">
                    Register Your Biometric
                  </h2>
                  <p className="text-sm text-biovault-slate dark:text-gray-400">
                    Use your device's fingerprint or face recognition to create a hardware-backed wallet. No seed phrases needed.
                  </p>
                </div>

                {/* Features */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  {[
                    { icon: '🔐', label: 'Hardware Backed' },
                    { icon: '⚡', label: 'Instant Auth' },
                    { icon: '🛡️', label: 'No Seed Phrase' },
                  ].map(f => (
                    <div key={f.label} className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20">
                      <div className="text-xl mb-1">{f.icon}</div>
                      <div className="text-[10px] font-medium text-biovault-slate dark:text-gray-400">{f.label}</div>
                    </div>
                  ))}
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                  </div>
                )}

                <button
                  onClick={handleRegister}
                  id="register-biometric-btn"
                  className="w-full btn-primary py-4 text-base fingerprint-glow"
                >
                  <Fingerprint className="w-5 h-5"/>
                  Register Fingerprint / Face ID
                </button>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div
                key="scanning"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-center space-y-6 py-4"
              >
                <div className="relative flex items-center justify-center">
                  <div className="relative w-32 h-32">
                    {/* Ripple rings */}
                    <div className="absolute inset-0 rounded-full border-2 border-blue-400 ripple-ring"/>
                    <div className="absolute inset-0 rounded-full border-2 border-blue-400 ripple-ring" style={{ animationDelay: '0.5s' }}/>
                    <div className="absolute inset-0 rounded-full border-2 border-emerald-400 ripple-ring" style={{ animationDelay: '1s' }}/>
                    <div className="flex items-center justify-center w-full h-full">
                      <FingerprintIcon size={80} animated={true} color="#60A5FA"/>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-lg font-semibold text-biovault-navy dark:text-white">Waiting for Biometric</p>
                  <p className="text-sm text-biovault-slate dark:text-gray-400 mt-1">
                    Touch your fingerprint sensor or look at your camera...
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce"/>
                  <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0.2s' }}/>
                  <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0.4s' }}/>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="onchain"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-center space-y-6 py-4"
              >
                <div className="flex items-center justify-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="w-20 h-20 rounded-full border-4 border-blue-100 border-t-blue-500 dark:border-gray-700 dark:border-t-blue-400"
                  />
                </div>
                <div>
                  <p className="text-lg font-semibold text-biovault-navy dark:text-white">Creating Your Wallet</p>
                  <p className="text-sm text-biovault-slate dark:text-gray-400 mt-1">Deriving your secure address on Sepolia...</p>
                </div>
              </motion.div>
            )}

            {step === 3 && localWallet && (
              <motion.div
                key="done"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-center space-y-5"
              >
                <div className="flex justify-center">
                  <SuccessCheckmark size={80}/>
                </div>

                <div>
                  <p className="text-lg font-semibold text-biovault-navy dark:text-white">Wallet Created! 🎉</p>
                  {isMock && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-1">
                      Demo mode – real WebAuthn hardware not detected
                    </p>
                  )}
                </div>

                {/* Wallet Address */}
                <div className="p-4 rounded-2xl bg-biovault-primary/60 dark:bg-blue-900/30 border border-blue-200/50 dark:border-blue-800/50">
                  <p className="text-xs font-medium text-biovault-slate dark:text-gray-400 mb-2">Your Wallet Address</p>
                  <div className="flex items-center justify-between gap-2">
                    <code className="font-mono text-xs text-biovault-navy dark:text-blue-300 break-all">
                      {showAddress ? localWallet.address : `${localWallet.address.slice(0,14)}...${localWallet.address.slice(-6)}`}
                    </code>
                    <button onClick={() => setShowAddress(!showAddress)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 flex-shrink-0">
                      {showAddress ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                    </button>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => navigator.clipboard.writeText(localWallet.address).then(() => toast.success('Address copied!'))}
                      className="flex-1 text-xs btn-secondary py-2"
                    >
                      ⎘ Copy Address
                    </button>
                    <a
                      href={`https://sepolia.etherscan.io/address/${localWallet.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 text-xs btn-ghost py-2 border border-gray-200 dark:border-gray-700 text-center rounded-xl"
                    >
                      Etherscan ↗
                    </a>
                  </div>
                </div>

                <button
                  onClick={() => setPage('dashboard')}
                  id="go-to-dashboard-btn"
                  className="w-full btn-primary py-4 text-base"
                >
                  Go to Dashboard
                  <ChevronRight className="w-5 h-5"/>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
