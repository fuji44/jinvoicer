import { Handlers } from "$fresh/server.ts";

import { Store } from "$core/store.ts";

const kv = await Store.openKv();

export const handler: Handlers<{ total: number }> = {
  async GET(_req, _ctx) {
    const store = new Store(kv);
    const count = await store.count();
    return new Response(JSON.stringify({ total: count }));
  },
};
