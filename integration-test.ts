#!/usr/bin/env node

/**
 * Knish.IO TypeScript SDK Integration Test Script
 *
 * This script performs integration tests against a live Knish.IO validator node
 * using the KnishIOClient API methods. It validates real-world functionality
 * with full TypeScript type safety and modern ES2025 features.
 * 
 * Usage:
 *   npx tsx integration-test.ts --url https://testnet.knish.io/graphql
 *   KNISHIO_API_URL=https://mainnet.knish.io/graphql npx tsx integration-test.ts
 *   npm run integration-test https://localhost:8000/graphql
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseArgs } from 'util';
import { setTimeout } from 'timers/promises';

// Import KnishIO SDK - Use self-test pattern to avoid gql import issues
import { KnishIOClient, generateSecret, Wallet, Molecule } from './src/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Enhanced TypeScript types for configuration
interface ServerConfig {
  graphqlUrl: string;
  cellSlug: string;
  timeout: number;
  retries: number;
  retryDelay: number;
}

interface TestConfig {
  authentication: {
    testSecret: string;
    guestMode: boolean;
  };
  metadata: {
    metaType: string;
    metaId: string;
    metadata: Record<string, string>;
  };
  tokens: {
    testTokenSlug: string;
    initialSupply: number;
    tokenMeta: {
      name: string;
      symbol: string;
      fungibility: string;
      supply: string;
      decimals: string;
    };
  };
  transfers: {
    transferAmount: number;
    recipientSecret: string;
  };
  cleanup: {
    enabled: boolean;
    preserveResults: boolean;
  };
}

interface NetworkStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalResponseTime: number;
  averageResponseTime: number;
}

interface TestResults {
  sdk: string;
  version: string;
  timestamp: string;
  server: {
    url: string;
    cellSlug: string;
  };
  tests: Record<string, any>;
  performance: Record<string, any>;
  networkStats: NetworkStats;
  serverCompatible: boolean;
  overallSuccess: boolean;
  totalExecutionTime?: number;
}

// CLI argument parsing with TypeScript type safety
const args = parseArgs({
  args: process.argv.slice(2),
  options: {
    url: { type: 'string', short: 'u' },
    config: { type: 'string', short: 'c' },
    cell: { type: 'string' },
    timeout: { type: 'string', default: '30000' },
    help: { type: 'boolean', short: 'h' }
  },
  allowPositionals: true
});

if (args.values.help) {
  console.log(`
Knish.IO TypeScript SDK Integration Test

Usage:
  npx tsx integration-test.ts --url <graphql-url> [options]

Options:
  -u, --url <url>       GraphQL API URL (required)
  -c, --config <file>   External configuration file
  --cell <slug>         Cell slug for testing
  --timeout <ms>        Request timeout in milliseconds (default: 30000)
  -h, --help           Show this help message

Environment Variables:
  KNISHIO_API_URL      GraphQL API URL (alternative to --url)
  KNISHIO_CELL_SLUG    Cell slug (alternative to --cell)

Examples:
  npx tsx integration-test.ts --url https://testnet.knish.io/graphql
  KNISHIO_API_URL=https://localhost:8000/graphql npx tsx integration-test.ts
  npm run integration-test https://localhost:8000/graphql
  `);
  process.exit(0);
}

// Get GraphQL URL with type safety
const graphqlUrl: string | undefined = args.values.url || 
                                      args.positionals[0] || 
                                      process.env.KNISHIO_API_URL;

if (!graphqlUrl) {
  console.error('❌ Error: GraphQL API URL is required');
  console.error('Use --url, provide as positional argument, or set KNISHIO_API_URL environment variable');
  process.exit(1);
}

// TypeScript configuration with strict typing
const DEFAULT_CONFIG: { server: ServerConfig; tests: TestConfig } = {
  server: {
    graphqlUrl,
    cellSlug: args.values.cell || process.env.KNISHIO_CELL_SLUG || 'INTEGRATION_TEST_TS',
    timeout: parseInt(args.values.timeout, 10),
    retries: 3,
    retryDelay: 1000
  },
  tests: {
    authentication: {
      testSecret: generateSecret('INTEGRATION_TEST_TS_AUTH'),
      guestMode: false
    },
    metadata: {
      metaType: "IntegrationTestTS",
      metaId: `TS_TEST_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      metadata: {
        test_name: "TypeScript SDK Integration Test",
        timestamp: new Date().toISOString(),
        sdk_version: "1.0.0",
        language: "TypeScript",
        type_safety: "Full",
        description: "Live integration test for KnishIOClient TypeScript functionality"
      }
    },
    tokens: {
      testTokenSlug: `TS_INT_TEST_${Date.now().toString(36).toUpperCase()}`,
      initialSupply: 15000,
      tokenMeta: {
        name: "TypeScript Integration Test Token",
        symbol: "TSIT", 
        fungibility: "fungible",
        supply: "limited",
        decimals: "3"
      }
    },
    transfers: {
      transferAmount: 150,
      recipientSecret: generateSecret('INTEGRATION_TEST_TS_RECIPIENT')
    },
    cleanup: {
      enabled: true,
      preserveResults: true
    }
  }
};

// Load external configuration if provided with type safety
const configPath = args.values.config;
const config = configPath && fs.existsSync(configPath) 
  ? { ...DEFAULT_CONFIG, ...JSON.parse(fs.readFileSync(configPath, 'utf8')) }
  : DEFAULT_CONFIG;

// Update server config with CLI args
config.server.graphqlUrl = graphqlUrl;
if (args.values.cell) config.server.cellSlug = args.values.cell;
if (args.values.timeout) config.server.timeout = parseInt(args.values.timeout, 10);

// Enhanced results tracking with TypeScript interfaces
const results: TestResults = {
  sdk: 'TypeScript',
  version: '1.0.0',
  timestamp: new Date().toISOString(),
  server: {
    url: config.server.graphqlUrl,
    cellSlug: config.server.cellSlug
  },
  tests: {},
  performance: {},
  networkStats: {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    totalResponseTime: 0,
    averageResponseTime: 0
  },
  serverCompatible: true,
  overallSuccess: false
};

// Enhanced color output with TypeScript enum
enum Color {
  RESET = '\x1b[0m',
  BRIGHT = '\x1b[1m',
  GREEN = '\x1b[32m',
  RED = '\x1b[31m', 
  YELLOW = '\x1b[33m',
  BLUE = '\x1b[34m',
  MAGENTA = '\x1b[35m',
  CYAN = '\x1b[36m',
  GRAY = '\x1b[90m'
}

function log(message: string, color: Color = Color.RESET, indent: number = 0): void {
  const spaces = '  '.repeat(indent);
  console.log(`${spaces}${color}${message}${Color.RESET}`);
}

function logTest(testName: string, passed: boolean, errorDetail?: string, responseTime?: number): void {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  const color = passed ? Color.GREEN : Color.RED;
  const timeStr = responseTime ? ` (${responseTime}ms)` : '';
  
  log(`${status}: ${testName}${timeStr}`, color, 1);
  
  if (!passed && errorDetail) {
    log(`${errorDetail}`, Color.RED, 2);
  }
}

function logSection(sectionName: string): void {
  log(`\n${sectionName}`, Color.BLUE);
  log('═'.repeat(sectionName.length + 4), Color.BLUE);
}

/**
 * Enhanced error handling with retry logic and TypeScript error types
 */
