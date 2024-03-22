import IconSearch from "https://deno.land/x/tabler_icons_tsx@0.0.5/tsx/search.tsx";
import { Handlers, PageProps } from "$fresh/server.ts";

import { AnnouncementOutput } from "$core/types.ts";

import AnnouncementList from "../islands/AnnouncementList.tsx";

interface Data {
  ans: AnnouncementOutput[];
  q?: string;
}

export const handler: Handlers<Data> = {
  async GET(req, ctx) {
    const url = new URL(req.url);
    const q = url.searchParams.get("q");
    if (!q) {
      return ctx.render({ ans: [] });
    }
    const apiUrl = new URL(`/api/announcement-names/${q}`, ctx.url.origin);
    const res = await fetch(apiUrl);
    if (!res.ok) {
      return ctx.render({ ans: [] });
    }
    return ctx.render({ ans: await res.json() ?? [], q });
  },
};

export default function Home({ data }: PageProps<Data>) {
  const ans = data.ans;
  const q = data.q ?? "";

  return (
    <div class="container px-4 py-8 mx-auto bg-white">
      <div>
        <form>
          <div class="flex flex-row gap-2 px-3 py-2 bg-[#f7f8fa] rounded">
            <input
              type="text"
              name="q"
              placeholder={"名前を入力してください"}
              value={q}
              class="flex-auto px-3 py-2 bg-white rounded border(gray-500 2) disabled:(opacity-50 cursor-not-allowed)"
            />
            <button
              type="submit"
              class="flex-none px-3 py-2 bg-white rounded border(gray-400 1) hover:bg-gray-200 flex gap-2"
            >
              <IconSearch class="w-6 h-6" />Search
            </button>
          </div>
        </form>
      </div>
      <div class="my-4">
        {ans.length > 0
          ? <p class="text-center">Search {ans.length} results for "{q}"</p>
          : <p class="text-center">No results for "{q}"</p>}
      </div>
      <div class="my-4">
        {ans.length > 0 ? <AnnouncementList announcements={ans} /> : null}
      </div>
    </div>
  );
}
