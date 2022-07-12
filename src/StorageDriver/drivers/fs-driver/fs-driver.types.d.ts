import { PathLike } from "fs";
import { IBaseStorageDriverProps } from "../storage-driver.types";

export interface IFsDriverProps extends IBaseStorageDriverProps {
  /**
   * FilePath for the JSON where credentials shall be stored
   */
  filepath: JsonPath;
}

export type JsonPath = `${PathLike}.json`;