async function executeWithRetry<T>(
  operation: () => Promise<T>,
  operationName: string,
  maxRetries: number = config.server.retries
): Promise<{ result: T; responseTime: number }> {
  const startTime = Date.now();
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      results.networkStats.totalRequests++;
      
      const result = await Promise.race([
        operation(),
        setTimeout(config.server.timeout).then(() => {
          throw new Error(`Timeout after ${config.server.timeout}ms`);
        })
      ]);
      
      const responseTime = Date.now() - startTime;
      results.networkStats.successfulRequests++;
      results.networkStats.totalResponseTime += responseTime;
      
      return { result, responseTime };
      
    } catch (error) {
      results.networkStats.failedRequests++;
      
      if (attempt === maxRetries) {
        throw new Error(`${operationName} failed after ${maxRetries} attempts: ${error instanceof Error ? error.message : String(error)}`);
      }
      
      log(`Attempt ${attempt}/${maxRetries} failed: ${error instanceof Error ? error.message : String(error)}`, Color.YELLOW, 2);
      
      if (config.server.retryDelay > 0) {
        await setTimeout(config.server.retryDelay);
      }
    }
  }
  
  throw new Error('Unreachable code');
}

/**
 * Test 1: Client Connectivity and Authentication
 * Validates TypeScript-specific client functionality
 */
