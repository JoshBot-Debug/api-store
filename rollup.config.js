import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";

const packageJson = require("./package.json");

export default [
  {
    input: "lib/index.ts",
    output: [
      {
        file: packageJson.main,
        format: "cjs",
        sourcemap: false,
      },
      {
        file: packageJson.module,
        format: "esm",
        sourcemap: false,
      },
    ],
    plugins: [
      resolve(),
      commonjs(),
      typescript({
        include: ["lib/**"],
        declaration: true,
        declarationDir: "build/types"
      }),
      terser()
    ],
    external: ["react", "react-dom"],
  }
];
