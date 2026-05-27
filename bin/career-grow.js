#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const os = require('os')

function parseArgs(argv) {
  const out = { _: [] }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--help' || a === '-h') out.help = true
    else if (a === '--force' || a === '-f') out.force = true
    else if (a === '--dry-run') out.dryRun = true
    else if (a === '--dir' || a === '-d') out.dir = argv[++i]
    else out._.push(a)
  }
  return out
}

function ensureDirSync(p) {
  fs.mkdirSync(p, { recursive: true })
}

function isSubPath(p, seg) {
  const parts = p.split(path.sep).filter(Boolean)
  return parts.includes(seg)
}

function shouldCopy(src) {
  if (src.endsWith(`${path.sep}.git`) || isSubPath(src, '.git')) return false
  if (src.endsWith(`${path.sep}node_modules`) || isSubPath(src, 'node_modules')) return false
  if (isSubPath(src, '.vite') || isSubPath(src, 'dist')) return false
  if (src.endsWith(`${path.sep}work`) || isSubPath(src, 'work')) return false
  if (src.endsWith(`${path.sep}.DS_Store`) || src.includes(`${path.sep}.DS_Store`)) return false
  return true
}

function copyDirSync(src, dest, dryRun) {
  const st = fs.statSync(src)
  if (st.isDirectory()) {
    if (!dryRun) ensureDirSync(dest)
    for (const name of fs.readdirSync(src)) {
      const s = path.join(src, name)
      if (!shouldCopy(s)) continue
      const d = path.join(dest, name)
      copyDirSync(s, d, dryRun)
    }
    return
  }
  if (st.isFile()) {
    if (!dryRun) {
      ensureDirSync(path.dirname(dest))
      fs.copyFileSync(src, dest)
      fs.chmodSync(dest, st.mode)
    }
    return
  }
}

function removeDirSync(p) {
  fs.rmSync(p, { recursive: true, force: true })
}

function printHelp() {
  process.stdout.write(
    [
      '',
      'career-grow 安装脚本（Trae Skill）',
      '',
      '用法：',
      '  npx -y github:visual-req/career-grow',
      '  npx -y github:visual-req/career-grow -- --force',
      '  npx -y github:visual-req/career-grow -- --dir ~/.trae/skills/career-grow',
      '',
      '参数：',
      '  --dir, -d     安装目录（默认 ~/.trae/skills/career-grow）',
      '  --force, -f   覆盖已存在的安装目录',
      '  --dry-run     只打印行为，不写入文件',
      '  --help, -h    显示帮助',
      ''
    ].join('\n')
  )
}

function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.help) {
    printHelp()
    return
  }

  const repoRoot = path.resolve(__dirname, '..')
  const home = os.homedir()
  const defaultDest = path.join(home, '.trae', 'skills', 'career-grow')
  const dest = path.resolve(args.dir ? args.dir.replace(/^~(?=$|\/|\\)/, home) : defaultDest)

  if (!fs.existsSync(path.join(repoRoot, 'car', 'SKILL.md'))) {
    process.stderr.write('安装失败：未找到 car/SKILL.md，请确认当前包内容完整。\n')
    process.exitCode = 1
    return
  }

  if (fs.existsSync(dest)) {
    if (!args.force) {
      process.stderr.write(`安装目录已存在：${dest}\n`)
      process.stderr.write('请使用 --force 覆盖，或使用 --dir 指定其他目录。\n')
      process.exitCode = 1
      return
    }
    if (!args.dryRun) removeDirSync(dest)
  }

  if (args.dryRun) {
    process.stdout.write(`dry-run: copy ${repoRoot} -> ${dest}\n`)
  } else {
    ensureDirSync(path.dirname(dest))
  }

  copyDirSync(repoRoot, dest, Boolean(args.dryRun))

  if (args.dryRun) {
    process.stdout.write('dry-run: 完成（未写入任何文件）。\n')
    return
  }

  process.stdout.write(`已安装到：${dest}\n`)
  process.stdout.write('请重启 Trae，确保该 skill 被加载。\n')
}

main()