async function testClientConnectivity(): Promise<{ client: any | null; authSuccess: boolean }> {
  logSection('1. TypeScript Client Connectivity and Authentication Test');
  
  try {
    // Initialize TypeScript client with full type safety
    const client = new KnishIOClient({
      uri: config.server.graphqlUrl,
      cellSlug: config.server.cellSlug,
      logging: false
    });
    
    logTest('TypeScript client initialization', true);
    
    // Test authentication with proper error handling
    const { result: authResponse, responseTime } = await executeWithRetry(
      async () => {
        return await client.requestAuthToken({
          secret: config.tests.authentication.testSecret,
          cellSlug: config.server.cellSlug,
          encrypt: false
        });
      },
      'TypeScript Authentication'
    );
    
    const authSuccess = authResponse?.success?.() || false;
    logTest('Server authentication (TypeScript)', authSuccess, 
      authSuccess ? null : `Auth failed: ${authResponse?.reason?.() || 'Unknown error'}`, 
      responseTime
    );
    
    // Test TypeScript-specific functionality
    if (authSuccess) {
      const { result: balanceResponse, responseTime: queryTime } = await executeWithRetry(
        async () => {
          return await client.queryBalance({
            token: 'USER'
          });
        },
        'TypeScript connectivity query'
      );
      
      const querySuccess = balanceResponse?.success?.() !== false;
      logTest('TypeScript GraphQL query execution', querySuccess, 
        querySuccess ? null : 'Failed to execute TypeScript GraphQL query', 
        queryTime
      );
      
      results.tests.connectivity = {
        passed: authSuccess && querySuccess,
        authenticationTime: responseTime,
        queryTime: queryTime,
        serverVersion: authResponse?.data?.version || 'unknown',
        typeSafety: 'enforced'
      };
      
      return { client, authSuccess: authSuccess && querySuccess };
    }
    
    results.tests.connectivity = {
      passed: false,
      error: 'Authentication failed',
      typeSafety: 'enforced'
    };
    
    return { client: null, authSuccess: false };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logTest('TypeScript client connectivity', false, errorMessage);
    results.tests.connectivity = {
      passed: false,
      error: errorMessage,
      typeSafety: 'enforced'
    };
    return { client: null, authSuccess: false };
  }
}

/**
 * Test 2: TypeScript-Enhanced Metadata Operations  
 * Tests type-safe metadata creation and retrieval
 */
