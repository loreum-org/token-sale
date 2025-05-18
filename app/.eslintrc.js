module.exports = {
  extends: 'next/core-web-vitals',
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  rules: {
    // Disable the no-explicit-any rule project-wide
    '@typescript-eslint/no-explicit-any': 'off',
    
    // Disable unused vars rule project-wide
    '@typescript-eslint/no-unused-vars': 'off',
    
    // Disable the img element warning
    '@next/next/no-img-element': 'off',
  },
  ignorePatterns: [
    'node_modules/*',
    '.next/*'
  ]
}; 