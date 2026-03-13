module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  plugins: ["@typescript-eslint", "prettier"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended",
  ],
  env: {
    es2021: true,
  },
  rules: {
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-unused-vars": "off",
    "@typescript-eslint/no-namespace": "off",
    "@typescript-eslint/no-var-requires": "off",
    "no-case-declarations": "off",
  },
  overrides: [
    {
      files: ["src/frontend/**/*.{ts,tsx}"],
      env: {
        browser: true,
        es2021: true,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    {
      files: ["{src,apps,libs,test,tests}/**/*.ts"],
      env: {
        node: true,
        jest: true,
        es2021: true,
      },
    },
  ],
  ignorePatterns: ["dist", "node_modules"],
};
