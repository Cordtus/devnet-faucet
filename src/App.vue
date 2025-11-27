<template>
  <div id="app" class="bg-black min-h-screen">
    <Toaster position="top-right" :theme="'dark'" richColors />
    <Header />
    <div class="mx-auto max-w-7xl px-3 sm:px-4 md:px-6 lg:px-8">
      <h1 class="font-semibold text-center text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-[80px] leading-[1.1] tracking-[-0.05em] mb-8 sm:mb-10 md:mb-12 mt-6 sm:mt-8 bg-[linear-gradient(260.47deg,#B4B4B4_48.52%,#FFFFFF_79.81%)] bg-clip-text text-transparent [-webkit-background-clip:text] [-webkit-text-fill-color:transparent] [text-shadow:0px_2px_3px_rgba(255,255,255,0.75)_inset,0px_1px_1px_rgba(255,255,255,1)_inset] px-2">
        REP FAUCET
      </h1>
      <!-- Wallet conflict warning -->
      <div v-if="showWalletWarning" class="alert alert-warning alert-dismissible fade show mb-4 sm:mb-6 mx-2 sm:mx-0" role="alert">
        <i class="fas fa-exclamation-triangle"></i>
        <strong>Multiple Wallet Extensions Detected</strong>
        <p class="mb-2 mt-2">You have multiple wallet extensions installed which may cause connection issues.</p>
        <p class="mb-0">For best results, disable all wallet extensions except the one you want to use (e.g., MetaMask).</p>
        <button type="button" class="btn-close" @click="showWalletWarning = false" aria-label="Close"></button>
      </div>
      <Tabs />

      <div class="w-full max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-8 sm:py-10 md:py-12 lg:py-16 xl:py-20">
        <div class="w-full max-w-6xl mx-auto">
          <DividerLine class="w-full h-auto" />
        </div>
      </div>

      <FAQs />
    </div>
    <Footer />
  </div>
</template>

<script setup>
import { onMounted, provide, ref } from 'vue';
import { Toaster } from 'vue-sonner';
import FAQs from './components/FAQs.vue';
import Footer from './components/Footer.vue';
import Header from './components/Header.vue';
import Tabs from './components/Tabs.vue';
import { useConfig } from './composables/useConfig';
import { useWalletStore } from './composables/useWalletStore';
import DividerLine from './svg/DividerLine.vue';

// Load configuration
const { config, loadConfig } = useConfig();
const walletStore = useWalletStore();

// Initialize Reown AppKit - use ref to make it reactive
const modal = ref(null);
const showWalletWarning = ref(false);

// Provide the modal ref immediately during setup
provide('appKitModal', modal);

// Also provide a simple open function
const openAppKitModal = () => {
  if (modal.value?.open) {
    modal.value.open();
  }
};
provide('openAppKitModal', openAppKitModal);

// Provide disconnect function
const disconnectAppKit = async () => {
  if (modal.value?.disconnect) {
    await modal.value.disconnect();
  }
};
provide('disconnectAppKit', disconnectAppKit);

