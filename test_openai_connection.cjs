const https = require('https');
const fs = require('fs');
const path = require('path');

// Read .env manually
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
        env[key] = value;
    }
});

// Force openai.azure.com
const endpoint = env.VITE_AZURE_OPENAI_ENDPOINT.replace('cognitiveservices.azure.com', 'openai.azure.com');
const apiKey = env.VITE_AZURE_OPENAI_API_KEY;

console.log('--- Configuration ---');
console.log(`Endpoint: ${endpoint}`);
console.log(`API Key: ${apiKey ? '***' + apiKey.slice(-4) : 'MISSING'}`);

if (!endpoint || !apiKey) {
    console.error('Missing configuration!');
    process.exit(1);
}

// Construct URL to LIST deployments
// Using a standard management API version
const baseUrl = endpoint.replace(/\/$/, '');
const pathStr = `/openai/deployments?api-version=2023-05-15`;
const fullUrl = `${baseUrl}${pathStr}`;

console.log(`\nFull URL: ${fullUrl}`);

const urlObj = new URL(fullUrl);

const options = {
    hostname: urlObj.hostname,
    path: urlObj.pathname + urlObj.search,
    method: 'GET',
    headers: {
        'api-key': apiKey
    }
};

console.log('\n--- Sending Request ---');
const req = https.request(options, (res) => {
    console.log(`Status Code: ${res.statusCode}`);
    console.log(`Status Message: ${res.statusMessage}`);

    let responseBody = '';

    res.on('data', (chunk) => {
        responseBody += chunk;
    });

    res.on('end', () => {
        console.log('\n--- Response Body ---');
        console.log(responseBody);
    });
});

req.on('error', (error) => {
    console.error('\n--- Error ---');
    console.error(error);
});

req.end();
