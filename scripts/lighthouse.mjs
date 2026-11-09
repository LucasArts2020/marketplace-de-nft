import { spawn } from 'node:child_process'
import console from 'node:console'
import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { once } from 'node:events'
import { join, resolve } from 'node:path'
import { setTimeout } from 'node:timers/promises'
import process from 'node:process'
import { chromium } from '@playwright/test'

const host = '127.0.0.1'
const port = '4183'
const origin = `http://${host}:${port}`
const output = resolve('audit/lighthouse/latest')
const browser = process.env.CHROME_PATH || [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  chromium.executablePath(),
].find(existsSync)
if (!browser) throw new Error('Instale Chromium com Playwright ou configure CHROME_PATH.')

async function run(args, env = process.env) {
  const child = spawn(process.execPath, args, { stdio: 'inherit', env })
  const [code] = await once(child, 'exit')
  if (code !== 0) throw new Error(`Comando retornou ${code}: ${args.join(' ')}`)
}

await run(['node_modules/vite/bin/vite.js', 'build'])
await mkdir(output, { recursive: true })
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', host, '--port', port, '--strictPort'], {
  stdio: ['ignore', 'pipe', 'inherit'],
})
const ready = new Promise((resolveReady, rejectReady) => {
  server.stdout.on('data', (data) => {
    if (data.toString().includes(origin)) resolveReady()
  })
  server.once('error', rejectReady)
  server.once('exit', (code) => rejectReady(new Error(`Preview terminou com código ${code}.`)))
})

const targets = [
  { name: 'inicio', path: '/' },
  { name: 'detalhe', path: '/nfts/emerald-ape-042' },
]
const categories = { performance: 90, accessibility: 95, 'best-practices': 95, seo: 90 }
const profiles = ['mobile', 'desktop']
const chromeFlags = '--headless --no-first-run --no-default-browser-check'
const rows = new Map()
const environment = []
const median = (values) => values.toSorted((left, right) => left - right)[Math.floor(values.length / 2)]

try {
  await Promise.race([ready, setTimeout(10_000, false, { ref: false }).then(() => { throw new Error('Preview indisponível.') })])
  for (const round of [1, 2, 3]) {
    for (const profile of profiles) {
      for (const target of targets) {
        const key = `${target.name}-${profile}`
        const base = join(output, `${key}-${round}`)
        await run(['node_modules/lighthouse/cli/index.js', origin + target.path,
          `--chrome-flags=${chromeFlags}`, '--output=json', '--output=html', `--output-path=${base}`, '--quiet',
          ...(profile === 'desktop' ? ['--preset=desktop'] : []),
        ], { ...process.env, CHROME_PATH: browser })
        const report = JSON.parse(await readFile(base + '.report.json', 'utf8'))
        if (report.runtimeError || report.finalDisplayedUrl !== origin + target.path) throw new Error(`Auditoria inválida: ${key} rodada ${round}.`)
        if (round === 1) environment.push({ key, version: report.lighthouseVersion, browser: report.environment.hostUserAgent, config: report.configSettings })
        const data = Object.fromEntries(Object.keys(categories).map((name) => [name, report.categories[name].score * 100]))
        data.lcpMs = report.audits['largest-contentful-paint'].numericValue
        data.cls = report.audits['cumulative-layout-shift'].numericValue
        data.tbtMs = report.audits['total-blocking-time'].numericValue
        rows.set(key, [...(rows.get(key) ?? []), data])
      }
    }
  }
  const summary = [...rows].map(([key, runs]) => ({
    key,
    ...Object.fromEntries(Object.keys(runs[0]).map((metric) => [metric, median(runs.map((run) => run[metric]))])),
  }))
  console.table(summary)
  await writeFile(join(output, 'summary.json'), JSON.stringify({ node: process.version, platform: process.platform, categories, environment, summary }, null, 2) + '\n')
  if (summary.some((row) => Object.entries(categories).some(([name, threshold]) => row[name] < threshold))) process.exitCode = 1
} finally {
  server.kill()
}
