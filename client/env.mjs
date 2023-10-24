import { z } from 'zod'

const server = z.object({
  // Iron session requires a secret of at least 32 characters
  NODE_ENV: z.enum(['development', 'test', 'production']),
  SECRET_KEY: z.string().min(1),
  // Comma separated list of Ethereum addresses, accepts optinal whitespace after comma
  APP_ADMINS: z
    .string()
    .regex(/^(0x[a-fA-F0-9]{40}( *, *0x[a-fA-F0-9]{40})* *)*$/)
    .optional(),
  SITE_URL: z.string().url().optional(),
})

const client = z.object({
  SECRET_KEY: z.string().min(1).optional(),
})

const processEnv = {
  NODE_ENV: process.env.NODE_ENV,
  SECRET_KEY: process.env.KMS_SECRET_KEY,
}

const merged = server.merge(client)

/** @typedef {z.input<typeof merged>} MergedInput */
/** @typedef {z.infer<typeof merged>} MergedOutput */
/** @typedef {z.SafeParseReturnType<MergedInput, MergedOutput>} MergedSafeParseReturn */

let env = process.env

if (!!process.env.SKIP_ENV_VALIDATION == false) {
  const isServer = typeof window === 'undefined'

  const parsed = isServer
    ? merged.safeParse(processEnv) // on server we can validate all env vars
    : client.safeParse(processEnv) // on client we can only validate the ones that are exposed

  if (parsed.success === false) {
    console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors)
    throw new Error('Invalid environment variables')
  }

  // @ts-ignore
  env = new Proxy(parsed.data, {
    get(target, prop) {
      if (typeof prop !== 'string') return undefined
      // Throw a descriptive error if a server-side env var is accessed on the client
      // Otherwise it would just be returning `undefined` and be annoying to debug
      if (!isServer && !prop.startsWith('NEXT_PUBLIC_'))
        throw new Error(
          process.env.NODE_ENV === 'production'
            ? '❌ Attempted to access a server-side environment variable on the client'
            : `❌ Attempted to access server-side environment variable '${prop}' on the client`
        )
      return target[/** @type {keyof typeof target} */ (prop)]
    },
  })
}

export { env }
