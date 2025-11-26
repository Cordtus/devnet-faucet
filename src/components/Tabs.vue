<template>
    <Tabs class="max-w-3xl mx-auto" default-value="faucet">
      <TabsList>
        <!-- <TabsTrigger value="network">Network Info</TabsTrigger> -->
        <TabsTrigger value="faucet">Token Faucet</TabsTrigger>
        <TabsTrigger value="recent">Recent Txs</TabsTrigger>
      </TabsList>
      <!-- <TabsContent value="network">
        <NetworkInfo />
      </TabsContent> -->
      <TabsContent value="faucet">
        <FaucetTab />
      </TabsContent>
      <TabsContent value="recent">
        <RecentTransactionsTab />
      </TabsContent>
    </Tabs>
</template>

<script setup>
import { ref } from 'vue';
import { useTransactions } from '../composables/useTransactions';
import FaucetTab from './tabs/FaucetTab.vue';
import NetworkInfo from './tabs/NetworkInfo.vue';
import RecentTransactionsTab from './tabs/RecentTransactionsTab.vue';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

const activeTab = ref('faucet');
const { recentTransactions } = useTransactions();
</script>