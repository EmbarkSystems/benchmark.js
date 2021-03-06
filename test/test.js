(function(window, undefined) {

  /** Use a single load function */
  var load = typeof require == 'function' ? require : window.load;

  /** The unit testing framework */
  var QUnit =
    window.QUnit || (
      window.setTimeout || (window.addEventListener = window.setTimeout = / /),
      window.QUnit = load('../vendor/qunit/qunit/qunit.js') || window.QUnit,
      load('../vendor/qunit-clib/qunit-clib.js'),
      (window.addEventListener || 0).test && delete window.addEventListener,
      window.QUnit
    );

  /** The `Benchmark` constructor to test */
  var Benchmark =
    window.Benchmark || (
      Benchmark = load('../benchmark.js') || window.Benchmark,
      Benchmark.Benchmark || Benchmark
    );

  /*--------------------------------------------------------------------------*/

  /** Shortcut used to convert array-like objects to arrays */
  var slice = [].slice;

  /**
   * Skips a given number of tests with a passing result.
   * @private
   * @param {Number} count The number of tests to skip.
   */
  function skipTest(count) {
    while (count--) {
      ok(true, 'test skipped');
    }
  }

  /*--------------------------------------------------------------------------*/

  // must explicitly use `QUnit.module` instead of `module()`
  // in case we are in a CLI environment
  QUnit.module('Benchmark');

  // init Benchmark.options.minTime
  Benchmark(function() { throw 0; }).run();

  test('Benchmark.platform', function() {
    if (window.document) {
      equal(String(Benchmark.platform), navigator.userAgent, 'default value');
    } else {
      skipTest(1)
    }
  });

  test('require("benchmark")', function() {
    if (window.document && window.require) {
      equal((Benchmark2 || {}).version, Benchmark.version, 'require("benchmark")');
    } else {
      skipTest(1)
    }
  });

  test('require("platform")', function() {
    if (window.document && window.require) {
      var platform = (Benchmark2 || {}).platform || {};
      equal(typeof platform.name, 'string', 'required("platform")');
    } else {
      skipTest(1)
    }
  });

  /*--------------------------------------------------------------------------*/

  QUnit.module('Benchmark constructor');

  test('basic', function() {
    var bench = Benchmark();
    ok(bench instanceof Benchmark, 'creation without `new` operator');

    bench = Benchmark({ 'name': 'foo', 'fn': function() { } });
    ok(bench.fn && bench.name == 'foo', 'arguments (options)');

    bench = Benchmark('foo', function() { });
    ok(bench.fn && bench.name == 'foo', 'arguments (name, function)');

    bench = Benchmark('foo', { 'fn': function() { } });
    ok(bench.fn && bench.name == 'foo', 'arguments (name, options)');

    bench = Benchmark('foo', function() { }, { 'id': 'bar' });
    ok(bench.fn && bench.name == 'foo' && bench.id == 'bar', 'arguments (name, function, options)');
  });

  test('empty', function() {
    var options = Benchmark.options,
        maxTime = options.maxTime;

    options.maxTime = options.minTime * 5;

    var bench = Benchmark(function() { }).run(),
        error = bench.error;

    ok(/setup\(\)/.test(bench.compiled) ? !error : error, 'error check');

    bench = Benchmark({ 'fn': '' }).run();
    ok(!bench.error, 'no error on explicitly empty');
    options.maxTime = maxTime;
  });

 /*--------------------------------------------------------------------------*/

  QUnit.module('Benchmark compiling');

  test('basic', function() {
    var bench = Benchmark({
      'fn': function() { throw a; },
      'setup': function() { var a = 1; },
      'teardown': function() { a = 2; }
    }).run();

    var compiled = bench.compiled,
        result = /var a\s*=\s*1/.test(compiled) && /throw a/.test(compiled) && /a\s*=\s*2/.test(compiled);

    ok(/setup\(\)/.test(compiled) ? true : result, 'compiled');
  });

  test('toString', function() {
    var bench = Benchmark({
      'fn': function() { },
      'setup': function() { },
      'teardown': function() { }
    });

    bench.setup.toString = function() { return 'var a = 1;' };
    bench.fn.toString = function() { return 'throw a;' };
    bench.teardown.toString = function() { return 'a = 2;' };
    bench.run();

    var compiled = bench.compiled,
        result = /var a\s*=\s*1/.test(compiled) && /throw a/.test(compiled) && /a\s*=\s*2/.test(compiled);

    ok(/setup\(\)/.test(compiled) ? true : result, 'compiled');
  });

  test('as a string', function() {
    var bench = Benchmark({
      'fn': 'throw a;',
      'setup': 'var a = 1;',
      'teardown': 'a = 2;'
    }).run();

    var compiled = bench.compiled,
        result = /var a\s*=\s*1/.test(compiled) && /throw a/.test(compiled) && /a\s*=\s*2/.test(compiled);

    ok(/setup\(\)/.test(compiled) ? true : result, 'compiled');
  });

  /*--------------------------------------------------------------------------*/

  QUnit.module('Benchmark.deepClone');

  test('basic', function() {
    var o = { 'a': 1, 'b': '2' },
        Klass = function() {},
        toString = {}.toString,
        result = Benchmark.deepClone(o);

    Klass.prototype = { 'x': 1 };

    deepEqual(result, o, 'clones simple object');
    ok(result != o, 'clone isn\'t the original object');

    o = { 'a': /a/, 'b': ['B'], 'c': { 'C': 1 } };
    result = Benchmark.deepClone(o);
    deepEqual(result, o, 'clones complex object');

    o = 'x';
    result = Benchmark.deepClone(o);
    deepEqual(result, o, 'clones string primitive');

    o = new String('x');
    result = Benchmark.deepClone(o);
    ok(result == 'x' && typeof result == 'object' &&
      toString.call(result) == '[object String]', 'clones string object');

    o = 3;
    result = Benchmark.deepClone(o);
    deepEqual(result, o, 'clones number primitive');

    o = new Number(3);
    result = Benchmark.deepClone(o);
    ok(result == 3 && typeof result == 'object' &&
      toString.call(result) == '[object Number]', 'clones number object');

    o = false;
    result = Benchmark.deepClone(o);
    deepEqual(result, o, 'clones boolean primitive');

    o = new Boolean(false);
    result = Benchmark.deepClone(o);
    ok(result == false && typeof result == 'object' &&
      toString.call(result) == '[object Boolean]', 'clones boolean object');

    o = null;
    result = Benchmark.deepClone(o);
    deepEqual(result, o, 'clones null');

    o = undefined;
    result = Benchmark.deepClone(o);
    deepEqual(result, o, 'clones undefined');

    o = [1, 'b', false];
    result = Benchmark.deepClone(o);
    deepEqual(result, o, 'clones array');

    o = /x/gim;
    result = Benchmark.deepClone(o);
    deepEqual(result, o, 'clones regexp');

    o = new Klass;
    ok(Benchmark.deepClone(o) === o, 'Klass instance is not cloned');
    ok(Benchmark.deepClone(arguments) === arguments, 'arguments object is not cloned');
    ok(Benchmark.deepClone(Klass) === Klass, 'function is not cloned');

    Klass.prototype.deepClone = function() { return new Klass; };
    result = Benchmark.deepClone(o);
    ok(result != o && result instanceof Klass, 'clones using Klass#deepClone');

    if (window.document) {
      ok(Benchmark.deepClone(document.body) === document.body, 'DOM element is not cloned');
    } else {
      skipTest(1)
    }
  });

  test('edge', function() {
    var result,
        has = {},
        o = {},
        getDescriptor = Object.getOwnPropertyDescriptor,
        setDescriptor = Object.defineProperty,
        toString = {}.toString;

    try {
      has.descriptors = (setDescriptor(o, o, o), 'value' in getDescriptor(o, o));
    } catch(e) {
      has.descriptors = false;
    }

    o = {
      'constructor': 1,
      'hasOwnProperty': 2,
      'isPrototypeOf': 3,
      'propertyIsEnumerable': 4,
      'toLocaleString': 5,
      'toString': 6,
      'valueOf': 7
    };

    function createCircularObject() {
      var result = {
        'foo': { 'b': { 'foo': { 'c': { } } } },
        'bar': { }
      };
      result.foo.b.foo.c.foo = result;
      result.bar.b = result.foo.b;
      return result;
    }

    result = Benchmark.deepClone(o);
    deepEqual(result, o, 'clones problem JScript props');

    (o = new String('x')).x = 1;
    result = Benchmark.deepClone(o);
    ok(result == 'x' && typeof result == 'object' && result.x === 1 &&
      toString.call(result) == '[object String]', 'clones string object with custom property');

    o = createCircularObject();
    result = Benchmark.deepClone(o);
    ok(result.bar.b === result.foo.b && result === result.foo.b.foo.c.foo &&
      result !== o, 'clones objects with circular references');

    if (Object.preventExtensions) {
      o = Object.preventExtensions(createCircularObject());
      Object.preventExtensions(o.bar.b);
      result = Benchmark.deepClone(o);
      ok(result.bar.b === result.foo.b && result === result.foo.b.foo.c.foo &&
        result !== o, 'clones non-extensible objects with circular references');
    } else {
      skipTest(1)
    }

    if (Object.seal) {
      o = Object.seal(createCircularObject());
      Object.seal(o.bar.b);
      result = Benchmark.deepClone(o);
      ok(result.bar.b === result.foo.b && result === result.foo.b.foo.c.foo &&
        result !== o, 'clones sealed objects with circular references');
    } else {
      skipTest(1)
    }

    if (Object.freeze) {
      o = Object.freeze(createCircularObject());
      Object.freeze(o.bar.b);
      result = Benchmark.deepClone(o);
      ok(result.bar.b === result.foo.b && result === result.foo.b.foo.c.foo &&
        result !== o, 'clones frozen objects with circular references');
    } else {
      skipTest(1)
    }

    if (has.descriptors) {
      var accessor;
      o = setDescriptor({}, 'foo', {
        'configurable': true,
        'value': setDescriptor({}, 'b', {
          'writable': true,
          'value': setDescriptor({}, 'foo', {
            'get': function() { return accessor; },
            'set': function(value) { accessor = value; }
          })
        })
      });

      setDescriptor(o, 'bar', { 'value': {} });
      o.foo.b.foo = { 'c': o };
      o.bar.b = o.foo.b;

      result = Benchmark.deepClone(o);

      var descriptor;
      ok(result !== o &&
        result.bar.b === result.foo.b &&
        result !== result.foo.b.foo.c.foo &&
        (descriptor = getDescriptor(result, 'foo')) &&
        descriptor.configurable && !(descriptor.enumerable && descriptor.writable) &&
        (descriptor = getDescriptor(result.foo, 'b')) &&
        descriptor.writable && !(descriptor.configurable && descriptor.enumerable) &&
        (descriptor = getDescriptor(result.foo.b, 'foo')) &&
        descriptor.get && descriptor.set &&
        (descriptor = getDescriptor(result.foo.b, 'foo')) &&
        !(descriptor.configurable && descriptor.enumerable && descriptor.writable) &&
        (descriptor = getDescriptor(result, 'bar')) &&
        !(descriptor.configurable && descriptor.enumerable && descriptor.writable),
        'clones objects with custom descriptors and circular references');
    }
    else {
      skipTest(1)
    }
  });

  test('call stack overflow', function() {
    var result,
        o = {},
        count = 0,
        recurse = function() { count++; recurse(); },
        setTimeout = window.setTimeout,
        toString = {}.toString;

    if (toString.call(window.java) == '[object JavaPackage]') {
      // Java throws uncatchable errors on call stack overflows, so to avoid
      // them I chose a number higher than Rhino's call stack limit without
      // dynamically testing for the actual limit
      count = 3e3;
    } else {
      try { recurse(); } catch(e) { }
    }
    count++;
    for (var i = 0, sub = o; i <= count; i++) {
      sub = sub[i] = {};
    }
    try {
      for (var i = 0, sub = Benchmark.deepClone(o); sub = sub[i]; i++) { }
      result = --i == count;
    } catch(e) { }

    ok(result, 'avoids call stack overflow (stack limit is ' + (count - 1) + ')');
  });

  /*--------------------------------------------------------------------------*/

  QUnit.module('Benchmark.each');

  test('basic', function() {
    var args,
        o = ['a', 'b', 'c'],
        values = [];

    var result = Benchmark.each(o, function(value) {
      args || (args = slice.call(arguments));
      values.push(value);
    });

    ok(o === result, 'object returned');
    deepEqual(values, ['a', 'b', 'c'], 'values');
    deepEqual(args, ['a', 0, o], 'passed arguments to callback');
    values.length = 0;

    Benchmark.each(o, function(value, index) {
      values.push(value);
      return !(index == 1);
    });

    deepEqual(values, ['a', 'b'], 'exit early');
  });

  test('array-like-object', function() {
    var thirdArg,
        values = [],
        o = { '0': 'a', '2': 'c', 'length': 3 };

    Benchmark.each(o, function(value) {
      values.push(value);
    });

    deepEqual(values, ['a', 'c'], 'sparse check');
    values.length = 0;

    Benchmark.each('hello', function(value, index, object) {
      thirdArg = object;
      values.push(value);
    });

    ok(thirdArg == 'hello' && typeof thirdArg == 'object', 'string passed, third callback arg');
    deepEqual(values, ['h', 'e', 'l', 'l', 'o'], 'string passed, values check');
    values.length = 0;

    Benchmark.each('hello', function(value) {
      values.push(value);
      return !(value == 'e');
    });

    deepEqual(values, ['h', 'e'], 'string passed, exit early');
  });

  test('xpath snapshot', function() {
    if (window.document && document.evaluate) {
      var o = document.evaluate('//html', document, null, 7, null),
          values = [];

      Benchmark.each(o, function(value) {
        values.push(value);
      });

      deepEqual(values, [document.documentElement], 'basic');
    }
    else {
      skipTest(1)
    }
  });

  /*--------------------------------------------------------------------------*/

  QUnit.module('Benchmark.filter');

  test('basic', function() {
    var args,
        o = ['a', 'b', 'c'];

    var result = Benchmark.filter(o, function(value) {
      args || (args = slice.call(arguments));
      return value == 'b';
    });

    deepEqual(result, ['b'], 'basic');
    deepEqual(args, ['a', 0, o], 'passed arguments to callback');
  });

  test('array-like-object', function() {
    var count = 0,
        o = { '0': 'a', '2': 'c', 'length': 3 };

    var result = Benchmark.filter(o, function(value) {
      count++;
      return value != null;
    });

    deepEqual(result, ['a', 'c'], 'basic');
    equal(count, 2, 'sparse check');
  });

  /*--------------------------------------------------------------------------*/

  QUnit.module('Benchmark.forOwn');

  test('basic', function() {
    var Klass = function(){ var me = this; me.a = 1; me.b = 2; me.c = 3; },
        args = [],
        values = [],
        o = (Klass.prototype.d = 4, new Klass);

    var result = Benchmark.forOwn(o, function(value) {
      if (value == 1) {
        args = slice.call(arguments);
      }
      values.push(value);
    });

    ok(o === result, 'object returned');
    deepEqual(values.sort(), [1, 2, 3], 'values');

    deepEqual(args, [1, 'a', o], 'passed arguments to callback');
    values.length = 0;

    Benchmark.forOwn(o, function(value, key) {
      values.push(value);
      return !(key == 'b');
    });

    deepEqual(values.sort(), [1, 2], 'exit early');
  });

  test('enumeration', function() {
    var thirdArg,
        Klass = function() { },
        keys = [],
        values = [];

    var o = {
      'constructor': 1,
      'hasOwnProperty': 2,
      'isPrototypeOf': 3,
      'propertyIsEnumerable': 4,
      'toLocaleString': 5,
      'toString': 6,
      'valueOf': 7
    };

    Klass.a = 1;
    Klass.prototype.b = 2;

    Benchmark.forOwn(o, function(value, key) {
      keys.push(key);
      values.push(value);
    });

    deepEqual(keys.sort(), ['constructor', 'hasOwnProperty', 'isPrototypeOf', 'propertyIsEnumerable', 'toLocaleString', 'toString', 'valueOf'], 'problem JScript props, keys check');
    keys.length = 0;

    deepEqual(values.sort(), [1, 2, 3, 4, 5, 6, 7], 'problem JScript props, values check');
    values.length = 0;

    Benchmark.forOwn(o, function(value, key) {
      keys.push(key);
      return !(key == 'hasOwnProperty');
    });

    ok(keys.length < 7, 'problem JScript props, exit early during forced iteration');
    keys.length = 0;

    o = { 'a': 1 };
    Benchmark.forOwn(o, function(value, key) {
      keys.push(key);
      if (key == 'a') {
        o.toString = 'toString';
        return false;
      }
    });

    deepEqual(keys, ['a'], 'problem JScript props, exit early before forced iteration');
    keys.length = 0;

    (function(a, b, c) {
      Benchmark.forOwn(arguments, function(value, key) {
        keys.push(key);
        values.push(value);
      });
    }('a', 'b', 'c'));

    deepEqual(keys.sort(), ['0', '1', '2'], 'arguments object, keys check');
    keys.length = 0;

    deepEqual(values.sort(), ['a', 'b', 'c'], 'arguments object, values check');
    values.length = 0;

    (function(a, b, c) {
      Benchmark.forOwn(arguments, function(value, key, object) {
        values.push(value);
        if (value == 'b') {
          object.toString = 'toString';
          return false;
        }
      });
    }('a', 'b', 'c'));

    deepEqual(values.sort(), ['a', 'b'], 'arguments object, exit early');
    values.length = 0;

    Benchmark.forOwn(Klass, function(value, key) {
      keys.push(key);
      values.push(value);
    });

    deepEqual(keys, ['a'], 'function passed, keys check');
    keys.length = 0;

    deepEqual(values, [1], 'function passed, values check');
    values.length = 0;

    Benchmark.forOwn(Klass.prototype, function(value, key) {
      keys.push(key);
      values.push(value);
    });

    deepEqual(keys, ['b'], 'prototype passed, keys check');
    keys.length = 0;

    deepEqual(values, [2], 'prototype passed, values check');
    values.length = 0;

    Benchmark.forOwn('hello', function(value, key, object) {
      thirdArg = object;
      keys.push(key);
      values.push(value);
    });

    equal(thirdArg, 'hello', 'string passed, third callback arg');
    deepEqual(keys.sort(), ['0', '1', '2', '3', '4'], 'string passed, keys check');
    deepEqual(values, ['h', 'e', 'l', 'l', 'o'], 'string passed, values check');
    values.length = 0;

    Benchmark.forOwn('hello', function(value, key, object) {
      values.push(value);
      if (value == 'e') {
        object.toString = 'toString';
        return false;
      }
    });

    deepEqual(values, ['h', 'e'], 'string passed, exit early');
  });

  /*--------------------------------------------------------------------------*/

  QUnit.module('Benchmark.formatNumber');

  test('basic', function() {
    var num = 1e6;
    equal(Benchmark.formatNumber(num), '1,000,000', 'basic');

    num = 23;
    equal(Benchmark.formatNumber(num), '23', 'short');

    num = 1234.56;
    equal(Benchmark.formatNumber(num), '1,234.56', 'decimals');

    num *= -1;
    equal(Benchmark.formatNumber(num), '-1,234.56', 'negatives');
  });

  /*--------------------------------------------------------------------------*/

  QUnit.module('Benchmark.indexOf');

  test('basic', function() {
    var o = ['a', 'b', 'c'];
    equal(Benchmark.indexOf(o, 'b'), 1, 'basic');
    equal(Benchmark.indexOf(o, new String('b')), -1, 'strict');
  });

  test('array-like-object', function() {
    var o = { '0': 'a', '2': 'c', 'length': 3 };
    equal(Benchmark.indexOf(o, 'c'), 2, 'basic');
    equal(Benchmark.indexOf(o, 'b'), -1, 'not found');
    equal(Benchmark.indexOf(o, undefined), -1, 'sparse check');
  });

  test('fromIndex', function() {
    var o = ['a', 'b', 'c', 'a'];
    o['-1'] = 'z';
    equal(Benchmark.indexOf(o, 'a', 1), 3, 'fromIndex');
    equal(Benchmark.indexOf(o, 'z', -5), -1, 'extreme negative fromIndex');

    o = { '0': 'a', '2': 'c', '3': 'z', 'length': 3 };
    equal(Benchmark.indexOf(o, 'z', 3), -1, 'extreme positive fromIndex');
  });

  /*--------------------------------------------------------------------------*/

  QUnit.module('Benchmark.invoke');

  test('basic', function() {
    var callback = function() { callbacks.push(slice.call(arguments)); },
        callbacks = [],
        lengths = [],
        o = [new Array, null, new Array, new Array];

    var result = Benchmark.invoke(o, 'push', 'b');
    deepEqual(result, [1, undefined, 1, 1], 'return values');

    result = Benchmark.pluck(o, '0');
    deepEqual(result, ['b', undefined, 'b', 'b'], 'methods invoked');

    Benchmark.invoke(o, {
      'name': 'splice',
      'args': [0, 0, 'a'],
      'onStart': callback,
      'onCycle': callback,
      'onComplete': callback
    });

    ok(callbacks[0].length == 2 && callbacks[0][0].type && callbacks[0][1].push, 'passed arguments to callback');
    equal(callbacks.shift()[0].type, 'start', 'onStart');
    equal(callbacks.shift()[0].type, 'cycle', 'onCycle');
    equal(callbacks.pop()[0].type, 'complete', 'onComplete');
  });

  test('queued', function() {
    var expected = [1, 1],
        lengths = [],
        o = [new Array, new Array];

    o[3] = new Array;
    expected[3] = 1;

    var result = Benchmark.invoke(o, {
      'name': 'push',
      'queued': true,
      'args': 'a',
      'onCycle': function() {
        lengths.push(o.length);
      }
    });

    deepEqual(lengths, [4, 3, 1], 'removed queued items');
    deepEqual(result, expected, 'return values');
  });

  test('array-like-object', function() {
    var expected = [1];
    var result = Benchmark.invoke({
      '0': new Array,
      '2': new Array,
      'length': 3
    }, 'push', 'a');

    expected[2] = 1;
    deepEqual(result, expected, 'sparse check');
  });

  /*--------------------------------------------------------------------------*/

  QUnit.module('Benchmark.join');

  test('basic', function() {
    var o = ['a', 'b', 'c'];
    equal(Benchmark.join(o), 'a,b,c', 'default separator 1');
    equal(Benchmark.join(o, '+', '@'), 'a+b+c', 'custom separator 1');

    o = { 'a': 'apple', 'b': 'ball', 'c': 'cat' };
    equal(Benchmark.join(o), 'a: apple,b: ball,c: cat', 'default separator 2');
    equal(Benchmark.join(o, '; ', ' -> '), 'a -> apple; b -> ball; c -> cat', 'custom separator 2');
  });

  test('array-like-object', function() {
    var o = { '0': 'a', '2': 'c', 'length': 3 };
    equal(Benchmark.join(o), 'a,c', 'sparse check');
  });

  /*--------------------------------------------------------------------------*/

  QUnit.module('Benchmark.map');

  test('basic', function() {
    var args,
        o = ['a', 'b', 'c'];

    var result = Benchmark.map(o, function(value, index) {
      args || (args = slice.call(arguments));
      return index;
    });

    deepEqual(result, [0, 1, 2], 'basic');
    deepEqual(args, ['a', 0, o], 'passed arguments to callback');
  });

  test('array-like-object', function() {
    var expected = [0],
        o = { '0': 'a', '2': 'c', 'length': 4 };

    var result = Benchmark.map(o, function(value, index) {
      return index;
    });

    expected[2] = 2;
    expected.length = 4;
    deepEqual(result, expected, 'sparse value check');
    deepEqual(result.length, 4, 'sparse length check');
  });

  /*--------------------------------------------------------------------------*/

  QUnit.module('Benchmark.pluck');

  test('basic', function() {
    var o = [{ 'name': 'a' }, null, { 'name': 'c' }],
        result = Benchmark.pluck(o, 'name');

    deepEqual(result, ['a', undefined, 'c'], 'basic');

    result = Benchmark.pluck(o, 'nonexistent');
    deepEqual(result, [undefined, undefined, undefined], 'undefined property');
  });

  test('array-like-object', function() {
    var expected = ['a'],
        o = { '0': { 'name': 'a' }, '2': { 'name': 'c' }, 'length': 3 },
        result = Benchmark.pluck(o, 'name');

    expected[2] = 'c';
    deepEqual(result, expected, 'sparse check');
  });

  /*--------------------------------------------------------------------------*/

  QUnit.module('Benchmark.reduce');

  test('basic', function() {
    var args,
        o = ['a', 'b', 'c'];

    var result = Benchmark.reduce(o, function(string, value, index) {
      args || (args = slice.call(arguments));
      return string + value;
    }, '');

    equal(result, 'abc', 'accumulation correct');
    deepEqual(args, ['', 'a', 0, o], 'passed arguments to callback');
    args = null;

    Benchmark.reduce(o, function() {
      args || (args = slice.call(arguments));
    });
    deepEqual(args, ['a', 'b', 1, o], 'no initial value');
  });

  test('array-like-object', function() {
    var o = { '0': 'a', '2': 'c', 'length': 3 };
    var result = Benchmark.reduce(o, function(string, value, index) {
      return string + value;
    });

    equal(result, 'ac', 'sparse check');
  });

  /*--------------------------------------------------------------------------*/

  QUnit.module('Benchmark#clone');

  test('basic', function() {
    var i = 0,
        options = Benchmark.options,
        maxTime = options.maxTime;

    options.maxTime = options.minTime * 5;
    var bench = Benchmark(function() { i++; }).run();
    options.maxTime = maxTime;

    var clone = bench.clone();
    deepEqual(clone, bench, 'clones properties');
    ok(clone.stats != bench.stats && clone.times != bench.times && clone.options != bench.options, 'deep clones object properties');

    clone = bench.clone({ 'fn': '', 'name': 'foo' });
    ok(clone.fn === '' && clone.options.fn === '', 'adds custom "fn" option');
    equal(clone.name, 'foo', 'adds other custom options');
  });

  /*--------------------------------------------------------------------------*/

  QUnit.module('Benchmark#off');

  test('basic', function() {

  });

  /*--------------------------------------------------------------------------*/

  QUnit.module('Benchmark#on');

  test('basic', function() {

  });

  /*--------------------------------------------------------------------------*/

  QUnit.module('Benchmark#emit');

  test('basic', function() {
    var event,
        args = [],
        bench = Benchmark(),
        listener2 = function(eventObject) { eventObject.listener2 = 1 };

    bench.on('args', function() { args = slice.call(arguments, 1); });
    bench.emit('args', 'a', 'b', 'c');
    bench.events = {};
    deepEqual(args, ['a', 'b', 'c'], 'emit passed arguments');

    event = Benchmark.Event('empty');
    bench.emit(event);
    ok(!event.cancelled, 'emit empty successful');

    event = Benchmark.Event('constructor');
    bench.emit(event);
    ok(!event.cancelled, 'emit with name of property on Object.prototype');

    event = Benchmark.Event('success');
    bench.on('success', function() { return 'x'; });
    ok(bench.emit(event) === 'x' && !event.cancelled, 'emit successful');

    event = Benchmark.Event('success');
    bench.on('success', function() { return false; });
    bench.emit(event);
    ok(event.cancelled, 'emit cancelled');
    bench.events = {};

    bench.on('shallowclone', function(eventObject) {
      event = eventObject;
      bench.off(event.type, listener2);
    })
    .on('shallowclone', listener2)
    .emit('shallowclone');
    bench.events = {};
    ok(event.listener2, 'emit shallow cloned listeners');
  });

  test('event object', function() {
    var bench = Benchmark(),
        event = Benchmark.Event('custom');

    bench.on('custom', function(eventObject) { eventObject.touched = 1; });
    bench.emit(event);
    bench.events = {};
    ok(event.touched, 'emit custom event object');

    event = Benchmark.Event('result');
    bench.on('result', function() { return 'x'; });
    bench.emit(event);
    equal(event.result, 'x', 'event.result');
    bench.events = {};

    bench.on('type', function(eventObj) { event = eventObj; });
    bench.emit('type');
    equal(event.type, 'type', 'event.type');
    bench.events = {};
  });

  /*--------------------------------------------------------------------------*/

  QUnit.module('Benchmark.Suite#abort');

  test('basic', function() {
    var fired = false;
    var suite = Benchmark.Suite('suite', {
      'onAbort': function() { fired = true }
    })
    .add('foo', function() { });

    suite.abort();
    ok(fired == false, 'calling abort() won\'t fire an abort event when suite isn\'t running');

    fired = false;
    suite.reset();
    ok(fired == false, 'calling reset() won\'t fire an abort event when suite isn\'t running');
  });

  /*--------------------------------------------------------------------------*/

  QUnit.module('Benchmark.Suite#add');

  test('event flow', function() {
    var event,
        events = [],
        callback = function(event) { events.push(event); };

    var suite = Benchmark.Suite('suite', {
      'onAdd': callback,
      'onAbort': callback,
      'onClone': callback,
      'onError': callback,
      'onStart': callback,
      'onCycle': callback,
      'onComplete': callback,
      'onReset': callback
    })
    .add('foo', function() {
      throw null;
    }, {
      'onAbort': callback,
      'onClone': callback,
      'onError': callback,
      'onStart': callback,
      'onCycle': callback,
      'onComplete': callback,
      'onReset': callback
    })
    .run({ 'async': false });

    // first Suite#onAdd
    event = events.shift();
    ok(event.type == 'add' && event.currentTarget.name == 'suite' && event.target.name == 'foo',
      'passed arguments to Suite#onAdd');

    // next we start the Suite because no reset was needed
    event = events.shift();
    ok(event.type == 'start' && event.currentTarget.name == 'suite' && event.target.name == 'foo',
      'passed arguments to Suite#onStart');

    // and so start the first benchmark
    event = events.shift();
    ok(event.type == 'start' && event.currentTarget.name == 'foo',
      'passed arguments to Benchmark#onStart');

    // oh no! we abort because of an error
    event = events.shift();
    ok(event.type == 'abort' && event.currentTarget.name == 'foo',
      'passed arguments to Benchmark#onAbort');

    // we reset the benchmark as part of the abort
    event = events.shift();
    ok(event.type == 'reset' && event.currentTarget.name == 'foo',
      'passed arguments to Benchmark#onReset');

    // benchmark error triggered
    event = events.shift();
    ok(event.type == 'error' && event.currentTarget.name == 'foo',
      'passed arguments to Benchmark#onError');

    // benchmark is cycle is finished
    event = events.shift();
    ok(event.type == 'cycle' && event.currentTarget.name == 'foo',
      'passed arguments to Benchmark#onCycle');

    // benchmark is complete
    event = events.shift();
    ok(event.type == 'complete' && event.currentTarget.name == 'foo',
      'passed arguments to Benchmark#onComplete');

    // the benchmark error triggers a Suite error
    event = events.shift();
    ok(event.type == 'error' && event.currentTarget.name == 'suite' && event.target.name == 'foo',
      'passed arguments to Suite#onError');

    // the Suite cycle finishes
    event = events.shift();
    ok(event.type == 'cycle' && event.currentTarget.name == 'suite' && event.target.name == 'foo',
      'passed arguments to Suite#onCycle');

    // the Suite completes
    event = events.shift();
    ok(event.type == 'complete' && event.currentTarget.name == 'suite' && event.target.name == 'foo',
      'passed arguments to Suite#onComplete');

    ok(events.length == 0, 'all callbacks executed');
  });

  /*--------------------------------------------------------------------------*/

  QUnit.module('Async tests');

  asyncTest('Benchmark.options.defer', function() {
    var options = Benchmark.options,
        maxTime = options.maxTime;

    options.maxTime = options.minTime * 5;

    Benchmark(function(deferred) {
      setTimeout(function() { deferred.resolve(); }, 10);
    }, {
      'defer': true,
      'onComplete': function() {
        ok(this.cycles, 'deferred benchmark');
        options.maxTime = maxTime;
        QUnit.start();
      }
    })
    .run();
  });

  asyncTest('Benchmark.filter', function() {
    var count = 0,
        options = Benchmark.options,
        maxTime = options.maxTime,
        suite = new Benchmark.Suite;

    options.maxTime = options.minTime * 5;

    suite.add('a', function() {
      count++;
    })
    .add('b', function() {
      for (var i = 0; i < 1e6; i++) {
        count++;
      }
    })
    .add('c', function() {
      throw new TypeError;
    })
    .on('complete', function() {
      deepEqual(this.filter('fastest').pluck('name'), ['a'], 'by fastest');
      deepEqual(this.filter('slowest').pluck('name'), ['b'], 'by slowest');
      deepEqual(this.filter('successful').pluck('name'), ['a', 'b'], 'by successful');
      options.maxTime = maxTime;
      QUnit.start();
    })
    .run({ 'async': true });
  });

  asyncTest('Benchmark.Suite#abort', function() {
    var count = -1,
        fired = false;

    var suite = Benchmark.Suite('foo', {
      'onAbort': function() { fired = true }
    })
    .add('a', function() {
      // empty
    })
    .on('start', function() {
      this[++count ? 'reset' : 'abort']();
      this.aborted = true;
    })
    .on('complete', function() {
      if (count == 0) {
        ok(fired == true, 'calling abort() fires an abort event when suite is running');
        fired = false;
        suite.run({ 'async': true });
      } else {
        ok(fired == true, 'calling reset() fires an abort event when suite is running');
        QUnit.start();
      }
    });

    suite.run({ 'async': true });
  });

  /*--------------------------------------------------------------------------*/

  // explicitly call `QUnit.start()` in a CLI environment
  if (!window.document) {
    QUnit.start();
  }
}(typeof global == 'object' && global || this));