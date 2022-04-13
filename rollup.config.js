import typescript from '@rollup/plugin-typescript';

const name = 'index';

export default {
  external: [],
  input: `src/${name}.ts`,
  output: [
    {
      file: `dist/${name}.mjs`,
      format: "es",
      sourcemap: true,
    },
    {
      file: `dist/${name}.js`,
      format: "cjs",
      sourcemap: true,
    }
  ],
  plugins: [typescript({ module: 'esnext' })]
};
