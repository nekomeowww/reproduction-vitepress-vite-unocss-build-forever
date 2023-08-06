# reproduction-vitepress-vite-unocss-build-forever

This is a reproduction repo for a bug I found when using VitePress.

When the following content appears in Markdown document and try to browse and build with VitePress that configures UnoCSS and Vite:

```markdown
[https://example.com/documentation/](https://example.com/documentation/)
```

and the following issues occur.

### Issue 1: Never be able to navigate

After executed `pnpm docs:dev` or (`nr docs:dev`) command, the development server is running without any complaints and the bugged page is rendered correctly when navigate to, the server hangs and would be stuck once and only when you try to navigate back to the other pages.

### Issue 2: Build forever

After executed `pnpm docs:dev` or (`nr docs:dev`) command, the building rotating indicator before `building client + server bundles...` would stop to rotate after a few seconds, and this will eventually result in never ending build process that stuck forever. The shell looks like this:

```shell
nr docs:build

> @ docs:build ~/Git/reproduction-vitepress-vite-unocss-build-forever
> vitepress build


  vitepress v1.0.0-beta.7

⠙ building client + server bundles...
```

### Issue 3: Defunct processes

If you try to interrupt the stuck build process with Ctrl-C, the execution will be 'interrupted' while the true build process is still running in the background and eating 100% CPU.

After executed `pnpm docs:build` or (`nr docs:build`) command, the process tree looks like this when pulling out another terminal to inspect:

```shell
❯ pstree 09115
-+= 09115 neko /bin/zsh -il
 |-+= 12787 neko node ~/Library/pnpm/global/5/node_modules/@antfu/ni/bin/nr.mjs docs:build
 | \-+- 12793 neko node ~/Library/pnpm/global/5/node_modules/@antfu/ni/bin/nr.mjs docs:build
 |   \-+- 12817 neko /opt/homebrew/Cellar/volta/1.1.1_2/libexec/bin/volta run pnpm run docs:build
 |     \-+- 12818 neko node ~/.volta/tools/image/packages/pnpm/bin/pnpm run docs:build
 |       \-+- 12837 neko node ~/Git/reproduction-vitepress-vite-unocss-build-forever/node_modules/.bin/../vitepress/bin/vitepress.js build
 |         \--- 12843 neko ~/Git/reproduction-vitepress-vite-unocss-build-forever/node_modules/.pnpm/@esbuild+darwin-arm64@0.18.18/node_modules/@esbuild/darwin-arm64/bin/esbuild --service=0.18.18 --ping
 \--= 09722 neko /bin/zsh -il
```

If you look up the CPU and memory usage, you will find the node process pid `12837` is consuming 100% CPU:

```shell
❯ ps -p 12837 -o %cpu,%mem
 %CPU %MEM
100.0  1.8
```

Then use Ctrl-C to interrupt the build process, and the process tree for the same zsh shell pid `09115` looks like this afterwards:

```shell
❯ pstree 09115
-+= 09115 neko /bin/zsh -il
 \--= 09722 neko /bin/zsh -il
```

You may notice this process tree is now empty, but the process tree for the VitePress build process pid `12837` is still there with a defunct child process:

```shell
❯ pstree 12837
-+- 12837 neko node ~/Git/reproduction-vitepress-vite-unocss-build-forever/node_modules/.bin/../vitepress/bin/vitepress.js build
 \--- 12843 neko <defunct>
```

By this time, the CPU usage for the node process pid `12837` is still 100%:

```shell
❯ ps -p 12837 -o %cpu,%mem
 %CPU %MEM
100.0  1.8
```

After few minutes, the shell that used to interact with `pnpm docs:build` or (`nr docs:build`) command may suddenly respond `[vite:esbuild-transpile] The service was stopped: write EPIPE` error even when you have interrupted the build process already.

## Troubleshooting

- I tried to check the content above, nor invisible and control characters found.
- Tried to update all the dependencies.
- Tried to disable every plugin I used in Vite, I found that the issue is caused by the `unocss` plugin only when `presetUno()` UnoCSS plugin was enabled.
- It looks like the url content must have a valid and resolvable host, otherwise the issue won't occur. (FYI, the initial url that caused the issue was `https://www.swift.org/documentation/`)

## Further more

Another thing is, I think either Vite or esbuild should have a better way to handle the timeout issue when building forever and deal with the child process to prevent defunct process. Otherwise, if user keep retry and interrupt the build process, the defunct process will keep increasing and cause the system to stay on high load with loads of defunct processes that consume 100% CPU and memory.
