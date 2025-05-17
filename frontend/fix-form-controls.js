const fs = require('fs');
const path = require('path');

const appDir = path.join(__dirname, 'src', 'app');

function replaceInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    // Replace f.controlName with f['controlName']
    // Only inside HTML attribute or template expressions
    content = content.replace(/f\.(\w+)/g, `f['$1']`);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed: ${filePath}`);
}

function walkDir(dir) {
    fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else if (file.endsWith('.html')) {
            replaceInFile(fullPath);
        }
    });
}

walkDir(appDir);
console.log('Done!');