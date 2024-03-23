// DO NOT EDIT. This file is generated by Fresh.
// This file SHOULD be checked into source version control.
// This file is automatically updated during development when running `dev.ts`.

import * as $_404 from "./routes/_404.tsx";
import * as $_app from "./routes/_app.tsx";
import * as $api_announcement_count_index from "./routes/api/announcement-count/index.ts";
import * as $api_announcement_names_name_ from "./routes/api/announcement-names/[name].ts";
import * as $api_announcements_id_ from "./routes/api/announcements/[id].ts";
import * as $index from "./routes/index.tsx";
import * as $AnnouncementList from "./islands/AnnouncementList.tsx";
import { type Manifest } from "$fresh/server.ts";

const manifest = {
  routes: {
    "./routes/_404.tsx": $_404,
    "./routes/_app.tsx": $_app,
    "./routes/api/announcement-count/index.ts": $api_announcement_count_index,
    "./routes/api/announcement-names/[name].ts": $api_announcement_names_name_,
    "./routes/api/announcements/[id].ts": $api_announcements_id_,
    "./routes/index.tsx": $index,
  },
  islands: {
    "./islands/AnnouncementList.tsx": $AnnouncementList,
  },
  baseUrl: import.meta.url,
} satisfies Manifest;

export default manifest;
