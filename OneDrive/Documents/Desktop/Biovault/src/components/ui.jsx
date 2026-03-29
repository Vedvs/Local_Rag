import { useState } from 'react';
import { motion } from 'framer-motion';

// ─── Fingerprint SVG Icon with optional animation ─────────────────────────────
export function FingerprintIcon({ className = '', animated = false, size = 80, color = '#60A5FA' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Top arcs */}
      <path d="M40 8C22.3 8 8 22.3 8 40" stroke={color} strokeWidth="2.5" strokeLinecap="round" opacity="0.3"/>
      <path d="M40 14C25.6 14 14 25.6 14 40" stroke={color} strokeWidth="2.5" strokeLinecap="round" opacity="0.5"/>
      <path d="M40 20C28.9 20 20 28.9 20 40" stroke={color} strokeWidth="2.5" strokeLinecap="round" opacity="0.65"/>
      <path d="M40 26C32.3 26 26 32.3 26 40" stroke={color} strokeWidth="2.5" strokeLinecap="round" opacity="0.8"/>
      <path d="M40 32C36 32 32 35.6 32 40" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>

      <path d="M40 8C57.7 8 72 22.3 72 40" stroke={color} strokeWidth="2.5" strokeLinecap="round" opacity="0.3"/>
      <path d="M40 14C54.4 14 66 25.6 66 40" stroke={color} strokeWidth="2.5" strokeLinecap="round" opacity="0.5"/>
      <path d="M40 20C51.1 20 60 28.9 60 40" stroke={color} strokeWidth="2.5" strokeLinecap="round" opacity="0.65"/>
      <path d="M40 26C47.7 26 54 32.3 54 40" stroke={color} strokeWidth="2.5" strokeLinecap="round" opacity="0.8"/>
      <path d="M40 32C44 32 48 35.6 48 40" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>

      {/* Center dot */}
      <circle cx="40" cy="40" r="3" fill={color}/>

      {/* Bottom arcs */}
      <path d="M26 40c0 6 4.2 11.5 10 13.5" stroke={color} strokeWidth="2.5" strokeLinecap="round" opacity="0.8"/>
      <path d="M54 40c0 6-4.2 11.5-10 13.5" stroke={color} strokeWidth="2.5" strokeLinecap="round" opacity="0.8"/>
      <path d="M20 40c0 10 6.5 18.5 16 21.5" stroke={color} strokeWidth="2.5" strokeLinecap="round" opacity="0.65"/>
      <path d="M60 40c0 10-6.5 18.5-16 21.5" stroke={color} strokeWidth="2.5" strokeLinecap="round" opacity="0.65"/>
      <path d="M14 40c0 14.4 10.2 26.5 24 28.5" stroke={color} strokeWidth="2.5" strokeLinecap="round" opacity="0.5"/>
      <path d="M66 40c0 14.4-10.2 26.5-24 28.5" stroke={color} strokeWidth="2.5" strokeLinecap="round" opacity="0.5"/>

      {animated && (
        <line x1="8" y1="40" x2="72" y2="40" stroke="url(#scanGrad)" strokeWidth="1.5" opacity="0.9">
          <animateTransform
            attributeName="transform"
            type="translate"
            from="0 -32"
            to="0 32"
            dur="2s"
            repeatCount="indefinite"
          />
        </line>
      )}
      <defs>
        <linearGradient id="scanGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="transparent"/>
          <stop offset="50%" stopColor={color}/>
          <stop offset="100%" stopColor="transparent"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

// ─── Checkmark Success Animation ──────────────────────────────────────────────
export function SuccessCheckmark({ size = 80 }) {
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="w-full h-full rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30"
      >
        <motion.svg
          viewBox="0 0 40 40"
          fill="none"
          className="w-3/5 h-3/5"
        >
          <motion.path
            d="M8 20 L17 29 L32 12"
            stroke="white"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
          />
        </motion.svg>
      </motion.div>
    </div>
  );
}

// ─── Skeleton Loader ──────────────────────────────────────────────────────────
export function Skeleton({ className = '', lines = 1 }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="skeleton rounded-lg"
          style={{ height: '16px', width: i === lines - 1 && lines > 1 ? '60%' : '100%' }}
        />
      ))}
    </div>
  );
}

// ─── Pulsing Ripple Component ─────────────────────────────────────────────────
export function PulsingRipple({ color = 'rgba(96,165,250,0.4)', children, className = '' }) {
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <span className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping" style={{ backgroundColor: color }}/>
      {children}
    </div>
  );
}

// ─── Gas Gauge ────────────────────────────────────────────────────────────────
export function GasGauge({ selected, onSelect, prices }) {
  const options = [
    { label: 'Low', key: 'low', colorClass: 'bg-emerald-400', pct: 30, gwei: prices?.lowGwei || '20' },
    { label: 'Medium', key: 'medium', colorClass: 'bg-amber-400', pct: 60, gwei: prices?.mediumGwei || '25' },
    { label: 'High', key: 'high', colorClass: 'bg-red-400', pct: 90, gwei: prices?.highGwei || '32' },
  ];

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-biovault-slate dark:text-gray-400 uppercase tracking-wider">Gas Fee</p>
      <div className="grid grid-cols-3 gap-2">
        {options.map(opt => (
          <button
            key={opt.key}
            onClick={() => onSelect(opt.key)}
            className={`relative p-2 rounded-xl border-2 transition-all text-center ${
              selected === opt.key
                ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/30'
                : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
            }`}
          >
            <p className="text-[10px] font-semibold text-biovault-slate dark:text-gray-400">{opt.label}</p>
            <p className="text-xs font-bold text-biovault-navy dark:text-white">{opt.gwei} Gwei</p>
            <div className="mt-1 h-1 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
              <div className={`h-full rounded-full gas-bar ${opt.colorClass}`} style={{ width: `${opt.pct}%` }}/>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Animated Balance Counter ─────────────────────────────────────────────────
export function BalanceCounter({ value }) {
  const numericValue = parseFloat(value) || 0;

  return (
    <motion.span
      key={value}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      {numericValue.toFixed(4)}
    </motion.span>
  );
}

// ─── Theme Toggle Button ──────────────────────────────────────────────────────
export function ThemeToggle({ theme, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className="relative w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
      style={{ backgroundColor: theme === 'dark' ? '#3B82F6' : '#CBD5E0' }}
      aria-label="Toggle theme"
    >
      <motion.div
        layout
        className="absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center text-xs"
        animate={{ x: theme === 'dark' ? 28 : 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        {theme === 'dark' ? '🌙' : '☀️'}
      </motion.div>
    </button>
  );
}

// ─── Copy Button ──────────────────────────────────────────────────────────────
export function CopyButton({ text, className = '' }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all duration-200 ${
        copied
          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
          : 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/20'
      } ${className}`}
    >
      {copied ? '✓ Copied!' : '⎘ Copy'}
    </button>
  );
}
