# middleware

This repository is for all shared middleware that can be consumed across projects

# Middleware(s)

- Redis-cache

  - client
    - param config
      - {host:string, port:number, password:string}
      - Optional: has a default config
    - param serviceName
      - string
      - required
  - getCache
  - setCache
  - removeCache
  - middleware
  - tests mocks using jest

- Logger

# Build

- Esbuid
  - reads fron build.ts and passes the parsed values to esbuild
  - reads process argv to retrieve args
    - parameter
      - target: this is the target directory in source ie --target
      - bundle: bundles all the files in one --bundle
      - minify: well, minifys
      - platform: this target Web/node
        -example script build:my-project: ts-node --bundle --target=my-project --platform=node --minify
