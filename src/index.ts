/// <reference types="@cloudflare/workers-types" />
import { DurableObject } from 'cloudflare:workers';
import { drizzle, type DrizzleSqliteDODatabase } from 'drizzle-orm/durable-sqlite';
import { migrate } from 'drizzle-orm/durable-sqlite/migrator';
import { Env, Hono } from 'hono';
import { prettyJSON } from 'hono/pretty-json';
import migrations from '../drizzle/migrations';
import { usersTable } from './db/schema';

export class Database extends DurableObject {
	storage: DurableObjectStorage;
	db: DrizzleSqliteDODatabase<any>;

	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
		this.storage = ctx.storage;
		this.db = drizzle(this.storage, { logger: false });

		// Make sure all migrations complete before accepting queries.
		// Otherwise you will need to run `this.migrate()` in any function
		// that accesses the Drizzle database `this.db`.
		ctx.blockConcurrencyWhile(async () => {
			await this._migrate();
		});
	}

  async _migrate() {
		migrate(this.db, migrations);
	}

  /// ユーザ一覧を取得
  async fetchUsers() {
    return this.db.select().from(usersTable);
  }

  /// ユーザを作成
  async createUser(user: typeof usersTable.$inferInsert) {
    const res = await this
    .db
    .insert(usersTable)
    .values(user)
    .returning({id: usersTable.id});

    return res.length > 0 ? res[0].id: undefined
  }
}

type Bindings = {
  MY_BUCKET: R2Bucket
  DATABASE: DurableObjectNamespace<Database>
}

const app = new Hono<{ Bindings: Bindings }>()

app.use(prettyJSON())

app.get('/users', async (c) => {
  const id = c.env.DATABASE.idFromName('example');
  const stub = c.env.DATABASE.get(id);
  const res = await stub.fetchUsers();

  return c.json(res)
})

app.post('/users', async (c) => {
  const body = await c.req.json();
  const id = c.env.DATABASE.idFromName('example');
  const stub = c.env.DATABASE.get(id);

  const res = await stub.createUser(body);

  if(res !== undefined) {
    c.status(201);
    c.res.headers.append('Location', '/users');
    return c.text('ユーザを作成しました。');
  }

  c.status(500);
  return c.text('ユーザの作成に失敗しました。');
})

export default app
