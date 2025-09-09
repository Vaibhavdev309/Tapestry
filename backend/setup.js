#!/usr/bin/env node

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

console.log('🔧 Setting up secure environment configuration...\n');

// Generate secure JWT secret
const jwtSecret = crypto.randomBytes(64).toString('hex');
console.log('✅ Generated secure JWT secret');

// Check if .env exists
const envPath = path.join(process.cwd(), '.env');
const envExamplePath = path.join(process.cwd(), '.env.example');

if (!fs.existsSync(envPath)) {
  if (fs.existsSync(envExamplePath)) {
    // Copy .env.example to .env
    const envExample = fs.readFileSync(envExamplePath, 'utf8');
    const envContent = envExample
      .replace('your-super-secure-jwt-secret-key-at-least-32-characters-long', jwtSecret)
      .replace('your-very-secure-admin-password-at-least-12-characters', crypto.randomBytes(16).toString('hex'));
    
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Created .env file from .env.example');
    console.log('⚠️  Please update the following in your .env file:');
    console.log('   - MONGODB_URI');
    console.log('   - ADMIN_EMAIL');
    console.log('   - ADMIN_PASSWORD');
    console.log('   - CLOUDINARY credentials');
    console.log('   - FRONTEND_URL and ADMIN_URL');
  } else {
    console.log('❌ .env.example file not found');
  }
} else {
  console.log('✅ .env file already exists');
}

// Create uploads directory
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ Created uploads directory');
} else {
  console.log('✅ Uploads directory already exists');
}

console.log('\n🚀 Setup complete!');
console.log('\n📋 Next steps:');
console.log('1. Update your .env file with actual values');
console.log('2. Start the server with: npm run server');
console.log('3. Test the API endpoints');
console.log('\n🔒 Security features enabled:');
console.log('- Rate limiting');
console.log('- Input validation');
console.log('- File upload security');
console.log('- CORS protection');
console.log('- Security headers');
console.log('- NoSQL injection protection');