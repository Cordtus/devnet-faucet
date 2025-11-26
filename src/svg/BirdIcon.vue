<template>
  <svg
    :width="width"
    :height="height"
    viewBox="0 0 13 14"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    v-bind="$attrs"
  >
    <g filter="url(#filter0_d_1_5558)">
      <path
        d="M6.10126 0C6.26165 0.472804 6.57286 0.990854 6.19701 1.20751C5.27295 1.73513 4.24834 2.20099 3.65465 3.37881C2.75931 5.15273 2.48137 9.37325 1 10.3069C2.16346 10.3979 3.14713 9.91668 3.60677 9.24877C3.77674 10.0699 4.38719 10.8527 5.11495 11.2764C4.99047 10.5822 5.07186 9.85443 5.5698 9.06204C5.9648 9.61025 6.31432 10.4816 7.33653 10.8647C6.94393 10.2063 7.00856 9.60068 7.08038 8.84898C7.29105 9.49295 8.00205 10.0459 8.82557 10.259C8.42338 9.81374 8.25341 9.16977 8.32284 8.67901C8.67235 9.2751 9.36181 9.59828 9.92917 9.6294C6.25926 5.32988 8.76332 2.64866 11.83 4.97557C11.818 3.78578 11.0783 3.37881 10.2212 2.68457C10.1997 2.3159 9.99142 1.98314 9.8023 1.64656C8.51675 1.4074 6.89365 0.640859 6.10126 0ZM8.04514 1.79259C8.66996 2.05257 9.15114 2.33266 9.39532 2.64148C8.99793 2.5553 8.44253 2.55769 7.71956 2.61514C8.07866 2.38293 8.11456 2.09566 8.04514 1.79259Z"
        fill="#DDF4FF"
        fill-opacity="0.75"
        shape-rendering="crispEdges"
      />
    </g>
    <defs>
      <filter
        id="filter0_d_1_5558"
        x="0"
        y="0"
        width="12.8301"
        height="13.2765"
        filterUnits="userSpaceOnUse"
        color-interpolation-filters="sRGB"
      >
        <feFlood flood-opacity="0" result="BackgroundImageFix" />
        <feColorMatrix
          in="SourceAlpha"
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          result="hardAlpha"
        />
        <feOffset dy="1" />
        <feGaussianBlur stdDeviation="0.5" />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0"
        />
        <feBlend
          mode="normal"
          in2="BackgroundImageFix"
          result="effect1_dropShadow_1_5558"
        />
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="effect1_dropShadow_1_5558"
          result="shape"
        />
      </filter>
    </defs>
  </svg>
</template>

<script setup>
// Accept width, height, and class props
defineProps({
  width: {
    type: [Number, String],
    default: 13,
  },
  height: {
    type: [Number, String],
    default: 14,
  },
  class: {
    type: String,
    default: '',
  },
});
</script>
