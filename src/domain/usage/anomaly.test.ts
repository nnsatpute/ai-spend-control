import { describe, expect, it } from "vitest";
import { usageSpike } from "./anomaly";

describe("usageSpike", () => {
  it("flags a day at least twice the recent average", () => {
    const spike = usageSpike(20, [4, 5, 6, 5]);
    expect(spike).not.toBeNull();
    expect(spike?.value).toBe(20);
  });

  it("stays quiet without enough history", () => {
    expect(usageSpike(100, [1, 2])).toBeNull();
  });

  it("stays quiet when the baseline is zero", () => {
    expect(usageSpike(10, [0, 0, 0])).toBeNull();
  });

  it("stays quiet under twice the average", () => {
    expect(usageSpike(9, [4, 5, 6])).toBeNull();
  });
});