onMounted(async () => {
  try {
    await loadConfig();
    if (config.value?.network) {
      console.log('Faucet configured for network:', config.value.network.evm.chainId);
    }
  } catch (error) {
    console.error('Failed to load config:', error);
    return;
  }

  if (config.value?.network) {
    // Dynamically import wallet modules
    let createAppKit, WagmiAdapter, defineChain;
    try {
      const appkitModule = await import('@reown/appkit/vue');
      const networksModule = await import('@reown/appkit/networks');
      const wagmiModule = await import('@reown/appkit-adapter-wagmi');
      createAppKit = appkitModule.createAppKit;
      defineChain = networksModule.defineChain;
      WagmiAdapter = wagmiModule.WagmiAdapter;
    } catch (importError) {
      console.error('Failed to load wallet modules:', importError);
      return;
    }

    const projectId = import.meta.env.VITE_REOWN_PROJECT_ID || '2f30532234e2903b2cf2505d144089ac';
    const chainId = config.value.network.evm.chainId;
    const rpcUrl = config.value.network.evm.rpc;
    const explorerUrl = config.value.network.evm.explorer || 'https://explorer.republicai.io';

    // Use defineChain to properly create custom network
    const customNetwork = defineChain({
      id: chainId,
      caipNetworkId: `eip155:${chainId}`,
      chainNamespace: 'eip155',
      name: 'Republic AI Devnet',
      nativeCurrency: {
        decimals: 18,
        name: 'RAI',
        symbol: 'RAI',
      },
      rpcUrls: {
        default: {
          http: [rpcUrl],
        },
      },
      blockExplorers: {
        default: {
          name: 'Explorer',
          url: explorerUrl,
        },
      },
      testnet: true,
    });

    const metadata = {
      name: 'Republic AI Devnet Faucet',
      description: 'Token distribution faucet for Republic AI Devnet',
      url: window.location.origin,
      icons: [`${window.location.origin}/favicon.svg`],
    };

    // Create Wagmi adapter
    const wagmiAdapter = new WagmiAdapter({
      networks: [customNetwork],
      projectId,
    });

    // Create AppKit modal
    try {
      // Check for multiple wallet providers
      if (window.ethereum?.providers && window.ethereum.providers.length > 1) {
        console.warn('Multiple wallet providers detected');
        showWalletWarning.value = true;
      }

      const appKitInstance = createAppKit({
        adapters: [wagmiAdapter],
        networks: [customNetwork],
        projectId,
        metadata,
        defaultNetwork: customNetwork,
        features: {
          analytics: false,
          email: false,
          socials: false,
          swaps: false,
          onramp: false,
        },
      });

      modal.value = appKitInstance;
      console.log('Wallet connector initialized');
    } catch (error) {
      console.error('Failed to create AppKit modal:', error);
    }

    // Subscribe to account changes
    if (modal.value) {
      let updateTimeout = null;
      const updateWalletState = (isConnected, address, chainId) => {
        clearTimeout(updateTimeout);
        updateTimeout = setTimeout(() => {
          if (isConnected && address) {
            walletStore.evmWallet.connected = true;
            walletStore.evmWallet.address = address;
            walletStore.evmWallet.chainId = chainId;
            console.log('EVM wallet connected:', address);
          } else {
            walletStore.evmWallet.connected = false;
            walletStore.evmWallet.address = null;
            walletStore.evmWallet.chainId = null;
          }
        }, 100);
      };

      if (modal.value.subscribeAccount) {
        modal.value.subscribeAccount((account) => {
          updateWalletState(account.isConnected, account.address, account.chainId);
        });
      }

      setTimeout(() => {
        if (modal.value?.getAccount) {
          const account = modal.value.getAccount();
          if (account?.isConnected && account.address) {
            updateWalletState(true, account.address, account.chainId);
          }
        }
      }, 500);
    }
  }
});
</script>

<style scoped>
/* Multiple wallet warning */
.alert-warning {
  background: rgba(255, 193, 7, 0.1);
  border: 2px solid #ffc107;
  color: var(--text-primary);
}

.alert-warning .alert-heading {
  color: #ffc107;
}

.alert-warning .btn-close {
  filter: invert(0.8);
}

/* Mobile responsive container */
@media (max-width: 768px) {
  .container {
    padding-left: 1rem;
    padding-right: 1rem;
  }
  
  .alert {
    font-size: 0.9rem;
    padding: 0.75rem 1rem;
  }
  
  .alert-heading {
    font-size: 1rem;
  }
}

@media (max-width: 480px) {
  .container {
    padding-left: 0.75rem;
    padding-right: 0.75rem;
  }
  
  .alert {
    font-size: 0.85rem;
    padding: 0.65rem 0.85rem;
  }
  
  .alert p {
    margin-bottom: 0.5rem !important;
  }
}
</style>