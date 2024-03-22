import { useSignal } from "@preact/signals";
import { AnnouncementOutput } from "$core/types.ts";

interface Props {
  announcements: AnnouncementOutput[];
}

export default function AnnouncementList({ announcements }: Props) {
  const ans = useSignal<AnnouncementOutput[]>(announcements);

  return (
    <div>
      {ans.value.map((a) => (
        <div key={a.sequenceNumber} class="my-4 p-4 bg-[#f7f8fa] rounded-md">
          <h2 class="text-lg font-bold">{a.name}</h2>
          <p>{a.registratedNumber}</p>
        </div>
      ))}
    </div>
  );
}
