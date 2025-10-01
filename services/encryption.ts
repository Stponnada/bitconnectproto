// encryption_with_logging.ts

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
  const { publicKey: senderPublicKey } = await getKeyPair(); // sender public for logging

  const nonce = await sodium.randombytes_buf(sodium.CRYPTO_BOX_NONCEBYTES);
  const plaintextBuf = Buffer.from(message, 'utf8');

  // IMPORTANT: pass sender's secret key first, then recipient's public key
  const ciphertext = await sodium.crypto_box(plaintextBuf, nonce, secretKey, recipientPublicKey);

  const nonceHex = await sodium.sodium_bin2hex(nonce);
  const ciphertextHex = await sodium.sodium_bin2hex(ciphertext);

  // --- SEND LOG: temporary dev-only logging to help debugging ---
  try {
    const senderPubHex = await sodium.sodium_bin2hex(senderPublicKey.getBuffer());
    const recipientPubHex = await sodium.sodium_bin2hex(recipientPublicKey.getBuffer());
    console.log('SEND LOG', {
      messagePreview: typeof message === 'string' ? message.slice(0, 30) : null,
      senderPubHex,
      recipientPubHex,
      nonceHex,
      ciphertextHex,
      ciphertextLen: ciphertext.length
    });
  } catch (e) {
    // swallow logging errors
    console.warn('SEND LOG failed', e);
  }

  // keep API the same: return string payload
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

  // --- RECV LOG: temporary dev-only logging to help debugging ---
  try {
    const senderPubHexUsedByReceiver = await sodium.sodium_bin2hex(senderPK.getBuffer());
    const recipientSecretHex = await sodium.sodium_bin2hex(secretKey.getBuffer());
    console.log('RECV LOG', {
      senderPubHexUsedByReceiver,
      recipientSecretHex,
      nonceHex,
      ciphertextHex,
      ciphertextLen: ciphertext.length
    });
  } catch (e) {
    console.warn('RECV LOG failed', e);
  }

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


// --- Add these helpers to encryption.ts ---

/**
 * Local sodium-only test (no supabase, no stored keys).
 * Generates two fresh keypairs (A = sender, B = recipient) and tries
 * encrypt/open with both common argument orders so we can see which order works.
 */
export async function localSodiumTest() {
  const sodium = await initSodium();

  // generate two keypairs
  const kpA = await sodium.crypto_box_keypair();
  const kpB = await sodium.crypto_box_keypair();

  const A_pub = await sodium.crypto_box_publickey(kpA);
  const A_sec = await sodium.crypto_box_secretkey(kpA);
  const B_pub = await sodium.crypto_box_publickey(kpB);
  const B_sec = await sodium.crypto_box_secretkey(kpB);

  const plaintext = Buffer.from('local test ' + Date.now(), 'utf8');
  const nonce = await sodium.randombytes_buf(sodium.CRYPTO_BOX_NONCEBYTES);

  // Try encrypt with "secret first, recipient public second"
  const ct1 = await sodium.crypto_box(plaintext, nonce, A_sec, B_pub);
  const ct1hex = await sodium.sodium_bin2hex(ct1);
  const nonceHex = await sodium.sodium_bin2hex(nonce);
  console.log('localSodiumTest: tried encrypt order (A_sec, B_pub). nonce:', nonceHex, 'ct1 len', ct1.length);

  // Attempt opens in both common orders
  const tryOpen = async (orderName: string, openArgs: any[]) => {
    try {
      const buf = await sodium.crypto_box_open(openArgs[0], openArgs[1], openArgs[2], openArgs[3]);
      console.log(`OPEN OK (${orderName}) ->`, buf.toString('utf8'));
      return true;
    } catch (e: any) {
      console.warn(`OPEN FAIL (${orderName}) ->`, e && e.message ? e.message : e);
      return false;
    }
  };

  // order A: canonical (senderPublic, recipientSecret)
  await tryOpen('canonical: (A_pub, B_sec)', [ct1, nonce, A_pub, B_sec]);
  // order B: alternate wrapper order (recipientSecret, senderPublic)
  await tryOpen('alternate: (B_sec, A_pub)', [ct1, nonce, B_sec, A_pub]);

  // Now try encrypt with swapped encryption order (recipientPub first, senderSec second)
  const ct2 = await sodium.crypto_box(plaintext, nonce, B_pub, A_sec);
  console.log('localSodiumTest: tried encrypt order (B_pub, A_sec). ct2 len', ct2.length);
  await tryOpen('canonical after swapped encrypt: (A_pub, B_sec) on ct2', [ct2, nonce, A_pub, B_sec]);
  await tryOpen('alternate after swapped encrypt: (B_sec, A_pub) on ct2', [ct2, nonce, B_sec, A_pub]);

  return {
    nonceHex,
    ct1hex,
    // note: we printed results to console so you can read which order succeeded
  };
}

/**
 * Self test using your app's getKeyPair() (uses stored secret in localStorage and public key from DB).
 * This tests the full path (your stored keys, encryptMessage() and decryptMessage()).
 * You must be authenticated and your keys present for this to run.
 */
export async function selfTest() {
  try {
    const { publicKey } = await getKeyPair(); // behaves as recipient public
    // encrypt to self using your encryptMessage helper
    const message = `selftest ${Date.now()}`;
    const encrypted = await encryptMessage(message, publicKey);
    // now decrypt assuming senderPublicKey is your own publicKey (self-send)
    const decrypted = await decryptMessage(encrypted, publicKey);
    if (decrypted !== message) throw new Error('decrypted != original');
    console.log('selfTest OK');
    return true;
  } catch (e) {
    console.error('selfTest FAILED', e);
    throw e;
  }
}

export async function verifyLocalMatchesDb() {
  const sodium = await initSodium();
  const { publicKey: localPub, secretKey } = await getKeyPair();
  const localPubHex = await sodium.sodium_bin2hex(localPub.getBuffer());
  const localSecretHex = await sodium.sodium_bin2hex(secretKey.getBuffer());

  const { data } = await supabase
    .from('public_keys')
    .select('public_key')
    .eq('user_id', (await supabase.auth.getUser()).data.user.id)
    .single();

  console.log('VERIFY', { localPubHex, localSecretHex, dbPubHex: data?.public_key });
  return { localPubHex, dbPubHex: data?.public_key };
}

declare global {
  interface Window {
    localSodiumTest?: () => Promise<any>;
    selfTest?: () => Promise<any>;
  }
}

if (typeof window !== 'undefined') {
  window.localSodiumTest = localSodiumTest;
  window.selfTest = selfTest;
}
