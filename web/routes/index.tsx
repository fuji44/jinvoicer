import IconSearch from "https://deno.land/x/tabler_icons_tsx@0.0.5/tsx/search.tsx";
import { Handlers, PageProps } from "$fresh/server.ts";

import { AnnouncementOutput } from "$core/types.ts";

import AnnouncementList from "../islands/AnnouncementList.tsx";

interface Data {
  total: number;
  ans: AnnouncementOutput[];
  q?: string;
}

export const handler: Handlers<Data> = {
  async GET(req, ctx) {
    const totalRes = await fetch(
      new URL(`/api/announcement-count`, ctx.url.origin),
    );
    if (!totalRes.ok) {
      return ctx.render({ total: 0, ans: [] });
    }
    const { total } = await totalRes.json();

    const url = new URL(req.url);
    const q = url.searchParams.get("q");
    if (!q) {
      return ctx.render({ total, ans: [] });
    }
    const queries = [
      fetch(new URL(`/api/announcement-names/${q}`, ctx.url.origin)),
    ];
    if (q.startsWith("T")) {
      queries.push(fetch(new URL(`/api/announcements/${q}`, ctx.url.origin)));
    }
    const [resByName, resById] = await Promise.all(queries);
    const ans = [];
    if (resByName.ok) {
      ans.push(...(await resByName.json()));
    }
    if (resById?.ok) {
      ans.push(...(await resById.json()));
    }
    return ctx.render({ total, ans, q });
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
              placeholder={"登録番号または名前を入力してください"}
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
      <div class="flex flex-row my-2 px-3 py-3 bg-[#f7f8fa] rounded">
        <div class="grow">
          {ans.length > 0
            ? (
              <span class="text-center">
                Search results for "{q}"
              </span>
            )
            : q !== ""
            ? <span class="text-center">No results for "{q}"</span>
            : null}
        </div>
        <div class="grow text-right">
          <span class="px-3 py-1 text-center bg-white rounded-full">
            {ans.length ?? 0} / {data.total}
          </span>
        </div>
      </div>
      <div class="my-4">
        {ans.length > 0 ? <AnnouncementList announcements={ans} /> : null}
      </div>
    </div>
  );
}
