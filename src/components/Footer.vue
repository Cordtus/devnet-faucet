<template>
  <footer class="w-full bg-[url('../assets/images/footer2-bg.png')] bg-center bg-no-repeat bg-contain">
    <div class="flex justify-between">
      <Vue3Lottie
        :animationData="WireworkCorner"
        :loop="true"
        :width="207"
        :height="177"
        class="!w-40 !m-0 -rotate-y-180"
      />
      <div class="flex">
        <Vue3Lottie
          :animationData="WireworkCenter"
          :loop="true"
          :width="207"
          :height="177"
          class="!max-w-80 !m-0"
        />
        <Vue3Lottie
          :animationData="WireworkCenter"
          :loop="true"
          :width="207"
          :height="177"
          class="!max-w-80 !m-0 -rotate-y-180"
        />
      </div>
      <Vue3Lottie
        :animationData="WireworkCorner"
        :loop="true"
        :width="207"
        :height="177"
        class="!w-40 !m-0"
      />
    </div>
    <div class="bg-top z-20 relative pt-52 2xl:pt-60 2xl:-mt-52 -mt-44 bg-cover bg-repeat-x sm:bg-[url('../assets/images/footer-base-bg.png')]">
      <div class="mx-auto pb-20 px-6 md:px-12 max-w-7xl gap-12 flex max-sm:flex-col justify-between">
        <!-- Brand Section -->
        <div class="flex flex-col sm:w-1/3 overflow-visible">
          <CompanyLogo
            :width="115"
            :height="26"
            class="w-24 sm:w-28 h-auto"
          />

          <p class="max-w-sm text-sm gap-2 mt-8 sm:text-base font-primary text-[#DDF4FFBF]">
            Powering the new order of computing.
          </p>

          <div class="button-icon-container mt-5 sm:mt-4 flex items-center gap-[0.75rem]">
            <a href="https://x.com/republicfdn" target="_blank" class="button-icon inline-block hover:scale-110 transition-all duration-[150ms] hover:brightness-125">
              <XCircleIcon />
            </a>
            <a href="https://github.com/RepublicAI" target="_blank" class="button-icon inline-block hover:scale-110 transition-all duration-[150ms] hover:brightness-125">
              <GithubCircleIcon />
            </a>
            <a href="https://discord.com/invite/therepublic" target="_blank" class="button-icon inline-block hover:scale-110 transition-all duration-[150ms] hover:brightness-125">
              <TelegramCircleIcon />
            </a>
            <a href="https://whitepaper.republicai.io/" target="_blank" class="button-icon inline-block hover:scale-110 transition-all duration-[150ms] hover:brightness-125">
              <DocumentCircleIcon />
            </a>
          </div>

          <p class="mt-2 sm:mt-4 text-xs sm:text-sm font-primary text-[#DDF4FFBF]">
            Copyright © 2025 IGCF. All rights reserved.
          </p>
        </div>
        <img
          src="../assets/images/footer-vertical-line.png"
          alt="line"
          width="24"
          height="158"
          class="max-sm:hidden"
        />

        <div class="grid sm:grid-cols-2 gap-12 md:gap-28 md:grid-cols-4">
          <!-- Documentation -->
          <div>
            <h3 class="mb-2 sm:mb-3 text-xs sm:text-sm font-semibold text-white">
              DOCUMENTATION
            </h3>
            <ul class="space-y-1.5 font-primary sm:space-y-2 text-xs sm:text-sm text-[#DDF4FFBF]">
              <li>
                <a
                  href="https://docs.republicai.io/docs/introduction"
                  class="transition hover:text-white"
                  target="_blank"
                >
                  Getting Started
                </a>
              </li>
              <li>
                <a
                  href="https://docs.republicai.io/docs/introduction"
                  class="transition hover:text-white"
                  target="_blank"
                >
                  API Reference
                </a>
              </li>
              <li>
                <a
                  href="https://docs.republicai.io/"
                  class="transition hover:text-white"
                  target="_blank"
                >
                  Integrations
                </a>
              </li>
              <li>
                <a
                  href="https://docs.republicai.io/"
                  class="transition hover:text-white"
                  target="_blank"
                >
                  SDKs
                </a>
              </li>
            </ul>
          </div>

          <!-- Resources 1 -->
          <div>
            <h3 class="mb-2 sm:mb-3 text-xs sm:text-sm font-semibold text-white">
              COMPANY
            </h3>
            <ul class="text-[#DDF4FFBF] font-primary space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
              <li>
                <a
                  href="https://docs.republicai.io/"
                  class="transition hover:text-white"
                  target="_blank"
                >
                  Changelog
                </a>
              </li>
              <li>
                <a
                  href="https://docs.republicai.io/"
                  class="transition hover:text-white"
                  target="_blank"
                >
                  Validator Quickstart
                </a>
              </li>
              <li>
                <a
                  href="https://docs.republicai.io/"
                  class="transition hover:text-white"
                  target="_blank"
                >
                  Client Quickstart
                </a>
              </li>
              <li>
                <a
                  href="https://whitepaper.republicai.io/"
                  class="transition hover:text-white"
                  target="_blank"
                >
                  Whitepaper
                </a>
              </li>
            </ul>
          </div>

          <!-- Resources 2 -->
          <div>
            <h3 class="mb-3 text-sm font-semibold text-white">
              RESOURCES
            </h3>
            <ul class="space-y-2 font-primary text-sm text-[#DDF4FFBF]">
              <li>
                <a
                  href="https://docs.republicai.io/"
                  class="transition hover:text-white"
                  target="_blank"
                >
                  Documentation
                </a>
              </li>
              <li>
                <a
                  href="https://cdn.prod.website-files.com/68c6ab111eb5a797aedfa7bd/68dbb0e416c94898cf96e570_Republic_L1_WhitePaper.pdf"
                  class="transition hover:text-white"
                  target="_blank"
                >
                  Whitepaper
                </a>
              </li>
              <li>
                <a
                  href="https://docs.republicai.io/"
                  class="transition hover:text-white"
                  target="_blank"
                >
                  Block Explorer
                </a>
              </li>
            </ul>
          </div>

          <!-- Legal -->
          <div>
            <h3 class="mb-2 sm:mb-3 text-xs sm:text-sm font-semibold text-white">
              Legal
            </h3>
            <ul class="space-y-1.5 font-primary sm:space-y-2 text-xs sm:text-sm text-[#DDF4FFBF]">
              <li>
                <a
                  href="https://docs.republicai.io/"
                  class="transition hover:text-white"
                  target="_blank"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="https://docs.republicai.io/"
                  class="transition hover:text-white"
                  target="_blank"
                >
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup>
import WireworkCenter from '../assets/lottie/wirework-center-footer.json';
import WireworkCorner from '../assets/lottie/wirework-corner-footer.json';
import CompanyLogo from '../svg/CompanyLogo.vue';
import DocumentCircleIcon from '../svg/DocumentCircleIcon.vue';
import GithubCircleIcon from '../svg/GithubCircleIcon.vue';
import TelegramCircleIcon from '../svg/TelegramCircleIcon.vue';
import XCircleIcon from '../svg/XCircleIcon.vue';
</script>
