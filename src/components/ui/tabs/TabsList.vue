<script setup>
import { reactiveOmit } from '@vueuse/core';
import { TabsList } from 'reka-ui';
import { cn } from '@/lib/utils';

const props = defineProps({
  loop: { type: Boolean, required: false },
  asChild: { type: Boolean, required: false },
  as: { type: null, required: false },
  class: { type: null, required: false },
});

const delegatedProps = reactiveOmit(props, 'class');
</script>

<template>
  <TabsList
    data-slot="tabs-list"
    v-bind="delegatedProps"
    :class="
      cn(
        'bg-gradient-to-r from-[#0D0F0F] to-[#0A0C0C] border border-[#30FF6E]/20 text-muted-foreground inline-flex h-10 w-fit items-center justify-center rounded-full p-1 shadow-[0_0_20px_rgba(48,255,110,0.1)] backdrop-blur-sm',
        props.class,
      )
    "
  >
    <slot />
  </TabsList>
</template>
