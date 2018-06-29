//
// @file OleReader.js
// @author David Hammond
// @author Richard Miller-Smith
// @date 1 May 2018
// @copyright Copyright © 2018 by Bentham Instruments Ltd. All Rights Reserved.
//

"use strict";

let myTextDecoder = null;
try {
  myTextDecoder = TextDecoder;
} catch (e) {
  myTextDecoder = require("util").TextDecoder;
}

const CFB = require("cfb");

class OleReader {
  static get OleStart() {
    return 0xc00;
  }

  static get ArStart() {
    return 0xc20;
  }

  constructor(data) {
    data = this.bufferise_data(data);

    const cfb = CFB.parse(data);
    const contents = CFB.find(cfb, "Contents");

    this.src = {
      data: Buffer.from(contents.content),
      info: contents,
      pos: 0,
      start: 0
    };

    // windows-1252 string decoder
    this.decoder = new myTextDecoder("windows-1252", { fatal: false });
  }

  bufferise_data(data) {
    if (!Object.is(Buffer)) {
      data = Buffer.from(data);
    }

    return data;
  }

  move_to_ole_start() {
    if (this.src.data.length < OleReader.OleStart + 20) {
      return false;
    }
    this.src.pos = OleReader.OleStart;
    return true;
  }

  move_to_ar_start() {
    if (this.src.data.length < OleReader.ArStart) {
      return false;
    }
    this.src.pos = OleReader.ArStart;
    return true;
  }

  find_guid(correct_guid, inc) {
    inc = inc || 256;
    const s = this.src;
    let filelen = s.data.length;

    while (s.pos + correct_guid.length < filelen) {
      let guid = Buffer.from(
        this.src.data.slice(s.pos, s.pos + correct_guid.length)
      );

      if (guid.equals(correct_guid)) {
        s.ole_start = s.pos;
        s.pos += correct_guid.length;
        return true;
      } else {
        s.pos += inc;
      }
    }
    return false;
  }

  find_last_guid(correct_guid, inc) {
    inc = inc || 256;
    const s = this.src;
    let filelen = s.data.length;
    let last_guid_pos = -1;

    while (s.pos + correct_guid.length < filelen) {
      let guid = this.src.data.slice(s.pos, s.pos + correct_guid.length);

      if (guid.equals(correct_guid)) {
        last_guid_pos = s.pos;
      }
      s.pos += inc;
    }
    if (last_guid_pos >= 0) {
      s.ole_start = last_guid_pos;
      s.pos = last_guid_pos + correct_guid.length;
      return true;
    } else {
      return false;
    }
  }

  check_length() {
    let len_in_file = this.read_uint32();
    return len_in_file == this.src.info.size;
  }

  read_uint8() {
    const s = this.src;
    let v = s.data.readUInt8(s.pos);
    s.pos += 1;
    return v;
  }

  read_uint16() {
    const s = this.src;
    let v = s.data.readUInt16LE(s.pos);
    s.pos += 2;
    return v;
  }

  read_uint32() {
    const s = this.src;
    let v = s.data.readUInt32LE(s.pos);
    s.pos += 4;
    return v;
  }

  read_uint32_array(length) {
    const uint32_array = [];
    for (let i = 0; i < length; ++i) {
      uint32_array.push(this.read_uint32());
    }
    return uint32_array;
  }

  read_bool() {
    const b = this.read_uint32();
    if (b != 0 && b != 1) {
      throw new Error("invalid boolean encoding");
    }
    return b == 1;
  }

  read_bool_array(length) {
    const bool_array = [];
    for (let i = 0; i < length; ++i) {
      bool_array.push(this.read_bool());
    }
    return bool_array;
  }

  read_double(not_fatal) {
    const s = this.src;
    let v = s.data.readDoubleLE(s.pos);
    s.pos += 8;
    if (!not_fatal && Number.isNaN(v)) {
      throw new Error("invalid double encoding");
    }
    return v;
  }

  read_double_array(length, not_fatal) {
    const double_array = [];
    for (let i = 0; i < length; ++i) {
      double_array.push(this.read_double(not_fatal));
    }
    return double_array;
  }

  read_utf8_string() {
    let strlen = this.read_uint8();
    if (strlen == 255) {
      strlen = this.read_uint16();
    }
    const str_data = this.src.data.slice(this.src.pos, this.src.pos + strlen);
    this.src.pos += strlen;

    return this.decoder.decode(str_data);
  }

  read_systemtime() {
    let year = this.read_uint16();
    let month = this.read_uint16();
    this.skip_uint16();
    let day = this.read_uint16();
    let hour = this.read_uint16();
    let min = this.read_uint16();
    let sec = this.read_uint16();
    let msec = this.read_uint16();

    return (
      year.toString() +
      "-" +
      month.toString().padStart(2, "0") +
      "-" +
      day.toString().padStart(2, "0") +
      " " +
      hour.toString().padStart(2, "0") +
      ":" +
      min.toString().padStart(2, "0") +
      ":" +
      sec.toString().padStart(2, "0") +
      "." +
      msec.toString().padStart(3, "0")
    );
  }

  skip(len) {
    this.src.pos += len;
  }

  skip_double(n) {
    n = n || 1;
    this.skip(n * 8);
  }

  skip_uint16(n) {
    n = n || 1;
    this.skip(n * 2);
  }

  skip_uint32(n) {
    n = n || 1;
    this.skip(n * 4);
  }

  skip_colorref(n) {
    this.skip_uint32(n);
  }

  skip_string() {
    let strlen = this.read_uint8();
    this.skip(strlen);
  }
}

module.exports = OleReader;
