const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = [
  // Extension (Node.js target)
  {
    target: 'node',
    mode: 'none', // 'production' for release, 'none' for development
    entry: {
      extension: './src/extension.ts'
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].js',
      libraryTarget: 'commonjs2',
      devtoolModuleFilenameTemplate: '../[resource-path]',
    },
    resolve: {
      extensions: ['.ts', '.js']
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          exclude: /node_modules/,
          use: [{ loader: 'ts-loader' }]
        }
      ]
    },
    externals: {
      vscode: 'commonjs vscode',
      '@vscode/sqlite3': 'commonjs @vscode/sqlite3' // Mark as external
    },
    devtool: 'source-map',
  },
  // MCP Server (Node.js target, no vscode dependencies)
  {
    target: 'node',
    mode: 'none', // 'production' for release, 'none' for development
    entry: {
      'mcp-server': './src/mcp/standalone-server.ts'
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].js',
      libraryTarget: 'commonjs2',
      devtoolModuleFilenameTemplate: '../[resource-path]',
    },
    resolve: {
      extensions: ['.ts', '.js']
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          exclude: /node_modules/,
          use: [{ loader: 'ts-loader' }]
        }
      ]
    },
    externals: {
      // Exclude Node.js built-ins from MCP server bundle
      fs: 'commonjs fs',
      path: 'commonjs path',
      os: 'commonjs os',
      'fs/promises': 'commonjs fs/promises'
    },
    devtool: 'source-map',
  },
  // Webview (Browser target)
  {
    target: 'web',
    mode: 'none', // 'production' for release, 'none' for development
    entry: {
      webview: './src/ui/webview/index.tsx' // New SolidJS entry point
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].js'
    },
    devServer: {
      static: {
        directory: path.join(__dirname, 'dist'),
      },
      compress: true,
      port: 8080,
      hot: true,
    },
    resolve: {
      extensions: ['.ts', '.js', '.tsx', '.jsx'],
      fallback: {
        "path": false,
        "fs": false
      }
    },
    module: {
      rules: [
        {
          test: /\.(ts|tsx)$/,
          exclude: /node_modules/,
          use: [
            {
              loader: 'babel-loader',
              options: {
                presets: ['babel-preset-solid', '@babel/preset-typescript']
              }
            },
            { 
              loader: 'ts-loader',
              options: {
                compilerOptions: {
                  module: 'esnext'
                }
              }
            }
          ]
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader']
        }
      ]
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './src/ui/webview/index.html',
        filename: 'index.html'
      }),
      new CopyPlugin({
        patterns: [
          { from: 'src/ui/webview/style.css', to: 'style.css' },
          // No need to copy index.html as it's generated in the provider
        ],
      }),
    ],
    devtool: 'source-map',
  }
];
