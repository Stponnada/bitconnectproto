// encryption.ts

import { SodiumPlus, X25519PublicKey, X25519SecretKey } from 'sodium-plus';
import { supabase } from './supabase';

let sodium: SodiumPlus | null = null;
async function initSodium() {
  if (!sodium) sodium = await SodiumPlus.auto();
  return sodium!;
}

// --- SELF-HEALING KEY MANAGEMENT ---

/**
 * Generates a new key pair. This is the standard method using crypto_box_keypair.
 * It stores the secret key locally and the public key remotely.
 */
export async function generateAndStoreKeyPair() {
  const sodium = await initSodium();
  const { user } = (await supabase.auth.getUser()).data;
  if (!user) throw new Error('User not authenticated');

  console.log('Generating a new key pair for user:', user.id);

  const keypair = await sodium.crypto_box_keypair();
  const secretKey = await sodium.crypto_box_secretkey(keypair);
  const publicKey = await sodium.crypto_box_publickey(keypair);

  const secretKeyHex = await sodium.sodium_bin2hex(secretKey.getBuffer());
  const publicKeyHex = await sodium.sodium_bin2hex(publicKey.getBuffer());

  localStorage.setItem(`spk_${user.id}`, secretKeyHex);

  const { error } = await supabase
    .from('public_keys')
    .upsert({ user_id: user.id, public_key: publicKeyHex });

  if (error) throw error;
  return { publicKey, secretKey };
}

/**
 * Retrieves the user's key pair. This function is self-healing.
 * It treats the local secret key as the source of truth and ensures
 * the public key in the database always matches.
 */
export async function getKeyPair() {
  const sodium = await initSodium();
  const { user } = (await supabase.auth.getUser()).data;
  if (!user) throw new Error('User not authenticated');

  const secretKeyHex = localStorage.getItem(`spk_${user.id}`);
  if (!secretKeyHex) {
    return generateAndStoreKeyPair();
  }

  try {
    // 1. Recreate secret key from local storage (our source of truth).
    const secretKeyBuffer = await sodium.sodium_hex2bin(secretKeyHex);
    const secretKey = new X25519SecretKey(secretKeyBuffer);

    // 2. Derive the corresponding public key. This is the ONLY correct public key.
    const publicKey = await sodium.crypto_box_publickey_from_secretkey(secretKey);
    const derivedPublicKeyHex = await sodium.sodium_bin2hex(publicKey.getBuffer());

    // 3. Fetch the public key currently stored in the database.
    const { data: remoteData } = await supabase
      .from('public_keys')
      .select('public_key')
      .eq('user_id', user.id)
      .single();

    // 4. Check for desynchronization.
    if (!remoteData || remoteData.public_key !== derivedPublicKeyHex) {
      console.warn('Key desync detected! Healing remote public key.');
      // 5. Heal: Overwrite the remote key with the correct, locally-derived key.
      const { error: upsertError } = await supabase
        .from('public_keys')
        .upsert({ user_id: user.id, public_key: derivedPublicKeyHex });
      if (upsertError) throw upsertError;
    }
    
    return { publicKey, secretKey };
  } catch (e) {
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

// --- ENCRYPTION / DECRYPTION (Using correct order for sodium-plus) ---

export async function encryptMessage(message: string, recipientPublicKey: X25519PublicKey) {
  const sodium = await initSodium();
  const { secretKey } = await getKeyPair();
  const nonce = await sodium.randombytes_buf(sodium.CRYPTO_BOX_NONCEBYTES);
  const plaintextBuf = Buffer.from(message, 'utf8');
  const ciphertext = await sodium.crypto_box(plaintextBuf, nonce, secretKey, recipientPublicKey);
  const nonceHex = await sodium.sodium_bin2hex(nonce);
  const ciphertextHex = await sodium.sodium_bin2hex(ciphertext);
  console.log('encryptMessage OK');
  return `${nonceHex}:${ciphertextHex}`;
}

export async function decryptMessage(encrypted: string, senderPublicKey: X25519PublicKey) {
  const sodium = await initSodium();
  const { secretKey } = await getKeyPair();
  const [nonceHex, ciphertextHex] = encrypted.split(':');
  if (!nonceHex || !ciphertextHex) throw new Error('Invalid encrypted message format');
  const nonce = await sodium.sodium_hex2bin(nonceHex);
  const ciphertext = await sodium.sodium_hex2bin(ciphertextHex);
  const decryptedBuf = await sodium.crypto_box_open(ciphertext, nonce, secretKey, senderPublicKey);
  const msg = decryptedBuf.toString('utf8');
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