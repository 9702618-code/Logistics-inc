<script setup lang="ts">
import { RouterLink, RouterView, useRoute } from 'vue-router'

const route = useRoute();
</script>

<template>
  <div class="app-container">
    <header class="app-header">
      <div class="logo">
        <span class="icon">🏭</span> Logistics Terminal
      </div>
      <nav class="nav-links">
        <!-- Додаємо @click для очищення URL, якщо ми вже на цій сторінці -->
        <RouterLink to="/stackers" class="nav-link" @click="route.query = {}">Диспетчерська</RouterLink>
      </nav>
    </header>

    <main class="main-content">
      <!-- ДОДАНО :key="route.fullPath" -->
      <RouterView :key="route.fullPath" />
    </main>
  </div>
</template>

<style>
:root {
  --bg-color: #f0f2f5;
  --panel-bg: #ffffff;
  --text-main: #1f2937;
  --text-muted: #6b7280;
  --primary: #3b82f6;
  --primary-hover: #2563eb;
  --danger: #ef4444;
  --border: #e5e7eb;
}

body {
  margin: 0;
  font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  background-color: var(--bg-color);
  color: var(--text-main);
}

.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background: white;
  padding: 1rem 2rem;
  display: flex;
  align-items: center;
  gap: 3rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  border-bottom: 1px solid var(--border);
}

.logo {
  font-size: 1.25rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.nav-link {
  text-decoration: none;
  color: var(--text-muted);
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  transition: all 0.2s;
}

.nav-link:hover, .nav-link.router-link-active {
  color: var(--primary);
  background: #eff6ff;
}

.main-content {
  flex: 1;
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
}
</style>