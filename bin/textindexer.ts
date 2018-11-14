import { Textindexer, TextIndex } from "../index";

const filename = process.argv[2];

const ti = new Textindexer(filename, line => line, 7);
ti.index().then(index => {
  console.log("index: ", JSON.stringify(index, null, 4));
});
