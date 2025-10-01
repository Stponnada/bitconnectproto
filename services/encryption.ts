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

  // use sodium helpers to convert binary -> hex
  const secretKeyHex = await sodium.sodium_bin2hex(secretKey.getBuffer());
  const publicKeyHex = await sodium.sodium_bin2hex(publicKey.getBuffer());

  // Store secret in localStorage (note: for production, use a safer place than localStorage)
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
  const sodium = await initSodium();
  const { user } = (await supabase.auth.getUser()).data;
  if (!user) throw new Error('User not authenticated');

  const secretKeyHex = localStorage.getItem(`spk_${user.id}`);
  if (!secretKeyHex) {
    return generateAndStoreKeyPair();
  }

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

    const secretKey = new X25519SecretKey(secretKeyBuffer);
    const publicKey = new X25519PublicKey(publicKeyBuffer);

    return { publicKey, secretKey };
  } catch (e) {
    // if something went wrong with parsing/stored keys, regenerate
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
    throw new Error(`Could not fetch public key for user ${userId}. They may not have used chat yet.`);
  }

  const sodium = await initSodium();
  const publicKeyBuffer = await sodium.sodium_hex2bin(data.public_key);
  return new X25519PublicKey(publicKeyBuffer);
}

// encryption: (message, recipientPublicKey) -> "nonceHex:ciphertextHex"
export async function encryptMessage(message: string, recipientPublicKey: X25519PublicKey) {
  const sodium = await initSodium();
  const { secretKey } = await getKeyPair(); // sender's secret key (X25519SecretKey)
  
  const nonce = await sodium.randombytes_buf(sodium.CRYPTO_BOX_NONCEBYTES);
  const plaintextBuf = Buffer.from(message, 'utf8');

  // IMPORTANT: pass sender's secret key first, then recipient's public key
  const ciphertext = await sodium.crypto_box(plaintextBuf, nonce, secretKey, recipientPublicKey);

  const nonceHex = await sodium.sodium_bin2hex(nonce);
  const ciphertextHex = await sodium.sodium_bin2hex(ciphertext);
  return `${nonceHex}:${ciphertextHex}`;
}


// decryption: IMPORTANT: pass senderPublicKey first, then recipient (our) secretKey
export async function decryptMessage(encrypted: string, senderPublicKey: X25519PublicKey) {
  const sodium = await initSodium();

  // Ensure we have our secret key object
  const { secretKey: possibleSecret } = await getKeyPair();
  // sometimes getKeyPair returns already-constructed objects, but double-check:
  const secretKey = (possibleSecret instanceof X25519SecretKey)
    ? possibleSecret
    : new X25519SecretKey(possibleSecret.getBuffer ? possibleSecret.getBuffer() : possibleSecret);

  // Ensure senderPublicKey is a X25519PublicKey (if the caller passed a raw buffer/hex)
  const senderPK = (senderPublicKey instanceof X25519PublicKey)
    ? senderPublicKey
    : new X25519PublicKey(senderPublicKey instanceof Buffer ? senderPublicKey : Buffer.from(senderPublicKey));

  const [nonceHex, ciphertextHex] = encrypted.split(':');
  if (!nonceHex || !ciphertextHex) throw new Error('Invalid encrypted message format (expected nonce:ciphertext).');

  const nonce = await sodium.sodium_hex2bin(nonceHex);
  const ciphertext = await sodium.sodium_hex2bin(ciphertextHex);

  // helper to attempt open and return result or throw same error
  async function tryOpenOrder(order: 'senderFirst' | 'secretFirst') {
    if (order === 'senderFirst') {
      // canonical: senderPublicKey, recipientSecretKey
      return await sodium.crypto_box_open(ciphertext, nonce, senderPK, secretKey);
    } else {
      // alternate: recipientSecretKey, senderPublicKey (some wrappers expect this)
      return await sodium.crypto_box_open(ciphertext, nonce, secretKey, senderPK);
    }
  }

  // Try canonical first (most libsodium docs), then try the alternate if needed.
  let decryptedBuf: Buffer | null = null;
  try {
    decryptedBuf = await tryOpenOrder('senderFirst');
    return decryptedBuf.toString('utf8');
  } catch (errFirst: any) {
    // If the first one fails with a TypeError complaining about arg types,
    // try the other known ordering.
    try {
      decryptedBuf = await tryOpenOrder('secretFirst');
      return decryptedBuf.toString('utf8');
    } catch (errSecond: any) {
      // Both failed — produce a helpful diagnostic
      const diag = {
        firstError: String(errFirst && errFirst.message ? errFirst.message : errFirst),
        secondError: String(errSecond && errSecond.message ? errSecond.message : errSecond),
        senderPublicKey_isX25519PublicKey: senderPK instanceof X25519PublicKey,
        secretKey_isX25519SecretKey: secretKey instanceof X25519SecretKey,
        senderPublicKey_len: senderPK && (senderPK.getBuffer ? senderPK.getBuffer().length : (senderPK.length || null)),
        secretKey_len: secretKey && (secretKey.getBuffer ? secretKey.getBuffer().length : (secretKey.length || null)),
      };
      throw new Error(`Decryption failed (both arg orders tried). Diagnostic: ${JSON.stringify(diag)}`);
    }
  }
}
/**
 * Quick self-test that generates (or loads) your keypair, encrypts a message to yourself,
 * and tries to decrypt it. Returns true if OK, throws with details otherwise.
 */
export async function selfTest() {
  const { publicKey } = await getKeyPair(); // our public key (recipient)
  const testMsg = `selftest ${Date.now()}`;
  const encrypted = await encryptMessage(testMsg, publicKey);
  const decrypted = await decryptMessage(encrypted, publicKey); // senderPublicKey == our publicKey (self)
  if (decrypted !== testMsg) throw new Error(`self test failed: decrypted != original`);
  return true;
}
