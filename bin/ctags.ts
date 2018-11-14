import * as fs from "fs";
import { TextIndexer } from "../index";
import { LineReader } from "../linereader";
import { performance } from "perf_hooks";

const filename = process.argv[2];
const lookup = process.argv[3];

const ti = new TextIndexer(
  filename,
  line => {
    return line.split("\t")[0];
  },
  6
);

const index_start_ms = performance.now();
ti.index().then(async index => {
  console.log(
    `duration ${performance.now() -
      index_start_ms}ms, heapUsed = ${process.memoryUsage().heapUsed / 1e6}mb`
  );
  const rename_start_ms = performance.now();
  const result = await ti.lookup(lookup);
  if (result) {
    const lr = new LineReader(
      fs.createReadStream(process.argv[2], {
        start: result.start,
        end: result.end - 1
      })
    );
    lr.on("line", line => {
      if (line.value.split("\t")[0] === lookup) {
        console.log(line.value);
      }
    });
    lr.on("close", () => {
      console.log(`duration ${performance.now() - rename_start_ms}ms`);
    });
  }
});
