<template>
  <div>
    <div v-if="recentTransactions.length > 0">
      <div v-for="(tx, index) in recentTransactions" :key="index" class="p-4 border border-[var(--border-color)] rounded-lg mb-4 bg-[var(--bg-primary)] transition-colors duration-200 hover:border-[var(--cosmos-accent)] last:mb-0 flex flex-col md:flex-row items-start">
        <div class="flex-1 min-w-0 w-full md:w-auto mb-3 md:mb-0">
          <div class="flex items-center mb-2 flex-wrap">
            <i :class="getTransactionIcon(tx)" class="mr-2"></i>
            <Badge :class="getTransactionBadgeClass(tx)">
              {{ getTransactionStatus(tx) }}
            </Badge>
            <span class="ml-2 text-[var(--text-secondary)] text-sm">{{ formatDate(tx.timestamp) }}</span>
          </div>
          
          <div class="mb-2 space-x-2">
            <strong>Address:</strong> 
            <Kbd 
              class="text-sm cursor-pointer transition-all duration-200 inline-flex items-center px-1.5 py-0.5 rounded hover:bg-blue-500/10 hover:text-[var(--cosmos-accent)] break-all md:break-normal"
              @click="copyToClipboard(tx.address, `addr-${index}`)"
              :title="tx.address"
            >
              {{ truncateHash(tx.address) }}
              <i v-if="copiedItem === `addr-${index}`" class="fas fa-check text-green-500 ml-1"></i>
            </Kbd>
            <Badge class="text-xs font-medium bg-gray-200 text-gray-800">
              {{ tx.addressType }}
            </Badge>
          </div>
          
          <!-- Show transaction hash if available -->
          <div v-if="getActualTransactionHash(tx)" class="mb-2 space-x-2">
            <strong>Tx Hash:</strong> 
            <Kbd 
              class="text-sm cursor-pointer transition-all duration-200 inline-flex items-center px-1.5 py-0.5 rounded hover:bg-blue-500/10 hover:text-[var(--cosmos-accent)] break-all md:break-normal"
              @click="copyToClipboard(getActualTransactionHash(tx), `tx-${index}`)"
              :title="getActualTransactionHash(tx)"
            >
              {{ truncateHash(getActualTransactionHash(tx)) }}
              <i v-if="copiedItem === `tx-${index}`" class="fas fa-check text-green-500 ml-1"></i>
            </Kbd>
          </div>
          
          <!-- Show error message if failed -->
          <div v-if="!tx.success && tx.data?.result?.message" class="mb-2 text-red-500">
            <i class="fas fa-exclamation-circle mr-1"></i>
            <span>{{ tx.data.result.message }}</span>
          </div>
          
          <!-- Show token summary -->
          <div v-if="tx.data?.result?.tokens_sent && tx.data.result.tokens_sent.length > 0" class="mb-1">
            <small class="text-[var(--text-secondary)]">Sent: 
              <span v-for="(token, idx) in tx.data.result.tokens_sent" :key="idx">
                {{ formatTokenAmount(token.amount, token.decimals) }} {{ token.symbol }}<span v-if="idx < tx.data.result.tokens_sent.length - 1">, </span>
              </span>
            </small>
          </div>
          
          <div v-if="tx.data?.result?.tokens_not_sent && tx.data.result.tokens_not_sent.length > 0" class="mb-1">
            <small class="text-[var(--text-secondary)]">Already funded: 
              <span v-for="(token, idx) in tx.data.result.tokens_not_sent" :key="idx">
                {{ token.symbol }}<span v-if="idx < tx.data.result.tokens_not_sent.length - 1">, </span>
              </span>
            </small>
          </div>
        </div>
        
        <div class="w-full md:w-auto md:ml-4 shrink-0">
          <div class="flex flex-row md:flex-col gap-2 md:gap-1 flex-wrap md:flex-nowrap">
            <TransactionDetailsModal :transaction="tx"/>
            
            <Button 
              v-if="getTransactionExplorerUrl(tx)" 
              as="a"
              :href="getTransactionExplorerUrl(tx)" 
              target="_blank" 
              variant="outline"
              size="sm"
              class="flex-1 md:flex-none border-green-500 text-green-500 hover:bg-green-50 hover:text-green-600 text-xs"
            >
              <i class="fas fa-external-link-alt mr-1 hidden md:inline"></i>{{ getTransactionExplorerLabel(tx) }}
            </Button>
            
            <Button 
              v-else 
              variant="outline"
              size="sm"
              class="flex-1 md:flex-none border-gray-300 text-gray-400 cursor-not-allowed text-xs" 
              disabled
            >
              <i class="fas fa-external-link-alt mr-1 hidden md:inline"></i>View
            </Button>
            
            <Button 
              variant="outline"
              size="sm"
              class="flex-1 cursor-pointer md:flex-none border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600 text-xs" 
              @click="removeTransaction(index)"
            >
              <i class="fas fa-trash mr-1 hidden md:inline"></i>Delete
            </Button>
          </div>
        </div>
      </div>
      
      <div class="text-center mt-3">
        <Button 
          variant="outline"
          size="sm"
          class="border-gray-300 cursor-pointer text-gray-700 hover:bg-gray-50 text-xs" 
          @click="clearAllTransactions"
        >
          <i class="fas fa-trash mr-2"></i>Clear All
        </Button>
      </div>
    </div>
    
    <div v-else class="text-center py-4">
      <i class="fas fa-history fa-3x text-[var(--text-secondary)] mb-3"></i>
      <h5 class="text-[var(--text-secondary)] text-lg font-medium">No Recent Transactions</h5>
      <p class="text-[var(--text-secondary)]">Your transaction history will appear here.</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useConfig } from '../../composables/useConfig';
