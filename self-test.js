#!/usr/bin/env tsx
"use strict";
/**
 * Knish.IO TypeScript SDK Self-Test Script
 *
 * This script performs self-contained tests to validate SDK functionality
 * and ensure cross-SDK compatibility. It reads test configurations from a
 * shared JSON file and outputs results in a standardized format.
 *
 * Mirrors the JavaScript SDK self-test structure for consistency.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const url_1 = require("url");
// Import TypeScript SDK components following JavaScript SDK pattern exactly
const index_js_1 = require("./dist/index.js");
// Get directory path
const __filename = (0, url_1.fileURLToPath)(import.meta.url);
const __dirname = path.dirname(__filename);
// Fixed timestamp for deterministic testing (preserves timestamp in hash while ensuring consistency)
const FIXED_TEST_TIMESTAMP_BASE = 1700000000000; // Fixed base timestamp for deterministic testing
// Helper function to set fixed timestamps for deterministic testing
function setFixedTimestamps(molecule) {
    for (let i = 0; i < molecule.atoms.length; i++) {
        // Set deterministic timestamp: base + (index * 1000) to ensure unique but predictable timestamps
        molecule.atoms[i].createdAt = String(FIXED_TEST_TIMESTAMP_BASE + (i * 1000));
    }
}
// Helper function to create fixed remainder wallets for deterministic testing
function createFixedRemainderWallet(secret, token) {
    return new index_js_1.Wallet({
        secret: secret,
        token: token,
        position: 'bbbb000000000000cccc111111111111dddd222222222222eeee333333333333', // Fixed deterministic position
        bundle: (0, index_js_1.generateBundleHash)(secret)
    });
}
// Embedded test configuration for SDK self-containment (TypeScript best practices)
const DEFAULT_CONFIG = {
    tests: {
        crypto: {
            seed: "TESTSEED",
            secret: "e8ffc86d60fc6a73234a834166e7436e21df6c3209dfacc8d0bd6595707872c3799abbf7deee0f9c4b58de1fd89b9abb67a207558208d5ccf550c227d197c24e9fcc3707aeb53c4031d38392020ff72bcaa0f728aa8bc3d47d95ff0afc04d8fcdb69bff638ce56646c154fc92aa517d3c40f550d2ccacbd921724e1d94b82aed2c8e172a8a7ed5a6963f5890157fe77222b97af3787741f9d3cec0b40aec6f07ae4b2b24614f0a20e035aee0df04e176175dc100eb1b00dd7ea95c28cdec47958336945333c3bef24719ed949fa56d1541f24c725d4f374a533bf255cf22f4596147bcd1ba05abcecbe9b12095e1fdddb094616894c366498be0b5785c180100efb3c5b689fc1c01131633fe1775df52a970e9472ab7bc0c19f5742b9e9436753cd16024b2d326b763eca68c414755a0d2fdbb927f007e9413f1190578b2033a03d29387f5aea71b07a5ce80fbfd45be4a15440faadeac50e41846022894fc683a52328b470bc1860c8b038d7258f504178918502b93d84d8b0fbef3e02f89f83cb1ff033a2bdbdf2a2ba78d80c12aa8b2d6c10d76c468186bd4a4e9eacc758546bb50ed7b1ee241cc5b93ff924c7bbee6778b27789e1f9104c917fc93f735eee5b25c07a883788f3d2e0771e751c4f59b76f8426027ac2b07a2ca84534433d0a1b86cef3288e7d79e8b175a3955848cfd1dfbdcd6b5bafcf6789e56e8ef40af",
            bundle: "fee9c2b9a964d060eb4645c4001db805c3c4b0cc9bba12841036eba4bf44b831",
            walletAddress: "Kk4xBpejTujcDQxuuUNVEcvvRNwRGMfLFm28p1aqv2wQ52u5X"
        },
        metaCreation: {
            seed: "TESTSEED",
            token: "USER",
            sourcePosition: "0123456789abcdeffedcba9876543210fedcba9876543210fedcba9876543210",
            metaType: "TestMeta",
            metaId: "TESTMETA123",
            metadata: {
                name: "Test Metadata",
                description: "This is a test metadata for SDK testing."
            },
            expectedMolecularHash: "046778a3g7d26de4145d33de70b48d70a2e3e1b0f2gadg398a0711g3263761a2"
        },
        simpleTransfer: {
            sourceSeed: "TESTSEED",
            recipientSeed: "RECIPIENTSEED",
            balance: 1000,
            amount: 1000,
            token: "TEST",
            sourcePosition: "0123456789abcdeffedcba9876543210fedcba9876543210fedcba9876543210",
            recipientPosition: "fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210",
            expectedMolecularHash: "00bd586e56gbg38737c4gd463e3fb39cdbb013fg8a851baa962c66g0d1cadce5"
        },
        complexTransfer: {
            sourceSeed: "TESTSEED",
            recipient1Seed: "RECIPIENTSEED",
            recipient2Seed: "RECIPIENT2SEED",
            sourceBalance: 1000,
            amount1: 500,
            amount2: 500,
            token: "TEST",
            sourcePosition: "0123456789abcdeffedcba9876543210fedcba9876543210fedcba9876543210",
            recipient1Position: "fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210",
            recipient2Position: "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789",
            expectedMolecularHash: "034f6f8d01c9f20c8a9a64a5742ca755b53a917461c8e870de8622ca4a2b37ge"
        },
        mlkem768: {
            seed: "TESTSEED",
            token: "ENCRYPT",
            position: "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
            plaintext: "Hello ML-KEM768 cross-platform test message!"
        }
    }
};
// Support optional external config override for flexibility
const configPath = process.env.KNISHIO_TEST_CONFIG;
const config = (configPath && fs.existsSync(configPath))
    ? JSON.parse(fs.readFileSync(configPath, 'utf8'))
    : DEFAULT_CONFIG;
// Configurable shared results directory for cross-platform testing
const sharedResultsDir = process.env.KNISHIO_SHARED_RESULTS ||
    path.resolve(__dirname, '../shared-test-results');
const results = {
    sdk: 'TypeScript',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    tests: {},
    molecules: {},
    crossSdkCompatible: true
};
// Color output helpers
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m'
};
function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}
function logTest(testName, passed, errorDetail) {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    const color = passed ? 'green' : 'red';
    log(`  ${status}: ${testName}`, color);
    if (!passed && errorDetail) {
        log(`    ${errorDetail}`, 'red');
    }
}
/**
 * Debug utility to inspect molecule structure
 */
