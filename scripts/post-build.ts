import { join } from 'path';
import { promises as fs } from 'fs';


/**
 * Post-build script to create 404.html for GitHub Pages client-side routing fallback.
 * This copies the index.html file to 404.html to ensure that GitHub Pages serves 
 * the Angular application for any non-existent paths, allowing client-side routing to work.
 */
async function createGitHubPagesFallback(): Promise<void> {
  const buildDir = join(process.cwd(), 'dist', 'Evoku', 'browser');
  const indexPath = join(buildDir, 'index.html');
  const fallbackPath = join(buildDir, '404.html');

  try {
    // Check if the build directory and index.html exist
    await fs.access(buildDir);
    await fs.access(indexPath);
    
    // Copy index.html to 404.html
    await fs.copyFile(indexPath, fallbackPath);
    
    console.log('✅ Created 404.html fallback for GitHub Pages routing');
  } catch (error) {
    console.warn('⚠️  Could not create 404.html fallback:', (error as Error).message);
    console.warn('   This is expected if the client build does not exist.');
  }
}

createGitHubPagesFallback();