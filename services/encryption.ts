// src/services/encryption.ts (FINAL - Correct Key Generation)

import { SodiumPlus, X25519PublicKey, X25519SecretKey } from 'sodium-plus';
import { supabase } from './supabase';

let sodium: SodiumPlus | null = null;

async function initSodium() {
  if (!sodium) {
    sodium = await SodiumPlus.auto();
  }
  return sodium;
}

// THIS IS THE CORRECTED FUNCTION
export async function generateAndStoreKeyPair() {
  const sodium = await initSodium();
  const { user } = (await supabase.auth.getUser()).data;
  if (!user) throw new Error('User not authenticated');

  console.log(`Generating new key pair for user ${user.id}`);

  // Generate the keypair object
  const keypair = await sodium.crypto_box_keypair();
  
  // Get the public and secret keys directly from the keypair object
  const publicKey = await keypair.getPublicKey();
  const secretKey = await keypair.getSecretKey();

  // Store the secret key (private key) in the browser's local storage
  localStorage.setItem(`spk_${user.id}`, secretKey.getBuffer().toString('hex'));

  // Store the public key in the database
  const { error } = await supabase
    .from('public_keys')
    .upsert({ 
      user_id: user.id, 
      public_key: publicKey.getBuffer().toString('hex') 
    });
    
  if (error) throw error;
  
  console.log(`Successfully stored new key pair for user ${user.id}`);
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
    const secretKeyBuffer = sodium.sodium_hex2bin(secretKeyHex);

    const { data: publicKeyData, error } = await supabase
      .from('public_keys')
      .select('public_key')
      .eq('user_id', user.id)
      .single();

    if (error || !publicKeyData) {
      console.warn("Public key not in DB. Regenerating pair.");
      return generateAndStoreKeyPair();
    }
    
    const publicKeyBuffer = sodium.sodium_hex2bin(publicKeyData.public_key);
    
    const secretKey = new X25519SecretKey(secretKeyBuffer);
    const publicKey = new X25519PublicKey(publicKeyBuffer);
    
    return { publicKey, secretKey };

  } catch (error) {
    console.warn("Invalid key found. Regenerating...", error);
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
    console.error(`Failed to get public key for ${userId}`, error);
    throw new Error(`Could not fetch public key for user ${userId}. They may not have used chat yet.`);
  }

  const sodium = await initSodium();
  const publicKeyBuffer = sodium.sodium_hex2bin(data.public_key);
  
  return new X25519PublicKey(publicKeyBuffer);
}

export async function encryptMessage(message: string, recipientPublicKey: X25519PublicKey) {
  const sodium = await initSodium();
  const { secretKey } = await getKeyPair();
  
  const nonce = await sodium.randombytes_buf(sodium.CRYPTO_BOX_NONCEBYTES);
  const ciphertext = await sodium.crypto_box(message, nonce, recipientPublicKey, secretKey);
  
  return `${nonce.toString('hex')}:${ciphertext.toString('hex')}`;
}

export async function decryptMessage(encrypted: string, senderPublicKey: X25519PublicKey) {
  const sodium = await initSodium();
  const { secretKey } = await getKeyPair();

  const [nonceHex, ciphertextHex] = encrypted.split(':');
  if (!nonceHex || !ciphertextHex) throw new Error("Invalid encrypted message format.");

  const nonce = sodium.sodium_hex2bin(nonceHex);
  const ciphertext = sodium.sodium_hex2bin(ciphertextHex);

  const decrypted = await sodium.crypto_box_open(ciphertext, nonce, senderPublicKey, secretKey);
  return decrypted.toString('utf-8');
}