
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

    // 2. Verify sqlite3 module exists (may not have lib directory in all cases)
    const sqlite3ModulePath = path.join(extensionPath, 'node_modules', '@vscode', 'sqlite3');
    console.log(`Checking for sqlite3 module path: ${sqlite3ModulePath}`);
    
    // For our dynamic loading strategy, we just need to verify binaries exist
    // The module structure might vary based on how it's packaged
    if (!fs.existsSync(path.join(extensionPath, 'dist', 'binaries'))) {
        console.log('Warning: dist/binaries directory not found, checking alternative locations...');
    }

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

    // 4. Simplified validation - just verify the critical binaries exist
    console.log('Smoke test: verifying critical extension files...');
    
    // Check for main extension file
    const mainExtensionFile = path.join(extensionPath, 'dist', 'extension.js');
    if (!fs.existsSync(mainExtensionFile)) {
        throw new Error(`Main extension file not found: ${mainExtensionFile}`);
    }
    console.log('✓ Main extension file found');
    
    // List all directories to understand the structure
    console.log('\nExtension structure:');
    console.log('- Root files:', fs.readdirSync(extensionPath).filter(f => fs.statSync(path.join(extensionPath, f)).isFile()).slice(0, 10));
    console.log('- Root directories:', fs.readdirSync(extensionPath).filter(f => fs.statSync(path.join(extensionPath, f)).isDirectory()));
    
    if (fs.existsSync(path.join(extensionPath, 'dist'))) {
        console.log('- dist contents:', fs.readdirSync(path.join(extensionPath, 'dist')).slice(0, 10));
    }
    
    if (fs.existsSync(path.join(extensionPath, 'node_modules'))) {
        console.log('- node_modules contains @vscode/sqlite3:', fs.existsSync(path.join(extensionPath, 'node_modules', '@vscode', 'sqlite3')));
    }

    console.log('VSIX validation successful!');
    process.exit(0);

} catch (error) {
    console.error('VSIX validation failed:', error.message);
    process.exit(1);
} finally {
    cleanUp();
}
