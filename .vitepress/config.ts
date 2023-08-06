import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Bug Repro",
  description: "Vite Build Stuck Forever Bug Repro",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
    ],

    sidebar: [
      {
        text: 'Bug',
        items: [
          { text: 'Bug', link: '/bug' },
        ]
      }
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/nekomeowww/vitepress-build-forever-bug-repro' }
    ]
  }
})
