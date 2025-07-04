const path = require('path');

module.exports = {
  target: 'node',
  mode: 'none',
  entry: {
    extension: './src/extension.ts',
    'mcp-server': './src/mcp/mcp-server.ts'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    libraryTarget: 'commonjs2'
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader'
          }
        ]
      }
    ]
  },
  externals: {
    vscode: 'commonjs vscode'
  }
};