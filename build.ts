import { compilerOptions } from './tsconfig.json'
import esbuild from 'esbuild'
import { join } from 'path'
import { nodeExternalsPlugin } from 'esbuild-node-externals'

const DEFAULT_SOURCE_ENTRY_FILE = 'index.ts'
const DEFAULT_DEST_ENTRY_FILE = 'index.js'
const DEFAULT_SOURCE = 'src'
const DEFAULT_DEST = 'built'

const BASE_SOURCE = join(process.cwd(), DEFAULT_SOURCE)
const BASE_DEST = join(process.cwd(), DEFAULT_DEST)

const argv: string[] = process.argv

interface Command {
    source: string
    destination: string
    platform: esbuild.Platform
    minify: boolean
    bundle: boolean
}

/**
 * 
 * @param args
 * @param source 
 * @param dest 
 * @param defaultSourceEntryFile 
 * @returns config object with the args passed in package.json
 */
const createConfig = (args: string[] = argv, source: string = BASE_SOURCE
    , dest: string = BASE_DEST, defaultSourceEntryFile: string = DEFAULT_SOURCE_ENTRY_FILE
): Command => {

    let _config: Command = {
        source: join(source, defaultSourceEntryFile),
        destination: join(dest),
        platform: 'node',
        minify: false,
        bundle: false
    }


    const _flags = ['minify', 'bundle']
    let _index: number, _arg: string, _value: string


    args.forEach((arg) => {
        if (arg.startsWith('--')) {
            _index = args.indexOf(arg)
            _value = args[_index + 1]
            _arg = arg.replace('--', '')

            if (_arg === 'target') {
                _config.source = join(source, _value)
                _config.destination = join(dest, _value)
            }

            if (_arg === 'platform') {
                _config.platform = <esbuild.Platform>_value
            }

            if (_flags.includes(_arg)) {
                if (_arg === 'minify') {
                    _config.minify = true
                }

                if (_arg === 'bundle') {
                    _config.bundle = true
                }
            }
        }
    })
    return _config

}

/**
 * ESM bundler
 * @param config 
 * @param target 
 * @param sourceMap 
 */
const esmBuild = (config: Command, target: string, sourceMap: boolean) => {
    const { destination, source, bundle, minify } = config
    const _format = 'esm'
    const _dest = join(destination, _format)
    esbuild.build({
        entryPoints: [source],
        outdir: _dest,
        bundle: bundle,
        sourcemap: sourceMap,
        minify: minify,
        format: _format,
        define: { global: 'window' },
        target: [target],
        plugins: [nodeExternalsPlugin()]
    }).catch(() => process.exit(1))
}

/**
 * CJS bundler based platform
 * @param config
 * @param sourceMap 
 */
const standardBuild = (config: Command, sourceMap: boolean) => {
    const { destination, source, bundle, minify, platform } = config
    const _format = 'cjs'
    const _dest = join(destination, _format, DEFAULT_DEST_ENTRY_FILE)
    const _nodeVersion = process.version.replace('v', 'node')
    esbuild.build({
        entryPoints: [source],
        outfile: _dest,
        bundle: bundle,
        sourcemap: sourceMap,
        minify: minify,
        platform: platform,
        target: [_nodeVersion],
        plugins: [nodeExternalsPlugin()]
    }).catch(() => process.exit(1))
}

try {

    const config = createConfig()
    esmBuild(config, compilerOptions.target, compilerOptions.sourceMap)
    standardBuild(config, compilerOptions.sourceMap)

} catch (e) {
    throw e as Error
}


export { }