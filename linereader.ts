import { ReadStream } from "fs";
import { EventEmitter } from "events";
import { RingBuffer } from "./ringbuffer";

export interface Line {
  value: string;
  offset: number;
}

export class LineReader extends EventEmitter {
  _buffer: RingBuffer;

  constructor(rs: ReadStream) {
    super();
    this._buffer = new RingBuffer(rs.readableHighWaterMark * 2);
    const tmp = Buffer.alloc(rs.readableHighWaterMark * 2);
    let offset = 0;
    rs.on("data", data => {
      if (this._buffer.write(data)) {
        while (true) {
          const nl = this._buffer.indexOf("\n");
          if (nl === -1) {
            break;
          }
          this._buffer.read(tmp, nl + 1);
          if (nl > 0) {
            this.emit("line", {
              value: tmp.toString(undefined, 0, nl),
              offset: offset
            });
          }
          offset = offset + nl + 1;
        }
      }
    });
    rs.on("end", () => {
      const len = this._buffer.length();
      if (len) {
        this._buffer.read(tmp, len);
        this.emit("line", {
          value: tmp.toString(undefined, 0, len),
          offset: rs.bytesRead - len
        });
      }
      this.emit("close", rs.bytesRead);
    });
  }
}