async function testMetadataOperations(client: any): Promise<boolean> {
  logSection('2. TypeScript Metadata Operations Integration Test');
  
  if (!client) {
    logTest('TypeScript metadata operations', false, 'Client not available');
    results.tests.metadata = { passed: false, error: 'Client not available', typeSafety: 'enforced' };
    return false;
  }
  
  try {
    const testConfig = config.tests.metadata;
    
    // Create metadata with TypeScript type validation
    const { result: createResponse, responseTime: createTime } = await executeWithRetry(
      async () => {
        return await client.createMeta({
          metaType: testConfig.metaType,
          metaId: testConfig.metaId, 
          meta: testConfig.metadata
        });
      },
      'TypeScript create metadata'
    );
    
    const createSuccess = createResponse?.success?.() || false;
    const molecularHash = createResponse?.payload?.()?.molecularHash;
    
    logTest('Create metadata via TypeScript client', createSuccess, 
      createSuccess ? null : `Creation failed: ${createResponse?.reason?.() || 'Unknown error'}`,
      createTime
    );
    
    if (!createSuccess) {
      results.tests.metadata = {
        passed: false,
        error: 'Failed to create metadata with TypeScript',
        typeSafety: 'enforced'
      };
      return false;
    }
    
    // Wait for server propagation
    await setTimeout(2000);
    
    // Query metadata with full TypeScript type checking
    const { result: queryResponse, responseTime: queryTime } = await executeWithRetry(
      async () => {
        return await client.queryMeta({
          metaType: testConfig.metaType,
          metaId: testConfig.metaId
        });
      },
      'TypeScript query metadata'
    );
    
    const querySuccess = Array.isArray(queryResponse) && queryResponse.length > 0;
    const retrievedMeta = querySuccess ? queryResponse[0] : null;
    
    logTest('Query metadata via TypeScript client', querySuccess,
      querySuccess ? null : 'No metadata retrieved',
      queryTime
    );
    
    // Validate metadata content with TypeScript safety
    let contentValid = false;
    if (querySuccess && retrievedMeta) {
      const originalKeys = Object.keys(testConfig.metadata);
      contentValid = originalKeys.every(key => 
        retrievedMeta.meta?.some?.((m: any) => m.key === key && m.value === testConfig.metadata[key])
      );
    }
    
    logTest('TypeScript metadata content validation', contentValid,
      contentValid ? null : 'Retrieved metadata does not match created metadata'
    );
    
    results.tests.metadata = {
      passed: createSuccess && querySuccess && contentValid,
      molecularHash,
      createTime,
      queryTime,
      metaCount: queryResponse?.length || 0,
      contentMatched: contentValid,
      typeSafety: 'enforced'
    };
    
    return createSuccess && querySuccess && contentValid;
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logTest('TypeScript metadata operations', false, errorMessage);
    results.tests.metadata = {
      passed: false,
      error: errorMessage,
      typeSafety: 'enforced'
    };
    return false;
  }
}

/**
 * Test 3: TypeScript Token Operations with Type Safety
 * Tests createToken and queryBalance with full type validation
 */
