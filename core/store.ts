import { AnnouncementCount, AnnouncementOutput } from "$core/types.ts";

const KV_BATCH_SIZE = 500;

export class Store {
  constructor(private kv: Deno.Kv) {}

  private getLastUpdatedDate(an: AnnouncementOutput) {
    // Update latest date
    let lastUpdatedDate = new Date("1970-01-01");
    const registrationDate = new Date(an.registrationDate);
    if (registrationDate > lastUpdatedDate) {
      lastUpdatedDate = registrationDate;
    }
    if (an.updateDate) {
      const updateDate = new Date(an.updateDate);
      if (updateDate > lastUpdatedDate) {
        lastUpdatedDate = updateDate;
      }
    }
    if (an.disposalDate) {
      const disposalDate = new Date(an.disposalDate);
      if (disposalDate > lastUpdatedDate) {
        lastUpdatedDate = disposalDate;
      }
    }
    if (an.expireDate) {
      const expireDate = new Date(an.expireDate);
      if (expireDate > lastUpdatedDate) {
        lastUpdatedDate = expireDate;
      }
    }
    return lastUpdatedDate;
  }

  async save(ans: AnnouncementOutput[]) {
    let atomic = this.kv.atomic();
    const nameLookupMap = new Map<string, Set<string>>();
    let i = 0;
    let latestDate = new Date("1970-01-01");
    for (const an of ans) {
      if (an.latest === "0") {
        continue;
      }
      // Update latest date
      const lastUpdatedDate = this.getLastUpdatedDate(an);
      if (lastUpdatedDate > latestDate) {
        latestDate = lastUpdatedDate;
      }
      // Save announcement
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
    const currentLatestDate = await this.kv.get<Date>([
      "announcementLatestDate",
    ]);
    if (currentLatestDate.value && currentLatestDate.value > latestDate) {
      latestDate = currentLatestDate.value;
    }
    atomic.set(["announcementLatestDate"], latestDate);
    const result = await atomic.commit();
    if (!result.ok) {
      console.error(result);
      throw new Error("Failed to save");
    }
    return result.versionstamp;
  }

  async count() {
    const latestDateRes = await this.kv.get<Date>(["announcementLatestDate"]);
    const latestDate = latestDateRes.value ?? new Date("1970-01-01");
    const countRes = await this.kv.get<AnnouncementCount>([
      "announcementCount",
    ]);
    if (
      countRes.value &&
      latestDate.valueOf() === countRes.value.updateDate.valueOf()
    ) {
      return countRes.value.count;
    }
    let count = 0;
    for await (const _ of this.kv.list({ prefix: ["announcements"] })) {
      count++;
    }
    await this.kv.set(["announcementCount"], { updateDate: latestDate, count });
    return count;
  }

  async find(...registratedNumbers: string[]) {
    const batchSize = 10;
    const batches: string[][] = [];
    for (let i = 0; i < registratedNumbers.length; i += batchSize) {
      const batch = registratedNumbers.slice(i, i + batchSize);
      batches.push(batch);
    }
    const results: AnnouncementOutput[] = [];
    for (const batch of batches) {
      const ans = await this.kv.getMany<AnnouncementOutput[]>(
        batch.map((rn) => ["announcements", rn]),
      );
      results.push(
        ...ans.map((r) => r.value).filter((v) =>
          v !== null
        ) as AnnouncementOutput[],
      );
    }
    return results.toSorted((a, b) =>
      a.registratedNumber.localeCompare(b.registratedNumber)
    );
  }

  async findManyByName(name: string) {
    const names = await this.kv.get<string[]>(["announcementNames", name]);
    if (names.value) {
      const result = await this.find(...names.value);
      return result.toSorted((a, b) =>
        a.registratedNumber.localeCompare(b.registratedNumber)
      );
    }
    return [];
  }

  async searchByName(name: string) {
    const iter = this.kv.list({ prefix: ["announcementNames"] });
    const nameKeys: string[] = [];
    for await (const { key } of iter) {
      const k = key[1].toString();
      if (k.includes(name)) {
        nameKeys.push(k);
      }
    }
    const ids: string[] = [];
    for await (const key of nameKeys) {
      const names = await this.kv.get<string[]>(["announcementNames", key]);
      if (names.value) {
        ids.push(...names.value);
      }
    }
    const result = await this.find(...ids);
    return result.toSorted((a, b) =>
      a.registratedNumber.localeCompare(b.registratedNumber)
    );
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