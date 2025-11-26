import { stringToPath } from '@cosmjs/crypto';
import secureKeyManager from './src/SecureKeyManager.js';

const config = {
  port: 8088,
  project: {
    name: 'Republic Devnet Faucet',
    logo: '',
    deployer: '<a href="https://republicai.io">Republic AI</a>',
  },
  blockchain: {
    name: 'republic',
    type: 'DualEnvironment',
    ids: {
      chainId: 4231,
      cosmosChainId: 'republic_77701-1',
    },
    endpoints: {
      rpc_endpoint: 'https://rpc.republicai.io:26657',
      grpc_endpoint: 'rpc.republicai.io:9090',
      rest_endpoint: 'https://rpc.republicai.io:1317',
      evm_endpoint: 'https://rpc.republicai.io:8545',
      evm_websocket: 'wss://rpc.republicai.io:8546',
      evm_explorer: 'https://yaci-explorer.fly.dev',
      cosmos_explorer: 'https://yaci-explorer.fly.dev',
    },
    sender: {
      option: {
        hdPaths: [stringToPath("m/44'/60'/0'/0/0")],
        prefix: 'republic',
      },
    },
    tx: {
      // Native token configuration
      amounts: [
        {
          denom: 'arai',
          symbol: 'RAI',
          name: 'Republic AI',
          amount: '10000000000000000000', // Max 10 RAI (18 decimals) - actual sent = threshold - balance
          decimals: 18,
          display_denom: 'RAI',
        },
      ],
      fee: {
        cosmos: {
          amount: [{ amount: '5000', denom: 'arai' }],
          gas: '200000',
        },
        evm: {
          gasLimit: '21000',
          gasPrice: '20000000000',
        },
      },
    },
    // Balance threshold: only top up wallets below this amount (10 tokens with 18 decimals)
    balanceThreshold: '10000000000000000000',
  },
};

// Secure key management
export const initializeSecureKeys = async () => {
  await secureKeyManager.initialize({
    prefix: config.blockchain.sender.option.prefix,
  });

  const addresses = secureKeyManager.getAddresses();
  config.derivedAddresses = addresses;

  console.log('Secure keys initialized and cached in config');
};

export const getPrivateKey = () => secureKeyManager.getPrivateKeyHex();
export const getPrivateKeyBytes = () => secureKeyManager.getPrivateKeyBytes();
export const getPublicKeyBytes = () => secureKeyManager.getPublicKeyBytes();
export const getEvmAddress = () => secureKeyManager.getEvmAddress();
export const getCosmosAddress = () => secureKeyManager.getCosmosAddress();
export const getEvmPublicKey = () => secureKeyManager.getEvmPublicKey();

export const validateDerivedAddresses = (expectedAddresses) => {
  return secureKeyManager.validateAddresses(expectedAddresses);
};

export default config;
