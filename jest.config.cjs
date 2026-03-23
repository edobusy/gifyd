/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
	preset: "ts-jest",
	testEnvironment: "jsdom",
	moduleNameMapper: {
		"\\.(mp4|ttf)$": "<rootDir>/__mocks__/fileMock.js",
		"\\.(css|less)$": "<rootDir>/__mocks__/styleMock.js",
	},
	collectCoverageFrom: [
		"src/**/*.{ts,tsx}",
		"!src/main.tsx", // entry point, nothing to test
		"!src/vite-env.d.ts", // type declarations
		"!src/custom.d.ts",
	],
}
