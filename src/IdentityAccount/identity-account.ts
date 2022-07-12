import { IIdentityAccountProps } from "./identity-account-props.interface";
import { CredentialsManager } from "../CredentialsManager/credentials-manager";
import {
  Account,
  MethodContent,
  MethodScope,
  RevocationBitmap,
  AgreementInfo,
  EncryptionAlgorithm,
  CekAlgorithm,
  EncryptedData,
  DID,
  Document,
} from "@iota/identity-wasm/node";
import { Fragment } from "../identity-manager.types";
import { Driver } from "../StorageDriver/drivers/storage-driver.types";

/**
 * Utitlity class to bind wrapper methods to an Identity Instance
 */

export class IdentityAccount extends CredentialsManager {
  account: Account;
  credentials: CredentialsManager;

  constructor(props: IIdentityAccountProps) {
    super({
      account: props.account,
      revocationEndpoint: "#revocation-bitmap",
      store: {
        type: Driver.Mongo,
        options: {
          mongouri: "mongodb://localhost:27017",
        },
      },
    });
    this.account = props.account;
  }

  /**
   * Get the DID associated to the account
   *
   * @returns {DID}
   */

  getDid(): DID {
    return this.account.did();
  }

  /**
   * Get the Document associated to the Account
   */
  getDocument(): Document {
    return this.account.document();
  }

  /**
   * Manipulate a DID and attach a verification method to it
   *
   * @param {Fragment} fragment
   * @returns {Promise<void>}
   */

  async attachSigningMethod(fragment: Fragment): Promise<void> {
    await this.account.createMethod({
      content: MethodContent.GenerateEd25519(),
      fragment,
    });
    const revocationBitmap = new RevocationBitmap();
    await this.account.createService({
      fragment: "revocation-bitmap",
      type: RevocationBitmap.type(),
      endpoint: revocationBitmap.toEndpoint(),
    });
    await this.account.publish();
  }

  /**
   * Manipulate the DID and attach an encryption method to it
   *
   * @param {Fragment} fragment - fragment for the encryption method
   * @returns {Promise<void>}
   */

  async attachEncryptionMethod(fragment: Fragment): Promise<void> {
    await this.account.createMethod({
      fragment,
      scope: MethodScope.KeyAgreement(),
      content: MethodContent.GenerateX25519(),
    });
    await this.account.publish();
  }

  /**
   * Encrypt data and return it
   *
   * @param {String} plainText - data to be encrypted
   * @param {Fragment} fragment - fragment to encrypt data with
   * @returns {Promise<EncryptedData>}
   */

  async encryptData(
    plainText: string,
    fragment: Fragment
  ): Promise<EncryptedData> {
    const method = this.account.document().resolveMethod(fragment);

    if (!method) throw new Error("Method not found");
    const publicKey = method.data().tryDecode();

    const agreementInfo = new AgreementInfo(
      new Uint8Array(0),
      new Uint8Array(0),
      new Uint8Array(0),
      new Uint8Array(0)
    );

    const encryptionAlgorithm = EncryptionAlgorithm.A256GCM();

    const cekAlgorithm = CekAlgorithm.EcdhEs(agreementInfo);
    const message = Buffer.from(plainText);
    const associatedData = Buffer.from("associatedData");

    const encryptedData = await this.account
      .encryptData(
        message,
        associatedData,
        encryptionAlgorithm,
        cekAlgorithm,
        publicKey
      )
      .catch((err) => {
        console.error(err);
      });

    if (!encryptedData) throw new Error("failed to encrypt data");
    return encryptedData;
  }

  /**
   * Decrypt the data
   *
   * @param {EncryptedData | JSON | Record<string, unknown>} encryptedData - data to decrypt
   * @param {Fragment} fragment - fragment to decrypt the data with
   * @returns {Promise<string>}
   */

  async decryptData(
    encryptedData: EncryptedData | JSON | Record<string, unknown>,
    fragment: Fragment
  ): Promise<string> {
    encryptedData =
      encryptedData instanceof EncryptedData
        ? encryptedData
        : EncryptedData.fromJSON(encryptedData);

    const agreementInfo = new AgreementInfo(
      new Uint8Array(0),
      new Uint8Array(0),
      new Uint8Array(0),
      new Uint8Array(0)
    );
    const encryptionAlgorithm = EncryptionAlgorithm.A256GCM();

    const cekAlgorithm = CekAlgorithm.EcdhEs(agreementInfo);
    const decryptedData = await this.account.decryptData(
      encryptedData,
      encryptionAlgorithm,
      cekAlgorithm,
      fragment
    );

    const plainText = new TextDecoder().decode(decryptedData);

    return plainText;
  }
}
