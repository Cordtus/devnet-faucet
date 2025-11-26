<template>
  <Dialog>
    <DialogTrigger as-child>
      <Button variant="outline" class="flex-1 cursor-pointer md:flex-none border-blue-500 text-blue-500 hover:bg-blue-50 hover:text-blue-600 text-xs"  size="sm">
        <i class="fas fa-eye mr-1 hidden md:inline"></i>Details
      </Button>
    </DialogTrigger>
    <DialogContent class="!max-w-3xl">
      <DialogHeader>
        <DialogTitle>Transaction Details</DialogTitle>
      </DialogHeader>
       <!-- Basic Info -->
        <div class="mb-3 space-y-2">
          <InfoRow label="Status">
            <Badge :class="getTransactionBadgeClass(transaction)">
              {{ getTransactionStatus(transaction) }}
            </Badge>
          </InfoRow>
          <InfoRow label="Address">
            <div class="flex items-center gap-1">
              <Kbd>{{ transaction.address }}</Kbd>
              <Badge class="ms-2">{{ transaction.addressType }}</Badge>
            </div>
          </InfoRow>
          <InfoRow label="Tx Hash">
            <Kbd>{{ getActualTransactionHash(transaction) }}</Kbd>
          </InfoRow>
          <InfoRow label="Timestamp">
            <span>{{ new Date(transaction.timestamp).toLocaleString() }}</span>
          </InfoRow>
        </div>
        
        <!-- Cosmos Transaction Details -->
        <div v-if="isCosmosTransaction" class="mb-3">
          <h6 class="text-primary mb-2">Cosmos Transaction Details</h6>
          
          <div v-if="cosmosData" class="mb-3">
            <InfoRow label="Block Height" v-if="cosmosData.block_height">
            {{ cosmosData.block_height }}
          </InfoRow>
          <InfoRow label="Gas Used / Wanted" v-if="cosmosData.gas_used">
            {{ cosmosData.gas_used }} / {{ cosmosData.gas_wanted || 'N/A' }}
          </InfoRow>
          <InfoRow label="Code" v-if="cosmosData.code">
            <Badge :class="cosmosData.code === 0 ? 'bg-green-500' : 'bg-red-500'">
              {{ cosmosData.code }}
            </Badge>
          </InfoRow>
          </div>
          
          <!-- REST API URL Button -->
          <div v-if="cosmosRestApiUrl" class="text-center mb-3">
            <a :href="cosmosRestApiUrl" target="_blank" class="btn btn-outline-info btn-sm">
              <i class="fas fa-external-link-alt"></i>Open REST API Response
            </a>
          </div>
          
          <!-- Toggle Full JSON -->
          <div class="text-center mb-3">
            <Button variant="outline" size="sm" @click="showFullJson = !showFullJson">
              <i class="fas" :class="showFullJson ? 'fa-eye-slash' : 'fa-eye'"></i>
              {{ showFullJson ? 'Hide' : 'Show' }} Full Response
            </Button>
          </div>
          
          <!-- Full JSON -->
          <div v-if="showFullJson && transaction.data?.result" class="json-container">
            <pre class="text-xs">{{ JSON.stringify(transaction.data.result, null, 2) }}</pre>
          </div>
        </div>
        
        <!-- EVM Transaction Details -->
        <div v-else-if="isEvmTransaction && evmData" class="mb-3">
          <h6 class="text-primary mb-2">EVM Transaction Details</h6>
          
          <InfoRow label="Block Number" v-if="evmData.blockNumber">
            {{ evmData.blockNumber }}
          </InfoRow>
          <InfoRow label="From" v-if="evmData.from">
            {{ evmData.from }}
          </InfoRow>
          <InfoRow label="To" v-if="evmData.to">
            {{ evmData.to }}
          </InfoRow>
          <InfoRow label="Gas Used" v-if="evmData.gasUsed">
            {{ evmData.gasUsed }}
          </InfoRow>
          <InfoRow label="Status" v-if="evmData.status !== undefined">
            <Badge :class="evmData.status === 1 ? 'bg-green-500' : 'bg-red-500'">
            {{ evmData.status === 1 ? 'Success' : 'Failed' }}
            </Badge>
          </InfoRow>
          
          <!-- Toggle Full JSON -->
          <div class="text-center mb-3">
            <Button variant="outline" size="sm" @click="showFullJson = !showFullJson">
              <i class="fas" :class="showFullJson ? 'fa-eye-slash' : 'fa-eye'"></i>
              {{ showFullJson ? 'Hide' : 'Show' }} Full Response
            </Button>
          </div>
          
          <!-- Full JSON -->
          <div v-if="showFullJson && evmData" class="json-container">
            <pre>{{ JSON.stringify(evmData, null, 2) }}</pre>
          </div>
        </div>
        
        <!-- Token Transfer Summary -->
        <div v-if="hasTokenTransfers" class="mb-3">
          <h6 class="text-primary mb-2">Token Transfers</h6>
          
          <div v-if="transaction.data?.result?.tokens_sent?.length > 0" class="mb-2">
            <strong>Sent:</strong>
            <ul class="mb-0">
              <li v-for="(token, idx) in transaction.data.result.tokens_sent" :key="idx">
                {{ formatTokenAmount(token.amount, token.decimals) }} {{ token.symbol }}
                <span v-if="token.type" class="badge bg-secondary ms-1">{{ token.type }}</span>
              </li>
            </ul>
          </div>
          
          <div v-if="transaction.data?.result?.tokens_not_sent?.length > 0" class="mb-2">
            <strong>Not Sent (Already Funded):</strong>
            <ul class="mb-0">
              <li v-for="(token, idx) in transaction.data.result.tokens_not_sent" :key="idx">
                {{ token.symbol }}
                <span v-if="token.reason" class="text-muted">({{ token.reason }})</span>
              </li>
            </ul>
          </div>
        </div>
        
        <!-- Error Details -->
        <div v-if="!transaction.success && transaction.data?.result" class="mb-3">
          <h6 class="text-danger mb-2">Error Details</h6>
          <div class="alert alert-danger">
            <div v-if="transaction.data.result.message">
              <strong>Message:</strong> {{ transaction.data.result.message }}
            </div>
            <div v-if="transaction.data.result.error">
              <strong>Error:</strong> {{ transaction.data.result.error }}
            </div>
            <div v-if="transaction.data.result.raw_log">
              <strong>Raw Log:</strong>
              <pre class="mb-0 mt-2">{{ transaction.data.result.raw_log }}</pre>
            </div>
          </div>
        </div>
      <DialogFooter>
        <DialogClose as-child>
          <Button variant="outline" class="cursor-pointer">Close</Button>
        </DialogClose>
        <Button class="text-white cursor-pointer" as="a"
              :href="explorerUrl" target="_blank"  style="background: var(--cosmos-gradient)">
          <i class="fas fa-external-link-alt"></i>
          View on Explorer</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useConfig } from '../composables/useConfig';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Kbd } from './ui/kbd';

