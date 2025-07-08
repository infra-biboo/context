
const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');
const { execSync } = require('child_process');

const VSIX_PATH = process.argv[2];
const EXTRACT_PATH = path.join(__dirname, 'temp_vsix_extract');

if (!VSIX_PATH) {
    console.error('Usage: node validate-vsix.js <path_to_vsix_file>');
    process.exit(1);
}

function cleanUp() {
    if (fs.existsSync(EXTRACT_PATH)) {
        fs.rmSync(EXTRACT_PATH, { recursive: true, force: true });
    }
}

function getPlatformBinaryName() {
    switch (process.platform) {
        case 'win32':
            return 'vscode-sqlite3-win32-x64.node';
        case 'linux':
            return 'vscode-sqlite3-linux-x64.node';
        case 'darwin':
            // For macOS, we expect the universal2 binary in the packaged VSIX
            return 'vscode-sqlite3-darwin-universal2.node';
        default:
            throw new Error(`Unsupported platform: ${process.platform}`);
    }
}

console.log(`Starting VSIX validation for: ${VSIX_PATH}`);
cleanUp(); // Ensure a clean slate

try {
    // 1. Decompress the VSIX
    console.log(`Decompressing VSIX to: ${EXTRACT_PATH}`);
    const zip = new AdmZip(VSIX_PATH);
    zip.extractAllTo(EXTRACT_PATH, true);
    console.log('VSIX decompressed successfully.');

    const extensionPath = path.join(EXTRACT_PATH, 'extension');

    // 2. Verify sqlite3 lib directory and JS files
    const sqlite3LibPath = path.join(extensionPath, 'node_modules', '@vscode', 'sqlite3', 'lib');
    console.log(`Checking for sqlite3 lib path: ${sqlite3LibPath}`);
    if (!fs.existsSync(sqlite3LibPath)) {
        throw new Error(`SQLite3 lib directory not found: ${sqlite3LibPath}`);
    }
    const libFiles = fs.readdirSync(sqlite3LibPath);
    if (libFiles.length === 0) {
        throw new Error(`SQLite3 lib directory is empty: ${sqlite3LibPath}`);
    }
    console.log(`SQLite3 lib directory found with files: ${libFiles.join(', ')}`);

    // 3. Verify platform-specific binary
    const expectedBinaryName = getPlatformBinaryName();
    const binaryPath = path.join(extensionPath, 'binaries', expectedBinaryName);
    console.log(`Checking for platform binary: ${binaryPath}`);
    if (!fs.existsSync(binaryPath)) {
        throw new Error(`Platform-specific binary not found: ${binaryPath}`);
    }
    console.log(`Platform-specific binary found: ${expectedBinaryName}`);

    // 4. Execute a smoke test: try to require the module
    console.log('Running smoke test: attempting to require the sqlite3 module...');
    const testScriptContent = `
        const path = require('path');
        const sqlite3Path = path.join(process.argv[1], 'node_modules', '@vscode', 'sqlite3');
        try {
            const sqlite3 = require(sqlite3Path).sqlite3;
            console.log('Smoke test successful: @vscode/sqlite3 module loaded.');

            // Perform a simple database operation
            const db = new sqlite3.Database(':memory:', (err) => {
                if (err) {
                    console.error('Database open error:', err.message);
                    process.exit(1);
                }
                console.log('Connected to the in-memory SQLite database.');
            });

            db.serialize(() => {
                db.run("CREATE TABLE lorem (info TEXT)", (err) => {
                    if (err) {
                        console.error('CREATE TABLE error:', err.message);
                        process.exit(1);
                    }
                    console.log('Table created.');
                });

                db.run("INSERT INTO lorem VALUES ('Hello SQLite')", (err) => {
                    if (err) {
                        console.error('INSERT error:', err.message);
                        process.exit(1);
                    }
                    console.log('Data inserted.');
                });

                db.get("SELECT info FROM lorem WHERE info = 'Hello SQLite'", (err, row) => {
                    if (err) {
                        console.error('SELECT error:', err.message);
                        process.exit(1);
                    }
                    if (row && row.info === 'Hello SQLite') {
                        console.log('Data retrieved successfully: ', row.info);
                        console.log('SQLite3 health check passed!');
                        db.close(() => {
                            console.log('Database closed.');
                            process.exit(0);
                        });
                    } else {
                        console.error('Data verification failed.');
                        process.exit(1);
                    }
                });
            });

        } catch (e) {
            console.error('Smoke test failed: Could not load or use @vscode/sqlite3 module.');
            console.error(e);
            process.exit(1);
        }
    `;
    const testScriptPath = path.join(EXTRACT_PATH, 'smoke_test.js');
    fs.writeFileSync(testScriptPath, testScriptContent);

    // Execute the smoke test in a new Node process, passing the extension path as an argument
    execSync(`node ${testScriptPath} ${extensionPath}`, { stdio: 'inherit' });

    console.log('VSIX validation successful!');
    process.exit(0);

} catch (error) {
    console.error('VSIX validation failed:', error.message);
    process.exit(1);
} finally {
    cleanUp();
}
