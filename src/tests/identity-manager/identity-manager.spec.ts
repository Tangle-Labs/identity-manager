import { IdentityManager } from "../../identity-manager";
import { Credential, EncryptedData, Resolver } from "@iota/identity-wasm/node";
import * as path from "path";
import * as fs from "fs";
import { IdentityAccount } from "../../IdentityAccount/identity-account";

const testingFilepath = path.join(__dirname, "../testing-identity");
const strongholdFilepath = path.join(__dirname, "../../../dist/");
const strongholdPassword = "password";
const managerAlias = "identity";
try {
  fs.unlinkSync(
    path.resolve(__dirname, "../../../dist/", "identity.stronghold")
  );
} catch {
  null;
}
try {
  fs.unlinkSync(
    path.resolve(__dirname, "../../../dist/", "identity-config.json")
  );
} catch {
  null;
}
let identityManager: IdentityManager;

describe("identity-manager", () => {
  /**
   * Create a new instance of Identity Manager
   */

  test("should instantiate IdentityManager", async () => {
    identityManager = await IdentityManager.newInstance({
      filepath: strongholdFilepath,
      password: strongholdPassword,
      managerAlias,
    });
    expect(identityManager).toBeInstanceOf(IdentityManager);
  });

  /**
   * Create a new DID
   */

  test("should create DID", async () => {
    const identity = await identityManager?.createDid("test-1");
    expect(identity).toBeInstanceOf(IdentityAccount);
  });

  /**
   * Check if an error is thrown on a duplicate alias
   */

  test("should throw error on duplicate alias", async () => {
    await expect(identityManager?.createDid("test-1")).rejects.toThrowError();
  });

  /**
   * Attempt to load the DID by it's Alias
   */

  test("should load DID by alias", async () => {
    const identity = await identityManager.getIdentityByAlias("test-1");
    expect(identity).toBeInstanceOf(IdentityAccount);
  });

  /**
   * Attach a signing method to the DID
   */

  test("should attach signing method to DID", async () => {
    const identity = await identityManager.getIdentityByAlias("test-1");
    await identity.attachSigningMethod("#signing-method");
  });

  /**
   * Sign a Credential and verify it
   */

  test("should sign and verify a VC", async () => {
    const loadedIdentityManager = await IdentityManager.newInstance({
      filepath: testingFilepath,
      password: "password",
      managerAlias,
    });
    const identity = await loadedIdentityManager.getIdentityByAlias("main-did");
    const signedVc = await identity.credentials.create({
      keyIndex: 5,
      id: "http://coodos.co/123",
      type: "UniversityDegreeCredential",
      recipientDid: "did:iota:DjkCo13iQapZUj4ivuFxSza6iYmmvsnq3RhHEaqYUo5M",
      fragment: "#signing-method",
      body: {
        testFieldOne: "asdf",
        testFieldTwo: "asdf",
      },
    });

    expect(signedVc).toBeInstanceOf(Credential);
    const validationResult = await identity.credentials.verifyCredential(
      signedVc
    );

    expect(validationResult).toBeTruthy();
  });

  /**
   * Sign a credential and revoke it
   */

  test("should sign a credential and revoke it", async () => {
    const identity = await identityManager.createDid(String(Math.random()));
    await identity.attachSigningMethod("#signingmethod");
    const signedVc = await identity.credentials.create({
      keyIndex: 5,
      id: "http://coodos.co/123",
      type: "UniversityDegreeCredential",
      recipientDid: "did:iota:DjkCo13iQapZUj4ivuFxSza6iYmmvsnq3RhHEaqYUo5M",
      fragment: "#signingmethod",
      body: {
        testFieldOne: "asdf...",
        testFieldTwo: "asdf...",
      },
    });

    const resolver = new Resolver();
    const did1 = await resolver.resolve(signedVc.toJSON().issuer);
    const result = await identity.credentials.isCredentialValid(signedVc, did1);
    expect(result).toBeTruthy();
    await identity.credentials.revokeCredential(5);
    const did = await resolver.resolve(signedVc.toJSON().issuer);
    const revokedResult = await identity.credentials.isCredentialValid(
      signedVc,
      did
    );
    expect(revokedResult).toBeFalsy();
  });

  /**
   * Attach an encryption endpoint
   */

  test("should attach encryption endpoint", async () => {
    const did = await identityManager.createDid("encryption-did");
    await did.attachEncryptionMethod("#encryption");
  });

  /**
   * Encrypt a message and decrypt it
   */

  test("should encrypt and decrypt a message", async () => {
    const did = await identityManager.getIdentityByAlias("encryption-did");
    const plainText = "foo bar";
    const encryptionFragment = "#encryption";
    const encryptedData = await did.encryptData(plainText, encryptionFragment);
    expect(encryptedData).toBeInstanceOf(EncryptedData);
    const decryptedData = await did.decryptData(
      encryptedData,
      encryptionFragment
    );
    expect(decryptedData).toEqual(plainText);
  });
});