async function testTokenOperations(client: any): Promise<{ success: boolean; tokenSlug: string | null }> {
  logSection('3. TypeScript Token Operations Integration Test');
  
  if (!client) {
    logTest('TypeScript token operations', false, 'Client not available');
    results.tests.tokens = { passed: false, error: 'Client not available', typeSafety: 'enforced' };
    return { success: false, tokenSlug: null };
  }
  
  try {
    const testConfig = config.tests.tokens;
    
    // Create new token with TypeScript validation
    const { result: tokenResponse, responseTime: createTime } = await executeWithRetry(
      async () => {
        return await client.createToken({
          token: testConfig.testTokenSlug,
          amount: testConfig.initialSupply,
          meta: testConfig.tokenMeta
        });
      },
      'TypeScript create token'
    );
    
    const tokenSuccess = tokenResponse?.success?.() || false;
    const tokenMolecularHash = tokenResponse?.payload?.()?.molecularHash;
    
    logTest('Create token via TypeScript client', tokenSuccess,
      tokenSuccess ? null : `Token creation failed: ${tokenResponse?.reason?.() || 'Unknown error'}`,
      createTime
    );
    
    if (!tokenSuccess) {
      results.tests.tokens = {
        passed: false,
        error: 'Failed to create token with TypeScript',
        typeSafety: 'enforced'
      };
      return { success: false, tokenSlug: null };
    }
    
    // Wait for propagation
    await setTimeout(2000);
    
    // Query balance with TypeScript type safety
    const { result: balanceResponse, responseTime: balanceTime } = await executeWithRetry(
      async () => {
        return await client.queryBalance({
          token: testConfig.testTokenSlug
        });
      },
      'TypeScript query token balance'
    );
    
    const balancePayload = balanceResponse?.payload?.();
    const balanceSuccess = !!balancePayload && parseFloat(balancePayload.balance) > 0;
    const actualBalance = balancePayload?.balance || 0;
    
    logTest('Query token balance (TypeScript)', balanceSuccess,
      balanceSuccess ? null : 'No balance found for TypeScript-created token',
      balanceTime
    );
    
    // Validate balance amount with type checking
    const expectedBalance = testConfig.initialSupply;
    const balanceMatches = balanceSuccess && parseFloat(actualBalance) === expectedBalance;
    
    logTest('TypeScript balance amount validation', balanceMatches,
      balanceMatches ? null : `Expected ${expectedBalance}, got ${actualBalance}`
    );
    
    results.tests.tokens = {
      passed: tokenSuccess && balanceSuccess && balanceMatches,
      tokenSlug: testConfig.testTokenSlug,
      molecularHash: tokenMolecularHash,
      createTime,
      balanceTime,
      expectedBalance,
      actualBalance,
      balanceMatches,
      typeSafety: 'enforced'
    };
    
    return { 
      success: tokenSuccess && balanceSuccess && balanceMatches, 
      tokenSlug: testConfig.testTokenSlug 
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logTest('TypeScript token operations', false, errorMessage);
    results.tests.tokens = {
      passed: false,
      error: errorMessage,
      typeSafety: 'enforced'
    };
    return { success: false, tokenSlug: null };
  }
}

/**
 * Test 4: TypeScript Wallet and Transfer Operations
 * Tests type-safe wallet creation and token transfers
 */
async function testWalletAndTransferOperations(client: any, tokenSlug: string | null): Promise<boolean> {
  logSection('4. TypeScript Wallet and Transfer Operations Test');
  
  if (!client || !tokenSlug) {
    const error = !client ? 'Client not available' : 'No token available for transfer';
    logTest('TypeScript wallet and transfer operations', false, error);
    results.tests.transfers = { passed: false, error, typeSafety: 'enforced' };
    return false;
  }
  
  try {
    const testConfig = config.tests.transfers;
    
    // Create TypeScript-validated recipient client
    const recipientClient = new KnishIOClient({
      uri: config.server.graphqlUrl,
      cellSlug: config.server.cellSlug,
      logging: false
    });
    
    // Authenticate recipient with TypeScript error handling
    const { result: recipientAuth } = await executeWithRetry(
      async () => {
        return await recipientClient.requestAuthToken({
          secret: testConfig.recipientSecret,
          cellSlug: config.server.cellSlug,
          encrypt: false
        });
      },
      'TypeScript recipient authentication'
    );
    
    const recipientAuthSuccess = recipientAuth?.success?.() || false;
    logTest('TypeScript recipient authentication', recipientAuthSuccess);
    
    if (!recipientAuthSuccess) {
      results.tests.transfers = {
        passed: false,
        error: 'TypeScript recipient authentication failed',
        typeSafety: 'enforced'
      };
      return false;
    }
    
    // Create recipient wallet with TypeScript validation
    const { result: walletResponse, responseTime: walletTime } = await executeWithRetry(
      async () => {
        return await recipientClient.createWallet({
          token: tokenSlug
        });
      },
      'TypeScript create recipient wallet'
    );
    
    const walletSuccess = walletResponse?.success?.() || false;
    logTest('Create recipient wallet (TypeScript)', walletSuccess,
      walletSuccess ? null : `Wallet creation failed: ${walletResponse?.reason?.() || 'Unknown error'}`,
      walletTime
    );
    
    if (!walletSuccess) {
      results.tests.transfers = {
        passed: false,
        error: 'Failed to create TypeScript recipient wallet',
        typeSafety: 'enforced'
      };
      return false;
    }
    
    // Wait for wallet propagation
    await setTimeout(2000);
    
    // Execute TypeScript-validated transfer
    const recipientBundle = recipientClient.getBundle();
    
    const { result: transferResponse, responseTime: transferTime } = await executeWithRetry(
      async () => {
        return await client.transferToken({
          bundleHash: recipientBundle,
          token: tokenSlug,
          amount: testConfig.transferAmount
        });
      },
      'TypeScript execute token transfer'
    );
    
    const transferSuccess = transferResponse?.success?.() || false;
    const transferMolecularHash = transferResponse?.payload?.()?.molecularHash;
    
    logTest('Execute token transfer (TypeScript)', transferSuccess,
      transferSuccess ? null : `Transfer failed: ${transferResponse?.reason?.() || 'Unknown error'}`,
      transferTime
    );
    
    if (!transferSuccess) {
      results.tests.transfers = {
        passed: false,
        error: 'TypeScript token transfer failed',
        typeSafety: 'enforced'
      };
      return false;
    }
    
    // Wait for transfer propagation
    await setTimeout(3000);
    
    // Verify recipient balance with TypeScript type safety
    const { result: recipientBalance, responseTime: balanceTime } = await executeWithRetry(
      async () => {
        return await recipientClient.queryBalance({
          token: tokenSlug
        });
      },
      'TypeScript query recipient balance'
    );
    
    const recipientBalancePayload = recipientBalance?.payload?.();
    const balanceVerifySuccess = !!recipientBalancePayload;
    const receivedAmount = parseFloat(recipientBalancePayload?.balance || 0);
    const balanceCorrect = receivedAmount === testConfig.transferAmount;
    
    logTest('Verify TypeScript recipient balance', balanceVerifySuccess && balanceCorrect,
      balanceCorrect ? null : `Expected ${testConfig.transferAmount}, received ${receivedAmount}`,
      balanceTime
    );
    
    results.tests.transfers = {
      passed: transferSuccess && balanceVerifySuccess && balanceCorrect,
      transferAmount: testConfig.transferAmount,
      receivedAmount,
      molecularHash: transferMolecularHash,
      walletTime,
      transferTime,
      balanceTime,
      balanceCorrect,
      typeSafety: 'enforced'
    };
    
    return transferSuccess && balanceVerifySuccess && balanceCorrect;
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logTest('TypeScript wallet and transfer operations', false, errorMessage);
    results.tests.transfers = {
      passed: false,
      error: errorMessage,
      typeSafety: 'enforced'
    };
    return false;
  }
}

/**
 * Calculate performance and network statistics with TypeScript precision
 */
function calculateNetworkStats(): void {
  if (results.networkStats.totalRequests > 0) {
    results.networkStats.averageResponseTime = Math.round(
      results.networkStats.totalResponseTime / results.networkStats.successfulRequests
    );
  }
  
  results.performance = {
    totalRequests: results.networkStats.totalRequests,
    successfulRequests: results.networkStats.successfulRequests,
    failedRequests: results.networkStats.failedRequests,
    successRate: results.networkStats.totalRequests > 0 
      ? Math.round((results.networkStats.successfulRequests / results.networkStats.totalRequests) * 100)
      : 0,
    averageResponseTime: results.networkStats.averageResponseTime,
    language: 'TypeScript',
    typeSystem: 'Static'
  };
}

/**
 * Save TypeScript integration test results
 */
function saveResults(): void {
  const resultsDir = process.env.KNISHIO_SHARED_RESULTS || 
                    path.resolve(__dirname, '../shared-test-results');
  
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }
  
  const resultsFile = path.join(resultsDir, 'typescript-integration-results.json');
  fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
  
  log(`\n📁 Results saved to: ${resultsFile}`, Color.BLUE);
}

