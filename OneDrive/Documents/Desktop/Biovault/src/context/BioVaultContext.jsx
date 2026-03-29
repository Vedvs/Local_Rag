import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { registerBiometric, authenticateWithBiometric } from '../utils/webauthn';
import { generateWalletFromCredential, getBalance, connectMetaMask } from '../utils/blockchain';

const BioVaultContext = createContext(null);

export function BioVaultProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('biovault-theme') || 'light';
  });
  const [page, setPage] = useState('landing'); // landing | register | dashboard
  const [wallet, setWallet] = useState(null);
  const [credentialId, setCredentialId] = useState(() => {
    return localStorage.getItem('biovault-credential-id') || null;
  });
  const [balance, setBalance] = useState(null);
  const [provider, setProvider] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [deviceName, setDeviceName] = useState('Your Device');

  // Apply theme
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.setItem('biovault-theme', theme);
  }, [theme]);

  // Auto-login if credential exists
  useEffect(() => {
    if (credentialId) {
      setPage('dashboard');
      restoreWallet(credentialId);
    }
  }, []);

  const restoreWallet = async (credId) => {
    const w = await generateWalletFromCredential(credId);
    setWallet(w);
    const bal = await getBalance(w.address, null);
    setBalance(bal);
    // Try MetaMask
    const p = await connectMetaMask();
    if (p) setProvider(p);
    // Detect device name from user agent
    const ua = navigator.userAgent;
    if (/iPhone/.test(ua)) setDeviceName('iPhone');
    else if (/iPad/.test(ua)) setDeviceName('iPad');
    else if (/Android/.test(ua)) setDeviceName('Android Device');
    else if (/Windows/.test(ua)) setDeviceName('Windows PC');
    else if (/Mac/.test(ua)) setDeviceName('MacBook');
    else setDeviceName('Your Device');
  };

  const register = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await registerBiometric('BioVaultUser');
      const w = await generateWalletFromCredential(result.credentialId);
      setWallet(w);
      setCredentialId(result.credentialId);
      localStorage.setItem('biovault-credential-id', result.credentialId);
      const bal = await getBalance(w.address, null);
      setBalance(bal);
      await restoreWallet(result.credentialId);
      return { success: true, wallet: w, isMock: result.isMock };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async () => {
    setIsLoading(true);
    try {
      if (!credentialId) throw new Error('No registered credential found. Please register first.');
      const result = await authenticateWithBiometric(credentialId);
      await restoreWallet(result.credentialId || credentialId);
      setPage('dashboard');
      return { success: true, isMock: result.isMock };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, [credentialId]);

  const logout = useCallback(() => {
    setWallet(null);
    setBalance(null);
    setCredentialId(null);
    localStorage.removeItem('biovault-credential-id');
    setPage('landing');
  }, []);

  const refreshBalance = useCallback(async () => {
    if (!wallet) return;
    const bal = await getBalance(wallet.address, provider);
    setBalance(bal);
  }, [wallet, provider]);

  const toggleTheme = useCallback(() => {
    setTheme(t => t === 'light' ? 'dark' : 'light');
  }, []);

  const value = {
    theme,
    toggleTheme,
    page,
    setPage,
    wallet,
    credentialId,
    balance,
    provider,
    isLoading,
    deviceName,
    register,
    login,
    logout,
    refreshBalance,
    hasCredential: !!credentialId,
  };

  return (
    <BioVaultContext.Provider value={value}>
      {children}
    </BioVaultContext.Provider>
  );
}

export function useBioVault() {
  const ctx = useContext(BioVaultContext);
  if (!ctx) throw new Error('useBioVault must be used inside BioVaultProvider');
  return ctx;
}
