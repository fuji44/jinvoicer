import { useSignal } from "@preact/signals";
import IconUser from "https://deno.land/x/tabler_icons_tsx@0.0.5/tsx/user.tsx";
import IconBuilding from "https://deno.land/x/tabler_icons_tsx@0.0.5/tsx/building.tsx";

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
            <span class="grow text-right">{a.registratedNumber}</span>
          </div>
          <div class="text-sm">{a.address}</div>
        </div>
      ))}
    </div>
  );
}
