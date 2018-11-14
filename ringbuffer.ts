export class RingBuffer {
  _buffer: Buffer;
  _size: number;
  _rpos: number;
  _wpos: number;

  constructor(size: number) {
    this._size = size + 1;
    this._buffer = Buffer.alloc(this._size);
    this._rpos = 0;
    this._wpos = 0;
  }

  public write(buffer: Buffer): boolean {
    if (!buffer.length || this.space() < buffer.length) {
      return false;
    }
    const bytes = buffer.copy(this._buffer, this._wpos);
    if (bytes < buffer.length) {
      buffer.copy(this._buffer, 0, bytes);
    }
    this._wpos = (this._wpos + buffer.length) % this._size;
    return true;
  }

  public read(buffer: Buffer, num: number): number {
    let total = 0;
    while (this.length() && total < Math.min(buffer.length, num)) {
      const end = this._wpos > this._rpos ? this._wpos : this._size;
      const bytes = this._buffer.copy(
        buffer,
        total,
        this._rpos,
        Math.min(end, this._rpos + (num - total))
      );
      this._rpos = (this._rpos + bytes) % this._size;
      total = total + bytes;
    }
    return total;
  }

  public clear() {
    this._rpos = 0;
    this._wpos = 0;
  }

  public indexOf(value: string): number {
    let index = this._buffer.indexOf(value, this._rpos);
    if (index === -1 && this._wpos < this._rpos) {
      index = this._buffer.indexOf(value, 0);
    }
    if (index === -1) {
      return -1;
    }
    if (this.readable(index) && this.readable(index + value.length - 1)) {
      return index >= this._rpos
        ? index - this._rpos
        : this._size - this._rpos + index;
    }
    return -1;
  }

  public space() {
    return this._size - this.length() - 1;
  }

  public length(): number {
    if (this._wpos >= this._rpos) {
      return this._wpos - this._rpos;
    }
    return this._size - this._rpos + this._wpos;
  }

  private readable(index: number): boolean {
    if (this._wpos >= this._rpos) {
      return index >= this._rpos && index < this._wpos;
    }
    return index >= this._rpos || index < this._wpos;
  }
}
