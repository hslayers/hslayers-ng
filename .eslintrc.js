module.exports = {
  env: {
    browser: true,
    es6: true,
  },
  extends: 'airbnb-base',
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
    define: 'readonly',
    angular: 'readonly',
    stmPath: 'readonly',
    hslMin: 'readonly',
    gitsha: 'readonly',
    hsl_path: 'readonly'
  },
  parserOptions: {
    ecmaVersion: 2018,
  },
  rules: {
    'import/no-amd': 0,
    "prefer-arrow-callback": 1,
    'comma-dangle': ['error', {
      'arrays': 'only-multiline',
      'objects': 'always-multiline',
      'imports': 'always-multiline',
      'exports': 'always-multiline',
      'functions': 'ignore'
    }],
    'no-param-reassign': 1,
    'func-names': 0,
    'no-undef': 1,
    'indent': 0,
    'no-shadow': 1,
    'no-plusplus': [2, { "allowForLoopAfterthoughts": true }],
    "no-use-before-define": [2, { "functions": false, "classes": true }],
    'no-underscore-dangle': 0
  },
};