/**
 * Print comprehensive summary with TypeScript-specific metrics
 */
function printSummary(): void {
  logSection('TYPESCRIPT INTEGRATION TEST SUMMARY REPORT');
  
  const testResults = Object.values(results.tests);
  const totalTests = testResults.length;
  const passedTests = testResults.filter((t: any) => t.passed).length;
  const failedTests = totalTests - passedTests;
  
  log(`\nSDK: ${results.sdk} v${results.version}`, Color.BRIGHT);
  log(`Language: TypeScript (Type Safety: Enforced)`, Color.BRIGHT);
  log(`Server: ${results.server.url}`, Color.BRIGHT);
  log(`Cell: ${results.server.cellSlug}`, Color.BRIGHT);
  log(`Timestamp: ${results.timestamp}`, Color.GRAY);
  
  log(`\nTests Passed: ${passedTests}/${totalTests}`, 
    passedTests === totalTests ? Color.GREEN : Color.RED);
  
  if (failedTests > 0) {
    log('\nFailed Tests:', Color.RED);
    for (const [testName, testResult] of Object.entries(results.tests)) {
      if (!(testResult as any).passed) {
        log(`  - ${testName}: ${(testResult as any).error || 'Test failed'}`, Color.RED, 1);
      }
    }
  }
  
  // TypeScript-specific performance metrics
  if (results.performance.totalRequests > 0) {
    log('\nTypeScript Performance Metrics:', Color.CYAN);
    log(`  Network Requests: ${results.performance.totalRequests}`, Color.GRAY, 1);
    log(`  Success Rate: ${results.performance.successRate}%`, Color.GRAY, 1);
    log(`  Average Response Time: ${results.performance.averageResponseTime}ms`, Color.GRAY, 1);
    log(`  Type System: ${results.performance.typeSystem}`, Color.GRAY, 1);
  }
  
  log(`\nServer Compatible: ${results.serverCompatible ? '✅ YES' : '❌ NO'}`,
    results.serverCompatible ? Color.GREEN : Color.RED);
  
  log('\n' + '═'.repeat(60), Color.BLUE);
}

