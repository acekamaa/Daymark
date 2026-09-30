import HtmlWebpackPlugin from 'html-webpack-plugin';

import path from 'node:path';

export default {
  mode: 'development',
  entry: './src/index.js',
  output: {
    filename: 'myapp.js',
    path: path.resolve(import.meta.dirname, 'dist'),
    clean: true,
    publicPath: '/daymark/',
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/template.html',
    }),
  ],
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.html$/i,
        use: ['html-loader'],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
      },
    ],
  },
};
