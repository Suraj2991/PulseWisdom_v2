module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.utils.ts'],
  testTimeout: 30000,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.{js,ts}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{js,ts}',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  projects: [
    {
      displayName: 'utils',
      testMatch: ['<rootDir>/src/__tests__/utils/**/*.test.ts'],
      setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.utils.ts']
    },
    {
      displayName: 'integration',
      testMatch: ['<rootDir>/src/__tests__/!(utils)/**/*.test.ts'],
      setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts']
    }
  ]
}; 