import { describe, expect, it } from "vitest";
import { TestCaseSchema, parseJsonColumn } from "../lib/jsonSchema";

describe("parseJsonColumn", () => {
  it("returns empty array for non-array input", () => {
    expect(parseJsonColumn(null, TestCaseSchema)).toEqual([]);
    expect(parseJsonColumn(undefined, TestCaseSchema)).toEqual([]);
    expect(parseJsonColumn("string", TestCaseSchema)).toEqual([]);
    expect(parseJsonColumn(42, TestCaseSchema)).toEqual([]);
    expect(parseJsonColumn({}, TestCaseSchema)).toEqual([]);
  });

  it("filters out invalid items", () => {
    const input = [
      { input: "a\nb", expectedOutput: "3" },
      { input: "c\nd" },
      { wrong: true },
    ];
    const result = parseJsonColumn(input, TestCaseSchema);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ input: "a\nb", expectedOutput: "3" });
  });

  it("parses valid test cases", () => {
    const input = [
      { input: "1\n2", expectedOutput: "3" },
      { input: "4\n5", expectedOutput: "9" },
    ];
    const result = parseJsonColumn(input, TestCaseSchema);
    expect(result).toHaveLength(2);
    expect(result[1].input).toBe("4\n5");
  });
});
