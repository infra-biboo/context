
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

    // 2. Verify sqlite3 module exists
    const sqlite3ModulePath = path.join(extensionPath, 'node_modules', '@vscode', 'sqlite3');
    console.log(`Checking for sqlite3 module path: ${sqlite3ModulePath}`);
    
    if (!fs.existsSync(sqlite3ModulePath)) {
        throw new Error(`SQLite3 module not found at: ${sqlite3ModulePath}`);
    }
    
    // Check for package.json to verify module integrity
    const sqlite3PackageJson = path.join(sqlite3ModulePath, 'package.json');
    if (!fs.existsSync(sqlite3PackageJson)) {
        throw new Error(`SQLite3 package.json not found at: ${sqlite3PackageJson}`);
    }
    
    console.log('✓ SQLite3 module found');

    // 3. Verify platform-specific binary in multiple locations
    const expectedBinaryName = getPlatformBinaryName();
    
    // Check in dist/binaries first (new location)
    const distBinaryPath = path.join(extensionPath, 'dist', 'binaries', expectedBinaryName);
    console.log(`Checking for platform binary in dist: ${distBinaryPath}`);
    
    // Also check in root binaries (legacy location)
    const rootBinaryPath = path.join(extensionPath, 'binaries', expectedBinaryName);
    console.log(`Checking for platform binary in root: ${rootBinaryPath}`);
    
    // Also check if it's in the SQLite3 module itself
    const moduleBinaryPath = path.join(extensionPath, 'node_modules', '@vscode', 'sqlite3', 'lib', expectedBinaryName);
    console.log(`Checking for platform binary in module: ${moduleBinaryPath}`);
    
    let foundBinary = false;
    if (fs.existsSync(distBinaryPath)) {
        console.log(`Platform-specific binary found in dist/binaries: ${expectedBinaryName}`);
        foundBinary = true;
    } else if (fs.existsSync(rootBinaryPath)) {
        console.log(`Platform-specific binary found in binaries: ${expectedBinaryName}`);
        foundBinary = true;
    } else if (fs.existsSync(moduleBinaryPath)) {
        console.log(`Platform-specific binary found in SQLite3 module: ${expectedBinaryName}`);
        foundBinary = true;
    }
    
    if (!foundBinary) {
        throw new Error(`Platform-specific binary not found in any expected location for: ${expectedBinaryName}`);
    }
    
    // 3.5. Prepare SQLite3 module for testing - copy platform binary to build/Release
    const buildReleasePath = path.join(extensionPath, 'node_modules', '@vscode', 'sqlite3', 'build', 'Release');
    if (!fs.existsSync(buildReleasePath)) {
        fs.mkdirSync(buildReleasePath, { recursive: true });
    }
    
    const targetBinaryPath = path.join(buildReleasePath, 'vscode-sqlite3.node');
    let sourceBinaryPath;
    
    // Find the source binary in order of preference
    if (fs.existsSync(distBinaryPath)) {
        sourceBinaryPath = distBinaryPath;
    } else if (fs.existsSync(moduleBinaryPath)) {
        sourceBinaryPath = moduleBinaryPath;
    } else if (fs.existsSync(rootBinaryPath)) {
        sourceBinaryPath = rootBinaryPath;
    }
    
    if (sourceBinaryPath) {
        console.log(`Copying platform binary to build/Release for testing...`);
        fs.copyFileSync(sourceBinaryPath, targetBinaryPath);
        console.log(`✓ Copied ${expectedBinaryName} to build/Release/vscode-sqlite3.node`);
    }

    // 4. Execute a smoke test: try to require the module
    console.log('Running smoke test: attempting to require the sqlite3 module...');
    const testScriptContent = `
        const path = require('path');
        const extensionPath = process.argv[2];
        const sqlite3Path = path.join(extensionPath, 'node_modules', '@vscode', 'sqlite3');
        
        try {
            // Test dynamic require like the extension does
            const sqlite3Module = eval('require')(sqlite3Path);
            console.log('✓ SQLite3 module loaded successfully');
            
            // Try to access the sqlite3 property
            const sqlite3 = sqlite3Module.verbose ? sqlite3Module.verbose() : sqlite3Module;
            console.log('✓ SQLite3 API accessible');
            
            // Try to create an in-memory database
            const db = new sqlite3.Database(':memory:', (err) => {
                if (err) {
                    console.error('❌ Failed to create in-memory database:', err.message);
                    process.exit(1);
                }
                console.log('✓ In-memory database created successfully');
                
                // Close the database
                db.close((closeErr) => {
                    if (closeErr) {
                        console.error('❌ Failed to close database:', closeErr.message);
                        process.exit(1);
                    }
                    console.log('✓ Database closed successfully');
                    console.log('✅ SQLite3 smoke test passed!');
                    process.exit(0);
                });
            });
        } catch (error) {
            console.error('❌ Smoke test failed:', error.message);
            console.error('Stack trace:', error.stack);
            process.exit(1);
        }
    `;
    
    const testScriptPath = path.join(EXTRACT_PATH, 'smoke_test.js');
    fs.writeFileSync(testScriptPath, testScriptContent);
    
    try {
        // Execute the smoke test in a new Node process
        execSync(`node ${testScriptPath} ${extensionPath}`, { stdio: 'inherit' });
    } catch (error) {
        throw new Error('SQLite3 smoke test failed');
    }

    console.log('VSIX validation successful!');
    process.exit(0);

} catch (error) {
    console.error('VSIX validation failed:', error.message);
    process.exit(1);
} finally {
    cleanUp();
}
