import tseslint from "typescript-eslint";
import unusedImports from "eslint-plugin-unused-imports";

export const baseConfig = tseslint.config(
  { ignores: ["dist/**", ".yarn/**"] },
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      parserOptions: { tsconfigRootDir: import.meta.dirname },
    },
    plugins: { "unused-imports": unusedImports },
    rules: {
      /* unused-imports adds autofix removal of dead imports; ignores _-prefixed. */
      "@typescript-eslint/no-unused-vars": "off",
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "error",
        {
          args: "after-used",
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
    },
  },
);

export default tseslint.config(
  ...baseConfig,
  {
    /* Safe merge: only adds typed add/removeEventListener overloads. */
    files: ["src/proof-verify-id.ts"],
    rules: { "@typescript-eslint/no-unsafe-declaration-merging": "off" },
  },
  {
    /* chai assertions like expect(x).to.be.true read as unused expressions. */
    files: ["test/**/*.ts"],
    rules: { "@typescript-eslint/no-unused-expressions": "off" },
  },
);
