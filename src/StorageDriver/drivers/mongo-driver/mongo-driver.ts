import { IStorageDriver } from "../../storage-driver.interface";
import { Credential } from "@iota/identity-wasm/node";
import { IMongoDriverOptions } from "./mongo-driver.types";
import mongoose, { Document } from "mongoose";
import { StoredVc } from "./stored-vc.schema";
import { IdentityAccount } from "../../../IdentityAccount/identity-account";
import { Fragment } from "../../../identity-manager.types";
import { IStoredVc } from "../storage-driver.types";

export class MongoStorageDriver
  implements IStorageDriver<Credential, Document>
{
  mongouri: string;
  account: IdentityAccount;
  fragment: Fragment;

  private constructor(options: IMongoDriverOptions) {
    this.mongouri = options.mongouri;
    this.fragment = options.fragment;
  }

  /**
   * Instantiate a new instance of FsStorageDriver
   *
   * @param {IFsDriverOpts} options - options object for FsStorageDriver
   * @returns {Promise<FsStorageDriver>}
   */

  static async newInstance(
    options: IMongoDriverOptions
  ): Promise<MongoStorageDriver> {
    const mongoDriver = new MongoStorageDriver(options);
    await this.connectMongoDb(options.mongouri);
    return mongoDriver;
  }

  private static async connectMongoDb(uri: string) {
    await mongoose.connect(uri).catch((err) => {
      throw new Error(`unable to connect to mongodb: ${err}`);
    });
  }

  /**
   * Get all of the credentials stored
   *
   * @returns {Promise<Credential[]>}
   */
  async findAll(): Promise<Credential[]> {
    return Promise.all(
      (await StoredVc.find({})).map(async (c) => {
        return Credential.fromJSON(
          JSON.parse(
            await this.account.decryptData(c.credential, this.fragment)
          )
        );
      })
    );
  }

  /**
   * Find a Credential by it's ID
   *
   * @param {String} id
   * @returns {Promise<Credential[]>}
   */
  async findById(id: string): Promise<Credential> {
    const foundCredRaw = await StoredVc.findOne({ id });
    if (!foundCredRaw) throw new Error("Credential Not found");
    return Credential.fromJSON(
      JSON.parse(
        await this.account.decryptData(foundCredRaw.credential, this.fragment)
      )
    );
  }

  /**
   * Filter all creds with a specific credential type
   *
   * @param {String} credType - type of the credential to look for
   * @returns {Promise<Credential[]>}
   */
  async findByCredentialType(credType: string): Promise<Credential[]> {
    const foundCredsRaw = await StoredVc.find({ type: { $in: [credType] } });
    if (!foundCredsRaw) throw new Error("Credentials Not found");
    return Promise.all(
      foundCredsRaw.map(async (c) => {
        return Credential.fromJSON(
          JSON.parse(
            await this.account.decryptData(c.credential, this.fragment)
          )
        );
      })
    );
  }

  /**
   * Filter all creds issued by a specific issuer
   *
   * @param {String} issuer
   * @returns {Promise<Credential[]>}
   */
  async findByIssuer(issuer: string): Promise<Credential[]> {
    const foundCredsRaw = await StoredVc.find({ issuer });
    if (!foundCredsRaw) throw new Error("Credentials Not found");
    return Promise.all(
      foundCredsRaw.map(async (c) => {
        return Credential.fromJSON(
          JSON.parse(
            await this.account.decryptData(c.credential, this.fragment)
          )
        );
      })
    );
  }

  /**
   * Save a new credential to the driver
   *
   * @param {Credential} cred - credential to add to FS
   * @returns {Promise<void>}
   */
  async newCredential(cred: Credential): Promise<Partial<IStoredVc>> {
    const credentialExists = await StoredVc.findOne({ id: cred.id() });
    if (credentialExists) throw new Error("credential already exists");
    const encrypted = await this.account.encryptData(
      JSON.stringify(cred.toJSON()),
      this.fragment
    );
    const storedCred = await StoredVc.create({
      id: cred.id(),
      type: cred.type(),
      issuer: cred.issuer(),
      credential: encrypted.toJSON(),
    });
    return storedCred;
  }

  /**
   * Delete a credential by ID
   *
   * @param {String} id - id of the credential to delete
   * @returns {Promise<void>}
   */
  async delete(id: string): Promise<void> {
    await StoredVc.findOneAndDelete({ id });
  }
}
