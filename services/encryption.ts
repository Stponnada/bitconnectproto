// src/services/encryption.ts (Definitively Correct Version)

import { SodiumPlus, X25519PublicKey, X25519SecretKey } from 'sodium-plus';
import { supabase } from './supabase';

let sodium: SodiumPlus | null = null;

async function initSodium() {
  if (!sodium) {
    sodium = await SodiumPlus.auto();
  }
  return sodium;
}

export async function generateAndStoreKeyPair() {
  const sodium = await initSodium();
  const { user } = (await supabase.auth.getUser()).data;
  if (!user) throw new Error('User not authenticated');

  const keypair = await sodium.crypto_box_keypair();
  const publicKey = await sodium.crypto_box_publickey(keypair);
  const secretKey = await sodium.crypto_box_secretkey(keypair);

  // Use the library's hex encoder for storing keys to ensure perfect compatibility
  const secretKeyHex = await sodium.sodium_bin2hex(secretKey.getBuffer());
  const publicKeyHex = await sodium.sodium_bin2hex(publicKey.getBuffer());

  localStorage.setItem(`spk_${user.id}`, secretKeyHex);

  const { error } = await supabase
    .from('public_keys')
    .upsert({ 
      user_id: user.id, 
      public_key: publicKeyHex
    });
    
  if (error) throw error;
  return { publicKey, secretKey };
}

export async function getKeyPair() {
  const { user } = (await supabase.auth.getUser()).data;
  if (!user) throw new Error('User not authenticated');

  const secretKeyHex = localStorage.getItem(`spk_${user.id}`);
  if (!secretKeyHex) {
    return generateAndStoreKeyPair();
  }

  try {
    const sodium = await initSodium();
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
    
    const secretKey = new X25519SecretKey(secretKeyBuffer);
    const publicKey = new X25519PublicKey(publicKeyBuffer);
    
    return { publicKey, secretKey };

  } catch (error) {
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

  if (error) {
    throw new Error(`Could not fetch public key for user ${userId}. They may not have used chat yet.`);
  }

  const sodium = await initSodium();
  const publicKeyBuffer = await sodium.sodium_hex2bin(data.public_key);
  
  return new X25519PublicKey(publicKeyBuffer);
}

// THIS IS THE CORRECTED FUNCTION
export async function encryptMessage(message: string, recipientPublicKey: X25519PublicKey) {
  const sodium = await initSodium();
  const { secretKey } = await getKeyPair();
  
  const nonce = await sodium.randombytes_buf(sodium.CRYPTO_BOX_NONCEBYTES);
  const ciphertext = await sodium.crypto_box(message, nonce, recipientPublicKey, secretKey);
  
  // --- THE FIX: Use standard Buffer.toString('hex') for nonce and ciphertext ---
  // These are temporary and don't need the strict compatibility of the stored keys.
  return `${nonce.toString('hex')}:${ciphertext.toString('hex')}`;
}

// THIS IS THE CORRECTED FUNCTION
export async function decryptMessage(encrypted: string, senderPublicKey: X25519PublicKey) {
  const sodium = await initSodium();
  const { secretKey } = await getKeyPair();

  const [nonceHex, ciphertextHex] = encrypted.split(':');
  if (!nonceHex || !ciphertextHex) throw new Error("Invalid encrypted message format.");

  // --- THE FIX: Use the library's hex2bin to read the hex string back into a Buffer ---
  const nonce = await sodium.sodium_hex2bin(nonceHex);
  const ciphertext = await sodium.sodium_hex2bin(ciphertextHex);

  const decrypted = await sodium.crypto_box_open(ciphertext, nonce, senderPublicKey, secretKey);
  return decrypted.toString('utf-8');
}