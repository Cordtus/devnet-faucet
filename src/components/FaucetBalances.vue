<template>
  <div>
    <!-- Loading indicator -->
    <div v-if="loadingBalances && address && isValid" class="text-center mb-3">
      <div class="inline-block animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-r-transparent align-[-0.125em]" role="status">
        <span class="sr-only">Loading balances...</span>
      </div>
      <small class="text-gray-500 ml-2">Checking token balances...</small>
    </div>
    
    <!-- Token Information -->
    <div class="mb-4" v-if="config && config.tokens">
      <!-- Mobile compact view -->
      <div class="block md:hidden flex flex-col gap-2">
        <div v-for="token in allTokens" :key="token.denom">
          <div 
            class="bg-[var(--bg-primary)] border-2 border-[var(--border-color)] rounded-lg transition-all duration-200 cursor-pointer" 
            :class="[getTokenStatusClass(token), getHoverClass(token), { 'bg-black/20': expandedTokens[token.denom] }]"
            @click="toggleTokenExpansion(token.denom)"
          >
            <div class="p-3 flex justify-between items-center relative">
              <div class="flex items-center gap-2">
                <span class="text-base font-semibold text-[var(--cosmos-accent)]">{{ getTokenSymbol(token) }}</span>
                <span class="text-[10px] px-1.5 py-0.5 rounded font-medium" :class="getTokenTypeBadgeClass(token)">
                  {{ getTokenType(token) }}
                </span>
              </div>
              <div class="flex items-center gap-3 mr-6">
                <div class="text-sm font-medium text-right">{{ formatClaimableAmount(token) }}</div>
                <div v-if="address && isValid" class="flex items-center">
                  <span v-if="getTokenStatus(token) === 'available'" class="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
                  <span v-else-if="getTokenStatus(token) === 'maxed'" class="w-2 h-2 rounded-full bg-yellow-500 inline-block"></span>
                  <span v-else-if="getTokenStatus(token) === 'incompatible'" class="w-2 h-2 rounded-full bg-red-500 inline-block"></span>
                </div>
              </div>
              <i class="fas fa-chevron-down absolute right-4 text-xs text-[var(--text-secondary)] transition-transform duration-200" :class="{ 'rotate-180': expandedTokens[token.denom] }"></i>
            </div>
            
            <!-- Expanded Details -->
            <div v-if="expandedTokens[token.denom]" class="p-3 space-y-2 border-t border-[var(--border-color)] bg-black/20">
              <div class="flex justify-between items-center mb-2 text-sm" v-if="token.contract && token.contract !== '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'">
                <span class="text-[var(--text-secondary)] font-medium">Contract:</span>
                <span class="text-[var(--text-primary)] text-right cursor-pointer flex items-center gap-1 group" @click.stop="copyToClipboard(token.contract)">
                  {{ formatContractAddress(token.contract) }}
                  <i class="fas fa-copy text-[10px] opacity-60 group-hover:opacity-100 transition-opacity"></i>
                </span>
              </div>
              <div class="flex justify-between items-center mb-2 text-sm" v-else-if="token.denom && token.denom.startsWith('ibc/')">
                <span class="text-[var(--text-secondary)] font-medium">IBC Denom:</span>
                <span class="text-[var(--text-primary)] text-right cursor-pointer flex items-center gap-1 group" @click.stop="copyToClipboard(token.denom)">
                  {{ formatIbcDenom(token.denom) }}
                  <i class="fas fa-copy text-[10px] opacity-60 group-hover:opacity-100 transition-opacity"></i>
                </span>
              </div>
              <div class="flex justify-between items-center mb-2 text-sm" v-if="tokenBalances[token.denom.toLowerCase()]">
                <span class="text-[var(--text-secondary)] font-medium">Your Balance:</span>
                <span class="text-[var(--text-primary)] text-right flex items-center gap-1">
                  {{ formatBalance(tokenBalances[token.denom.toLowerCase()].current_amount || tokenBalances[token.denom.toLowerCase()].amount, tokenBalances[token.denom.toLowerCase()].decimals || token.decimals) }} 
                  {{ tokenBalances[token.denom.toLowerCase()].symbol || token.symbol }}
                </span>
              </div>
              <div class="">
                <div class="text-[0.95rem] text-[var(--text-primary)]">
                  <strong>Claim: {{ formatClaimableAmount(token) }}</strong>
                </div>
                <div v-if="tokenBalances[token.denom.toLowerCase()]" class="mt-1">
                  <small class="text-gray-500">
                    Your Balance: {{ formatBalance(tokenBalances[token.denom.toLowerCase()].current_amount || tokenBalances[token.denom.toLowerCase()].amount, tokenBalances[token.denom.toLowerCase()].decimals || token.decimals) }} 
                    {{ tokenBalances[token.denom.toLowerCase()].symbol || token.symbol }}
                  </small>
                </div>
              </div>
              <div class="flex justify-between items-center text-sm" v-if="address && isValid">
                <span class="text-[var(--text-secondary)] font-medium">Status:</span>
                <span class="text-right flex items-center gap-1">
                  <span v-if="getTokenStatus(token) === 'available'" class="text-green-500">
                    <i class="fas fa-check-circle mr-1"></i>Will receive {{ formatClaimableAmount(token) }}
                  </span>
                  <span v-else-if="getTokenStatus(token) === 'maxed'" class="text-yellow-500">
                    <i class="fas fa-exclamation-circle mr-1"></i>Already maxed
                  </span>
                  <span v-else-if="getTokenStatus(token) === 'incompatible'" class="text-red-500">
                    <i class="fas fa-times-circle mr-1"></i>{{ getIncompatibleReason(token) }}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Desktop card view -->
      <div class="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <div v-for="token in allTokens" :key="token.denom">
          <div 
            class="bg-[var(--bg-primary)] border-2 border-[var(--border-color)] rounded-xl p-4 h-full transition-all duration-200 relative hover:-translate-y-0.5 hover:shadow-lg" 
            :class="[getTokenStatusClass(token), getHoverClass(token)]"
          >
            <div class="flex justify-between items-start mb-3">
              <div class="flex-1">
                <div class="text-lg font-semibold text-[var(--cosmos-accent)] mb-1">{{ getTokenSymbol(token) }}</div>
                <div class="text-sm text-[var(--text-secondary)]">{{ getTokenName(token) }}</div>
              </div>
              <span class="text-xs px-2 py-1 rounded font-medium" :class="getTokenTypeBadgeClass(token)">
                {{ getTokenType(token) }}
              </span>
            </div>
            
            <div class="mt-3">
              <div v-if="token.contract && token.contract !== '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'" class="flex items-center gap-2 mb-2 font-mono text-sm text-[var(--text-secondary)] group">
                <span 
                  class="cursor-pointer transition-colors hover:text-[var(--cosmos-accent)]" 
                  @click="copyToClipboard(token.contract)"
                  :title="token.contract"
                >
                  {{ formatContractAddress(token.contract) }}
                </span>
                <i class="fas fa-copy text-xs opacity-50 transition-opacity group-hover:opacity-100"></i>
              </div>
              <div v-else-if="token.denom && token.denom.startsWith('ibc/')" class="flex items-center gap-2 mb-2 font-mono text-sm text-[var(--text-secondary)] group">
                <span 
                  class="cursor-pointer transition-colors hover:text-[var(--cosmos-accent)]" 
                  @click="copyToClipboard(token.denom)"
                  :title="token.denom"
                >
                  {{ formatIbcDenom(token.denom) }}
                </span>
                <i class="fas fa-copy text-xs opacity-50 transition-opacity group-hover:opacity-100"></i>
              </div>
              
              <!-- Token Amount and Balance -->
              <div class="mt-2">
                <div class="text-[0.95rem] text-[var(--text-primary)]">
                  <strong>Claim: {{ formatClaimableAmount(token) }}</strong>
                </div>
                <div v-if="tokenBalances[token.denom.toLowerCase()]" class="mt-1">
                  <small class="text-gray-500">
                    Your Balance: {{ formatBalance(tokenBalances[token.denom.toLowerCase()].current_amount || tokenBalances[token.denom.toLowerCase()].amount, tokenBalances[token.denom.toLowerCase()].decimals || token.decimals) }} 
                    {{ tokenBalances[token.denom.toLowerCase()].symbol || token.symbol }}
                  </small>
                </div>
              </div>
              
              <!-- Status Indicator -->
              <div class="mt-2 text-sm" v-if="address && isValid">
                <span v-if="getTokenStatus(token) === 'available'" class="font-medium text-green-500">
                  <i class="fas fa-check-circle mr-1"></i>Will receive {{ formatClaimableAmount(token) }}
                </span>
                <span v-else-if="getTokenStatus(token) === 'maxed'" class="font-medium text-yellow-500">
                  <i class="fas fa-exclamation-circle mr-1"></i>Already maxed
                </span>
                <span v-else-if="getTokenStatus(token) === 'incompatible'" class="font-medium text-red-500">
                  <i class="fas fa-times-circle mr-1"></i>{{ getIncompatibleReason(token) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { computed, onMounted, ref, toRaw, watch } from 'vue';
import { useConfig } from '../composables/useConfig';

const props = defineProps({
  address: String,
  isValid: Boolean,
  hoveringWallet: String,
});

const { config } = useConfig();
const tokenBalances = ref({});
const loadingBalances = ref(false);
const copiedAddress = ref('');
const expandedTokens = ref({});

console.log('Line----170 FaucetBalances.vue', expandedTokens);
const bech32Prefix = computed(() => {
  return (
    config.value?.network?.cosmos?.prefix ||
    config.value?.blockchain?.sender?.option?.prefix ||
    'cosmos'
  );
});

const addressType = computed(() => {
  if (!props.address) return '';
  return props.address.startsWith(bech32Prefix.value) ? 'cosmos' : 'evm';
});

// Show available tokens from config
const allTokens = computed(() => {
  if (!config.value || !config.value.tokens) return [];
  return [...config.value.tokens];
});

const getTokenStatus = (token) => {
  if (!props.address || !props.isValid) return 'neutral';

  // Check if token is compatible with address type
  const isCompatible = isTokenCompatible(token);
  if (!isCompatible) return 'incompatible';

  // If we're still loading balances, show neutral state
  if (loadingBalances.value) return 'neutral';

  // Check if user already has max amount
  // Normalize denom to lowercase for consistent lookup
  const balance = tokenBalances.value[token.denom.toLowerCase()];
  // Use balance's target_amount if available, otherwise fall back to token config
  const targetAmount = balance?.target_amount
    ? Number.parseFloat(balance.target_amount)
    : Number.parseFloat(token.target_balance || token.amount || 0);

  // Always check current balance, even if not in tokenBalances
  if (balance) {
    // Handle both 'amount' and 'current_amount' fields for compatibility
    const currentAmount = Number.parseFloat(balance.current_amount || balance.amount || 0);
    if (currentAmount >= targetAmount) return 'maxed';
  }

  return 'available';
};

const isTokenCompatible = (_token) => {
  // All native tokens are compatible with both address types
  return true;
};

const getTokenStatusClass = (token) => {
  const status = getTokenStatus(token);
  const claimPercentage = getClaimPercentage(token);

  // Color coding based on percentage of max that will be sent:
  // Green: 75-100% of max amount
  // Yellow: 25-74% of max amount
  // Orange: 1-24% of max amount
  // Red: 0% (already maxed out)
  // Gray: incompatible or no address

  if (status === 'incompatible' || status === 'neutral' || !props.address) {
    return 'border-[var(--border-color)]';
  }

  if (status === 'maxed' || claimPercentage === 0) {
    return 'border-red-500';
  }

  if (claimPercentage >= 75) {
    return 'border-green-500';
  }

  if (claimPercentage >= 25) {
    return 'border-yellow-400';
  }

  // Less than 25% - orange/warning color
  return 'border-orange-500';
};

const isNativeToken = (token) => {
  return token.type === 'native' || !token.contract;
};

const getTokenSymbol = (token) => {
  return token.symbol || token.denom;
};

const getTokenName = (token) => {
  return token.name || '';
};

const getTokenType = (token) => {
  return token.type || 'Native';
};

const getTokenTypeBadgeClass = (token) => {
  const type = getTokenType(token);
  if (type === 'native' || type === 'Native')
    return 'bg-[rgba(80,100,251,0.1)] text-[var(--cosmos-secondary)]';
  return 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]';
};

const formatContractAddress = (address) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const formatIbcDenom = (denom) => {
  if (!denom) return '';
  const parts = denom.split('/');
  if (parts.length === 2 && parts[1].length > 8) {
    return `${parts[0]}/...${parts[1].slice(-4)}`;
  }
  return denom;
};

const formatTokenAmount = (token) => {
  const amount = token.target_balance || token.amount || 0;
  const formatted = formatBalance(amount, token.decimals || 0);
  const symbol = getTokenSymbol(token);
  return `${formatted} ${symbol}`;
};

const getClaimPercentage = (token) => {
  // If loading or no address, assume full amount
  if (loadingBalances.value || !props.address || !props.isValid) return 100;

  const claimable = getClaimableAmountRaw(token);
  const balance = tokenBalances.value[token.denom.toLowerCase()];
  // Use balance's target_amount if available, otherwise fall back to token config
  const target = balance?.target_amount
    ? Number.parseFloat(balance.target_amount)
    : Number.parseFloat(token.target_balance || token.amount || 0);
  if (!target) return 0;
  return (claimable / target) * 100;
};

const getClaimableAmountRaw = (token) => {
  const balance = tokenBalances.value[token.denom.toLowerCase()];
  // Use balance's target_amount if available, otherwise fall back to token config
  const target = balance?.target_amount
    ? Number.parseFloat(balance.target_amount)
    : Number.parseFloat(token.target_balance || token.amount || 0);

  if (!balance) return target;

  // Handle both 'amount' and 'current_amount' fields for compatibility
  const current = Number.parseFloat(balance.current_amount || balance.amount || 0);
  const remaining = target - current;

  return Math.max(0, remaining);
};

const formatClaimableAmount = (token) => {
  const claimable = getClaimableAmountRaw(token);
  const target = Number.parseFloat(token.target_balance || token.amount || 0);
  const formattedClaimable = formatBalance(claimable, token.decimals || 0);
  const formattedTarget = formatBalance(target, token.decimals || 0);
  const symbol = getTokenSymbol(token);

  // If we're sending the full amount, just show that
  if (claimable === target) {
    return `${formattedClaimable} ${symbol}`;
  }

  // If we're sending partial or none, show as "actual/max"
  return `${formattedClaimable}/${formattedTarget} ${symbol}`;
};

const getHoverClass = (_token) => {
  if (!props.hoveringWallet) return '';
  // All native tokens are eligible for both address types
  return 'hover:-translate-y-1 hover:scale-[1.02] hover:shadow-[0_6px_20px_rgba(0,255,136,0.3)] hover:border-[#00ff88] z-10';
};

const getIncompatibleReason = (_token) => {
  return 'Token not available';
};

const formatBalance = (amount, decimals = 0) => {
  if (!amount) return '0';

  try {
    const divisor = 10 ** decimals;
    const value = Number.parseFloat(amount) / divisor;

    if (value === 0) return '0';
    if (value < 0.000001) return value.toExponential(2);
    if (value < 1) return value.toFixed(6).replace(/\.?0+$/, '');
    if (value < 1000) return value.toFixed(2).replace(/\.?0+$/, '');

    return value.toLocaleString('en-US', { maximumFractionDigits: 2 });
  } catch (error) {
    console.error('Error formatting balance:', error);
    return '0';
  }
};

const toggleTokenExpansion = (denom) => {
  console.log('Line----373 FaucetBalances.vue', denom);
  // Create a new object reference to ensure reactivity triggers
  const newVal = !expandedTokens.value[denom];
  console.log('Line----376 FaucetBalances.vue', {
    ...expandedTokens.value,
    [denom]: newVal,
  });
  expandedTokens.value = {
    ...expandedTokens.value,
    [denom]: newVal,
  };
};

const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    copiedAddress.value = text;
    setTimeout(() => {
      copiedAddress.value = '';
    }, 2000);
  } catch (err) {
    console.error('Failed to copy:', err);
  }
};

const fetchBalances = async () => {
  if (!props.address || !props.isValid || !addressType.value) return;

  loadingBalances.value = true;
  tokenBalances.value = {};

  try {
    const response = await fetch(`/balance/${addressType.value}?address=${props.address}`);
    const data = await response.json();

    if (data.balances) {
      // Create a map of balances by denom
      data.balances.forEach((balance) => {
        const normalizedDenom = balance.denom.toLowerCase();
        tokenBalances.value[normalizedDenom] = balance;
      });
    }
  } catch (error) {
    console.error('Error fetching balances:', error);
  } finally {
    loadingBalances.value = false;
  }
};

// Watch for address changes
watch(
  () => props.address,
  () => {
    if (props.address && props.isValid) {
      fetchBalances();
    } else {
      tokenBalances.value = {};
    }
  }
);

// Fetch balances on mount if address is already provided
onMounted(() => {
  if (props.address && props.isValid) {
    fetchBalances();
  }
});
</script>