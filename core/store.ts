import { AnnouncementCount, AnnouncementOutput } from "$core/types.ts";

const KV_BATCH_SIZE = 500;

export class Store {
  constructor(private kv: Deno.Kv) {}

  static async openKv() {
    const path = Deno.env.get("KV_PATH") ?? undefined;
    return await Deno.openKv(path);
  }

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

  private convertFullHalfWidth(text: string, toFullWidth: boolean): string {
    const fullWidthOffset = 65248; // Difference between full-width and half-width characters
    return text.split("").map((char) => {
      const charCode = char.charCodeAt(0);
      // Check if character is alphanumeric
      if (
        (charCode >= 65 && charCode <= 90) ||
        (charCode >= 97 && charCode <= 122) ||
        (charCode >= 48 && charCode <= 57)
      ) {
        // Convert between full-width and half-width by adding or subtracting the offset
        return String.fromCharCode(
          charCode + (toFullWidth ? fullWidthOffset : -fullWidthOffset),
        );
      } else {
        // Non-alphanumeric characters remain unchanged
        return char;
      }
    }).join("");
  }

  async save(ans: AnnouncementOutput[], updateDate: Date) {
    let atomic = this.kv.atomic();
    const nameLookupMap = new Map<string, Set<string>>();
    let i = 0;
    for (const an of ans) {
      if (an.latest === "0") {
        continue;
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
    atomic.set(["announcementUpdateDate"], updateDate);
    const result = await atomic.commit();
    if (!result.ok) {
      console.error(result);
      throw new Error("Failed to save");
    }
    return result.versionstamp;
  }

  async count() {
    const updateDateRes = await this.kv.get<Date>(["announcementUpdateDate"]);
    const updateDate = updateDateRes.value ?? new Date("1970-01-01");
    const countRes = await this.kv.get<AnnouncementCount>([
      "announcementCount",
    ]);
    if (
      countRes.value &&
      updateDate.valueOf() === countRes.value.updateDate.valueOf()
    ) {
      return countRes.value.count;
    }
    let count = 0;
    for await (const _ of this.kv.list({ prefix: ["announcements"] })) {
      count++;
    }
    await this.kv.set(["announcementCount"], { updateDate, count });
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
    const fullWidthName = this.convertFullHalfWidth(name, true);
    const names = await this.kv.get<string[]>([
      "announcementNames",
      fullWidthName,
    ]);
    if (names.value) {
      const result = await this.find(...names.value);
      return result.toSorted((a, b) =>
        a.registratedNumber.localeCompare(b.registratedNumber)
      );
    }
    return [];
  }

  async searchByName(name: string) {
    const fullWidthName = this.convertFullHalfWidth(name, true);
    const iter = this.kv.list({ prefix: ["announcementNames"] });
    const nameKeys: string[] = [];
    for await (const { key } of iter) {
      const k = key[1].toString();
      if (k.includes(fullWidthName)) {
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
    atomic.delete(["announcementUpdateDate"]);
    atomic.delete(["announcementCount"]);
    const result = await atomic.commit();
    if (!result.ok) {
      console.error(result);
      throw new Error("Failed to reset");
    }
    return result.versionstamp;
  }
}
