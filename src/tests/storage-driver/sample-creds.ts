import { Credential } from "@iota/identity-wasm/node";

export const cred1 = Credential.fromJSON({
  "@context": "https://www.w3.org/2018/credentials/v1",
  id: "http://coodos.co/123",
  type: ["VerifiableCredential", "UniversityDegreeCredential"],
  credentialSubject: {
    id: "did:iota:DjkCo13iQapZUj4ivuFxSza6iYmmvsnq3RhHEaqYUo5M",
    testFieldOne: "asdf...",
    testFieldTwo: "asdf...",
  },
  issuer: "did:iota:4WKDvV4YtSfJhPVCd4t8T7vx1PUWy1aAPjsZJx8dGivG",
  issuanceDate: "2022-07-05T14:29:35Z",
  credentialStatus: {
    id: "did:iota:4WKDvV4YtSfJhPVCd4t8T7vx1PUWy1aAPjsZJx8dGivG#revocation-bitmap",
    type: "RevocationBitmap2022",
    revocationBitmapIndex: "5",
  },
  proof: {
    type: "JcsEd25519Signature2020",
    verificationMethod:
      "did:iota:4WKDvV4YtSfJhPVCd4t8T7vx1PUWy1aAPjsZJx8dGivG#signingmethod",
    signatureValue:
      "2wFd8ExHjZFR7BaFR6MzKmtUWGypuVMNeDdsVhway7uC1sTKGvc5LF3sJHaVnaqRrDdN6K7UU2BDgJVYx9EfsysC",
  },
});

export const cred2 = Credential.fromJSON({
  "@context": "https://www.w3.org/2018/credentials/v1",
  id: "http://coodos.co/1234",
  type: ["VerifiableCredential", "UniversityDegreeCredential"],
  credentialSubject: {
    id: "did:iota:DjkCo13iQapZUj4ivuFxSza6iYmmvsnq3RhHEaqYUo5M",
    testFieldOne: "asdf...",
    testFieldTwo: "asdf...",
  },
  issuer: "did:iota:E33PX2mw1KUif3c2m8Ukkr7wMpaTas6UdcRAwRuMXza7",
  issuanceDate: "2022-07-05T15:30:35Z",
  credentialStatus: {
    id: "did:iota:E33PX2mw1KUif3c2m8Ukkr7wMpaTas6UdcRAwRuMXza7#revocation-bitmap",
    type: "RevocationBitmap2022",
    revocationBitmapIndex: "5",
  },
  proof: {
    type: "JcsEd25519Signature2020",
    verificationMethod:
      "did:iota:E33PX2mw1KUif3c2m8Ukkr7wMpaTas6UdcRAwRuMXza7#signingmethod",
    signatureValue:
      "3JHHvmKud8Enh5VEnuLYGgGfyC6DHnsXwatUEbhkurQqaMytCU7UUtYaMfS2VSr2UPk4amD6jHsv8uwPo8AZuW33",
  },
});

export const cred3 = Credential.fromJSON({
  "@context": "https://www.w3.org/2018/credentials/v1",
  id: "http://coodos.co/12345",
  type: ["VerifiableCredential", "UniversityDegreeCredential"],
  credentialSubject: {
    id: "did:iota:DjkCo13iQapZUj4ivuFxSza6iYmmvsnq3RhHEaqYUo5M",
    testFieldOne: "asdf...",
    testFieldTwo: "asdf...",
  },
  issuer: "did:iota:8caHNYkuJnt3VCjQFxthbwSfMcjeGAtyFYbpMXBffkLj",
  issuanceDate: "2022-07-05T15:32:12Z",
  credentialStatus: {
    id: "did:iota:8caHNYkuJnt3VCjQFxthbwSfMcjeGAtyFYbpMXBffkLj#revocation-bitmap",
    type: "RevocationBitmap2022",
    revocationBitmapIndex: "5",
  },
  proof: {
    type: "JcsEd25519Signature2020",
    verificationMethod:
      "did:iota:8caHNYkuJnt3VCjQFxthbwSfMcjeGAtyFYbpMXBffkLj#signingmethod",
    signatureValue:
      "377inzvfRXZoTiZZToBvPYPsUehzqD5fmGgFjrfekbBHmMYTwMdXowb8MWsARRVm54dXFPhtKdjDMUtHYoymsPFy",
  },
});

export const creds = [cred1, cred2, cred3];
