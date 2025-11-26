<template>
  <div class="relative z-[5] flex flex-row items-center justify-between bg-transparent w-full max-w-[1140px] mx-auto px-4 sm:px-6 lg:px-8 py-5">
    <div class="py-4 sm:py-6">
      <CompanyLogo className="h-auto w-24 sm:w-32" />
    </div>
    <div class="flex flex-row items-center gap-2">
      <Button 
        @click="evmWallet.connected ? handleEvmDisconnect() : handleEvmConnect()" 
        :disabled="evmWallet.connecting" 
        :class="evmWallet.connected 
          ? 'border cursor-pointer border-[#FF6E6E40] bg-gradient-to-r from-[#1A0D0D] to-[#0F0A0A] text-[#FF6E6E] hover:text-white hover:border-[#FF6E6E]' 
          : 'border cursor-pointer border-[#5E5E5E40] bg-gradient-to-r from-[#0D0F0F] to-[#0A0C0C] text-[#626C71] hover:text-white disabled:opacity-50'"
      >
      <i class="fab fa-ethereum"></i>
        <span v-if="evmWallet.connected">Disconnect</span>
        <span v-else-if="evmWallet.connecting">Connecting...</span>
        <span v-else>Connect Wallet</span>
      </Button>
    </div>
  </div>
</template>

<script setup>
import { computed, inject } from 'vue';
import { useConfig } from '../composables/useConfig';
import { useWalletStore } from '../composables/useWalletStore';
import CompanyLogo from '../svg/CompanyLogo.vue';
import { Button } from './ui/button';

const { cosmosWallet, evmWallet, connectKeplr, disconnectKeplr, disconnectEvm } = useWalletStore();

const { config } = useConfig();
const projectName = computed(() => config.value?.project?.name || 'Republic AI Faucet');
const version = '1.1.0';

const openAppKitModal = inject('openAppKitModal');
const disconnectAppKit = inject('disconnectAppKit');

const isMobile = () => {
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
};

const handleCosmosConnect = async () => {
  if (isMobile()) {
    // Check if we're in Keplr's in-app browser
    if (window.keplr) {
      // We're already in Keplr browser, just connect normally
      await connectKeplr(config.value?.network);
    } else {
      // For mobile, just provide clear instructions since chain might not be recognized
      const _isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
      const _isAndroid = /Android/i.test(navigator.userAgent);

      // Show instructions
      message.value = `
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 relative">
          <h6 class="text-blue-800 font-semibold mb-2 flex items-center">
            <i class="fas fa-mobile-alt mr-2"></i>Keplr Mobile Instructions
          </h6>
          <p class="text-blue-700 mb-3">To use your Keplr wallet:</p>
          
          <ol class="text-blue-700 mb-3 ml-4 list-decimal">
            <li>Open the Keplr app</li>
            <li>Select your wallet</li>
            <li>Copy your wallet address</li>
            <li>Return here and paste it in the wallet address field above</li>
          </ol>

          <div class="grid gap-2 mb-3">
            <button class="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors" onclick="navigator.clipboard.readText().then(text => {
              const input = document.querySelector('input[placeholder*=republic]');
              if (input && (text.startsWith('republic') || text.startsWith('0x'))) {
                input.value = text;
                input.dispatchEvent(new Event('input', { bubbles: true }));
              } else {
                alert('Please copy a valid wallet address first');
              }
            }).catch(() => alert('Please paste your address manually'))">
              <i class="fas fa-paste mr-2"></i>
              Paste Address from Clipboard
            </button>
          </div>

          <p class="text-blue-600 text-sm mb-0">
            <i class="fas fa-info-circle mr-1"></i>
            This devnet chain may not be listed in Keplr. Just copy your address manually.
          </p>
          
          <button type="button" class="absolute top-2 right-2 text-blue-800 hover:text-blue-900" aria-label="Close">&times;</button>
        </div>
      `;
    }
  } else {
    connectKeplr(config.value?.network);
  }
};

const handleEvmConnect = () => {
  // For both mobile and desktop, use the WalletConnect modal
  // which handles mobile wallets properly
  openModal();
};

const openModal = () => {
  if (openAppKitModal) {
    try {
      // Check for wallet conflicts before opening
      if (window.ethereum?.providers && window.ethereum.providers.length > 1) {
        console.warn('Multiple wallet providers detected:', window.ethereum.providers.length);
        // Still try to open - the user can select their preferred wallet
      }
      openAppKitModal();
    } catch (error) {
      console.error('Error opening modal:', error);
      // Provide more helpful error message
      if (error.message?.includes('providers')) {
        alert(
          'Multiple wallet extensions detected. Please disable all but one wallet extension and try again.'
        );
      } else {
        alert('Failed to open wallet connection dialog. Please refresh the page and try again.');
      }
    }
  } else {
    alert('Wallet connection is initializing. Please try again in a moment.');
  }
};

const handleEvmDisconnect = async () => {
  if (disconnectAppKit) {
    await disconnectAppKit();
  }
  disconnectEvm();
};
</script>
