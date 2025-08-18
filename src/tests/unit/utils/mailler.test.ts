import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import Mailler from "utils/mailler.util";
import fs from "fs";
import path from "path";

// Mock fs and path
jest.mock("fs");
jest.mock("path");

const mockedFs = fs as jest.Mocked<typeof fs>;
const mockedPath = path as jest.Mocked<typeof path>;

describe("Mailler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("renderTemplate", () => {
    it("should replace template placeholders", () => {
      const templateContent = "Hello {{name}}, your OTP is {{otpCode}}!";
      const data = { name: "John", otpCode: "123456" };

      mockedPath.join.mockReturnValue("/mock/path/template.html");
      mockedFs.readFileSync.mockReturnValue(templateContent);

      const result = Mailler.renderTemplate(data, "test");

      expect(result).toBe("Hello John, your OTP is 123456!");
      expect(mockedFs.readFileSync).toHaveBeenCalledWith(
        "/mock/path/template.html",
        "utf-8",
      );
    });

    it("should handle missing placeholders", () => {
      const templateContent = "Hello {{name}}, {{missingKey}}!";
      const data = { name: "John" };

      mockedPath.join.mockReturnValue("/mock/path/template.html");
      mockedFs.readFileSync.mockReturnValue(templateContent);

      const result = Mailler.renderTemplate(data, "test");

      expect(result).toBe("Hello John, !");
    });

    it("should handle templates with no placeholders", () => {
      const templateContent = "Hello World!";
      const data = { name: "John" };

      mockedPath.join.mockReturnValue("/mock/path/template.html");
      mockedFs.readFileSync.mockReturnValue(templateContent);

      const result = Mailler.renderTemplate(data, "test");

      expect(result).toBe("Hello World!");
    });
  });
});
