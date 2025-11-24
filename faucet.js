import 'dotenv/config';
import fs from 'node:fs';
import path, { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { toBase64 } from '@cosmjs/encoding';
import { makeAuthInfoBytes, makeSignDoc } from '@cosmjs/proto-signing';
import { accountFromAny } from '@cosmjs/stargate';
import { secp256k1 } from '@noble/curves/secp256k1';
import { keccak_256 } from '@noble/hashes/sha3';
import { bech32 } from 'bech32';
import cors from 'cors';
import { MsgSend } from 'cosmjs-types/cosmos/bank/v1beta1/tx.js';
import { SignDoc, TxBody, TxRaw } from 'cosmjs-types/cosmos/tx/v1beta1/tx.js';
import { Any } from 'cosmjs-types/google/protobuf/any.js';
import { JsonRpcProvider, Wallet } from 'ethers';
import express from 'express';
import Long from 'long';
import fetch from 'node-fetch';
import { FrequencyChecker } from './checker.js';
import conf, {
  getCosmosAddress,
  getEvmAddress,
  getPrivateKey,
  getPrivateKeyBytes,
  getPublicKeyBytes,
  initializeSecureKeys,
} from './config.js';
import logRotation from './src/logRotation.js';

const app = express();
const chainConf = conf.blockchain;
const checker = new FrequencyChecker(conf);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      'https://faucet.cosmos-evm.com',
      'https://cosmos-evm.com',
      'https://faucet.basementnodes.ca',
      'https://devnet-faucet.fly.dev',
      'http://localhost:3000',
      'http://localhost:8088',
    ];

    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (process.env.NODE_ENV === 'development') return callback(null, true);

    const localNetworkPattern = /^https?:\/\/(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/;
    if (localNetworkPattern.test(origin)) return callback(null, true);
    if (origin.startsWith('http://localhost:') || origin.startsWith('https://localhost:')) {
      return callback(null, true);
    }

    callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  const staticPath = path.join(__dirname, 'dist');
  console.log('[STATIC] Serving static files from:', staticPath);
  app.use(express.static(staticPath, { maxAge: '1h' }));
}

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Detect address type (cosmos bech32 or EVM hex)
function detectAddressType(address) {
  if (!address) return 'unknown';

  // EVM hex address
  if (address.startsWith('0x') && address.length === 42) {
    const valid = /^0x[a-fA-F0-9]{40}$/.test(address);
    return valid ? 'evm' : 'unknown';
  }

  // Cosmos bech32 address
  if (address.startsWith(conf.blockchain.sender.option.prefix)) {
    try {
      bech32.decode(address);
      return 'cosmos';
    } catch {
      return 'unknown';
    }
  }

  return 'unknown';
}

// Convert hex address to Cosmos bech32
function _hexToCosmosAddress(hexAddress) {
  try {
    const addressBytes = Buffer.from(hexAddress.slice(2), 'hex');
    const words = bech32.toWords(addressBytes);
    return bech32.encode(conf.blockchain.sender.option.prefix, words);
  } catch (error) {
    console.error('Error converting hex to cosmos address:', error);
    return null;
  }
}

// Convert Cosmos bech32 to hex
function _cosmosAddressToHex(cosmosAddress) {
  try {
    const { words } = bech32.decode(cosmosAddress);
    const addressBytes = Buffer.from(bech32.fromWords(words));
    return `0x${addressBytes.toString('hex')}`;
  } catch (error) {
    console.error('Error converting cosmos to hex address:', error);
    return null;
  }
}

