// functions/.eslintrc.cjs
module.exports = {
  env: { es2021: true, node: true, commonjs: true },
  parserOptions: { ecmaVersion: 2021 },
  // keep rules minimal for now
  rules: {
    // Turn off only if you don't want to fix all lint findings today
    "no-undef": "off",
  },
};
