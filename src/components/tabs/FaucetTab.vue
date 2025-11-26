<template>
  <div>
    <div class="border relative border-[#5E5E5E40] rounded-lg bg-linear-to-r from-[#0D0F0F] to-[#0A0C0C] p-8 space-y-6">
      <!-- top-left glowing line (placed in wrapper, not clipped) -->
        <div class="absolute -top-px left-[20%] w-[25%] h-px bg-[linear-gradient(-90deg,rgba(0,255,77,0)_0%,#30FF6E_49.23%,#FFFFFF_100%)]"></div>
        <!-- top-left dot (moved above the clipped edge, fully visible) -->
        <div class="absolute -top-0.5 left-[20%] w-1 h-1 z-10 bg-[#C8FFD8]"></div>

        <div class="space-y-1">
          <p class="text-xl font-medium text-white">
            {{evmWallet.connected ? "Wallet Connected" : "Connect browser wallet"}}
          </p>
          <p class="text-base font-normal text-[#626C71]">
            {{evmWallet.connected
              ? "Your wallet is connected and ready to receive testnet tokens"
              : "New here? Add testnet to your wallet"}}
          </p>
        </div>

        <div class="space-y-2">
          <div>
          <InputField :is-connected="evmWallet.connected" className="!bg-transparent" placeholder="republic... or 0x..." v-model="address" :full-width="true">
            <template v-if="hasConnectedWallets" #rightSection>
              <ButtonGroup>
              <Button 
              variant="outline"
              @click="requestToken"
                :disabled="!isValidAddress || isLoading">
                <i v-if="isLoading" class="fas fa-spinner fa-spin me-1"></i>
                <i v-else-if="!isValidAddress" class="fas fa-wallet me-1"></i>
                <i v-else class="fas fa-faucet me-1"></i>
                {{ isLoading ? 'Processing' : (isValidAddress ? 'Request' : 'Wallet') }}
              </Button>
               <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <Button variant="outline">
                    <i class="fas fa-ellipsis-vertical"></i>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem v-if="cosmosWallet.connected" @click="useCosmosAddress">
                    <i class="fas fa-atom"></i>
                      <span class="text-sm">{{ formatAddress(cosmosWallet.address) }}</span>
                      <small class="text-muted ms-1">(Cosmos)</small>
                  </DropdownMenuItem>
                  <DropdownMenuItem v-if="evmWallet.connected" @click="useEvmAddress">
                    <i class="fab fa-ethereum"></i>
                      <span class="text-sm">{{ formatAddress(evmWallet.address) }}</span>
                      <small class="text-muted ms-1">(EVM)</small>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              </ButtonGroup>
            </template>
          </InputField>
          <small v-if="isValidAddress" class="text-green-600">
            <i class="fas fa-check-circle mr-1"></i>
            Valid {{ addressType }} address
            <span v-if="addressMatchesWallet" class="ml-1">
              <i class="fas fa-link"></i>
              ({{ connectedWalletType }})
            </span>
          </small>
          <small v-else-if="address" class="text-red-600">
            <i class="fas fa-exclamation-circle mr-1"></i>
            Invalid address format
          </small>
        </div>
        </div>
        
        <!-- Submit Button (only show if no wallets connected) -->
        <Button 
          v-if="!hasConnectedWallets"
          class="w-full text-white font-semibold cursor-pointer hover:opacity-80 hover:translate-y-[-1px]"
          style="background: var(--cosmos-gradient)"
          @click="requestToken"
          :disabled="!isValidAddress || isLoading"
        >
          <span v-if="isLoading">
            <span class="loading-spinner mr-2"></span>
            Processing...
          </span>
          <span v-else>
            <i class="fas fa-faucet mr-2"></i>
            Request Tokens
          </span>
        </Button>
        
        <!-- Messages -->
        <div v-if="message" class="mt-3" v-html="message"></div>
        
        <!-- Balances -->
        <FaucetBalances :address="address" :is-valid="isValidAddress" :hovering-wallet="hoveringWallet" />
      <!-- </div> -->
    </div>
    
  </div>
