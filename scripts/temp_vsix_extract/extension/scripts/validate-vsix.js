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

console.log(`Starting VSIX validation for: ${VSIX_PATH}`);
cleanUp(); // Ensure a clean slate

try {
    // 1. Decompress the VSIX
    console.log(`Decompressing VSIX to: ${EXTRACT_PATH}`);
    const zip = new AdmZip(VSIX_PATH);
    zip.extractAllTo(EXTRACT_PATH, true);
    console.log('VSIX decompressed successfully.');

    const extensionPath = path.join(EXTRACT_PATH, 'extension');

    // 2. Verify main extension file exists
    const mainExtensionFile = path.join(extensionPath, 'dist', 'extension.js');
    console.log(`Checking for main extension file: ${mainExtensionFile}`);
    if (!fs.existsSync(mainExtensionFile)) {
        throw new Error(`Main extension file not found: ${mainExtensionFile}`);
    }
    console.log('✓ Main extension file found');

    // 3. Verify sql.js wasm file exists
    const wasmFile = path.join(extensionPath, 'dist', 'assets', 'sql-wasm.wasm');
    console.log(`Checking for sql.js wasm file: ${wasmFile}`);
    if (!fs.existsSync(wasmFile)) {
        throw new Error(`sql.js WASM file not found: ${wasmFile}`);
    }
    console.log('✓ sql.js WASM file found');

    // 4. Verify sql.js module is included in node_modules
    const sqlJsModule = path.join(extensionPath, 'node_modules', 'sql.js');
    console.log(`Checking for sql.js module: ${sqlJsModule}`);
    if (!fs.existsSync(sqlJsModule)) {
        throw new Error(`sql.js module not found: ${sqlJsModule}`);
    }
    console.log('✓ sql.js module found in node_modules');

    // 5. Execute a smoke test: try to load sql.js
    console.log('Running smoke test: attempting to load sql.js...');
    const testScriptContent = `
        const path = require('path');
        const fs = require('fs');
        const extensionPath = process.argv[2];
        
        try {
            // Test loading sql.js module
            const sqlJsPath = path.join(extensionPath, 'node_modules', 'sql.js');
            const initSqlJs = require(sqlJsPath);
            console.log('✓ sql.js module loaded successfully');
            
            // Test loading WASM file
            const wasmPath = path.join(extensionPath, 'dist', 'assets', 'sql-wasm.wasm');
            if (!fs.existsSync(wasmPath)) {
                throw new Error('WASM file not found: ' + wasmPath);
            }
            
            const wasmBuffer = fs.readFileSync(wasmPath);
            console.log('✓ WASM file read successfully (' + wasmBuffer.length + ' bytes)');
            
            // Test initializing sql.js with WASM
            initSqlJs({ wasmBinary: wasmBuffer }).then(SQL => {
                console.log('✓ sql.js initialized successfully with WASM');
                
                // Test creating a database
                const db = new SQL.Database();
                console.log('✓ In-memory database created successfully');
                
                // Test basic SQL operations
                db.exec("CREATE TABLE test (id INTEGER, name TEXT);");
                db.exec("INSERT INTO test VALUES (1, 'Hello'), (2, 'World');");
                
                const stmt = db.prepare("SELECT * FROM test");
                let results = [];
                while (stmt.step()) {
                    results.push(stmt.getAsObject());
                }
                stmt.free();
                
                if (results.length === 2) {
                    console.log('✓ Basic SQL operations successful');
                    console.log('✅ sql.js smoke test passed!');
                    process.exit(0);
                } else {
                    throw new Error('SQL query returned unexpected results');
                }
            }).catch(error => {
                console.error('✗ Failed to initialize sql.js:', error.message);
                process.exit(1);
            });
        } catch (error) {
            console.error('✗ Smoke test failed:', error.message);
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
        throw new Error('sql.js smoke test failed');
    }

    console.log('VSIX validation successful!');
    process.exit(0);

} catch (error) {
    console.error('VSIX validation failed:', error.message);
    process.exit(1);
} finally {
    cleanUp();
}