function inspectMolecule(molecule, name = 'molecule') {
    log(`\n🔍 INSPECTING ${name.toUpperCase()}:`, 'blue');
    log(`  Molecular Hash: ${molecule.molecularHash || 'NOT_SET'}`);
    log(`  Secret: ${molecule.secret ? 'SET (length: ' + molecule.secret.length + ')' : 'NOT_SET'}`);
    log(`  Bundle: ${molecule.bundle || 'NOT_SET'}`);
    log(`  Source Wallet: ${molecule.sourceWallet ? molecule.sourceWallet.address.substring(0, 16) + '...' : 'NOT_SET'}`);
    log(`  Remainder Wallet: ${molecule.remainderWallet ? molecule.remainderWallet.address.substring(0, 16) + '...' : 'NOT_SET'}`);
    log(`  Atoms (${molecule.atoms.length}):`);
    let totalValue = 0;
    molecule.atoms.forEach((atom, index) => {
        const value = parseFloat(atom.value) || 0;
        totalValue += value;
        log(`    [${index}] ${atom.isotope}: ${atom.value} (${atom.walletAddress.substring(0, 16)}...) index=${atom.index}`);
    });
    log(`  Total Value: ${totalValue} ${totalValue === 0 ? '✅ BALANCED' : '❌ UNBALANCED'}`);
    log(`  Cell Slug: ${molecule.cellSlug || 'NOT_SET'}`);
    log(`  Status: ${molecule.status || 'NOT_SET'}`);
}
/**
 * Step-by-step validation diagnostic
 */
