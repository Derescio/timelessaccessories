import { execSync } from 'child_process';

async function main() {
  try {
    console.log('Running Prisma migrations...');
    
    // Generate Prisma client
    execSync('npx prisma generate', { stdio: 'inherit' });
    
    // Apply migrations
    execSync('npx prisma migrate dev --name add_userId_to_category', { stdio: 'inherit' });
    
    console.log('Migrations completed successfully!');
  } catch (error) {
    console.error('Error applying migrations:', error);
    process.exit(1);
  }
}

main(); 