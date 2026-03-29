import { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Fingerprint, Shield, Zap, Lock, Globe, ChevronDown, Moon, Sun } from 'lucide-react';
import { useBioVault } from '../context/BioVaultContext';
import { FingerprintIcon, ThemeToggle } from './ui';
import toast from 'react-hot-toast';

// ─── Animated Background Orb ─────────────────────────────────────────────────
function GlowOrb({ delay = 0, color = '#60A5FA', size = 300, x, y }) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: size,
        height: size,
        left: x,
        top: y,
        background: `radial-gradient(circle, ${color}20 0%, transparent 70%)`,
        filter: 'blur(40px)',
      }}
      animate={{
        scale: [1, 1.2, 1],
        opacity: [0.4, 0.7, 0.4],
      }}
      transition={{
        duration: 6,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
}

// ─── Feature Card ─────────────────────────────────────────────────────────────
function FeatureCard({ icon, title, description, gradient, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ y: -6, scale: 1.02 }}
      className="glass-card p-6 space-y-4"
    >
      <div className={`w-12 h-12 rounded-2xl ${gradient} flex items-center justify-center shadow-lg`}>
        {icon}
      </div>
      <h3 className="font-semibold text-biovault-navy dark:text-white">{title}</h3>
      <p className="text-sm text-biovault-slate dark:text-gray-400 leading-relaxed">{description}</p>
    </motion.div>
  );
}