function diagnoseValidation(molecule, senderWallet, name = 'molecule') {
    log(`\n🔬 VALIDATING ${name.toUpperCase()} STEP-BY-STEP:`, 'blue');
    try {
        log(`  Molecule has ${molecule.atoms.length} atoms`);
        log(`  First atom isotope: ${molecule.atoms[0].isotope}`);
        log(`  Molecular hash present: ${!!molecule.molecularHash}`);
        log(`  Source wallet provided: ${!!senderWallet}`);
        // Check for common issues
        if (!molecule.molecularHash) {
            log(`    ❌ Missing molecular hash`, 'red');
        }
        if (molecule.atoms.length === 0) {
            log(`    ❌ No atoms in molecule`, 'red');
        }
        // Check atom indices
        for (let i = 0; i < molecule.atoms.length; i++) {
            const atom = molecule.atoms[i];
            if (atom.index === null || atom.index === undefined) {
                log(`    ❌ Atom ${i} has null/undefined index`, 'red');
            }
            else {
                log(`    ✅ Atom ${i} index: ${atom.index}`, 'green');
            }
        }
        // Try basic validation with error catching
        try {
            const result = molecule.check(senderWallet);
            log(`  Basic validation result: ${result}`, result ? 'green' : 'red');
        }
        catch (validationError) {
            log(`  Basic validation error: ${validationError.message}`, 'red');
        }
    }
    catch (error) {
        log(`  ❌ Diagnostic error: ${error.message}`, 'red');
    }
}
/**
 * Test 1: Crypto Test
 * Validates that SDK generates correct secrets and bundle hashes
 */
async function testCrypto() {
    log('\n1. Crypto Test', 'blue');
    const testConfig = config.tests.crypto;
    try {
        // Generate secret from seed
        const secret = (0, index_js_1.generateSecret)(testConfig.seed);
        const secretMatch = secret === testConfig.secret;
        logTest(`Secret generation (seed: "${testConfig.seed}")`, secretMatch);
        // Generate bundle hash from secret
        const bundle = (0, index_js_1.generateBundleHash)(secret);
        const bundleMatch = bundle === testConfig.bundle;
        logTest(`Bundle hash generation`, bundleMatch);
        results.tests.crypto = {
            passed: secretMatch && bundleMatch,
            secret: secret,
            bundle: bundle,
            expectedSecret: testConfig.secret,
            expectedBundle: testConfig.bundle
        };
        return secretMatch && bundleMatch;
    }
    catch (error) {
        log(`  ❌ ERROR: ${error.message}`, 'red');
        results.tests.crypto = {
            passed: false,
            error: error.message
        };
        return false;
    }
}
/**
 * Test 2: Metadata Creation Test
 * Creates and validates a metadata molecule
 */
async function testMetaCreation() {
    log('\n2. Metadata Creation Test', 'blue');
    const testConfig = config.tests.metaCreation;
    try {
        // Generate secret and create signing wallet
        const secret = (0, index_js_1.generateSecret)(testConfig.seed);
        const bundle = (0, index_js_1.generateBundleHash)(secret);
        const sourceWallet = new index_js_1.Wallet({
            secret: secret,
            token: testConfig.token,
            position: testConfig.sourcePosition
        });
        logTest('Source wallet creation', true);
        // Create fixed remainder wallet for deterministic testing
        const remainderWallet = createFixedRemainderWallet(secret, testConfig.token);
        // Create molecule instance with fixed remainder wallet
        const molecule = new index_js_1.Molecule({
            secret: secret,
            bundle: bundle,
            sourceWallet: sourceWallet,
            remainderWallet: remainderWallet
        });
        // Convert metadata object to array format, then to metaObject
        const metaObject = {};
        const metas = testConfig.metadata ?
            Object.entries(testConfig.metadata).map(([key, value]) => ({ key, value })) :
            [];
        metas.forEach(m => {
            metaObject[m.key] = m.value;
        });
        // Initialize metadata molecule
        molecule.initMeta({
            metaType: testConfig.metaType,
            metaId: testConfig.metaId,
            meta: metaObject
        });
        logTest('Metadata molecule initialization', true);
        // Set fixed timestamps for deterministic testing (before signing)
        setFixedTimestamps(molecule);
        // Sign the molecule
        molecule.sign({});
        logTest('Molecule signing', true);
        // Debug: Inspect molecule before validation
        inspectMolecule(molecule, 'metadata molecule');
        // Step-by-step validation diagnostic
        diagnoseValidation(molecule, sourceWallet, 'metadata molecule');
        // Validate the molecule with detailed error capture
        let isValid = false;
        let validationError = null;
        try {
            isValid = molecule.check(sourceWallet);
            if (!isValid) {
                validationError = 'Validation returned false (no exception thrown)';
            }
        }
        catch (error) {
            isValid = false;
            validationError = error.message;
        }
        logTest('Molecule validation', isValid, validationError);
        // Store serialized molecule for cross-SDK verification using centralized method
        results.molecules.metadata = JSON.stringify(molecule.toJSON());
        results.tests.metaCreation = {
            passed: isValid,
            molecularHash: molecule.molecularHash,
            atomCount: molecule.atoms.length,
            validationError: validationError
        };
        return isValid;
    }
    catch (error) {
        log(`  ❌ ERROR: ${error.message}`, 'red');
        results.tests.metaCreation = {
            passed: false,
            error: error.message
        };
        return false;
    }
}
/**
 * Test 3: Simple Transfer Test
 * Creates a value transfer with no remainder
 */
