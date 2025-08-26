import { resolve } from 'path';
import { readFileSync, existsSync } from 'fs';


/**
 * Load environment variables based on NODE_ENV or explicit environment name.
 * Follows precedence: .env.[environment].local > .env.local > .env.[environment] > .env
 * 
 * @param environment - Environment name (defaults to NODE_ENV or 'development')
 * @param projectRoot - Path to project root containing .env files (defaults to process.cwd())
 */
export function loadEnvironment(
  environment?: string,
  projectRoot: string = process.cwd()
): Record<string, string> {
  const env = environment ?? process.env['NODE_ENV'] ?? 'development';
  const envVars: Record<string, string> = {};

  // Files to load in order of precedence (lowest to highest)
  const envFiles = [
    '.env',
    `.env.${env}`,
    '.env.local',
    `.env.${env}.local`,
  ];

  for (const file of envFiles) {
    const filePath = resolve(projectRoot, file);
    if (existsSync(filePath)) {
      try {
        const content = readFileSync(filePath, 'utf8');
        const parsed = parseEnvFile(content);
        Object.assign(envVars, parsed);
        console.log(`Loaded environment from ${file}`);
      } catch (error) {
        console.warn(`Failed to load ${file}:`, error);
      }
    }
  }

  // Apply to process.env
  for (const [key, value] of Object.entries(envVars)) {
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }

  return envVars;
}

/**
 * Simple .env file parser
 */
function parseEnvFile(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  
  for (let line of content.split('\n')) {
    line = line.trim();
    
    // Skip empty lines and comments
    if (!line || line.startsWith('#')) {
      continue;
    }
    
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const [, key, value] = match;
      result[key.trim()] = value.trim();
    }
  }
  
  return result;
}

/**
 * Get a required environment variable with helpful error message
 */
export function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (value === undefined || value === '') {
    throw new Error(
      `Required environment variable ${key} is not set. ` +
      `Check your .env files and ensure ${key} is defined.`
    );
  }
  return value;
}

/**
 * Get an optional environment variable with default value
 */
export function getOptionalEnv(key: string, defaultValue: string): string {
  return process.env[key] ?? defaultValue;
}
