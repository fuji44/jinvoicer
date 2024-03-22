import { DOMParser, Element } from "deno_dom/deno-dom-wasm.ts";
import { download } from "https://deno.land/x/download@v2.0.2/mod.ts";
import { decompress } from "https://deno.land/x/zip@v1.2.5/mod.ts";

type DownloadParam = {
  dlFilKanriNo: string;
  jinkakukbn: string;
  type: string;
};

function generateDownloadUrl(
  param: { dlFilKanriNo: string; jinkakukbn: string; type: string },
) {
  const { dlFilKanriNo, jinkakukbn, type } = param;
  return `https://www.invoice-kohyo.nta.go.jp/download/zenken/dlfile?dlFilKanriNo=${dlFilKanriNo}&jinkakukbn=${jinkakukbn}&type=${type}`;
}

function parseDownloadParam(body: string): DownloadParam[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(body, "text/html");
  if (!doc) {
    throw new Error("Failed to parse HTML");
  }

  const elements = doc.querySelectorAll("#DLtableCsv a[onclick]");
  const params: DownloadParam[] = [];
  for (const element of elements) {
    // console.log((element as Element).getAttribute("onclick"));
    const regex = /'(.+)'/g;
    const matches = (element as Element).getAttribute("onclick")?.match(regex);
    if (matches) {
      const [dlFilKanriNo, jinkakukbn, type] = matches[0].replaceAll("'", "")
        .split(",");
      params.push({ dlFilKanriNo, jinkakukbn, type });
    }
  }
  return params;
}

async function fetchDownloadPage() {
  const targetUrl = "https://www.invoice-kohyo.nta.go.jp/download/zenken";
  const res = await fetch(targetUrl);
  return res.text();
}

export async function downloadFullCsvZips(
  outputDir: string,
  decompress = true,
  removeZip = true,
) {
  const body = await fetchDownloadPage();
  const params = parseDownloadParam(body);
  for (const param of params) {
    const url = generateDownloadUrl(param);
    console.log(`Downloading: ${url}`);
    const name = `${param.jinkakukbn}_${param.dlFilKanriNo}_csv.zip`;
    const dl = await download(url, { dir: outputDir, file: name });
    console.log(`Downloaded: ${dl.file}`);
  }
  if (decompress) {
    await unzipAll(outputDir, removeZip);
  }
}

async function unzipAll(dir: string, removeZip = true) {
  for await (const entry of Deno.readDir(dir)) {
    if (entry.isFile && entry.name.endsWith(".zip")) {
      const zipPath = `${dir}/${entry.name}`;
      await decompress(zipPath, dir);
      if (removeZip) {
        await Deno.remove(zipPath);
      }
    }
  }
}