async function testSimpleTransfer() {
    log('\n3. Simple Transfer Test', 'blue');
    const testConfig = config.tests.simpleTransfer;
    try {
        // Create source wallet for value transfer
        const sourceSecret = (0, index_js_1.generateSecret)(testConfig.sourceSeed);
        const sourceBundle = (0, index_js_1.generateBundleHash)(sourceSecret);
        const sourceWallet = new index_js_1.Wallet({
            secret: sourceSecret,
            token: testConfig.token,
            position: testConfig.sourcePosition
        });
        // Set balance manually for testing
        sourceWallet.balance = testConfig.balance;
        logTest('Source wallet creation', true);
        // Create recipient wallet
        const recipientSecret = (0, index_js_1.generateSecret)(testConfig.recipientSeed);
        const recipientWallet = new index_js_1.Wallet({
            secret: recipientSecret,
            token: testConfig.token,
            position: testConfig.recipientPosition
        });
        logTest('Recipient wallet creation', true);
        // Create fixed remainder wallet for deterministic testing
        const remainderWallet = createFixedRemainderWallet(sourceSecret, testConfig.token);
        // Create molecule for value transfer with fixed remainder wallet
        const molecule = new index_js_1.Molecule({
            secret: sourceSecret,
            bundle: sourceBundle,
            sourceWallet: sourceWallet,
            remainderWallet: remainderWallet
        });
        // Initialize value transfer
        molecule.initValue({
            recipientWallet: recipientWallet,
            amount: testConfig.amount
        });
        logTest('Value transfer initialization', true);
        // Set fixed timestamps for deterministic testing (before signing)
        setFixedTimestamps(molecule);
        // Sign the molecule
        molecule.sign({});
        logTest('Molecule signing', true);
        // Debug: Inspect molecule before validation
        inspectMolecule(molecule, 'simple transfer molecule');
        // Validate the molecule with detailed error capture
        let isValid = false;
        let validationError = null;
        try {
            isValid = molecule.check(sourceWallet);
            if (!isValid) {
                validationError = 'Validation returned false (no exception thrown)';
            }
        }
        catch (error) {
            isValid = false;
            validationError = error.message;
        }
        logTest('Molecule validation', isValid, validationError);
        // Store serialized molecule for cross-SDK verification using centralized method
        results.molecules.simpleTransfer = JSON.stringify(molecule.toJSON());
        results.tests.simpleTransfer = {
            passed: isValid,
            molecularHash: molecule.molecularHash,
            atomCount: molecule.atoms.length,
            validationError: validationError
        };
        return isValid;
    }
    catch (error) {
        log(`  ❌ ERROR: ${error.message}`, 'red');
        results.tests.simpleTransfer = {
            passed: false,
            error: error.message
        };
        return false;
    }
}
/**
 * Test 4: Complex Transfer Test
 * Creates a value transfer with remainder
 */
