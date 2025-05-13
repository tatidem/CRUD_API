const path = require('path');
const isProduction = process.env.NODE_ENV == 'production';

const config = {
  entry: './src/main.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [
      {
        test: /\.ts$/i,
        loader: 'ts-loader',
        include: [path.resolve(__dirname, 'src')],
        exclude: ['/node_modules/', '/build/'],
      },
    ],
  },
  resolve: {
    extensions: ['.ts'],
  },
  target: 'node',
  stats: {
    all: false,
    assets: true,
    builtAt: true,
    errors: true,
    warnings: true,
    modules: false,
    performance: true,
    errorDetails: true,
    reasons: false,
  },
};

module.exports = () => {
  if (isProduction) {
    config.mode = 'production';
    config.output.filename = 'server-prod.js';
  } else {
    config.mode = 'development';
    config.output.filename = 'server-dev.js';
  }
  return config;
};
