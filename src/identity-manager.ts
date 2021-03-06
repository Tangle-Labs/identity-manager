import { AccountBuilder, DID } from "@iota/identity-wasm/node";
import { Stronghold } from "@iota/identity-stronghold-nodejs";
import { IIdentityManagerProps } from "./identity-manager-props.interface";
import { IdentityConfig } from "./identity-config.type";
import { promisify } from "util";
import { clientConfig } from "./client-config";
import { IdentityAccount } from "./IdentityAccount/identity-account";
import * as fs from "fs";
import * as path from "path";

const fsReadFile = promisify(fs.readFile);
const fsWriteFile = promisify(fs.writeFile);

/**
 * IdentityManager is a utility class which handles management of secrets and
 * DID documents stored inside of one stronghold backup, private constructor needs
 * a path and password
 */

export class IdentityManager {
  builder: AccountBuilder;
  filepath: string;
  password: string;
  managerAlias: string;

  /**
   * Constructor to create an instance of the class
   *
   * @param {String} filepath
   * @param {String} password
   */

  private constructor(
    filepath: string,
    password: string,
    managerAlias: string
  ) {
    this.filepath = filepath;
    this.password = password;
    this.managerAlias = managerAlias;
  }

  /**
   * Get the instance of IdentityManager, it will create a new instance of the class
   * shall one not already exist
   *
   * @param {IIdentityManagerProps} props
   * @returns {Promise<IdentityManager>}
   */

  static async newInstance(
    props: IIdentityManagerProps
  ): Promise<IdentityManager> {
    const { filepath, password, managerAlias } = props;

    const identityManager = new IdentityManager(
      filepath,
      password,
      managerAlias
    );
    const strongholdPath = path.resolve(
      __dirname,
      filepath,
      `${managerAlias}.stronghold`
    );

    const storage = await Stronghold.build(strongholdPath, password);

    const autopublish = false;

    const builder = new AccountBuilder({
      storage,
      clientConfig,
      autopublish,
    });

    identityManager.builder = builder;
    return identityManager;
  }

  /**
   * Get the IdentityConfig document stored on a JSON
   *
   * @returns {IdentityConfig[]}
   */

  private async getIdentityConfig(): Promise<IdentityConfig[]> {
    const identityPath = path.resolve(
      __dirname,
      this.filepath,
      `${this.managerAlias}-config.json`
    );
    return JSON.parse((await fsReadFile(identityPath)).toString());
  }

  /**
   * Load a DID stored in the same stronghold path as the one configured
   *
   * @param {DID} did
   * @returns {Promise<IdentityAccount>}
   */

  async getDid(did: DID): Promise<IdentityAccount> {
    const account = await this.builder.loadIdentity(did);
    return new IdentityAccount({ account });
  }

  /**
   * Create a new DID in the stronghold path as the one configured
   *
   * @param {IIdentityManagerProps} props - Alias for the identity
   * @returns {Promise<IdentityAccount>}
   */

  async createDid(alias: string): Promise<IdentityAccount> {
    const account = await this.builder.createIdentity();
    await account.publish();
    let identities: IdentityConfig[] = [];
    const document = account.document();
    const did = account.did();
    const identityPath = path.resolve(
      __dirname,
      this.filepath,
      `${this.managerAlias}-config.json`
    );
    try {
      identities = await this.getIdentityConfig();
      const aliasExists = identities.find(
        (i: IdentityConfig) => i.alias === alias
      );
      if (aliasExists) {
        throw new Error(`Alias \`${alias}\` already in use`);
      }
      // eslint-disable-next-line  @typescript-eslint/no-explicit-any
    } catch (error: any) {
      if (error.code !== "ENOENT") {
        throw new Error(error);
      }
    }

    identities = [
      ...identities,
      {
        alias,
        document,
        did,
      },
    ];
    await fsWriteFile(identityPath, JSON.stringify(identities)).catch(() => {
      throw new Error("Unable to write IdentityConfig");
    });
    return new IdentityAccount({ account });
  }

  /**
   * Gets an account by the alias stored in the config
   *
   * @param alias
   * @returns {Promise<IdentityAccount>}
   */

  async getIdentityByAlias(alias: string): Promise<IdentityAccount> {
    const identities: IdentityConfig[] = await this.getIdentityConfig();
    const identity = identities.find((i: IdentityConfig) => i.alias === alias);
    if (!identity) throw new Error("Identity not found");
    const account = await this.builder.loadIdentity(DID.fromJSON(identity.did));
    return new IdentityAccount({ account });
  }
}
