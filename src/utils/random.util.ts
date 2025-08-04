// src/utils/random-user.ts
import { faker } from "@faker-js/faker";

export type RandomUser = {
  username: string;
  email: string;
  password: string;
  phone: string;
  address: string;
};

export function generateRandomUser(): RandomUser {
  return {
    username: faker.person.fullName(),
    email: faker.internet.email(),
    password: faker.internet.password({ length: 12 }),
    phone: faker.phone.number({ style: "international" }),
    address: faker.location.streetAddress(),
  };
}
