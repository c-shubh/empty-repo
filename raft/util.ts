import jQuery from "jquery";

export const util: any = {};

// Really big number. Infinity is problematic because
// JSON.stringify(Infinity) returns 'null'.
util.Inf = 1e300;

util.value = function (v) {
  return function () {
    return v;
  };
};

// Use with sort for numbers.
util.numericCompare = function (a, b) {
  return a - b;
};

util.circleCoord = function (frac, cx, cy, r) {
  let radians = 2 * Math.PI * (0.75 + frac);
  return {
    x: cx + r * Math.cos(radians),
    y: cy + r * Math.sin(radians),
  };
};

util.countTrue = function (bools) {
  let count = 0;
  bools.forEach(function (b) {
    if (b) count += 1;
  });
  return count;
};

util.makeMap = function (keys, value) {
  let m = {};
  keys.forEach(function (key) {
    m[key] = value;
  });
  return m;
};

util.mapValues = function (m) {
  return m.map(function (v) {
    return v;
  });
};

util.clone = function (object) {
  return jQuery.extend(true, {}, object);
};

// From http://stackoverflow.com/a/6713782
util.equals = function (x, y) {
  if (x === y) return true;
  // if both x and y are null or undefined and exactly the same

  if (!(x instanceof Object) || !(y instanceof Object)) return false;
  // if they are not strictly equal, they both need to be Objects

  if (x.constructor !== y.constructor) return false;
  // they must have the exact same prototype chain, the closest we can do is
  // test there constructor.

  let p;
  for (p in x) {
    if (!x.hasOwnProperty(p)) continue;
    // other properties were tested using x.constructor === y.constructor

    if (!y.hasOwnProperty(p)) return false;
    // allows to compare x[ p ] and y[ p ] when set to undefined

    if (x[p] === y[p]) continue;
    // if they have the same strict value or identity then they are equal

    if (typeof x[p] !== "object") return false;
    // Numbers, Strings, Functions, Booleans must be strictly equal

    if (!util.equals(x[p], y[p])) return false;
    // Objects and Arrays must be tested recursively
  }

  for (p in y) {
    if (y.hasOwnProperty(p) && !x.hasOwnProperty(p)) return false;
    // allows x[ p ] to be set to undefined
  }
  return true;
};

util.greatestLower = function (a, gt) {
  let bs = function (low, high) {
    if (high < low) return low - 1;
    let mid = Math.floor((low + high) / 2);
    if (gt(a[mid])) return bs(low, mid - 1);
    else return bs(mid + 1, high);
  };
  return bs(0, a.length - 1);
};

util.clamp = function (value, low, high) {
  if (value < low) return low;
  if (value > high) return high;
  return value;
};
