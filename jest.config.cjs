// jest.config.cjs
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: [
    '<rootDir>/src/server/**/*.spec.ts',
    '<rootDir>/src/shared/**/*.spec.ts'
  ],
};