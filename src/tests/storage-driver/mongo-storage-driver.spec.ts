import { MongoStorageDriver } from "../../StorageDriver/drivers/mongo-driver/mongo-driver";
import { cred1, cred2 } from "./sample-creds";
import { IdentityManager } from "../../";
import * as path from "path";
import * as fs from "fs";
import { MongoMemoryServer } from "mongodb-memory-server";

const testingFilepath = path.resolve(__dirname, "../../../dist/");

function tryUnlinkFile(filepath: fs.PathLike) {
  try {
    fs.unlinkSync(filepath);
  } catch {
    null;
  }
}

tryUnlinkFile(`${testingFilepath}/mongo-id-config.json`);
tryUnlinkFile(`${testingFilepath}/mongo-id.stronghold`);

let mongoDriver: MongoStorageDriver;
let mongoServer: MongoMemoryServer;

describe("mongo-storage-driver", () => {
  test("should instantiate MongoStorageDriver", async () => {
    const manager = await IdentityManager.newInstance({
      filepath: testingFilepath,
      password: "password",
      managerAlias: "mongo-id",
    });

    mongoServer = await MongoMemoryServer.create();

    const fragment = "#encryption";

    const did = await manager.createDid("new-did");
    await did.attachEncryptionMethod(fragment);

    mongoDriver = await MongoStorageDriver.newInstance({
      mongouri: mongoServer.getUri(),
      fragment,
    });
    expect(mongoDriver).toBeInstanceOf(MongoStorageDriver);
  });

  test("should save new credential", async () => {
    await mongoDriver.newCredential(cred1);
    await mongoDriver.newCredential(cred2);
  });

  test("should throw error on duplicate credential", async () => {
    await expect(mongoDriver.newCredential(cred1)).rejects.toThrowError();
  });

  test("should find credential by id", async () => {
    const id = cred2.id() as string;
    const cred = await mongoDriver.findById(id);
    expect(cred2.toJSON()).toEqual(cred.toJSON());
  });

  test("should find all credentials by Type", async () => {
    const creds = await mongoDriver.findByCredentialType(
      "UniversityDegreeCredential"
    );
    expect(creds.length).toEqual(2);
  });

  test("should find 0 credentials by incorrect Type", async () => {
    const creds = await mongoDriver.findByCredentialType(
      "NotAUniversityDegreeCredential"
    );
    expect(creds.length).toEqual(0);
  });

  test("should find credentials by issuer", async () => {
    const issuer = cred2.issuer() as string;
    const creds = await mongoDriver.findByIssuer(issuer);
    expect(creds.length).toEqual(1);
  });

  test("should delete a credential by ID", async () => {
    const id = cred2.id() as string;
    await mongoDriver.delete(id);
    const creds = await mongoDriver.findAll();
    expect(creds[0].toJSON()).toEqual(cred1.toJSON());
    await expect(mongoDriver.findById(id)).rejects.toThrow();

    await mongoServer.stop({ doCleanup: true });
  });
});