async function testComplexTransfer() {
    log('\n4. Complex Transfer Test', 'blue');
    const testConfig = config.tests.complexTransfer;
    try {
        // Create source wallet for value transfer
        const sourceSecret = (0, index_js_1.generateSecret)(testConfig.sourceSeed);
        const sourceBundle = (0, index_js_1.generateBundleHash)(sourceSecret);
        const sourceWallet = new index_js_1.Wallet({
            secret: sourceSecret,
            token: testConfig.token,
            position: testConfig.sourcePosition
        });
        // Set balance manually for testing  
        sourceWallet.balance = testConfig.sourceBalance;
        logTest('Source wallet creation', true);
        // Create fixed remainder wallet for deterministic testing
        const remainderWallet = createFixedRemainderWallet(sourceSecret, testConfig.token);
        logTest('Remainder wallet creation', true);
        // Create first recipient wallet
        const recipientSecret = (0, index_js_1.generateSecret)(testConfig.recipient1Seed);
        const recipientWallet = new index_js_1.Wallet({
            secret: recipientSecret,
            token: testConfig.token,
            position: testConfig.recipient1Position
        });
        logTest('Recipient wallet creation', true);
        // Create molecule for value transfer with remainder
        const molecule = new index_js_1.Molecule({
            secret: sourceSecret,
            bundle: sourceBundle,
            sourceWallet: sourceWallet,
            remainderWallet: remainderWallet
        });
        // Initialize value transfer with remainder
        molecule.initValue({
            recipientWallet: recipientWallet,
            amount: testConfig.amount1
        });
        logTest('Value transfer with remainder initialization', true);
        // Set fixed timestamps for deterministic testing (before signing)
        setFixedTimestamps(molecule);
        // Sign the molecule
        molecule.sign({});
        logTest('Molecule signing', true);
        // Debug: Inspect molecule before validation
        inspectMolecule(molecule, 'complex transfer molecule');
        // Step-by-step validation diagnostic
        diagnoseValidation(molecule, sourceWallet, 'complex transfer molecule');
        // Validate the molecule with detailed error capture
        let isValid = false;
        let validationError = null;
        try {
            isValid = molecule.check(sourceWallet);
            if (!isValid) {
                validationError = 'Validation returned false (no exception thrown)';
            }
        }
        catch (error) {
            isValid = false;
            validationError = error.message;
        }
        logTest('Molecule validation', isValid, validationError);
        // Store serialized molecule for cross-SDK verification using centralized method
        results.molecules.complexTransfer = JSON.stringify(molecule.toJSON());
        results.tests.complexTransfer = {
            passed: isValid,
            molecularHash: molecule.molecularHash,
            atomCount: molecule.atoms.length,
            hasRemainder: true,
            validationError: validationError
        };
        return isValid;
    }
    catch (error) {
        log(`  ❌ ERROR: ${error.message}`, 'red');
        results.tests.complexTransfer = {
            passed: false,
            error: error.message
        };
        return false;
    }
}
/**
 * Test 5: ML-KEM768 Encryption Test
 * Tests post-quantum encryption/decryption compatibility
 */
async function testMLKEM768() {
    log('\n5. ML-KEM768 Encryption Test', 'blue');
    const testConfig = config.tests.mlkem768;
    try {
        // Create encryption wallet from seed
        const secret = (0, index_js_1.generateSecret)(testConfig.seed);
        const bundle = (0, index_js_1.generateBundleHash)(secret);
        const encryptionWallet = new index_js_1.Wallet({
            secret: secret,
            token: testConfig.token,
            position: testConfig.position
        });
        logTest('Encryption wallet creation', true);
        // Get ML-KEM768 public key (non-deterministic)
        const publicKey = encryptionWallet.pubkey;
        logTest('ML-KEM768 public key generation', !!publicKey);
        // Encrypt plaintext message for ourselves (non-deterministic)
        const encryptedData = await encryptionWallet.encryptMessage(testConfig.plaintext, publicKey);
        const encryptionSuccess = !!(encryptedData && encryptedData.cipherText && encryptedData.encryptedMessage);
        logTest('Message encryption (self-encryption)', encryptionSuccess);
        // Decrypt the encrypted message
        const decryptedMessage = await encryptionWallet.decryptMessage(encryptedData);
        const decryptionSuccess = decryptedMessage === testConfig.plaintext;
        logTest('Message decryption and verification', decryptionSuccess);
        const testPassed = !!publicKey && encryptionSuccess && decryptionSuccess;
        // Store ML-KEM768 data for cross-SDK verification (non-deterministic outputs)
        results.molecules.mlkem768 = JSON.stringify({
            publicKey: publicKey,
            encryptedData: encryptedData,
            originalPlaintext: testConfig.plaintext,
            sdk: 'TypeScript'
        });
        results.tests.mlkem768 = {
            passed: testPassed,
            publicKeyGenerated: !!publicKey,
            encryptionSuccess: encryptionSuccess,
            decryptionSuccess: decryptionSuccess,
            plaintextLength: testConfig.plaintext.length
        };
        return testPassed;
    }
    catch (error) {
        log(`  ❌ ERROR: ${error.message}`, 'red');
        results.tests.mlkem768 = {
            passed: false,
            error: error.message
        };
        return false;
    }
}
/**
 * Negative Test Cases - Anti-Cheating Validation
 * Tests that validation properly fails for invalid molecules
 */
