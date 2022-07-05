import { FsStorageDriver } from "../../StorageDriver/drivers/fs-driver/fs-driver";
import { cred1, cred2 } from "./sample-creds";
import * as path from "path";
import * as fs from "fs";

const filepath = path.resolve(__dirname, "../../../dist/creds.json");
try {
  fs.unlinkSync(filepath);
} catch {
  null;
}
let fsDriver: FsStorageDriver;

describe("fs-storage-driver", () => {
  test("should instantiate FsStorageDriver", async () => {
    fsDriver = await FsStorageDriver.newInstance({ filepath });
    expect(fsDriver).toBeInstanceOf(FsStorageDriver);
  });

  test("should save new credential", async () => {
    await fsDriver.newCredential(cred1);
    await fsDriver.newCredential(cred2);
  });

  test("should throw error on duplicate credential", async () => {
    await expect(fsDriver.newCredential(cred1)).rejects.toThrowError();
  });

  test("should find credential by id", async () => {
    const id = cred2.id() as string;
    const cred = await fsDriver.findById(id);
    expect(cred2.toJSON()).toEqual(cred.toJSON());
  });

  test("should find all credentials by Type", async () => {
    const creds = await fsDriver.findByCredentialType(
      "UniversityDegreeCredential"
    );
    expect(creds.length).toEqual(2);
  });

  test("should find 0 credentials by incorrect Type", async () => {
    const creds = await fsDriver.findByCredentialType(
      "NotAUniversityDegreeCredential"
    );
    expect(creds.length).toEqual(0);
  });

  test("should find credentials by issuer", async () => {
    const issuer = cred2.issuer() as string;
    const creds = await fsDriver.findByIssuer(issuer);
    expect(creds.length).toEqual(1);
  });

  test("should delete a credential by ID", async () => {
    const id = cred2.id() as string;
    await fsDriver.delete(id);
    const creds = await fsDriver.findAll();
    expect(creds[0].toJSON()).toEqual(cred1.toJSON());
  });
});