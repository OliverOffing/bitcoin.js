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
  const cleartext = JSON.stringify(object);
  // byte
  return crypto.createHash("sha256").update(cleartext).digest();
  // base64:
  return crypto.createHash("sha256").update(cleartext).digest("base64");
  // hex:
  return crypto.createHash("sha256").update(cleartext).digest("hex");
}
function sign(msg, privateKey) {
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
