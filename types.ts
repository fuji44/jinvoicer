import {
  array,
  Input,
  isoDate,
  literal,
  maxLength,
  minLength,
  object,
  Output,
  picklist,
  startsWith,
  string,
  transform,
  union,
} from "@valibot/valibot";

const DateSchema = transform(
  string([isoDate(), minLength(10), maxLength(10)]),
  (value) => new Date(value),
);
const NoneSchema = transform(literal(""), () => null);

export const Announcement = object({
  /** 一連番号 */
  "sequenceNumber": string([minLength(1), maxLength(8)]),
  /** 登録番号 */
  "registratedNumber": string([startsWith("T"), minLength(14), maxLength(14)]),
  /** 事業者処理区分 */
  "process": picklist(["01", "02", "03", "04", "99"]),
  /** 訂正区分 */
  "correct": picklist(["0", "1", ""]),
  /** 人格区分 */
  "kind": union([picklist(["1", "2"]), NoneSchema]),
  /** 国内外区分 */
  "country": union([picklist(["1", "2", "3"]), NoneSchema]),
  /** 最新履歴 */
  "latest": picklist(["0", "1"]),
  /** 登録年月日 */
  "registrationDate": DateSchema,
  /** 更新年月日 */
  "updateDate": union([DateSchema, NoneSchema]),
  /** 取消年月日 */
  "disposalDate": union([DateSchema, NoneSchema]),
  /** 失効年月日 */
  "expireDate": union([DateSchema, NoneSchema]),
  /** 本店又は主たる事務所の所在地（法人）  */
  "address": string([maxLength(600)]),
  /** 本店又は主たる事務所の所在地都道府県コード（法人） */
  "addressPrefectureCode": union([
    string([minLength(2), maxLength(2)]),
    NoneSchema,
  ]),
  /** 本店又は主たる事務所の所在地市区町村コード（法人） */
  "addressCityCode": union([string([minLength(3), maxLength(3)]), NoneSchema]),
  /** 本店又は主たる事務所の所在地（公表申出） */
  "addressRequest": string([maxLength(600)]),
  /** 本店又は主たる事務所の所在地都道府県コード（公表申出） */
  "addressRequestPrefectureCode": union([
    string([minLength(2), maxLength(2)]),
    NoneSchema,
  ]),
  /** 本店又は主たる事務所の所在地市区町村コード（公表申出） */
  "addressRequestCityCode": union([
    string([minLength(3), maxLength(3)]),
    NoneSchema,
  ]),
  /** 氏名又は名称 日本語（カナ） */
  "kana": string([maxLength(500)]),
  /** 氏名又は名称 */
  "name": string([maxLength(300)]),
  /** 国内において行う資産の譲渡等に係る事務所、事業所その他これらに準ずるものの所在地 */
  "addressInside": string([maxLength(300)]),
  /** 国内において行う資産の譲渡等に係る事務所、事業所その他これらに準ずるものの所在地都道府県コード */
  "addressInsidePrefectureCode": union([
    string([minLength(2), maxLength(2)]),
    NoneSchema,
  ]),
  /** 国内において行う資産の譲渡等に係る事務所、事業所その他これらに準ずるものの所在地市区町村コード */
  "addressInsideCityCode": union([
    string([minLength(3), maxLength(3)]),
    NoneSchema,
  ]),
  /** 主たる屋号 */
  "tradeName": string([maxLength(200)]),
  /** 通称・旧姓 */
  "popularName_previousName": string([maxLength(200)]),
});
export type AnnouncementInput = Input<typeof Announcement>;
export type AnnouncementOutput = Output<typeof Announcement>;

export const Announcements = array(Announcement);
export type AnnouncementsInput = Input<typeof Announcements>;
export type AnnouncementsOutput = Output<typeof Announcements>;
