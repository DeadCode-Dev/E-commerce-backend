import { ValidationException } from "../../shared/exceptions";

export class Money {
  private readonly amount: number;
  private readonly currency: string;

  constructor(amount: number, currency = "USD") {
    this.validateAmount(amount);
    this.validateCurrency(currency);
    this.amount = Math.round(amount * 100) / 100; // Round to 2 decimal places
    this.currency = currency.toUpperCase();
  }

  private validateAmount(amount: number): void {
    if (typeof amount !== "number" || isNaN(amount)) {
      throw new ValidationException("Amount must be a valid number", [
        {
          field: "amount",
          message: "Amount must be a valid number",
          code: "INVALID_TYPE",
        },
      ]);
    }

    if (amount < 0) {
      throw new ValidationException("Amount cannot be negative", [
        {
          field: "amount",
          message: "Amount cannot be negative",
          code: "NEGATIVE_AMOUNT",
        },
      ]);
    }

    if (amount > 999999.99) {
      throw new ValidationException("Amount exceeds maximum allowed value", [
        {
          field: "amount",
          message: "Amount cannot exceed 999,999.99",
          code: "AMOUNT_TOO_LARGE",
        },
      ]);
    }
  }

  private validateCurrency(currency: string): void {
    const validCurrencies = ["USD", "EUR", "GBP", "JPY", "CAD", "AUD"];
    if (!validCurrencies.includes(currency.toUpperCase())) {
      throw new ValidationException("Invalid currency", [
        {
          field: "currency",
          message: `Currency must be one of: ${validCurrencies.join(", ")}`,
          code: "INVALID_CURRENCY",
        },
      ]);
    }
  }

  getAmount(): number {
    return this.amount;
  }

  getCurrency(): string {
    return this.currency;
  }

  // Arithmetic operations
  add(other: Money): Money {
    this.ensureSameCurrency(other);
    return new Money(this.amount + other.amount, this.currency);
  }

  subtract(other: Money): Money {
    this.ensureSameCurrency(other);
    const result = this.amount - other.amount;
    if (result < 0) {
      throw new ValidationException("Result cannot be negative", [
        {
          field: "amount",
          message: "Subtraction would result in negative amount",
          code: "NEGATIVE_RESULT",
        },
      ]);
    }
    return new Money(result, this.currency);
  }

  multiply(factor: number): Money {
    if (typeof factor !== "number" || isNaN(factor) || factor < 0) {
      throw new ValidationException("Factor must be a positive number", [
        {
          field: "factor",
          message: "Factor must be a positive number",
          code: "INVALID_FACTOR",
        },
      ]);
    }
    return new Money(this.amount * factor, this.currency);
  }

  divide(divisor: number): Money {
    if (typeof divisor !== "number" || isNaN(divisor) || divisor <= 0) {
      throw new ValidationException("Divisor must be a positive number", [
        {
          field: "divisor",
          message: "Divisor must be a positive number",
          code: "INVALID_DIVISOR",
        },
      ]);
    }
    return new Money(this.amount / divisor, this.currency);
  }

  // Comparison operations
  equals(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }

  isGreaterThan(other: Money): boolean {
    this.ensureSameCurrency(other);
    return this.amount > other.amount;
  }

  isLessThan(other: Money): boolean {
    this.ensureSameCurrency(other);
    return this.amount < other.amount;
  }

  isGreaterThanOrEqual(other: Money): boolean {
    this.ensureSameCurrency(other);
    return this.amount >= other.amount;
  }

  isLessThanOrEqual(other: Money): boolean {
    this.ensureSameCurrency(other);
    return this.amount <= other.amount;
  }

  isZero(): boolean {
    return this.amount === 0;
  }

  isPositive(): boolean {
    return this.amount > 0;
  }

  private ensureSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new ValidationException("Currency mismatch", [
        {
          field: "currency",
          message: "Cannot operate on different currencies",
          code: "CURRENCY_MISMATCH",
        },
      ]);
    }
  }

  // Formatting
  format(): string {
    const currencySymbols: Record<string, string> = {
      USD: "$",
      EUR: "€",
      GBP: "£",
      JPY: "¥",
      CAD: "C$",
      AUD: "A$",
    };

    const symbol = currencySymbols[this.currency] || this.currency;
    return `${symbol}${this.amount.toFixed(2)}`;
  }

  toString(): string {
    return this.format();
  }

  // For JSON serialization
  toJSON(): { amount: number; currency: string } {
    return {
      amount: this.amount,
      currency: this.currency,
    };
  }

  // Static factory methods
  static create(amount: number, currency = "USD"): Money {
    return new Money(amount, currency);
  }

  static zero(currency = "USD"): Money {
    return new Money(0, currency);
  }

  static fromCents(cents: number, currency = "USD"): Money {
    return new Money(cents / 100, currency);
  }

  // Parse from string like "$10.50" or "10.50 USD"
  static parse(value: string): Money {
    const currencyRegex = /^(\$|€|£|¥|C\$|A\$)?([\d.]+)\s*([A-Z]{3})?$/;
    const match = value.trim().match(currencyRegex);

    if (!match) {
      throw new ValidationException("Invalid money format", [
        {
          field: "value",
          message: "Cannot parse money value",
          code: "INVALID_FORMAT",
        },
      ]);
    }

    const [, symbol, amountStr, currencyCode] = match;
    const amount = parseFloat(amountStr);

    let currency = "USD";
    if (currencyCode) {
      currency = currencyCode;
    } else if (symbol) {
      const symbolToCurrency: Record<string, string> = {
        $: "USD",
        "€": "EUR",
        "£": "GBP",
        "¥": "JPY",
        C$: "CAD",
        A$: "AUD",
      };
      currency = symbolToCurrency[symbol] || "USD";
    }

    return new Money(amount, currency);
  }
}
