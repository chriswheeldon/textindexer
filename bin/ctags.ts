import { Textindexer } from "../index";
import { Linereader } from "../linereader";
import * as fs from "fs";
import { performance } from "perf_hooks";

const filename = process.argv[2];
const lookup = process.argv[3];

const ti = new Textindexer(
  filename,
  line => {
    return line.split("\t")[0];
  },
  6
);

const index_start = performance.now();
ti.index().then(async index => {
  console.log(
    `duration ${performance.now() -
      index_start}ms, heapUsed = ${process.memoryUsage().heapUsed / 1e6}mb`
  );
  const start = performance.now();
  const result = await ti.lookup(lookup);
  if (result) {
    const lr = new Linereader(
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
      console.log(`duration ${performance.now() - start}ms`);
    });
  }
});
