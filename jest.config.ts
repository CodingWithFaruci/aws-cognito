export default {
  testMatch: ['**/*.test.ts'],
  transform: {
    "^.+\\.tsx?$": "ts-jest"
  },
  verbose: true,
  preset: 'ts-jest',
  testEnvironment: 'node',
  testTimeout: 90000,
  clearMocks: true,
  collectCoverage: true,
  collectCoverageFrom: [
    '<rootDir>/src/**/*.ts',
    '<rootDir>/lib/**/*.ts',
  ],
  coverageDirectory: "coverage",
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      statements: 90,
    },
  },
  reporters: ['default', ['jest-sonar', {
    outputDirectory: 'coverage',
    outputName: 'test-report.xml',
    reportedFilePath: 'relative'
  }]],
};