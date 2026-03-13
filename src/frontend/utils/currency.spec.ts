import {
  formatCurrencyAmount,
  formatCurrencyInWordsUk,
  formatCurrencyLabel,
} from "./currency";

describe("currency utils", () => {
  it("formats hryvnia labels as грн", () => {
    expect(formatCurrencyLabel("UAH")).toBe("грн");
    expect(formatCurrencyLabel("uah")).toBe("грн");
    expect(formatCurrencyLabel("₴")).toBe("грн");
  });

  it("formats amounts without the hryvnia symbol", () => {
    expect(formatCurrencyAmount(1200)).toBe("1\u00a0200,00 грн");
  });

  it("formats amounts in words for document variables", () => {
    expect(formatCurrencyInWordsUk(1200)).toBe("одна тисяча двісті грн 00 коп");
  });

  it("handles rounding to the next hryvnia in words", () => {
    expect(formatCurrencyInWordsUk(1.999)).toBe("дві грн 00 коп");
  });
});