const props = defineProps({
  transaction: {
    type: Object,
    required: true,
  },
});

const _emit = defineEmits(['close']);

const { networkConfig } = useConfig();
const _showFullJson = ref(false);

const isCosmosTransaction = computed(() => {
  return (
    props.transaction.data?.result?.network_type === 'cosmos' ||
    props.transaction.addressType === 'cosmos'
  );
});

const isEvmTransaction = computed(() => {
  return (
    props.transaction.data?.result?.network_type === 'evm' ||
    props.transaction.addressType === 'evm'
  );
});

const _hasTokenTransfers = computed(() => {
  const result = props.transaction.data?.result;
  return result?.tokens_sent?.length > 0 || result?.tokens_not_sent?.length > 0;
});

const _cosmosData = computed(() => {
  if (!isCosmosTransaction.value) return null;

  const result = props.transaction.data?.result;
  if (!result) return null;

  const txResponse = result.tx_response || result.cosmos_tx_data?.tx_response || {};

  return {
    block_height: result.block_height || result.height || txResponse.height,
    gas_used: result.gas_used || txResponse.gas_used,
    gas_wanted: result.gas_wanted || txResponse.gas_wanted,
    code: result.code !== undefined ? result.code : txResponse.code,
    timestamp: txResponse.timestamp,
  };
});

