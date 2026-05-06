const path = require('path')
const fs = require('fs')

/**
 * Removes native ONNX runtime binaries for platforms other than the one being built.
 * Runs after electron-builder packs the app (before signing/installer creation).
 *
 * Both the top-level onnxruntime-node and the nested copy inside @xenova/transformers
 * are fully unpacked via asarUnpack, so both can be cleaned here.
 */
exports.default = async function ({ appOutDir, electronPlatformName }) {
  const exclude = {
    darwin: ['linux', 'win32'],
    linux: ['darwin', 'win32'],
    win32: ['darwin', 'linux'],
  }[electronPlatformName]

  if (!exclude || !exclude.length) return

  const unpackedModules = path.join(
    appOutDir,
    'resources',
    'app.asar.unpacked',
    'node_modules'
  )

  const onnxRoots = [
    path.join(unpackedModules, 'onnxruntime-node', 'bin', 'napi-v3'),
    path.join(
      unpackedModules,
      '@xenova',
      'transformers',
      'node_modules',
      'onnxruntime-node',
      'bin',
      'napi-v3'
    ),
  ]

  let totalRemoved = 0

  for (const root of onnxRoots) {
    if (!fs.existsSync(root)) continue
    for (const platform of exclude) {
      const target = path.join(root, platform)
      if (fs.existsSync(target)) {
        const sizeMB = getDirSizeMB(target)
        fs.rmSync(target, { recursive: true, force: true })
        totalRemoved += sizeMB
        console.log(`[afterPack] Removed unused platform binaries (${sizeMB}MB): ${target}`)
      }
    }
  }

  if (totalRemoved > 0) {
    console.log(`[afterPack] Total freed: ~${totalRemoved}MB`)
  }
}

function getDirSizeMB(dirPath) {
  let total = 0
  try {
    for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
      const full = path.join(dirPath, entry.name)
      if (entry.isDirectory()) {
        total += getDirSizeMB(full)
      } else {
        total += fs.statSync(full).size
      }
    }
  } catch {
    // ignore
  }
  return Math.round(total / 1024 / 1024)
}
