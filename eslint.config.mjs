import tseslint from "typescript-eslint";
import unusedImports from "eslint-plugin-unused-imports";

export const baseConfig = tseslint.config(
  { ignores: ["dist/**", ".yarn/**"] },
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      "unused-imports": unusedImports,
    },
    rules: {
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

export default tseslint.config(...baseConfig, {
  files: ["src/react.ts"],
  rules: {
    "@typescript-eslint/no-namespace": "off",
  },
});
