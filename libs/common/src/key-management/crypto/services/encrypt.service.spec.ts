import { mockReset, mock } from "jest-mock-extended";

import { CryptoFunctionService } from "@bitwarden/common/platform/abstractions/crypto-function.service";
import { LogService } from "@bitwarden/common/platform/abstractions/log.service";
import { EncryptionType } from "@bitwarden/common/platform/enums";
import { Utils } from "@bitwarden/common/platform/misc/utils";
import { EncArrayBuffer } from "@bitwarden/common/platform/models/domain/enc-array-buffer";
import { EncString } from "@bitwarden/common/platform/models/domain/enc-string";
import { SymmetricCryptoKey } from "@bitwarden/common/platform/models/domain/symmetric-crypto-key";
import { CsprngArray } from "@bitwarden/common/types/csprng";

import { makeStaticByteArray } from "../../../../spec";

import { EncryptServiceImplementation } from "./encrypt.service.implementation";

describe("EncryptService", () => {
  const cryptoFunctionService = mock<CryptoFunctionService>();
  const logService = mock<LogService>();

  let encryptService: EncryptServiceImplementation;

  beforeEach(() => {
    mockReset(cryptoFunctionService);
    mockReset(logService);

    encryptService = new EncryptServiceImplementation(cryptoFunctionService, logService, true);
  });

  describe("encrypt", () => {
    it("throws if no key is provided", () => {
      return expect(encryptService.encrypt(null, null)).rejects.toThrow(
        "No encryption key provided.",
      );
    });
    it("returns null if no data is provided", async () => {
      const key = mock<SymmetricCryptoKey>();
      const actual = await encryptService.encrypt(null, key);
      expect(actual).toBeNull();
    });
  });

  describe("encryptToBytes", () => {
    const plainValue = makeStaticByteArray(16, 1);
    const iv = makeStaticByteArray(16, 30);
    const encryptedData = makeStaticByteArray(20, 50);

    it("throws if no key is provided", () => {
      return expect(encryptService.encryptToBytes(plainValue, null)).rejects.toThrow(
        "No encryption key",
      );
    });

    describe("encrypts data", () => {
      beforeEach(() => {
        cryptoFunctionService.randomBytes.calledWith(16).mockResolvedValueOnce(iv as CsprngArray);
        cryptoFunctionService.aesEncrypt.mockResolvedValue(encryptedData);
      });

      it("using a key which doesn't support mac", async () => {
        const key = mock<SymmetricCryptoKey>();
        const encType = EncryptionType.AesCbc256_B64;
        key.encType = encType;

        key.macKey = null;

        const actual = await encryptService.encryptToBytes(plainValue, key);

        expect(cryptoFunctionService.hmac).not.toBeCalled();

        expect(actual.encryptionType).toEqual(encType);
        expect(actual.ivBytes).toEqualBuffer(iv);
        expect(actual.macBytes).toBeNull();
        expect(actual.dataBytes).toEqualBuffer(encryptedData);
        expect(actual.buffer.byteLength).toEqual(1 + iv.byteLength + encryptedData.byteLength);
      });
    });
  });

  describe("decryptToBytes", () => {
    const encType = EncryptionType.AesCbc256_HmacSha256_B64;
    const key = new SymmetricCryptoKey(makeStaticByteArray(64, 100), encType);
    const computedMac = new Uint8Array(1);
    const encBuffer = new EncArrayBuffer(makeStaticByteArray(60, encType));

    beforeEach(() => {
      cryptoFunctionService.hmac.mockResolvedValue(computedMac);
    });

    it("throws if no key is provided", () => {
      return expect(encryptService.decryptToBytes(encBuffer, null)).rejects.toThrow(
        "No encryption key",
      );
    });

    it("throws if no encrypted value is provided", () => {
      return expect(encryptService.decryptToBytes(null, key)).rejects.toThrow(
        "Nothing provided for decryption",
      );
    });

    it("decrypts data with provided key", async () => {
      const decryptedBytes = makeStaticByteArray(10, 200);

      cryptoFunctionService.hmac.mockResolvedValue(makeStaticByteArray(1));
      cryptoFunctionService.compare.mockResolvedValue(true);
      cryptoFunctionService.aesDecrypt.mockResolvedValueOnce(decryptedBytes);

      const actual = await encryptService.decryptToBytes(encBuffer, key);

      expect(cryptoFunctionService.aesDecrypt).toBeCalledWith(
        expect.toEqualBuffer(encBuffer.dataBytes),
        expect.toEqualBuffer(encBuffer.ivBytes),
        expect.toEqualBuffer(key.encKey),
        "cbc",
      );

      expect(actual).toEqualBuffer(decryptedBytes);
    });

    it("compares macs using CryptoFunctionService", async () => {
      const expectedMacData = new Uint8Array(
        encBuffer.ivBytes.byteLength + encBuffer.dataBytes.byteLength,
      );
      expectedMacData.set(new Uint8Array(encBuffer.ivBytes));
      expectedMacData.set(new Uint8Array(encBuffer.dataBytes), encBuffer.ivBytes.byteLength);

      await encryptService.decryptToBytes(encBuffer, key);

      expect(cryptoFunctionService.hmac).toBeCalledWith(
        expect.toEqualBuffer(expectedMacData),
        key.macKey,
        "sha256",
      );

      expect(cryptoFunctionService.compare).toBeCalledWith(
        expect.toEqualBuffer(encBuffer.macBytes),
        expect.toEqualBuffer(computedMac),
      );
    });

    it("returns null if macs don't match", async () => {
      cryptoFunctionService.compare.mockResolvedValue(false);

      const actual = await encryptService.decryptToBytes(encBuffer, key);
      expect(cryptoFunctionService.compare).toHaveBeenCalled();
      expect(cryptoFunctionService.aesDecrypt).not.toHaveBeenCalled();
      expect(actual).toBeNull();
    });

    it("returns null if encTypes don't match", async () => {
      key.encType = EncryptionType.AesCbc256_B64;
      cryptoFunctionService.compare.mockResolvedValue(true);

      const actual = await encryptService.decryptToBytes(encBuffer, key);

      expect(actual).toBeNull();
      expect(cryptoFunctionService.aesDecrypt).not.toHaveBeenCalled();
    });
  });

  describe("decryptToUtf8", () => {
    it("throws if no key is provided", () => {
      return expect(encryptService.decryptToUtf8(null, null)).rejects.toThrow(
        "No key provided for decryption.",
      );
    });
    it("returns null if key is mac key but encstring has no mac", async () => {
      const key = new SymmetricCryptoKey(
        makeStaticByteArray(64, 0),
        EncryptionType.AesCbc256_HmacSha256_B64,
      );
      const encString = new EncString(EncryptionType.AesCbc256_B64, "data");

      const actual = await encryptService.decryptToUtf8(encString, key);
      expect(actual).toBeNull();
      expect(logService.error).toHaveBeenCalled();
    });
  });

  describe("rsa", () => {
    const data = makeStaticByteArray(10, 100);
    const encryptedData = makeStaticByteArray(10, 150);
    const publicKey = makeStaticByteArray(10, 200);
    const privateKey = makeStaticByteArray(10, 250);
    const encString = makeEncString(encryptedData);

    function makeEncString(data: Uint8Array): EncString {
      return new EncString(EncryptionType.Rsa2048_OaepSha1_B64, Utils.fromBufferToB64(data));
    }

    describe("rsaEncrypt", () => {
      it("throws if no data is provided", () => {
        return expect(encryptService.rsaEncrypt(null, publicKey)).rejects.toThrow("No data");
      });

      it("throws if no public key is provided", () => {
        return expect(encryptService.rsaEncrypt(data, null)).rejects.toThrow("No public key");
      });

      it("encrypts data with provided key", async () => {
        cryptoFunctionService.rsaEncrypt.mockResolvedValue(encryptedData);

        const actual = await encryptService.rsaEncrypt(data, publicKey);

        expect(cryptoFunctionService.rsaEncrypt).toBeCalledWith(
          expect.toEqualBuffer(data),
          expect.toEqualBuffer(publicKey),
          "sha1",
        );

        expect(actual).toEqual(encString);
        expect(actual.dataBytes).toEqualBuffer(encryptedData);
      });
    });

    describe("rsaDecrypt", () => {
      it("throws if no data is provided", () => {
        return expect(encryptService.rsaDecrypt(null, privateKey)).rejects.toThrow("No data");
      });

      it("throws if no private key is provided", () => {
        return expect(encryptService.rsaDecrypt(encString, null)).rejects.toThrow("No private key");
      });

      it.each([EncryptionType.AesCbc256_B64, EncryptionType.AesCbc256_HmacSha256_B64])(
        "throws if encryption type is %s",
        async (encType) => {
          encString.encryptionType = encType;

          await expect(encryptService.rsaDecrypt(encString, privateKey)).rejects.toThrow(
            "Invalid encryption type",
          );
        },
      );

      it("decrypts data with provided key", async () => {
        cryptoFunctionService.rsaDecrypt.mockResolvedValue(data);

        const actual = await encryptService.rsaDecrypt(makeEncString(data), privateKey);

        expect(cryptoFunctionService.rsaDecrypt).toBeCalledWith(
          expect.toEqualBuffer(data),
          expect.toEqualBuffer(privateKey),
          "sha1",
        );

        expect(actual).toEqualBuffer(data);
      });
    });
  });
});