/**
 * Main TypeScript integration test runner
 */
async function runIntegrationTests(): Promise<void> {
  log('═'.repeat(70), Color.BLUE);
  log('    Knish.IO TypeScript SDK Integration Tests', Color.BRIGHT);
  log('═'.repeat(70), Color.BLUE);
  
  log(`\n🌐 Server: ${config.server.graphqlUrl}`, Color.CYAN);
  log(`📱 Cell: ${config.server.cellSlug}`, Color.CYAN);
  log(`⏱️  Timeout: ${config.server.timeout}ms`, Color.CYAN);
  log(`🔄 Retries: ${config.server.retries}`, Color.CYAN);
  log(`🔧 Language: TypeScript (Type Safety Enforced)`, Color.CYAN);
  
  const startTime = Date.now();
  
  try {
    // Test 1: TypeScript Client Connectivity and Authentication  
    const { client, authSuccess } = await testClientConnectivity();
    
    if (!authSuccess) {
      log('\n❌ TypeScript integration tests cannot continue without successful authentication', Color.RED);
      results.overallSuccess = false;
      results.serverCompatible = false;
      return;
    }
    
    // Test 2: TypeScript Metadata Operations
    const metadataSuccess = await testMetadataOperations(client);
    
    // Test 3: TypeScript Token Operations
    const { success: tokenSuccess, tokenSlug } = await testTokenOperations(client);
    
    // Test 4: TypeScript Wallet and Transfer Operations  
    const transferSuccess = await testWalletAndTransferOperations(client, tokenSlug);
    
    // Calculate final results
    const allTestsPassed = Object.values(results.tests).every((test: any) => test.passed);
    results.overallSuccess = allTestsPassed;
    results.serverCompatible = allTestsPassed;
    
    calculateNetworkStats();
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log(`\n❌ Fatal Error: ${errorMessage}`, Color.RED);
    results.overallSuccess = false;
    results.serverCompatible = false;
    results.fatalError = errorMessage;
  }
  
  const totalTime = Date.now() - startTime;
  results.totalExecutionTime = totalTime;
  
  // Save results and print summary
  saveResults();
  printSummary();
  
  log(`\n⏱️  Total execution time: ${totalTime}ms`, Color.GRAY);
  log(`🔧 TypeScript Benefits: Compile-time error prevention, enhanced IDE support`, Color.GRAY);
  
  // Exit with appropriate code
  const exitCode = results.overallSuccess ? 0 : 1;
  log(`\n${results.overallSuccess ? '✅' : '❌'} TypeScript Integration tests ${results.overallSuccess ? 'PASSED' : 'FAILED'}`, 
    results.overallSuccess ? Color.GREEN : Color.RED);
    
  process.exit(exitCode);
}

// Handle process termination gracefully with TypeScript types
process.on('SIGINT', () => {
  log('\n🛑 TypeScript integration tests interrupted', Color.YELLOW);
  results.overallSuccess = false;
  results.interrupted = true;
  saveResults();
  process.exit(1);
});

process.on('SIGTERM', () => {
  log('\n🛑 TypeScript integration tests terminated', Color.YELLOW);
  results.overallSuccess = false;
  results.terminated = true;
  saveResults();
  process.exit(1);
});

// Run TypeScript integration tests with full type safety
runIntegrationTests().catch((error: Error) => {
  console.error(`\n❌ Unhandled TypeScript Error: ${error.message}`, error);
  process.exit(1);
});