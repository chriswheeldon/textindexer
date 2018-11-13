import { TextIndexer, TextIndex } from "../index"

const filename = process.argv[2];

const ti = new TextIndexer(filename, (line) => {
  return line;
});

ti.index().then(async (index) => {
  console.log(process.memoryUsage().heapUsed);
  const result = await ti.lookup("im_message");
  console.log(result);
});