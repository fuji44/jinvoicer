import { Handlers } from "$fresh/server.ts";

import { Store } from "$core/store.ts";
import { AnnouncementOutput } from "$core/types.ts";

const kv = await Deno.openKv();

export const handler: Handlers<AnnouncementOutput | null> = {
  async GET(_req, ctx) {
    const name = ctx.params.name;
    const parsedName = decodeURIComponent(name);
    const store = new Store(kv);
    const ans = await store.searchByName(parsedName);
    return new Response(JSON.stringify(ans));
  },
};
