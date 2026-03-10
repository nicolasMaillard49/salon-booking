<template>
  <footer class="bg-zinc-900 text-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
      <div class="grid md:grid-cols-3 gap-10 md:gap-16">
        
        <!-- Brand -->
        <div class="space-y-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
              <img src="/faveicon.png" alt="Nm.D.Barber" class="w-8 h-8 object-contain" />
            </div>
            <div>
              <span class="text-xl font-bold">Nm.D.</span>
              <span class="text-xl font-bold text-red-500">Barber</span>
            </div>
          </div>
          <p class="text-zinc-400 text-sm leading-relaxed max-w-xs">
            Votre barber de confiance. Coupes modernes, barbe soignée, style garanti.
          </p>
          <div class="flex gap-3">
            <a href="#" class="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
              <UIcon name="i-heroicons-globe-alt" class="w-5 h-5" />
            </a>
            <a href="#" class="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
              <UIcon name="i-heroicons-envelope" class="w-5 h-5" />
            </a>
          </div>
        </div>

        <!-- Links -->
        <div class="space-y-4">
          <h3 class="font-semibold text-white">Navigation</h3>
          <ul class="space-y-3">
            <li>
              <NuxtLink to="/" class="text-zinc-400 hover:text-white transition-colors text-sm">Réserver</NuxtLink>
            </li>
            <li>
              <NuxtLink to="/realisations" class="text-zinc-400 hover:text-white transition-colors text-sm">Réalisations</NuxtLink>
            </li>
            <li>
              <NuxtLink to="/mes-rdv" class="text-zinc-400 hover:text-white transition-colors text-sm">Mes RDV</NuxtLink>
            </li>
          </ul>
        </div>

        <!-- Contact -->
        <div class="space-y-4">
          <h3 class="font-semibold text-white">Contact</h3>
          <ul class="space-y-3 text-sm">
            <li class="flex items-center gap-2 text-zinc-400">
              <UIcon name="i-heroicons-map-pin" class="w-4 h-4 text-red-500" />
              <span>123 Rue du Barber, 75000 Paris</span>
            </li>
            <li class="flex items-center gap-2 text-zinc-400">
              <UIcon name="i-heroicons-phone" class="w-4 h-4 text-red-500" />
              <span>+33 1 23 45 67 89</span>
            </li>
            <li class="flex items-center gap-2 text-zinc-400">
              <UIcon name="i-heroicons-envelope" class="w-4 h-4 text-red-500" />
              <span>contact@nmdbarber.fr</span>
            </li>
          </ul>
        </div>
      </div>

      <div class="h-px bg-white/10 my-10" />

      <div class="flex flex-col md:flex-row items-center justify-between gap-4">
        <p class="text-zinc-500 text-sm">
          © {{ new Date().getFullYear() }} Nm.D.Barber. Tous droits réservés.
        </p>
        <NuxtLink 
          to="/admin" 
          class="text-zinc-500 hover:text-white text-sm transition-colors"
        >
          Espace admin
        </NuxtLink>
      </div>
    </div>
  </footer>
</template>