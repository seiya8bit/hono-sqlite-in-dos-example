import { DurableObject } from 'cloudflare:workers'
import { Env, Hono } from 'hono'

export class Counter extends DurableObject {
  value = 0

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env)

    ctx.blockConcurrencyWhile(async () => {
      this.value = (await ctx.storage.get('value')) || 0
    })
  }

  async getCounterValue() {
    return this.value
  }

  async increment(amount = 1): Promise<number> {
    this.value += amount
    await this.ctx.storage.put('value', this.value)
    return this.value
  }

  async decrement(amount = 1): Promise<number> {
    this.value -= amount
    await this.ctx.storage.put('value', this.value)
    return this.value
  }
}

type Bindings = {
  MY_BUCKET: R2Bucket
  COUNTER: DurableObjectNamespace<Counter>
}

const app = new Hono<{ Bindings: Bindings }>()

app.get('/counter', async (c) => {
  const env = c.env
  const id = env.COUNTER.idFromName('counter')
  const stub = env.COUNTER.get(id)

  const counterValue = await stub.getCounterValue()

  return c.text(counterValue.toString())
})

app.post('/counter/increment', async (c) => {
  const env = c.env
  const id = env.COUNTER.idFromName('counter')
  const stub = env.COUNTER.get(id)

  const value = await stub.increment()

  return c.text(value.toString())
})

app.post('/counter/decrement', async (c) => {
  const env = c.env
  const id = env.COUNTER.idFromName('counter')
  const stub = env.COUNTER.get(id)

  const value = await stub.decrement()

  return c.text(value.toString())
})

export default app
