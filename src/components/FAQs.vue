<template>
  <div class="w-full max-w-2xl mx-auto py-10 sm:py-16 md:py-20 px-4 text-white text-center">
    <!-- Top Tagline -->
    <div class="relative flex justify-center w-fit mx-auto items-center mb-8 sm:mb-12 md:mb-14 border border-[#54616380] px-6 sm:px-10 md:px-12 py-1.5 text-center text-xs sm:text-sm font-medium text-[#DDF4FFBF] shadow-[0px_1px_1px_0px_#000000]">
      <BirdIcon class="w-4 h-4 sm:w-5 sm:h-5" />
      <span class="ml-2">The New Computing Standard</span>
      <span class="absolute top-0 -right-0.5 h-1 w-1 bg-[#C8FFD8]"></span>
      <span class="absolute -right-0.5 bottom-0 h-1 w-1 bg-[#C8FFD8]"></span>
      <span class="absolute top-0 -left-0.5 h-1 w-1 bg-[#C8FFD8]"></span>
      <span class="absolute bottom-0 -left-0.5 h-1 w-1 bg-[#C8FFD8]"></span>
    </div>

    <!-- Title -->
    <h2 class="text-2xl sm:text-3xl md:text-4xl bg-clip-text text-transparent bg-[linear-gradient(180deg,#999999_17.17%,#FFFFFF_71.46%)] font-bold mt-4 sm:mt-6 md:mt-8 mb-6 sm:mb-8 md:mb-12">
      Frequently Asked Questions
    </h2>

    <!-- FAQ List -->
    <Accordion
      type="single"
      collapsible
      class="w-full space-y-2"
      default-value="item-1"
    >
      <AccordionItem
        v-for="(faq, index) in faqs"
        :key="index"
        class="bg-gradient-to-r px-2 from-[#0D0F0F] to-[#0A0C0C] border border-[#5E5E5E40] rounded-xl"
        :value="`item-${index + 1}`"
      >
        <AccordionTrigger class="text-[#626C71] font-semibold md:text-lg sm:text-base xs:text-sm">
          {{ faq.question }}
        </AccordionTrigger>
        <AccordionContent>
          <p class="text-left">{{ faq.answer }}</p>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  </div>
</template>

<script setup>
import BirdIcon from '../svg/BirdIcon.vue';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';

const faqs = [
  {
    question: 'How do I earn points?',
    answer:
      'You can earn points by completing activities such as connecting your wallet, joining the community, and participating in events.',
  },
  {
    question: 'When are points updated?',
    answer:
      'Points are updated automatically every Friday at 00:00 UTC during the distribution cycle.',
  },
  {
    question: 'What are points used for?',
    answer:
      'Points can be used to access exclusive features, rewards, or airdrops based on your leaderboard position.',
  },
];
</script>
