import { defineConfig } from 'vitest/config'

// Tests live outside src so the library build (tsconfig include: ["src"]) never
// sees them and they never end up in dist.
export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['test/**/*.test.tsx'],
  },
})
