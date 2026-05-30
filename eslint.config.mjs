import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

export default tseslint.config(
  {
    ignores: [
      "node_modules/**",
      "docs/**",
      "src/ts/page-interface-generated.ts",
      "src/shaders/**/*generated*",
    ],
  },
  ...tseslint.configs.recommended,
  prettier,
  {
    files: ["src/ts/**/*.ts"],
    languageOptions: {
      parserOptions: {
        project: "./src/config/tsconfig.json",
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-non-null-assertion": "off",
      "no-console": "off",
      "prefer-const": "error",
      "no-var": "error",
      eqeqeq: ["error", "always"],
    },
  },
  {
    files: ["src/ts/**/*.test.ts", "vitest.config.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
);