</template>

<script setup>
import { computed, inject, ref } from 'vue';
import { useConfig } from '../../composables/useConfig';
import { useTransactions } from '../../composables/useTransactions';
import { useWalletStore } from '../../composables/useWalletStore';
import FaucetBalances from '../FaucetBalances.vue';
import InputField from '../InputField.vue';
import { Button } from '../ui/button';
import { ButtonGroup } from '../ui/button-group';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

const { cosmosWallet, evmWallet } = useWalletStore();
const { config } = useConfig();
const { addTransactionToHistory } = useTransactions();

// Inject the AppKit modal
const openAppKitModal = inject('openAppKitModal');
const disconnectAppKit = inject('disconnectAppKit');

const address = ref('');
const message = ref('');
const isLoading = ref(false);
const hoveringWallet = ref('');

const bech32Prefix = computed(() => {
  return (
    config.value?.network?.cosmos?.prefix ||
    config.value?.blockchain?.sender?.option?.prefix ||
    'cosmos'
  );
});

const isValidAddress = computed(() => {
  if (!address.value) return false;
  const prefix = bech32Prefix.value;
  return (
    address.value.startsWith(prefix) ||
    (address.value.startsWith('0x') && address.value.length === 42)
  );
});

const addressType = computed(() => {
  if (!address.value) return '';
  const prefix = bech32Prefix.value;
  return address.value.startsWith(prefix) ? 'Bech32' : 'EVM';
});

const hasConnectedWallets = computed(() => {
  return cosmosWallet.connected || evmWallet.connected;
});

const addressMatchesWallet = computed(() => {
  if (!address.value) return false;
  return (
    (cosmosWallet.connected && address.value === cosmosWallet.address) ||
    (evmWallet.connected && address.value === evmWallet.address)
  );
});

const connectedWalletType = computed(() => {
  if (cosmosWallet.connected && address.value === cosmosWallet.address) return 'Keplr';
  if (evmWallet.connected && address.value === evmWallet.address) return 'EVM Wallet';
  return '';
});

const formatAddress = (addr) => {
  if (!addr) return '';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
};

const useCosmosAddress = () => {
  if (cosmosWallet.connected && cosmosWallet.address) {
    address.value = cosmosWallet.address;
  }
};

const useEvmAddress = () => {
  if (evmWallet.connected && evmWallet.address) {
    address.value = evmWallet.address;
  }
};

