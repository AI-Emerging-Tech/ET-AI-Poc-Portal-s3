module.exports = {
  presets: [
    [
      '@babel/preset-react',
      {
        runtime: 'automatic',  // Enables the new JSX transform, which removes the need to import React in every file
      },
    ],
    '@babel/preset-env',
    '@babel/preset-typescript',
  ],
};
  