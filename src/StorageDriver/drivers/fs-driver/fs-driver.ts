import { readFile, writeFile, PathLike } from "fs";
import { IStorageDriver } from "../../storage-driver.interface";
import { Credential } from "@iota/identity-wasm/node";
import { IFsDriverProps } from "./fs-driver.types";
import { promisify } from "util";
import { IdentityAccount } from "../../../IdentityAccount/identity-account";
import { IStoredVc } from "../storage-driver.types";
import { Fragment } from "../../../identity-manager.types";

const fsReadFile = promisify(readFile);
const fsWriteFile = promisify(writeFile);

export class FsStorageDriver implements IStorageDriver<Credential, IStoredVc> {
  filepath: PathLike;
  account: IdentityAccount;
  fragment: Fragment;

  private constructor(options: IFsDriverProps) {
    this.filepath = options.filepath;
    this.fragment = options.fragment;
  }

  /**
   * Instantiate a new instance of FsStorageDriver
   *
   * @param {IFsDriverProps} options - options object for FsStorageDriver
   * @returns {Promise<FsStorageDriver>}
   */

  static async newInstance(options: IFsDriverProps): Promise<FsStorageDriver> {
    const fsDriver = new FsStorageDriver(options);
    await this.instantiateFile(options);
    return fsDriver;
  }

  /**
   * Creates a file if it doesn't exist
   *
   * @returns {Promise<void>}
   */
  private static async instantiateFile(options: IFsDriverProps): Promise<void> {
    // eslint-disable-next-line  @typescript-eslint/no-explicit-any
    const fileData = await fsReadFile(options.filepath).catch((error: any) => {
      if (error.code !== "ENOENT") throw new Error(error);
    });
    if (fileData) return;
    await fsWriteFile(options.filepath, JSON.stringify([])).catch(() => {
      throw new Error("FS ERROR: Unable to write to file");
    });
  }

  /**
   * Get the file contents of the file stored at the configured storage path
   *
   * @returns {Promise<Credential[]>}
   */
  private async getFileContents(): Promise<IStoredVc[]> {
    const fileData = await fsReadFile(this.filepath).catch(() => {
      throw new Error("FS ERROR: Unable to read file data");
    });

    // I HAVE NO IDEA WHY THIS IS HAPPENING BUT REMOVING THIS CONSOLE LOG
    // LEADS TO 4 UNIT TESTS FAILING :carloshuh:
    console.log("");

    return JSON.parse(fileData.toString());
  }

  /**
   * Write the contents passed to the file configured at storage path
   *
   * @param {Credential[]} data - data to write to the file
   * @returns {Promise<void>}
   */
  private async writeFileContents(data: IStoredVc[]): Promise<void> {
    await fsWriteFile(this.filepath, JSON.stringify(data)).catch(() => {
      throw new Error("FS ERROR: Unable to write to file");
    });
  }

  /**
   * Get all of the credentials stored
   *
   * @returns {Promise<Credential[]>}
   */
  async findAll(): Promise<Credential[]> {
    return Promise.all(
      (await this.getFileContents()).map(async (c) =>
        Credential.fromJSON(
          JSON.parse(
            await this.account.decryptData(c.credential, this.fragment)
          )
        )
      )
    );
  }

  /**
   * Find a Credential by it's ID
   *
   * @param {String} id
   * @returns {Promise<Credential[]>}
   */
  async findById(id: string): Promise<Credential> {
    const creds = await this.getFileContents();
    const cred = creds.find((c) => c.id === id);
    if (!cred) throw new Error("Credential not found");
    const credentialRaw = JSON.parse(
      await this.account.decryptData(cred.credential, this.fragment)
    );
    return Credential.fromJSON(credentialRaw);
  }

  /**
   * Filter all creds with a specific credential type
   *
   * @param {String} credType - type of the credential to look for
   * @returns {Promise<Credential[]>}
   */
  async findByCredentialType(credType: string): Promise<Credential[]> {
    const creds = await this.getFileContents();
    return await Promise.all(
      creds
        .filter((c) => c.type.includes(credType))
        .map(async (c) => {
          const credentialRaw = JSON.parse(
            await this.account.decryptData(c.credential, this.fragment)
          );
          return Credential.fromJSON(credentialRaw);
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
    const creds = await this.getFileContents();
    return await Promise.all(
      creds
        .filter((c) => c.issuer === issuer)
        .map(async (c) => {
          const credentialRaw = JSON.parse(
            await this.account.decryptData(c.credential, this.fragment)
          );
          return Credential.fromJSON(credentialRaw);
        })
    );
  }

  /**
   * Save a new credential to the driver
   *
   * @param {Credential} cred - credential to add to FS
   * @returns {Promise<void>}
   */
  async newCredential(cred: Credential): Promise<IStoredVc> {
    const storedCredentials = await this.getFileContents();
    const credentialExists = storedCredentials.find((c) => c.id === cred.id());
    if (credentialExists) throw new Error("credential already exists");
    const creds = await this.getFileContents();
    const encrypted = await this.account.encryptData(
      JSON.stringify(cred.toJSON()),
      this.fragment
    );
    const storedCred = {
      id: cred.id(),
      type: cred.type(),
      issuer: cred.issuer(),
      credential: encrypted.toJSON(),
    };
    this.writeFileContents([...creds, storedCred]);
    return storedCred;
  }

  /**
   * Delete a credential by ID
   *
   * @param {String} id - id of the credential to delete
   * @returns {Promise<void>}
   */
  async delete(id: string): Promise<void> {
    const creds = await this.getFileContents();
    const credsFiltered = creds.filter((c) => c.id !== id);
    await this.writeFileContents(credsFiltered);
  }
}