async function testNegativeCases() {
    log('\n6. Negative Test Cases (Anti-Cheating)', 'blue');
    const testConfig = config.tests.crypto;
    let allNegativeTestsPassed = true;
    try {
        const secret = (0, index_js_1.generateSecret)(testConfig.seed);
        const bundle = (0, index_js_1.generateBundleHash)(secret);
        const sourceWallet = new index_js_1.Wallet({
            secret: secret,
            token: 'TEST',
            position: '0123456789abcdeffedcba9876543210fedcba9876543210fedcba9876543210'
        });
        sourceWallet.balance = 1000;
        // Test 1: Missing Molecular Hash (should fail)
        try {
            const invalidMolecule = new index_js_1.Molecule({
                secret: secret,
                bundle: bundle,
                sourceWallet: sourceWallet
            });
            // Add a valid atom but don't sign (no molecular hash)
            invalidMolecule.addAtom(new index_js_1.Atom({
                isotope: 'V',
                wallet: sourceWallet,
                value: -100
            }));
            // This should fail because there's no molecular hash
            const shouldFail = invalidMolecule.check(sourceWallet);
            if (shouldFail) {
                logTest('Missing molecular hash validation (should FAIL)', false, 'Invalid molecule passed validation');
                allNegativeTestsPassed = false;
            }
            else {
                logTest('Missing molecular hash validation (should FAIL)', true);
            }
        }
        catch (error) {
            // Exception is expected for missing molecular hash
            logTest('Missing molecular hash validation (should FAIL)', true);
        }
        // Test 2: Invalid Molecular Hash (should fail)
        try {
            const invalidMolecule = new index_js_1.Molecule({
                secret: secret,
                bundle: bundle,
                sourceWallet: sourceWallet
            });
            invalidMolecule.addAtom(new index_js_1.Atom({
                isotope: 'V',
                wallet: sourceWallet,
                value: -100
            }));
            // Sign normally
            invalidMolecule.sign({});
            // Then corrupt the molecular hash
            invalidMolecule.molecularHash = 'invalid_hash_that_should_fail_validation_check_12345678';
            const shouldFail = invalidMolecule.check(sourceWallet);
            if (shouldFail) {
                logTest('Invalid molecular hash validation (should FAIL)', false, 'Corrupted molecule passed validation');
                allNegativeTestsPassed = false;
            }
            else {
                logTest('Invalid molecular hash validation (should FAIL)', true);
            }
        }
        catch (error) {
            // Exception is expected for invalid molecular hash
            logTest('Invalid molecular hash validation (should FAIL)', true);
        }
        // Test 3: Unbalanced Transfer (should fail)
        try {
            const invalidMolecule = new index_js_1.Molecule({
                secret: secret,
                bundle: bundle,
                sourceWallet: sourceWallet
            });
            // Create unbalanced atoms (doesn't sum to zero)
            invalidMolecule.addAtom(new index_js_1.Atom({
                isotope: 'V',
                wallet: sourceWallet,
                value: -1000 // Debit full balance
            }));
            invalidMolecule.addAtom(new index_js_1.Atom({
                isotope: 'V',
                wallet: sourceWallet,
                value: 500 // Credit only half - unbalanced!
            }));
            invalidMolecule.sign({});
            const shouldFail = invalidMolecule.check(sourceWallet);
            if (shouldFail) {
                logTest('Unbalanced transfer validation (should FAIL)', false, 'Unbalanced molecule passed validation');
                allNegativeTestsPassed = false;
            }
            else {
                logTest('Unbalanced transfer validation (should FAIL)', true);
            }
        }
        catch (error) {
            // Exception is expected for unbalanced transfers
            logTest('Unbalanced transfer validation (should FAIL)', true);
        }
        results.tests.negativeCases = {
            passed: allNegativeTestsPassed,
            description: 'Anti-cheating validation tests',
            testCount: 3
        };
        return allNegativeTestsPassed;
    }
    catch (error) {
        log(`  ❌ ERROR: ${error.message}`, 'red');
        results.tests.negativeCases = {
            passed: false,
            error: error.message
        };
        return false;
    }
}
/**
 * Cross-SDK Validation
 * Loads and validates molecules from other SDKs (if available)
 */
