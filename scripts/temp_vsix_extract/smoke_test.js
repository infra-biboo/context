
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
    