<template>
  <div>
    <!-- Loading indicator -->
    <div v-if="loadingBalances && address && isValid" class="text-center mb-3">
      <div class="spinner-border spinner-border-sm text-primary" role="status">
        <span class="visually-hidden">Loading balances...</span>
      </div>
      <small class="text-muted ms-2">Checking token balances...</small>
    </div>
    
    <!-- Token Information -->
    <div class="mb-4" v-if="config && config.tokens">
      <!-- Mobile compact view -->
      <div class="mobile-token-list d-block d-md-none">
        <div v-for="token in allTokens" :key="token.denom">
          <div 
            class="token-card-mobile" 
            :class="[getTokenStatusClass(token), getHoverClass(token), { expanded: expandedTokens[token.denom] }]"
            @click="toggleTokenExpansion(token.denom)"
          >
            <div class="token-main">
              <div class="token-left">
                <span class="token-symbol">{{ getTokenSymbol(token) }}</span>
                <span class="token-type-badge" :class="getTokenTypeBadgeClass(token)">
                  {{ getTokenType(token) }}
                </span>
              </div>
              <div class="token-right">
                <div class="token-amount">{{ formatClaimableAmount(token) }}</div>
                <div v-if="address && isValid" class="token-status-mobile">
                  <span v-if="getTokenStatus(token) === 'available'" class="status-dot available"></span>
                  <span v-else-if="getTokenStatus(token) === 'maxed'" class="status-dot maxed"></span>
                  <span v-else-if="getTokenStatus(token) === 'incompatible'" class="status-dot incompatible"></span>
                </div>
              </div>
              <i class="fas fa-chevron-down expand-icon" :class="{ rotated: expandedTokens[token.denom] }"></i>
            </div>
            
            <!-- Expanded Details -->
            <div v-if="expandedTokens[token.denom]" class="token-expanded-details">
              <div class="detail-row" v-if="token.contract && token.contract !== '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'">
                <span class="detail-label">Contract:</span>
                <span class="detail-value" @click.stop="copyToClipboard(token.contract)">
                  {{ formatContractAddress(token.contract) }}
                  <i class="fas fa-copy copy-icon-small"></i>
                </span>
              </div>
              <div class="detail-row" v-else-if="token.denom && token.denom.startsWith('ibc/')">
                <span class="detail-label">IBC Denom:</span>
                <span class="detail-value" @click.stop="copyToClipboard(token.denom)">
                  {{ formatIbcDenom(token.denom) }}
                  <i class="fas fa-copy copy-icon-small"></i>
                </span>
              </div>
              <div class="detail-row" v-if="tokenBalances[token.denom.toLowerCase()]">
                <span class="detail-label">Your Balance:</span>
                <span class="detail-value">
                  {{ formatBalance(tokenBalances[token.denom.toLowerCase()].current_amount || tokenBalances[token.denom.toLowerCase()].amount, tokenBalances[token.denom.toLowerCase()].decimals || token.decimals) }} 
                  {{ tokenBalances[token.denom.toLowerCase()].symbol || token.symbol }}
                </span>
              </div>
              <div class="detail-row" v-if="address && isValid">
                <span class="detail-label">Status:</span>
                <span class="detail-value">
                  <span v-if="getTokenStatus(token) === 'available'" class="text-success">
                    <i class="fas fa-check-circle me-1"></i>Will receive {{ formatClaimableAmount(token) }}
                  </span>
                  <span v-else-if="getTokenStatus(token) === 'maxed'" class="text-warning">
                    <i class="fas fa-exclamation-circle me-1"></i>Already maxed
                  </span>
                  <span v-else-if="getTokenStatus(token) === 'incompatible'" class="text-danger">
                    <i class="fas fa-times-circle me-1"></i>{{ getIncompatibleReason(token) }}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Desktop card view -->
      <div class="row g-3 d-none d-md-flex">
        <div v-for="token in allTokens" :key="token.denom" class="col-md-6 col-lg-4">
          <div 
            class="token-card" 
            :class="[getTokenStatusClass(token), getHoverClass(token)]"
          >
            <div class="token-header">
              <div class="token-info">
                <div class="token-symbol">{{ getTokenSymbol(token) }}</div>
                <div class="token-name">{{ getTokenName(token) }}</div>
              </div>
              <span class="token-type-badge" :class="getTokenTypeBadgeClass(token)">
                {{ getTokenType(token) }}
              </span>
            </div>
            
            <div class="token-details">
              <div v-if="token.contract && token.contract !== '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'" class="token-address">
                <span 
                  class="address-text" 
                  @click="copyToClipboard(token.contract)"
                  :title="token.contract"
                >
                  {{ formatContractAddress(token.contract) }}
                </span>
                <i class="fas fa-copy copy-icon"></i>
              </div>
              <div v-else-if="token.denom && token.denom.startsWith('ibc/')" class="token-address">
                <span 
                  class="address-text" 
                  @click="copyToClipboard(token.denom)"
                  :title="token.denom"
                >
                  {{ formatIbcDenom(token.denom) }}
                </span>
                <i class="fas fa-copy copy-icon"></i>
              </div>
              
              <!-- Token Amount and Balance -->
              <div class="token-amounts">
                <div class="token-amount">
                  <strong>Claim: {{ formatClaimableAmount(token) }}</strong>
                </div>
                <div v-if="tokenBalances[token.denom.toLowerCase()]" class="token-balance">
                  <small class="text-muted">
                    Your Balance: {{ formatBalance(tokenBalances[token.denom.toLowerCase()].current_amount || tokenBalances[token.denom.toLowerCase()].amount, tokenBalances[token.denom.toLowerCase()].decimals || token.decimals) }} 
                    {{ tokenBalances[token.denom.toLowerCase()].symbol || token.symbol }}
                  </small>
                </div>
              </div>
              
              <!-- Status Indicator -->
              <div class="token-status mt-2" v-if="address && isValid">
                <span v-if="getTokenStatus(token) === 'available'" class="status-text text-success">
                  <i class="fas fa-check-circle me-1"></i>Will receive {{ formatClaimableAmount(token) }}
                </span>
                <span v-else-if="getTokenStatus(token) === 'maxed'" class="status-text text-warning">
                  <i class="fas fa-exclamation-circle me-1"></i>Already maxed
                </span>
                <span v-else-if="getTokenStatus(token) === 'incompatible'" class="status-text text-danger">
                  <i class="fas fa-times-circle me-1"></i>{{ getIncompatibleReason(token) }}
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
import { computed, onMounted, ref, watch } from 'vue';
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
    return { 'status-neutral': true };
  }

  if (status === 'maxed' || claimPercentage === 0) {
    return { 'status-maxed': true };
  }

  if (claimPercentage >= 75) {
    return { 'status-available': true };
  }

  if (claimPercentage >= 25) {
    return { 'status-partial': true };
  }

  // Less than 25% - orange/warning color
  return { 'status-minimal': true };
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
  if (type === 'native' || type === 'Native') return 'badge-native';
  return 'badge-default';
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
  return 'token-hover-eligible';
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
  expandedTokens.value[denom] = !expandedTokens.value[denom];
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