import { useTransactions } from '../../composables/useTransactions';
import TransactionDetailsModal from '../TransactionDetailsModal.vue';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Kbd } from '../ui/kbd';

const { networkConfig } = useConfig();
const { recentTransactions, removeTransaction, clearAllTransactions } = useTransactions();

const selectedTransaction = ref(null);
const copiedItem = ref(null);

const showTransactionDetails = (tx) => {
  selectedTransaction.value = tx;
};

const truncateHash = (hash) => {
  if (!hash) return '';
  if (hash.length <= 10) return hash;
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
};

const copyToClipboard = async (text, itemId) => {
  try {
    await navigator.clipboard.writeText(text);
    copiedItem.value = itemId;
    setTimeout(() => {
      copiedItem.value = null;
    }, 2000);
  } catch (err) {
    console.error('Failed to copy:', err);
  }
};

const getActualTransactionHash = (tx) => {
  if (!tx || !tx.data || !tx.data.result) return null;

  const result = tx.data.result;

  return result.transaction_hash || result.hash || result.transactions?.[0] || tx.hash || null;
};

const getTransactionIcon = (tx) => {
  if (!tx.success) {
    return 'fas fa-exclamation-triangle text-red-500';
  }
  if (isNoTokensNeeded(tx)) {
    return 'fas fa-info-circle text-yellow-500';
  }
  return 'fas fa-check-circle text-green-500';
};

const getTransactionBadgeClass = (tx) => {
  if (!tx.success) {
    return 'bg-red-100 text-red-800';
  }
  if (isNoTokensNeeded(tx)) {
    return 'bg-yellow-100 text-yellow-800';
  }
  return 'bg-green-100 text-green-800';
};

const getTransactionStatus = (tx) => {
  if (!tx.success) {
    return 'Failed';
  }
  if (isNoTokensNeeded(tx)) {
    return 'Already Funded';
  }
  return 'Success';
};

const isNoTokensNeeded = (tx) => {
  if (tx.data?.result?.message?.includes('sufficient balance')) {
    return true;
  }
  if (tx.data?.result?.tokens_sent && tx.data.result.tokens_sent.length === 0) {
    return true;
  }
  if (tx.data?.result?.status === 'no_tokens_sent') {
    return true;
  }
  return false;
};

const getTransactionExplorerUrl = (tx) => {
  if (!tx || !tx.data || !tx.data.result) return null;

  const result = tx.data.result;

  // Use provided explorer URL first
  if (result.explorer_url) return result.explorer_url;

  // Get the actual transaction hash
  const actualHash = getActualTransactionHash(tx);

  // Generate URL based on transaction type and hash
  if (actualHash) {
    if (result.network_type === 'evm' || tx.addressType === 'evm') {
      // EVM transaction - use blockscout explorer
      const explorerBase =
        networkConfig.value.evm?.explorer || 'https://evm-devnet-1.cloud.blockscout.com';
      return `${explorerBase}/tx/${actualHash}`;
    } else if (result.network_type === 'cosmos' || tx.addressType === 'cosmos') {
      // Cosmos transaction - use explorer from config
      const explorerBase =
        networkConfig.value.cosmos?.explorer ||
        'https://devnet-explorer.fly.dev/Cosmos%20Evm%20Devnet';
      return `${explorerBase}/tx/${actualHash}`;
    }
  }

  return null;
};

const getTransactionExplorerLabel = (tx) => {
  if (!tx || !tx.data || !tx.data.result) return 'View';

  const result = tx.data.result;

  if (result.explorer_url) return 'View on Explorer';

  // Generate label based on transaction type
  if (getActualTransactionHash(tx)) {
    if (result.network_type === 'evm' || tx.addressType === 'evm') {
      return 'View on Blockscout';
    } else if (result.network_type === 'cosmos' || tx.addressType === 'cosmos') {
      return 'View on Explorer';
    }
  }

  return 'View';
};

const formatTokenAmount = (amount, decimals = 18) => {
  if (!amount) return '0';

  try {
    const bigAmount = BigInt(amount);
    const divisor = BigInt(10 ** decimals);
    const whole = bigAmount / divisor;
    const fraction = bigAmount % divisor;

    if (fraction === 0n) {
      return whole.toString();
    } else {
      const fractionStr = fraction.toString().padStart(decimals, '0').replace(/0+$/, '');
      return `${whole.toString()}.${fractionStr}`;
    }
  } catch (_error) {
    return amount.toString();
  }
};

const formatDate = (date) => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};
</script>