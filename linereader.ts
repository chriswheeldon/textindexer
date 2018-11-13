import { ReadStream } from "fs";
import { EventEmitter } from "events";
import { Ringbuffer } from "./ringbuffer";

export class Linereader extends EventEmitter {
  _buffer: Ringbuffer;

  constructor(rs: ReadStream) {
    super();
    this._buffer = new Ringbuffer(rs.readableHighWaterMark * 2);
    rs.on("data", data => {
      if (this._buffer.write(data)) {
        while (true) {
          const nl = this._buffer.indexOf("\n");
          if (nl === -1) {
            break;
          }
          const line = Buffer.alloc(nl + 1);
          this._buffer.read(line, nl + 1);
          if (nl > 0) {
            const ls = line.toString(undefined, 0, nl);
            this.emit("line", ls);
          }
        }
      }
    });
    rs.on("end", () => {
      const len = this._buffer.length();
      if (len) {
        const line = Buffer.alloc(len);
        this._buffer.read(line, len);
        this.emit("line", line.toString());
      }
      this.emit("close");
    });
  }
}
