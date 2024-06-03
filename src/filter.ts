import JSON5 from 'json5'
import { z } from 'zod'
import { zodToJsonSchema } from 'zod-to-json-schema'
import type { OpenAI } from 'openai'

/** Options for the filter function. */
export interface FilterOptions {
  /** The image to be analyzed. */
  image: Buffer

  /** The MIME type of the image (eg: 'image/png') */
  imageType: string

  /** The query to check against the image. */
  query: string

  /** Instance of OpenAI client. */
  openai: OpenAI

  /** The OpenAI model to use. */
  model: string
}

/** Result of the filter function. */
export interface FilterResult {
  /** The confidence that the image matched the query, between 0 and 100. */
  confidence: number
}

/**
 * Filters an image based on the given query and returns the confidence level.
 *
 * @param opts - The options for filtering the image.
 * @returns The confidence level that the image matches the given query.
 */
export async function filter(opts: FilterOptions): Promise<FilterResult> {
  const parametersSchema = z.object({
    confidence: z
      .number()
      .min(0)
      .max(100)
      .describe('The confidence level that the image matches the given query'),
  })

  const chatCompletion = await opts.openai.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: 'Check if the image matches the given query',
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `query: ${opts.query}`,
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:${opts.imageType};base64,${opts.image.toString('base64')}`,
              detail: 'low',
            },
          },
        ],
      },
    ],
    tools: [
      {
        type: 'function',
        function: {
          name: 'onComplete',
          parameters: zodToJsonSchema(parametersSchema),
        },
      },
    ],
    tool_choice: {
      type: 'function',
      function: {
        name: 'onComplete',
      },
    },
    model: opts.model,
  })

  const toolCall = chatCompletion.choices[0]?.message?.tool_calls?.[0]

  if (
    !toolCall ||
    toolCall.type !== 'function' ||
    toolCall.function.name !== 'onComplete'
  ) {
    throw new Error('Invalid tool call')
  }

  const result = parametersSchema.parse(
    // We use JSON5 here because sometimes OpenAI returns invalid JSON
    JSON5.parse(toolCall.function.arguments),
  )

  return result
}
