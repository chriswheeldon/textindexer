import * as fs from "fs";
import { Linereader } from "./linereader";

export interface TextIndex {
  start: number;
  end: number;
  children: { [key: string]: TextIndex };
}

class Indexer {
  _stack: TextIndex[];
  _prefix: string;
  _lineno: number;

  constructor() {
    this._stack = [];
    this._prefix = "";
    this._lineno = 0;
  }

  public index(
    filename: string,
    keyfunc: (line: string) => string
  ): Promise<TextIndex> {
    this._stack.push({ start: 0, end: 0, children: {} });
    this._prefix = "";

    return new Promise<TextIndex>((resolve, _) => {
      const rs = fs.createReadStream(filename);
      const rl = new Linereader(rs);
      rl.on("line", line => {
        line = keyfunc(line);
        this.process(line);
      });
      rl.on("close", () => {
        resolve(this.finish() || { start: 0, end: 0, children: {} });
        rs.destroy();
      });
    });
  }

  private process(line: string) {
    if (!line.startsWith(this._prefix)) {
      this.exit(line);
    }
    if (line !== this._prefix) {
      this.enter(line);
    }
    this._lineno++;
  }

  private enter(line: string) {
    while (this._prefix !== line && this._stack.length < 8) {
      const key = line.slice(this._prefix.length)[0];
      const node = {
        start: this._lineno,
        end: this._lineno,
        children: {}
      };
      this._stack[this._stack.length - 1].children[key] = node;
      this._stack.push(node);
      this._prefix = this._prefix + key;
    }
  }

  private exit(line: string) {
    while (!line.startsWith(this._prefix)) {
      this.pop();
    }
  }

  private finish(): TextIndex | null {
    var root = null;
    while (this._stack.length) {
      root = this.pop();
    }
    return root;
  }

  private pop(): TextIndex | null {
    this._stack[this._stack.length - 1].end = this._lineno;
    this._prefix = this._prefix.slice(0, this._prefix.length - 1);
    return this._stack.pop() || null;
  }
}

export class TextIndexer {
  _filename: string;
  _keyfunc: (line: string) => string;
  _index: Promise<TextIndex>;

  constructor(filename: string, keyfunc: (line: string) => string) {
    this._filename = filename;
    this._keyfunc = keyfunc;
    this._index = Promise.resolve({ start: 0, end: 0, children: {} });
  }

  public index(): Promise<TextIndex> {
    this._index = new Indexer().index(this._filename, this._keyfunc);
    return this._index;
  }

  public async lookup(key: string): Promise<TextIndex | null> {
    let index = await this._index;
    for (let i = 0; i < key.length; ++i) {
      const ki = key[i];
      if (!index.children[ki]) {
        break;
      }
      index = index.children[ki];
    }
    return index;
  }
}