async function testCrossSdkValidation() {
    log('\n7. Cross-SDK Validation', 'blue');
    // Check if cross-validation is disabled (Round 1 molecule generation only)
    if (process.env.KNISHIO_DISABLE_CROSS_VALIDATION === 'true') {
        log('  ⏭️  Cross-validation disabled for Round 1 (molecule generation only)', 'yellow');
        return true;
    }
    const resultsDir = sharedResultsDir;
    if (!fs.existsSync(resultsDir)) {
        log('  ⏭️  No other SDK results found for cross-validation', 'yellow');
        return true;
    }
    const resultFiles = fs.readdirSync(resultsDir).filter(f => f.endsWith('.json') &&
        !f.includes('typescript'));
    if (resultFiles.length === 0) {
        log('  ⏭️  No other SDK results found for cross-validation', 'yellow');
        return true;
    }
    let allValid = true;
    for (const file of resultFiles) {
        const sdkName = file.replace('-results.json', '');
        const otherResults = JSON.parse(fs.readFileSync(path.join(resultsDir, file), 'utf8'));
        // Validate molecules from other SDK using centralized methods
        for (const [moleculeType, moleculeData] of Object.entries(otherResults.molecules || {})) {
            try {
                if (moleculeType === 'mlkem768') {
                    // Special handling for ML-KEM768 cross-SDK compatibility
                    const mlkemData = JSON.parse(moleculeData);
                    // Create our own encryption wallet using the same configuration
                    const testConfig = config.tests.mlkem768;
                    const secret = (0, index_js_1.generateSecret)(testConfig.seed);
                    const ourWallet = new index_js_1.Wallet({
                        secret: secret,
                        token: testConfig.token,
                        position: testConfig.position
                    });
                    let mlkemValid = false;
                    try {
                        // Test: Can we encrypt a message for their public key?
                        const testMessage = "Cross-SDK ML-KEM768 compatibility test";
                        const encryptedForThem = await ourWallet.encryptMessage(testMessage, mlkemData.publicKey);
                        // If encryption succeeded, that means their public key format is compatible
                        mlkemValid = !!(encryptedForThem && encryptedForThem.cipherText && encryptedForThem.encryptedMessage);
                        if (mlkemValid) {
                            log(`    Successfully encrypted for ${sdkName} public key`, 'green');
                        }
                    }
                    catch (error) {
                        log(`    Failed to encrypt for ${sdkName}: ${error.message}`, 'red');
                        mlkemValid = false;
                    }
                    logTest(`${sdkName} ${moleculeType} encryption compatibility`, mlkemValid);
                    if (!mlkemValid) {
                        allValid = false;
                    }
                }
                else {
                    // Standard molecule validation for non-ML-KEM768 types
                    const molecule = index_js_1.Molecule.fromJSON(moleculeData, {
                        includeValidationContext: true,
                        validateStructure: true,
                        strictMode: false
                    });
                    // Get source wallet for validation
                    let sourceWallet = molecule.sourceWallet;
                    // Use the molecule's check() method for full validation
                    let isValid = false;
                    try {
                        isValid = molecule.check(sourceWallet);
                    }
                    catch (error) {
                        log(`    Validation error: ${error.message}`, 'red');
                        isValid = false;
                    }
                    logTest(`${sdkName} ${moleculeType} molecule validation`, isValid);
                    if (!isValid) {
                        allValid = false;
                    }
                }
            }
            catch (error) {
                logTest(`${sdkName} ${moleculeType} validation`, false);
                log(`    Error: ${error.message}`, 'red');
                allValid = false;
            }
        }
    }
    results.crossSdkCompatible = allValid;
    return allValid;
}
/**
 * Save test results to file
 */
