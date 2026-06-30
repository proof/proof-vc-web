import tseslint from "typescript-eslint";
import unusedImports from "eslint-plugin-unused-imports";
import lit from "eslint-plugin-lit";
import wc from "eslint-plugin-wc";

const baseConfig = tseslint.config(
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
  /* Lit template + web-component lint (rule-based; the only well-maintained
     option — lit-analyzer is unmaintained). Component source only, not tests. */
  {
    ...lit.configs["flat/recommended"],
    files: ["src/**/*.ts"],
    ignores: ["src/**/*.test.ts"],
  },
  {
    ...wc.configs["flat/recommended"],
    files: ["src/**/*.ts"],
    ignores: ["src/**/*.test.ts"],
  },
  {
    /* chai assertions like expect(x).to.be.true read as unused expressions. */
    files: ["test/**/*.ts", "src/**/*.test.ts"],
    rules: { "@typescript-eslint/no-unused-expressions": "off" },
  },
);
