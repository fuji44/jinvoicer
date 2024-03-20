# jinvoicer

This cli tool allows you to search for information on invoice issuing companies in Japan.

To use this tool, you must import the CSV file provided by the National Tax Agency (NTA). Please download the invoice issuer's CSV from the [NTA website](https://www.invoice-kohyo.nta.go.jp/download/index.html).

## Install

```shell
deno task install

# or
deno install --allow-read --allow-write -c ./deno.jsonc -n jinv ./cli.ts
```

## Usage

```shell
# Download Full invoice issuer's CSV
jinv download ./sample.csv

# Import CSV to DB
# csv file path or dir path including csv file.
jinv import ./sample.csv

# Reset DB
jinv reset

# Find id or name
jinv find --id T1000020012131
jinv find --name 苫小牧市

# Count all
jinv count
```

The following example searches for invoice issuers matching the name "苫小牧市"

```shellsession
$ jinv find --name 苫小牧市
[
  {
    sequenceNumber: "1",
    registratedNumber: "T1000020012131",
    process: "01",
    correct: "0",
    kind: "2",
    country: "1",
    latest: "1",
    registrationDate: 2023-10-01T00:00:00.000Z,
    updateDate: 2022-06-13T00:00:00.000Z,
    disposalDate: null,
    expireDate: null,
    address: "北海道苫小牧市旭町４丁目５－６",
    addressPrefectureCode: "01",
    addressCityCode: "213",
    addressRequest: "",
    addressRequestPrefectureCode: null,
    addressRequestCityCode: null,
    kana: "",
    name: "苫小牧市",
    addressInside: "",
    addressInsidePrefectureCode: null,
    addressInsideCityCode: null,
    tradeName: "",
    popularName_previousName: ""
  }
]
```

## Development

### Debug

After executing the following commands, attach the debugger.

```shell
deno run --inspect-brk --allow-read --allow-write -c ./deno.jsonc cli.ts find -n 苫小牧市
```

### Test

```shell
deno task test
```
