import { reactive } from 'vue';

const state = reactive({
  cosmosWallet: {
    connected: false,
    connecting: false,
    address: null,
    chainId: null,
  },
  evmWallet: {
    connected: false,
    connecting: false,
    address: null,
    chainId: null,
  },
});

export function useWalletStore() {
  const connectKeplr = async (networkConfig) => {
    // Check if on mobile
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (!window.keplr) {
      if (isMobile) {
        // On mobile, Keplr might be available after navigation from deep link
        // Wait a moment and check again
        await new Promise((resolve) => setTimeout(resolve, 500));
        if (!window.keplr) {
          console.log('Keplr not available on mobile');
          return;
        }
      } else {
        alert('Please install Keplr wallet extension');
        return;
      }
    }

    state.cosmosWallet.connecting = true;

    try {
      // Get prefix from network config
      const prefix = networkConfig?.cosmos?.prefix || 'republic';
      const chainId = networkConfig?.cosmos?.chainId || 'republic_77701-1';
      const chainName = networkConfig?.name || 'Republic Devnet';

      const chainConfig = {
        chainId: chainId,
        chainName: chainName,
        rpc: networkConfig?.cosmos?.rpc || 'https://rpc.republicai.io:26657',
        rest: networkConfig?.cosmos?.rest || 'https://rpc.republicai.io:1317',
        bip44: {
          coinType: 60,
        },
        bech32Config: {
          bech32PrefixAccAddr: prefix,
          bech32PrefixAccPub: `${prefix}pub`,
          bech32PrefixValAddr: `${prefix}valoper`,
          bech32PrefixValPub: `${prefix}valoperpub`,
          bech32PrefixConsAddr: `${prefix}valcons`,
          bech32PrefixConsPub: `${prefix}valconspub`,
        },
        currencies: [
          {
            coinDenom: 'RAI',
            coinMinimalDenom: 'arai',
            coinDecimals: 18,
          },
        ],
        feeCurrencies: [
          {
            coinDenom: 'RAI',
            coinMinimalDenom: 'arai',
            coinDecimals: 18,
            gasPriceStep: {
              low: 10000000000,
              average: 25000000000,
              high: 40000000000,
            },
          },
        ],
        stakeCurrency: {
          coinDenom: 'RAI',
          coinMinimalDenom: 'arai',
          coinDecimals: 18,
        },
        features: ['eth-address-gen', 'eth-key-sign'],
      };

      try {
        await window.keplr.experimentalSuggestChain(chainConfig);
      } catch (error) {
        console.warn('Failed to suggest chain, trying to connect anyway:', error);
      }

      await window.keplr.enable(chainConfig.chainId);

      const offlineSigner = window.keplr.getOfflineSigner(chainConfig.chainId);
      const accounts = await offlineSigner.getAccounts();

      if (accounts.length > 0) {
        state.cosmosWallet.connected = true;
        state.cosmosWallet.address = accounts[0].address;
        state.cosmosWallet.chainId = chainConfig.chainId;
      }
    } catch (error) {
      console.error('Error connecting to Keplr:', error);
      alert(`Failed to connect to Keplr: ${error.message}`);
    } finally {
      state.cosmosWallet.connecting = false;
    }
  };

  const disconnectKeplr = () => {
    state.cosmosWallet.connected = false;
    state.cosmosWallet.address = null;
    state.cosmosWallet.chainId = null;
  };

  const disconnectEvm = () => {
    state.evmWallet.connected = false;
    state.evmWallet.address = null;
    state.evmWallet.chainId = null;
  };

  return {
    cosmosWallet: state.cosmosWallet,
    evmWallet: state.evmWallet,
    connectKeplr,
    disconnectKeplr,
    disconnectEvm,
  };
}
