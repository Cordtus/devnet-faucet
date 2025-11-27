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
      <div class="block md:hidden flex flex-col gap-2.5 px-1 sm:px-0">
        <div v-for="token in allTokens" :key="token.denom">
          <div
            class="bg-gradient-to-br from-[#0D0F0F] to-[#0A0C0C] border-2 rounded-lg transition-all duration-300 cursor-pointer hover:shadow-[0_0_20px_rgba(48,255,110,0.15)] active:scale-[0.99]"
            :class="[getTokenStatusClass(token), getHoverClass(token), { 'bg-black/30 shadow-[0_0_20px_rgba(48,255,110,0.25)] border-[#30FF6E]/50': expandedTokens[token.denom] }]"
            @click="toggleTokenExpansion(token.denom)"
          >
            <div class="p-3 flex justify-between items-center relative">
              <div class="flex items-center gap-1.5 flex-1 min-w-0">
                <span class="text-sm sm:text-base font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#30FF6E] to-[#C8FFD8] truncate">{{ getTokenSymbol(token) }}</span>
              </div>
              <div class="flex items-center gap-2 ml-2">
                <button
                  v-if="address && isValid && getTokenStatus(token) === 'available'"
                  @click.stop="emit('claim')"
                  class="text-xs font-bold bg-gradient-to-r from-[#7CFFB5] to-[#00FF6F] text-black px-2 py-1 rounded-md whitespace-nowrap"
                >
                  Claim {{ formatClaimableAmount(token) }}
                </button>
                <div v-else class="text-xs font-bold text-[#30FF6E] text-right whitespace-nowrap">{{ formatClaimableAmount(token) }}</div>
                <div v-if="address && isValid && getTokenStatus(token) !== 'available'" class="flex items-center">
                  <span v-if="getTokenStatus(token) === 'maxed'" class="w-2 h-2 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.6)] inline-block"></span>
                  <span v-else-if="getTokenStatus(token) === 'incompatible'" class="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)] inline-block"></span>
                </div>
              </div>
              <i class="fas fa-chevron-down ml-1.5 text-xs text-[#30FF6E] transition-transform duration-300" :class="{ 'rotate-180': expandedTokens[token.denom] }"></i>
            </div>
            
            <!-- Expanded Details -->
            <div v-if="expandedTokens[token.denom]" class="p-3 space-y-2 border-t border-[#30FF6E]/20 bg-gradient-to-b from-black/40 to-black/20 backdrop-blur-sm">
              <div v-if="token.contract && token.contract !== '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'" class="flex items-center justify-between gap-2 text-[10px]">
                <span class="text-[#626C71] font-semibold">Contract:</span>
                <span class="text-white cursor-pointer flex items-center gap-1.5 group hover:text-[#30FF6E] transition-colors" @click.stop="copyToClipboard(token.contract)">
                  <span class="font-mono">{{ formatContractAddress(token.contract) }}</span>
                  <i class="fas fa-copy text-[9px] opacity-40 group-hover:opacity-100 group-hover:text-[#30FF6E] transition-all"></i>
                </span>
              </div>
              <div v-else-if="token.denom && token.denom.startsWith('ibc/')" class="flex items-center justify-between gap-2 text-[10px]">
                <span class="text-[#626C71] font-semibold">IBC Denom:</span>
                <span class="text-white cursor-pointer flex items-center gap-1.5 group hover:text-[#30FF6E] transition-colors" @click.stop="copyToClipboard(token.denom)">
                  <span class="font-mono">{{ formatIbcDenom(token.denom) }}</span>
                  <i class="fas fa-copy text-[9px] opacity-40 group-hover:opacity-100 group-hover:text-[#30FF6E] transition-all"></i>
                </span>
              </div>
              <div v-if="tokenBalances[token.denom.toLowerCase()]" class="flex items-center justify-between gap-2 text-[10px]">
                <span class="text-[#626C71] font-semibold">Balance:</span>
                <span class="text-white font-bold">
                  {{ formatBalance(tokenBalances[token.denom.toLowerCase()].current_amount || tokenBalances[token.denom.toLowerCase()].amount, tokenBalances[token.denom.toLowerCase()].decimals || token.decimals) }}
                </span>
              </div>
              <div v-if="address && isValid" class="flex items-center gap-1.5 text-[10px] pt-1">
                <span v-if="getTokenStatus(token) === 'available'" class="w-1.5 h-1.5 rounded-full bg-[#30FF6E] shadow-[0_0_8px_rgba(48,255,110,0.8)] animate-pulse-subtle flex-shrink-0"></span>
                <span v-else-if="getTokenStatus(token) === 'maxed'" class="w-1.5 h-1.5 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.6)] flex-shrink-0"></span>
                <span v-else-if="getTokenStatus(token) === 'incompatible'" class="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)] flex-shrink-0"></span>

                <span v-if="getTokenStatus(token) === 'available'" class="text-[#30FF6E] font-semibold">Available</span>
                <span v-else-if="getTokenStatus(token) === 'maxed'" class="text-yellow-400 font-semibold">Maxed</span>
                <span v-else-if="getTokenStatus(token) === 'incompatible'" class="text-red-500 font-semibold">Incompatible</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Desktop card view -->
      <div class="hidden md:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-3 gap-3 lg:gap-4">
        <div v-for="token in allTokens" :key="token.denom">
          <div
            class="bg-gradient-to-br from-[#0D0F0F] to-[#0A0C0C] border-2 rounded-xl p-3 lg:p-4 h-full transition-all duration-300 relative hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(48,255,110,0.25)] group cursor-default"
            :class="[getTokenStatusClass(token), getHoverClass(token)]"
          >
            <!-- Neon glow effect on hover -->
            <div class="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-[#30FF6E]/8 to-transparent pointer-events-none"></div>

            <div class="relative z-10 space-y-2.5">
              <!-- Header -->
              <div class="flex items-start justify-between gap-2">
                <div class="flex-1 min-w-0">
                  <div class="text-lg lg:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#30FF6E] to-[#C8FFD8] truncate">{{ getTokenSymbol(token) }}</div>
                  <div class="text-xs text-[#626C71] font-medium truncate mt-0.5">{{ getTokenName(token) }}</div>
                </div>
              </div>

              <!-- Contract/Denom (if exists) -->
              <div v-if="token.contract && token.contract !== '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'" class="flex items-center gap-1.5 font-mono text-[10px] text-[#626C71] group/copy cursor-pointer hover:text-[#30FF6E] transition-colors" @click="copyToClipboard(token.contract)" :title="token.contract">
                <span class="truncate">{{ formatContractAddress(token.contract) }}</span>
                <i class="fas fa-copy text-[9px] opacity-30 group-hover/copy:opacity-100 group-hover/copy:text-[#30FF6E] transition-all flex-shrink-0"></i>
              </div>
              <div v-else-if="token.denom && token.denom.startsWith('ibc/')" class="flex items-center gap-1.5 font-mono text-[10px] text-[#626C71] group/copy cursor-pointer hover:text-[#30FF6E] transition-colors" @click="copyToClipboard(token.denom)" :title="token.denom">
                <span class="truncate">{{ formatIbcDenom(token.denom) }}</span>
                <i class="fas fa-copy text-[9px] opacity-30 group-hover/copy:opacity-100 group-hover/copy:text-[#30FF6E] transition-all flex-shrink-0"></i>
              </div>

              <!-- Claim Button -->
              <button
                v-if="address && isValid && getTokenStatus(token) === 'available'"
                @click="emit('claim')"
                class="w-full bg-gradient-to-r from-[#7CFFB5] to-[#00FF6F] hover:from-[#6EE6A3] hover:to-[#00E65A] text-black font-bold rounded-lg p-2.5 shadow-[0_0_15px_rgba(48,255,110,0.3)] hover:shadow-[0_0_25px_rgba(48,255,110,0.5)] transition-all duration-200 cursor-pointer"
              >
                <div class="text-sm">
                  Claim {{ formatClaimableAmount(token) }}
                </div>
              </button>
              <!-- Disabled state for maxed/incompatible -->
              <div v-else class="bg-[#30FF6E]/5 border border-[#30FF6E]/25 rounded-lg p-2.5 shadow-[0_0_15px_rgba(48,255,110,0.08)]">
                <div class="text-sm font-bold text-white">
                  <span class="text-[#30FF6E]">{{ formatClaimableAmount(token) }}</span>
                </div>
                <div v-if="tokenBalances[token.denom.toLowerCase()]" class="text-[10px] text-[#626C71] mt-1">
                  Balance: <span class="text-white font-semibold">{{ formatBalance(tokenBalances[token.denom.toLowerCase()].current_amount || tokenBalances[token.denom.toLowerCase()].amount, tokenBalances[token.denom.toLowerCase()].decimals || token.decimals) }}</span>
                </div>
              </div>

              <!-- Status Indicator -->
              <div v-if="address && isValid" class="flex items-center gap-1.5 text-xs">
                <span v-if="getTokenStatus(token) === 'available'" class="w-1.5 h-1.5 rounded-full bg-[#30FF6E] shadow-[0_0_8px_rgba(48,255,110,0.8)] animate-pulse-subtle flex-shrink-0"></span>
                <span v-else-if="getTokenStatus(token) === 'maxed'" class="w-1.5 h-1.5 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.6)] flex-shrink-0"></span>
                <span v-else-if="getTokenStatus(token) === 'incompatible'" class="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)] flex-shrink-0"></span>

                <span v-if="getTokenStatus(token) === 'available'" class="text-[#30FF6E] font-semibold text-[10px]">Available</span>
                <span v-else-if="getTokenStatus(token) === 'maxed'" class="text-yellow-400 font-semibold text-[10px]">Maxed</span>
                <span v-else-if="getTokenStatus(token) === 'incompatible'" class="text-red-500 font-semibold text-[10px]">Incompatible</span>
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

const emit = defineEmits(['claim']);

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
  if (type === 'native' || type === 'Native') {
    return 'bg-[#30FF6E]/10 text-[#30FF6E] border-[#30FF6E]/30 shadow-[0_0_12px_rgba(48,255,110,0.3)]';
  }
  return 'bg-[#00D9FF]/10 text-[#00D9FF] border-[#00D9FF]/30 shadow-[0_0_12px_rgba(0,217,255,0.3)]';
};

const formatContractAddress = (address) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const formatIbcDenom = (denom) => {
  if (!denom) return '';
  // IBC denoms are like "ibc/ABC123..." - show "ibc/ABC1...23"
  const hash = denom.replace('ibc/', '');
  if (hash.length <= 10) return denom;
  return `ibc/${hash.slice(0, 4)}...${hash.slice(-4)}`;
};

const formatTokenAmount = (token) => {
  const amount = token.target_balance || token.amount || 0;
  const formatted = formatBalance(amount, token.decimals || 18);
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
  const formattedClaimable = formatBalance(claimable, token.decimals || 18);
  const formattedTarget = formatBalance(target, token.decimals || 18);
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

const formatBalance = (amount, decimals = 18) => {
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