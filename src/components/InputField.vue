<template>
  <div
    :class="[
      'flex flex-row items-center gap-[11px] h-[50px] rounded-lg transition-all duration-200',
      'bg-[linear-gradient(180deg,#0D0F0F_0%,#0A0C0C_44.23%)]',
      'border',
      isConnected
        ? 'border-[#00FF6F] [box-shadow:inset_0px_0.5px_0.5px_rgba(0,255,111,0.25),inset_0px_2px_2px_rgba(0,255,111,0.05)]'
        : 'border-[rgba(94,94,94,0.25)] [box-shadow:inset_0px_0.5px_0.5px_rgba(213,255,247,0.25),inset_0px_2px_2px_rgba(213,255,247,0.05)]',
      'px-6 py-[5px]'
    ]"
  >
    <div
      v-if="$slots.leftSection"
      :class="[
        'flex-shrink-0 flex items-center',
        isConnected ? 'text-[#00FF6F]' : 'text-[#626C71]'
      ]"
    >
      <slot name="leftSection"></slot>
    </div>
    
    <Input
      v-bind="$attrs"
      :class="[
        'border-0 bg-transparent outline-0 p-0 focus-visible:ring-0 font-medium text-base leading-[19px] tracking-[-0.05em]',
        fullWidth ? 'w-full' : '',
        isConnected ? 'text-[#00FF6F]' : 'text-[#626C71]',
        className
      ]"
    />
    
    <div
      v-if="$slots.rightSection"
      :class="[
        'flex-shrink-0 flex items-center',
        isConnected ? 'text-[#00FF6F]' : 'text-[#626C71]'
      ]"
    >
      <slot name="rightSection"></slot>
    </div>
  </div>
</template>

<script setup>
import { Input } from './ui/input';

defineProps({
  fullWidth: {
    type: Boolean,
    default: false,
  },
  isConnected: {
    type: Boolean,
    default: false,
  },
  className: {
    default: '',
  },
});
</script>
