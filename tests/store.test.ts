import { assertEquals } from "$std/assert/mod.ts";
import { exists } from "$std/fs/mod.ts";
import { parse } from "@valibot/valibot";
import { Store } from "$core/store.ts";
import {
  AnnouncementInput,
  AnnouncementOutput,
  Announcements,
} from "$core/types.ts";

const dummyDatumInput1: AnnouncementInput = {
  "sequenceNumber": "1",
  "registratedNumber": "T1000000000001",
  "process": "01",
  "correct": "0",
  "kind": "2",
  "country": "1",
  "latest": "1",
  "registrationDate": "2023-10-01",
  "updateDate": "2022-06-13",
  "disposalDate": "",
  "expireDate": "",
  "address": "北海道苫小牧市旭町４丁目５－６",
  "addressPrefectureCode": "01",
  "addressCityCode": "213",
  "addressRequest": "",
  "addressRequestPrefectureCode": "",
  "addressRequestCityCode": "",
  "kana": "",
  "name": "苫小牧市",
  "addressInside": "",
  "addressInsidePrefectureCode": "",
  "addressInsideCityCode": "",
  "tradeName": "",
  "popularName_previousName": "",
};
const dummyDatumOutput1: AnnouncementOutput = {
  "sequenceNumber": "1",
  "registratedNumber": "T1000000000001",
  "process": "01",
  "correct": "0",
  "kind": "2",
  "country": "1",
  "latest": "1",
  "registrationDate": new Date("2023-10-01"),
  "updateDate": new Date("2022-06-13"),
  "disposalDate": null,
  "expireDate": null,
  "address": "北海道苫小牧市旭町４丁目５－６",
  "addressPrefectureCode": "01",
  "addressCityCode": "213",
  "addressRequest": "",
  "addressRequestPrefectureCode": null,
  "addressRequestCityCode": null,
  "kana": "",
  "name": "苫小牧市",
  "addressInside": "",
  "addressInsidePrefectureCode": null,
  "addressInsideCityCode": null,
  "tradeName": "",
  "popularName_previousName": "",
};
const dummyDatumInput2: AnnouncementInput = {
  "sequenceNumber": "2",
  "registratedNumber": "T1000000000002",
  "process": "01",
  "correct": "0",
  "kind": "2",
  "country": "1",
  "latest": "1",
  "registrationDate": "2023-10-01",
  "updateDate": "2023-03-03",
  "disposalDate": "",
  "expireDate": "",
  "address": "北海道歌志内市字本町５",
  "addressPrefectureCode": "01",
  "addressCityCode": "227",
  "addressRequest": "",
  "addressRequestPrefectureCode": "",
  "addressRequestCityCode": "",
  "kana": "",
  "name": "歌志内市",
  "addressInside": "",
  "addressInsidePrefectureCode": "",
  "addressInsideCityCode": "",
  "tradeName": "",
  "popularName_previousName": "",
};
const dummyDatumOutput2: AnnouncementOutput = {
  "sequenceNumber": "2",
  "registratedNumber": "T1000000000002",
  "process": "01",
  "correct": "0",
  "kind": "2",
  "country": "1",
  "latest": "1",
  "registrationDate": new Date("2023-10-01"),
  "updateDate": new Date("2023-03-03"),
  "disposalDate": null,
  "expireDate": null,
  "address": "北海道歌志内市字本町５",
  "addressPrefectureCode": "01",
  "addressCityCode": "227",
  "addressRequest": "",
  "addressRequestPrefectureCode": null,
  "addressRequestCityCode": null,
  "kana": "",
  "name": "歌志内市",
  "addressInside": "",
  "addressInsidePrefectureCode": null,
  "addressInsideCityCode": null,
  "tradeName": "",
  "popularName_previousName": "",
};

Deno.test(async function storeTest(context) {
  // setup
  const tempDir = `${import.meta.dirname}/../.temp`;
  const dbFile = `${tempDir}/test.db`;
  if (await exists(tempDir, { isDirectory: true })) {
    if (await exists(dbFile, { isFile: true })) {
      await Deno.remove(dbFile);
    }
  } else {
    await Deno.mkdir(tempDir);
  }
  const kv = await Deno.openKv(dbFile);

  // test
  await context.step(async function saveTest() {
    const data = parse(Announcements, [dummyDatumInput1, dummyDatumInput2]);
    const store = new Store(kv);
    const result = await store.save(data, new Date("2023-10-01"));
    assertEquals(typeof result, "string");
  });
  await context.step(async function findTest() {
    const store = new Store(kv);
    const result = await store.find(dummyDatumInput1.registratedNumber);
    assertEquals(result.length, 1);
    assertEquals(result[0], dummyDatumOutput1);
  });
  await context.step(async function findManyByNameTest() {
    const store = new Store(kv);
    const result = await store.findManyByName("苫小牧市");
    assertEquals(result.length, 1);
    assertEquals(result[0], dummyDatumOutput1);
  });
  await context.step(async function searchByNameTest() {
    const store = new Store(kv);
    const result = await store.searchByName("市");
    assertEquals(result.length, 2);
    assertEquals(result[0], dummyDatumOutput1);
    assertEquals(result[1], dummyDatumOutput2);
  });
  await context.step(async function countTest() {
    const store = new Store(kv);
    const count = await store.count();
    assertEquals(count, 2);
  });
  await context.step(async function resetTest() {
    const store = new Store(kv);
    await store.reset();
    const result = await kv.get([
      "announcements",
      dummyDatumInput1.registratedNumber,
    ]);
    assertEquals(result.value, null);
    const result2 = await kv.get(["announcementNames", "苫小牧市"]);
    assertEquals(result2.value, null);
  });

  // teardown
  kv.close();
});
