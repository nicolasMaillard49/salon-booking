export default defineNuxtConfig({
  modules: ['@nuxt/ui'],
  runtimeConfig: {
    public: {
      apiUrl: process.env.NUXT_PUBLIC_API_URL || 'http://localhost:3001',
    },
  },
  colorMode: {
    preference: 'light',
  },
})
