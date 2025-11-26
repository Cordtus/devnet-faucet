<script setup>
import { reactiveOmit } from '@vueuse/core';
import { TabsTrigger, useForwardProps } from 'reka-ui';
import { cn } from '@/lib/utils';

const props = defineProps({
  value: { type: [String, Number], required: true },
  disabled: { type: Boolean, required: false },
  asChild: { type: Boolean, required: false },
  as: { type: null, required: false },
  class: { type: null, required: false },
});

const delegatedProps = reactiveOmit(props, 'class');

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <TabsTrigger
    data-slot="tabs-trigger"
    :class="
      cn(
        'inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap transition-all duration-300 disabled:pointer-events-none disabled:opacity-50 text-[#626C71] hover:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#30FF6E] data-[state=active]:to-[#00E65A] data-[state=active]:text-black data-[state=active]:shadow-[0_0_20px_rgba(48,255,110,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#30FF6E]/50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=\'size-\'])]:size-4',
        props.class,
      )
    "
    v-bind="forwardedProps"
  >
    <slot />
  </TabsTrigger>
</template>
