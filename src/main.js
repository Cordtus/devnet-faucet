import { VueQueryPlugin } from '@tanstack/vue-query';
import { createApp } from 'vue';
import Vue3Lottie from 'vue3-lottie';
import 'vue-sonner/style.css';
import App from './App.vue';
import './assets/main.css';

const app = createApp(App);

app.use(VueQueryPlugin);

app.use(Vue3Lottie);

app.mount('#app');
