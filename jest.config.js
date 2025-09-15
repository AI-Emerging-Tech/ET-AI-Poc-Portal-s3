// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['/home/dbhupathiraju/ET-PocPortal/jest.setup.ts'],
  noStackTrace: true,
  testMatch: ["**/__tests__/**/*.[jt]s?(x)", "**/?(*.)+(spec|test).[jt]s?(x)", "**/test_*{P_*F_*,*_{*,*}}.{ts,tsx}"],
  transform: {
    '^.+\\.tsx?$': 'babel-jest',  // Use Babel to transform .ts and .tsx files
    
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleDirectories: ['node_modules','src'],
  verbose: false,

  silent: true,
  snapshotSerializers: [],
  updateSnapshot: false,
  
};
