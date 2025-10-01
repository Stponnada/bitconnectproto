// encryption.ts

import { SodiumPlus, X25519PublicKey, X25519SecretKey } from 'sodium-plus';
import { supabase } from './supabase';

let sodium: SodiumPlus | null = null;
async function initSodium() {
  if (!sodium) sodium = await SodiumPlus.auto();
  return sodium!;
}

export async function generateAndStoreKeyPair() {
  const sodium = await initSodium();
  const { user } = (await supabase.auth.getUser()).data;
  if (!user) throw new Error('User not authenticated');

  const keypair = await sodium.crypto_box_keypair();
  const publicKey = await sodium.crypto_box_publickey(keypair);
  const secretKey = await sodium.crypto_box_secretkey(keypair);

  const secretKeyHex = await sodium.sodium_bin2hex(secretKey.getBuffer());
  const publicKeyHex = await sodium.sodium_bin2hex(publicKey.getBuffer());

  localStorage.setItem(`spk_${user.id}`, secretKeyHex);

  const { error } = await supabase
    .from('public_keys')
    .upsert({ user_id: user.id, public_key: publicKeyHex });

  if (error) throw error;
  return { publicKey, secretKey };
}

export async function getKeyPair() {
  const sodium = await initSodium();
  const { user } = (await supabase.auth.getUser()).data;
  if (!user) throw new Error('User not authenticated');

  const secretKeyHex = localStorage.getItem(`spk_${user.id}`);
  if (!secretKeyHex) return generateAndStoreKeyPair();

  try {
    const secretKeyBuffer = await sodium.sodium_hex2bin(secretKeyHex);

    const { data: publicKeyData, error } = await supabase
      .from('public_keys')
      .select('public_key')
      .eq('user_id', user.id)
      .single();

    if (error || !publicKeyData) {
      return generateAndStoreKeyPair();
    }

    const publicKeyBuffer = await sodium.sodium_hex2bin(publicKeyData.public_key);

    return {
      publicKey: new X25519PublicKey(publicKeyBuffer),
      secretKey: new X25519SecretKey(secretKeyBuffer),
    };
  } catch (e) {
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

// --- FIXED ENCRYPTION / DECRYPTION ---

export async function encryptMessage(message: string, recipientPublicKey: X25519PublicKey) {
  const sodium = await initSodium();
  const { secretKey } = await getKeyPair(); // sender's secret key

  const nonce = await sodium.randombytes_buf(sodium.CRYPTO_BOX_NONCEBYTES);
  const plaintextBuf = Buffer.from(message, 'utf8');

  // WORKING ORDER: senderSecret, recipientPublic
  const ciphertext = await sodium.crypto_box(plaintextBuf, nonce, secretKey, recipientPublicKey);

  const nonceHex = await sodium.sodium_bin2hex(nonce);
  const ciphertextHex = await sodium.sodium_bin2hex(ciphertext);

  // log before returning
  console.log('Encrypting message for recipient:', recipientPublicKey.getBuffer().toString('hex').slice(0,16));
  console.log('encryptMessage OK', { nonceHex, len: ciphertext.length });

  return `${nonceHex}:${ciphertextHex}`;
}

export async function decryptMessage(encrypted: string, senderPublicKey: X25519PublicKey) {
  const sodium = await initSodium();
  const { secretKey } = await getKeyPair(); // recipient's secret key

  const [nonceHex, ciphertextHex] = encrypted.split(':');
  if (!nonceHex || !ciphertextHex) throw new Error('Invalid encrypted message format');

  const nonce = await sodium.sodium_hex2bin(nonceHex);
  const ciphertext = await sodium.sodium_hex2bin(ciphertextHex);

  // WORKING ORDER: recipientSecret, senderPublic
  const decryptedBuf = await sodium.crypto_box_open(ciphertext, nonce, secretKey, senderPublicKey);
  const msg = decryptedBuf.toString('utf8');

  // log before returning
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