const isMobile = () => {
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
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

const requestToken = async () => {
  if (!isValidAddress.value) {
    message.value = `
      <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
        <h6 class="text-yellow-800 font-semibold mb-2 flex items-center">
          <i class="fas fa-exclamation-circle mr-2"></i>Invalid Address
        </h6>
        <p class="text-yellow-700 text-sm mb-0">Please enter a valid Cosmos (cosmos...) or EVM (0x...) address</p>
      </div>`;
    return;
  }

  message.value = `
    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <h6 class="text-blue-800 font-semibold mb-2 flex items-center">
        <i class="fas fa-clock mr-2"></i>Processing Transaction
      </h6>
      <div class="flex items-center">
        <div class="loading-spinner mr-2"></div>
        <span class="text-blue-700">Sending tokens to ${addressType.value} address...</span>
      </div>
    </div>`;

  isLoading.value = true;

  try {
    const response = await fetch(`/send/${address.value}`);
    const data = await response.json();

    const isSuccess = data.result && (data.result.code === 0 || data.result.transactions);

    let txHash = null;
    if (isSuccess && data.result) {
      txHash =
        data.result.transaction_hash || data.result.hash || data.result.transactions?.[0] || null;
    }

    addTransactionToHistory({
      address: address.value,
      addressType: addressType.value,
      success: isSuccess,
      data: data,
      hash: txHash,
      timestamp: new Date(),
    });

    const explorerUrl = data.result?.explorer_url;
    const noTokensNeeded =
      data.result?.status === 'no_tokens_sent' ||
      (data.result?.tokens_sent && data.result.tokens_sent.length === 0);

    if (noTokensNeeded) {
      let tokenList = '';
      if (data.result?.token_status || data.result?.tokens_not_sent) {
        const tokenData = data.result.token_status || data.result.tokens_not_sent;
        const tokenNames = tokenData.map((t) => t.symbol).join(', ');
        tokenList = tokenNames;
      }

      // Check if there's a custom message from the backend
      const customMessage = data.result?.message;
      const _hasIneligibleTokens =
        data.result?.ineligible_tokens && data.result.ineligible_tokens.length > 0;

      let messageContent = '';
      if (customMessage?.includes('ERC20 tokens')) {
        // For Cosmos addresses that can't receive ERC20 tokens
        messageContent = `
          <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4 relative">
              <h6 class="text-yellow-800 font-semibold mb-2 flex items-center">
                <i class="fas fa-info-circle mr-2"></i>
                No Tokens Sent
              </h6>
              <p class="text-yellow-700 mb-2"><strong>This wallet already holds the maximum amount of ${tokenList} the faucet allows.</strong></p>
              <p class="text-yellow-600 text-sm mb-0">
                <i class="fas fa-exclamation-triangle mr-1"></i>
                Note: ERC20 tokens are only available to EVM (0x...) addresses. Connect an EVM wallet to receive WBTC, PEPE, and USDT.
              </p>
              <button type="button" class="absolute top-2 right-2 text-yellow-800 hover:text-yellow-900" aria-label="Close">&times;</button>
          </div>
        `;
      } else {
        // Standard message for other cases
        messageContent = `
          <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4 relative">
              <h6 class="text-yellow-800 font-semibold mb-2 flex items-center">
                <i class="fas fa-info-circle mr-2"></i>
                No Tokens Sent
              </h6>
              <p class="text-yellow-700 mb-0"><strong>This wallet already holds the maximum amount of ${tokenList} the faucet allows.</strong></p>
              <button type="button" class="absolute top-2 right-2 text-yellow-800 hover:text-yellow-900" aria-label="Close">&times;</button>
          </div>
        `;
      }

      message.value = messageContent;
    } else {
      const hasSentTokens = data.result?.tokens_sent && data.result.tokens_sent.length > 0;
      const hasNotSentTokens =
        data.result?.tokens_not_sent && data.result.tokens_not_sent.length > 0;
      const isPartialSuccess = isSuccess && hasSentTokens && hasNotSentTokens;

      if (isPartialSuccess) {
        const sentTokensList = data.result.tokens_sent
          .map((token) => {
            const amount = formatBalance(token.amount, token.decimals);
            return `${amount} ${token.symbol}`;
          })
          .join(', ');

        const notSentTokensList = data.result.tokens_not_sent.map((t) => t.symbol).join(', ');

        message.value = `
          <div class="bg-green-50 border border-green-200 rounded-lg p-4 mb-2 relative">
              <h6 class="text-green-800 font-semibold mb-2 flex items-center">
                <i class="fas fa-check-circle mr-2"></i>
                Tokens Sent Successfully!
              </h6>
              <p class="text-green-700 mb-2"><strong>Sent:</strong> ${sentTokensList}</p>
              ${txHash ? `<p class="text-green-700 mb-2"><strong>Transaction:</strong> <code class="text-sm bg-green-100 px-2 py-1 rounded">${txHash}</code></p>` : ''}
              ${explorerUrl ? `<p class="mb-0"><a href="${explorerUrl}" target="_blank" class="inline-flex items-center px-3 py-1.5 text-sm border border-blue-600 text-blue-600 rounded hover:bg-blue-50 transition-colors"><i class="fas fa-external-link-alt mr-1"></i>View on Explorer</a></p>` : ''}
              <button type="button" class="absolute top-2 right-2 text-green-800 hover:text-green-900" aria-label="Close">&times;</button>
          </div>
          <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4 relative">
              <h6 class="text-yellow-800 font-semibold mb-2 flex items-center">
                <i class="fas fa-info-circle mr-2"></i>
                Some Tokens Not Sent
              </h6>
              <p class="text-yellow-700 mb-2"><strong>This wallet already holds the maximum amount of ${notSentTokensList} the faucet allows.</strong></p>
              ${
                addressType.value === 'Cosmos' && data.result?.ineligible_tokens?.length > 0
                  ? `<p class="text-yellow-600 text-sm mb-0">
                  <i class="fas fa-exclamation-triangle mr-1"></i>
                  Note: ERC20 tokens are only available to EVM (0x...) addresses.
                </p>`
                  : ''
              }
              <button type="button" class="absolute top-2 right-2 text-yellow-800 hover:text-yellow-900" aria-label="Close">&times;</button>
          </div>
        `;
      } else {
        let tokenSummaryHtml = '';
        if (hasSentTokens) {
          const sentTokensList = data.result.tokens_sent
            .map((token) => {
              const amount = formatBalance(token.amount, token.decimals);
              return `${amount} ${token.symbol}`;
            })
            .join(', ');
          tokenSummaryHtml = `<p class="text-green-700 mb-2"><strong>Sent:</strong> ${sentTokensList}</p>`;
        }

        message.value = `
          <div class="${isSuccess ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'} border rounded-lg p-4 mb-4 relative">
              <h6 class="${isSuccess ? 'text-green-800' : 'text-red-800'} font-semibold mb-2 flex items-center">
                <i class="fas fa-${isSuccess ? 'check-circle' : 'exclamation-triangle'} mr-2"></i>
                ${isSuccess ? 'Tokens Sent Successfully!' : 'Request Failed'}
              </h6>
              ${tokenSummaryHtml}
              ${txHash ? `<p class="${isSuccess ? 'text-green-700' : 'text-red-700'} mb-2"><strong>Transaction:</strong> <code class="text-sm ${isSuccess ? 'bg-green-100' : 'bg-red-100'} px-2 py-1 rounded">${txHash}</code></p>` : ''}
              ${explorerUrl ? `<p class="mb-2"><a href="${explorerUrl}" target="_blank" class="inline-flex items-center px-3 py-1.5 text-sm border border-blue-600 text-blue-600 rounded hover:bg-blue-50 transition-colors"><i class="fas fa-external-link-alt mr-1"></i>View on Explorer</a></p>` : ''}
              <p class="${isSuccess ? 'text-green-600' : 'text-red-600'} text-sm mb-0">Full transaction details saved to Recent Txs tab.</p>
              <button type="button" class="absolute top-2 right-2 ${isSuccess ? 'text-green-800 hover:text-green-900' : 'text-red-800 hover:text-red-900'}" aria-label="Close">&times;</button>
          </div>
        `;
      }
    }
  } catch (err) {
    addTransactionToHistory({
      address: address.value,
      addressType: addressType.value,
      success: false,
      data: {
        error: err.message,
        result: {
          message: err.message,
          network_type: addressType.value.toLowerCase(),
        },
      },
      hash: null,
      timestamp: new Date(),
    });

    message.value = `
      <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 relative">
        <h6 class="text-red-800 font-semibold mb-2 flex items-center">
          <i class="fas fa-exclamation-triangle mr-2"></i>Network Error
        </h6>
        <p class="text-red-700 mb-0">${err.message}</p>
        <button type="button" class="absolute top-2 right-2 text-red-800 hover:text-red-900" aria-label="Close">&times;</button>
      </div>`;
  } finally {
    isLoading.value = false;
  }
};

const formatBalance = (amount, decimals = 0) => {
  if (!amount) return '0';
  let amountStr = amount.toString();
  if (amountStr.includes('e+') || amountStr.includes('e-')) {
    amountStr = Number(amount).toLocaleString('fullwide', { useGrouping: false });
  }
  const num = BigInt(amountStr);
  if (decimals > 0) {
    const divisor = BigInt(10 ** decimals);
    const whole = num / divisor;
    const fraction = num % divisor;
    if (fraction === 0n) {
      return whole.toString();
    } else {
      const fractionStr = fraction.toString().padStart(decimals, '0').replace(/0+$/, '');
      return `${whole.toString()}.${fractionStr}`;
    }
  }
  return num.toLocaleString();
};
</script>