<style scoped>
.help-tip {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: var(--bg-primary);
  border: 1px solid var(--cosmos-accent);
  border-radius: 8px;
  align-items: flex-start;
}

.help-icon {
  color: var(--cosmos-accent);
  font-size: 1.5rem;
  flex-shrink: 0;
}

.help-content h6 {
  color: var(--cosmos-accent);
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.help-content p {
  color: var(--text-secondary);
  font-size: 0.9rem;
  line-height: 1.5;
}

.help-content ul {
  color: var(--text-secondary);
  font-size: 0.9rem;
  padding-left: 1.5rem;
}

.help-content li {
  margin-bottom: 0.25rem;
}

.token-card {
  background: var(--bg-primary);
  border: 2px solid var(--border-color);
  border-radius: 12px;
  padding: 1rem;
  height: 100%;
  transition: all 0.2s ease;
  position: relative;
}

.token-card.status-available {
  border-color: #28a745;
}

.token-card.status-partial {
  border-color: #ffc107;
}

.token-card.status-minimal {
  border-color: #ff9800;
}

.token-card.status-maxed {
  border-color: #dc3545;
}

.token-card.status-incompatible {
  border-color: #dc3545;
}

.token-card.status-neutral {
  border-color: var(--border-color);
}

.token-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 210, 255, 0.1);
}

.token-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
}

.token-info {
  flex: 1;
}

.token-symbol {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--cosmos-accent);
  margin-bottom: 0.25rem;
}