function saveResults() {
    const resultsDir = sharedResultsDir;
    if (!fs.existsSync(resultsDir)) {
        fs.mkdirSync(resultsDir, { recursive: true });
    }
    const resultsFile = path.join(resultsDir, 'typescript-results.json');
    fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
    log(`\n📁 Results saved to: ${resultsFile}`, 'blue');
}
/**
 * Print summary report
 */
function printSummary() {
    log('\n═══════════════════════════════════════════', 'blue');
    log('            TEST SUMMARY REPORT', 'blue');
    log('═══════════════════════════════════════════', 'blue');
    const totalTests = Object.keys(results.tests).length;
    const passedTests = Object.values(results.tests).filter(t => t.passed).length;
    const failedTests = totalTests - passedTests;
    log(`\nSDK: ${results.sdk} v${results.version}`);
    log(`Timestamp: ${results.timestamp}`);
    log(`\nTests Passed: ${passedTests}/${totalTests}`, passedTests === totalTests ? 'green' : 'red');
    if (failedTests > 0) {
        log('\nFailed Tests:', 'red');
        for (const [testName, testResult] of Object.entries(results.tests)) {
            if (!testResult.passed) {
                log(`  - ${testName}: ${testResult.error || 'Validation failed'}`, 'red');
            }
        }
    }
    log(`\nCross-SDK Compatible: ${results.crossSdkCompatible ? '✅ YES' : '❌ NO'}`, results.crossSdkCompatible ? 'green' : 'red');
    log('\n═══════════════════════════════════════════', 'blue');
}
/**
 * Main test runner
 */
async function main() {
    try {
        // Check for cross-validation-only mode (Round 2)
        if (process.env.KNISHIO_CROSS_VALIDATION_ONLY === 'true') {
            log('═══════════════════════════════════════════', 'blue');
            log('    Knish.IO TypeScript SDK Cross-Validation Only', 'blue');
            log('═══════════════════════════════════════════', 'blue');
            // Only run cross-SDK validation
            const crossSdkPassed = await testCrossSdkValidation();
            // Save results and print summary (cross-validation only)
            saveResults();
            log('\n═══════════════════════════════════════════', 'blue');
            log('            CROSS-VALIDATION SUMMARY', 'blue');
            log('═══════════════════════════════════════════', 'blue');
            log(`Cross-SDK Compatible: ${results.crossSdkCompatible ? '✅ YES' : '❌ NO'}`, results.crossSdkCompatible ? 'green' : 'red');
            log('═══════════════════════════════════════════', 'blue');
            // Exit based on cross-validation results only
            process.exit(crossSdkPassed ? 0 : 1);
        }
        // Normal mode: Run all tests (Round 1 or standalone)
        log('═══════════════════════════════════════════', 'blue');
        log('    Knish.IO TypeScript SDK Self-Test', 'blue');
        log('═══════════════════════════════════════════', 'blue');
        // Run all tests
        const cryptoPassed = await testCrypto();
        const metaPassed = await testMetaCreation();
        const simplePassed = await testSimpleTransfer();
        const complexPassed = await testComplexTransfer();
        const mlkemPassed = await testMLKEM768();
        const negativePassed = await testNegativeCases();
        const crossSdkPassed = await testCrossSdkValidation();
        // All tests must pass for overall success
        const allPassed = cryptoPassed && metaPassed && simplePassed && complexPassed && mlkemPassed && negativePassed && crossSdkPassed;
        // Save results
        saveResults();
        // Print summary
        printSummary();
        // Exit with appropriate code
        process.exit(allPassed ? 0 : 1);
    }
    catch (error) {
        log(`\n💥 Fatal error: ${error.message}`, 'red');
        console.error(error.stack);
        process.exit(1);
    }
}
// Run the tests
main();
