import { stringToPath } from '@cosmjs/crypto';
import secureKeyManager from './src/SecureKeyManager.js';

const config = {
  port: 8088,
  db: {
    path: '.faucet/history.db',
  },
  project: {
    name: 'Devnet Faucet',
    logo: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/cosmoshub/images/atom.svg',
    deployer: '<a href="#">Your Project</a>',
  },
  blockchain: {
    name: 'devnet',
    type: 'DualEnvironment',
    ids: {
      chainId: 1234, // EVM chain ID
      cosmosChainId: 'chain-1', // Cosmos chain ID
    },
    endpoints: {
      rpc_endpoint: 'https://rpc.yourchain.com:26657',
      grpc_endpoint: 'rpc.yourchain.com:9090',
      rest_endpoint: 'https://rpc.yourchain.com:1317',
      evm_endpoint: 'https://rpc.yourchain.com:8545',
      evm_websocket: 'wss://rpc.yourchain.com:8546',
      evm_explorer: 'https://explorer.yourchain.com',
      cosmos_explorer: 'https://explorer.yourchain.com',
    },
    sender: {
      option: {
        hdPaths: [stringToPath("m/44'/60'/0'/0/0")],
        prefix: 'cosmos',
      },
    },
    tx: {
      // Native token configuration
      amounts: [
        {
          denom: 'utoken',
          symbol: 'TOKEN',
          name: 'Native Token',
          amount: '1000000000000000000', // 1 TOKEN (18 decimals)
          decimals: 18,
          display_denom: 'TOKEN',
        },
      ],
      fee: {
        cosmos: {
          amount: [{ amount: '5000', denom: 'utoken' }],
          gas: '200000',
        },
        evm: {
          gasLimit: '21000',
          gasPrice: '20000000000',
        },
      },
    },
    limit: {
      address: 1,
      ip: 10,
    },
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
