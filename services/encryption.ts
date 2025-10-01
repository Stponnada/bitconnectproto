// src/services/encryption.ts

import { SodiumPlus, X25519PublicKey, X25519SecretKey } from 'sodium-plus';
import { supabase } from './supabase';
import { v4 as uuidv4 } from 'uuid';

let sodium: SodiumPlus | null = null;
async function initSodium() {
  if (!sodium) sodium = await SodiumPlus.auto();
  return sodium!;
}

// --- DEVICE ID MANAGEMENT ---
function getDeviceId(): string {
  let deviceId = localStorage.getItem('device_id');
  if (!deviceId) {
    deviceId = uuidv4();
    localStorage.setItem('device_id', deviceId);
  }
  return deviceId;
}

// --- MULTI-DEVICE KEY MANAGEMENT ---
export async function getKeyPair() {
  const sodium = await initSodium();
  const { user } = (await supabase.auth.getUser()).data;
  if (!user) throw new Error('User not authenticated');
  const deviceId = getDeviceId();
  
  const storageKey = `spk_${user.id}`;
  const secretKeyHex = localStorage.getItem(storageKey);

  if (!secretKeyHex) {
    console.log('No local secret key for this device. Generating new one.');
    const keypair = await sodium.crypto_box_keypair();
    const secretKey = await sodium.crypto_box_secretkey(keypair);
    const publicKey = await sodium.crypto_box_publickey(keypair);
    const newSecretKeyHex = await sodium.sodium_bin2hex(secretKey.getBuffer());
    const newPublicKeyHex = await sodium.sodium_bin2hex(publicKey.getBuffer());
    localStorage.setItem(storageKey, newSecretKeyHex);
    const { error } = await supabase
      .from('device_keys')
      .upsert({ user_id: user.id, device_id: deviceId, public_key: newPublicKeyHex });
    if (error) throw error;
    return { publicKey, secretKey };
  }

  const secretKeyBuffer = await sodium.sodium_hex2bin(secretKeyHex);
  const secretKey = new X25519SecretKey(secretKeyBuffer);
  const publicKey = await sodium.crypto_box_publickey_from_secretkey(secretKey);
  return { publicKey, secretKey };
}

async function getAllDeviceKeysForUser(userId: string): Promise<{ device_id: string, public_key: X25519PublicKey }[]> {
  const sodium = await initSodium();
  const { data, error } = await supabase
    .from('device_keys')
    .select('device_id, public_key')
    .eq('user_id', userId);
  if (error) throw error;
  if (!data) return [];
  return Promise.all(data.map(async (key) => {
    const publicKeyBuffer = await sodium.sodium_hex2bin(key.public_key);
    return {
      device_id: key.device_id,
      public_key: new X25519PublicKey(publicKeyBuffer),
    };
  }));
}

// --- MULTI-DEVICE ENCRYPTION / DECRYPTION ---
export async function encryptMessage(message: string, recipientId: string) {
  const sodium = await initSodium();
  const { secretKey: senderSecretKey, publicKey: senderPublicKey } = await getKeyPair();
  const { user: sender } = (await supabase.auth.getUser()).data;
  if (!sender) throw new Error("Cannot send message: user not authenticated");

  const recipientKeys = await getAllDeviceKeysForUser(recipientId);
  const senderKeys = await getAllDeviceKeysForUser(sender.id);
  const allKeys = new Map<string, X25519PublicKey>();
  for (const key of recipientKeys) { allKeys.set(key.device_id, key.public_key); }
  for (const key of senderKeys) { allKeys.set(key.device_id, key.public_key); }
  if (allKeys.size === 0) throw new Error("No devices found for sender or recipient.");

  const devicePayload: { [deviceId: string]: string } = {};
  const plaintextBuf = Buffer.from(message, 'utf8');

  for (const [deviceId, publicKey] of allKeys.entries()) {
    const nonce = await sodium.randombytes_buf(sodium.CRYPTO_BOX_NONCEBYTES);
    const ciphertext = await sodium.crypto_box(plaintextBuf, nonce, senderSecretKey, publicKey);
    const nonceHex = await sodium.sodium_bin2hex(nonce);
    const ciphertextHex = await sodium.sodium_bin2hex(ciphertext);
    devicePayload[deviceId] = `${nonceHex}:${ciphertextHex}`;
  }
  
  const senderPublicKeyHex = await sodium.sodium_bin2hex(senderPublicKey.getBuffer());
  const finalPayload = {
    sender_key: senderPublicKeyHex,
    devices: devicePayload
  };
  console.log(`Encrypted message for ${allKeys.size} total device(s).`);
  return finalPayload;
}

export async function decryptMessage(encryptedPayloadStr: string) {
  const sodium = await initSodium();
  const { secretKey: recipientSecretKey } = await getKeyPair();
  const myDeviceId = getDeviceId();
  const payload = JSON.parse(encryptedPayloadStr);
  
  if (!payload.sender_key || !payload.devices) throw new Error("Invalid payload structure.");
  
  const messageForThisDevice = payload.devices[myDeviceId];
  if (!messageForThisDevice) throw new Error('Message not encrypted for this device.');

  const [nonceHex, ciphertextHex] = messageForThisDevice.split(':');
  if (!nonceHex || !ciphertextHex) throw new Error('Invalid encrypted message format');
  
  const senderPublicKeyBuffer = await sodium.sodium_hex2bin(payload.sender_key);
  const senderPublicKey = new X25519PublicKey(senderPublicKeyBuffer);
  
  // THIS IS THE CORRECTED LINE
  const nonce = await sodium.sodium_hex2bin(nonceHex);
  
  const ciphertext = await sodium.sodium_hex2bin(ciphertextHex);

  const decryptedBuf = await sodium.crypto_box_open(ciphertext, nonce, recipientSecretKey, senderPublicKey);
  const msg = decryptedBuf.toString('utf8');
  console.log('decryptMessage OK ->', msg);
  return msg;
}