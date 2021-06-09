const assert = require("assert");
const crypto = require("crypto");

const secp256k1 =
  typeof window === "undefined"
    ? // On Node.js use native bindings for performance
      require("secp256k1")
    : // On the browser use JS-only implementation
      require("secp256k1/elliptic");

const bitcoino = require("./");

describe("Genesis block", () => {
  const { genesis } = bitcoino.blocks;
  it("contains the owner's public key", () => {
    assert(genesis[0]);
  });
  it("contains a valid owner public key", () => {
    assert(secp256k1.publicKeyVerify(genesis[0]));
  });
  it("contains an empty previous transaction hash", () => {
    assert(genesis[1] === undefined);
  });
  it("contains an empty previous owner signature", () => {
    assert(genesis[2] === undefined);
  });
});

describe("createTransaction", () => {
  it("doesn't throw an exception on valid key pairs", () => {
    bitcoino.createTransaction({
      newOwnerPublicKey: bitcoino.generateKeyPair().publicKey,
      previousTransaction: bitcoino.blocks.genesis,
      ownerPrivateKey: bitcoino.generateKeyPair().privateKey,
    });
  });
  it("returns a tx with the same owner public key as the one provided", () => {
    const newOwnerPublicKey = bitcoino.generateKeyPair().publicKey;
    const previousTransaction = bitcoino.blocks.genesis;
    const ownerPrivateKey = bitcoino.satoshiKeys.privateKey;

    const tx = bitcoino.createTransaction({
      newOwnerPublicKey,
      previousTransaction,
      ownerPrivateKey,
    });

    assert(tx[0] === newOwnerPublicKey);
  });
  it("returns a tx with the hash of (previous transaction + new owner's public key) ", () => {
    const newOwnerPublicKey = bitcoino.generateKeyPair().publicKey;
    const previousTransaction = bitcoino.blocks.genesis;
    const ownerPrivateKey = bitcoino.satoshiKeys.privateKey;

    const tx = bitcoino.createTransaction({
      newOwnerPublicKey,
      previousTransaction,
      ownerPrivateKey,
    });

    assert.deepStrictEqual(
      tx[1],
      bitcoino.getHash([previousTransaction, newOwnerPublicKey])
    );
  });
  it("returns a tx with the previous owner's signature", () => {
    const newOwnerPublicKey = bitcoino.generateKeyPair().publicKey;
    const previousTransaction = bitcoino.blocks.genesis;
    const ownerPrivateKey = bitcoino.satoshiKeys.privateKey;
    const previousTransactionHash = bitcoino.getHash([
      previousTransaction,
      newOwnerPublicKey,
    ]);

    const tx = bitcoino.createTransaction({
      newOwnerPublicKey,
      previousTransaction,
      ownerPrivateKey,
    });

    assert.deepStrictEqual(
      tx[2],
      bitcoino.sign(
        bitcoino.getHash([previousTransactionHash, newOwnerPublicKey]),
        ownerPrivateKey
      )
    );
  });
});
describe("verifyTransaction", () => {
  it("returns false for invalid transactions", () => {
    assert.equal(
      bitcoino.verifyTransaction({
        transaction: [
          bitcoino.generateKeyPair().publicKey,
          crypto.randomBytes(32),
          bitcoino.sign(crypto.randomBytes(32), crypto.randomBytes(32)),
        ],
        previousOwnerPublicKey: bitcoino.generateKeyPair().publicKey,
      }),
      false
    );
  });
  it("returns true for valid transactions", () => {
    const newOwnerPublicKey = bitcoino.generateKeyPair().publicKey;
    const previousTransaction = bitcoino.blocks.genesis;
    const ownerPrivateKey = bitcoino.satoshiKeys.privateKey;
    const transaction = bitcoino.createTransaction({
      newOwnerPublicKey,
      previousTransaction,
      ownerPrivateKey,
    });

    assert(
      bitcoino.verifyTransaction({
        transaction,
        previousOwnerPublicKey: previousTransaction[0],
      })
    );
  });
});

describe("Chain of transactions (digital signatures)", () => {
  it("works for Satoshi -> Alice -> Bob", () => {
    const alice = bitcoino.generateKeyPair();
    const bob = bitcoino.generateKeyPair();
    const tx0 = bitcoino.blocks.genesis;
    const tx1 = bitcoino.createTransaction({
      newOwnerPublicKey: alice.publicKey,
      previousTransaction: tx0,
      ownerPrivateKey: bitcoino.satoshiKeys.privateKey,
    });
    assert(
      bitcoino.verifyTransaction({
        transaction: tx1,
        previousOwnerPublicKey: bitcoino.satoshiKeys.publicKey,
      })
    );
    const tx2 = bitcoino.createTransaction({
      newOwnerPublicKey: bob.publicKey,
      previousTransaction: tx1,
      ownerPrivateKey: alice.privateKey,
    });
    assert(
      bitcoino.verifyTransaction({
        transaction: tx2,
        previousOwnerPublicKey: alice.publicKey,
      })
    );
  });
});

describe("Mining", () => {
  it("returns a buffer", () => {
    const hash = bitcoino.mine();
    assert(Buffer.isBuffer(hash));
  });
  it("returns a buffer of length 32", () => {
    const hash = bitcoino.mine();
    assert.strictEqual(hash.length, 32);
  });
  it("returns a buffer with 1 leading zero", () => {
    const hash = bitcoino.mine({ difficulty: 1 });
    assert.strictEqual(hash[0], 0);
  });
  it("returns a buffer with N leading zeros", () => {
    const difficulty = 2;
    const hash = bitcoino.mine({ difficulty });
    assert.strictEqual(
      hash.compare(
        Buffer.from(Array.from({ length: difficulty }, (v, i) => 0)),
        0,
        difficulty,
        0,
        difficulty
      ),
      0
    );
  });
});
