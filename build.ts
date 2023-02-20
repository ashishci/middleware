import { join } from 'path';


const DEFAULT_SOURCE_ENTRY_FILE = 'index.ts'
const DEFAULT_DEST_ENTRY_FILE = 'index.js'
const DEFAULT_SOURCE = 'src'
const DEFAULT_DEST = 'built'

const BASE_SOURCE = join(process.cwd(), DEFAULT_SOURCE)
const BASE_DEST = join(process.cwd(), DEFAULT_DEST)

const argv: string[] = process.argv

type Command = {
    source: string
    destination: string
    platform: string
    minify: string | null
    bundle: string | null
}


const createConfig = (args: string[] = argv, source: string = BASE_SOURCE
    , dest: string = BASE_DEST, defaultSourceEntryFile: string = DEFAULT_SOURCE_ENTRY_FILE
    , defaultDestEntryFile = DEFAULT_DEST_ENTRY_FILE
): Command => {

    let _config: Command = {
        source: join(source, defaultSourceEntryFile),
        destination: `outfile=${join(dest, defaultDestEntryFile)}`,
        platform: 'node',
        minify: null,
        bundle: null
    }

    type ObjectKey = keyof typeof _config
    const _flags = ['minify', 'bundle']
    let _index: number, _arg: string, _value: string, _key: keyof Command


    args.forEach((arg) => {
        if (arg.startsWith('--')) {
            _index = args.indexOf(arg)
            _key = <ObjectKey>arg.replace('--', '')
            _value = args[_index + 1]

            if (_key.valueOf() === 'target') {
                _config.source = join(source, _value, defaultSourceEntryFile)
                _config.destination = `outfile=${join(dest, _value, defaultDestEntryFile)}`
            }

            if (_key.valueOf() === 'platform') {
                _config.platform = `${arg}=${_value}`
            }

            if (_flags.includes(_key.valueOf())) {
                _index = _flags.indexOf(_key.valueOf());
                _config[_key] = arg
            }
        }
    })
    return _config

}

try {
    const config = createConfig()
    console.log(config)

} catch (e) {
    throw e as Error
}


export { }