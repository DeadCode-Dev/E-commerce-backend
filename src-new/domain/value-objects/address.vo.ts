import { ValidationException } from "../../shared/exceptions";

export interface AddressProps {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export class Address {
  private readonly props: AddressProps;

  constructor(props: AddressProps) {
    this.validate(props);
    this.props = {
      street: props.street.trim(),
      city: props.city.trim(),
      state: props.state.trim(),
      zipCode: props.zipCode.trim(),
      country: props.country.trim().toUpperCase(),
    };
  }

  private validate(props: AddressProps): void {
    const errors: Array<{ field: string; message: string; code: string }> = [];

    if (!props.street?.trim()) {
      errors.push({
        field: "street",
        message: "Street address is required",
        code: "REQUIRED",
      });
    } else if (props.street.length > 255) {
      errors.push({
        field: "street",
        message: "Street address is too long",
        code: "TOO_LONG",
      });
    }

    if (!props.city?.trim()) {
      errors.push({
        field: "city",
        message: "City is required",
        code: "REQUIRED",
      });
    } else if (props.city.length > 100) {
      errors.push({
        field: "city",
        message: "City name is too long",
        code: "TOO_LONG",
      });
    }

    if (!props.state?.trim()) {
      errors.push({
        field: "state",
        message: "State is required",
        code: "REQUIRED",
      });
    } else if (props.state.length > 100) {
      errors.push({
        field: "state",
        message: "State name is too long",
        code: "TOO_LONG",
      });
    }

    if (!props.zipCode?.trim()) {
      errors.push({
        field: "zipCode",
        message: "ZIP code is required",
        code: "REQUIRED",
      });
    } else if (!/^[\w\s-]{3,20}$/.test(props.zipCode)) {
      errors.push({
        field: "zipCode",
        message: "Invalid ZIP code format",
        code: "INVALID_FORMAT",
      });
    }

    if (!props.country?.trim()) {
      errors.push({
        field: "country",
        message: "Country is required",
        code: "REQUIRED",
      });
    } else if (props.country.length !== 2 && props.country.length !== 3) {
      errors.push({
        field: "country",
        message: "Country must be 2 or 3 letter code",
        code: "INVALID_LENGTH",
      });
    }

    if (errors.length > 0) {
      throw new ValidationException("Address validation failed", errors);
    }
  }

  get street(): string {
    return this.props.street;
  }

  get city(): string {
    return this.props.city;
  }

  get state(): string {
    return this.props.state;
  }

  get zipCode(): string {
    return this.props.zipCode;
  }

  get country(): string {
    return this.props.country;
  }

  // Business methods
  getFullAddress(): string {
    return `${this.props.street}, ${this.props.city}, ${this.props.state} ${this.props.zipCode}, ${this.props.country}`;
  }

  getShortAddress(): string {
    return `${this.props.city}, ${this.props.state}`;
  }

  isInCountry(countryCode: string): boolean {
    return this.props.country === countryCode.toUpperCase();
  }

  isInState(stateCode: string): boolean {
    return this.props.state.toLowerCase() === stateCode.toLowerCase();
  }

  isInCity(cityName: string): boolean {
    return this.props.city.toLowerCase() === cityName.toLowerCase();
  }

  equals(other: Address): boolean {
    return (
      this.props.street === other.props.street &&
      this.props.city === other.props.city &&
      this.props.state === other.props.state &&
      this.props.zipCode === other.props.zipCode &&
      this.props.country === other.props.country
    );
  }

  toString(): string {
    return this.getFullAddress();
  }

  // For JSON serialization
  toJSON(): AddressProps {
    return { ...this.props };
  }

  // Static factory methods
  static create(props: AddressProps): Address {
    return new Address(props);
  }

  // Common address formats
  static createUS(
    street: string,
    city: string,
    state: string,
    zipCode: string
  ): Address {
    return new Address({
      street,
      city,
      state,
      zipCode,
      country: "US",
    });
  }

  static createUK(street: string, city: string, postcode: string): Address {
    return new Address({
      street,
      city,
      state: "", // UK doesn't use states
      zipCode: postcode,
      country: "UK",
    });
  }

  static createCanada(
    street: string,
    city: string,
    province: string,
    postalCode: string
  ): Address {
    return new Address({
      street,
      city,
      state: province,
      zipCode: postalCode,
      country: "CA",
    });
  }

  // Validation without creating instance
  static isValid(props: AddressProps): boolean {
    try {
      new Address(props);
      return true;
    } catch {
      return false;
    }
  }
}
