import * as fs from 'fs';
import * as path from 'path';

export class FileUtils {
    /**
     * Check if a file exists
     */
    static exists(filePath: string): boolean {
        try {
            return fs.existsSync(filePath);
        } catch {
            return false;
        }
    }

    /**
     * Read file content safely
     */
    static readFile(filePath: string): string | null {
        try {
            return fs.readFileSync(filePath, 'utf-8');
        } catch {
            return null;
        }
    }

    /**
     * Get file extension
     */
    static getExtension(filePath: string): string {
        return path.extname(filePath).toLowerCase();
    }

    /**
     * Get relative path from workspace
     */
    static getRelativePath(filePath: string, workspaceRoot: string): string {
        return path.relative(workspaceRoot, filePath);
    }

    /**
     * Check if file is a code file
     */
    static isCodeFile(filePath: string): boolean {
        const codeExtensions = [
            '.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.cpp', '.c', '.h',
            '.rs', '.go', '.php', '.rb', '.cs', '.swift', '.kt', '.scala'
        ];
        
        return codeExtensions.includes(this.getExtension(filePath));
    }

    /**
     * Check if file is a configuration file
     */
    static isConfigFile(filePath: string): boolean {
        const configExtensions = ['.json', '.yaml', '.yml', '.toml', '.ini', '.config'];
        const configFiles = [
            'package.json', 'cargo.toml', 'requirements.txt', 'dockerfile', 
            'docker-compose.yml', '.env', '.gitignore'
        ];
        
        const fileName = path.basename(filePath).toLowerCase();
        const extension = this.getExtension(filePath);
        
        return configExtensions.includes(extension) || 
               configFiles.some(file => fileName.includes(file));
    }

    /**
     * Check if file should be ignored
     */
    static shouldIgnore(filePath: string): boolean {
        const ignorePatterns = [
            /node_modules/,
            /\.git/,
            /dist|build|out|target/,
            /\.cache|\.tmp|\.log/,
            /\.DS_Store|Thumbs\.db/,
            /package-lock\.json|yarn\.lock/
        ];
        
        return ignorePatterns.some(pattern => pattern.test(filePath));
    }
}