// ─── Animated Fingerprint Orb ─────────────────────────────────────────────────
function HeroOrb() {
  return (
    <div className="relative flex items-center justify-center" style={{ width: 280, height: 280 }}>
      {/* Outer glow rings */}
      <motion.div
        className="absolute inset-0 rounded-full border border-blue-400/20"
        animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.5, 0.2] }}
        transition={{ duration: 4, repeat: Infinity }}
      />
      <motion.div
        className="absolute rounded-full border border-emerald-400/20"
        style={{ inset: 20 }}
        animate={{ scale: [1, 1.08, 1], opacity: [0.2, 0.5, 0.2] }}
        transition={{ duration: 4, delay: 0.5, repeat: Infinity }}
      />
      <motion.div
        className="absolute rounded-full border border-blue-400/15"
        style={{ inset: 40 }}
        animate={{ scale: [1, 1.06, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 4, delay: 1, repeat: Infinity }}
      />

      {/* Rotating outer ring */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'conic-gradient(from 0deg, #60A5FA, #34D399, #60A5FA)',
          WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 2px), white calc(100% - 2px))',
          mask: 'radial-gradient(farthest-side, transparent calc(100% - 2px), white calc(100% - 2px))',
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
      />

      {/* Center orb */}
      <motion.div
        className="absolute rounded-full"
        style={{
          inset: 15,
          background: 'radial-gradient(circle at 35% 35%, rgba(96,165,250,0.3), rgba(52,211,153,0.15), transparent)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.2)',
        }}
        animate={{ scale: [1, 1.03, 1] }}
        transition={{ duration: 3, repeat: Infinity }}
      />

      {/* Core glass sphere */}
      <motion.div
        className="absolute rounded-full flex items-center justify-center"
        style={{
          inset: 30,
          background: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(96,165,250,0.1) 50%, rgba(52,211,153,0.1) 100%)',
          backdropFilter: 'blur(30px)',
          border: '1px solid rgba(255,255,255,0.3)',
          boxShadow: '0 0 60px rgba(96,165,250,0.25), inset 0 0 30px rgba(255,255,255,0.1)',
        }}
        animate={{ scale: [1, 1.04, 1] }}
        transition={{ duration: 3.5, repeat: Infinity }}
      >
        <motion.div
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 2.5, repeat: Infinity }}
        >
          <FingerprintIcon size={90} animated={true} color="#60A5FA"/>
        </motion.div>
      </motion.div>

      {/* Ripple rings */}
      {[0, 0.6, 1.2].map((delay, i) => (
        <motion.div
          key={i}
          className="absolute inset-0 rounded-full border border-blue-400/30"
          animate={{
            scale: [1, 1.5 + i * 0.2],
            opacity: [0.5, 0],
          }}
          transition={{
            duration: 2.5,
            delay,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
}

// ─── Stat Counter ─────────────────────────────────────────────────────────────
function StatItem({ value, label }) {
  return (
    <div className="text-center">
      <p className="text-2xl font-bold text-gradient">{value}</p>
      <p className="text-xs text-biovault-slate dark:text-gray-400 mt-0.5">{label}</p>
    </div>
  );
}

// ─── Landing Page ─────────────────────────────────────────────────────────────
export default function LandingPage() {
  const { login, setPage, theme, toggleTheme, hasCredential, isLoading } = useBioVault();
  const [loginLoading, setLoginLoading] = useState(false);

  const handleLogin = async () => {
    setLoginLoading(true);
    const result = await login();
    setLoginLoading(false);
    if (result.success) {
      toast.success('Welcome back! 🎉');
    } else {
      toast.error(result.error || 'Authentication failed');
    }
  };

  const FEATURES = [
    {
      icon: <Fingerprint className="w-6 h-6 text-white"/>,
      title: 'Biometric Authentication',
      description: 'Your fingerprint or Face ID secures every transaction. Hardware-backed security via TPM or Secure Enclave.',
      gradient: 'bg-gradient-to-br from-blue-500 to-blue-600',
      delay: 0.15,
    },
    {
      icon: <Shield className="w-6 h-6 text-white"/>,
      title: 'Zero Seed Phrases',
      description: 'No more backup phrases to lose or get stolen. Your biometric credential replaces all that complexity.',
      gradient: 'bg-gradient-to-br from-emerald-500 to-teal-600',
      delay: 0.25,
    },
    {
      icon: <Globe className="w-6 h-6 text-white"/>,
      title: 'Decentralized & Trustless',
      description: 'Built on Ethereum with account abstraction (ERC-4337). You own your keys—no custodian can touch your funds.',
      gradient: 'bg-gradient-to-br from-purple-500 to-indigo-600',
      delay: 0.35,
    },
    {
      icon: <Zap className="w-6 h-6 text-white"/>,
      title: 'Instant Transactions',
      description: 'One-tap biometric signing sends transactions in seconds. Ultra-low latency powered by optimized gas estimation.',
      gradient: 'bg-gradient-to-br from-amber-500 to-orange-600',
      delay: 0.45,
    },
    {
      icon: <Lock className="w-6 h-6 text-white"/>,
      title: 'FIDO2 / WebAuthn',
      description: 'Industry-standard passkey technology. The same protocol used by Google, Apple, and Microsoft for enterprise security.',
      gradient: 'bg-gradient-to-br from-pink-500 to-rose-600',
      delay: 0.55,
    },
    {
      icon: <span className="text-white text-xl">⛓️</span>,
      title: 'Multi-chain Ready',
      description: 'Currently live on Ethereum Sepolia. Expanding to Polygon, Arbitrum, and Base—your biometric works across all chains.',
      gradient: 'bg-gradient-to-br from-cyan-500 to-blue-600',
      delay: 0.65,
    },
  ];

  return (
    <div className="min-h-screen bg-biovault-bg dark:bg-biovault-bg-dark overflow-x-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <GlowOrb color="#60A5FA" size={500} x="-10%" y="-10%" delay={0}/>
        <GlowOrb color="#34D399" size={400} x="60%" y="20%" delay={2}/>
        <GlowOrb color="#818CF8" size={350} x="30%" y="60%" delay={4}/>
        <GlowOrb color="#60A5FA" size={300} x="80%" y="70%" delay={1.5}/>

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06]"
          style={{
            backgroundImage: `linear-gradient(rgba(96,165,250,1) 1px, transparent 1px), linear-gradient(90deg, rgba(96,165,250,1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center">
              <Shield className="w-4 h-4 text-white"/>
            </div>
            <span className="font-bold text-biovault-navy dark:text-white">BioVault</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4"
          >
            <ThemeToggle theme={theme} onToggle={toggleTheme}/>
            <a href="https://sepolia.etherscan.io" target="_blank" rel="noopener noreferrer"
              className="hidden sm:flex text-xs btn-ghost border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-1.5">
              Sepolia Explorer ↗
            </a>
          </motion.div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="min-h-screen flex flex-col items-center justify-center text-center px-6 pt-24 pb-12 relative">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card text-sm font-medium text-biovault-slate dark:text-gray-300 shadow-sm"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"/>
          Powered by WebAuthn · FIDO2 Certified · Ethereum Sepolia
        </motion.div>

        {/* Fingerprint Orb */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 100 }}
          className="mb-10"
        >
          <HeroOrb/>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="max-w-3xl"
        >
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-biovault-navy dark:text-white leading-tight tracking-tight">
            BioVault
            <br/>
            <span className="text-gradient">Your Fingerprint is</span>
            <br/>
            <span className="text-gradient">Your Key</span>
          </h1>
        </motion.div>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="mt-6 text-lg sm:text-xl text-biovault-slate dark:text-gray-400 max-w-2xl leading-relaxed"
        >
          The first decentralized wallet secured by your biometrics.{' '}
          <strong className="text-biovault-navy dark:text-white">No seed phrases.</strong>{' '}
          <strong className="text-biovault-navy dark:text-white">No private keys to lose.</strong>{' '}
          Just your fingerprint or face, backed by hardware security.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="mt-10 flex flex-col sm:flex-row items-center gap-4"
        >
          <motion.button
            id="create-wallet-btn"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setPage('register')}
            className="relative group btn-primary text-lg px-10 py-4 fingerprint-glow"
          >
            <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500 to-emerald-500 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500"/>
            <span className="relative flex items-center gap-3">
              <Shield className="w-6 h-6"/>
              Create New Wallet
            </span>
          </motion.button>

          {hasCredential ? (
            <motion.button
              id="login-biometric-btn"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleLogin}
              disabled={loginLoading}
              className="relative group text-lg px-10 py-4 rounded-xl font-semibold border-2 border-blue-400/50 text-biovault-navy dark:text-white bg-white/50 dark:bg-white/5 backdrop-blur-sm hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-all duration-300 disabled:opacity-60 flex items-center gap-3"
            >
              {loginLoading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full"
                  />
                  Verifying...
                </>
              ) : (
                <>
                  <FingerprintIcon size={26} color="#60A5FA"/>
                  Login with Biometric
                </>
              )}
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => toast('Register first to enable biometric login', { icon: '💡' })}
              className="text-lg px-10 py-4 rounded-xl font-semibold border-2 border-gray-200 dark:border-gray-700 text-biovault-slate dark:text-gray-400 bg-white/50 dark:bg-white/5 backdrop-blur-sm hover:border-blue-400/50 transition-all duration-300 flex items-center gap-3"
            >
              <FingerprintIcon size={26} color="#94a3b8"/>
              Login with Biometric
            </motion.button>
          )}
        </motion.div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-12 flex flex-wrap justify-center gap-6"
        >
          {[
            { icon: '🔐', text: 'Hardware-Backed Security' },
            { icon: '⛓️', text: 'Ethereum Sepolia' },
            { icon: '🌐', text: 'WebAuthn / FIDO2' },
            { icon: '🛡️', text: 'Passkey Standard' },
          ].map(badge => (
            <div key={badge.text} className="flex items-center gap-2 text-sm text-biovault-slate dark:text-gray-400">
              <span>{badge.icon}</span>
              <span>{badge.text}</span>
            </div>
          ))}
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-biovault-slate dark:text-gray-500"
          >
            <ChevronDown className="w-6 h-6"/>
          </motion.div>
        </motion.div>
      </section>

      {/* ── STATS ── */}
      <section className="py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card p-8"
          >
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 divide-x divide-gray-200 dark:divide-gray-700">
              <StatItem value="0%" label="Seed Phrases Needed"/>
              <StatItem value="<1s" label="Auth Speed"/>
              <StatItem value="FIDO2" label="Security Standard"/>
              <StatItem value="∞" label="Hardware Security"/>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-biovault-navy dark:text-white">
              Why <span className="text-gradient">BioVault</span>?
            </h2>
            <p className="text-biovault-slate dark:text-gray-400 mt-3 max-w-xl mx-auto">
              Built for the next generation of crypto users who want security without complexity.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(f => (
              <FeatureCard key={f.title} {...f}/>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-16 px-6 bg-gradient-to-b from-transparent to-biovault-primary/20 dark:to-blue-900/10">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-biovault-navy dark:text-white">
              How It <span className="text-gradient">Works</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { step: '01', title: 'Register', desc: 'Tap "Create Wallet" and authenticate with your device's fingerprint or Face ID. Your biometric never leaves your device.', icon: '👆' },
              { step: '02', title: 'Wallet Created', desc: 'A unique Ethereum wallet address is derived from your biometric credential ID using cryptographic key derivation.', icon: '🔐' },
              { step: '03', title: 'Transact Freely', desc: 'Send and receive ETH with a single touch. Every transaction requires biometric verification – no passwords, no phrases.', icon: '⚡' },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="glass-card p-6 relative"
              >
                <div className="text-6xl font-black text-blue-400/10 absolute top-4 right-4">{item.step}</div>
                <div className="text-3xl mb-4">{item.icon}</div>
                <h3 className="font-bold text-biovault-navy dark:text-white mb-2">{item.title}</h3>
                <p className="text-sm text-biovault-slate dark:text-gray-400 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BOTTOM ── */}
      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="glass-card p-10 space-y-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-emerald-500/5"/>
              <h2 className="text-3xl font-bold text-biovault-navy dark:text-white relative">
                Ready to secure your crypto<br/>with just your fingerprint?
              </h2>
              <p className="text-biovault-slate dark:text-gray-400 relative">
                Join the future of decentralized finance. No seed phrases, no complexity—just your biometric.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center relative">
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setPage('register')}
                  className="btn-primary text-base px-8 py-3.5 fingerprint-glow"
                >
                  <Fingerprint className="w-5 h-5"/>
                  Get Started Free
                </motion.button>
                <a
                  href="https://webauthn.guide"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary text-base px-8 py-3.5"
                >
                  Learn about WebAuthn ↗
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-8 px-6 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-biovault-slate dark:text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center">
              <Shield className="w-3 h-3 text-white"/>
            </div>
            <span className="font-semibold text-biovault-navy dark:text-gray-300">BioVault</span>
            <span>© 2024</span>
          </div>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-400"/>
              Powered by WebAuthn
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-400"/>
              Ethereum Sepolia
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"/>
              Hardware-Backed Security
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
