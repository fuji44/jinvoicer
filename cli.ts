// deno-lint-ignore-file no-fallthrough
import { parseArgs as denoParseArgs } from "@deno/std/cli/parse_args.ts";

import { Store } from "./store.ts";
import { importCsv, importDir } from "./import.ts";
import { AnnouncementOutput } from "./types.ts";

const subCommandNames = [
  "import",
  "find",
  "reset",
  "count",
] as const;
type SubCommandName = typeof subCommandNames[number];

interface SubCommand<T, R> {
  name: SubCommandName;
  parseArgs: (args: string[]) => T;
  exec: (args: string[]) => Promise<R>;
}

class ImportSubCommand implements SubCommand<string, void> {
  name = "import" as const;
  parseArgs(args: string[]) {
    if (args.length !== 1) {
      console.error("Please provide a path to a CSV file.");
      Deno.exit(1);
    }
    const [path] = args;
    if (typeof path !== "string") {
      console.error("Please provide a path to a CSV file.");
      Deno.exit(1);
    }
    return path;
  }
  async exec(args: string[]) {
    const path = this.parseArgs(args);
    if (await Deno.stat(path).then((s) => s.isDirectory)) {
      await importDir(path);
      return;
    }
    if (await Deno.stat(path).then((s) => s.isFile)) {
      await importCsv(path);
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
    const kv = await Deno.openKv();
    const store = new Store(kv);
    if (parsedArgs.id) {
      return store.find(parsedArgs.id);
    }
    if (parsedArgs.name) {
      return store.findManyByName(parsedArgs.name);
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
    const kv = await Deno.openKv();
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
    const kv = await Deno.openKv();
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
