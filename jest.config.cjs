// jest.config.cjs
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: [
    '<rootDir>/src/server/**/*.spec.ts',
    '<rootDir>/src/shared/**/*.spec.ts'
  ],
  moduleNameMapper: {
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
    '^@config/(.*)$': '<rootDir>/config/$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        diagnostics: {
          ignoreCodes: [1343]
        },
        astTransformers: {
          before: [
            'ts-jest-mock-import-meta'
          ]
        }
      }
    ]
  }
};
