const crypto = require("crypto");
const assert = require("assert");

const secp256k1 =
  typeof window === "undefined"
    ? // On Node.js use native bindings for performance
      require("secp256k1")
    : // On the browser use JS-only implementation
      require("secp256k1/elliptic");

const satoshiKeys = generateKeyPair();

module.exports = {
  blocks: {
    genesis: [satoshiKeys.publicKey, undefined, undefined],
  },
  createTransaction,
  generateKeyPair,
  getHash,
  mine,
  satoshiKeys,
  sign,
  verifyTransaction,
};
function createTransaction({
  newOwnerPublicKey,
  previousTransaction,
  ownerPrivateKey,
}) {
  assert(secp256k1.publicKeyVerify(newOwnerPublicKey));
  const previousTransactionHash = getHash([
    previousTransaction,
    newOwnerPublicKey,
  ]);
  return [
    newOwnerPublicKey,
    previousTransactionHash,
    sign(
      getHash([previousTransactionHash, newOwnerPublicKey]),
      ownerPrivateKey
    ),
  ];
}
function generateKeyPair() {
  const privateKey = (() => {
    let bytes;
    do {
      bytes = crypto.randomBytes(32);
    } while (!secp256k1.privateKeyVerify(bytes));
    return bytes;
  })();
  const publicKey = secp256k1.publicKeyCreate(privateKey);
  return { publicKey, privateKey };
}

function getHash(object) {
  // TODO: Within bitcoin hashes are usually computed twice
  // TODO: bitcoin addresses use RIPEMD-160 for a shorter hash
  const cleartext = JSON.stringify(object);
  // byte
  return crypto.createHash("sha256").update(cleartext).digest();
  // base64:
  return crypto.createHash("sha256").update(cleartext).digest("base64");
  // hex:
  return crypto.createHash("sha256").update(cleartext).digest("hex");
}
function sign(msg, privateKey) {
  // TODO:
  // Public keys (in scripts) are given as 04 <x> <y> where x and y are 32 byte big-endian integers representing the coordinates of a point on the curve or in compressed form given as <sign> <x> where <sign> is 0x02 if y is even and 0x03 if y is odd.
  // Signatures use DER encoding to pack the r and s components into a single byte stream (this is also what OpenSSL produces by default).
  return secp256k1.ecdsaSign(msg, privateKey);
}
function verifyTransaction({ transaction, previousOwnerPublicKey }) {
  return secp256k1.ecdsaVerify(
    //signature
    transaction[2].signature,
    // msg
    getHash([transaction[1], transaction[0]]),
    // pubkey
    previousOwnerPublicKey
  );
}
function mine(
  { previousHash, difficulty = 0, transactions = [] } = {
    difficulty: 0,
    transactions: [],
  }
) {
  let nonce = 0;
  do {
    const hash = getHash([previousHash, nonce, ...transactions]);
    if (
      0 ==
      hash.compare(
        Buffer.from(Array.from({ length: difficulty }, (v, i) => 0)),
        0,
        difficulty,
        0,
        difficulty
      )
    ) {
      return hash;
    }
    nonce++;
    if (nonce > 100000) {
      throw Error("TIMEOUT");
    }
  } while (true);
}
