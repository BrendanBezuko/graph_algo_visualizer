// webpack.config.js
const path = require('path');

module.exports = {
  entry: './src/scripts/graph_visual.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  devServer: {
    static: {
        directory: path.join(__dirname, 'src'),
      },
    compress: true,
    port: 8080,
  },
  mode: 'development',
};