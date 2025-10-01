// encryption.ts
import { SodiumPlus, X25519PublicKey, X25519SecretKey } from 'sodium-plus';
import { supabase } from './supabase';

let sodium: SodiumPlus | null = null;
async function initSodium() {
  if (!sodium) sodium = await SodiumPlus.auto();
  return sodium!;
}

/** --- Key helpers --- */
export async function loadPublicKeyFromHex(pubHex: string): Promise<X25519PublicKey> {
  const sodium = await initSodium();
  const buf = await sodium.sodium_hex2bin(pubHex);
  return new X25519PublicKey(buf);
}
export async function loadSecretKeyFromHex(secretHex: string): Promise<X25519SecretKey> {
  const sodium = await initSodium();
  const buf = await sodium.sodium_hex2bin(secretHex);
  return new X25519SecretKey(buf);
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
  const { secretKey, publicKey: senderPublicKey } = await getKeyPair(); // sender's keypair

  const nonce = await sodium.randombytes_buf(sodium.CRYPTO_BOX_NONCEBYTES);
  const plaintextBuf = Buffer.from(message, 'utf8');

  // IMPORTANT: pass sender's secret key first, then recipient's public key
  const ciphertext = await sodium.crypto_box(plaintextBuf, nonce, secretKey, recipientPublicKey);

  const nonceHex = await sodium.sodium_bin2hex(nonce);
  const ciphertextHex = await sodium.sodium_bin2hex(ciphertext);

  // DEV SEND LOG (safe dev-only): shows which keys/nonces were used
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
    console.warn('SEND LOG failed', e);
  }

  return `${nonceHex}:${ciphertextHex}`;
}

/**
 * Prepare an encrypted payload and return sender/recipient pub hexs for storage.
 * This avoids lookup races on the receiver — store senderPubHex with the message row.
 */
export async function prepareEncryptedPayloadForStorage(recipientUserId: string, message: string) {
  const sodium = await initSodium();
  const recipientPub = await getRecipientPublicKey(recipientUserId);
  const { publicKey: senderPublicKey } = await getKeyPair();

  const payload = await encryptMessage(message, recipientPub);
  const senderPubHex = await sodium.sodium_bin2hex(senderPublicKey.getBuffer());
  const recipientPubHex = await sodium.sodium_bin2hex(recipientPub.getBuffer());
  return { payload, senderPubHex, recipientPubHex };
}

// decryption: accepts either X25519PublicKey OR senderPublicKeyHex
export async function decryptMessage(encrypted: string, senderPublicKeyOrHex: X25519PublicKey | string) {
  const sodium = await initSodium();

  // Ensure we have our secret key object
  const { secretKey: possibleSecret } = await getKeyPair();
  const secretKey = (possibleSecret instanceof X25519SecretKey)
    ? possibleSecret
    : new X25519SecretKey(possibleSecret.getBuffer ? possibleSecret.getBuffer() : possibleSecret);

  // Accept either an X25519PublicKey or a hex string (senderPubHex)
  let senderPK: X25519PublicKey;
  if (typeof senderPublicKeyOrHex === 'string') {
    senderPK = await loadPublicKeyFromHex(senderPublicKeyOrHex);
  } else {
    senderPK = senderPublicKeyOrHex instanceof X25519PublicKey
      ? senderPublicKeyOrHex
      : new X25519PublicKey(
          (senderPublicKeyOrHex as any).getBuffer ? (senderPublicKeyOrHex as any).getBuffer() : Buffer.from(senderPublicKeyOrHex as any)
        );
  }

  const [nonceHex, ciphertextHex] = encrypted.split(':');
  if (!nonceHex || !ciphertextHex) throw new Error('Invalid encrypted message format (expected nonce:ciphertext).');

  const nonce = await sodium.sodium_hex2bin(nonceHex);
  const ciphertext = await sodium.sodium_hex2bin(ciphertextHex);

  // DEV RECV LOG
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
    try {
      decryptedBuf = await tryOpenOrder('secretFirst');
      return decryptedBuf.toString('utf8');
    } catch (errSecond: any) {
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

/** Local sodium-only test (no supabase, no stored keys). Expose via window in dev. */
export async function localSodiumTest() {
  const sodium = await initSodium();

  const kpA = await sodium.crypto_box_keypair();
  const kpB = await sodium.crypto_box_keypair();

  const A_pub = await sodium.crypto_box_publickey(kpA);
  const A_sec = await sodium.crypto_box_secretkey(kpA);
  const B_pub = await sodium.crypto_box_publickey(kpB);
  const B_sec = await sodium.crypto_box_secretkey(kpB);

  const plaintext = Buffer.from('local test ' + Date.now(), 'utf8');
  const nonce = await sodium.randombytes_buf(sodium.CRYPTO_BOX_NONCEBYTES);

  const ct1 = await sodium.crypto_box(plaintext, nonce, A_sec, B_pub);
  const nonceHex = await sodium.sodium_bin2hex(nonce);
  console.log('localSodiumTest: tried encrypt order (A_sec, B_pub). nonce:', nonceHex, 'ct1 len', ct1.length);

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

  await tryOpen('canonical: (A_pub, B_sec)', [ct1, nonce, A_pub, B_sec]);
  await tryOpen('alternate: (B_sec, A_pub)', [ct1, nonce, B_sec, A_pub]);

  const ct2 = await sodium.crypto_box(plaintext, nonce, B_pub, A_sec);
  console.log('localSodiumTest: tried encrypt order (B_pub, A_sec). ct2 len', ct2.length);
  await tryOpen('canonical after swapped encrypt: (A_pub, B_sec) on ct2', [ct2, nonce, A_pub, B_sec]);
  await tryOpen('alternate after swapped encrypt: (B_sec, A_pub) on ct2', [ct2, nonce, B_sec, A_pub]);

  return { nonceHex };
}

/** Self test using your app's getKeyPair() */
export async function selfTest() {
  try {
    const { publicKey } = await getKeyPair();
    const message = `selftest ${Date.now()}`;
    const encrypted = await encryptMessage(message, publicKey);
    const decrypted = await decryptMessage(encrypted, await (async () => {
      const sodium = await initSodium();
      return await sodium.sodium_bin2hex(publicKey.getBuffer());
    })());
    if (decrypted !== message) throw new Error('decrypted != original');
    console.log('selfTest OK');
    return true;
  } catch (e) {
    console.error('selfTest FAILED', e);
    throw e;
  }
}

/** Verify local stored public key matches DB */
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

/** DEV: expose tests to window for quick console runs. Remove in production */
declare global {
  interface Window {
    localSodiumTest?: () => Promise<any>;
    selfTest?: () => Promise<any>;
    prepareEncryptedPayloadForStorage?: (recipientUserId: string, message: string) => Promise<any>;
  }
}
if (typeof window !== 'undefined') {
  window.localSodiumTest = localSodiumTest;
  window.selfTest = selfTest;
  window.prepareEncryptedPayloadForStorage = prepareEncryptedPayloadForStorage;
}
