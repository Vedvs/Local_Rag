import { AnimatePresence, motion } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { BioVaultProvider, useBioVault } from './context/BioVaultContext';
import LandingPage from './components/LandingPage';
import RegisterPage from './components/RegisterPage';
import Dashboard from './components/Dashboard';

// ─── Page Router ──────────────────────────────────────────────────────────────
function Router() {
  const { page } = useBioVault();

  return (
    <AnimatePresence mode="wait">
      {page === 'landing' && (
        <motion.div
          key="landing"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <LandingPage/>
        </motion.div>
      )}
      {page === 'register' && (
        <motion.div
          key="register"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <RegisterPage/>
        </motion.div>
      )}
      {page === 'dashboard' && (
        <motion.div
          key="dashboard"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Dashboard/>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── App Root ─────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BioVaultProvider>
      <Router/>
      <Toaster
        position="top-right"
        gutter={8}
        toastOptions={{
          duration: 4000,
          style: {
            background: 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(96,165,250,0.2)',
            borderRadius: '12px',
            color: '#1E2A47',
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
            fontWeight: '500',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          },
          success: {
            iconTheme: { primary: '#34D399', secondary: 'white' },
          },
          error: {
            iconTheme: { primary: '#F87171', secondary: 'white' },
          },
        }}
      />
    </BioVaultProvider>
  );
}
