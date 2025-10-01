// src/services/encryption.ts (Corrected a final time)

import { SodiumPlus } from 'sodium-plus'; // <-- ONLY IMPORT SodiumPlus
import { supabase } from './supabase';

let sodium: SodiumPlus | null = null;

// Initialize Sodium-Plus
async function initSodium() {
  if (!sodium) {
    sodium = await SodiumPlus.auto();
  }
  return sodium;
}

// Generates a new key pair for the current user
export async function generateAndStoreKeyPair() {
  const sodium = await initSodium();
  const { user } = (await supabase.auth.getUser()).data;
  if (!user) throw new Error('User not authenticated');

  const keypair = await sodium.crypto_box_keypair();
  const publicKey = await sodium.crypto_box_publickey(keypair);
  const secretKey = await sodium.crypto_box_secretkey(keypair);

  localStorage.setItem(`spk_${user.id}`, secretKey.getBuffer().toString('hex'));

  const { error } = await supabase
    .from('public_keys')
    .upsert({ user_id: user.id, public_key: publicKey.getBuffer().toString('hex') });
    
  if (error) throw error;
  
  // --- FIX: Access Hidden via SodiumPlus.Hidden ---
  return { 
    publicKey: new SodiumPlus.Hidden(publicKey.getBuffer()), 
    secretKey: new SodiumPlus.Hidden(secretKey.getBuffer()) 
  };
}

// Retrieves the current user's key pair, generating if it doesn't exist
export async function getKeyPair() {
  const { user } = (await supabase.auth.getUser()).data;
  if (!user) throw new Error('User not authenticated');

  const secretKeyHex = localStorage.getItem(`spk_${user.id}`);
  if (!secretKeyHex) {
    return generateAndStoreKeyPair();
  }

  const sodium = await initSodium();
  const secretKeyBuffer = sodium.sodium_hex2bin(secretKeyHex);

  const { data: publicKeyData, error } = await supabase
    .from('public_keys')
    .select('public_key')
    .eq('user_id', user.id)
    .single();

  if (error || !publicKeyData) {
    return generateAndStoreKeyPair();
  }
  
  const publicKeyBuffer = sodium.sodium_hex2bin(publicKeyData.public_key);
  
  // --- FIX: Access Hidden via SodiumPlus.Hidden ---
  return { 
      publicKey: new SodiumPlus.Hidden(publicKeyBuffer), 
      secretKey: new SodiumPlus.Hidden(secretKeyBuffer) 
  };
}

// Fetches another user's public key from the database
export async function getRecipientPublicKey(userId: string) {
  const { data, error } = await supabase
    .from('public_keys')
    .select('public_key')
    .eq('user_id', userId)
    .single();
  if (error) throw new Error(`Could not fetch public key for user ${userId}. They may not have used chat yet.`);

  const sodium = await initSodium();
  const publicKeyBuffer = sodium.sodium_hex2bin(data.public_key);
  
  // --- FIX: Access Hidden via SodiumPlus.Hidden ---
  return new SodiumPlus.Hidden(publicKeyBuffer);
}

// Encrypts a message for a recipient
export async function encryptMessage(message: string, recipientPublicKey: SodiumPlus.Hidden) {
  const sodium = await initSodium();
  const { secretKey } = await getKeyPair();
  
  const nonce = await sodium.randombytes_buf(sodium.CRYPTO_BOX_NONCEBYTES);
  const ciphertext = await sodium.crypto_box(message, nonce, recipientPublicKey, secretKey);
  
  return `${nonce.toString('hex')}:${ciphertext.toString('hex')}`;
}

// Decrypts a message
export async function decryptMessage(encrypted: string, senderPublicKey: SodiumPlus.Hidden) {
  const sodium = await initSodium();
  const { secretKey } = await getKeyPair();

  const [nonceHex, ciphertextHex] = encrypted.split(':');
  if (!nonceHex || !ciphertextHex) throw new Error("Invalid encrypted message format.");

  const nonce = sodium.sodium_hex2bin(nonceHex);
  const ciphertext = sodium.sodium_hex2bin(ciphertextHex);

  const decrypted = await sodium.crypto_box_open(ciphertext, nonce, senderPublicKey, secretKey);
  return decrypted.toString('utf-8');
}