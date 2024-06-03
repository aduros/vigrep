#!/usr/bin/env node --no-deprecation

import { program } from 'commander'
import { filter } from './filter'
import sharp from 'sharp'
import OpenAI from 'openai'
import pLimit from 'p-limit'

program
  .name('vigrep')
  .description(
    'Grep for image files using GPT-4o Vision.\n\nMore info: https://github.com/aduros/vigrep',
  )
  .option('--model <model>', 'OpenAI model to use', 'gpt-4o')
  .option(
    '-t, --threshold <threshold>',
    'Confidence threshold for matches, between 0 and 100',
    parseFloat,
    80,
  )
  .option(
    '-l, --files-with-matches',
    'Select images that match the query. This is the default behavior',
  )
  .option(
    '-L, --files-without-match',
    'Select images that do NOT match the query',
  )
  .option(
    '--null',
    'Print a zero-byte after matching file names instead of newlines',
  )
  .argument('<query>', 'Search query')
  .argument('[files...]', 'Input image files')

  .action(async (query: string, inputFiles: string[], opts) => {
    const { model, threshold, null: printNull, filesWithoutMatch } = opts
    const openai = new OpenAI()

    // Limit concurrency to avoid hitting resource limits
    const transcodeLimit = pLimit(8)
    const overallLimit = pLimit(50)

    await Promise.all(
      inputFiles.map((inputFile) =>
        overallLimit(async () => {
          const image = await transcodeLimit(() =>
            sharp(inputFile)
              .resize({
                width: 512,
                height: 512,
                fit: 'inside',
                withoutEnlargement: true,
              })
              .webp({
                effort: 0,
              })
              .toBuffer(),
          )
          const result = await filter({
            image,
            imageType: 'image/webp',
            query,
            openai,
            model,
          })
          if (result.confidence >= threshold === !filesWithoutMatch) {
            process.stdout.write(inputFile)
            process.stdout.write(printNull ? '\0' : '\n')
          }
        }),
      ),
    )
  })

program.parse()
