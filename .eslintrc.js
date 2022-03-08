module.exports = {
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  ignorePatterns: ["dist/*"],
  rules: {
    "@typescript-eslint/ban-types": 0,
    "@typescript-eslint/no-explicit-any": 0,
  },
};