// Get account info from REST API
async function getAccountInfo(address) {
  try {
    const restEndpoint = chainConf.endpoints.rest_endpoint;
    const response = await fetch(`${restEndpoint}/cosmos/auth/v1beta1/accounts/${address}`);

    if (!response.ok) {
      if (response.status === 404) {
        console.log('Account not found, using default values');
        return { accountNumber: 0, sequence: 0 };
      }
      throw new Error(`Failed to get account info: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.account?.['@type']) {
      let accountInfo;

      if (data.account['@type'].includes('EthAccount')) {
        accountInfo = {
          accountNumber: Number.parseInt(data.account.base_account?.account_number || '0', 10),
          sequence: Number.parseInt(data.account.base_account?.sequence || '0', 10),
        };
      } else if (data.account['@type'].includes('BaseAccount')) {
        accountInfo = {
          accountNumber: Number.parseInt(data.account.account_number || '0', 10),
          sequence: Number.parseInt(data.account.sequence || '0', 10),
        };
      } else {
        try {
          const account = accountFromAny(data.account);
          accountInfo = { accountNumber: account.accountNumber, sequence: account.sequence };
        } catch {
          accountInfo = {
            accountNumber: Number.parseInt(
              data.account.account_number || data.account.base_account?.account_number || '0',
              10
            ),
            sequence: Number.parseInt(
              data.account.sequence || data.account.base_account?.sequence || '0',
              10
            ),
          };
        }
      }

      console.log('Account info parsed:', accountInfo);
      return accountInfo;
    }

    return { accountNumber: 0, sequence: 0 };
  } catch (error) {
    console.error('Error getting account info:', error);
    return { accountNumber: 0, sequence: 0 };
  }
}

// Create Cosmos transaction
async function createCosmosTransaction(
  fromAddress,
  toAddress,
  amounts,
  sequence,
  accountNumber,
  chainId
) {
  try {
    const msg = {
      typeUrl: '/cosmos.bank.v1beta1.MsgSend',
      value: MsgSend.fromPartial({
        fromAddress: fromAddress,
        toAddress: toAddress,
        amount: amounts,
      }),
    };

    const txBody = TxBody.fromPartial({
      messages: [
        Any.fromPartial({
          typeUrl: msg.typeUrl,
          value: MsgSend.encode(msg.value).finish(),
        }),
      ],
      memo: '',
    });

    const feeAmount = [
      {
        denom: chainConf.tx.fee.cosmos.amount[0].denom,
        amount: chainConf.tx.fee.cosmos.amount[0].amount,
      },
    ];

    const gasLimit = Long.fromString(chainConf.tx.fee.cosmos.gas);

    const pubkeyBytes = getPublicKeyBytes();
    const fieldTag = (1 << 3) | 2;
    const pubkeyProto = Buffer.concat([
      Buffer.from([fieldTag]),
      Buffer.from([pubkeyBytes.length]),
      pubkeyBytes,
    ]);

    const pubkey = Any.fromPartial({
      typeUrl: '/cosmos.evm.crypto.v1.ethsecp256k1.PubKey',
      value: pubkeyProto,
    });

    const authInfo = makeAuthInfoBytes(
      [{ pubkey, sequence: Long.fromNumber(sequence) }],
      feeAmount,
      gasLimit,
      undefined,
      undefined
    );

    const signDoc = makeSignDoc(
      TxBody.encode(txBody).finish(),
      authInfo,
      chainId,
      Long.fromNumber(accountNumber)
    );

    return { txBody, authInfo, signDoc };
  } catch (error) {
    console.error('Error creating Cosmos transaction:', error);
    throw error;
  }
}

// Config endpoint for web app
app.get('/config.json', (_req, res) => {
  res.json({
    project: conf.project,
    blockchain: {
      name: chainConf.name,
      endpoints: chainConf.endpoints,
      ids: chainConf.ids,
      sender: { option: { prefix: chainConf.sender.option.prefix } },
      limit: chainConf.limit,
    },
    tokens: chainConf.tx.amounts.map((token) => ({
      denom: token.denom,
      symbol: token.symbol || token.denom.toUpperCase(),
      name: token.name || token.denom,
      amount: token.amount,
      decimals: token.decimals,
      display_denom: token.display_denom || token.denom,
    })),
    sample: {
      cosmos: `${chainConf.sender.option.prefix}1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqnrql8a`,
      evm: '0x0000000000000000000000000000000000000001',
    },
    network: {
      name: chainConf.name,
      faucetAddresses: {
        cosmos: getCosmosAddress(),
        evm: getEvmAddress(),
      },
      evm: {
        chainId: chainConf.ids.chainId,
        chainIdHex: `0x${chainConf.ids.chainId.toString(16)}`,
        rpc: chainConf.endpoints.evm_endpoint,
        websocket: chainConf.endpoints.evm_websocket || '',
        explorer: chainConf.endpoints.evm_explorer,
      },
      cosmos: {
        chainId: chainConf.ids.cosmosChainId,
        rpc: chainConf.endpoints.rpc_endpoint,
        rest: chainConf.endpoints.rest_endpoint,
        prefix: chainConf.sender.option.prefix,
        explorer: chainConf.endpoints.cosmos_explorer,
      },
    },
  });
});

// Balance endpoint
app.get('/balance/:type', async (req, res) => {
  const type = req.params.type;
  const { address } = req.query;

  console.log(`[BALANCE] Request - Type: ${type}, Address: ${address || 'faucet wallet'}`);

  const balances = [];

  try {
    if (type === 'evm') {
      const targetAddress = address?.startsWith('0x') ? address : getEvmAddress();
      const ethProvider = new JsonRpcProvider(chainConf.endpoints.evm_endpoint);

      const nativeBalance = await ethProvider.getBalance(targetAddress);
      balances.push({
        denom: chainConf.tx.amounts[0]?.denom || 'native',
        amount: nativeBalance.toString(),
        type: 'native',
        decimals: 18,
      });
    } else if (type === 'cosmos') {
      const targetAddress = address?.startsWith(chainConf.sender.option.prefix)
        ? address
        : getCosmosAddress();

      const restEndpoint = chainConf.endpoints.rest_endpoint;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      try {
        const response = await fetch(
          `${restEndpoint}/cosmos/bank/v1beta1/balances/${targetAddress}`,
          { signal: controller.signal }
        );
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          if (data.balances && Array.isArray(data.balances)) {
            for (const balance of data.balances) {
              const token = chainConf.tx.amounts.find((t) => t.denom === balance.denom);
              balances.push({
                denom: balance.denom,
                amount: balance.amount,
                type: 'native',
                decimals: token?.decimals || 6,
              });
            }
          }
        }
      } catch (fetchError) {
        if (fetchError.name === 'AbortError') {
          console.error('Cosmos balance request timed out');
        } else {
          console.error('Cosmos balance fetch error:', fetchError);
        }
      }
    }
  } catch (err) {
    console.error('Balance fetch error:', err);
  }

  res.send({ balances, type });
});

// Main faucet endpoint
app.get('/send/:address', async (req, res) => {
  const { address } = req.params;
  const ip =
    req.headers['cf-connecting-ip'] ||
    req.headers['x-real-ip'] ||
    req.headers['X-Forwarded-For'] ||
    req.ip;

  console.log(`[FAUCET] Token request - Address: ${address}, IP: ${ip}`);

  if (!address) {
    res.send({ result: 'Address is required!' });
    return;
  }

  const addressType = detectAddressType(address);

  if (addressType === 'unknown') {
    res.send({
      result: `Address [${address}] is not supported. Must be a valid ${conf.blockchain.sender.option.prefix} address or hex address (0x...)`,
    });
    return;
  }

  try {
    const addressOk = await checker.checkAddress(address, 'dual');
    const ipOk = await checker.checkIp(`dual${ip}`, 'dual');

    if (!addressOk || !ipOk) {
      const addressLimitMsg = !addressOk
        ? `Address ${address} has reached the daily limit (${chainConf.limit.address} request per 24h).`
        : '';
      const ipLimitMsg = !ipOk
        ? `IP ${ip} has reached the daily limit (${chainConf.limit.ip} requests per 24h).`
        : '';

      res.send({
        result: {
          code: -2,
          message: 'Rate limit exceeded',
          details: [addressLimitMsg, ipLimitMsg].filter((msg) => msg).join(' '),
        },
      });
      return;
    }

    console.log('Processing faucet request for', address, 'type:', addressType);

    let txResult;

    if (addressType === 'evm') {
      txResult = await sendEvmNativeTokens(address);
    } else {
      txResult = await sendCosmosNativeTokens(address);
    }

    res.send({
      result: {
        code: 0,
        status: 'success',
        message: 'Tokens sent successfully!',
        ...txResult,
      },
    });
  } catch (error) {
    console.error('Faucet error:', error);
    res.send({
      result: {
        code: -1,
        message: error.message || 'Transaction failed',
        error: error.toString(),
      },
    });
  }
});

// Send native tokens via EVM (like ETH on Ethereum)
async function sendEvmNativeTokens(recipientAddress) {
  console.log('Sending native tokens via EVM to:', recipientAddress);

  const ethProvider = new JsonRpcProvider(chainConf.endpoints.evm_endpoint);
  const privateKey = getPrivateKey();
  const wallet = new Wallet(privateKey, ethProvider);

  const amount = BigInt(chainConf.tx.amounts[0]?.amount || '1000000000000000000');

  const faucetBalance = await ethProvider.getBalance(wallet.address);
  console.log(`Faucet balance: ${faucetBalance.toString()} wei`);
  console.log(`Sending amount: ${amount.toString()} wei`);

  if (faucetBalance < amount) {
    throw new Error(
      `Insufficient faucet balance. Has ${faucetBalance.toString()} wei, needs ${amount.toString()} wei`
    );
  }

  const tx = await wallet.sendTransaction({
    to: recipientAddress,
    value: amount,
  });

  console.log('Transaction sent:', tx.hash);
  const receipt = await tx.wait();
  console.log('Transaction confirmed!');

  return {
    network_type: 'evm',
    transaction_hash: receipt.hash,
    block_number: receipt.blockNumber,
    gas_used: receipt.gasUsed?.toString() || '0',
    from_address: receipt.from,
    to_address: receipt.to,
    amount: amount.toString(),
    explorer_url: `${chainConf.endpoints.evm_explorer}/tx/${receipt.hash}`,
  };
}

// Send native tokens via Cosmos
async function sendCosmosNativeTokens(recipientAddress) {
  console.log('Sending native tokens via Cosmos to:', recipientAddress);

  const fromAddress = getCosmosAddress();
  const accountInfo = await getAccountInfo(fromAddress);

  const amounts = chainConf.tx.amounts
    .map((token) => ({
      denom: token.denom,
      amount: token.amount,
    }))
    .sort((a, b) => a.denom.localeCompare(b.denom));

  console.log('Amounts to send:', amounts);

  const { txBody, authInfo, signDoc } = await createCosmosTransaction(
    fromAddress,
    recipientAddress,
    amounts,
    accountInfo.sequence,
    accountInfo.accountNumber,
    chainConf.ids.cosmosChainId
  );

  // Sign with eth_secp256k1 (Keccak256 hash)
  const privateKeyBytes = getPrivateKeyBytes();
  const signBytes = SignDoc.encode(signDoc).finish();
  const hashedMessage = Buffer.from(keccak_256(signBytes));

  const signatureResult = secp256k1.sign(hashedMessage, privateKeyBytes);
  const signatureBytes = Buffer.concat([
    Buffer.from(signatureResult.r.toString(16).padStart(64, '0'), 'hex'),
    Buffer.from(signatureResult.s.toString(16).padStart(64, '0'), 'hex'),
  ]);

  const txRaw = TxRaw.fromPartial({
    bodyBytes: TxBody.encode(txBody).finish(),
    authInfoBytes: authInfo,
    signatures: [signatureBytes],
  });

  const txBytes = TxRaw.encode(txRaw).finish();
  const txBase64 = toBase64(txBytes);

  // Broadcast
  const broadcastUrl = `${chainConf.endpoints.rest_endpoint}/cosmos/tx/v1beta1/txs`;
  const broadcastResponse = await fetch(broadcastUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tx_bytes: txBase64, mode: 'BROADCAST_MODE_SYNC' }),
  });

  if (!broadcastResponse.ok) {
    const errorData = await broadcastResponse.json();
    throw new Error(`Broadcast failed: ${JSON.stringify(errorData)}`);
  }

  const broadcastResult = await broadcastResponse.json();

  if (broadcastResult.tx_response && broadcastResult.tx_response.code !== 0) {
    throw new Error(
      `Transaction failed: ${broadcastResult.tx_response.raw_log || broadcastResult.tx_response.log}`
    );
  }

  const txHash = broadcastResult.tx_response.txhash;

  return {
    network_type: 'cosmos',
    transaction_hash: txHash,
    height: broadcastResult.tx_response.height || '0',
    gas_used: broadcastResult.tx_response.gas_used || '0',
    gas_wanted: broadcastResult.tx_response.gas_wanted || '0',
    explorer_url: `${chainConf.endpoints.cosmos_explorer}/tx/${txHash}`,
  };
}

// Test endpoint
app.get('/test', (_req, res) => {
  res.send({
    status: 'ok',
    evmAddress: getEvmAddress(),
    cosmosAddress: getCosmosAddress(),
  });
});

// Health check
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Initialize faucet
async function initializeFaucet() {
  console.log('[START] Faucet initializing...');

  await initializeSecureKeys();
  console.log(' SecureKeyManager initialized');
  console.log(` EVM Address: ${getEvmAddress()}`);
  console.log(` Cosmos Address: ${getCosmosAddress()}`);

  logRotation.registerLogFile('server.log', {
    maxSize: 5 * 1024 * 1024,
    maxFiles: 3,
    compress: false,
  });

  console.log(' Faucet server ready!');
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n Shutting down faucet...');
  logRotation.stopAll();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n Shutting down faucet...');
  logRotation.stopAll();
  process.exit(0);
});

// Error handling middleware
app.use((err, _req, res, _next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Catch-all for Vue Router
app.get('*', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    if (req.path.includes('.')) {
      res.status(404).send('Not found');
    } else {
      const indexPath = path.join(__dirname, 'dist', 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(500).send('Application build not found.');
      }
    }
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

// Start server
const HOST = process.env.HOST || '0.0.0.0';
app.listen(conf.port, HOST, async () => {
  console.log(`[START] Faucet server starting on ${HOST}:${conf.port}...`);
  await initializeFaucet();
  console.log(` Server listening on http://${HOST}:${conf.port}`);
});
