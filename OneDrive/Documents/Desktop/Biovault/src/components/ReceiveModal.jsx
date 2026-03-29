import { motion, AnimatePresence } from 'framer-motion';
import { X, QrCode, Copy, Share2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useBioVault } from '../context/BioVaultContext';
import { CopyButton } from './ui';
import toast from 'react-hot-toast';

export default function ReceiveModal({ onClose }) {
  const { wallet } = useBioVault();
  const address = wallet?.address || '0x0000000000000000000000000000000000000000';

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
        className="glass-modal w-full sm:max-w-md"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
              <QrCode className="w-5 h-5 text-white"/>
            </div>
            <div>
              <h2 className="text-lg font-bold text-biovault-navy dark:text-white">Receive ETH</h2>
              <p className="text-xs text-biovault-slate dark:text-gray-400">Share your address or QR code</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost p-2 rounded-xl">
            <X className="w-5 h-5"/>
          </button>
        </div>

        <div className="px-6 pb-8 space-y-6">
          {/* QR Code */}
          <div className="flex justify-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, type: 'spring', stiffness: 300 }}
              className="relative p-5 rounded-3xl bg-white shadow-xl shadow-blue-500/10 border border-blue-100 dark:border-blue-900"
            >
              {/* Corner decorations */}
              <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-blue-400 rounded-tl-2xl"/>
              <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-blue-400 rounded-tr-2xl"/>
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-emerald-400 rounded-bl-2xl"/>
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-emerald-400 rounded-br-2xl"/>

              <QRCodeSVG
                value={address}
                size={180}
                level="H"
                includeMargin={false}
                bgColor="transparent"
                fgColor="#1E2A47"
                imageSettings={{
                  src: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSI4IiBmaWxsPSIjNjBBNUZBIi8+PC9zdmc+",
                  height: 24,
                  width: 24,
                  excavate: true,
                }}
              />
            </motion.div>
          </div>

          {/* Network badge */}
          <div className="flex justify-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"/>
              Sepolia Testnet
            </span>
          </div>

          {/* Address display */}
          <div className="p-4 rounded-2xl bg-biovault-primary/60 dark:bg-blue-900/30 border border-blue-200/50 dark:border-blue-800/50 space-y-3">
            <p className="text-xs font-semibold text-biovault-slate dark:text-gray-400 uppercase tracking-wider">Wallet Address</p>
            <code className="block text-sm font-mono text-biovault-navy dark:text-blue-300 break-all leading-relaxed">
              {address}
            </code>
            <div className="flex gap-2">
              <button
                onClick={() => navigator.clipboard.writeText(address).then(() => toast.success('Address copied!'))}
                id="copy-address-btn"
                className="flex-1 btn-secondary text-sm py-2 gap-2"
              >
                <Copy className="w-4 h-4"/>
                Copy Address
              </button>
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: 'My BioVault Address', text: address });
                  } else {
                    navigator.clipboard.writeText(address).then(() => toast.success('Address copied for sharing!'));
                  }
                }}
                className="btn-ghost border border-gray-200 dark:border-gray-700 rounded-xl px-3"
              >
                <Share2 className="w-4 h-4"/>
              </button>
            </div>
          </div>

          {/* Warning note */}
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200/50 dark:border-amber-800/50">
            <p className="text-xs text-amber-700 dark:text-amber-400">
              ⚠️ Only send <strong>Sepolia ETH</strong> to this address. Mainnet ETH sent here will be lost.
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
