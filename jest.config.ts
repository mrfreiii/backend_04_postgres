import type { Config } from "jest";

const config: Config = {
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: ".",
  testEnvironment: "node",
  testRegex: ".e2e.test.ts$",
  testTimeout: 60000,
  transform: {
    "^.+\\.(t|j)s$": "ts-jest",
  },
  reporters: [
    "default",
    [
      "./node_modules/jest-html-reporters",
      {
        publicPath: "<rootDir>/reports/unit",
        filename: "report.html",
        openReport: true,
        inlineSource: true,
      },
    ],
  ],
};

export default config;
