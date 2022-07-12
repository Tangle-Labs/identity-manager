import { IBaseStorageDriverProps } from "../storage-driver.types";

export interface IMongoDriverOptions extends IBaseStorageDriverProps {
  mongouri: string;
}
