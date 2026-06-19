import fs from 'node:fs';
import path from 'node:path';

const clientDir = path.join(process.cwd(), 'dist', 'client');
const shellPath = path.join(clientDir, '_shell.html');
const indexPath = path.join(clientDir, 'index.html');

console.log('Running post-build script...');

// 1. Rename _shell.html to index.html
if (fs.existsSync(shellPath)) {
  fs.renameSync(shellPath, indexPath);
  console.log('Successfully renamed _shell.html to index.html');
} else {
  console.log('No _shell.html found (already renamed or SSR build).');
}

// 2. Create .htaccess for SPA routing
const htaccessContent = `<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
`;

try {
  fs.writeFileSync(path.join(clientDir, '.htaccess'), htaccessContent);
  console.log('Successfully created .htaccess inside dist/client');
} catch (err) {
  console.error('Error creating .htaccess:', err);
}
