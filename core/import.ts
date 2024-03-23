import { CsvParseStream } from "$std/csv/mod.ts";
import { parse } from "@valibot/valibot";
import { Announcement, AnnouncementOutput } from "$core/types.ts";
import { Store } from "$core/store.ts";

export async function importCsv(
  path: string,
  options?: { batchSize: number },
) {
  const file = await Deno.open(path, { read: true });
  const stream = file.readable.pipeThrough(new TextDecoderStream()).pipeThrough(
    new CsvParseStream(),
  );
  const store = new Store(await Store.openKv());
  const batch: AnnouncementOutput[] = [];
  const batchSize = options?.batchSize ?? 1000;
  for await (const record of stream) {
    const [
      sequenceNumber,
      registratedNumber,
      process,
      correct,
      kind,
      country,
      latest,
      registrationDate,
      updateDate,
      disposalDate,
      expireDate,
      address,
      addressPrefectureCode,
      addressCityCode,
      addressRequest,
      addressRequestPrefectureCode,
      addressRequestCityCode,
      kana,
      name,
      addressInside,
      addressInsidePrefectureCode,
      addressInsideCityCode,
      tradeName,
      popularName_previousName,
    ] = record;
    const an = parse(Announcement, {
      sequenceNumber,
      registratedNumber,
      process,
      correct,
      kind,
      country,
      latest,
      registrationDate,
      updateDate,
      disposalDate,
      expireDate,
      address,
      addressPrefectureCode,
      addressCityCode,
      addressRequest,
      addressRequestPrefectureCode,
      addressRequestCityCode,
      kana,
      name,
      addressInside,
      addressInsidePrefectureCode,
      addressInsideCityCode,
      tradeName,
      popularName_previousName,
    });
    batch.push(an);
    if (batch.length % batchSize === 0) {
      await store.save(batch);
      batch.length = 0;
    }
  }
  await store.save(batch);
}

export async function importDir(
  dir: string,
  options?: { batchSize: number },
) {
  const entries = Deno.readDir(dir);
  const csvs: string[] = [];
  for await (const entry of entries) {
    if (entry.isFile && entry.name.endsWith(".csv")) {
      csvs.push(entry.name);
    }
  }
  console.log(`Found ${csvs.length} CSV files in ${dir}`);
  for (const csv of csvs) {
    console.log(`Importing ${csv}`);
    await importCsv(`${dir}/${csv}`, options);
  }
}
