import {
  IBaseStorageDriverProps,
  StorageDriver,
  StorageDriverProps,
} from "./storage-driver.types";

/**
 * Create a new storage driver
 *
 * @param {StorageDriverProps<T> & IBaseStorageDriverProps} props
 * @returns {Promise<StorageDriver>}
 */
export async function buildStorageDriver<T>(
  props: StorageDriverProps<T> & IBaseStorageDriverProps
): Promise<StorageDriver> {
  const { type, options, fragment } = props;
  return type.newInstance({ ...options, fragment });
}
