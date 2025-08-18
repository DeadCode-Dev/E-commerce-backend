import { faker } from "@faker-js/faker";

export interface TestUserData {
  username: string;
  email: string;
  password: string;
  phone: string;
}

export const createUserData = (): TestUserData => ({
  // Limit username to 12 characters to fit VARCHAR(15) constraint
  username: faker.internet.username().substring(0, 12),
  email: faker.internet.email(),
  password: "Password123!",
  // Ensure phone number fits your schema constraints
  phone: faker.phone.number().substring(0, 20),
});

export const createLoginData = (email?: string) => ({
  email: email || faker.internet.email(),
  password: "Password123!",
});

export const createValidUser = () => ({
  id: faker.string.uuid(),
  username: faker.internet.userName().substring(0, 12),
  email: faker.internet.email(),
  phone: faker.phone.number().substring(0, 20),
  created_at: new Date(),
  updated_at: new Date(),
});

// Helper to create unique test data with timestamp
export const createUniqueUserData = (): TestUserData => {
  const timestamp = Date.now().toString().slice(-6);
  return {
    username: `user${timestamp}`,
    email: `test${timestamp}@example.com`,
    password: "Password123!",
    phone: `+1555000${timestamp}`,
  };
};
