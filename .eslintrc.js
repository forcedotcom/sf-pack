module.exports = {
  extends: ['eslint-config-salesforce-typescript', 'plugin:sf-plugin/recommended'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: [
      './packages/**/tsconfig.json',
      './packages/**/test/tsconfig.json',
      './tsconfig.json',
      './test/tsconfig.json',
    ],
    sourceType: 'module',
  },
  // ignorePatterns: ["test/**/*.ts"],
  rules: {
    '@typescript-eslint/quotes': [
      'error',
      'single',
      {
        avoidEscape: true,
        allowTemplateLiterals: true,
      },
    ],

    // Lots of 'any' in the code
    '@typescript-eslint/no-unsafe-assignment': 0,
    '@typescript-eslint/no-unsafe-member-access': 0,
    '@typescript-eslint/no-unsafe-call': 0,
    '@typescript-eslint/no-explicit-any': 0,
    '@typescript-eslint/prefer-nullish-coalescing': 0,
    'class-methods-use-this': 0,
    'arrow-body-style': 0,
    'no-await-in-loop': 0,

    // would need a bunch of refactoring
    complexity: 0,

    // Just turn off prettier - its annoying
    'prettier/prettier': 0,

    // "@typescript-eslint/explicit-module-boundary-types": [
    //   0,
    //   {
    //     "allowArgumentsExplicitlyTypedAsAny": true
    //   }
    // ],
  },
};