.token-name {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.token-type-badge {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-weight: 500;
}

.badge-native {
  background: rgba(80, 100, 251, 0.1);
  color: var(--cosmos-secondary);
}

.badge-default {
  background: var(--bg-secondary);
  color: var(--text-secondary);
}

.token-details {
  margin-top: 0.75rem;
}

.token-address {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  font-family: monospace;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.address-text {
  cursor: pointer;
  transition: color 0.2s ease;
}

.address-text:hover {
  color: var(--cosmos-accent);
}

.copy-icon {
  font-size: 0.75rem;
  opacity: 0.5;
  transition: opacity 0.2s ease;
}

.token-address:hover .copy-icon {
  opacity: 1;
}

.token-amounts {
  margin-top: 0.5rem;
}

.token-amount {
  font-size: 0.95rem;
  color: var(--text-primary);
}

.token-balance {
  margin-top: 0.25rem;
}

.token-status {
  font-size: 0.85rem;
}

.status-text {
  font-weight: 500;
}

.text-success {
  color: #28a745;
}

.text-warning {
  color: #ffc107;
}

.text-danger {
  color: #dc3545;
}

/* Hover effect when hovering wallet in dropdown */
.token-card.token-hover-eligible {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 6px 20px rgba(0, 255, 136, 0.3);
  border-color: #00ff88;
  z-index: 10;
}

/* Mobile compact list view */
.mobile-token-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.token-card-mobile {
  background: var(--bg-primary);
  border: 2px solid var(--border-color);
  border-radius: 8px;
  transition: all 0.2s ease;
  cursor: pointer;
}

.token-main {
  padding: 0.75rem 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
}

.expand-icon {
  position: absolute;
  right: 1rem;
  font-size: 0.75rem;
  color: var(--text-secondary);
  transition: transform 0.2s ease;
}

.expand-icon.rotated {
  transform: rotate(180deg);
}

.token-expanded-details {
  padding: 0.75rem 1rem;
  border-top: 1px solid var(--border-color);
  background: rgba(0, 0, 0, 0.2);
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  font-size: 0.85rem;
}

.detail-row:last-child {
  margin-bottom: 0;
}

.detail-label {
  color: var(--text-secondary);
  font-weight: 500;
}

.detail-value {
  color: var(--text-primary);
  text-align: right;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.copy-icon-small {
  font-size: 0.65rem;
  opacity: 0.6;
  transition: opacity 0.2s ease;
}

.detail-value:hover .copy-icon-small {
  opacity: 1;
}

.token-card-mobile.status-available {
  border-color: #28a745;
}

.token-card-mobile.status-partial {
  border-color: #ffc107;
}

.token-card-mobile.status-minimal {
  border-color: #ff9800;
}

.token-card-mobile.status-maxed {
  border-color: #dc3545;
}

.token-card-mobile.status-incompatible {
  border-color: #dc3545;
}

.token-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.token-left .token-symbol {
  font-size: 1rem;
  font-weight: 600;
  color: var(--cosmos-accent);
}

.token-left .token-type-badge {
  font-size: 0.65rem;
  padding: 0.15rem 0.35rem;
}

.token-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-right: 1.5rem; /* Space for expand icon */
}

.token-right .token-amount {
  font-size: 0.9rem;
  font-weight: 500;
  text-align: right;
}

.token-status-mobile {
  display: flex;
  align-items: center;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.status-dot.available {
  background-color: #28a745;
}

.status-dot.maxed {
  background-color: #ffc107;
}

.status-dot.incompatible {
  background-color: #dc3545;
}

/* Mobile card hover effect */
.token-card-mobile.token-hover-eligible {
  border-color: #00ff88;
  background: rgba(0, 255, 136, 0.05);
}

/* Mobile responsive styles */
@media (max-width: 768px) {
  .token-card {
    padding: 0.75rem;
  }
  
  .token-symbol {
    font-size: 1rem;
  }
  
  .token-name {
    font-size: 0.8rem;
  }
  
  .token-type-badge {
    font-size: 0.7rem;
    padding: 0.2rem 0.4rem;
  }
  
  .token-address {
    font-size: 0.75rem;
  }
  
  .token-amount {
    font-size: 0.85rem;
  }
  
  .help-tip {
    padding: 0.75rem;
    gap: 0.75rem;
  }
  
  .help-icon {
    font-size: 1.25rem;
  }
  
  .help-content h6 {
    font-size: 0.9rem;
  }
  
  .help-content p {
    font-size: 0.8rem;
  }
}

@media (max-width: 480px) {
  .help-tip {
    padding: 0.65rem;
    font-size: 0.8rem;
  }
  
  .help-icon {
    font-size: 1.1rem;
  }
  
  .help-content h6 {
    font-size: 0.85rem;
  }
  
  .help-content p {
    font-size: 0.75rem;
  }
}
</style>