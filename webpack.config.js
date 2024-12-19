const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const lazyImports = [
  'class-transformer/storage',
  '@nestjs/websockets/socket-module',
  '@nestjs/microservices/microservices-module',
  '@nestjs/microservices',
];

module.exports = (options, webpack) => {
  const appRootPath = path.dirname(options.output.filename);
  const appName = appRootPath.split('/').pop();

  console.log('appName', appName);
  console.log('entry', options.entry);
  console.log('output', options.output);

  const patterns = [];

  if (appName !== 'log-processor') {
    patterns.push({
      from: 'env/*.env',
      to: appRootPath,
    });
  }

  // swagger resources
  if (['api'].includes(appName)) {
    patterns.push(
      {
        from: './node_modules/swagger-ui-dist/swagger-ui.css',
        to: appRootPath,
      },
      {
        from: './node_modules/swagger-ui-dist/swagger-ui-bundle.js',
        to: appRootPath,
      },
      {
        from: './node_modules/swagger-ui-dist/swagger-ui-standalone-preset.js',
        to: appRootPath,
      },
      {
        from: './node_modules/swagger-ui-dist/favicon-16x16.png',
        to: appRootPath,
      },
      {
        from: './node_modules/swagger-ui-dist/favicon-32x32.png',
        to: appRootPath,
      },
    );
  }

  const plugins = [
    ...options.plugins,
    new webpack.IgnorePlugin({
      checkResource(resource) {
        if (lazyImports.includes(resource)) {
          try {
            require.resolve(resource);
          } catch (err) {
            return true;
          }
        }
        return false;
      },
    }),
  ];

  if (patterns.length > 0) {
    plugins.push(new CopyWebpackPlugin({ patterns }));
  }

  return {
    ...options,
    externals: [],
    output: {
      ...options.output,
      libraryTarget: 'commonjs2',
    },
    devtool: 'source-map',
    plugins,
  };
};
