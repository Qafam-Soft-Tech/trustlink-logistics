module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testMatch: ['<rootDir>/test/**/*.spec.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '\\.e2e-spec\\.ts$', '\\.integration-spec\\.ts$'],
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest', {
      tsconfig: 'tsconfig.test.json',
      useESM: false,
    }],
  },
  collectCoverageFrom: ['src/**/*.(t|j)s'],
  coverageDirectory: './coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transformIgnorePatterns: [
    '/node_modules/(?!@nestjs|rxjs|reflect-metadata|typeorm|class-transformer|class-validator)',
  ],
};
