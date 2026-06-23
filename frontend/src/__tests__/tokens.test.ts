import { describe, expect, it } from "vitest";
import { STORAGE_KEYS, getCodeDraftKey } from "../shared/constants";

describe("STORAGE_KEYS", () => {
  it("has all expected keys", () => {
    expect(STORAGE_KEYS.JWT).toBe("qts_jwt");
    expect(STORAGE_KEYS.CHESS_PLAYER_RATING).toBe("qts_chess_player_rating");
    expect(STORAGE_KEYS.POKER_RANK).toBe("qts_poker_rank");
    expect(STORAGE_KEYS.QUANT_USER).toBe("qts_quant_user");
  });

  it("produces code draft keys", () => {
    expect(getCodeDraftKey("two-sum", "python")).toBe(
      "qts_code_two-sum_python",
    );
  });
});
