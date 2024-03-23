import { Handlers } from "$fresh/server.ts";

import { Store } from "$core/store.ts";
import { AnnouncementOutput } from "$core/types.ts";

export const handler: Handlers<AnnouncementOutput | null> = {
  async GET(_req, ctx) {
    const store = new Store();
    const ans = await store.find(ctx.params.id);
    return new Response(JSON.stringify(ans));
  },
};
