export default defineNuxtRouteMiddleware(() => {
  const adminPassword = useCookie('admin_password')
  if (!adminPassword.value) {
    return navigateTo('/admin/login')
  }
})
