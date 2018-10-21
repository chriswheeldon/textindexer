import { txtindx } from './index';

var filename = process.argv[2];
console.log(filename);
const ti = new txtindx(filename, (line: string) => {
  if (line.startsWith('!_TAG_')) {
    return "";
  }
  return line.split('\t')[0];
});
ti.index().then((index) => {
  console.log(process.memoryUsage().heapUsed);
});
