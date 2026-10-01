import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs', 'iife'],
  target: 'es2022',
  outDir: 'dist',
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
  minify: process.env.NODE_ENV === 'production',
  // import.meta.url for the CJS bundle (src/libraries/kcore.ts resolves the optional package with it)
  shims: true,
  
  // Multiple output formats
  outExtension({ format }) {
    return {
      js: format === 'cjs' ? '.cjs' : format === 'iife' ? '.iife.js' : '.js'
    }
  },

  // Global name for IIFE format (browser)
  globalName: 'KnishIO',

  // External dependencies (don't bundle these)
  external: [
    'vue', // Keep consistent with JS SDK
    'node:fs',
    'node:fs/promises',
    'node:path'
  ],

  // Environment variables
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'development')
  },

  // Banner comment
  banner: {
    js: `/*
                               (
                              (/(
                              (//(
                              (///(
                             (/////(
                             (//////(                          )
                            (////////(                        (/)
                            (////////(                       (///)
                           (//////////(                      (////)
                           (//////////(                     (//////)
                          (////////////(                    (///////)
                         (/////////////(                   (/////////)
                        (//////////////(                  (///////////)
                        (///////////////(                (/////////////)
                       (////////////////(               (//////////////)
                      (((((((((((((((((((              (((((((((((((((
                     (((((((((((((((((((              ((((((((((((((
                     (((((((((((((((((((            ((((((((((((((
                    ((((((((((((((((((((           (((((((((((((
                    ((((((((((((((((((((          ((((((((((((
                    (((((((((((((((((((         ((((((((((((
                    (((((((((((((((((((        ((((((((((
                    ((((((((((((((((((/      (((((((((
                    ((((((((((((((((((     ((((((((
                    (((((((((((((((((    (((((((
                   ((((((((((((((((((  (((((
                   #################  ##
                   ################  #
                  ################# ##
                 %################  ###
                 ###############(   ####
                ###############      ####
               ###############       ######
              %#############(        (#######
             %#############           #########
            ############(              ##########
           ###########                  #############
          #########                      ##############
        %######

        Powered by Knish.IO: Connecting a Decentralized World

Please visit https://github.com/WishKnish/KnishIO-Client-TS for information.

License: https://github.com/WishKnish/KnishIO-Client-TS/blob/master/LICENSE
 */`
  },

  // Platform-specific builds
  platform: 'neutral',

  // Bundle analyzer
  metafile: process.env.ANALYZE === 'true',

  // Rollup options for advanced configuration
  esbuildOptions(options) {
    options.conditions = ['module', 'import', 'require']
  }
})