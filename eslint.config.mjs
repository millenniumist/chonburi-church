import next from "eslint-config-next";
import tsPlugin from "@typescript-eslint/eslint-plugin";

const eslintConfig = [
  ...next,
  {
    // Enforce in config what the build contract only asked agents to honor:
    // no `any` (parse untrusted input with Zod instead) and no non-null `!`
    // (narrow, don't lie to the compiler). Catches regressions a human never re-reviews.
    files: ["**/*.ts", "**/*.tsx"],
    plugins: { "@typescript-eslint": tsPlugin },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
    },
  },
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
];

export default eslintConfig;