const _evmData = computed(() => {
  if (!isEvmTransaction.value) return null;

  const result = props.transaction.data?.result;
  if (!result || !result.evm_tx_data) return null;

  return result.evm_tx_data;
});

const _cosmosRestApiUrl = computed(() => {
  if (!isCosmosTransaction.value) return null;

  // First check if we have a REST API URL already
  if (props.transaction.data?.result?.rest_api_url) {
    return props.transaction.data.result.rest_api_url;
  }

  // If not, construct one based on the transaction hash
  const hash = getActualTransactionHash(props.transaction);
  if (hash) {
    const restBase = networkConfig.value.cosmos?.rest || 'https://devnet-1-lcd.ib.skip.build';
    return `${restBase}/cosmos/tx/v1beta1/txs/${hash}`;
  }

  return null;
});

const explorerUrl = computed(() => {
  const result = props.transaction.data?.result;

  // Use provided explorer URL first
  if (result?.explorer_url) return result.explorer_url;

  // Get the actual transaction hash
  const actualHash = getActualTransactionHash(props.transaction);

  // Generate URL based on transaction type and hash
  if (actualHash) {
    if (isEvmTransaction.value) {
      const explorerBase =
        networkConfig.value.evm?.explorer || 'https://evm-devnet-1.cloud.blockscout.com';
      return `${explorerBase}/tx/${actualHash}`;
    } else if (isCosmosTransaction.value) {
      const explorerBase =
        networkConfig.value.cosmos?.explorer ||
        'https://devnet-explorer.fly.dev/Cosmos%20Evm%20Devnet';
      return `${explorerBase}/tx/${actualHash}`;
    }
  }

  return null;
});

const getActualTransactionHash = (tx) => {
  if (!tx || !tx.data || !tx.data.result) return null;

  const result = tx.data.result;

  return result.transaction_hash || result.hash || result.transactions?.[0] || tx.hash || null;
};

const getTransactionStatus = (tx) => {
  if (!tx.success) {
    return 'Failed';
  }
  if (tx.data?.result?.status === 'no_tokens_sent' || tx.data?.result?.tokens_sent?.length === 0) {
    return 'Already Funded';
  }
  return 'Success';
};

const getTransactionBadgeClass = (tx) => {
  if (!tx.success) {
    return 'bg-gray-500 text-white';
  }
  if (tx.data?.result?.status === 'no_tokens_sent' || tx.data?.result?.tokens_sent?.length === 0) {
    return 'bg-yellow-500 text-dark';
  }
  return 'bg-green-500 text-white';
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
</script>

<script>
export default {
  components: {
    InfoRow: {
      props: {
        label: String
      },
      template: `
        <div class="flex md:items-center gap-2 md:flex-row flex-col">
          <p class="text-sm text-gray-500">{{ label }}:</p>
          <slot />
        </div>
      `
    }
  }
}
</script>

<style scoped>

.json-container {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 1rem;
  max-height: 400px;
  overflow-y: auto;
}

.json-container pre {
  margin: 0;
  color: var(--text-primary);
  font-size: 0.875rem;
  white-space: pre-wrap;
  word-break: break-word;
}

.alert {
  background: rgba(220, 53, 69, 0.1);
  border: 1px solid #dc3545;
  color: var(--text-primary);
}

.alert pre {
  background: rgba(0, 0, 0, 0.2);
  padding: 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
}
</style>