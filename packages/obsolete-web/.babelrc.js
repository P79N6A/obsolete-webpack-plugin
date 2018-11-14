module.exports = {
  presets: [
    [
      '@babel/env',
      {
        modules: false,
        targets: {
          browsers: '> 0%',
        },
      },
    ],
  ],
  plugins: [
    [
      '@babel/plugin-transform-runtime',
      {
        corejs: 2,
      },
    ],
    '@babel/plugin-transform-property-mutators',
  ],
  env: {
    test: {
      presets: [
        [
          '@babel/env',
          {
            targets: {
              browsers: '> 0%',
            },
          },
        ],
      ],
    },
  },
};