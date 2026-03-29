/**
 * WebAuthn / FIDO2 utility functions
 * Provides both real WebAuthn calls and graceful mock fallbacks for demo.
 */

const MOCK_CREDENTIAL_ID = 'biovault-mock-credential-2024';

// ─── Helpers ────────────────────────────────────────────────────────────────

function base64URLToBuffer(base64URL) {
  const base64 = base64URL.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
  const binary = atob(padded);
  const buffer = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) buffer[i] = binary.charCodeAt(i);
  return buffer.buffer;
}

function bufferToBase64URL(buffer) {
  const bytes = new Uint8Array(buffer);
  let str = '';
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function generateRandomBytes(length = 32) {
  const arr = new Uint8Array(length);
  crypto.getRandomValues(arr);
  return arr;
}

// ─── Mock fallback (for environments without WebAuthn hardware) ──────────────

async function mockRegister(username) {
  await new Promise(r => setTimeout(r, 2000)); // simulate biometric scan
  const mockId = bufferToBase64URL(generateRandomBytes(32));
  return {
    credentialId: mockId,
    publicKey: bufferToBase64URL(generateRandomBytes(64)),
    isMock: true,
  };
}

async function mockAuthenticate(credentialId) {
  await new Promise(r => setTimeout(r, 2000));
  return {
    credentialId,
    signature: bufferToBase64URL(generateRandomBytes(64)),
    isMock: true,
  };
}

// ─── Real WebAuthn calls ─────────────────────────────────────────────────────

export async function registerBiometric(username = 'BioVaultUser') {
  if (!window.PublicKeyCredential) {
    console.warn('WebAuthn not supported, using mock');
    return mockRegister(username);
  }

  try {
    const challenge = generateRandomBytes(32);
    const userId = generateRandomBytes(16);

    const publicKeyOptions = {
      challenge,
      rp: {
        name: 'BioVault',
        id: window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname,
      },
      user: {
        id: userId,
        name: username,
        displayName: username,
      },
      pubKeyCredParams: [
        { alg: -7,  type: 'public-key' }, // ES256
        { alg: -257, type: 'public-key' }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        residentKey: 'preferred',
      },
      timeout: 60000,
      attestation: 'none',
    };

    const credential = await navigator.credentials.create({ publicKey: publicKeyOptions });

    return {
      credentialId: bufferToBase64URL(credential.rawId),
      publicKey: bufferToBase64URL(credential.response.getPublicKey?.() ?? new ArrayBuffer(0)),
      isMock: false,
    };
  } catch (err) {
    console.warn('WebAuthn register failed, falling back to mock:', err.message);
    return mockRegister(username);
  }
}

export async function authenticateWithBiometric(credentialId) {
  if (!window.PublicKeyCredential) {
    return mockAuthenticate(credentialId);
  }

  try {
    const challenge = generateRandomBytes(32);

    const assertionOptions = {
      challenge,
      allowCredentials: credentialId
        ? [{
            id: base64URLToBuffer(credentialId),
            type: 'public-key',
            transports: ['internal', 'hybrid'],
          }]
        : [],
      userVerification: 'required',
      timeout: 60000,
    };

    const assertion = await navigator.credentials.get({ publicKey: assertionOptions });

    return {
      credentialId: bufferToBase64URL(assertion.rawId),
      signature: bufferToBase64URL(assertion.response.signature),
      isMock: false,
    };
  } catch (err) {
    console.warn('WebAuthn auth failed, falling back to mock:', err.message);
    return mockAuthenticate(credentialId);
  }
}

export function isWebAuthnSupported() {
  return !!window.PublicKeyCredential;
}
