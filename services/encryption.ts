// encryption.ts

import { SodiumPlus, X25519PublicKey, X25519SecretKey } from 'sodium-plus';
import { supabase } from './supabase';

let sodium: SodiumPlus | null = null;
async function initSodium() {
  if (!sodium) sodium = await SodiumPlus.auto();
  return sodium!;
}

// --- FIXED KEY MANAGEMENT ---

/**
 * Generates a new key pair, deriving the public key from the secret key
 * to ensure they are a valid pair. It stores the secret key locally
 * and the public key remotely.
 */
export async function generateAndStoreKeyPair() {
  const sodium = await initSodium();
  const { user } = (await supabase.auth.getUser()).data;
  if (!user) throw new Error('User not authenticated');

  console.log('Generating a new key pair for user:', user.id);

  // Generate a keypair object
  const keypair = await sodium.crypto_box_keypair();
  const secretKey = await sodium.crypto_box_secretkey(keypair);
  
  // FIXED: Derive the public key directly from the secret key to guarantee they match.
  const publicKey = await sodium.crypto_box_publickey_from_secretkey(secretKey);

  const secretKeyHex = await sodium.sodium_bin2hex(secretKey.getBuffer());
  const publicKeyHex = await sodium.sodium_bin2hex(publicKey.getBuffer());

  // Store the secret key in the browser's local storage
  localStorage.setItem(`spk_${user.id}`, secretKeyHex);

  // Upload the corresponding public key to the database
  const { error } = await supabase
    .from('public_keys')
    .upsert({ user_id: user.id, public_key: publicKeyHex });

  if (error) throw error;
  return { publicKey, secretKey };
}

/**
 * Retrieves the user's key pair. It treats the locally stored secret key
 * as the single source of truth and derives the public key from it.
 * If no local secret key is found, it generates a new pair.
 */
export async function getKeyPair() {
  const sodium = await initSodium();
  const { user } = (await supabase.auth.getUser()).data;
  if (!user) throw new Error('User not authenticated');

  const secretKeyHex = localStorage.getItem(`spk_${user.id}`);
  if (!secretKeyHex) {
    // If no secret key is stored locally, we have no choice but to generate one.
    return generateAndStoreKeyPair();
  }

  try {
    // We found a secret key. This is our source of truth.
    const secretKeyBuffer = await sodium.sodium_hex2bin(secretKeyHex);
    const secretKey = new X25519SecretKey(secretKeyBuffer);

    // FIXED: Derive the public key from the local secret key. This prevents
    // any desync issues with the key stored in the database.
    const publicKey = await sodium.crypto_box_publickey_from_secretkey(secretKey);
    
    return { publicKey, secretKey };
  } catch (e) {
    // The stored key is corrupted or invalid. Delete it and generate a new one.
    console.error("Failed to process stored secret key, regenerating...", e);
    localStorage.removeItem(`spk_${user.id}`);
    return generateAndStoreKeyPair();
  }
}

export async function getRecipientPublicKey(userId: string): Promise<X25519PublicKey> {
  const { data, error } = await supabase
    .from('public_keys')
    .select('public_key')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    throw new Error(`Could not fetch public key for user ${userId}.`);
  }

  const sodium = await initSodium();
  const publicKeyBuffer = await sodium.sodium_hex2bin(data.public_key);
  return new X25519PublicKey(publicKeyBuffer);
}

// --- ENCRYPTION / DECRYPTION (Reverted to original correct order for sodium-plus) ---

export async function encryptMessage(message: string, recipientPublicKey: X25519PublicKey) {
  const sodium = await initSodium();
  const { secretKey } = await getKeyPair(); // sender's secret key

  const nonce = await sodium.randombytes_buf(sodium.CRYPTO_BOX_NONCEBYTES);
  const plaintextBuf = Buffer.from(message, 'utf8');

  // Order for sodium-plus: (message, nonce, senderSecretKey, recipientPublicKey)
  const ciphertext = await sodium.crypto_box(plaintextBuf, nonce, secretKey, recipientPublicKey);

  const nonceHex = await sodium.sodium_bin2hex(nonce);
  const ciphertextHex = await sodium.sodium_bin2hex(ciphertext);

  console.log('Encrypting message for recipient:', recipientPublicKey.getBuffer().toString('hex').slice(0,16));
  console.log('encryptMessage OK');

  return `${nonceHex}:${ciphertextHex}`;
}

export async function decryptMessage(encrypted: string, senderPublicKey: X25519PublicKey) {
  const sodium = await initSodium();
  const { secretKey } = await getKeyPair(); // recipient's secret key

  const [nonceHex, ciphertextHex] = encrypted.split(':');
  if (!nonceHex || !ciphertextHex) throw new Error('Invalid encrypted message format');

  const nonce = await sodium.sodium_hex2bin(nonceHex);
  const ciphertext = await sodium.sodium_bin2hex(ciphertextHex);

  // Order for sodium-plus: (ciphertext, nonce, recipientSecretKey, senderPublicKey)
  const decryptedBuf = await sodium.crypto_box_open(ciphertext, nonce, secretKey, senderPublicKey);
  const msg = decryptedBuf.toString('utf8');
  
  console.log('Decrypting message from sender:', senderPublicKey.getBuffer().toString('hex').slice(0,16));
  console.log('decryptMessage OK ->', msg);

  return msg;
}

// --- SELF TEST ---

export async function selfTest() {
  const { publicKey } = await getKeyPair();
  const message = `selftest ${Date.now()}`;
  const encrypted = await encryptMessage(message, publicKey);
  const decrypted = await decryptMessage(encrypted, publicKey);

  if (decrypted !== message) throw new Error('Self-test failed: decrypted != original');
  console.log('selfTest OK');
  return true;
}

declare global {
  interface Window {
    selfTest?: () => Promise<any>;
  }
}

if (typeof window !== 'undefined') {
  window.selfTest = selfTest;
}