import { createRouter, createWebHistory } from 'vue-router';
import ColorPaletteGenerator from '../components/ColorPaletteGenerator.vue';
import PaletteLibrary from '../components/PaletteLibrary.vue';

const routes = [
  {
    path: '/',
    name: 'ColorPaletteGenerator',
    component: ColorPaletteGenerator,
  },
  {
    path: '/library',
    name: 'PaletteLibrary',
    component: PaletteLibrary,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
