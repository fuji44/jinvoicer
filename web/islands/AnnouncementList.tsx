import { useSignal } from "@preact/signals";
import IconUser from "https://deno.land/x/tabler_icons_tsx@0.0.5/tsx/user.tsx";
import IconBuilding from "https://deno.land/x/tabler_icons_tsx@0.0.5/tsx/building.tsx";
import IconExternalLink from "https://deno.land/x/tabler_icons_tsx@0.0.5/tsx/external-link.tsx";

import { AnnouncementOutput } from "$core/types.ts";

interface Props {
  announcements: AnnouncementOutput[];
}

export default function AnnouncementList({ announcements }: Props) {
  const ans = useSignal<AnnouncementOutput[]>(announcements);

  return (
    <div>
      {ans.value.map((a) => (
        <div
          key={a.sequenceNumber}
          class="flex flex-col gap-2 my-4 p-4 bg-[#f7f8fa] rounded-md"
        >
          <div class="flex flex-row">
            {a.kind === "1"
              ? <IconUser class="w-6 h-6" />
              : a.kind === "2"
              ? <IconBuilding class="w-6 h-6" />
              : null}
            <div class="grow text-lg font-bold">
              <span>
                <ruby>
                  {a.name}
                  {a.kana
                    ? (
                      <>
                        <rp>(</rp>
                        <rt>{a.kana}</rt>
                        <rp>)</rp>
                      </>
                    )
                    : null}
                </ruby>
              </span>
              <span>{a.tradeName}</span>
            </div>
            <div class="flex-none text-right">
              <a
                class="hover:underline active:underline focus:underline"
                target="_blank"
                href={`https://www.invoice-kohyo.nta.go.jp/regno-search/detail?selRegNo=${
                  a.registratedNumber.slice(1)
                }`}
              >
                <div class="flex flex-row-reverse items-center gap-1">
                  <IconExternalLink class="w-4 h-4" />
                  <span class="">{a.registratedNumber}</span>
                </div>
              </a>
            </div>
          </div>
          <div class="text-sm">{a.address}</div>
        </div>
      ))}
    </div>
  );
}
