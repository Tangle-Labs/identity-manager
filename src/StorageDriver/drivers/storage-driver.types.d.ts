import { Issuer } from "@iota/identity-wasm/node";
import { PathLike } from "fs";
import { Fragment } from "../../identity-manager.types";
import { IdentityAccount } from "../../IdentityAccount/identity-account";
import { FsStorageDriver } from "./fs-driver/fs-driver";
import { MongoStorageDriver } from "./mongo-driver/mongo-driver";

/**
 * Enum for currently implemented Drivers
 */

enum Driver {
  Mongo = MongoStorageDriver,
  FS = FsStorageDriver,
}

/**
 * Props for `MongoStorageDriver`
 */
interface MongoProps {
  mongouri: string;
}

/**
 * Props for `FsStorageDriver`
 */
interface FsProps {
  filepath: `${PathLike}.json`;
}

/**
 * Combined interface for props
 */
export interface StorageDriverProps<K> {
  type: Drivers;
  options: K extends Driver.FS
    ? FsProps
    : K extends Driver.Mongo
    ? MongoProps
    : never;
}

/**
 * All implemented Storage Driver Types
 */

export type StorageDriver = MongoStorageDriver | FsStorageDriver;

/**
 * Spec for a stored VC schema
 */
export interface IStoredVc {
  /*
   * Id of the credential
   */
  id: string;

  /**
   * Issuing DID of the credential
   */
  issuer: string | Issuer;

  /**
   * Type of the credential
   */
  type: string[];

  /**
   * Encrypted Credential
   */
  credential: Record<string, unknown>;
}

/**
 * Base props all storage drivers will need
 */
export interface IBaseStorageDriverProps {
  /**
   * Fragment to encrypt credentials with
   */

  fragment: Fragment;
}
