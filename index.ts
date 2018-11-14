import * as fs from "fs";
import { Linereader, Line } from "./linereader";

export interface TextIndex {
  start: number;
  end: number;
  children: { [key: string]: TextIndex };
}

class Indexer {
  _stack: TextIndex[];
  _prefix: string;

  constructor() {
    this._stack = [];
    this._prefix = "";
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
      rl.on("line", (line: Line) => {
        line.value = keyfunc(line.value);
        this.process(line);
      });
      rl.on("close", (bytes: number) => {
        resolve(this.finish(bytes) || { start: 0, end: 0, children: {} });
        rs.destroy();
      });
    });
  }

  private process(line: Line) {
    if (!line.value.startsWith(this._prefix)) {
      this.exit(line);
    }
    if (line.value !== this._prefix) {
      this.enter(line);
    }
  }

  private enter(line: Line) {
    const value = line.value;
    while (this._prefix !== line.value && this._stack.length < 6) {
      const key = value.slice(this._prefix.length)[0];
      const node = {
        start: line.offset,
        end: line.offset,
        children: {}
      };
      this._stack[this._stack.length - 1].children[key] = node;
      this._stack.push(node);
      this._prefix = this._prefix + key;
    }
  }

  private exit(line: Line) {
    while (!line.value.startsWith(this._prefix)) {
      this.pop(line.offset);
    }
  }

  private finish(bytes: number): TextIndex | null {
    var root = null;
    while (this._stack.length) {
      root = this.pop(bytes);
    }
    return root;
  }

  private pop(offset: number): TextIndex | null {
    this._stack[this._stack.length - 1].end = offset;
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
