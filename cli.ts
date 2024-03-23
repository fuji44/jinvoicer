/// <reference lib="deno.unstable" />
// deno-lint-ignore-file no-fallthrough

import { parseArgs as denoParseArgs } from "$std/cli/parse_args.ts";

import { Store } from "$core/store.ts";
import { importCsv, importDir } from "$core/import.ts";
import { AnnouncementOutput } from "$core/types.ts";
import { downloadFullCsvZips } from "$core/dl_csv.ts";

const subCommandNames = [
  "import",
  "find",
  "reset",
  "count",
  "download",
] as const;
type SubCommandName = typeof subCommandNames[number];

interface SubCommand<T, R> {
  name: SubCommandName;
  parseArgs: (args: string[]) => T;
  exec: (args: string[]) => Promise<R>;
}

class DownloadCsvSubCommand implements SubCommand<string, void> {
  name = "download" as const;
  parseArgs(args: string[]) {
    if (args.length !== 1) {
      console.error("Please provide a path to a directory.");
      Deno.exit(1);
    }
    const [path] = args;
    if (typeof path !== "string") {
      console.error("Please provide a path to a directory.");
      Deno.exit(1);
    }
    return path;
  }
  async exec(args: string[]) {
    const path = this.parseArgs(args);
    await downloadFullCsvZips(path);
  }
}

class ImportSubCommand
  implements SubCommand<{ path: string; updateDate: Date }, void> {
  name = "import" as const;
  parseArgs(args: string[]) {
    if (args.length !== 2) {
      console.error("Please provide a path to a CSV file and a date string.");
      Deno.exit(1);
    }
    const [path, updateISODate] = args;
    if (typeof path !== "string") {
      console.error("Please provide a path to a CSV file.");
      Deno.exit(1);
    }
    if (typeof updateISODate !== "string") {
      console.error("Please provide a valid date string.");
      Deno.exit(1);
    }
    return { path, updateDate: new Date(updateISODate) };
  }
  async exec(args: string[]) {
    const { path, updateDate } = this.parseArgs(args);
    if (await Deno.stat(path).then((s) => s.isDirectory)) {
      await importDir(path, updateDate);
      return;
    }
    if (await Deno.stat(path).then((s) => s.isFile)) {
      await importCsv(path, updateDate);
      return;
    }
    throw new Error("Invalid path.");
  }
}

class FindSubCommand implements SubCommand<unknown, AnnouncementOutput[]> {
  name = "find" as const;
  parseArgs(args: string[]) {
    const parsedArgs = denoParseArgs(args, {
      string: ["id", "name"],
      alias: { id: "i", name: "n" },
    });
    if (parsedArgs.id && parsedArgs.name) {
      console.error("Please provide either id or name, not both.");
      Deno.exit(1);
    }
    if (!parsedArgs.id && !parsedArgs.name) {
      console.error("Please provide either id or name.");
      Deno.exit(1);
    }
    return parsedArgs;
  }
  async exec(args: string[]) {
    const parsedArgs = this.parseArgs(args);
    const kv = await Store.openKv();
    const store = new Store(kv);
    if (parsedArgs.id) {
      return store.find(parsedArgs.id);
    }
    if (parsedArgs.name) {
      return store.searchByName(parsedArgs.name);
    }
    return [];
  }
}

class ResetSubCommand implements SubCommand<void, string> {
  name = "reset" as const;
  parseArgs(args: string[]) {
    if (args.length !== 0) {
      console.error("This subcommand takes no arguments.");
      Deno.exit(1);
    }
  }
  async exec(args: string[]) {
    this.parseArgs(args);
    const kv = await Store.openKv();
    const store = new Store(kv);
    return store.reset();
  }
}

class CountSubCommand implements SubCommand<void, number> {
  name = "count" as const;
  parseArgs(args: string[]) {
    if (args.length !== 0) {
      console.error("This subcommand takes no arguments.");
      Deno.exit(1);
    }
  }
  async exec(args: string[]) {
    this.parseArgs(args);
    const kv = await Store.openKv();
    const store = new Store(kv);
    return store.count();
  }
}

async function execSubCommand(args: string[]) {
  if (args.length < 1) {
    console.error(
      `Please provide a subcommand. Available subcommands: ${
        subCommandNames.join(", ")
      }.`,
    );
    Deno.exit(1);
  }
  switch (args[0] as SubCommandName) {
    case "download": {
      const subCommand = new DownloadCsvSubCommand();
      await subCommand.exec(args.slice(1));
      Deno.exit(0);
    }
    case "import": {
      const subCommand = new ImportSubCommand();
      await subCommand.exec(args.slice(1));
      Deno.exit(0);
    }
    case "find": {
      const subCommand = new FindSubCommand();
      const result = await subCommand.exec(args.slice(1));
      console.log(result);
      Deno.exit(0);
    }
    case "reset": {
      const subCommand = new ResetSubCommand();
      await subCommand.exec(args.slice(1));
      Deno.exit(0);
    }
    case "count": {
      const subCommand = new CountSubCommand();
      const result = await subCommand.exec(args.slice(1));
      console.log(result);
      Deno.exit(0);
    }
    default: {
      console.error("Invalid subcommand.");
      Deno.exit(1);
    }
  }
}

if (import.meta.main) {
  await execSubCommand(Deno.args);
}
