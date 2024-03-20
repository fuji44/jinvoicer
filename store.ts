import { AnnouncementOutput } from "./types.ts";

const KV_BATCH_SIZE = 1000;

export class Store {
  constructor(private kv: Deno.Kv) {}

  async save(ans: AnnouncementOutput[]) {
    let atomic = this.kv.atomic();
    const nameLookupMap = new Map<string, Set<string>>();
    let i = 0;
    for (const an of ans) {
      atomic.set(["announcements", an.registratedNumber], an);
      const registratedNumbers = nameLookupMap.get(an.name) ?? new Set();
      registratedNumbers.add(an.registratedNumber);
      nameLookupMap.set(an.name, registratedNumbers);
      i++;
      if (i % KV_BATCH_SIZE === 0) {
        const result = await atomic.commit();
        if (!result.ok) {
          console.error(result);
          throw new Error("Failed to save");
        }
        atomic = this.kv.atomic();
        i = 0;
      }
    }
    for (const [name, registratedNumbers] of nameLookupMap) {
      if (name === "") {
        continue;
      }
      const registratedNumberResult = await this.kv.get<string[]>([
        "announcementNames",
        name,
      ]);
      const updated = registratedNumberResult.value
        ? new Set([...registratedNumberResult.value, ...registratedNumbers])
        : registratedNumbers;
      atomic.set(["announcementNames", name], Array.from(updated));
      i++;
      if (i % KV_BATCH_SIZE === 0) {
        const result = await atomic.commit();
        if (!result.ok) {
          console.error(result);
          throw new Error("Failed to save");
        }
        atomic = this.kv.atomic();
        i = 0;
      }
    }
    const result = await atomic.commit();
    if (!result.ok) {
      console.error(result);
      throw new Error("Failed to save");
    }
    return result.versionstamp;
  }

  async count() {
    let count = 0;
    for await (const _ of this.kv.list({ prefix: ["announcements"] })) {
      count++;
    }
    return count;
  }

  async find(...registratedNumbers: string[]) {
    const result = await this.kv.getMany<AnnouncementOutput[]>(
      registratedNumbers.map((rn) => ["announcements", rn]),
    );
    return result.map((r) => r.value).filter((v) =>
      v !== null
    ) as AnnouncementOutput[];
  }

  async findManyByName(name: string) {
    const result = await this.kv.get<string[]>(["announcementNames", name]);
    if (result.value) {
      return await this.find(...result.value);
    }
    return [];
  }

  async delete(registratedNumber: string) {
    const announcements = await this.find(registratedNumber);
    if (announcements.length === 0) {
      return;
    }
    const atomic = this.kv.atomic();
    atomic.delete(["announcements", registratedNumber]);
    const announcementNames = await this.kv.get<string[]>([
      "announcementNames",
      announcements[0].name,
    ]);
    if (announcementNames.value) {
      const updated = announcementNames.value.filter((rn) =>
        rn !== registratedNumber
      );
      if (updated.length === 0) {
        atomic.delete(["announcementNames", announcements[0].name]);
      } else {
        atomic.set(["announcementNames", announcements[0].name], updated);
      }
    }
    const result = await atomic.commit();
    if (!result.ok) {
      console.error(result);
      throw new Error("Failed to delete");
    }
    return result.versionstamp;
  }

  async reset() {
    let atomic = this.kv.atomic();
    const iter = this.kv.list({ prefix: ["announcements"] });
    let i = 0;
    for await (const { key } of iter) {
      atomic.delete(key);
      i++;
      if (i % KV_BATCH_SIZE === 0) {
        const result = await atomic.commit();
        if (!result.ok) {
          console.error(result);
          throw new Error("Failed to reset");
        }
        atomic = this.kv.atomic();
        i = 0;
      }
    }
    const iter2 = this.kv.list({ prefix: ["announcementNames"] });
    for await (const { key } of iter2) {
      atomic.delete(key);
      i++;
      if (i % KV_BATCH_SIZE === 0) {
        const result = await atomic.commit();
        if (!result.ok) {
          console.error(result);
          throw new Error("Failed to reset");
        }
        atomic = this.kv.atomic();
        i = 0;
      }
    }
    const result = await atomic.commit();
    if (!result.ok) {
      console.error(result);
      throw new Error("Failed to reset");
    }
    return result.versionstamp;
  }
}
