var webpack = require('webpack');
const merge = require('webpack-merge').merge;
const baseConfig = require('./webpack.base.js');

module.exports = merge(baseConfig, {
  mode: 'development',
  entry: [
    'webpack-dev-server/client?http://localhost:8080',
    'webpack/hot/dev-server',
    './src/index.ts',
    './example/index.tsx',
  ],
  output: {
    publicPath: '/assets/',
    filename: 'bundle.js',
  },

  devServer: {
    static: './example',
  },

  module: {
    rules: [
      {
        test: /\.html$/,
        exclude: /node_modules/,
        loader: 'html-loader',
        options: {
          exportAsEs6Default: true,
        },
      },
      { test: /\.css$/, use: ['style-loader', 'css-loader'] },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        type: 'asset/resource', // Use asset modules to handle fonts
        generator: {
          filename: 'fonts/[name].[hash][ext][query]', // Configure output directory and file naming
        },
      },
      {
        test: /\.svg$/,
        type: 'asset/resource', // Webpack 5 asset modules for SVG
        generator: {
          filename: 'icons/[name].[hash][ext][query]', // Customize the output path and filename
        },
      },
    ],
  },
});
