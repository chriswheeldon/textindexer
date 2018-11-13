import { TextIndexer, TextIndex } from "../index"

const filename = process.argv[2];

const ti = new TextIndexer(filename, (line) => line);
ti.index().then((index) => {
  console.log("index: ", JSON.stringify(index, null, 4));
});