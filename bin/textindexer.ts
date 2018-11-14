import { TextIndexer } from "../index";

const filename = process.argv[2];

const ti = new TextIndexer(filename, line => line, 7);
ti.index().then(index => {
  console.log("index: ", JSON.stringify(index, null, 4));
});
