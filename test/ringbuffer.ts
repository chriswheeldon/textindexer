import * as assert from "assert";
import { RingBuffer } from "../ringbuffer";

describe("ringbuffer", () => {
  describe("constructor", () => {
    const rb = new RingBuffer(3);
    it("should have the expected space", () => {
      assert.equal(3, rb.space());
    });
    it("should have the expected length", () => {
      assert.equal(0, rb.length());
    });
  });
  describe("write", () => {
    it("should return false if the source buffer is empty", () => {
      const rb = new RingBuffer(3);
      assert.equal(false, rb.write(Buffer.alloc(0)));
      assert.equal(3, rb.space());
      assert.equal(0, rb.length());
    });
    it("should return false if there is not enough space", () => {
      const rb = new RingBuffer(3);
      assert.equal(false, rb.write(Buffer.alloc(4)));
      assert.equal(3, rb.space());
      assert.equal(0, rb.length());
    });
    it("should return true if the source buffer fits", () => {
      const rb = new RingBuffer(3);
      assert.ok(rb.write(Buffer.from("abc")));
      assert.equal(0, rb.space());
      assert.equal(3, rb.length());
    });
  });
  describe("read", () => {
    it("should return 0 if nothing to read", () => {
      const rb = new RingBuffer(3);
      assert.equal(0, rb.read(Buffer.alloc(3), 3));
    });
    it("should read data from ringbuffer and advance space and length", () => {
      const rb = new RingBuffer(3);
      assert.ok(rb.write(Buffer.from("abc")));
      const dst = Buffer.alloc(3);
      assert.equal(3, rb.read(dst, 3));
      assert.equal(dst.toString(), "abc");
      assert.equal(3, rb.space());
      assert.equal(0, rb.length());
    });
  });
  describe("wrapping", () => {
    it("should handle wrapped write", () => {
      const rb = new RingBuffer(3);
      assert.ok(rb.write(Buffer.from("abc")));
      assert.equal(2, rb.read(Buffer.alloc(2), 2));
      assert.equal(2, rb.space());
      assert.ok(rb.write(Buffer.from("de")));
      assert.equal(0, rb.space());
      assert.equal(3, rb.length());
    });
    it("should handle wrapped read", () => {
      const rb = new RingBuffer(3);
      assert.ok(rb.write(Buffer.from("abc")));
      assert.equal(2, rb.read(Buffer.alloc(2), 2));
      assert.ok(rb.write(Buffer.from("de")));
      const dst = Buffer.alloc(3);
      assert.equal(3, rb.read(dst, 3));
      assert.equal("cde", dst.toString());
      assert.equal(3, rb.space());
      assert.equal(0, rb.length());
    });
  });
  describe("indexOf", () => {
    it("should return -1 if buffer is empty", () => {
      const rb = new RingBuffer(3);
      assert.equal(-1, rb.indexOf("a"));
    });
    it("should return the index of the substring", () => {
      const rb = new RingBuffer(3);
      assert.ok(rb.write(Buffer.from("abc")));
      assert.equal(0, rb.indexOf("a"));
      assert.equal(0, rb.indexOf("abc"));
      assert.equal(1, rb.indexOf("bc"));
      assert.equal(2, rb.indexOf("c"));
      assert.equal(-1, rb.indexOf("bca"));
      assert.equal(-1, rb.indexOf("cab"));
    });
    it("should skip out of range data", () => {
      const rb = new RingBuffer(3);
      assert.ok(rb.write(Buffer.from("aaa")));
      assert.equal(1, rb.read(Buffer.alloc(1), 1));
      assert.equal(0, rb.indexOf("a"));
    });
    it("should handle wrapping", () => {
      const rb = new RingBuffer(3);
      assert.ok(rb.write(Buffer.from("abc")));
      assert.equal(2, rb.read(Buffer.alloc(2), 2));
      assert.ok(rb.write(Buffer.from("de")));
      assert.equal(2, rb.indexOf("e"));
    });
  });
});
