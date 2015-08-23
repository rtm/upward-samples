(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],2:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            currentQueue[queueIndex].run();
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],3:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],4:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./support/isBuffer":3,"_process":2,"inherits":1}],5:[function(require,module,exports){
// Released under MIT license
// Copyright (c) 2009-2010 Dominic Baggott
// Copyright (c) 2009-2010 Ash Berlin
// Copyright (c) 2011 Christoph Dorn <christoph@christophdorn.com> (http://www.christophdorn.com)

/*jshint browser:true, devel:true */

(function( expose ) {

/**
 *  class Markdown
 *
 *  Markdown processing in Javascript done right. We have very particular views
 *  on what constitutes 'right' which include:
 *
 *  - produces well-formed HTML (this means that em and strong nesting is
 *    important)
 *
 *  - has an intermediate representation to allow processing of parsed data (We
 *    in fact have two, both as [JsonML]: a markdown tree and an HTML tree).
 *
 *  - is easily extensible to add new dialects without having to rewrite the
 *    entire parsing mechanics
 *
 *  - has a good test suite
 *
 *  This implementation fulfills all of these (except that the test suite could
 *  do with expanding to automatically run all the fixtures from other Markdown
 *  implementations.)
 *
 *  ##### Intermediate Representation
 *
 *  *TODO* Talk about this :) Its JsonML, but document the node names we use.
 *
 *  [JsonML]: http://jsonml.org/ "JSON Markup Language"
 **/
var Markdown = expose.Markdown = function(dialect) {
  switch (typeof dialect) {
    case "undefined":
      this.dialect = Markdown.dialects.Gruber;
      break;
    case "object":
      this.dialect = dialect;
      break;
    default:
      if ( dialect in Markdown.dialects ) {
        this.dialect = Markdown.dialects[dialect];
      }
      else {
        throw new Error("Unknown Markdown dialect '" + String(dialect) + "'");
      }
      break;
  }
  this.em_state = [];
  this.strong_state = [];
  this.debug_indent = "";
};

/**
 *  parse( markdown, [dialect] ) -> JsonML
 *  - markdown (String): markdown string to parse
 *  - dialect (String | Dialect): the dialect to use, defaults to gruber
 *
 *  Parse `markdown` and return a markdown document as a Markdown.JsonML tree.
 **/
expose.parse = function( source, dialect ) {
  // dialect will default if undefined
  var md = new Markdown( dialect );
  return md.toTree( source );
};

/**
 *  toHTML( markdown, [dialect]  ) -> String
 *  toHTML( md_tree ) -> String
 *  - markdown (String): markdown string to parse
 *  - md_tree (Markdown.JsonML): parsed markdown tree
 *
 *  Take markdown (either as a string or as a JsonML tree) and run it through
 *  [[toHTMLTree]] then turn it into a well-formated HTML fragment.
 **/
expose.toHTML = function toHTML( source , dialect , options ) {
  var input = expose.toHTMLTree( source , dialect , options );

  return expose.renderJsonML( input );
};

/**
 *  toHTMLTree( markdown, [dialect] ) -> JsonML
 *  toHTMLTree( md_tree ) -> JsonML
 *  - markdown (String): markdown string to parse
 *  - dialect (String | Dialect): the dialect to use, defaults to gruber
 *  - md_tree (Markdown.JsonML): parsed markdown tree
 *
 *  Turn markdown into HTML, represented as a JsonML tree. If a string is given
 *  to this function, it is first parsed into a markdown tree by calling
 *  [[parse]].
 **/
expose.toHTMLTree = function toHTMLTree( input, dialect , options ) {
  // convert string input to an MD tree
  if ( typeof input ==="string" ) input = this.parse( input, dialect );

  // Now convert the MD tree to an HTML tree

  // remove references from the tree
  var attrs = extract_attr( input ),
      refs = {};

  if ( attrs && attrs.references ) {
    refs = attrs.references;
  }

  var html = convert_tree_to_html( input, refs , options );
  merge_text_nodes( html );
  return html;
};

// For Spidermonkey based engines
function mk_block_toSource() {
  return "Markdown.mk_block( " +
          uneval(this.toString()) +
          ", " +
          uneval(this.trailing) +
          ", " +
          uneval(this.lineNumber) +
          " )";
}

// node
function mk_block_inspect() {
  var util = require("util");
  return "Markdown.mk_block( " +
          util.inspect(this.toString()) +
          ", " +
          util.inspect(this.trailing) +
          ", " +
          util.inspect(this.lineNumber) +
          " )";

}

var mk_block = Markdown.mk_block = function(block, trail, line) {
  // Be helpful for default case in tests.
  if ( arguments.length == 1 ) trail = "\n\n";

  var s = new String(block);
  s.trailing = trail;
  // To make it clear its not just a string
  s.inspect = mk_block_inspect;
  s.toSource = mk_block_toSource;

  if ( line != undefined )
    s.lineNumber = line;

  return s;
};

function count_lines( str ) {
  var n = 0, i = -1;
  while ( ( i = str.indexOf("\n", i + 1) ) !== -1 ) n++;
  return n;
}

// Internal - split source into rough blocks
Markdown.prototype.split_blocks = function splitBlocks( input, startLine ) {
  input = input.replace(/(\r\n|\n|\r)/g, "\n");
  // [\s\S] matches _anything_ (newline or space)
  // [^] is equivalent but doesn't work in IEs.
  var re = /([\s\S]+?)($|\n#|\n(?:\s*\n|$)+)/g,
      blocks = [],
      m;

  var line_no = 1;

  if ( ( m = /^(\s*\n)/.exec(input) ) != null ) {
    // skip (but count) leading blank lines
    line_no += count_lines( m[0] );
    re.lastIndex = m[0].length;
  }

  while ( ( m = re.exec(input) ) !== null ) {
    if (m[2] == "\n#") {
      m[2] = "\n";
      re.lastIndex--;
    }
    blocks.push( mk_block( m[1], m[2], line_no ) );
    line_no += count_lines( m[0] );
  }

  return blocks;
};

/**
 *  Markdown#processBlock( block, next ) -> undefined | [ JsonML, ... ]
 *  - block (String): the block to process
 *  - next (Array): the following blocks
 *
 * Process `block` and return an array of JsonML nodes representing `block`.
 *
 * It does this by asking each block level function in the dialect to process
 * the block until one can. Succesful handling is indicated by returning an
 * array (with zero or more JsonML nodes), failure by a false value.
 *
 * Blocks handlers are responsible for calling [[Markdown#processInline]]
 * themselves as appropriate.
 *
 * If the blocks were split incorrectly or adjacent blocks need collapsing you
 * can adjust `next` in place using shift/splice etc.
 *
 * If any of this default behaviour is not right for the dialect, you can
 * define a `__call__` method on the dialect that will get invoked to handle
 * the block processing.
 */
Markdown.prototype.processBlock = function processBlock( block, next ) {
  var cbs = this.dialect.block,
      ord = cbs.__order__;

  if ( "__call__" in cbs ) {
    return cbs.__call__.call(this, block, next);
  }

  for ( var i = 0; i < ord.length; i++ ) {
    //D:this.debug( "Testing", ord[i] );
    var res = cbs[ ord[i] ].call( this, block, next );
    if ( res ) {
      //D:this.debug("  matched");
      if ( !isArray(res) || ( res.length > 0 && !( isArray(res[0]) ) ) )
        this.debug(ord[i], "didn't return a proper array");
      //D:this.debug( "" );
      return res;
    }
  }

  // Uhoh! no match! Should we throw an error?
  return [];
};

Markdown.prototype.processInline = function processInline( block ) {
  return this.dialect.inline.__call__.call( this, String( block ) );
};

/**
 *  Markdown#toTree( source ) -> JsonML
 *  - source (String): markdown source to parse
 *
 *  Parse `source` into a JsonML tree representing the markdown document.
 **/
// custom_tree means set this.tree to `custom_tree` and restore old value on return
Markdown.prototype.toTree = function toTree( source, custom_root ) {
  var blocks = source instanceof Array ? source : this.split_blocks( source );

  // Make tree a member variable so its easier to mess with in extensions
  var old_tree = this.tree;
  try {
    this.tree = custom_root || this.tree || [ "markdown" ];

    blocks:
    while ( blocks.length ) {
      var b = this.processBlock( blocks.shift(), blocks );

      // Reference blocks and the like won't return any content
      if ( !b.length ) continue blocks;

      this.tree.push.apply( this.tree, b );
    }
    return this.tree;
  }
  finally {
    if ( custom_root ) {
      this.tree = old_tree;
    }
  }
};

// Noop by default
Markdown.prototype.debug = function () {
  var args = Array.prototype.slice.call( arguments);
  args.unshift(this.debug_indent);
  if ( typeof print !== "undefined" )
      print.apply( print, args );
  if ( typeof console !== "undefined" && typeof console.log !== "undefined" )
      console.log.apply( null, args );
}

Markdown.prototype.loop_re_over_block = function( re, block, cb ) {
  // Dont use /g regexps with this
  var m,
      b = block.valueOf();

  while ( b.length && (m = re.exec(b) ) != null ) {
    b = b.substr( m[0].length );
    cb.call(this, m);
  }
  return b;
};

/**
 * Markdown.dialects
 *
 * Namespace of built-in dialects.
 **/
Markdown.dialects = {};

/**
 * Markdown.dialects.Gruber
 *
 * The default dialect that follows the rules set out by John Gruber's
 * markdown.pl as closely as possible. Well actually we follow the behaviour of
 * that script which in some places is not exactly what the syntax web page
 * says.
 **/
Markdown.dialects.Gruber = {
  block: {
    atxHeader: function atxHeader( block, next ) {
      var m = block.match( /^(#{1,6})\s*(.*?)\s*#*\s*(?:\n|$)/ );

      if ( !m ) return undefined;

      var header = [ "header", { level: m[ 1 ].length } ];
      Array.prototype.push.apply(header, this.processInline(m[ 2 ]));

      if ( m[0].length < block.length )
        next.unshift( mk_block( block.substr( m[0].length ), block.trailing, block.lineNumber + 2 ) );

      return [ header ];
    },

    setextHeader: function setextHeader( block, next ) {
      var m = block.match( /^(.*)\n([-=])\2\2+(?:\n|$)/ );

      if ( !m ) return undefined;

      var level = ( m[ 2 ] === "=" ) ? 1 : 2;
      var header = [ "header", { level : level }, m[ 1 ] ];

      if ( m[0].length < block.length )
        next.unshift( mk_block( block.substr( m[0].length ), block.trailing, block.lineNumber + 2 ) );

      return [ header ];
    },

    code: function code( block, next ) {
      // |    Foo
      // |bar
      // should be a code block followed by a paragraph. Fun
      //
      // There might also be adjacent code block to merge.

      var ret = [],
          re = /^(?: {0,3}\t| {4})(.*)\n?/,
          lines;

      // 4 spaces + content
      if ( !block.match( re ) ) return undefined;

      block_search:
      do {
        // Now pull out the rest of the lines
        var b = this.loop_re_over_block(
                  re, block.valueOf(), function( m ) { ret.push( m[1] ); } );

        if ( b.length ) {
          // Case alluded to in first comment. push it back on as a new block
          next.unshift( mk_block(b, block.trailing) );
          break block_search;
        }
        else if ( next.length ) {
          // Check the next block - it might be code too
          if ( !next[0].match( re ) ) break block_search;

          // Pull how how many blanks lines follow - minus two to account for .join
          ret.push ( block.trailing.replace(/[^\n]/g, "").substring(2) );

          block = next.shift();
        }
        else {
          break block_search;
        }
      } while ( true );

      return [ [ "code_block", ret.join("\n") ] ];
    },

    horizRule: function horizRule( block, next ) {
      // this needs to find any hr in the block to handle abutting blocks
      var m = block.match( /^(?:([\s\S]*?)\n)?[ \t]*([-_*])(?:[ \t]*\2){2,}[ \t]*(?:\n([\s\S]*))?$/ );

      if ( !m ) {
        return undefined;
      }

      var jsonml = [ [ "hr" ] ];

      // if there's a leading abutting block, process it
      if ( m[ 1 ] ) {
        jsonml.unshift.apply( jsonml, this.processBlock( m[ 1 ], [] ) );
      }

      // if there's a trailing abutting block, stick it into next
      if ( m[ 3 ] ) {
        next.unshift( mk_block( m[ 3 ] ) );
      }

      return jsonml;
    },

    // There are two types of lists. Tight and loose. Tight lists have no whitespace
    // between the items (and result in text just in the <li>) and loose lists,
    // which have an empty line between list items, resulting in (one or more)
    // paragraphs inside the <li>.
    //
    // There are all sorts weird edge cases about the original markdown.pl's
    // handling of lists:
    //
    // * Nested lists are supposed to be indented by four chars per level. But
    //   if they aren't, you can get a nested list by indenting by less than
    //   four so long as the indent doesn't match an indent of an existing list
    //   item in the 'nest stack'.
    //
    // * The type of the list (bullet or number) is controlled just by the
    //    first item at the indent. Subsequent changes are ignored unless they
    //    are for nested lists
    //
    lists: (function( ) {
      // Use a closure to hide a few variables.
      var any_list = "[*+-]|\\d+\\.",
          bullet_list = /[*+-]/,
          number_list = /\d+\./,
          // Capture leading indent as it matters for determining nested lists.
          is_list_re = new RegExp( "^( {0,3})(" + any_list + ")[ \t]+" ),
          indent_re = "(?: {0,3}\\t| {4})";

      // TODO: Cache this regexp for certain depths.
      // Create a regexp suitable for matching an li for a given stack depth
      function regex_for_depth( depth ) {

        return new RegExp(
          // m[1] = indent, m[2] = list_type
          "(?:^(" + indent_re + "{0," + depth + "} {0,3})(" + any_list + ")\\s+)|" +
          // m[3] = cont
          "(^" + indent_re + "{0," + (depth-1) + "}[ ]{0,4})"
        );
      }
      function expand_tab( input ) {
        return input.replace( / {0,3}\t/g, "    " );
      }

      // Add inline content `inline` to `li`. inline comes from processInline
      // so is an array of content
      function add(li, loose, inline, nl) {
        if ( loose ) {
          li.push( [ "para" ].concat(inline) );
          return;
        }
        // Hmmm, should this be any block level element or just paras?
        var add_to = li[li.length -1] instanceof Array && li[li.length - 1][0] == "para"
                   ? li[li.length -1]
                   : li;

        // If there is already some content in this list, add the new line in
        if ( nl && li.length > 1 ) inline.unshift(nl);

        for ( var i = 0; i < inline.length; i++ ) {
          var what = inline[i],
              is_str = typeof what == "string";
          if ( is_str && add_to.length > 1 && typeof add_to[add_to.length-1] == "string" ) {
            add_to[ add_to.length-1 ] += what;
          }
          else {
            add_to.push( what );
          }
        }
      }

      // contained means have an indent greater than the current one. On
      // *every* line in the block
      function get_contained_blocks( depth, blocks ) {

        var re = new RegExp( "^(" + indent_re + "{" + depth + "}.*?\\n?)*$" ),
            replace = new RegExp("^" + indent_re + "{" + depth + "}", "gm"),
            ret = [];

        while ( blocks.length > 0 ) {
          if ( re.exec( blocks[0] ) ) {
            var b = blocks.shift(),
                // Now remove that indent
                x = b.replace( replace, "");

            ret.push( mk_block( x, b.trailing, b.lineNumber ) );
          }
          else {
            break;
          }
        }
        return ret;
      }

      // passed to stack.forEach to turn list items up the stack into paras
      function paragraphify(s, i, stack) {
        var list = s.list;
        var last_li = list[list.length-1];

        if ( last_li[1] instanceof Array && last_li[1][0] == "para" ) {
          return;
        }
        if ( i + 1 == stack.length ) {
          // Last stack frame
          // Keep the same array, but replace the contents
          last_li.push( ["para"].concat( last_li.splice(1, last_li.length - 1) ) );
        }
        else {
          var sublist = last_li.pop();
          last_li.push( ["para"].concat( last_li.splice(1, last_li.length - 1) ), sublist );
        }
      }

      // The matcher function
      return function( block, next ) {
        var m = block.match( is_list_re );
        if ( !m ) return undefined;

        function make_list( m ) {
          var list = bullet_list.exec( m[2] )
                   ? ["bulletlist"]
                   : ["numberlist"];

          stack.push( { list: list, indent: m[1] } );
          return list;
        }


        var stack = [], // Stack of lists for nesting.
            list = make_list( m ),
            last_li,
            loose = false,
            ret = [ stack[0].list ],
            i;

        // Loop to search over block looking for inner block elements and loose lists
        loose_search:
        while ( true ) {
          // Split into lines preserving new lines at end of line
          var lines = block.split( /(?=\n)/ );

          // We have to grab all lines for a li and call processInline on them
          // once as there are some inline things that can span lines.
          var li_accumulate = "";

          // Loop over the lines in this block looking for tight lists.
          tight_search:
          for ( var line_no = 0; line_no < lines.length; line_no++ ) {
            var nl = "",
                l = lines[line_no].replace(/^\n/, function(n) { nl = n; return ""; });

            // TODO: really should cache this
            var line_re = regex_for_depth( stack.length );

            m = l.match( line_re );
            //print( "line:", uneval(l), "\nline match:", uneval(m) );

            // We have a list item
            if ( m[1] !== undefined ) {
              // Process the previous list item, if any
              if ( li_accumulate.length ) {
                add( last_li, loose, this.processInline( li_accumulate ), nl );
                // Loose mode will have been dealt with. Reset it
                loose = false;
                li_accumulate = "";
              }

              m[1] = expand_tab( m[1] );
              var wanted_depth = Math.floor(m[1].length/4)+1;
              //print( "want:", wanted_depth, "stack:", stack.length);
              if ( wanted_depth > stack.length ) {
                // Deep enough for a nested list outright
                //print ( "new nested list" );
                list = make_list( m );
                last_li.push( list );
                last_li = list[1] = [ "listitem" ];
              }
              else {
                // We aren't deep enough to be strictly a new level. This is
                // where Md.pl goes nuts. If the indent matches a level in the
                // stack, put it there, else put it one deeper then the
                // wanted_depth deserves.
                var found = false;
                for ( i = 0; i < stack.length; i++ ) {
                  if ( stack[ i ].indent != m[1] ) continue;
                  list = stack[ i ].list;
                  stack.splice( i+1, stack.length - (i+1) );
                  found = true;
                  break;
                }

                if (!found) {
                  //print("not found. l:", uneval(l));
                  wanted_depth++;
                  if ( wanted_depth <= stack.length ) {
                    stack.splice(wanted_depth, stack.length - wanted_depth);
                    //print("Desired depth now", wanted_depth, "stack:", stack.length);
                    list = stack[wanted_depth-1].list;
                    //print("list:", uneval(list) );
                  }
                  else {
                    //print ("made new stack for messy indent");
                    list = make_list(m);
                    last_li.push(list);
                  }
                }

                //print( uneval(list), "last", list === stack[stack.length-1].list );
                last_li = [ "listitem" ];
                list.push(last_li);
              } // end depth of shenegains
              nl = "";
            }

            // Add content
            if ( l.length > m[0].length ) {
              li_accumulate += nl + l.substr( m[0].length );
            }
          } // tight_search

          if ( li_accumulate.length ) {
            add( last_li, loose, this.processInline( li_accumulate ), nl );
            // Loose mode will have been dealt with. Reset it
            loose = false;
            li_accumulate = "";
          }

          // Look at the next block - we might have a loose list. Or an extra
          // paragraph for the current li
          var contained = get_contained_blocks( stack.length, next );

          // Deal with code blocks or properly nested lists
          if ( contained.length > 0 ) {
            // Make sure all listitems up the stack are paragraphs
            forEach( stack, paragraphify, this);

            last_li.push.apply( last_li, this.toTree( contained, [] ) );
          }

          var next_block = next[0] && next[0].valueOf() || "";

          if ( next_block.match(is_list_re) || next_block.match( /^ / ) ) {
            block = next.shift();

            // Check for an HR following a list: features/lists/hr_abutting
            var hr = this.dialect.block.horizRule( block, next );

            if ( hr ) {
              ret.push.apply(ret, hr);
              break;
            }

            // Make sure all listitems up the stack are paragraphs
            forEach( stack, paragraphify, this);

            loose = true;
            continue loose_search;
          }
          break;
        } // loose_search

        return ret;
      };
    })(),

    blockquote: function blockquote( block, next ) {
      if ( !block.match( /^>/m ) )
        return undefined;

      var jsonml = [];

      // separate out the leading abutting block, if any. I.e. in this case:
      //
      //  a
      //  > b
      //
      if ( block[ 0 ] != ">" ) {
        var lines = block.split( /\n/ ),
            prev = [],
            line_no = block.lineNumber;

        // keep shifting lines until you find a crotchet
        while ( lines.length && lines[ 0 ][ 0 ] != ">" ) {
            prev.push( lines.shift() );
            line_no++;
        }

        var abutting = mk_block( prev.join( "\n" ), "\n", block.lineNumber );
        jsonml.push.apply( jsonml, this.processBlock( abutting, [] ) );
        // reassemble new block of just block quotes!
        block = mk_block( lines.join( "\n" ), block.trailing, line_no );
      }


      // if the next block is also a blockquote merge it in
      while ( next.length && next[ 0 ][ 0 ] == ">" ) {
        var b = next.shift();
        block = mk_block( block + block.trailing + b, b.trailing, block.lineNumber );
      }

      // Strip off the leading "> " and re-process as a block.
      var input = block.replace( /^> ?/gm, "" ),
          old_tree = this.tree,
          processedBlock = this.toTree( input, [ "blockquote" ] ),
          attr = extract_attr( processedBlock );

      // If any link references were found get rid of them
      if ( attr && attr.references ) {
        delete attr.references;
        // And then remove the attribute object if it's empty
        if ( isEmpty( attr ) ) {
          processedBlock.splice( 1, 1 );
        }
      }

      jsonml.push( processedBlock );
      return jsonml;
    },

    referenceDefn: function referenceDefn( block, next) {
      var re = /^\s*\[(.*?)\]:\s*(\S+)(?:\s+(?:(['"])(.*?)\3|\((.*?)\)))?\n?/;
      // interesting matches are [ , ref_id, url, , title, title ]

      if ( !block.match(re) )
        return undefined;

      // make an attribute node if it doesn't exist
      if ( !extract_attr( this.tree ) ) {
        this.tree.splice( 1, 0, {} );
      }

      var attrs = extract_attr( this.tree );

      // make a references hash if it doesn't exist
      if ( attrs.references === undefined ) {
        attrs.references = {};
      }

      var b = this.loop_re_over_block(re, block, function( m ) {

        if ( m[2] && m[2][0] == "<" && m[2][m[2].length-1] == ">" )
          m[2] = m[2].substring( 1, m[2].length - 1 );

        var ref = attrs.references[ m[1].toLowerCase() ] = {
          href: m[2]
        };

        if ( m[4] !== undefined )
          ref.title = m[4];
        else if ( m[5] !== undefined )
          ref.title = m[5];

      } );

      if ( b.length )
        next.unshift( mk_block( b, block.trailing ) );

      return [];
    },

    para: function para( block, next ) {
      // everything's a para!
      return [ ["para"].concat( this.processInline( block ) ) ];
    }
  }
};

Markdown.dialects.Gruber.inline = {

    __oneElement__: function oneElement( text, patterns_or_re, previous_nodes ) {
      var m,
          res,
          lastIndex = 0;

      patterns_or_re = patterns_or_re || this.dialect.inline.__patterns__;
      var re = new RegExp( "([\\s\\S]*?)(" + (patterns_or_re.source || patterns_or_re) + ")" );

      m = re.exec( text );
      if (!m) {
        // Just boring text
        return [ text.length, text ];
      }
      else if ( m[1] ) {
        // Some un-interesting text matched. Return that first
        return [ m[1].length, m[1] ];
      }

      var res;
      if ( m[2] in this.dialect.inline ) {
        res = this.dialect.inline[ m[2] ].call(
                  this,
                  text.substr( m.index ), m, previous_nodes || [] );
      }
      // Default for now to make dev easier. just slurp special and output it.
      res = res || [ m[2].length, m[2] ];
      return res;
    },

    __call__: function inline( text, patterns ) {

      var out = [],
          res;

      function add(x) {
        //D:self.debug("  adding output", uneval(x));
        if ( typeof x == "string" && typeof out[out.length-1] == "string" )
          out[ out.length-1 ] += x;
        else
          out.push(x);
      }

      while ( text.length > 0 ) {
        res = this.dialect.inline.__oneElement__.call(this, text, patterns, out );
        text = text.substr( res.shift() );
        forEach(res, add )
      }

      return out;
    },

    // These characters are intersting elsewhere, so have rules for them so that
    // chunks of plain text blocks don't include them
    "]": function () {},
    "}": function () {},

    __escape__ : /^\\[\\`\*_{}\[\]()#\+.!\-]/,

    "\\": function escaped( text ) {
      // [ length of input processed, node/children to add... ]
      // Only esacape: \ ` * _ { } [ ] ( ) # * + - . !
      if ( this.dialect.inline.__escape__.exec( text ) )
        return [ 2, text.charAt( 1 ) ];
      else
        // Not an esacpe
        return [ 1, "\\" ];
    },

    "![": function image( text ) {

      // Unlike images, alt text is plain text only. no other elements are
      // allowed in there

      // ![Alt text](/path/to/img.jpg "Optional title")
      //      1          2            3       4         <--- captures
      var m = text.match( /^!\[(.*?)\][ \t]*\([ \t]*([^")]*?)(?:[ \t]+(["'])(.*?)\3)?[ \t]*\)/ );

      if ( m ) {
        if ( m[2] && m[2][0] == "<" && m[2][m[2].length-1] == ">" )
          m[2] = m[2].substring( 1, m[2].length - 1 );

        m[2] = this.dialect.inline.__call__.call( this, m[2], /\\/ )[0];

        var attrs = { alt: m[1], href: m[2] || "" };
        if ( m[4] !== undefined)
          attrs.title = m[4];

        return [ m[0].length, [ "img", attrs ] ];
      }

      // ![Alt text][id]
      m = text.match( /^!\[(.*?)\][ \t]*\[(.*?)\]/ );

      if ( m ) {
        // We can't check if the reference is known here as it likely wont be
        // found till after. Check it in md tree->hmtl tree conversion
        return [ m[0].length, [ "img_ref", { alt: m[1], ref: m[2].toLowerCase(), original: m[0] } ] ];
      }

      // Just consume the '!['
      return [ 2, "![" ];
    },

    "[": function link( text ) {

      var orig = String(text);
      // Inline content is possible inside `link text`
      var res = Markdown.DialectHelpers.inline_until_char.call( this, text.substr(1), "]" );

      // No closing ']' found. Just consume the [
      if ( !res ) return [ 1, "[" ];

      var consumed = 1 + res[ 0 ],
          children = res[ 1 ],
          link,
          attrs;

      // At this point the first [...] has been parsed. See what follows to find
      // out which kind of link we are (reference or direct url)
      text = text.substr( consumed );

      // [link text](/path/to/img.jpg "Optional title")
      //                 1            2       3         <--- captures
      // This will capture up to the last paren in the block. We then pull
      // back based on if there a matching ones in the url
      //    ([here](/url/(test))
      // The parens have to be balanced
      var m = text.match( /^\s*\([ \t]*([^"']*)(?:[ \t]+(["'])(.*?)\2)?[ \t]*\)/ );
      if ( m ) {
        var url = m[1];
        consumed += m[0].length;

        if ( url && url[0] == "<" && url[url.length-1] == ">" )
          url = url.substring( 1, url.length - 1 );

        // If there is a title we don't have to worry about parens in the url
        if ( !m[3] ) {
          var open_parens = 1; // One open that isn't in the capture
          for ( var len = 0; len < url.length; len++ ) {
            switch ( url[len] ) {
            case "(":
              open_parens++;
              break;
            case ")":
              if ( --open_parens == 0) {
                consumed -= url.length - len;
                url = url.substring(0, len);
              }
              break;
            }
          }
        }

        // Process escapes only
        url = this.dialect.inline.__call__.call( this, url, /\\/ )[0];

        attrs = { href: url || "" };
        if ( m[3] !== undefined)
          attrs.title = m[3];

        link = [ "link", attrs ].concat( children );
        return [ consumed, link ];
      }

      // [Alt text][id]
      // [Alt text] [id]
      m = text.match( /^\s*\[(.*?)\]/ );

      if ( m ) {

        consumed += m[ 0 ].length;

        // [links][] uses links as its reference
        attrs = { ref: ( m[ 1 ] || String(children) ).toLowerCase(),  original: orig.substr( 0, consumed ) };

        link = [ "link_ref", attrs ].concat( children );

        // We can't check if the reference is known here as it likely wont be
        // found till after. Check it in md tree->hmtl tree conversion.
        // Store the original so that conversion can revert if the ref isn't found.
        return [ consumed, link ];
      }

      // [id]
      // Only if id is plain (no formatting.)
      if ( children.length == 1 && typeof children[0] == "string" ) {

        attrs = { ref: children[0].toLowerCase(),  original: orig.substr( 0, consumed ) };
        link = [ "link_ref", attrs, children[0] ];
        return [ consumed, link ];
      }

      // Just consume the "["
      return [ 1, "[" ];
    },


    "<": function autoLink( text ) {
      var m;

      if ( ( m = text.match( /^<(?:((https?|ftp|mailto):[^>]+)|(.*?@.*?\.[a-zA-Z]+))>/ ) ) != null ) {
        if ( m[3] ) {
          return [ m[0].length, [ "link", { href: "mailto:" + m[3] }, m[3] ] ];

        }
        else if ( m[2] == "mailto" ) {
          return [ m[0].length, [ "link", { href: m[1] }, m[1].substr("mailto:".length ) ] ];
        }
        else
          return [ m[0].length, [ "link", { href: m[1] }, m[1] ] ];
      }

      return [ 1, "<" ];
    },

    "`": function inlineCode( text ) {
      // Inline code block. as many backticks as you like to start it
      // Always skip over the opening ticks.
      var m = text.match( /(`+)(([\s\S]*?)\1)/ );

      if ( m && m[2] )
        return [ m[1].length + m[2].length, [ "inlinecode", m[3] ] ];
      else {
        // TODO: No matching end code found - warn!
        return [ 1, "`" ];
      }
    },

    "  \n": function lineBreak( text ) {
      return [ 3, [ "linebreak" ] ];
    }

};

// Meta Helper/generator method for em and strong handling
function strong_em( tag, md ) {

  var state_slot = tag + "_state",
      other_slot = tag == "strong" ? "em_state" : "strong_state";

  function CloseTag(len) {
    this.len_after = len;
    this.name = "close_" + md;
  }

  return function ( text, orig_match ) {

    if ( this[state_slot][0] == md ) {
      // Most recent em is of this type
      //D:this.debug("closing", md);
      this[state_slot].shift();

      // "Consume" everything to go back to the recrusion in the else-block below
      return[ text.length, new CloseTag(text.length-md.length) ];
    }
    else {
      // Store a clone of the em/strong states
      var other = this[other_slot].slice(),
          state = this[state_slot].slice();

      this[state_slot].unshift(md);

      //D:this.debug_indent += "  ";

      // Recurse
      var res = this.processInline( text.substr( md.length ) );
      //D:this.debug_indent = this.debug_indent.substr(2);

      var last = res[res.length - 1];

      //D:this.debug("processInline from", tag + ": ", uneval( res ) );

      var check = this[state_slot].shift();
      if ( last instanceof CloseTag ) {
        res.pop();
        // We matched! Huzzah.
        var consumed = text.length - last.len_after;
        return [ consumed, [ tag ].concat(res) ];
      }
      else {
        // Restore the state of the other kind. We might have mistakenly closed it.
        this[other_slot] = other;
        this[state_slot] = state;

        // We can't reuse the processed result as it could have wrong parsing contexts in it.
        return [ md.length, md ];
      }
    }
  }; // End returned function
}

Markdown.dialects.Gruber.inline["**"] = strong_em("strong", "**");
Markdown.dialects.Gruber.inline["__"] = strong_em("strong", "__");
Markdown.dialects.Gruber.inline["*"]  = strong_em("em", "*");
Markdown.dialects.Gruber.inline["_"]  = strong_em("em", "_");


// Build default order from insertion order.
Markdown.buildBlockOrder = function(d) {
  var ord = [];
  for ( var i in d ) {
    if ( i == "__order__" || i == "__call__" ) continue;
    ord.push( i );
  }
  d.__order__ = ord;
};

// Build patterns for inline matcher
Markdown.buildInlinePatterns = function(d) {
  var patterns = [];

  for ( var i in d ) {
    // __foo__ is reserved and not a pattern
    if ( i.match( /^__.*__$/) ) continue;
    var l = i.replace( /([\\.*+?|()\[\]{}])/g, "\\$1" )
             .replace( /\n/, "\\n" );
    patterns.push( i.length == 1 ? l : "(?:" + l + ")" );
  }

  patterns = patterns.join("|");
  d.__patterns__ = patterns;
  //print("patterns:", uneval( patterns ) );

  var fn = d.__call__;
  d.__call__ = function(text, pattern) {
    if ( pattern != undefined ) {
      return fn.call(this, text, pattern);
    }
    else
    {
      return fn.call(this, text, patterns);
    }
  };
};

Markdown.DialectHelpers = {};
Markdown.DialectHelpers.inline_until_char = function( text, want ) {
  var consumed = 0,
      nodes = [];

  while ( true ) {
    if ( text.charAt( consumed ) == want ) {
      // Found the character we were looking for
      consumed++;
      return [ consumed, nodes ];
    }

    if ( consumed >= text.length ) {
      // No closing char found. Abort.
      return null;
    }

    var res = this.dialect.inline.__oneElement__.call(this, text.substr( consumed ) );
    consumed += res[ 0 ];
    // Add any returned nodes.
    nodes.push.apply( nodes, res.slice( 1 ) );
  }
}

// Helper function to make sub-classing a dialect easier
Markdown.subclassDialect = function( d ) {
  function Block() {}
  Block.prototype = d.block;
  function Inline() {}
  Inline.prototype = d.inline;

  return { block: new Block(), inline: new Inline() };
};

Markdown.buildBlockOrder ( Markdown.dialects.Gruber.block );
Markdown.buildInlinePatterns( Markdown.dialects.Gruber.inline );

Markdown.dialects.Maruku = Markdown.subclassDialect( Markdown.dialects.Gruber );

Markdown.dialects.Maruku.processMetaHash = function processMetaHash( meta_string ) {
  var meta = split_meta_hash( meta_string ),
      attr = {};

  for ( var i = 0; i < meta.length; ++i ) {
    // id: #foo
    if ( /^#/.test( meta[ i ] ) ) {
      attr.id = meta[ i ].substring( 1 );
    }
    // class: .foo
    else if ( /^\./.test( meta[ i ] ) ) {
      // if class already exists, append the new one
      if ( attr["class"] ) {
        attr["class"] = attr["class"] + meta[ i ].replace( /./, " " );
      }
      else {
        attr["class"] = meta[ i ].substring( 1 );
      }
    }
    // attribute: foo=bar
    else if ( /\=/.test( meta[ i ] ) ) {
      var s = meta[ i ].split( /\=/ );
      attr[ s[ 0 ] ] = s[ 1 ];
    }
  }

  return attr;
}

function split_meta_hash( meta_string ) {
  var meta = meta_string.split( "" ),
      parts = [ "" ],
      in_quotes = false;

  while ( meta.length ) {
    var letter = meta.shift();
    switch ( letter ) {
      case " " :
        // if we're in a quoted section, keep it
        if ( in_quotes ) {
          parts[ parts.length - 1 ] += letter;
        }
        // otherwise make a new part
        else {
          parts.push( "" );
        }
        break;
      case "'" :
      case '"' :
        // reverse the quotes and move straight on
        in_quotes = !in_quotes;
        break;
      case "\\" :
        // shift off the next letter to be used straight away.
        // it was escaped so we'll keep it whatever it is
        letter = meta.shift();
      default :
        parts[ parts.length - 1 ] += letter;
        break;
    }
  }

  return parts;
}

Markdown.dialects.Maruku.block.document_meta = function document_meta( block, next ) {
  // we're only interested in the first block
  if ( block.lineNumber > 1 ) return undefined;

  // document_meta blocks consist of one or more lines of `Key: Value\n`
  if ( ! block.match( /^(?:\w+:.*\n)*\w+:.*$/ ) ) return undefined;

  // make an attribute node if it doesn't exist
  if ( !extract_attr( this.tree ) ) {
    this.tree.splice( 1, 0, {} );
  }

  var pairs = block.split( /\n/ );
  for ( p in pairs ) {
    var m = pairs[ p ].match( /(\w+):\s*(.*)$/ ),
        key = m[ 1 ].toLowerCase(),
        value = m[ 2 ];

    this.tree[ 1 ][ key ] = value;
  }

  // document_meta produces no content!
  return [];
};

Markdown.dialects.Maruku.block.block_meta = function block_meta( block, next ) {
  // check if the last line of the block is an meta hash
  var m = block.match( /(^|\n) {0,3}\{:\s*((?:\\\}|[^\}])*)\s*\}$/ );
  if ( !m ) return undefined;

  // process the meta hash
  var attr = this.dialect.processMetaHash( m[ 2 ] );

  var hash;

  // if we matched ^ then we need to apply meta to the previous block
  if ( m[ 1 ] === "" ) {
    var node = this.tree[ this.tree.length - 1 ];
    hash = extract_attr( node );

    // if the node is a string (rather than JsonML), bail
    if ( typeof node === "string" ) return undefined;

    // create the attribute hash if it doesn't exist
    if ( !hash ) {
      hash = {};
      node.splice( 1, 0, hash );
    }

    // add the attributes in
    for ( a in attr ) {
      hash[ a ] = attr[ a ];
    }

    // return nothing so the meta hash is removed
    return [];
  }

  // pull the meta hash off the block and process what's left
  var b = block.replace( /\n.*$/, "" ),
      result = this.processBlock( b, [] );

  // get or make the attributes hash
  hash = extract_attr( result[ 0 ] );
  if ( !hash ) {
    hash = {};
    result[ 0 ].splice( 1, 0, hash );
  }

  // attach the attributes to the block
  for ( a in attr ) {
    hash[ a ] = attr[ a ];
  }

  return result;
};

Markdown.dialects.Maruku.block.definition_list = function definition_list( block, next ) {
  // one or more terms followed by one or more definitions, in a single block
  var tight = /^((?:[^\s:].*\n)+):\s+([\s\S]+)$/,
      list = [ "dl" ],
      i, m;

  // see if we're dealing with a tight or loose block
  if ( ( m = block.match( tight ) ) ) {
    // pull subsequent tight DL blocks out of `next`
    var blocks = [ block ];
    while ( next.length && tight.exec( next[ 0 ] ) ) {
      blocks.push( next.shift() );
    }

    for ( var b = 0; b < blocks.length; ++b ) {
      var m = blocks[ b ].match( tight ),
          terms = m[ 1 ].replace( /\n$/, "" ).split( /\n/ ),
          defns = m[ 2 ].split( /\n:\s+/ );

      // print( uneval( m ) );

      for ( i = 0; i < terms.length; ++i ) {
        list.push( [ "dt", terms[ i ] ] );
      }

      for ( i = 0; i < defns.length; ++i ) {
        // run inline processing over the definition
        list.push( [ "dd" ].concat( this.processInline( defns[ i ].replace( /(\n)\s+/, "$1" ) ) ) );
      }
    }
  }
  else {
    return undefined;
  }

  return [ list ];
};

// splits on unescaped instances of @ch. If @ch is not a character the result
// can be unpredictable

Markdown.dialects.Maruku.block.table = function table (block, next) {

    var _split_on_unescaped = function(s, ch) {
        ch = ch || '\\s';
        if (ch.match(/^[\\|\[\]{}?*.+^$]$/)) { ch = '\\' + ch; }
        var res = [ ],
            r = new RegExp('^((?:\\\\.|[^\\\\' + ch + '])*)' + ch + '(.*)'),
            m;
        while(m = s.match(r)) {
            res.push(m[1]);
            s = m[2];
        }
        res.push(s);
        return res;
    }

    var leading_pipe = /^ {0,3}\|(.+)\n {0,3}\|\s*([\-:]+[\-| :]*)\n((?:\s*\|.*(?:\n|$))*)(?=\n|$)/,
        // find at least an unescaped pipe in each line
        no_leading_pipe = /^ {0,3}(\S(?:\\.|[^\\|])*\|.*)\n {0,3}([\-:]+\s*\|[\-| :]*)\n((?:(?:\\.|[^\\|])*\|.*(?:\n|$))*)(?=\n|$)/,
        i, m;
    if (m = block.match(leading_pipe)) {
        // remove leading pipes in contents
        // (header and horizontal rule already have the leading pipe left out)
        m[3] = m[3].replace(/^\s*\|/gm, '');
    } else if (! ( m = block.match(no_leading_pipe))) {
        return undefined;
    }

    var table = [ "table", [ "thead", [ "tr" ] ], [ "tbody" ] ];

    // remove trailing pipes, then split on pipes
    // (no escaped pipes are allowed in horizontal rule)
    m[2] = m[2].replace(/\|\s*$/, '').split('|');

    // process alignment
    var html_attrs = [ ];
    forEach (m[2], function (s) {
        if (s.match(/^\s*-+:\s*$/))       html_attrs.push({align: "right"});
        else if (s.match(/^\s*:-+\s*$/))  html_attrs.push({align: "left"});
        else if (s.match(/^\s*:-+:\s*$/)) html_attrs.push({align: "center"});
        else                              html_attrs.push({});
    });

    // now for the header, avoid escaped pipes
    m[1] = _split_on_unescaped(m[1].replace(/\|\s*$/, ''), '|');
    for (i = 0; i < m[1].length; i++) {
        table[1][1].push(['th', html_attrs[i] || {}].concat(
            this.processInline(m[1][i].trim())));
    }

    // now for body contents
    forEach (m[3].replace(/\|\s*$/mg, '').split('\n'), function (row) {
        var html_row = ['tr'];
        row = _split_on_unescaped(row, '|');
        for (i = 0; i < row.length; i++) {
            html_row.push(['td', html_attrs[i] || {}].concat(this.processInline(row[i].trim())));
        }
        table[2].push(html_row);
    }, this);

    return [table];
}

Markdown.dialects.Maruku.inline[ "{:" ] = function inline_meta( text, matches, out ) {
  if ( !out.length ) {
    return [ 2, "{:" ];
  }

  // get the preceeding element
  var before = out[ out.length - 1 ];

  if ( typeof before === "string" ) {
    return [ 2, "{:" ];
  }

  // match a meta hash
  var m = text.match( /^\{:\s*((?:\\\}|[^\}])*)\s*\}/ );

  // no match, false alarm
  if ( !m ) {
    return [ 2, "{:" ];
  }

  // attach the attributes to the preceeding element
  var meta = this.dialect.processMetaHash( m[ 1 ] ),
      attr = extract_attr( before );

  if ( !attr ) {
    attr = {};
    before.splice( 1, 0, attr );
  }

  for ( var k in meta ) {
    attr[ k ] = meta[ k ];
  }

  // cut out the string and replace it with nothing
  return [ m[ 0 ].length, "" ];
};

Markdown.dialects.Maruku.inline.__escape__ = /^\\[\\`\*_{}\[\]()#\+.!\-|:]/;

Markdown.buildBlockOrder ( Markdown.dialects.Maruku.block );
Markdown.buildInlinePatterns( Markdown.dialects.Maruku.inline );

var isArray = Array.isArray || function(obj) {
  return Object.prototype.toString.call(obj) == "[object Array]";
};

var forEach;
// Don't mess with Array.prototype. Its not friendly
if ( Array.prototype.forEach ) {
  forEach = function( arr, cb, thisp ) {
    return arr.forEach( cb, thisp );
  };
}
else {
  forEach = function(arr, cb, thisp) {
    for (var i = 0; i < arr.length; i++) {
      cb.call(thisp || arr, arr[i], i, arr);
    }
  }
}

var isEmpty = function( obj ) {
  for ( var key in obj ) {
    if ( hasOwnProperty.call( obj, key ) ) {
      return false;
    }
  }

  return true;
}

function extract_attr( jsonml ) {
  return isArray(jsonml)
      && jsonml.length > 1
      && typeof jsonml[ 1 ] === "object"
      && !( isArray(jsonml[ 1 ]) )
      ? jsonml[ 1 ]
      : undefined;
}



/**
 *  renderJsonML( jsonml[, options] ) -> String
 *  - jsonml (Array): JsonML array to render to XML
 *  - options (Object): options
 *
 *  Converts the given JsonML into well-formed XML.
 *
 *  The options currently understood are:
 *
 *  - root (Boolean): wether or not the root node should be included in the
 *    output, or just its children. The default `false` is to not include the
 *    root itself.
 */
expose.renderJsonML = function( jsonml, options ) {
  options = options || {};
  // include the root element in the rendered output?
  options.root = options.root || false;

  var content = [];

  if ( options.root ) {
    content.push( render_tree( jsonml ) );
  }
  else {
    jsonml.shift(); // get rid of the tag
    if ( jsonml.length && typeof jsonml[ 0 ] === "object" && !( jsonml[ 0 ] instanceof Array ) ) {
      jsonml.shift(); // get rid of the attributes
    }

    while ( jsonml.length ) {
      content.push( render_tree( jsonml.shift() ) );
    }
  }

  return content.join( "\n\n" );
};

function escapeHTML( text ) {
  return text.replace( /&/g, "&amp;" )
             .replace( /</g, "&lt;" )
             .replace( />/g, "&gt;" )
             .replace( /"/g, "&quot;" )
             .replace( /'/g, "&#39;" );
}

function render_tree( jsonml ) {
  // basic case
  if ( typeof jsonml === "string" ) {
    return escapeHTML( jsonml );
  }

  var tag = jsonml.shift(),
      attributes = {},
      content = [];

  if ( jsonml.length && typeof jsonml[ 0 ] === "object" && !( jsonml[ 0 ] instanceof Array ) ) {
    attributes = jsonml.shift();
  }

  while ( jsonml.length ) {
    content.push( render_tree( jsonml.shift() ) );
  }

  var tag_attrs = "";
  for ( var a in attributes ) {
    tag_attrs += " " + a + '="' + escapeHTML( attributes[ a ] ) + '"';
  }

  // be careful about adding whitespace here for inline elements
  if ( tag == "img" || tag == "br" || tag == "hr" ) {
    return "<"+ tag + tag_attrs + "/>";
  }
  else {
    return "<"+ tag + tag_attrs + ">" + content.join( "" ) + "</" + tag + ">";
  }
}

function convert_tree_to_html( tree, references, options ) {
  var i;
  options = options || {};

  // shallow clone
  var jsonml = tree.slice( 0 );

  if ( typeof options.preprocessTreeNode === "function" ) {
      jsonml = options.preprocessTreeNode(jsonml, references);
  }

  // Clone attributes if they exist
  var attrs = extract_attr( jsonml );
  if ( attrs ) {
    jsonml[ 1 ] = {};
    for ( i in attrs ) {
      jsonml[ 1 ][ i ] = attrs[ i ];
    }
    attrs = jsonml[ 1 ];
  }

  // basic case
  if ( typeof jsonml === "string" ) {
    return jsonml;
  }

  // convert this node
  switch ( jsonml[ 0 ] ) {
    case "header":
      jsonml[ 0 ] = "h" + jsonml[ 1 ].level;
      delete jsonml[ 1 ].level;
      break;
    case "bulletlist":
      jsonml[ 0 ] = "ul";
      break;
    case "numberlist":
      jsonml[ 0 ] = "ol";
      break;
    case "listitem":
      jsonml[ 0 ] = "li";
      break;
    case "para":
      jsonml[ 0 ] = "p";
      break;
    case "markdown":
      jsonml[ 0 ] = "html";
      if ( attrs ) delete attrs.references;
      break;
    case "code_block":
      jsonml[ 0 ] = "pre";
      i = attrs ? 2 : 1;
      var code = [ "code" ];
      code.push.apply( code, jsonml.splice( i, jsonml.length - i ) );
      jsonml[ i ] = code;
      break;
    case "inlinecode":
      jsonml[ 0 ] = "code";
      break;
    case "img":
      jsonml[ 1 ].src = jsonml[ 1 ].href;
      delete jsonml[ 1 ].href;
      break;
    case "linebreak":
      jsonml[ 0 ] = "br";
    break;
    case "link":
      jsonml[ 0 ] = "a";
      break;
    case "link_ref":
      jsonml[ 0 ] = "a";

      // grab this ref and clean up the attribute node
      var ref = references[ attrs.ref ];

      // if the reference exists, make the link
      if ( ref ) {
        delete attrs.ref;

        // add in the href and title, if present
        attrs.href = ref.href;
        if ( ref.title ) {
          attrs.title = ref.title;
        }

        // get rid of the unneeded original text
        delete attrs.original;
      }
      // the reference doesn't exist, so revert to plain text
      else {
        return attrs.original;
      }
      break;
    case "img_ref":
      jsonml[ 0 ] = "img";

      // grab this ref and clean up the attribute node
      var ref = references[ attrs.ref ];

      // if the reference exists, make the link
      if ( ref ) {
        delete attrs.ref;

        // add in the href and title, if present
        attrs.src = ref.href;
        if ( ref.title ) {
          attrs.title = ref.title;
        }

        // get rid of the unneeded original text
        delete attrs.original;
      }
      // the reference doesn't exist, so revert to plain text
      else {
        return attrs.original;
      }
      break;
  }

  // convert all the children
  i = 1;

  // deal with the attribute node, if it exists
  if ( attrs ) {
    // if there are keys, skip over it
    for ( var key in jsonml[ 1 ] ) {
        i = 2;
        break;
    }
    // if there aren't, remove it
    if ( i === 1 ) {
      jsonml.splice( i, 1 );
    }
  }

  for ( ; i < jsonml.length; ++i ) {
    jsonml[ i ] = convert_tree_to_html( jsonml[ i ], references, options );
  }

  return jsonml;
}


// merges adjacent text nodes into a single node
function merge_text_nodes( jsonml ) {
  // skip the tag name and attribute hash
  var i = extract_attr( jsonml ) ? 2 : 1;

  while ( i < jsonml.length ) {
    // if it's a string check the next item too
    if ( typeof jsonml[ i ] === "string" ) {
      if ( i + 1 < jsonml.length && typeof jsonml[ i + 1 ] === "string" ) {
        // merge the second string into the first and remove it
        jsonml[ i ] += jsonml.splice( i + 1, 1 )[ 0 ];
      }
      else {
        ++i;
      }
    }
    // if it's not a string recurse
    else {
      merge_text_nodes( jsonml[ i ] );
      ++i;
    }
  }
}

} )( (function() {
  if ( typeof exports === "undefined" ) {
    window.markdown = {};
    return window.markdown;
  }
  else {
    return exports;
  }
} )() );

},{"util":4}],6:[function(require,module,exports){
// sam/Ran.js
//
// Sample for range-type input elemnet.

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _templateObject = _taggedTemplateLiteral(['', 'pt'], ['', 'pt']),
    _templateObject2 = _taggedTemplateLiteral(['Size: ', ''], ['Size: ', '']);

function _taggedTemplateLiteral(strings, raw) { return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

var _upward = require('upward');

var dom;

/// ### Sliders
///
/// A slider is just an `input` element with type `range`.
/// `.setsImmediate` works like `.sets` but reacts in real time to any changes.
/// The `V` sets up a single upwardable value.
/// Here, we tie the slider value to font size.

//===START
var size = (0, _upward.V)(12);
var style = { fontSize: (0, _upward.F)(_templateObject, size) };
var SLIDER = { type: 'range', min: 6, max: 48, value: 12 };

dom = (0, _upward.E)('div').has([(0, _upward.E)('span').has("Sample text").is((0, _upward.U)({ style: style })), (0, _upward.E)('input').is(SLIDER).setsImmediate(size), (0, _upward.F)(_templateObject2, style.fontSize)]);
//===END

exports['default'] = dom;
module.exports = exports['default'];

},{"upward":9}],7:[function(require,module,exports){
// sam/main.js
//
// Main file for upward samples.

'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _upward = require('upward');

// Markdown is used to format the description of each sample.

var _markdownLibMarkdown = require('markdown/lib/markdown');

var _markdownLibMarkdown2 = _interopRequireDefault(_markdownLibMarkdown);

// Styling for sample page.

require('./style');

//import cntSample from './Cnt';
//import tmpSample from './Tem';
//import funSample from './Fun';
//import butSample from './But';
//import apiSample from './Api';
//import mapSample from './Map';
//import srtSample from './Srt';
//import cssSample from './Css';
//import fadSample from './Fad';

var _Ran = require('./Ran');

var _Ran2 = _interopRequireDefault(_Ran);

var samples = [
//  { sample: cntSample, js: 'Cnt', desc: "Counting" },
//  { sample: tmpSample, js: 'Tem' },
//  { sample: funSample, js: 'Fun' },
//  { sample: butSample, js: 'But' },
//  { sample: apiSample, js: 'Api' },
//  { sample: mapSample, js: 'Map' },
//  { sample: srtSample, js: 'Srt' },
//  { sample: cssSample, js: 'Css' },
//  { sample: fadSample, js: 'Fad' },
{ sample: _Ran2['default'], js: 'Ran', desc: "Slider" }];

var div = document.getElementById('samples');

// Retrieve the section of code between ===START and ===END.
function getCode(js) {
  return js.replace(/^[^]*?\/\/===START\n/, '').replace(/\/\/===END[^]*/, '');
}

function getDescription(js) {
  return js.match(/^\/\/\/(.*)$/gm).map(function (line) {
    return line.replace(/^\/\/\/\s*/, '');
  }).join('\n');
}

// Insert a single sample.
function oneSample(sample) {

  function text(response) {
    return response.text();
  }
  function append(text) {
    code.appendChild(document.createTextNode(getCode(text)));
  }

  var section = document.createElement('section');
  section.id = sample.js;
  var js = fetch('src/' + sample.js + '.js').then(text);

  // description block
  var description = document.createElement('div');
  description.className = 'desc';
  section.appendChild(description);
  js.then(function (text) {
    return description.innerHTML = _markdownLibMarkdown2['default'].toHTML(getDescription(text));
  });

  // code block
  var code = document.createElement('div');
  code.className = 'code';
  section.appendChild(code);
  js.then(append);

  // result block
  var result = document.createElement('div');
  result.className = 'result';
  section.appendChild(result);
  result.appendChild(sample.sample);

  // Put this sample in the HTML.
  div.appendChild(section);
}

function go() {
  samples.forEach(oneSample);
}

div.appendChild((0, _upward.E)('div').has(["Samples: ", (0, _upward.E)('span').has(samples.as(function (sample) {
  return (0, _upward.E)('A').is({ href: '#' + sample.js }).has(sample.desc, ' ');
}))]));

go();

},{"./Ran":6,"./style":8,"markdown/lib/markdown":5,"upward":9}],8:[function(require,module,exports){
// Styling for samples.
// ====================

"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _upward = require('upward');

var assign = Object.assign;
var keys = Object.keys;

var theme = (0, _upward.U)({});

var setTheme = function setTheme(t) {
  return assign(theme, themes[t]);
};
var getThemeNames = function getThemeNames(_) {
  return keys(themes);
};

var themes = {
  sunset: {
    bodyBackgroundColor: "wheat"
  }
};

setTheme("sunset");

(0, _upward.UpStyle)([["body", {
  fontFamily: 'Lato, sans-serif',
  backgroundColor: theme.bodyBackgroundColor,
  paddingLeft: '12px',
  paddingRight: '12px'
}], ["h3", {
  backgroundColor: 'brown',
  color: 'white',
  padding: '6px'
}], [".code", {
  whiteSpace: 'pre',
  fontFamily: 'monospace',
  backgroundColor: 'pink',
  margin: '12px 40px',
  padding: '12px',
  fontSize: 'larger'
}], [".result", {
  backgroundColor: 'beige',
  margin: '12px 40px',
  padding: '12px'
}], [".hide", {
  display: 'none'
}], ["code", {
  fontSize: 'larger',
  backgroundColor: 'lightgray',
  border: "1px solid gray",
  paddingLeft: "0.2em",
  paddingRight: "0.2em"
}]]);

exports.setTheme = setTheme;
exports.getThemeNames = getThemeNames;

},{"upward":9}],9:[function(require,module,exports){
// Basic exports
// =============

// This file is index.js in the root of the project,
// so that apps using it can do `import {U} from 'upward';`.
// It re-exports interfaces so clients can import from this single module.

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopExportWildcard(obj, defaults) {
  var newObj = defaults({}, obj);delete newObj['default'];return newObj;
}

function _defaults(obj, defaults) {
  var keys = Object.getOwnPropertyNames(defaults);for (var i = 0; i < keys.length; i++) {
    var key = keys[i];var value = Object.getOwnPropertyDescriptor(defaults, key);if (value && value.configurable && obj[key] === undefined) {
      Object.defineProperty(obj, key, value);
    }
  }return obj;
}

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { 'default': obj };
}

require('./src/Arr');

var _srcCss = require('./src/Css');

var _srcCss2 = _interopRequireDefault(_srcCss);

var _srcCnt = require('./src/Cnt');

var _srcCnt2 = _interopRequireDefault(_srcCnt);

var _srcElt = require('./src/Elt');

var _srcElt2 = _interopRequireDefault(_srcElt);

var _srcFad = require('./src/Fad');

var _srcFad2 = _interopRequireDefault(_srcFad);

var _srcFun = require('./src/Fun');

var _srcFun2 = _interopRequireDefault(_srcFun);

var _srcObj = require('./src/Obj');

var _srcObj2 = _interopRequireDefault(_srcObj);

var _srcTem = require('./src/Tem');

var _srcTem2 = _interopRequireDefault(_srcTem);

var _srcTxt = require('./src/Txt');

var _srcTxt2 = _interopRequireDefault(_srcTxt);

var _srcUpw = require('./src/Upw');

var _srcUpw2 = _interopRequireDefault(_srcUpw);

exports.U = _srcObj2['default'];
exports.T = _srcTxt2['default'];
exports.E = _srcElt2['default'];
exports.F = _srcTem2['default'];
exports.C = _srcFun2['default'];
exports.V = _srcUpw2['default'];
exports.UpCount = _srcCnt2['default'];
exports.UpStyle = _srcCss2['default'];
exports.FADE = _srcFad2['default'];

var _srcTst = require('./src/Tst');

Object.defineProperty(exports, 'test', {
  enumerable: true,
  get: function get() {
    return _srcTst.test;
  }
});
Object.defineProperty(exports, 'testGroup', {
  enumerable: true,
  get: function get() {
    return _srcTst.testGroup;
  }
});
Object.defineProperty(exports, 'skip', {
  enumerable: true,
  get: function get() {
    return _srcTst.skip;
  }
});
Object.defineProperty(exports, 'unskip', {
  enumerable: true,
  get: function get() {
    return _srcTst.unskip;
  }
});
Object.defineProperty(exports, 'consoleReporter', {
  enumerable: true,
  get: function get() {
    return _srcTst.consoleReporter;
  }
});
Object.defineProperty(exports, 'htmlReporter', {
  enumerable: true,
  get: function get() {
    return _srcTst.htmlReporter;
  }
});

var _srcTag = require('./src/Tag');

_defaults(exports, _interopExportWildcard(_srcTag, _defaults));

},{"./src/Arr":11,"./src/Cnt":17,"./src/Css":18,"./src/Elt":19,"./src/Fad":21,"./src/Fun":22,"./src/Obj":27,"./src/Tag":33,"./src/Tem":34,"./src/Tst":35,"./src/Txt":36,"./src/Upw":37}],10:[function(require,module,exports){
// AccessController
// ================

// Capture and watch accesses to properties made during computations.

// Convenience.
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _Obs = require('./Obs');

// AccessNotifier
// --------------

// `accessNotifier` allows upwardables to report property accesses.
// It is a stack to handle nested invocations of computables.
var observe = Object.observe;
var unobserve = Object.unobserve;
var _accessNotifier = [];

var accessNotifier = {
  pop: function pop() {
    _accessNotifier.shift();
  },
  push: function push(notifier) {
    _accessNotifier.unshift(notifier);
  },
  notify: function notify(notification) {
    if (_accessNotifier.length) _accessNotifier[0](notification);
  }
};

// makeAccessController
// --------------------

// Make an access controller, allowing accesses to be captured and observed.
function makeAccessController(rerun) {
  // `accesses` is a map indexed by object,
  // containing "access" entries with values of `{names: [], observer}`.
  // `names` of null means to watch properties of any name.
  // It is built by calls to `notifyAccess`, invoked through `accessNotifier`.
  var accesses = new Map();

  function unobserve() {
    accesses.forEach(function (_ref) {
      var observer = _ref.observer;
      return observer.unobserve();
    });
  }

  function observe() {
    accesses.forEach(function (_ref2) {
      var observer = _ref2.observer;
      return observer.observe(['update', 'add', 'delete']);
    });
  }

  // Start capturing accessed dependencies.
  function capture() {
    accesses.clear();
    accessNotifier.push(notifyAccess);
  }

  // Stop capturing accessed dependencies.
  function uncapture() {
    accessNotifier.pop();
  }

  function start() {
    unobserve();
    capture();
  }

  function stop() {
    uncapture();
    observe();
  }

  // `notifyAccess` is the callback invoked by upwardables when a property is accessed.
  // It records the access in the `accesses` map.
  function notifyAccess(_ref3) {
    var object = _ref3.object;
    var name = _ref3.name;

    // Create an observer for changes in properties accessed during execution of this function.
    function makeAccessedObserver() {
      return (0, _Obs.Observer)(object, function (changes) {
        changes.forEach(function (_ref4) {
          var type = _ref4.type;
          var name = _ref4.name;
          var names = accessEntry.names;

          if (!names || type === 'update' && names.indexOf(name) !== -1) rerun();
        });
      });
    }

    // Make a new entry in the access table, containing initial property name if any
    // and observer for properties accessed on the object.
    function makeAccessEntry() {
      accesses.set(object, {
        names: name ? [name] : null,
        observer: makeAccessedObserver()
      });
    }

    // If properties on this object are already being watched, there is already an entry
    // in the access table for it. Add a new property name to the existing entry.
    function setAccessEntry() {
      if (name && accessEntry.names) accessEntry.names.push(name);else accessEntry.names = null;
    }

    var accessEntry = accesses.get(object);
    if (accessEntry) setAccessEntry();else makeAccessEntry();
  }

  return { start: start, stop: stop };
}

exports.makeAccessController = makeAccessController;
exports.accessNotifier = accessNotifier;

},{"./Obs":28}],11:[function(require,module,exports){
// Array methods for maintaining maps, filters, etc.
// Place prototypes on Array and Upwardable objects.
//import keepReversed from './Rev';
//import keepUnique   from './Unq';
//import keepFiltered from './Fil';
'use strict';

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { 'default': obj };
}

var _Map = require('./Map');

var _Map2 = _interopRequireDefault(_Map);

var _Out = require('./Out');

var _Srt = require('./Srt');

var _Srt2 = _interopRequireDefault(_Srt);

//import keepSliced from './Slc';

var defineProperty = Object.defineProperty;
var defineProperties = Object.defineProperties;
var prototype = Array.prototype;

// Place the methods on the Array and Upwardable prototype.
var methodMap = {
  as: _Map2['default'],
  by: _Srt2['default'] //,
  //  if:   keepFiltered,
  //  of:   keepSliced,
  //  up:   keepReversed,
  //  uniq: keepUnique
};

var arrayProtoMunged = "__UPWARD_METHODS";

var methodDescriptors = (0, _Out.mapObject)(methodMap, function (v) {
  return {
    value: function value() {
      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      return v.apply(undefined, [this].concat(args));
    } };
});

if (!prototype[arrayProtoMunged]) {
  defineProperties(prototype, methodDescriptors);
  defineProperty(prototype, arrayProtoMunged, { value: true });
}

},{"./Map":26,"./Out":29,"./Srt":31}],12:[function(require,module,exports){
// keepAssigned
// ============

// Define an object composed of multiple objects, which keeps itself updated.
// Addition objects can be added with `and` and `or`.
// Also handles subobjects.

// Convenience.
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _slicedToArray = (function () {
  function sliceIterator(arr, i) {
    var _arr = [];var _n = true;var _d = false;var _e = undefined;try {
      for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
        _arr.push(_s.value);if (i && _arr.length === i) break;
      }
    } catch (err) {
      _d = true;_e = err;
    } finally {
      try {
        if (!_n && _i['return']) _i['return']();
      } finally {
        if (_d) throw _e;
      }
    }return _arr;
  }return function (arr, i) {
    if (Array.isArray(arr)) {
      return arr;
    } else if (Symbol.iterator in Object(arr)) {
      return sliceIterator(arr, i);
    } else {
      throw new TypeError('Invalid attempt to destructure non-iterable instance');
    }
  };
})();

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { 'default': obj };
}

var _Cfg = require('./Cfg');

var _Ify = require('./Ify');

var _Obs = require('./Obs');

var _Out = require('./Out');

var _Upw = require('./Upw');

var _Upw2 = _interopRequireDefault(_Upw);

var _Utl = require('./Utl');

var create = Object.create;
var assign = Object.assign;
var defineProperty = Object.defineProperty;
var _Array$prototype = Array.prototype;
var push = _Array$prototype.push;
var unshift = _Array$prototype.unshift;

// Create the `keepAssigned` object.
function keepAssigned() {
  var ka = create(keepAssignedPrototype);
  defineProperty(ka, 'objs', { value: [] }); // first-come first-served

  for (var _len = arguments.length, objs = Array(_len), _key = 0; _key < _len; _key++) {
    objs[_key] = arguments[_key];
  }

  [].concat(objs).forEach(function (o) {
    return _keepAssigned(ka, o);
  });
  return ka;
}

// Return property's value from the first object in which it appears.
function findFirstProp(objs, p) {
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = objs[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var obj = _step.value;

      if (obj && obj.hasOwnProperty(p)) {
        return (0, _Out.valueize)(obj[p]);
      }
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator['return']) {
        _iterator['return']();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }
}

// Calculate value for a property, recursively.
function calcProp(ka, p) {
  var val = ka[p];
  if (isKeepAssigned(val)) {
    recalc(val);
  } else {
    val.val = findFirstProp(ka.objs, p);
  }
}

// Place a key in the kept object.
function placeKey(ka, v, k, pusher) {
  if ((0, _Out.isObject)(v)) {
    if (k in ka) {
      _keepAssigned(ka[k], v, pusher);
    } else {
      ka[k] = subKeepAssigned(ka.objs, k, pusher);
    }
  } else {
    if (k in ka) {
      ka[k].val = calcProp(ka, k);
    } else {
      defineProperty(ka, k, {
        get: function get() {
          return (0, _Upw2['default'])(findFirstProp(ka.objs, k));
        },
        enumerable: true
      });
      //upward(v, ka[k]);
    }
  }
}

// Recalculate values for all keys, as when an object changes.
function recalc(ka) {
  var _iteratorNormalCompletion2 = true;
  var _didIteratorError2 = false;
  var _iteratorError2 = undefined;

  try {
    for (var _iterator2 = objectPairs(ka)[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
      var _step2$value = _slicedToArray(_step2.value, 2);

      var key = _step2$value[0];
      var val = _step2$value[1];

      if (isKeepAssigned(val)) {
        recalc(val);
      } else {
        val.val = getter(key);
      }
    }
  } catch (err) {
    _didIteratorError2 = true;
    _iteratorError2 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion2 && _iterator2['return']) {
        _iterator2['return']();
      }
    } finally {
      if (_didIteratorError2) {
        throw _iteratorError2;
      }
    }
  }
}

// Make a keepAssigned object for subobjects with some key.
function subKeepAssigned(objs, k, pusher) {
  var ka = keepAssigned();
  objs.map((0, _Out.propGetter)(k)).filter(Boolean).forEach(function (o) {
    return _keepAssigned(ka, o, pusher);
  });
  return ka;
}

// Push one object onto a keepAssigned object, either at the front or back.
function _keepAssigned(ka, o) {
  var pusher = arguments.length <= 2 || arguments[2] === undefined ? unshift : arguments[2];

  // Handle an upwardable object changing, in case of `O(model.obj)`.
  function objectChanged(_o) {
    (0, _Utl.replace)(ka.objs, o, _o);
    recalc(ka);
  }

  // @TODO: figure out how to handle this.
  //  upward(o, objectChanged);

  function key(v, k) {
    placeKey(ka, v, k);
  }

  function update(k, v) {
    processKey(k, v);
  }

  function _delete(k) {
    recalc(ka);
  }

  var handlers = {
    add: (0, _Ify.argify)(placeKey, ka),
    update: (0, _Ify.argify)(placeKey, ka),
    'delete': _delete
  };
  (0, _Obs.observeObject)(o, (0, _Obs.makeObserver)(handlers));

  pusher.call(ka.objs, o);
  (0, _Out.mapObject)(o, function (v, k) {
    return placeKey(ka, v, k, pusher);
  });
  return ka;
}

// Prototype of keepAssigned objects; define `and` and `or`.
var keepAssignedPrototype = {
  and: function and(o) {
    return _keepAssigned(this, o, unshift);
  },
  or: function or(o) {
    return _keepAssigned(this, o, push);
  }
};

// Is something a `keepAssigned` object?
function isKeepAssigned(o) {
  return keepAssignedPrototype.isPrototypeOf(o);
}

exports['default'] = keepAssigned;
exports.isKeepAssigned = isKeepAssigned;
//needed?

},{"./Cfg":15,"./Ify":23,"./Obs":28,"./Out":29,"./Upw":37,"./Utl":38}],13:[function(require,module,exports){
// Asynchronous functions
// ======================

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _toConsumableArray(arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];return arr2;
  } else {
    return Array.from(arr);
  }
}

var _Cfg = require('./Cfg');

// Return a promise for some time in the future,
// passing through the invoking promise's value:
// ```
// Promise.resolve(99).then(wait(250)) // promise value is 99
// ```
var assign = Object.assign;
var defineProperty = Object.defineProperty;
var observe = Object.observe;
var unobserve = Object.unobserve;
var apply = Function.prototype.apply;
function wait() {
  var ms = arguments.length <= 0 || arguments[0] === undefined ? 0 : arguments[0];

  return function (val) {
    return new Promise(function (resolve) {
      return setTimeout(function (_) {
        return resolve(val);
      }, ms);
    });
  };
}

// Implement Promise.done.
// Use may set Promise.onDoneError to trap errors.
function _throw(e) {
  throw e;
}
if (!Promise.prototype.done) {
  defineProperty(Promise.prototype, 'done', {
    value: function value(fulfill, reject) {
      return this.then(fulfill, reject)['catch'](function (e) {
        return setTimeout(Promise.onDoneError || _throw, 1, e);
      });
    }
  });
}

// Implement `get` on promises.
if (!Promise.prototype.get) {
  defineProperty(Promise.prototype, 'get', {
    value: function value(prop) {
      return this.then(function (o) {
        return o[prop];
      });
    }
  });
}

// Create a `Deferred` object, a combination of a promise and its
// resolve and reject functions.
function Deferred() {
  var deferred = {};
  deferred.promise = new Promise(function (resolve, reject) {
    deferred.resolve = resolve;
    deferred.reject = reject;
  });
  return deferred;
}

// Implement `defer` on `Promise`.
if (_Cfg.upwardConfig.MODIFY_BUILTIN_PROTOTYPE && !Promise.defer) {
  defineProperty(Promise, 'defer', {
    value: Deferred
  });
}

// Promise from one-time Object.observe.
// Usage: ```promiseChanges(obj, ['update']).then(function(changes) {...`
function promiseChanges(object, types) {
  return new Promise(function (resolve) {
    function observer(changes) {
      resolve(changes);
      unobserve(object, observer);
    }
    observe(object, observer, types);
  });
}

// Make a generator which calls a function over and over.
// Each iteration's arguments are the parameters passed to `iterate.next()`.
function generateForever(f) {
  var init = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];

  return regeneratorRuntime.mark(function _generateForever() {
    var args;
    return regeneratorRuntime.wrap(function _generateForever$(context$2$0) {
      while (1) switch (context$2$0.prev = context$2$0.next) {
        case 0:
          context$2$0.next = 2;
          return init;

        case 2:
          args = context$2$0.sent;

        case 3:
          if (!true) {
            context$2$0.next = 9;
            break;
          }

          context$2$0.next = 6;
          return f.apply(0, args);

        case 6:
          args = context$2$0.sent;
          context$2$0.next = 3;
          break;

        case 9:
        case 'end':
          return context$2$0.stop();
      }
    }, _generateForever, this);
  });
}

// "Promisify" a function, meaning to create a function which returns a promise
// for the value of the function once `this` and all arguments have been fulfilled.
function promisify(f) {
  // given an underlying function,
  return function _promisify() {
    var _this = this;

    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    // return a function which
    return new Promise( // returns a promise
    function (resolve) {
      return Promise.all([_this].concat(args)) // which, when all args are resolved,
      .then(function (parms) {
        return resolve(f.call.apply(f, _toConsumableArray(parms)));
      } // resolves to the function result
      );
    });
  };
}

exports.wait = wait;
exports.promiseChanges = promiseChanges;
exports.Deferred = Deferred;
exports.generateForever = generateForever;
exports.promisify = promisify;

},{"./Cfg":15}],14:[function(require,module,exports){
// UpAttributes/.is
// ================

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { 'default': obj };
}

var _Ass = require('./Ass');

var _Ass2 = _interopRequireDefault(_Ass);

var _Fun = require('./Fun');

var _Fun2 = _interopRequireDefault(_Fun);

var _Ify = require('./Ify');

var _Obs = require('./Obs');

var _Str = require('./Str');

var push = Array.prototype.push;
var keys = Object.keys;
var defineProperty = Object.defineProperty;

var subAttrs = ['style', 'class', 'dataset'];
function isSubattr(a) {
  return subAttrs.indexOf(a) !== -1;
}

// Make observers for attributes, and subattributes
// ------------------------------------------------
function makeAttrsObserver(e) {
  function add(v, k) {
    e.setAttribute(k, valueize(v));
  }
  function _delete(v, k) {
    e.removeAttribute(k);
  }
  return (0, _Obs.makeObserver)({ add: add, update: add, 'delete': _delete });
}

function makeStyleObserver(e) {
  function add(v, k) {
    e.style[k] = v;
  }
  function _delete(v, k) {
    e.style[k] = '';
  }
  return (0, _Obs.makeObserver)({ add: add, update: add, 'delete': _delete });
}

function makeDatasetObserver(e) {
  function add(v, k) {
    e.dataset[k] = v;
  }
  function _delete(v, k) {
    delete e.dataset[k];
  }
  return (0, _Obs.makeObserver)({ add: add, change: add, 'delete': _delete });
}

function makeClassObserver(e) {
  function add(v, k) {
    e.classList.toggle((0, _Str.dasherize)(k), v);
  }
  function _delete(v, k) {
    e.classList.remove((0, _Str.dasherize)(k));
  }
  return (0, _Obs.makeObserver)({ add: add, change: add, 'delete': _delete });
}

function UpAttributes(elt, attrs) {

  // Function to repopulate classes on the element when they change.
  var upClasses = (0, _Fun2['default'])(function (classes) {
    classes = classes || {};
    keys(classes).forEach(function (cls) {
      return elt.classList.toggle((0, _Str.dasherize)(cls), classes[cls]);
    });
  });

  // Function to repopulate styles on the element when they change.
  var upStyles = (0, _Fun2['default'])(function (styles) {
    styles = styles || {};
    keys(styles).forEach(function (prop) {
      return elt.style[prop] = styles[prop];
    });
  });

  // TODO: do datasets

  // Function to repopulate attributes on the element when they change.
  var upAttrs = (0, _Fun2['default'])(function (attrs) {
    attrs = attrs || {};
    keys(attrs).filter((0, _Ify.invertify)(isSubattr)).forEach(function (attr) {
      return elt.setAttribute(attr, attrs[attr]);
    });
  });

  upAttrs(attrs);
  upClasses(attrs['class']);
  upStyles(attrs.style);
  return elt;
}

// Add UpAttributes to Element prototype as `.is`.
var ISPROP = 'is';
console.assert(!HTMLElement.prototype[ISPROP], "Duplicate assignment to HTMLElement.is");
defineProperty(HTMLElement.prototype, ISPROP, {
  value: function value(attrs) {
    return UpAttributes(this, attrs);
  }
});

exports['default'] = UpAttributes;
module.exports = exports['default'];

},{"./Ass":12,"./Fun":22,"./Ify":23,"./Obs":28,"./Str":32}],15:[function(require,module,exports){
// ### Configuration

// Initialization/setup.
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
var assign = Object.assign;

// Control upward configuration with `LOGGING` and `DEBUG` flags.
var upwardConfig = {
  LOGGING: true,
  DEBUG: true,
  MODIFY_BUILTIN_PROTOTYPES: false,
  TEST: false
};

// Keep a counter which identifies upwardables for debugging purposes.
var id = 0;

function upwardableId() {
  return id++;
}

// Set configuration options.
function configureUpwardable(opts) {
  assign(upwardConfig, opts);
}

function log() {
  if (upwardConfig.LOGGING) {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    console.log.apply(console, ['UPWARDIFY:\t'].concat(args));
  }
}

exports.upwardConfig = upwardConfig;
exports.configureUpwardable = configureUpwardable;
exports.upwardableId = upwardableId;
exports.log = log;

},{}],16:[function(require,module,exports){
// upChildren
// ==========

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { 'default': obj };
}

var _Fun = require('./Fun');

var _Fun2 = _interopRequireDefault(_Fun);

var _Txt = require('./Txt');

var _Txt2 = _interopRequireDefault(_Txt);

var _Node$prototype = Node.prototype;
var appendChild = _Node$prototype.appendChild;
var removeChild = _Node$prototype.removeChild;
var filter = Array.prototype.filter;
var defineProperty = Object.defineProperty;

/**
 * ## upChildren
 *
 * Specify the children of an HTML element.
 * As the input array changes, the element's children are added and removed.
 *
 * @param {HTMLElement} elt element to add children to
 * @param {Node[]} children array of nodes to add as children
 */

function UpChildren(elt, children) {
  var f = (0, _Fun2['default'])(function _UpChildren(children) {

    filter.call(elt.childNodes, function (child) {
      return children.indexOf(child) === -1;
    }).forEach(removeChild, elt);

    children.filter(Boolean).map(function (c) {
      return typeof c.valueOf() === 'string' ? (0, _Txt2['default'])(c) : c;
    }).forEach(appendChild, elt);
  });

  // Permit any combination of single nodes and arrays as arguments.
  f(Array.isArray(children) ? children : [children]);
  return elt;
}

// Add `UpChildren` as property on Node prototype, named `has`.
// Usage:
// ```
// E('div') . has ([children, ...])
// ```
var HASPROP = 'has';

/* @TODO: Make this a non-enumerable property on prototype. */
Node.prototype.has = function (children) {
  return UpChildren(this, children);
};

exports['default'] = UpChildren;
module.exports = exports['default'];

},{"./Fun":22,"./Txt":36}],17:[function(require,module,exports){
// Counter as computable.
// ======================

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _slicedToArray = (function () {
  function sliceIterator(arr, i) {
    var _arr = [];var _n = true;var _d = false;var _e = undefined;try {
      for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
        _arr.push(_s.value);if (i && _arr.length === i) break;
      }
    } catch (err) {
      _d = true;_e = err;
    } finally {
      try {
        if (!_n && _i['return']) _i['return']();
      } finally {
        if (_d) throw _e;
      }
    }return _arr;
  }return function (arr, i) {
    if (Array.isArray(arr)) {
      return arr;
    } else if (Symbol.iterator in Object(arr)) {
      return sliceIterator(arr, i);
    } else {
      throw new TypeError('Invalid attempt to destructure non-iterable instance');
    }
  };
})();

var _Fun = require('./Fun');

// Counts up by one every `tick` ms.
exports['default'] = (0, _Fun.makeUpwardableFunction)(regeneratorRuntime.mark(function callee$0$0(run) {
  var timer, start, _ref, _ref2, tick;

  return regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:
        start = 0;

      case 1:
        if (!true) {
          context$1$0.next = 12;
          break;
        }

        context$1$0.next = 4;
        return start++;

      case 4:
        _ref = context$1$0.sent;
        _ref2 = _slicedToArray(_ref, 1);
        tick = _ref2[0];

        tick = tick || 1000;
        clearTimeout(timer);
        timer = setTimeout(run, tick);
        context$1$0.next = 1;
        break;

      case 12:
      case 'end':
        return context$1$0.stop();
    }
  }, callee$0$0, this);
}));
module.exports = exports['default'];

},{"./Fun":22}],18:[function(require,module,exports){
// Build CSS sheets and rules.
// ===========================

// Setup.
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _slicedToArray = (function () {
  function sliceIterator(arr, i) {
    var _arr = [];var _n = true;var _d = false;var _e = undefined;try {
      for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
        _arr.push(_s.value);if (i && _arr.length === i) break;
      }
    } catch (err) {
      _d = true;_e = err;
    } finally {
      try {
        if (!_n && _i['return']) _i['return']();
      } finally {
        if (_d) throw _e;
      }
    }return _arr;
  }return function (arr, i) {
    if (Array.isArray(arr)) {
      return arr;
    } else if (Symbol.iterator in Object(arr)) {
      return sliceIterator(arr, i);
    } else {
      throw new TypeError('Invalid attempt to destructure non-iterable instance');
    }
  };
})();

exports['default'] = UpStyle;

function _toConsumableArray(arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];return arr2;
  } else {
    return Array.from(arr);
  }
}

function _toArray(arr) {
  return Array.isArray(arr) ? arr : Array.from(arr);
}

var _Str = require('./Str');

var _Cfg = require('./Cfg');

var assign = Object.assign;
var defineProperty = Object.defineProperty;

// Handle scoping.
// ---------------

var scopedSupported = ('scoped' in document.createElement('style'));

var scopedStyleId = 0;
var scopedStyleIdsProp = "scopedStyleIds";
var makeScopedStyleId = function makeScopedStyleId(id) {
  return 's' + id;
};

// "Scopify" a set of selectors to an element identifed by a data-scoped-style-ids attribute.
// Each selector is turned into two selectors.
// The first places the `[data-...]` selector in front, to address descendnats.
// The second attaches it to the first subselector, to address the element itself.
function scopifySelectors(selectors, scope_id) {
  var scoper = '[data-' + (0, _Str.dasherize)(scopedStyleIdsProp) + '~=' + scope_id + ']';
  return [].concat(selectors.split(',').map(function (selector) {
    var _selector$trim$split$filter = selector.trim().split(/([\s+>~])/).filter(Boolean);

    var _selector$trim$split$filter2 = _toArray(_selector$trim$split$filter);

    var head = _selector$trim$split$filter2[0];

    var tail = _selector$trim$split$filter2.slice(1);

    return [scoper + ' ' + selector, ['' + head + scoper].concat(_toConsumableArray(tail)).join('')];
  })).join(',');
}

// Create a new stylesheet, optionally scoped to a DOM element.
function makeSheet(scope) {
  var style = document.createElement('style');
  document.head.appendChild(style);
  var sheet = style.sheet;

  if (scope) {
    style.setAttribute('scoped', "scoped");
    if (!scopedSupported) {
      scope.dataset[scopedStyleIdsProp] = (scope.dataset[scopedStyleIdsProp] || "") + " " + (sheet.scopedStyleId = makeScopedStyleId(scopedStyleId++));
    }
  }

  return sheet;
}

// Insert a CSS rule, given by selector(s) and declarations, into a sheet.
// If the scoped attribute was specified, and scoping is not supported,
// then emulate scoping, by adding a data-* attribute to the parent element,
// and rewriting the selectors.
function insert(sheet, _ref) {
  var _ref2 = _slicedToArray(_ref, 2);

  var selectors = _ref2[0];
  var styles = _ref2[1];

  if (sheet.scopedStyleId) {
    selectors = scopifySelectors(selectors, sheet.scopedStyleId);
  }

  var idx = sheet.insertRule(selectors + ' { }', sheet.rules.length);
  var rule = sheet.rules[idx];

  if (typeof styles === 'string') {
    rule.style = styles;
  } else {
    // @TODO Fix this to be upward-friendly, and valueize style object.
    assign(rule.style, styles);
    //mirrorProperties(rule.style, styles);
  }

  return rule;
}

// `assignStyle` is an Upwardified function which on first invocation
// "assigns" hash passed as argument to the `style` attribute of `this`.
// When properties within the hash change, style attribute are updated.
function assignStyle() {
  return upwardifiedMerge(function () {
    return this.style;
  });
}

//HTMLElement.prototype.style = assignStyle;
//CSSStyleRule.prototype.style = assignStyle;

CSSStyleSheet.prototype.replaceRule = function (rule, idx) {
  this.deleteRule(idx);
  return this.insertRule(rule, idx);
};

//Object.assign(CSSStyleSheet.prototype, {
//              rule: upwardify(chainify(insertRule), replaceChild),

// Insert a rule (selectors plus values) into a stylesheet.
CSSStyleSheet.prototype.rule = function (selector, styles) {
  var idx = this.insertRule(selector + ' { }', this.rules.length);
  var rule = this.rules[idx];
  // TODO: replace with assignStyle.
  assign(rule.style, styles);
  return this;
};

// Define CSS units on numbers, as non-enumerable properties on prototype.
// Cannot call as `12.px`; instead, try `12..px`, or `12 .px`.
if (_Cfg.upwardConfig.MODIFY_BUILTIN_PROTOTYPES) {
  ['em', 'ex', 'ch', 'rem', 'px', 'mm', 'cm', 'in', 'pt', 'pc', 'px', 'vh', 'vw', 'vmin', 'vmax', 'pct', 'deg', 'grad', 'rad', 'turn', 'ms', 's', 'Hz', 'kHz'].forEach(function (unit) {
    return defineProperty(Number.prototype, unit, {
      get: function get() {
        return this + unit;
      }
    });
  });
}

var transform = ['translate', 'translateX', 'translateY', 'scale', 'scaleX', 'scaleY', 'scale3d', 'scaleZ', 'rotate', 'rotateX', 'rotateY', 'rotateZ', 'rotate3d', 'perspective', 'matrix', 'matrix3d', 'skewX', 'skewY'].reduce(function (result, key) {
  return Object.defineProperty(result, key, {
    value: function value() {
      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      return key + '(' + args + ')';
    }
  });
}, {});

exports.transform = transform;

function UpStyle(rules, scope) {
  var sheet = makeSheet(scope);
  rules.forEach(function (rule) {
    return insert(sheet, rule);
  });
  return sheet;
}

},{"./Cfg":15,"./Str":32}],19:[function(require,module,exports){
// UpElement/E
// ===========
// Create HTML elements.

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

require('./Evt');

require('./Chi');

require('./Inp');

require('./Att');

/**
 * ## UpElement

 * Create an element.
 * Support low-level sugar in form of `div#id.class`.
 */
function UpElement(tag) {
  var parts = tag.split(/([#.])/);
  tag = parts.shift();
  var elt = document.createElement(tag);

  while (parts.length) {
    var symbol = parts.shift();
    var val = parts.shift();
    switch (symbol) {
      case '#':
        elt.id = val;break;
      case '.':
        elt.classList.add(val);break;
    }
  }

  return elt;
}

// Re-exported as `E` by `Up.js`.
exports['default'] = UpElement;
module.exports = exports['default'];

},{"./Att":14,"./Chi":16,"./Evt":20,"./Inp":24}],20:[function(require,module,exports){
// Event handling
// ==============

// Events are handled by calling `does` on an element, and passing a hash of handlers.

'use strict';

var create = Object.create;
var keys = Object.keys;
var assign = Object.assign;
var defineProperty = Object.defineProperty;
var prototype = HTMLElement.prototype;

// Prototype for event listeners, defining `handleEvent`,
// which dispatches events to a method of the same name.
var EventListenerPrototype = {
  handleEvent: function handleEvent(evt) {
    return this[evt.type](evt);
  }
};

// Place property on `Element` prototype.
// Usage:
// ```
// E('button') . does({click: handleButtonClick})
//
// function handleButtonClick(evt) {
//     // this.context is the button
// }
// ```
var DOESPROP = 'does';

if (!prototype[DOESPROP]) {
  defineProperty(prototype, DOESPROP, {
    value: function value(handlers) {
      var _this = this;

      var listener = create(EventListenerPrototype);
      assign(listener, handlers, { context: this });
      keys(handlers).forEach(function (evt_type) {
        return _this.addEventListener(evt_type, listener);
      });
      return this;
    }
  });
}

},{}],21:[function(require,module,exports){
// src/Fad.js
//
// Implement fading or other effects when specified DOM element changes.
// Requres MutationObserver (not available in IE <= 10).
// In its absence, does nothing.
//
// To select specific effects in addition to the default fading, supply additional effects:
// ```
// FADE(elt, ['flipVertical'])
// ```
//

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { 'default': obj };
}

var _Css = require('./Css');

var _Css2 = _interopRequireDefault(_Css);

var _Elt = require('./Elt');

var _Elt2 = _interopRequireDefault(_Elt);

var _Upw = require('./Upw');

var _Upw2 = _interopRequireDefault(_Upw);

var NO_MUTATION_OBSERVER = typeof MutationObserver === 'undefined';
var MUTATION_CONFIG = { childList: true, characterData: true, subtree: true, attributes: true };
var EFFECTS = ['flipVertical', 'flipHorizontal', 'rotateRight', 'slideUp', 'slideDown', 'slideLeft', 'slideRight', 'zoom'];

exports['default'] = function (elt, effect) {

  // Start (in) and stop (out) transition.
  function start() {
    classes.isTransition = true;
    original.addEventListener('transitionend', end);
  }

  function end() {
    fader.replaceChild(original.cloneNode(true), original.nextSibling);
    classes.isTransition = false;
    original.removeEventListener('transitionend', end);
  }

  if (NO_MUTATION_OBSERVER) return;

  var classes = (0, _Upw2['default'])({
    FadeElement: true,
    'FadeElement--fade': true,
    isTransition: false,
    isDisabled: NO_MUTATION_OBSERVER
  });
  if (effect) classes['FadeElement--' + effect] = true;

  var original = (0, _Elt2['default'])('div').has(elt);
  var fader = (0, _Elt2['default'])('div').is({ 'class': classes }).has([original, (0, _Elt2['default'])('div')]);

  end();
  new MutationObserver(start).observe(original, MUTATION_CONFIG);

  return fader;
};

// #### STYLES
// The `FadeElement` element has two children. First is original, second is clone.
//
// To control duration, set the `transition-duration` property on the `FadeElement` component.
// `transition-timing-function` and `transform-origin` may be similarly set.

var cssRules = [['.Fade-element', {
  /* Make this an offset parent, so the absolute positioning of the clone is relative to it. */
  position: 'relative', /* create formatting context for absolutely-positioned clone */

  /* Set transition properties, to be inherited by children. */
  transitionDuration: '800ms', /* override this to change duration */
  transitionTimingFunction: 'cubic-bezier(0, 1.2, 1, 1.2)', /* little bounce at top */

  overflow: 'hidden'
}],

/* We want to transition only going in, not coming out. */
['.Fade-element.is-transition > *', { transitionProperty: 'all' }],

/* CHILD ELEMENTS (original and clone) */

/* The second child is the clone. Place it directly over the original version. */
['.Fade-element > :nth-child(2)', { position: 'absolute', top: 0, left: 0 }], ['.Fade-element > *', {
  /* By default, no transition, unless `is-transition` is present; see next rule. */
  transitionProperty: 'none',

  /* Inherit properties set on main element. */
  transitionDuration: 'inherit',
  transitionTimingFunction: 'inherit',
  transformOrigin: 'inherit',

  backfaceVisibility: 'hidden',

  display: 'inline-block'
}],

// EFFECTS

['.Fade-element--fade                          > :nth-child(1)', { opacity: 0 }], ['.Fade-element--fade                          > :nth-child(2)', { opacity: 1 }], ['.Fade-element--fade.is-transition            > :nth-child(1)', { opacity: 1 }], ['.Fade-element--fade.is-transition            > :nth-child(2)', { opacity: 0 }], ['.Fade-element--slide-right                   > :nth-child(1)', { transform: _Css.transform.translateX('-100%') }], ['.Fade-element--slide-right                   > :nth-child(2)', { transform: _Css.transform.translateX(0) }], ['.Fade-element--slide-right.is-transition     > :nth-child(1)', { transform: _Css.transform.translateX(0) }], ['.Fade-element--slide-right.is-transition     > :nth-child(2)', { transform: _Css.transform.translateX('+100%') }], ['.Fade-element--slide-left                    > :nth-child(1)', { transform: _Css.transform.translateX('+100%') }], ['.Fade-element--slide-left                    > :nth-child(2)', { transform: _Css.transform.translateX(0) }], ['.Fade-element--slide-left.is-transition      > :nth-child(1)', { transform: _Css.transform.translateX(0) }], ['.Fade-element--slide-left.is-transition      > :nth-child(2)', { transform: _Css.transform.translateX('-100%') }], ['.Fade-element--slideDown                     > :nth-child(1)', { transform: _Css.transform.translateY('-100%') }], ['.Fade-element--slideDown                     > :nth-child(2)', { transform: _Css.transform.translateY(0) }], ['.Fade-element--slideDown.is-transition       > :nth-child(1)', { transform: _Css.transform.translateY(0) }], ['.Fade-element--slideDown.is-transition       > :nth-child(2)', { transform: _Css.transform.translateY('+100%') }], ['.Fade-element--slideUp                       > :nth-child(1)', { transform: _Css.transform.translateY('+100%') }], ['.Fade-element--slideUp                       > :nth-child(2)', { transform: _Css.transform.translateY(0) }], ['.Fade-element--slideUp.is-transition         > :nth-child(1)', { transform: _Css.transform.translateY(0) }], ['.Fade-element--slideUp.is-transition         > :nth-child(2)', { transform: _Css.transform.translateY('-100%') }], ['.Fade-element--rotateRight                   > :nth-child(1)', { transform: _Css.transform.rotate(0) }], ['.Fade-element--rotateRight                   > :nth-child(2)', { transform: _Css.transform.rotate(0) }], ['.Fade-element--rotateRight.is-transition     > :nth-child(1)', { transform: _Css.transform.rotate('360deg') }], ['.Fade-element--rotateRight.is-transition     > :nth-child(2)', { transform: _Css.transform.rotate('360deg') }], ['.Fade-element--flip-vertical                 > :nth-child(1)', { transform: _Css.transform.rotateX(0) }], ['.Fade-element--flip-vertical                 > :nth-child(2)', { transform: _Css.transform.rotateX(0) }], ['.Fade-element--flip-vertical.is-transition   > :nth-child(1)', { transform: _Css.transform.rotateX('360deg') }], ['.Fade-element--flip-vertical.is-transition   > :nth-child(2)', { transform: _Css.transform.rotateX('360deg') }], ['.Fade-element--flip-horizontal               > :nth-child(1)', { transform: _Css.transform.rotateY(0) }], ['.Fade-element--flip-horizontal               > :nth-child(2)', { transform: _Css.transform.rotateY(0) }], ['.Fade-element--flip-horizontal.is-transition > :nth-child(1)', { transform: _Css.transform.rotateY('360deg') }], ['.Fade-element--flip-horizontal.is-transition > :nth-child(2)', { transform: _Css.transform.rotateY('360deg') }], ['.Fade-element--zoom               > :nth-child(1)', { transform: _Css.transform.scale(1.5) }], ['.Fade-element--zoom               > :nth-child(2)', { transform: _Css.transform.scale(1.0) }], ['.Fade-element--zoom.is-transition > :nth-child(1)', { transform: _Css.transform.scale(1.0) }], ['.Fade-element--zoom.is-transition > :nth-child(2)', { transform: _Css.transform.scale(1.5) }],

/* If component is turned off (MutationObserver not available?), just show the original. */
['.Fade-element.is-disabled  > :nth-child(1)', { opacity: 1, transform: _Css.transform.translate(0, 0) }]];

(0, _Css2['default'])(cssRules);
module.exports = exports['default'];

},{"./Css":18,"./Elt":19,"./Upw":37}],22:[function(require,module,exports){
// Upwardable Functions
// ====================

// The **upwardable function** is one of the two key components of the upward library,
// along with the **upwardable object**.
// An **upwardable function** is an enhanced function which recomputes itself
// when its inputs or dependencies change.
// Inovking an upwardable function results in a **upwardable**, which holds the value.
// An upwardable is always an object; if primitive, it is wrapped.

// Convenience.
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _slicedToArray = (function () {
  function sliceIterator(arr, i) {
    var _arr = [];var _n = true;var _d = false;var _e = undefined;try {
      for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
        _arr.push(_s.value);if (i && _arr.length === i) break;
      }
    } catch (err) {
      _d = true;_e = err;
    } finally {
      try {
        if (!_n && _i['return']) _i['return']();
      } finally {
        if (_d) throw _e;
      }
    }return _arr;
  }return function (arr, i) {
    if (Array.isArray(arr)) {
      return arr;
    } else if (Symbol.iterator in Object(arr)) {
      return sliceIterator(arr, i);
    } else {
      throw new TypeError('Invalid attempt to destructure non-iterable instance');
    }
  };
})();

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { 'default': obj };
}

var _Acc = require('./Acc');

var _Asy = require('./Asy');

var _Obs = require('./Obs');

var _Out = require('./Out');

var _Upw = require('./Upw');

var _Upw2 = _interopRequireDefault(_Upw);

// Keep track of computables, computeds, and computifieds.
var getNotifier = Object.getNotifier;
var observe = Object.observe;
var unobserve = Object.unobserve;
var defineProperty = Object.defineProperty;
var set = new WeakSet();
var generators = new WeakMap();

function is(f) {
  return set.has(f);
}
function get(g) {
  return g && typeof g === 'object' && generators.get(g);
}
function add(f, g) {
  set.add(f);generators.set(g, f);
}

// Convenience constructor for computable when on simple function.
// To provide your own generator, use `constructComputable`.
// This is the default export from this module.
function C(f, init) {
  return make((0, _Asy.generateForever)(f, init));
}

// Construct upwardable function from generator (if not already constructed).
function make(g) {
  var f = get(g);
  if (!f) {
    f = _make(g);
    add(f, g);
  }
  return f;
}

// Create an upwardable function based on a generator.
// The generator must provide the following behavior.
// The first `iterator.next()` is invoked synchronously, and must yield a neutral, default, safe value.
// Following `iterator.next()` calls are passed function arguments as an array.
// In other words, `yield` statements should be written as `args = yield x;`,
// where `args` will be/should be/might be used in deriving the next value to yield.
// The yielded value may be (but not need be) be a promise to be waited for.
function _make(g) {

  function f() {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    // Resolve the promise which will trigger recomputation.
    function run() {
      runner();
    }
    function accessStart() {
      accessController.start();
    }
    function accessStop() {
      accessController.stop();
    }

    function iterate() {
      var change = new Promise(function (resolve) {
        return runner = resolve;
      });
      function reiterate() {
        change.then(iterate);
      }

      accessStart();

      var _iterator$next = iterator.next(args);

      var done = _iterator$next.done;
      var value = _iterator$next.value;

      console.assert(!done, "Iterator underlying computable ran out of gas.");

      var promise = Promise.resolve(value);
      promise.then(accessStop, accessStop); // should this be synchronous?
      promise.then(function (newValue) {
        return result = result.change(newValue);
      }, function (reason) {
        console.log(reason);
      }).then(reiterate);
    }

    var iterator = g(run);
    var result = (0, _Upw2['default'])(iterator.next().value);
    var accessController = (0, _Acc.makeAccessController)(run);
    var runner;

    //    if (computed) {
    //      accessNotifier.notify({type: 'update',  object: computed});
    //    }

    observeArgs(args, run);
    iterate();
    return result;
  }

  return f;
}

// Observe changes to arguments.
// This will handle 'compute' changes, and trigger recomputation of function.
// When args changes, the new value is reobserved.
function observeArgs(args, run) {

  function observeArg(arg, i, args) {
    var observer = (0, _Obs.Observer)(arg, function argObserver(changes) {
      changes.forEach(function (_ref) {
        var type = _ref.type;
        var newValue = _ref.newValue;

        if (type === 'upward') {
          args[i] = newValue;
          observer.reobserve(newValue);
        }
      });

      run();
    },
    // @TODO: consider whether to check for D/A/U here, or use 'modify' change type
    ['upward', 'delete', 'add', 'update'] // @TODO: check all these are necessary
    );
    observer.observe();
  }

  args.forEach(observeArg);
}

// The ur-upwardable function is to get a property from an object.
// This version does not support upwardables as arguments.
var getUpwardableProperty = C(function getProperty(_ref2, run) {
  var _ref22 = _slicedToArray(_ref2, 2);

  var object = _ref22[0];
  var name = _ref22[1];

  observe(object, function (changes) {
    return changes.forEach(function (change) {
      if (change.name === name) run();
    });
  });
  return object[name];
});

var makeUpwardableFunction = make;

C.is = is;
exports['default'] = C;
exports.makeUpwardableFunction = makeUpwardableFunction;
exports.getUpwardableProperty = getUpwardableProperty;

},{"./Acc":10,"./Asy":13,"./Obs":28,"./Out":29,"./Upw":37}],23:[function(require,module,exports){
// Functional utilities
// --------------------

// Housekeeping.
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _toConsumableArray(arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];return arr2;
  } else {
    return Array.from(arr);
  }
}

var _Cfg = require('./Cfg');

var prototype = Function.prototype;
var call = prototype.call;
var bind = prototype.bind;
var apply = prototype.apply;
var defineProperty = Object.defineProperty;
var defineProperties = Object.defineProperties;
var forEach = Array.prototype.forEach;

// Compose functions, calling from right to left.
function compose() {
  for (var _len = arguments.length, fns = Array(_len), _key = 0; _key < _len; _key++) {
    fns[_key] = arguments[_key];
  }

  return function (x) {
    return fns.reduceRight(function (result, val) {
      return val(result);
    }, x);
  };
}

// Create a function which runs on next tick.
function tickify(fn) {
  var _ref = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

  var delay = _ref.delay;

  delay = delay || 10;
  return function () {
    var _this = this,
        _arguments = arguments;

    return setTimeout(function () {
      return fn.apply(_this, _arguments);
    }, delay);
  };
}

// Transform a function so that it always returns `this`.
function chainify(fn) {
  return function () {
    for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      args[_key2] = arguments[_key2];
    }

    fn.call.apply(fn, [this].concat(args));
    return this;
  };
}

// Make a function which returns itself, allowing syntax `fn(x)(y)`.
function selfify(fn) {
  return function selfified() {
    fn.apply(this, arguments);
    return selfified;
  };
}

// Make a function which takes arguments in reverse order.
function swapify(fn) {
  return function (a, b) {
    return fn.call(this, b, a);
  };
}

// Make a function which drops some leading arguments.
function dropify(fn) {
  var n = arguments.length <= 1 || arguments[1] === undefined ? 1 : arguments[1];

  return function () {
    for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
      args[_key3] = arguments[_key3];
    }

    return fn.apply(this, [].concat(args).slice(n));
  };
}

// Make a function which memozies its result.
function memoify(fn) {
  var _ref2 = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

  var hash = _ref2.hash;
  var cache = _ref2.cache;

  hash = hash || identify;
  cache = cache = {};
  function memoified() {
    for (var _len4 = arguments.length, args = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
      args[_key4] = arguments[_key4];
    }

    var key = hash.apply(undefined, args);
    return key in cache ? cache[key] : cache[key] = fn.call.apply(fn, [this].concat(args));
  }
  memoified.clear = function () {
    return cache = {};
  };
  return memoified;
}

// Make a function with some pre-filled arguments.
function argify(fn) {
  for (var _len5 = arguments.length, args1 = Array(_len5 > 1 ? _len5 - 1 : 0), _key5 = 1; _key5 < _len5; _key5++) {
    args1[_key5 - 1] = arguments[_key5];
  }

  return function () {
    for (var _len6 = arguments.length, args2 = Array(_len6), _key6 = 0; _key6 < _len6; _key6++) {
      args2[_key6] = arguments[_key6];
    }

    return fn.call.apply(fn, [this].concat(args1, args2));
  };
}

// Return the function if it is one.
function maybeify(fn) {
  return typeof fn === 'function' ? fn : fixed(fn);
}

// Make a function which inverts the result.
function invertify(fn) {
  return function () {
    return !fn.apply(this, arguments);
  };
}

// Make a function which throws away some args.
function trimify(fn) {
  var n = arguments.length <= 1 || arguments[1] === undefined ? 1 : arguments[1];

  return function () {
    for (var _len7 = arguments.length, args = Array(_len7), _key7 = 0; _key7 < _len7; _key7++) {
      args[_key7] = arguments[_key7];
    }

    return fn.call.apply(fn, [this].concat(_toConsumableArray(args.slice(0, n))));
  };
}

// Make a function which throws away some args at the end.
function trimifyRight(fn) {
  var n = arguments.length <= 1 || arguments[1] === undefined ? 1 : arguments[1];

  return function () {
    for (var _len8 = arguments.length, args = Array(_len8), _key8 = 0; _key8 < _len8; _key8++) {
      args[_key8] = arguments[_key8];
    }

    return fn.call.apply(fn, [this].concat(_toConsumableArray(args.slice(0, -n))));
  };
}

// Make a version of the function which logs entry and exit.
function logify(fn) {
  return function () {
    console.log("entering", fn.name);
    var ret = fn.apply(this, arguments);
    console.log("leaving", fn.name);
    return ret;
  };
}

// Make a function bound to itself, allowing function to access itself with `this`.
function selfthisify(fn) {
  return fn.bind(fn);
}

// Make a function which calls some function for each argument, returning array of results.
function repeatify(fn) {
  return function () {
    for (var _len9 = arguments.length, args = Array(_len9), _key9 = 0; _key9 < _len9; _key9++) {
      args[_key9] = arguments[_key9];
    }

    return [].concat(args).map(fn, this);
  };
}

// Make create a version of a function which runs just once on first call.
// Returns same value on succeeding calls.
function onceify(f) {
  var ran, ret;
  return function () {
    return ran ? ret : (ran = true, ret = f.apply(this, arguments));
  };
}

// Create a function with an inserted first argument equal to the created function.
// Possible use case is:
// ```
// e.addEventListerner("click", insertselfify(function(self, evt) {
//   // do stuff on event;
//   e.removeEventListener(self);
// }));
// ```
function insertselfify(fn) {
  return function x() {
    for (var _len10 = arguments.length, args = Array(_len10), _key10 = 0; _key10 < _len10; _key10++) {
      args[_key10] = arguments[_key10];
    }

    return fn.call.apply(fn, [this, x].concat(args));
  };
}

// Create a function with a prelude and postlude.
function wrapify(fn) {
  var before = arguments.length <= 1 || arguments[1] === undefined ? noop : arguments[1];
  var after = arguments.length <= 2 || arguments[2] === undefined ? noop : arguments[2];

  return function () {
    before.call(this);

    for (var _len11 = arguments.length, args = Array(_len11), _key11 = 0; _key11 < _len11; _key11++) {
      args[_key11] = arguments[_key11];
    }

    var ret = fn.call.apply(fn, [this].concat(args));
    after.call(this);
    return ret;
  };
}

function debugify(fn) {
  return function () {
    /*jshint debug: true */
    debugger;

    for (var _len12 = arguments.length, args = Array(_len12), _key12 = 0; _key12 < _len12; _key12++) {
      args[_key12] = arguments[_key12];
    }

    return fn.call.apply(fn, [this].concat(args));
  };
}

// Return an array of argument names.
// WARNING: parsing JS with regexps!
// Will fail on deconstructed parameters.
// @TODO Handle parameters with defaults.
function paramify(fn) {
  //get arguments to function as array of strings
  var args = fn.args = fn.args || //cache result in args property of function
  fn.toString() //get string version of function
  .replace(/\/\/.*$|\/\*[\s\S]*?\*\//mg, '') //strip comments
  .match(/\(.*?\)/m)[0] //find argument list, including parens
  .match(/[^\s(),]+/g) //find arguments
  ;
  return args; // or fn?
}

// Return function body.
function parseBody(fn) {
  //get arguments to function as array of strings
  var body = fn.body = fn.body || //cache result in `body` property of function
  fn.toString() //get string version of function
  .replace(/\/\/.*$|\/\*[\s\S]*?\*\//mg, '') //strip comments
  .replace(/^\s*$/mg, '') // kill empty lines
  .replace(/^.*?\)\s*\{\s*(return)?\s*/, '') // kill argument list and leading curly
  .replace(/\s*\}\s*$/, '') // kill trailing curly
  ;
  return body; // or fn?
}

// Return an object of named function parameters and their values.
// Invoke as `paramsAsObject(thisFunction, arguments);`.
function paramsAsObject(fn, args) {
  return objectFromLists(paramify(fn), args);
}

// Function which does nothing.
function noop() {}

// Function which returns its argument.
function identity(x) {
  return x;
}

// Function which always returns the same value.
function fixed(c) {
  return function () {
    return c;
  };
}

// Function which inverts its argument.
function invert(c) {
  return !c;
}

// Place a function transformer on the Function prototype.
// This allows it be used as `fn.swapify(1,2)`.
function prototypeize(fn) {
  var name = arguments.length <= 1 || arguments[1] === undefined ? fn.name : arguments[1];
  return (function () {
    if (name) {
      // IE11 does not support name
      defineProperty(prototype, name, {
        get: function get() {
          return fn(this);
        }
      });
    }
  })();
}

// Provide versions on function prototype that can be called as
// function.swapify(1, 2).
if (_Cfg.upwardConfig.MODIFY_BUILTIN_PROTOTYPES) {
  var flag = 'UPWARD_MODIFIED_BUILTIN_PROPERTIES';
  if (!prototype[flag]) {
    [tickify, chainify, selfify, memoify, swapify, dropify, argify, invertify, trimify, selfthisify, repeatify, onceify, insertselfify, wrapify, paramify, logify].forEach(trimify(prototypeize));
    defineProperty(prototype, flag, { value: true });
  }
}

exports.compose = compose;
exports.tickify = tickify;
exports.chainify = chainify;
exports.selfify = selfify;
exports.memoify = memoify;
exports.swapify = swapify;
exports.dropify = dropify;
exports.argify = argify;
exports.invertify = invertify;
exports.maybeify = maybeify;
exports.selfthisify = selfthisify;
exports.repeatify = repeatify;
exports.onceify = onceify;
exports.insertselfify = insertselfify;
exports.wrapify = wrapify;
exports.debugify = debugify;
exports.paramify = paramify;
exports.logify = logify;
exports.parseBody = parseBody;
exports.noop = noop;
exports.identity = identity;
exports.invert = invert;
exports.fixed = fixed;

},{"./Cfg":15}],24:[function(require,module,exports){
// HTML input elements
// ===================

// Bookkeeping and initialization.
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });
  } else {
    obj[key] = value;
  }return obj;
}

var _Upw = require('./Upw');

var defineProperties = Object.defineProperties;
var observe = Object.observe;

/**
 * ## UpInputs (.sets)
 *
 * Associates an upwardable with the value of an input element.
 *
 * @param {HTMLInputElement} elt element to associate
 * @param {Upwardable} upwardable upwardable to associate
 * @param [boolean=false] realtime if true, update upwardable each char
 */

function UpInputs(elt, upwardable) {
  var realtime = arguments.length <= 2 || arguments[2] === undefined ? false : arguments[2];

  console.assert(elt instanceof HTMLInputElement, "First argument to UpInputs must be input element");
  console.assert((0, _Upw.isUpwardable)(upwardable), "Second argument to UpInputs (.inputs) must be upwardable");

  function observeUpwardable() {
    observe(upwardable, function (changes) {
      return changes.forEach(function (change) {
        return elt.value = change.newValue;
      });
    }, ['upward']);
  }

  elt.addEventListener(realtime ? 'input' : 'change', function (_) {
    upwardable = upwardable.change(elt.value);
    observeUpwardable();
  });

  elt.value = upwardable;
  observeUpwardable();
  return elt;
}

// Extend HTMLInputElement prototype with `sets` and `setsImmediate` methods.
var prototype = HTMLInputElement.prototype;

var SETS_PROP = 'sets';
var SETS_IMMEDIATE_PROP = 'setsImmediate';

if (!prototype.hasOwnProperty(SETS_PROP)) {
  var _defineProperties;

  defineProperties(prototype, (_defineProperties = {}, _defineProperty(_defineProperties, SETS_PROP, { value: function value(upwardable) {
      return UpInputs(this, upwardable, false);
    } }), _defineProperty(_defineProperties, SETS_IMMEDIATE_PROP, { value: function value(upwardable) {
      return UpInputs(this, upwardable, true);
    } }), _defineProperties));
}

// Normally this module will be imported as `import './src/Inp';`.
exports["default"] = UpInputs;
module.exports = exports["default"];

},{"./Upw":37}],25:[function(require,module,exports){
// LOGGING
// =======
//
// Create parameter lists for `console.log` etc.
//
// Exposing another top-level logging API, which in turn would call
// `console.log`, would result in file/line information in the console
// referring to where our routine made the `console.log` call, rather than
// where the actual logging call was made.
//
// Therefore, we adopt a low-impact solution
// defining a routine to simply format logging parameters and return an array
// suitable for passing to **any** logging routine using the spread operator.
//
// Usage:
// ```
// import logChannel from 'connect/utils/log-channel';
// var channel = logChannel('mychan', { style: { color: red } });
// console.log(...channel(msg));
// ```
//
// A `transports` option may be specified giving a list of transports which are to
// called when invoked via `channel.warn` etc.
// Such transports might send the log message to a server, or write it to localStorage.
// Transports are called with a `{ channel, severity, params }` hash.
// A stack trace is also passed for severities of error and fatal.
// Currently we have `localStorageTransport`, `remoteTransport`,
// `domEventTransport`, and `websocketTransport`.

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports['default'] = logChannel;
exports.enableChannel = enableChannel;
exports.disableChannel = disableChannel;
exports.enableChannels = enableChannels;
exports.enableAllChannels = enableAllChannels;
exports.enableSeverities = enableSeverities;
exports.enableAllSeverities = enableAllSeverities;
exports.localStorageTransport = localStorageTransport;
exports.remoteTransport = remoteTransport;
exports.websocketTransport = websocketTransport;
exports.domEventTransport = domEventTransport;
exports.postMessageTransport = postMessageTransport;

var _Str = require('./Str');

// Severities supported by transports, when logger is invoked as `channel.error(...)` etc.
var SEVERITIES = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];

function consoleSupport() {
  var browser = {};
  browser.isFirefox = /firefox/i.test(navigator.userAgent);
  browser.isIE = document.documentMode;

  var support = {};
  support.consoleApply = !browser.isIE || document.documentMode && document.documentMode > 9;
  support.functionGetters = support.consoleApply;
  support.console = !!window.console;
  support.modifiedConsole = !browser.isIE && support.console && console.log.toString().indexOf('apply') !== -1;
  support.styles = !!window.chrome || !!(browser.isFirefox && support.modifiedConsole);
  support.groups = !!(window.console && console.group);

  return support;
}
var support = consoleSupport();

var ALL = /.*/;

var channels = {}; // Remember groups
var enabledChannels = ALL; // Enabled channel regexp, set by `setEnabledChannels`
var enabledSeverities = ALL; // Enabled severities, set by `setEnabledSeverities`

// CREATE A NEW LOG CHANNEL
// ------------------------
//
// A channel has a name, `style` formatting options for `console.out`, a list of transports,
// and a list of suppressed error levels.
// It is a function which returns an array of parameters suitable for spreading into `console.log`.
// Channels also have properties `info`, `warn` etc., functions which in addition to returning the
// array of parameters, invoke the channel's designated transports.

function logChannel(channel) {
  var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

  var style = options.style || {};
  var enabled = options.enabled;
  var transports = options.transports || [];
  var suppress = options.suppress || [];

  enabled = enabled === undefined ? true : enabled;

  // TODO: replace above with the below, when jshint gets smarter.
  // var { style = {}, enabled = true, transports = [], suppress = [] ) = options;

  // Create string of form `color:red` for use with console's `%c` format specifier.
  var styleString = Object.keys(style).map(function (key) {
    return (0, _Str.dasherize)(key) + ':' + style[key];
  }).join(';');

  var fn = function fn(maybeFormat) {
    var format = support.styles ? '%c[' + channel + ']' : '[' + channel + ']';

    if (!enabled || !enabledChannels.test(channel)) return [];

    // If the first parameter is a string, it may contain formatting codes such as `%s`.
    // In that case, append it to our formatting string so things work as expected.

    for (var _len = arguments.length, params = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      params[_key - 1] = arguments[_key];
    }

    if (typeof maybeFormat === 'string') {
      format += ' ' + maybeFormat;
      return support.styles ? [format, styleString].concat(params) : [format].concat(params);
    } else {
      return support.styles ? [format, styleString, maybeFormat].concat(params) : [format, maybeFormat].concat(params);
    }
  };

  // Add severity-specific interfaces invoked via `channel.warn` etc.
  // These also send the log information to the specified transports.
  SEVERITIES.forEach(function (severity) {
    return fn[severity] = function () {
      for (var _len2 = arguments.length, params = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        params[_key2] = arguments[_key2];
      }

      if (!enabled || suppress.indexOf(severity) !== -1 || !enabledSeverities.test(severity)) return [];

      if (severity === 'error' || severity === 'fatal') {
        var stack = new Error().stack;
        transports.forEach(function (transport) {
          return transport({ channel: channel, severity: severity, params: params, stack: stack });
        });
      } else {
        transports.forEach(function (transport) {
          return transport({ channel: channel, severity: severity, params: params });
        });
      }

      // Return the array of parameters in case this is to be spread into `console.log`.
      return fn.apply(undefined, [name].concat(params));
    };
  });

  // Add interfaces for enabling and disabling this channel.
  // ```
  // var channel = logChannel('speech');
  // channel.disable();
  // ```
  fn.enable = function () {
    return enabled = true;
  };
  fn.disable = function () {
    return enabled = false;
  };

  return channels[channel] = fn;
}

// Enable channels at global level.

function enableChannel(channel) {
  if (channels[channel]) channels[channel].enable();
}

function disableChannel(channel) {
  if (channels[channel]) channels[channel].disable();
}

function enableChannels(regexp) {
  enabledChannels = new RegExp(regexp);
}

function enableAllChannels() {
  enabledChannels = ALL;
}

function enableSeverities(regexp) {
  enabledSeverities = new RegExp(regexp);
}

function enableAllSeverities() {
  enabledSeverities = ALL;
}

// LOCAL STORAGE-BASED TRANSPORT
// -----------------------------
//
// The value in local storage under the specified key is JSONified array of log entries.
// The transport exposes `get` and `clear` APIs to get array of log entries etc.
// UNTESTED.

function localStorageTransport(key) {

  // Get the array of log entries from local storage.
  function get() {
    return JSON.parse(localStorage.getItem(key) || '[]');
  }

  // Clear the local storage key.
  function clear() {
    localStorage.clear(key);
  }

  // Put the array of log entries into local storage.
  function put(logs) {
    localStorage.setItem(key, JSON.stringify(logs));
  }

  // Transport retrieves current set of log entries and adds new one.
  function transport(log) {
    put(get().concat(log));
  }

  // Add utility functions to return array of log and clear.
  Object.defineProperties(transport, { get: { value: get }, clear: { value: clear } });

  return transport;
}

// TRANSPORT FOR POSTING LOG DATA TO REMOTE URL
// --------------------------------------------
// UNTESTED. Needs fetch.

function remoteTransport(url) {

  return function (log) {
    // TODO: bring in fetch from somewhere
    var fetch;
    var headers = { 'Accept': 'application/json', 'Content-Type': 'application/json' };
    var method = 'POST';
    var body = JSON.stringify(log);

    fetch(url, { method: method, headers: headers, body: body });
    // How to report error?
  };
}

// WEBSOCKET-BASED TRANSPORT
// -------------------------

function websocketTransport(socket) {
  return function (log) {
    socket.send(JSON.stringify(log));
  };
}

// DOM EVENT-BASED TRANSPORT
// -------------------------
//
// Use the DOM event mechanism to report log entries.
// The target element is specified, or defaults to `document`.
// The listener consults the `detail` property of the event object to find the log info.
//
// Usage:
// ```
// import logChannel, {domEventTransport} from 'connect/utils/log-channel';
// var transport = domEventTransport('myevent');
// var channel   = logChannel('mychan', { transports: [transport] });
// channel.warn("Warning");
//
// document.addEventListener("myevent", function({ detail: { channel })  { alert("Got warning!"); });
// ```

function domEventTransport(eventName) {
  var elt = arguments.length <= 1 || arguments[1] === undefined ? document : arguments[1];

  function transport(detail) {
    var event = new CustomEvent(eventName, { detail: detail });
    elt.dispatchEvent(event);
  }

  return transport;
}

// POSTMESSAGE-BASED TRANSPORT
// ---------------------------

// Use postMessage to post the log info to another window.

function postMessageTransport(otherWindow) {
  var targetOrigin = arguments.length <= 1 || arguments[1] === undefined ? '*' : arguments[1];

  return function transport(log) {
    otherWindow.postMessage(log, targetOrigin);
  };
}

},{"./Str":32}],26:[function(require,module,exports){
// Map.js
// Upward-aware version of Array#map

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _slicedToArray = (function () {
  function sliceIterator(arr, i) {
    var _arr = [];var _n = true;var _d = false;var _e = undefined;try {
      for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
        _arr.push(_s.value);if (i && _arr.length === i) break;
      }
    } catch (err) {
      _d = true;_e = err;
    } finally {
      try {
        if (!_n && _i['return']) _i['return']();
      } finally {
        if (_d) throw _e;
      }
    }return _arr;
  }return function (arr, i) {
    if (Array.isArray(arr)) {
      return arr;
    } else if (Symbol.iterator in Object(arr)) {
      return sliceIterator(arr, i);
    } else {
      throw new TypeError('Invalid attempt to destructure non-iterable instance');
    }
  };
})();

var _Fun = require('./Fun');

var _Out = require('./Out');

exports['default'] = (0, _Fun.makeUpwardableFunction)(regeneratorRuntime.mark(function UpMap(run) {
  var r, a, newa, f, newf, ctxt, newctxt, map, _map, _ref, _ref2;

  return regeneratorRuntime.wrap(function UpMap$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:
        _map = function _map(elt) {
          var ret = map.get(Object(elt));
          if (!ret) {
            ret = f.call(ctxt, elt);
            map.set(Object(elt), ret);
          }
          return ret;
        };

        r = [];
        map = new Map();

      case 3:
        if (!true) {
          context$1$0.next = 18;
          break;
        }

        context$1$0.next = 6;
        return r;

      case 6:
        _ref = context$1$0.sent;
        _ref2 = _slicedToArray(_ref, 3);
        newa = _ref2[0];
        newf = _ref2[1];
        newctxt = _ref2[2];

        if (newf !== f) map.clear();
        a = newa;
        f = newf;
        ctxt = newctxt;
        (0, _Out.copyOntoArray)(r, a.map(_map));
        context$1$0.next = 3;
        break;

      case 18:
      case 'end':
        return context$1$0.stop();
    }
  }, UpMap, this);
}));
module.exports = exports['default'];

},{"./Fun":22,"./Out":29}],27:[function(require,module,exports){
// Upwardable Objects
// ===================

// Upwardable objects are one of the three key components of the upward library,
// along with upwardable values and upwardable functions.
// An **upwardable object** is an enhanced object which can detect and and act on
// accesses to its properties.

// An upwardable object is created by calling `makeUpwardableObject`,
// the default export from this module, on an object.
// In `index.js`, this is aliased to `U`.
// `a = Up([1, 2, 3])` or `o=Up({x: 1, y: 2}` create upwardables.
// All accesses to the elements of `a` and `o` continue to function as usual:
// `a[0]`, `a[0] = 1;`, `o.x`, and `o.x = 1`.
// Newly added properties are also immediately observable.

// Convenience.
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { 'default': obj };
}

var _Acc = require('./Acc');

var _Obs = require('./Obs');

var _Upw = require('./Upw');

var _Upw2 = _interopRequireDefault(_Upw);

var create = Object.create;
var keys = Object.keys;
var getNotifier = Object.getNotifier;
var observe = Object.observe;
var unobserve = Object.unobserve;
var defineProperty = Object.defineProperty;

// Lists of all upwardables, and objects which have been upwardified.
var set = new WeakSet();
var upwardifieds = new WeakMap();

/**
* ## is
*
* Check if an object is upwardified.
* Exported as `isUpwardableObject`.
*/
function is(u) {
  return u && typeof u === 'object' && set.has(u);
}

/**
 * ## get
 *
 * Get the upwardable version of an object.
 */
function get(o) {
  return o && typeof o === 'object' && upwardifieds.get(o);
}

/**
 * ## make
 *
 * Constructor for upwardable object.
 * Default export from this module, often imported as `makeUpwardableObject`,
 * and aliased as `U` in `index.js`.
 */
function make(o) {
  if (is(o)) return o;
  var u = get(o);
  if (!u) {
    u = _make(o);
    set.add(u);
    upwardifieds.set(o, u);
  }
  return u;
}

/**
 * ## _make
 *
 * Low-level constructor for upwardable object.
 */
function _make(o) {

  var shadow = {};
  var observers = {};
  var actions = { add: add, update: update, 'delete': _delete };

  // Delete a property. Unobserve it, delete shadow and proxy entries.
  function _delete(name) {
    observers[name].unobserve();
    delete observers[name];
    delete u[name];
    delete shadow[name];
  }

  // Update a property by reobserving.
  function update(name) {
    observers[name].reobserve(shadow[name]);
  }

  // Add a property. Set up getter and setter, Observe. Populate shadow.
  function add(name) {

    function set(v) {
      var oldValue = shadow[name];
      if (oldValue === v) return;
      o[name] = v;
      notifier.notify({ type: 'update', object: u, name: name, oldValue: oldValue });
      shadow[name] = oldValue.change(v);
    }

    // When property on upwardable object is accessed, report it and return shadow value.
    function get() {
      _Acc.accessNotifier.notify({ type: 'access', object: u, name: name });
      return shadow[name];
    }

    function observe(changes) {
      //      changes.forEach(change => shadow[name] = shadow[name].change(change.newValue));
      //      observers[name].reobserve(shadow[name]);
    }

    shadow[name] = (0, _Upw2['default'])(o[name]);
    observers[name] = (0, _Obs.Observer)(shadow[name], observe, ['upward']).observe();
    defineProperty(u, name, { set: set, get: get, enumerable: true });
  }

  // Observer to handle new or deleted properties on the object.
  // Pass through to underlying object, which will cause the right things to happen.
  function objectObserver(changes) {
    changes.forEach(function (_ref) {
      var type = _ref.type;
      var name = _ref.name;

      switch (type) {
        case 'add':
          o[name] = u[name];break;
        case 'delete':
          delete o[name];break;
      }
    });
  }

  // Observer to handle new, deleted or updated properties on the target.
  function targetObserver(changes) {
    changes.forEach(function (_ref2) {
      var type = _ref2.type;
      var name = _ref2.name;
      return actions[type](name);
    });
    //notifier.notify(change); // TODO: figure out what this line was suppsoed to do
  }

  var u = create({}); // null?
  var notifier = getNotifier(u);
  keys(o).forEach(add);
  observe(o, targetObserver);
  observe(u, objectObserver);
  return u;
}

// Exports.
exports['default'] = make;

var isUpwardableObject = is;
exports.isUpwardableObject = isUpwardableObject;

},{"./Acc":10,"./Obs":28,"./Upw":37}],28:[function(require,module,exports){
// Observation utilities
// =====================

// Setup.
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _Out = require('./Out');

// Make an observation handler, given a target and an object of handlers
// with function-valued keys such as "add", "delete", and "update".
// Keys of the form `type_name`, such as `update_a`, may also be given.
// Map the signature to match `Array#forEach`, with changerec as 4th arg.
// After all changes are handled, the 'end' hook is called.
var keys = Object.keys;
var create = Object.create;
var assign = Object.assign;
var _observe = Object.observe;
var _unobserve = Object.unobserve;
var observerPrototype = {
  handle: function handle(changes) {
    var _this = this;

    var saveObject;
    changes.forEach(function (change) {
      var type = change.type;
      var object = change.object;
      var name = change.name;

      // If handler includes a method named `type_name`, use that.
      var fn = _this[type + '_' + name] || _this[type] || function (_) {
        return undefined;
      };
      saveObject = object;
      //      if (type === 'update' && name === 'length') { type = 'length'; }
      fn(object[name], name, object, change);
    });
    if (this.end) {
      this.end(saveObject);
    }
  }
};

// This version of observerPrototype handles the change objects asynchronously,
// allowing them to return promises.
// However, it doesn't work right now, at least not in a testing context.
var asyncObserverPrototype = {
  handle: function handle(changes) {
    var saveObject;
    spawn(regeneratorRuntime.mark(function callee$1$0() {
      var _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, change, type, object, _name, fn;

      return regeneratorRuntime.wrap(function callee$1$0$(context$2$0) {
        while (1) switch (context$2$0.prev = context$2$0.next) {
          case 0:
            _iteratorNormalCompletion = true;
            _didIteratorError = false;
            _iteratorError = undefined;
            context$2$0.prev = 3;
            _iterator = changes[Symbol.iterator]();

          case 5:
            if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
              context$2$0.next = 18;
              break;
            }

            change = _step.value;
            type = change.type;
            object = change.object;
            _name = change.name;
            fn = this[type];

            saveObject = object;

            if (!fn) {
              context$2$0.next = 15;
              break;
            }

            context$2$0.next = 15;
            return fn(object[_name], _name, object, change);

          case 15:
            _iteratorNormalCompletion = true;
            context$2$0.next = 5;
            break;

          case 18:
            context$2$0.next = 24;
            break;

          case 20:
            context$2$0.prev = 20;
            context$2$0.t0 = context$2$0['catch'](3);
            _didIteratorError = true;
            _iteratorError = context$2$0.t0;

          case 24:
            context$2$0.prev = 24;
            context$2$0.prev = 25;

            if (!_iteratorNormalCompletion && _iterator['return']) {
              _iterator['return']();
            }

          case 27:
            context$2$0.prev = 27;

            if (!_didIteratorError) {
              context$2$0.next = 30;
              break;
            }

            throw _iteratorError;

          case 30:
            return context$2$0.finish(27);

          case 31:
            return context$2$0.finish(24);

          case 32:
            if (!this.end) {
              context$2$0.next = 35;
              break;
            }

            context$2$0.next = 35;
            return this.end(saveObject);

          case 35:
          case 'end':
            return context$2$0.stop();
        }
      }, callee$1$0, this, [[3, 20, 24, 32], [25,, 27, 31]]);
    }));
  }
};

// Prepare the list of `type`s to pass to O.o, based on handler methods.
// Even if only `end` is present, we need to add `add` etc.
// If handler named `type_name` is there, register `type` as handled.
function getTypesFromHandlers(handlers) {
  var types = keys(handlers);
  types = types.map(function (k) {
    return k.replace(/_.*/, '');
  });
  if (types.indexOf('end') !== -1) {
    types.push('add', 'update', 'delete');
  }
  return types;
}

// Make an observer from a hash of handlers for observation types.
// This observer can be passed to `observeObject`.
function makeObserver(handlers) {
  console.assert(handlers && typeof handlers === 'object', "Argument to makeObserver must be hash.");
  var handler = assign(create(observerPrototype), handlers);
  var observer = handler.handle.bind(handler);
  observer.keys = getTypesFromHandlers(handlers);
  return observer;
}

// Invoke Object.observe with only the types available to be handled.
function observeObject(o, observer) {
  return o && typeof o === 'object' && _observe(o, observer, observer.keys);
}

function observeObjectNow(o, observer) {
  observeObject(o, observer);
  notifyRetroactively(o);
  return o;
}

// Unobserve something obseved with `observeObject`.
function unobserveObject(o, observer) {
  return o && typeof o === 'object' && _unobserve(o, observer);
}

// Retroactively notify 'add' to all properties in an object.
function notifyRetroactively(object) {
  if (object && typeof object === 'object') {
    var notifier;

    (function () {
      var type = 'add';
      notifier = Object.getNotifier(object);

      keys(object).forEach(function (name) {
        return notifier.notify({ type: type, name: name, object: object });
      });
    })();
  }
  return object;
}

// Set up an observer and tear it down after the first report
function observeOnce(object, observer, types) {
  function _observer(changes) {
    observer(changes);
    _unobserve(object, _observer);
  }
  _observe(object, _observer, types);
}

// Keep an object in sync with another.
function mirrorProperties(src) {
  var dest = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

  function set(name) {
    dest[name] = src[name];
  }
  function _delete(name) {
    delete dest[name];
  }

  var handlers = { add: set, update: set, 'delete': _delete };

  assign(dest, src);
  _observe(src, makeObserver(handlers));
  return dest;
}

// Make an Observer object, which allows easy unobserving and resobserving.
function Observer(object, observer, types) {
  return {
    observe: function observe(_types) {
      types = _types || types;
      if ((0, _Out.isObject)(object)) _observe(object, observer, types);
      return this;
    },
    unobserve: function unobserve() {
      if ((0, _Out.isObject)(object)) _unobserve(object, observer);
      return this;
    },
    reobserve: function reobserve(_object) {
      this.unobserve();
      object = _object;
      return this.observe();
    }
  };
}

exports.makeObserver = makeObserver;
exports.observeObject = observeObject;
exports.observeObjectNow = observeObjectNow;
exports.unobserveObject = unobserveObject;
exports.notifyRetroactively = notifyRetroactively;
exports.observeOnce = observeOnce;
exports.mirrorProperties = mirrorProperties;
exports.Observer = Observer;

},{"./Out":29}],29:[function(require,module,exports){
// Object utilities
// ===============

// Setup. No dependencies, and keep it that way.
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _slicedToArray = (function () {
  function sliceIterator(arr, i) {
    var _arr = [];var _n = true;var _d = false;var _e = undefined;try {
      for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
        _arr.push(_s.value);if (i && _arr.length === i) break;
      }
    } catch (err) {
      _d = true;_e = err;
    } finally {
      try {
        if (!_n && _i['return']) _i['return']();
      } finally {
        if (_d) throw _e;
      }
    }return _arr;
  }return function (arr, i) {
    if (Array.isArray(arr)) {
      return arr;
    } else if (Symbol.iterator in Object(arr)) {
      return sliceIterator(arr, i);
    } else {
      throw new TypeError('Invalid attempt to destructure non-iterable instance');
    }
  };
})();

var marked0$0 = [objectPairs].map(regeneratorRuntime.mark);
var keys = Object.keys;
var assign = Object.assign;
var observe = Object.observe;
var unobserve = Object.unobserve;

function isObject(o) {
  return o && typeof o === 'object';
}

// Generic version of `valueOf` which works for anything.
function valueize(v) {
  return isObject(v) ? v.valueOf() : v;
}

// User-friendly representation of an object.
function objectToString(o) {
  return '{' + keys(o).map(function (k) {
    return k + ': ' + o[k];
  }).join(', ') + '}';
}

// Make functions to return properties, in various flavors.
function propGetter(v) {
  return function (o) {
    return o[v];
  };
}
function propValueGetter(v) {
  return function (o) {
    return valueize(o[v]);
  };
}
function thisPropGetter(v) {
  return function () {
    return this[v];
  };
}
function thisPropValueGetter(v) {
  return function () {
    return valueize(this[v]);
  };
}

// Analog of `Array#map` for objects.
function mapObject(o, fn, ctxt) {
  var result = {};
  for (var key in o) {
    if (o.hasOwnProperty(key)) {
      result[key] = fn.call(ctxt, o[key], key, o);
    }
  }
  return result;
}

// Map an object's values, replacing existing ones.
function mapObjectInPlace(o, fn, ctxt) {
  for (var key in o) {
    if (o.hasOwnProperty(key)) {
      o[key] = fn.call(ctxt, o[key], key, o);
    }
  }
  return o;
}

// Make a copy of something.
function copyOf(o) {
  if (Array.isArray(o)) return o.slice();
  if (isObject(o)) return assign({}, o);
  return o;
}

// Copy a second array onto a first one destructively.
function copyOntoArray(a1, a2) {
  for (var i = 0; i < a2.length; i++) {
    a1[i] = a2[i];
  }
  a1.length = a2.length;
  return a1;
}

// Overwrite a first object entirely with a second one.
function copyOntoObject(o1, o2) {
  assign(o1, o2);
  keys(o1).filter(function (key) {
    return !(key in o2);
  }).forEach(function (key) {
    return delete o1[key];
  });
  return o1;
}

// Copy a second object or array destructively onto a first one.
function copyOnto(a1, a2) {
  if (Array.isArray(a1) && Array.isArray(a2)) return copyOntoArray(a1, a2);
  if (isObject(a1) && isObject(a2)) return copyOntoObject(a1, a2);
  return a1 = a2;
}

// "Invert" an object, swapping keys and values.
function invertObject(o) {
  var result = {};
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = objectPairs(o)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var pair = _step.value;

      var _pair = _slicedToArray(pair, 2);

      var key = _pair[0];
      var val = _pair[1];

      result[val] = key;
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator['return']) {
        _iterator['return']();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  return result;
}

// Analog of `Array#reduce` for objects.
function reduceObject(o, fn, init) {
  var _iteratorNormalCompletion2 = true;
  var _didIteratorError2 = false;
  var _iteratorError2 = undefined;

  try {
    for (var _iterator2 = objectPairs(o)[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
      var pair = _step2.value;

      var _pair2 = _slicedToArray(pair, 2);

      var key = _pair2[0];
      var val = _pair2[1];

      init = fn(init, val, key, o);
    }
  } catch (err) {
    _didIteratorError2 = true;
    _iteratorError2 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion2 && _iterator2['return']) {
        _iterator2['return']();
      }
    } finally {
      if (_didIteratorError2) {
        throw _iteratorError2;
      }
    }
  }

  return init;
}

// Create an object from two arrays of keys and values.
function objectFromLists(keys, vals) {
  var result = {};
  for (var i = 0, len = keys.length; i < len; i++) {
    result[keys[i]] = vals[i];
  }
  return result;
}

// Create an object from a list of `[key, val]` pairs.
function objectFromPairs(pairs) {
  var result = {};

  for (var i = 0, len = pairs.length; i < len; i++) {
    var pair = pairs[i];
    result[pair[0]] = pair[1];
  }

  return result;
}

// Create a value-only property descriptors object from an object.
function makePropertyDescriptors(o) {
  return mapObject(o, function (v) {
    return { value: v };
  });
}

// Return an object all of the values of which are evaluated.
function valueizeObject(o) {
  return mapObject(o, valueize);
}

// Get a value down inside an object, based on a "path" (array of property names).
function valueFromPath(o) {
  var path = arguments.length <= 1 || arguments[1] === undefined ? [] : arguments[1];

  return path.reduce(function (ret, seg) {
    return isObject(ret) && ret[seg];
  }, o);
}

// Return an aray all of the values of which are evaluated.
function valueArray(a) {
  return a.map(valueize);
}

// Return an array of the object's values.
function objectValues(o) {
  return keys(o).map(function (k) {
    return o[k];
  });
}

// Generator for object's key/value pairs. Usage: `for ([key, val] of objectPairs(o))`.
function objectPairs(o) {
  var k;
  return regeneratorRuntime.wrap(function objectPairs$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:
        context$1$0.t0 = regeneratorRuntime.keys(o);

      case 1:
        if ((context$1$0.t1 = context$1$0.t0()).done) {
          context$1$0.next = 8;
          break;
        }

        k = context$1$0.t1.value;

        if (!o.hasOwnProperty(k)) {
          context$1$0.next = 6;
          break;
        }

        context$1$0.next = 6;
        return [k, o[k]];

      case 6:
        context$1$0.next = 1;
        break;

      case 8:
      case 'end':
        return context$1$0.stop();
    }
  }, marked0$0[0], this);
}

// "Empty" the object, optionally keeping structure of subobjects with `{keep: true}` option.
// Numbers turn to zero, booleans to false, arrays are emptied, etc.
function emptyObject(o, _ref) {
  var keep = _ref.keep;

  keep = keep || {};
  var _iteratorNormalCompletion3 = true;
  var _didIteratorError3 = false;
  var _iteratorError3 = undefined;

  try {
    for (var _iterator3 = objectPairs(o)[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
      var pair = _step3.value;

      var _pair3 = _slicedToArray(pair, 2);

      var k = _pair3[0];
      var v = _pair3[1];

      var ctor = v && v.constructor;
      if (keep && ctor === Object) emptyObject(v);else o[k] = ctor && ctor();
    }
  } catch (err) {
    _didIteratorError3 = true;
    _iteratorError3 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion3 && _iterator3['return']) {
        _iterator3['return']();
      }
    } finally {
      if (_didIteratorError3) {
        throw _iteratorError3;
      }
    }
  }
}

// Create a function which combines properties from two objects using a function.
// If the property doesn't exist in the first object, just copy.
function makeAssigner(fn) {
  return function (o1, o2) {
    assign(o1, mapObject(o2, function (v, k) {
      return o1.hasOwnProperty(k) ? fn(o1[k], v) : v;
    }));
  };
}

// Add the values of properties in one array to the same property in another.
var assignAdd = makeAssigner(function (a, b) {
  return a + b;
});

exports.isObject = isObject;
exports.objectToString = objectToString;
exports.propGetter = propGetter;
exports.propValueGetter = propValueGetter;
exports.thisPropGetter = thisPropGetter;
exports.thisPropValueGetter = thisPropValueGetter;
exports.mapObject = mapObject;
exports.mapObjectInPlace = mapObjectInPlace;
exports.copyOf = copyOf;
exports.copyOntoObject = copyOntoObject;
exports.copyOnto = copyOnto;
exports.copyOntoArray = copyOntoArray;
exports.invertObject = invertObject;
exports.reduceObject = reduceObject;
exports.objectFromPairs = objectFromPairs;
exports.objectFromLists = objectFromLists;
exports.makePropertyDescriptors = makePropertyDescriptors;
exports.valueizeObject = valueizeObject;
exports.valueFromPath = valueFromPath;
exports.valueArray = valueArray;
exports.objectValues = objectValues;
exports.valueize = valueize;
exports.emptyObject = emptyObject;
exports.makeAssigner = makeAssigner;
exports.assignAdd = assignAdd;

},{}],30:[function(require,module,exports){
// keepRendered: create dynamically updated DOM node.
// =================================================

// Bookkeeping and initialization.
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { 'default': obj };
}

var _Upw = require('./Upw');

var _Upw2 = _interopRequireDefault(_Upw);

var _Str = require('./Str');

var _Obj = require('./Obj');

var _Obs = require('./Obs');

var _Ass = require('./Ass');

var _Ass2 = _interopRequireDefault(_Ass);

var push = Array.prototype.push;

var subAttrs = ['style', 'class', 'dataset'];
function isSubattr(a) {
  return subAttrs.contains(a);
}

// Make observers for children, attributes, and subattributes.
// -----------------------------------------------------------
function makeChildrenObserver(e) {
  function add(v) {
    e.appendChild(v);
  }
  function _delete(v, i, o, _ref) {
    var oldValue = _ref.oldValue;
    e.removeChild(oldValue);
  }
  function update(v, i, c, _ref2) {
    var oldValue = _ref2.oldValue;

    if (i !== 'length') {
      e.replaceChild(v, oldValue);
    }
  }
  return (0, _Obs.makeObserver)({ add: add, update: update, 'delete': _delete });
}

function makeAttrsObserver(e) {
  function add(v, k) {
    e.setAttribute(k, (0, _Obj.valueize)(v));
  }
  function _delete(v, k) {
    e.removeAttribute(k);
  }
  return (0, _Obs.makeObserver)({ add: add, update: add, 'delete': _delete });
}

function makeStyleObserver(s) {
  function add(v, k) {
    elt.style[k] = v;
  }
  function _delete(v, k) {
    result.style[name] = "";
  }
  return (0, _Obs.makeObserver)({ add: add, update: add, 'delete': _delete });
}

function makeDatasetObserver(e) {
  function add(v, k) {
    e.dataset[k] = v;
  }
  function _delete(v, k) {
    delete e.dataset[k];
  }
  return (0, _Obs.makeObserver)({ add: add, change: add, 'delete': _delete });
}

function makeClassObserver(e) {
  function add(v, k) {
    e.classList.toggle((0, _Str.dasherize)(k), v);
  }
  function _delete(v, k) {
    e.classList.remove((0, _Str.dasherize)(k));
  }
  return (0, _Obs.makeObserver)({ add: add, change: add, 'delete': _delete });
}

function _keepRendered(tagName, params) {

  // Handle changes to parameters.
  // -----------------------------
  function makeParamsObserver() {

    // Observe and unobserve the children.
    function _observeChildren(v) {
      (0, _Obs.observeObjectNow)(v, childrenObserver);
    }
    function _unobserveChildren(v) {
      unobserveObject(v, childrenObserver);
    }

    function _observeAttrs(v) {
      (0, _Obs.observeObjectNow)(v, attrsObserver);
      subAttrs.forEach(function (a) {
        return (0, _Obs.observeObjectNow)(v[a], subAttrObservers[a]);
      });
    }
    function _unobserveAttrs(v) {
      unobserveObject(v, AttributesObserver);
      subAttr.forEach(function (a) {
        return unobserveObject(v[a], subAttrObservers[a]);
      });
    }

    // When we get a new parameter, set up observers.
    function add(v, i) {
      switch (i) {
        case 'children':
          _observeChildren(v);
          break;
        case 'attrs':
          _observeAttrs(v);break;
      }
    }

    // When parameters change, tear down and resetup observers.
    function update(v, i, params, _ref3) {
      var oldValue = _ref3.oldValue;

      switch (i) {
        case 'children':
          _unobserveChildren(oldValue);_observeChildren(v);break;
        case 'attrs':
          _unobserveAttrs(oldValue);_observeAttrs(v);break;
      }
    }

    return (0, _Obs.makeObserver)({ add: add, update: update });
  }

  var result = document.createElement(tagName);

  var subAttrObservers = {
    'class': makeClassObserver(result),
    dataset: makeDatasetObserver(result),
    style: makeStyleObserver(result)
  };
  var attrsObserver = makeAttrsObserver(result);
  var childrenObserver = makeChildrenObserver(result);
  var paramsObserver = makeParamsObserver();

  //mapObject(params, (v, k) => upward(v, vv => params[k] = vv));
  params = (0, _Obj.valueizeObject)(params);
  params.attrs = (0, _Ass2['default'])(params.attrs, { style: {}, 'class': {}, dataset: {} }, push);
  params.children = params.children || [];
  (0, _Obs.observeObjectNow)(params, paramsObserver);

  return result;
}

exports['default'] = function (tagName) {
  var children = arguments.length <= 1 || arguments[1] === undefined ? [] : arguments[1];
  var attrs = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

  return _keepRendered(tagName, { attrs: attrs, children: children });
};

module.exports = exports['default'];

},{"./Ass":12,"./Obj":27,"./Obs":28,"./Str":32,"./Upw":37}],31:[function(require,module,exports){
// UpSort: upward-aware version of Array#sort
// ==========================================

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _slicedToArray = (function () {
  function sliceIterator(arr, i) {
    var _arr = [];var _n = true;var _d = false;var _e = undefined;try {
      for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
        _arr.push(_s.value);if (i && _arr.length === i) break;
      }
    } catch (err) {
      _d = true;_e = err;
    } finally {
      try {
        if (!_n && _i['return']) _i['return']();
      } finally {
        if (_d) throw _e;
      }
    }return _arr;
  }return function (arr, i) {
    if (Array.isArray(arr)) {
      return arr;
    } else if (Symbol.iterator in Object(arr)) {
      return sliceIterator(arr, i);
    } else {
      throw new TypeError('Invalid attempt to destructure non-iterable instance');
    }
  };
})();

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { 'default': obj };
}

var _Fun = require('./Fun');

var _Obj = require('./Obj');

var _Obj2 = _interopRequireDefault(_Obj);

var _Out = require('./Out');

var _Utl = require('./Utl');

exports['default'] = (0, _Fun.makeUpwardableFunction)(regeneratorRuntime.mark(function UpSort(run) {
  var r, _ref, _ref2, a, f, desc;

  return regeneratorRuntime.wrap(function UpSort$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:
        r = [];

      case 1:
        if (!true) {
          context$1$0.next = 12;
          break;
        }

        context$1$0.next = 4;
        return r;

      case 4:
        _ref = context$1$0.sent;
        _ref2 = _slicedToArray(_ref, 3);
        a = _ref2[0];
        f = _ref2[1];
        desc = _ref2[2];

        (0, _Out.copyOntoArray)(r, a.slice().sort((0, _Utl.makeSortfunc)(f, desc)));
        context$1$0.next = 1;
        break;

      case 12:
      case 'end':
        return context$1$0.stop();
    }
  }, UpSort, this);
}));
module.exports = exports['default'];

},{"./Fun":22,"./Obj":27,"./Out":29,"./Utl":38}],32:[function(require,module,exports){
// String utilities
// ----------------

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _Cfg = require('./Cfg');

// `my-class` => `myClass`
function camelize(str) {
  return str.replace(/[-_]+([a-z])/g, function (_, letter) {
    return letter.toUpperCase();
  });
}

// `myClass` => `my-class`
function dasherize(str) {
  return str.replace(/([a-z])([A-Z])/g, function (_, let1, let2) {
    return let1 + '-' + let2.toLowerCase();
  });
}

if (_Cfg.upwardConfig.MODIFY_BUILTIN_PROTOTYPE) {
  String.prototype.camelize = function () {
    return camelize(this);
  };
  String.prototype.dasherize = function () {
    return dasherize(this);
  };
}

exports.camelize = camelize;
exports.dasherize = dasherize;

},{"./Cfg":15}],33:[function(require,module,exports){
// Tag shorthands
// ==============

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { 'default': obj };
}

var _Elt = require('./Elt');

var _Elt2 = _interopRequireDefault(_Elt);

var _Txt = require('./Txt');

var _Txt2 = _interopRequireDefault(_Txt);

function text(tag) {
  return function (t) {
    return (0, _Elt2['default'])(tag).has([(0, _Txt2['default'])(t)]);
  };
}

var P = text('p');

var H1 = text('h1');
var H2 = text('h2');
var H3 = text('h3');
var H4 = text('h4');
var H5 = text('h5');
var H6 = text('h6');

var B = text('b');
var I = text('i');

var LI = text('li');

var LABEL = text('label');

function A(t, href) {
  return (0, _Elt2['default'])('a').has((0, _Txt2['default'])(t)).is({ href: href });
}

function BUTTON(t, click) {
  return (0, _Elt2['default'])('button').has((0, _Txt2['default'])(t)).does({ click: click });
}

exports.P = P;
exports.H1 = H1;
exports.H2 = H2;
exports.H3 = H3;
exports.H4 = H4;
exports.H5 = H5;
exports.H6 = H6;
exports.B = B;
exports.I = I;
exports.LI = LI;
exports.LABEL = LABEL;
exports.A = A;
exports.BUTTON = BUTTON;

},{"./Elt":19,"./Txt":36}],34:[function(require,module,exports){
// String templates
// ----------------

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { 'default': obj };
}

var _Fun = require('./Fun');

var _Fun2 = _interopRequireDefault(_Fun);

var _Utl = require('./Utl');

// Utility routine to compose a string by interspersing literals and values.
function compose(strings) {
  for (var _len = arguments.length, values = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    values[_key - 1] = arguments[_key];
  }

  return strings && values && (0, _Utl.interleave)(strings, values).join('');
}

// Template helper which handles HTML; return a document fragment.
// Example:
// ```
// document.body.appendChild(HTML`<span>${foo}</span><span>${bar}</span>`);
// ```
/* NEEDS WORK */
function HTML(strings) {
  var dummy = document.createElement('div');
  var fragment = document.createDocumentFragment();

  for (var _len2 = arguments.length, values = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
    values[_key2 - 1] = arguments[_key2];
  }

  dummy.innerHTML = compose.apply(undefined, [strings].concat(values));
  forEach.call(dummy.childNodes, appendChild, fragment);
  return fragment;
}

// Will often be imported/re-exported as `upwardableTemplate`, or `F`.
// Usage:
// ```
// T(F`There are ${model.count} items.`))
// ```
exports['default'] = (0, _Fun2['default'])(compose, "");
module.exports = exports['default'];

},{"./Fun":22,"./Utl":38}],35:[function(require,module,exports){
// Test harnesses
// ==============

// A test is defined with 'test', which returns a function.
// A group of tests is defined with `testGroup`, which also returns a function.
// Either one is executed by calling it with a "reporter".
// HTML and console reporters are provided.

// Setup.
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { 'default': obj };
}

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });
  } else {
    obj[key] = value;
  }return obj;
}

var _Asy = require('./Asy');

var _Elt = require('./Elt');

var _Elt2 = _interopRequireDefault(_Elt);

var _Ify = require('./Ify');

var _Map = require('./Map');

var _Map2 = _interopRequireDefault(_Map);

var _Out = require('./Out');

var _Ren = require('./Ren');

var _Ren2 = _interopRequireDefault(_Ren);

var _Txt = require('./Txt');

var _Txt2 = _interopRequireDefault(_Txt);

var _Upw = require('./Upw');

var _Upw2 = _interopRequireDefault(_Upw);

var _Utl = require('./Utl');

var assign = Object.assign;
var create = Object.create;
var keys = Object.keys;

// Reporters
// ---------

var statusInfo = {
  pass: { color: 'green', mark: '✓' },
  fail: { color: 'red', mark: '✗' },
  skip: { color: 'orange', mark: '❖' }
};

// CSS rules for HTML output. Stick these where you will.
var testCssRules = [];
keys(statusInfo).forEach(function (status) {
  return testCssRules.push(['.' + status, { color: statusInfo[status].color }], ['.' + status + "::before", { content: '"' + statusInfo[status].mark + ' "' }]);
});

var statuses = keys(statusInfo);

function makeCounts(counts) {
  return keys(counts).filter(function (status) {
    return counts[status];
  }).map(function (status) {
    return counts[status] + ' ' + status;
  }).join(', ');
}

// Console reporter, which reports results on the console.
function consoleReporter(reports) {
  var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

  var hide = options.hide || {};
  (function _consoleReporter(reports) {
    reports.forEach(function (_ref) {
      var children = _ref.children;
      var desc = _ref.desc;
      var status = _ref.status;
      var counts = _ref.counts;
      var time = _ref.time;
      var code = _ref.code;
      var error = _ref.error;

      var countStr = makeCounts(counts);
      var color = statusInfo[status].color;
      var colorStr = 'color: ' + color;
      if (children) {
        var msg = desc;
        var collapse = hide.children || hide.passed && status === 'pass';
        if (!hide.counts) {
          msg = msg + ' (' + countStr + ')';
        }
        console[collapse ? 'groupCollapsed' : 'group']('%c' + msg, colorStr);
        _consoleReporter(children);
        console.groupEnd();
      } else {
        if (error) console.log('%c %s (%O)', colorStr, desc, error);else console.log('%c %s', colorStr, desc);
      }
    });
  })(reports);
}

// HTML reporter; returns an Array of DOM nodes.
function htmlReporter(reports) {
  var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
  var hide = options.hide;

  hide = hide || {};

  function htmlReporterOne(_ref2) {
    var children = _ref2.children;
    var desc = _ref2.desc;
    var status = _ref2.status;
    var counts = _ref2.counts;
    var time = _ref2.time;
    var code = _ref2.code;

    var text = (0, _Txt2['default'])(desc);
    var attrs = { 'class': _defineProperty({}, status, true) };
    if (children) {
      return (0, _Elt2['default'])('details').has([(0, _Elt2['default'])('summary').has([text, !hide.counts && (0, _Txt2['default'])(' (' + makeCounts(counts) + ')')]).is(attrs), (0, _Elt2['default'])('div').has(htmlReporter(children, options))]).is(hide.children ? {} : { open: true });
    } else {
      return (0, _Elt2['default'])('div').has(text).is(attrs);
    }
  }

  return (0, _Map2['default'])(reports, htmlReporterOne);
}

// Test creators
// -------------

// To skip a test, or test group, or unskip it, call these on it,
// or chain with `.skip()` and `.unskip()`.
function skip(test) {
  var s = arguments.length <= 1 || arguments[1] === undefined ? true : arguments[1];
  test._skip = s;return test;
}
function unskip(test) {
  var s = arguments.length <= 1 || arguments[1] === undefined ? true : arguments[1];
  test._unskip = s;return test;
}

// Return a function to run a group of tests.
function testGroup(desc) {
  var tests = arguments.length <= 1 || arguments[1] === undefined ? [] : arguments[1];
  var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

  function _testGroup(reporter, skipping) {
    var counts, children, time, group, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, t, allSkip;

    return regeneratorRuntime.async(function _testGroup$(context$2$0) {
      while (1) switch (context$2$0.prev = context$2$0.next) {
        case 0:
          counts = { fail: 0, pass: 0, skip: 0 };
          children = [];
          time = 0;
          group = { desc: desc, children: (0, _Upw2['default'])(children), counts: counts, time: time, status: 'skip' };
          _iteratorNormalCompletion = true;
          _didIteratorError = false;
          _iteratorError = undefined;
          context$2$0.prev = 7;
          _iterator = tests[Symbol.iterator]();

        case 9:
          if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
            context$2$0.next = 19;
            break;
          }

          t = _step.value;
          context$2$0.next = 13;
          return regeneratorRuntime.awrap(t(children, !t._unskip && (t._skip || skipping)));

        case 13:
          if (!options.pause) {
            context$2$0.next = 16;
            break;
          }

          context$2$0.next = 16;
          return regeneratorRuntime.awrap((0, _Asy.wait)(options.pause));

        case 16:
          _iteratorNormalCompletion = true;
          context$2$0.next = 9;
          break;

        case 19:
          context$2$0.next = 25;
          break;

        case 21:
          context$2$0.prev = 21;
          context$2$0.t0 = context$2$0['catch'](7);
          _didIteratorError = true;
          _iteratorError = context$2$0.t0;

        case 25:
          context$2$0.prev = 25;
          context$2$0.prev = 26;

          if (!_iteratorNormalCompletion && _iterator['return']) {
            _iterator['return']();
          }

        case 28:
          context$2$0.prev = 28;

          if (!_didIteratorError) {
            context$2$0.next = 31;
            break;
          }

          throw _iteratorError;

        case 31:
          return context$2$0.finish(28);

        case 32:
          return context$2$0.finish(25);

        case 33:

          children.forEach(function (g) {
            return (0, _Out.assignAdd)(counts, g.counts);
          });
          allSkip = counts.skip && !keys(counts).some(function (k) {
            return k !== 'skip' && counts[k];
          });

          group.status = allSkip ? 'skip' : counts.fail ? 'fail' : 'pass';
          group.time = (0, _Utl.sum)(children.map(function (c) {
            return c.time;
          }));
          reporter.push(group);

        case 38:
        case 'end':
          return context$2$0.stop();
      }
    }, null, this, [[7, 21, 25, 33], [26,, 28, 32]]);
  }

  // Allow skipping/unskipping by chaining: `testGroup(...).skip()`.
  _testGroup.skip = function (s) {
    return skip(this, s);
  };
  _testGroup.unskip = function (s) {
    return unskip(this, s);
  };
  _testGroup.push = function () {
    tests.push.apply(tests, arguments);return this;
  };

  return _testGroup;
}

// Return a function to run a single test.
function test(desc, fn) {
  var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

  var status, msg, time;
  var code = (0, _Ify.parseBody)(fn);
  var stopwatch = (0, _Utl.makeStopwatch)();

  function _test(reporter, skipping) {
    var counts = { fail: 0, skip: 0, pass: 0 };
    var time = 0;
    var status = 'skip';
    var result = { desc: desc, counts: counts, time: time, code: code, status: status };

    if (skipping) {
      return Promise.resolve().then(function (_) {
        counts.skip++;
        reporter.push(result);
      });
    } else {
      return Promise.resolve().then(stopwatch.start).then(function (_) {
        return fn(chai);
      }).then(function (_) {
        return status = 'pass';
      }, function (e) {
        status = 'fail';
        result.error = e;
      }).then(function (_) {
        stopwatch.stop();
        result.time = stopwatch.time;
        counts[status]++;
        result.status = status;
        reporter.push(result);
      });
    }
  }

  // Allow skipping/unskipping by chaining: `test(...).skip()`.
  _test.skip = function (s) {
    return skip(this, s);
  };
  _test.unskip = function (s) {
    return unskip(this, s);
  };
  return _test;
}

// Run tests, returning a promise with the results.
function runTests(tests) {
  var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
  var skipping = arguments.length <= 2 || arguments[2] === undefined ? false : arguments[2];

  var result = [];
  return tests(result, skipping).then(function () {
    return result;
  });
}

// Exports
// -------
exports.
// Reporters.
consoleReporter = consoleReporter;
exports.htmlReporter = htmlReporter;
exports.

// Test creators.
test = test;
exports.testGroup = testGroup;
exports.skip = skip;
exports.unskip = unskip;
exports.

// CSS rules
testCssRules = testCssRules;
exports.

// run tests
runTests = runTests;

// Run each test in the group.

},{"./Asy":13,"./Elt":19,"./Ify":23,"./Map":26,"./Out":29,"./Ren":30,"./Txt":36,"./Upw":37,"./Utl":38}],36:[function(require,module,exports){
// Create text node (T)
// ====================

// Bookkeeping and initialization.
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _slicedToArray = (function () {
  function sliceIterator(arr, i) {
    var _arr = [];var _n = true;var _d = false;var _e = undefined;try {
      for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
        _arr.push(_s.value);if (i && _arr.length === i) break;
      }
    } catch (err) {
      _d = true;_e = err;
    } finally {
      try {
        if (!_n && _i['return']) _i['return']();
      } finally {
        if (_d) throw _e;
      }
    }return _arr;
  }return function (arr, i) {
    if (Array.isArray(arr)) {
      return arr;
    } else if (Symbol.iterator in Object(arr)) {
      return sliceIterator(arr, i);
    } else {
      throw new TypeError('Invalid attempt to destructure non-iterable instance');
    }
  };
})();

var _Fun = require('./Fun');

exports['default'] = (0, _Fun.makeUpwardableFunction)(regeneratorRuntime.mark(function upText() {
  var node, _ref, _ref2, text;

  return regeneratorRuntime.wrap(function upText$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:
        node = document.createTextNode("");

      case 1:
        if (!true) {
          context$1$0.next = 10;
          break;
        }

        context$1$0.next = 4;
        return node;

      case 4:
        _ref = context$1$0.sent;
        _ref2 = _slicedToArray(_ref, 1);
        text = _ref2[0];

        node.nodeValue = text;
        context$1$0.next = 1;
        break;

      case 10:
      case 'end':
        return context$1$0.stop();
    }
  }, upText, this);
}));

// Extend String prototype
// -------------------------
// Allow the String prototype methods to be applied to Text nodes.

// These are methods that overwrite the node value.
['concat', 'replace', 'slice', 'substr', 'substring', 'toUpperCase', 'toLowerCase', 'toLocaleUpperCase', 'toLocaleLowerCase', 'trim', 'trimLeft', 'trimRight', 'revese'].forEach(function (method) {
  return Text.prototype[method] = function () {
    return this.nodeValue = String.prototype[method].apply(this.nodeValue, arguments);
  };
});

// These are methods that do not overwrite the node value.
['charAt', 'charCodeAt', 'indexOf', 'lastIndexOf', 'match', 'search', 'split'].forEach(function (method) {
  return Text.prototype[method] = function () {
    return String.prototype[method].apply(this.nodeValue, arguments);
  };
});
module.exports = exports['default'];

},{"./Fun":22}],37:[function(require,module,exports){
// Upwardable
// ==========

// The **upwardable** is the key concept in the upward library.
// Upwardables are returned by upwardable functions,
// represent values in upwawrdable objects,
// and have a `change` method to change their values.

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { 'default': obj };
}

function _toConsumableArray(arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];return arr2;
  } else {
    return Array.from(arr);
  }
}

var _Cfg = require('./Cfg');

var _Log = require('./Log');

var _Log2 = _interopRequireDefault(_Log);

var DEBUG_ALL = true;
var DEBUG = _Cfg.upwardConfig.DEBUG;

var create = Object.create;
var getNotifier = Object.getNotifier;
var defineProperty = Object.defineProperty;
var defineProperties = Object.defineProperties;

var channel = (0, _Log2['default'])('Upw', { style: { color: 'red' } });

// Manage upwardables.
var set = new WeakSet();

function is(u) {
  return u && typeof u === 'object' && set.has(u);
}
function add(u, debug) {
  set.add(u);adorn(u, debug);return u;
}

// Add ids and debug flag to upwardables.
var id = 0;

function adorn(u) {
  var debug = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];

  if (_Cfg.upwardConfig.DEBUG) {
    defineProperties(u, {
      _upwardableId: { value: id++ },
      _upwardableDebug: { value: debug }
    });
  }
}

// Special machinery for upwardable `undefined` and `null`.
var nullUpwardablePrototype = { valueOf: function valueOf() {
    return null;
  }, change: change };
var undefinedUpwardablePrototype = { valueOf: function valueOf() {}, change: change };

function makeNull() {
  var u = create(nullUpwardablePrototype);add(u);return u;
}
function makeUndefined() {
  var u = create(undefinedUpwardablePrototype);add(u);return u;
}

// Make a new upwardable.
// Register it, and add a `change` method which notifies when it is to be replaced.
function make(x) {
  var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
  var _options$debug = options.debug;
  var debug = _options$debug === undefined ? DEBUG_ALL : _options$debug;

  var u;

  debug = DEBUG && debug;

  if (x === undefined) u = makeUndefined();else if (x === null) u = makeNull();else {
    u = Object(x);
    if (!is(u)) {
      add(u, debug);
      defineProperty(u, 'change', { value: change });
    }
  }
  if (debug) console.debug.apply(console, _toConsumableArray(channel.debug("Created upwardable", u._upwardableId, "from", x)));
  return u;
}

// Change an upwardable. Issue notification that it has changed.
function change(x) {
  var u = this;
  var debug = u._upwardableDebug;

  if (x !== this.valueOf()) {
    u = make(x, { debug: debug });
    getNotifier(this).notify({ object: this, newValue: u, type: 'upward' });

    if (debug) {
      console.debug.apply(console, _toConsumableArray(channel.debug("Replaced upwardable", this._upwardableId, "with", u._upwardableId)));
    }
  }
  return u;
}

exports['default'] = make;
exports.isUpwardable = is;

},{"./Cfg":15,"./Log":25}],38:[function(require,module,exports){
// Utility functions
// =================

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _slicedToArray = (function () {
  function sliceIterator(arr, i) {
    var _arr = [];var _n = true;var _d = false;var _e = undefined;try {
      for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
        _arr.push(_s.value);if (i && _arr.length === i) break;
      }
    } catch (err) {
      _d = true;_e = err;
    } finally {
      try {
        if (!_n && _i['return']) _i['return']();
      } finally {
        if (_d) throw _e;
      }
    }return _arr;
  }return function (arr, i) {
    if (Array.isArray(arr)) {
      return arr;
    } else if (Symbol.iterator in Object(arr)) {
      return sliceIterator(arr, i);
    } else {
      throw new TypeError('Invalid attempt to destructure non-iterable instance');
    }
  };
})();

var marked0$0 = [interleaveIterables].map(regeneratorRuntime.mark);

function _toConsumableArray(arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];return arr2;
  } else {
    return Array.from(arr);
  }
}

function _toArray(arr) {
  return Array.isArray(arr) ? arr : Array.from(arr);
}

var _Tst = require('./Tst');

var _Out = require('./Out');

// Setup.
var create = Object.create;
var keys = Object.keys;

var tests = [];
var TEST = true;

// Create an array of a sequence of integers.
function seq(to) {
  var from = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];
  var step = arguments.length <= 2 || arguments[2] === undefined ? 1 : arguments[2];

  var result = [];
  var count = 0;
  if (to > from) for (var i = from; i < to; i += step) {
    result[count++] = i;
  } else for (var i = from; i > to; i -= step) {
    result[count++] = i;
  }return result;
}

if (TEST) {
  var tstSeq = function tstSeq() {
    return (0, _Tst.testGroup)("seq", [(0, _Tst.test)("simple sequence", function (_ref) {
      var assert = _ref.assert;
      return assert.deepEqual(seq(2), [0, 1]);
    }), (0, _Tst.test)("sequence with from", function (_ref2) {
      var assert = _ref2.assert;
      return assert.deepEqual(seq(3, 1), [1, 2]);
    }), (0, _Tst.test)("stepped sequence", function (_ref3) {
      var assert = _ref3.assert;
      return assert.deepEqual(seq(3, 0, 2), [0, 2]);
    }), (0, _Tst.test)("reverse sequence", function (_ref4) {
      var assert = _ref4.assert;
      return assert.deepEqual(seq(0, 2), [2, 1]);
    })]);
  };

  tests.push(tstSeq);
}

// Return tail of array.
function tail(a) {
  var _a = _toArray(a);

  var t = _a.slice(1);

  return t;
}

if (TEST) {
  var tstTail = function tstTail() {
    return (0, _Tst.testGroup)("tail", [(0, _Tst.test)("normal", function (_ref5) {
      var assert = _ref5.assert;
      return assert.deepEqual(tail([1, 2]), [2]);
    }), (0, _Tst.test)("single element", function (_ref6) {
      var assert = _ref6.assert;
      return assert.deepEqual(tail([1]), []);
    }), (0, _Tst.test)("empty array", function (_ref7) {
      var assert = _ref7.assert;
      return assert.deepEqual(tail([]), []);
    })]);
  };

  tests.push(tstTail);
}

function plus(a, b) {
  return a + b;
}

if (TEST) {
  var tstPlus = function tstPlus() {
    return (0, _Tst.test)("plus", function (_ref8) {
      var assert = _ref8.assert;
      return assert.equal(plus(1, 2), 3);
    });
  };

  tests.push(tstPlus);
}

// Sum (or concatenate) elements of array
function sum(a) {
  return a.reduce(plus);
}

function arrayMax(a) {
  return Math.max.apply(Math, _toConsumableArray(a));
}

function arrayMin(a) {
  return Math.min.apply(Math, _toConsumableArray(a));
}

function arrayMean(a) {
  return sum(a) / a.length;
}

// Swap the elements of a tuple in place.
function swap(a) {
  var _a2 = _slicedToArray(a, 2);

  a[1] = _a2[0];
  a[2] = _a2[1];
}

// Append to an array, returning the array.
function append(a) {
  for (var _len = arguments.length, elts = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    elts[_key - 1] = arguments[_key];
  }

  a.push.apply(a, elts);
  return a;
}

// Omit elements from array destructively.
function omit(a, elt) {
  var index = a.indexOf(elt);
  if (index !== -1) {
    a.splice(index, 1);
  }
  return a;
}

// Replace one element in an array with another.
function replace(a, elt1, elt2) {
  var idx = a.indexOf(elt1);
  if (idx !== -1) {
    a[idx] = elt2;
  }
  return a;
}

// reverse an array in place
function reverse(a) {
  var len = a.length;
  for (var i = 0; i < Math.floor(len / 2); i++) {
    var _ref9 = [a[len - i - 1], a[i]];
    a[i] = _ref9[0];
    a[len - i - 1] = _ref9[1];
  }
  return a;
}

// Flatten an array.
function flatten(a) {
  function _reduce(a) {
    return a.reduce(_flatten, []);
  }

  function _flatten(a, b) {
    return a.concat(Array.isArray(b) ? _reduce(b) : b);
  }

  return _reduce(a);
}

if (TEST) {
  tests.push(function () {
    return (0, _Tst.testGroup)("flatten", [(0, _Tst.test)("simple flatten", function (_ref10) {
      var assert = _ref10.assert;
      return assert.deepEqual(flatten([[1, 2], [3, 4]]), [1, 2, 3, 4]);
    }), (0, _Tst.test)("deep flatten", function (_ref11) {
      var assert = _ref11.assert;
      return assert.deepEqual(flatten([1, [2, [3, [4]]]]), [1, 2, 3, 4]);
    })]);
  });
}

function mapInPlace(a, fn, ctxt) {
  for (var i = 0, len = a.length; i < len; i++) {
    a[i] = fn.call(ctxt, a[i]);
  }
  return a;
}

function repeat(n, v) {
  return seq(n).fill(v);
}

// Create a sort function suitable for passing to `Array#sort`.
function makeSortfunc(key, desc) {
  return function (a, b) {
    var akey = key(a),
        bkey = key(b);
    var result = akey < bkey ? -1 : akey > bkey ? +1 : 0;
    return desc ? -result : result;
  };
}

// Copy a second array onto a first one destructively.
function copyOntoArray(a1, a2) {
  for (var i = 0; i < a1.length; i++) {
    a1[i] = a2[i];
  }
  a1.length = a2.length;
  return a1;
}

// Create an array of unique values.
// @TODO replace this logic using Set.
function uniqueize(a) {
  return a.filter(function (elt, i) {
    return a.indexOf(elt) === i;
  });
}

// Find all occurrences of element in an array, return indices.
// @NOTUSED
function indexesOf(a, elt) {
  var ret = [],
      index = 0;
  while ((index = a.indexOf(elt, index)) !== -1) {
    ret.push(index++);
  }
  return ret;
}

// Interleave an element into an array (adding at end too).
function interleaveElement(a1, elt) {
  var _ref12;

  return (_ref12 = []).concat.apply(_ref12, _toConsumableArray(a1.map(function (v) {
    return [v, elt];
  })));
}

// Create an array of running totals, etc.
function runningMap(a, fn, init) {
  return a.map(function (v) {
    return init = fn(v, init);
  });
}

// Create an array of running totals.
function runningTotal(a) {
  return runningMap(a, Math.sum);
}

// Filter an array in place, based on predicate with same signature as `Array#filter`.
function filterInPlace(a, fn, ctxt) {
  for (var i = 0; i < a.length; i++) {
    if (!fn.call(ctxt, a[i], i, a)) {
      a.splice(i--, 1);
    }
  }
  return a;
}

// Chain fns together using promises.
function chainPromises() {
  for (var _len2 = arguments.length, fns = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
    fns[_key2] = arguments[_key2];
  }

  return [].concat(fns).reduce(function (result, fn) {
    return result.then(fn);
  }, Promise.resolve());
}

// Stopwatch: start and stop, then retrieve elapsed time.
// Start and stop return input, to make them friendly to promise chaining.
// Start, stop and reset are pre-bound to the stopwatch itself.
var stopwatchPrototype = create({
  start: function start(val) {
    this.started = Date.now();this.stopped = false;return val;
  },
  stop: function stop(val) {
    this.elapsed = this.time;this.stopped = true;return val;
  },
  reset: function reset(val) {
    this.elapsed = 0;this.stopped = true;return val;
  },
  stopped: true,
  elapsed: 0
}, {
  current: { get: function get() {
      return this.stopped ? 0 : Date.now() - this.started;
    } },
  time: { get: function get() {
      return this.elapsed + this.current;
    } }
});

function makeStopwatch() {
  var stopwatch = create(stopwatchPrototype);
  ['start', 'stop', 'reset'].forEach(function (method) {
    return stopwatch[method] = stopwatch[method].bind(stopwatch);
  });
  return stopwatch;
}

// Make a counter for occurrences of something on an object, using weak map.
// For example, used to count recomputations of "keepXXX" results.
function makeCounterMap() {
  var map = new WeakMap();
  return {
    init: function init(obj) {
      map.set(obj, 0);
    },
    incr: function incr(obj) {
      console.assert(map.has(obj), "Object must be in counter map.");
      map.set(obj, map.get(obj) + 1);
    },
    get: function get(obj) {
      return map.get(obj);
    }
  };
}

// Interleave multiple arrays.
function interleave() {
  var more = true;
  var n = 0;
  var result = [];

  for (var _len3 = arguments.length, arrays = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
    arrays[_key3] = arguments[_key3];
  }

  while (more) {
    more = false;
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = arrays[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var array = _step.value;

        if (n >= array.length) continue;
        result.push(array[n]);
        more = true;
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator['return']) {
          _iterator['return']();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }

    n++;
  }
  return result;
}

// Generator for interleaved values from multiple iteratables.
function interleaveIterables() {
  for (var _len4 = arguments.length, iterables = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
    iterables[_key4] = arguments[_key4];
  }

  var more, _iteratorNormalCompletion2, _didIteratorError2, _iteratorError2, _iterator2, _step2, it, _it$next, done, value;

  return regeneratorRuntime.wrap(function interleaveIterables$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:
        more = true;

      case 1:
        if (!more) {
          context$1$0.next = 37;
          break;
        }

        more = false;
        _iteratorNormalCompletion2 = true;
        _didIteratorError2 = false;
        _iteratorError2 = undefined;
        context$1$0.prev = 6;
        _iterator2 = iterables[Symbol.iterator]();

      case 8:
        if (_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done) {
          context$1$0.next = 21;
          break;
        }

        it = _step2.value;
        _it$next = it.next();
        done = _it$next.done;
        value = _it$next.value;

        if (!done) {
          context$1$0.next = 15;
          break;
        }

        return context$1$0.abrupt('continue', 18);

      case 15:
        more = true;
        context$1$0.next = 18;
        return value;

      case 18:
        _iteratorNormalCompletion2 = true;
        context$1$0.next = 8;
        break;

      case 21:
        context$1$0.next = 27;
        break;

      case 23:
        context$1$0.prev = 23;
        context$1$0.t0 = context$1$0['catch'](6);
        _didIteratorError2 = true;
        _iteratorError2 = context$1$0.t0;

      case 27:
        context$1$0.prev = 27;
        context$1$0.prev = 28;

        if (!_iteratorNormalCompletion2 && _iterator2['return']) {
          _iterator2['return']();
        }

      case 30:
        context$1$0.prev = 30;

        if (!_didIteratorError2) {
          context$1$0.next = 33;
          break;
        }

        throw _iteratorError2;

      case 33:
        return context$1$0.finish(30);

      case 34:
        return context$1$0.finish(27);

      case 35:
        context$1$0.next = 1;
        break;

      case 37:
      case 'end':
        return context$1$0.stop();
    }
  }, marked0$0[0], this, [[6, 23, 27, 35], [28,, 30, 34]]);
}

// URL-RELATED UTILITIES
// ---------------------

// Parse a search string into an object.
function parseUrlSearch(search) {
  if (search[0] === '?') search = search.slice(1);

  function splitParam(param) {
    var _param$split = param.split('=');

    var _param$split2 = _slicedToArray(_param$split, 2);

    var key = _param$split2[0];
    var _param$split2$1 = _param$split2[1];
    var value = _param$split2$1 === undefined ? '' : _param$split2$1;

    return [key, decodeURIComponent(value)];
  }

  return (0, _Out.objectFromPairs)(search.split('&').map(splitParam));
}

if (TEST) {
  tests.push(function tstParseUrlSearch() {
    return (0, _Tst.testGroup)("parseUrlSearch", [(0, _Tst.test)("base case", function (_ref13) {
      var assert = _ref13.assert;
      return assert.deepEqual(parseUrlSearch('a=1&b=2'), { a: "1", b: "2" });
    })]);
  });
}

// Build a search string (with no ?) from an object.
function buildUrlSearch(query) {

  function buildParam(key) {
    var value = query[key];
    if (value === null || value === undefined) value = '';else value = encodeURIComponent(value);
    return key + '=' + value;
  }

  return keys(query).map(buildParam).join('&');
}

if (TEST) {
  tests.push(function tstBuildUrlSearch() {
    return (0, _Tst.testGroup)("buildUrlSearch", [(0, _Tst.test)("base case", function (_ref14) {
      var assert = _ref14.assert;
      return assert.equal(buildUrlSearch({ a: 1, b: 2 }), 'a=1&b=2');
    })]);
  });
}

var prototypeFns = {
  tail: tail, sum: sum, swap: swap, append: append, replace: replace, mapInPlace: mapInPlace, omit: omit, copyOntoArray: copyOntoArray, uniqueize: uniqueize,
  indexesOf: indexesOf, interleave: interleave, runningMap: runningMap, runningTotal: runningTotal, filterInPlace: filterInPlace, chainPromises: chainPromises
};

// Allow in-place modifier functions to be applied to array as `this`.
// if (!Array.prototype.tail) {
//   Object.defineProperties(
//     Array.prototype,
//     mapObject(prototypeFns, v => (
//       { value(...args) { return v(this, ...args); } }
//     ))
//   );
// }

// Exported function to Create test group.
function utlTestGroup() {
  return (0, _Tst.testGroup)("module Utl (general utilities)", tests.map(function (test) {
    return test();
  }));
}

exports.seq = seq;
exports.tail = tail;
exports.plus = plus;
exports.sum = sum;
exports.arrayMax = arrayMax;
exports.arrayMin = arrayMin;
exports.arrayMean = arrayMean;
exports.swap = swap;
exports.append = append;
exports.omit = omit;
exports.replace = replace;
exports.reverse = reverse;
exports.flatten = flatten;
exports.mapInPlace = mapInPlace;
exports.repeat = repeat;
exports.makeSortfunc = makeSortfunc;
exports.copyOntoArray = copyOntoArray;
exports.uniqueize = uniqueize;
exports.indexesOf = indexesOf;
exports.interleaveElement = interleaveElement;
exports.runningMap = runningMap;
exports.runningTotal = runningTotal;
exports.filterInPlace = filterInPlace;
exports.chainPromises = chainPromises;
exports.makeStopwatch = makeStopwatch;
exports.makeCounterMap = makeCounterMap;
exports.interleave = interleave;
exports.interleaveIterables = interleaveIterables;
exports.parseUrlSearch = parseUrlSearch;
exports.buildUrlSearch = buildUrlSearch;
exports.tests = utlTestGroup;

},{"./Out":29,"./Tst":35}]},{},[7])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL25wbS9saWIvbm9kZV9tb2R1bGVzL3dhdGNoaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuLi8uLi8uLi9ucG0vbGliL25vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvaW5oZXJpdHMvaW5oZXJpdHNfYnJvd3Nlci5qcyIsIi4uLy4uLy4uL25wbS9saWIvbm9kZV9tb2R1bGVzL3dhdGNoaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9wcm9jZXNzL2Jyb3dzZXIuanMiLCIuLi8uLi8uLi9ucG0vbGliL25vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvdXRpbC9zdXBwb3J0L2lzQnVmZmVyQnJvd3Nlci5qcyIsIi4uLy4uLy4uL25wbS9saWIvbm9kZV9tb2R1bGVzL3dhdGNoaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy91dGlsL3V0aWwuanMiLCJub2RlX21vZHVsZXMvbWFya2Rvd24vbGliL21hcmtkb3duLmpzIiwiL2hvbWUvcnRtL3JlcG9zL3J0bS91cHdhcmQtc2FtcGxlcy9zcmMvUmFuLmpzIiwiL2hvbWUvcnRtL3JlcG9zL3J0bS91cHdhcmQtc2FtcGxlcy9zcmMvbWFpbi5qcyIsIi9ob21lL3J0bS9yZXBvcy9ydG0vdXB3YXJkLXNhbXBsZXMvc3JjL3N0eWxlLmpzIiwiL2hvbWUvcnRtL3JlcG9zL3J0bS91cHdhcmQvaW5kZXguanMiLCIvaG9tZS9ydG0vcmVwb3MvcnRtL3Vwd2FyZC9zcmMvQWNjLmpzIiwiL2hvbWUvcnRtL3JlcG9zL3J0bS91cHdhcmQvc3JjL0Fyci5qcyIsIi9ob21lL3J0bS9yZXBvcy9ydG0vdXB3YXJkL3NyYy9Bc3MuanMiLCIvaG9tZS9ydG0vcmVwb3MvcnRtL3Vwd2FyZC9zcmMvQXN5LmpzIiwiL2hvbWUvcnRtL3JlcG9zL3J0bS91cHdhcmQvc3JjL0F0dC5qcyIsIi9ob21lL3J0bS9yZXBvcy9ydG0vdXB3YXJkL3NyYy9DZmcuanMiLCIvaG9tZS9ydG0vcmVwb3MvcnRtL3Vwd2FyZC9zcmMvQ2hpLmpzIiwiL2hvbWUvcnRtL3JlcG9zL3J0bS91cHdhcmQvc3JjL0NudC5qcyIsIi9ob21lL3J0bS9yZXBvcy9ydG0vdXB3YXJkL3NyYy9Dc3MuanMiLCIvaG9tZS9ydG0vcmVwb3MvcnRtL3Vwd2FyZC9zcmMvRWx0LmpzIiwiL2hvbWUvcnRtL3JlcG9zL3J0bS91cHdhcmQvc3JjL0V2dC5qcyIsIi9ob21lL3J0bS9yZXBvcy9ydG0vdXB3YXJkL3NyYy9GYWQuanMiLCIvaG9tZS9ydG0vcmVwb3MvcnRtL3Vwd2FyZC9zcmMvRnVuLmpzIiwiL2hvbWUvcnRtL3JlcG9zL3J0bS91cHdhcmQvc3JjL0lmeS5qcyIsIi9ob21lL3J0bS9yZXBvcy9ydG0vdXB3YXJkL3NyYy9JbnAuanMiLCIvaG9tZS9ydG0vcmVwb3MvcnRtL3Vwd2FyZC9zcmMvTG9nLmpzIiwiL2hvbWUvcnRtL3JlcG9zL3J0bS91cHdhcmQvc3JjL01hcC5qcyIsIi9ob21lL3J0bS9yZXBvcy9ydG0vdXB3YXJkL3NyYy9PYmouanMiLCIvaG9tZS9ydG0vcmVwb3MvcnRtL3Vwd2FyZC9zcmMvT2JzLmpzIiwiL2hvbWUvcnRtL3JlcG9zL3J0bS91cHdhcmQvc3JjL091dC5qcyIsIi9ob21lL3J0bS9yZXBvcy9ydG0vdXB3YXJkL3NyYy9SZW4uanMiLCIvaG9tZS9ydG0vcmVwb3MvcnRtL3Vwd2FyZC9zcmMvU3J0LmpzIiwiL2hvbWUvcnRtL3JlcG9zL3J0bS91cHdhcmQvc3JjL1N0ci5qcyIsIi9ob21lL3J0bS9yZXBvcy9ydG0vdXB3YXJkL3NyYy9UYWcuanMiLCIvaG9tZS9ydG0vcmVwb3MvcnRtL3Vwd2FyZC9zcmMvVGVtLmpzIiwiL2hvbWUvcnRtL3JlcG9zL3J0bS91cHdhcmQvc3JjL1RzdC5qcyIsIi9ob21lL3J0bS9yZXBvcy9ydG0vdXB3YXJkL3NyYy9UeHQuanMiLCIvaG9tZS9ydG0vcmVwb3MvcnRtL3Vwd2FyZC9zcmMvVXB3LmpzIiwiL2hvbWUvcnRtL3JlcG9zL3J0bS91cHdhcmQvc3JjL1V0bC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzFrQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFD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QUUsR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxHQUFHLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQSxDQUFFLElBQUksQ0FBQSxBQUFDLEVBQUUsRUFBRSxHQUFHLElBQUksRUFBRTtBQUFFLFlBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDLEFBQUMsSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsTUFBTTtPQUFFO0tBQUUsQ0FBQyxPQUFPLEdBQUcsRUFBRTtBQUFFLFFBQUUsR0FBRyxJQUFJLENBQUMsQUFBQyxFQUFFLEdBQUcsR0FBRyxDQUFDO0tBQUUsU0FBUztBQUFFLFVBQUk7QUFBRSxZQUFJLENBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxRQUFRLENBQUMsRUFBRSxFQUFFLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQztPQUFFLFNBQVM7QUFBRSxZQUFJLEVBQUUsRUFBRSxNQUFNLEVBQUUsQ0FBQztPQUFFO0tBQUUsQUFBQyxPQUFPLElBQUksQ0FBQztHQUFFLEFBQUMsT0FBTyxVQUFVLEdBQUcsRUFBRSxDQUFDLEVBQUU7QUFBRSxRQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUU7QUFBRSxhQUFPLEdBQUcsQ0FBQztLQUFFLE1BQU0sSUFBSSxNQUFNLENBQUMsUUFBUSxJQUFJLE1BQU0sQ0FBQyxHQUFHLENBQUMsRUFBRTtBQUFFLGFBQU8sYUFBYSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztLQUFFLE1BQU07QUFBRSxZQUFNLElBQUksU0FBUyxDQUFDLHNEQUFzRCxDQUFDLENBQUM7S0FBRTtHQUFFLENBQUM7Q0FBRSxDQUFBLEVBQUcsQ0FBQzs7QUFFMXBCLFNBQVMsc0JBQXNCLENBQUMsR0FBRyxFQUFFO0FBQUUsU0FBTyxHQUFHLElBQUksR0FBRyxDQUFDLFVBQVUsR0FBRyxHQUFHLEdBQUcs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M0MsT0FBSyxFQUFFLElBQUk7Q0FDWixDQUFDLENBQUM7O0FBRUgsSUFBSSxjQUFjLEdBQUcsQ0FBQyxZQUFZO0FBQUUsV0FBUyxhQUFhLENBQUMsR0FBRyxFQUFFLENBQUMsRUFBRTtBQUFFLFFBQUksSUFBSSxHQUFHLEVBQUUsQ0FBQyxBQUFDLElBQUksRUFBRSxHQUFHLElBQUksQ0FBQyxBQUFDLElBQUksRUFBRSxHQUFHLEtBQUssQ0FBQyxBQUFDLElBQUksRUFBRSxHQUFHLFNBQVMsQ0FBQyxBQUFDLElBQUk7QUFBRSxXQUFLLElBQUksRUFBRSxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEdBQUcsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLElBQUksRUFBRSxDQUFBLENBQUUsSUFBSSxDQUFBLEFBQUMsRUFBRSxFQUFFLEdBQUcsSUFBSSxFQUFFO0FBQUUsWUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUMsQUFBQyxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxNQUFNO09BQUU7S0FBRSxDQUFDLE9BQU8sR0FBRyxFQUFFO0FBQUUsUUFBRSxHQUFHLElBQUksQ0FBQyxBQUFDLEVBQUUsR0FBRyxHQUFHLENBQUM7S0FBRSxTQUFTO0FBQUUsVUFBSTtBQUFFLFlBQUksQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLFFBQVEsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDO09BQUUsU0FBUztBQUFFLFlBQUksRUFBRSxFQUFFLE1BQU0sRUFBRSxDQUFDO09BQUU7S0FBRSxBQUFDLE9BQU8sSUFBSSxDQUFDO0dBQUUsQUFBQyxPQUFPLFVBQVUsR0FBRyxFQUFFLENBQUMsRUFBRTtBQUFFLFFBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRTtBQUFFLGFBQU8sR0FBRyxDQUFDO0tBQUUsTUFBTSxJQUFJLE1BQU0sQ0FBQyxR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Q0FBQyxFQUU5RyxDQUFDLDhEQUE4RCxFQUFFLEVBQUUsU0FBUyxFQUFFLElBQUEsQ0FBQSxTQUFBLENBQVUsVUFBVSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsRUFDOUcsQ0FBQyw4REFBOEQsRUFBRSxFQUFFLFNBQVMsRUFBRSxJQUFBLENBQUEsU0FBQSxDQUFVLFVBQVUsQ0FBQyxDQUFDLENBQUMsRUFBUSxDQUFDLEVBQzlHLENBQUMsOERBQThELEVBQUUsRUFBRSxTQUFTLEVBQUUsSUFBQSxDQUFBLFNBQUEsQ0FBVSxVQUFVLENBQUMsQ0FBQyxDQUFDLEVBQVEsQ0FBQyxFQUM5RyxDQUFDLDhEQUE4RCxFQUFFLEVBQUUsU0FBUyxFQUFFLElBQUEsQ0FBQSxTQUFBLENBQVUsVUFBVSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsRUFFOUcsQ0FBQyw4REFBOEQsRUFBRSxFQUFFLFNBQVMsRUFBRSxJQUFBLENBQUEsU0FBQSxDQUFVLFVBQVUsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLEVBQzlHLENBQUMsOERBQThELEVBQUUsRUFBRSxTQUFTLEVBQUUsSUFBQSxDQUFBLFNBQUEsQ0FBVSxVQUFVLENBQUMsQ0FBQyxDQUFDLEVBQVEsQ0FBQyxFQUM5RyxDQUFDLDhEQUE4RCxFQUFFLEVBQUUsU0FBUyxFQUFFLElBQUEsQ0FBQSxTQUFBLENBQVUsVUFBVSxDQUFDLENBQUMsQ0FBQyxFQUFRLENBQUMsRUFDOUcsQ0FBQyw4REFBOEQsRUFBRSxFQUFFLFNBQVMsRUFBRSxJQUFBLENBQUEsU0FBQSxDQUFVLFVBQVUsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLEVBRTlHLENBQUMsOERBQThELEVBQUUsRUFBRSxTQUFTLEVBQUUsSUFBQSxDQUFBLFNBQUEsQ0FBVSxVQUFVLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxFQUM5RyxDQUFDLDhEQUE4RCxFQUFFLEVBQUUsU0FBUyxFQUFFLElBQUEsQ0FBQSxTQUFBLENBQVUsVUFBVSxDQUFDLENBQUMsQ0FBQyxFQUFRLENBQUMsRUFDOUcsQ0FBQyw4REFBOEQsRUFBRSxFQUFFLFNBQVMsRUFBRSxJQUFBLENBQUEsU0FBQSxDQUFVLFVBQVUsQ0FBQyxDQUFDLENBQUMsRUFBUSxDQUFDLEVBQzlHLENBQUMsOERBQThELEVBQUUsRUFBRSxTQUFTLEVBQUUsSUFBQSxDQUFBLFNBQUEsQ0FBVSxVQUFVLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxFQUU5RyxDQUFDLDhEQUE4RCxFQUFFLEVBQUUsU0FBUyxFQUFFLElBQUEsQ0FBQSxTQUFBLENBQVUsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFZLENBQUMsRUFDOUcsQ0FBQyw4REFBOEQsRUFBRSxFQUFFLFNBQVMsRUFBRSxJQUFBLENBQUEsU0FBQSxDQUFVLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBWSxDQUFDLEVBQzlHLENBQUMsOERBQThELEVBQUUsRUFBRSxTQUFTLEVBQUUsSUFBQSxDQUFBLFNBQUEsQ0FBVSxNQUFNLENBQUMsUUFBUSxDQUFDLEVBQUssQ0FBQyxFQUM5RyxDQUFDLDhEQUE4RCxFQUFFLEVBQUUsU0FBUyxFQUFFLElBQUEsQ0FBQSxTQUFBLENBQVUsTUFBTSxDQUFDLFFBQVEsQ0FBQyxFQUFLLENBQUMsRUFFOUcsQ0FBQyw4REFBOEQsRUFBRSxFQUFFLFNBQVMsRUFBRSxJQUFBLENBQUEsU0FBQSxDQUFVLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBVyxDQUFDLEVBQzlHLENBQUMsOERBQThELEVBQUUsRUFBRSxTQUFTLEVBQUUsSUFBQSxDQUFBLFNBQUEsQ0FBVSxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQVcsQ0FBQyxFQUM5RyxDQUFDLDhEQUE4RCxFQUFFLEVBQUUsU0FBUyxFQUFFLElBQUEsQ0FBQSxTQUFBLENBQVUsT0FBTyxDQUFDLFFBQVEsQ0FBQyxFQUFJLENBQUMsRUFDOUcsQ0FBQyw4REFBOEQsRUFBRSxFQUFFLFNBQVMsRUFBRSxJQUFBLENBQUEsU0FBQSxDQUFVLE9BQU8sQ0FBQyxRQUFRLENBQUMsRUFBSSxDQUFDLEVBRTlHLENBQUMsOERBQThELEVBQUUsRUFBRSxTQUFTLEVBQUUsSUFBQSxDQUFBLFNBQUEsQ0FBVSxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQVcsQ0FBQyxFQUM5RyxDQUFDLDhEQUE4RCxFQUFFLEVBQUUsU0FBUyxFQUFFLElBQUEsQ0FBQSxTQUFBLENBQVUsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFXLENBQUMsRUFDOUcsQ0FBQyw4REFBOEQsRUFBRSxFQUFFLFNBQVMsRUFBRSxJQUFBLENBQUEsU0FBQSxDQUFVLE9BQU8sQ0FBQyxRQUFRLENBQUMsRUFBSSxDQUFDLEVBQzlHLENBQUMsOERBQThELEVBQUUsRUFBRSxTQUFTLEVBQUUsSUFBQSxDQUFBLFNBQUEsQ0FBVSxPQUFPLENBQUMsUUFBUSxDQUFDLEVBQUksQ0FBQyxFQUU5RyxDQUFDLG1EQUFtRCxFQUFFLEVBQUUsU0FBUyxFQUFFLElBQUEsQ0FBQSxTQUFBLENBQVUsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFDMUYsQ0FBQyxtREFBbUQsRUFBRSxFQUFFLFNBQVMsRUFBRSxJQUFBLENBQUEsU0FBQSxDQUFVLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQzFGLENBQUMsbURBQW1ELEVBQUUsRUFBRSxTQUFTLEVBQUUsSUFBQSxDQUFBLFNBQUEsQ0FBVSxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUMxRixDQUFDLG1EQUFtRCxFQUFFLEVBQUUsU0FBUyxFQUFFLElBQUEsQ0FBQSxTQUFBLENBQVUsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7OztBQUcxRixDQUFDLDRDQUE0QyxFQUFFLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBRSxTQUFTLEVBQUUsSUFBQSxDQUFBLFNBQUEsQ0FBVSxTQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FDckcsQ0FBQzs7QUFFRixDQUFBLENBQUEsRUFBQSxLQUFBLENBQUEsU0FBQSxDQUFBLENBQUEsQ0FBUSxRQUFRLENBQUMsQ0FBQztBQXBDbEIsTUFBTSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7Ozs7Ozs7Ozs7Ozs7O0FDdkdwQyxZQUFZLENBQUM7O0FBRWIsTUFBTSxDQUFDLGNBQWMsQ0FBQyxPQUFPLEVBQUUsWUFBWSxFQUFFO0FBQzNDLE9BQUssRUFBRSxJQUFJO0NBQ1osQ0FBQyxDQUFDOztBQUVILElBQUksY0FBYyxHQUFHLENBQUMsWUFBWTtBQUFFLFdBQVMsYUFBYSxDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUU7QUFBRSxRQUFJLElBQUksR0FBRyxFQUFFLENBQUMsQUFBQyxJQUFJLEVBQUUsR0FBRyxJQUFJLENBQUMsQUFBQyxJQUFJLEVBQUUsR0FBRyxLQUFLLENBQUMsQUFBQyxJQUFJLEVBQUUsR0FBRyxTQUFTLENBQUMsQUFBQyxJQUFJO0FBQUUsV0FBSyxJQUFJLEVBQUUsR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxHQUFHLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQSxDQUFFLElBQUksQ0FBQSxBQUFDLEVBQUUsRUFBRSxHQUFHLElBQUksRUFBRTtBQUFFLFlBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDLEFBQUMsSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsTUFBTTtPQUFFO0tBQUUsQ0FBQyxPQUFPLEdBQUcsRUFBRTtBQUFFLFFBQUUsR0FBRyxJQUFJLENBQUMsQUFBQyxFQUFFLEdBQUcsR0FBRyxDQUFDO0tBQUUsU0FBUztBQUFFLFVBQUk7QUFBRSxZQUFJLENBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxRQUFRLENBQUMsRUFBRSxFQUFFLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQztPQUFFLFNBQVM7QUFBRSxZQUFJLEVBQUUsRUFBRSxNQUFNLEVBQUUsQ0FBQztPQUFFO0tBQUUsQUFBQyxPQUFPLElBQUksQ0FBQztHQUFFLEFBQUMsT0FBTyxVQUFVLEdBQUcsRUFBRSxDQUFD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TCxJQUFJLEdBQUosSUFBSSxDQUFBO0FBd0xOLE9BQU8sQ0F2TEwsT0FBTyxHQUFQLE9BQU8sQ0FBQTtBQXdMVCxPQUFPLENBdkxMLE9BQU8sR0FBUCxPQUFPLENBQUE7QUF3TFQsT0FBTyxDQXZMTCxPQUFPLEdBQVAsT0FBTyxDQUFBO0FBd0xULE9BQU8sQ0F2TEwsVUFBVSxHQUFWLFVBQVUsQ0FBQTtBQXdMWixPQUFPLENBdkxMLE1BQU0sR0FBTixNQUFNLENBQUE7QUF3TFIsT0FBTyxDQXZMTCxZQUFZLEdBQVosWUFBWSxDQUFBO0FBd0xkLE9BQU8sQ0F2TEwsYUFBYSxHQUFiLGFBQWEsQ0FBQTtBQXdMZixPQUFPLENBdkxMLFNBQVMsR0FBVCxTQUFTLENBQUE7QUF3TFgsT0FBTyxDQXZMTCxTQUFTLEdBQVQsU0FBUyxDQUFBO0FBd0xYLE9BQU8sQ0F2TEwsaUJBQWlCLEdBQWpCLGlCQUFpQixDQUFBO0FBd0xuQixPQUFPLENBdkxMLFVBQVUsR0FBVixVQUFVLENBQUE7QUF3TFosT0FBTyxDQXZMTCxZQUFZLEdBQVosWUFBWSxDQUFBO0FBd0xkLE9BQU8sQ0F2TEwsYUFBYSxHQUFiLGFBQWEsQ0FBQTtBQXdMZixPQUFPLENBdkxMLGFBQWEsR0FBYixhQUFhLENBQUE7QUF3TGYsT0FBTyxDQXZMTCxhQUFhLEdBQWIsYUFBYSxDQUFBO0FBd0xmLE9BQU8sQ0F2TEwsY0FBYyxHQUFkLGNBQWMsQ0FBQTtBQXdMaEIsT0FBTyxDQXZMTCxVQUFVLEdBQVYsVUFBVSxDQUFBO0FBd0xaLE9BQU8sQ0F2TEwsbUJBQW1CLEdBQW5CLG1CQUFtQixDQUFBO0FBd0xyQixPQUFPLENBdExMLGNBQWMsR0FBZCxjQUFjLENBQUE7QUF1TGhCLE9BQU8sQ0F0TEwsY0FBYyxHQUFkLGNBQWMsQ0FBQTtBQXVMaEIsT0FBTyxDQXJMVyxLQUFLLEdBQXJCLFlBQVksQ0FBQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJpZiAodHlwZW9mIE9iamVjdC5jcmVhdGUgPT09ICdmdW5jdGlvbicpIHtcbiAgLy8gaW1wbGVtZW50YXRpb24gZnJvbSBzdGFuZGFyZCBub2RlLmpzICd1dGlsJyBtb2R1bGVcbiAgbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpbmhlcml0cyhjdG9yLCBzdXBlckN0b3IpIHtcbiAgICBjdG9yLnN1cGVyXyA9IHN1cGVyQ3RvclxuICAgIGN0b3IucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShzdXBlckN0b3IucHJvdG90eXBlLCB7XG4gICAgICBjb25zdHJ1Y3Rvcjoge1xuICAgICAgICB2YWx1ZTogY3RvcixcbiAgICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICAgIH1cbiAgICB9KTtcbiAgfTtcbn0gZWxzZSB7XG4gIC8vIG9sZCBzY2hvb2wgc2hpbSBmb3Igb2xkIGJyb3dzZXJzXG4gIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaW5oZXJpdHMoY3Rvciwgc3VwZXJDdG9yKSB7XG4gICAgY3Rvci5zdXBlcl8gPSBzdXBlckN0b3JcbiAgICB2YXIgVGVtcEN0b3IgPSBmdW5jdGlvbiAoKSB7fVxuICAgIFRlbXBDdG9yLnByb3RvdHlwZSA9IHN1cGVyQ3Rvci5wcm90b3R5cGVcbiAgICBjdG9yLnByb3RvdHlwZSA9IG5ldyBUZW1wQ3RvcigpXG4gICAgY3Rvci5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBjdG9yXG4gIH1cbn1cbiIsIi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxuXG52YXIgcHJvY2VzcyA9IG1vZHVsZS5leHBvcnRzID0ge307XG52YXIgcXVldWUgPSBbXTtcbnZhciBkcmFpbmluZyA9IGZhbHNlO1xudmFyIGN1cnJlbnRRdWV1ZTtcbnZhciBxdWV1ZUluZGV4ID0gLTE7XG5cbmZ1bmN0aW9uIGNsZWFuVXBOZXh0VGljaygpIHtcbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIGlmIChjdXJyZW50UXVldWUubGVuZ3RoKSB7XG4gICAgICAgIHF1ZXVlID0gY3VycmVudFF1ZXVlLmNvbmNhdChxdWV1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgIH1cbiAgICBpZiAocXVldWUubGVuZ3RoKSB7XG4gICAgICAgIGRyYWluUXVldWUoKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGRyYWluUXVldWUoKSB7XG4gICAgaWYgKGRyYWluaW5nKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIHRpbWVvdXQgPSBzZXRUaW1lb3V0KGNsZWFuVXBOZXh0VGljayk7XG4gICAgZHJhaW5pbmcgPSB0cnVlO1xuXG4gICAgdmFyIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB3aGlsZShsZW4pIHtcbiAgICAgICAgY3VycmVudFF1ZXVlID0gcXVldWU7XG4gICAgICAgIHF1ZXVlID0gW107XG4gICAgICAgIHdoaWxlICgrK3F1ZXVlSW5kZXggPCBsZW4pIHtcbiAgICAgICAgICAgIGN1cnJlbnRRdWV1ZVtxdWV1ZUluZGV4XS5ydW4oKTtcbiAgICAgICAgfVxuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgICAgIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB9XG4gICAgY3VycmVudFF1ZXVlID0gbnVsbDtcbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KTtcbn1cblxucHJvY2Vzcy5uZXh0VGljayA9IGZ1bmN0aW9uIChmdW4pIHtcbiAgICB2YXIgYXJncyA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoIC0gMSk7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBxdWV1ZS5wdXNoKG5ldyBJdGVtKGZ1biwgYXJncykpO1xuICAgIGlmIChxdWV1ZS5sZW5ndGggPT09IDEgJiYgIWRyYWluaW5nKSB7XG4gICAgICAgIHNldFRpbWVvdXQoZHJhaW5RdWV1ZSwgMCk7XG4gICAgfVxufTtcblxuLy8gdjggbGlrZXMgcHJlZGljdGlibGUgb2JqZWN0c1xuZnVuY3Rpb24gSXRlbShmdW4sIGFycmF5KSB7XG4gICAgdGhpcy5mdW4gPSBmdW47XG4gICAgdGhpcy5hcnJheSA9IGFycmF5O1xufVxuSXRlbS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZnVuLmFwcGx5KG51bGwsIHRoaXMuYXJyYXkpO1xufTtcbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xucHJvY2Vzcy52ZXJzaW9uID0gJyc7IC8vIGVtcHR5IHN0cmluZyB0byBhdm9pZCByZWdleHAgaXNzdWVzXG5wcm9jZXNzLnZlcnNpb25zID0ge307XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5wcm9jZXNzLm9uID0gbm9vcDtcbnByb2Nlc3MuYWRkTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5vbmNlID0gbm9vcDtcbnByb2Nlc3Mub2ZmID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBub29wO1xucHJvY2Vzcy5lbWl0ID0gbm9vcDtcblxucHJvY2Vzcy5iaW5kaW5nID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuYmluZGluZyBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuXG4vLyBUT0RPKHNodHlsbWFuKVxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5wcm9jZXNzLnVtYXNrID0gZnVuY3Rpb24oKSB7IHJldHVybiAwOyB9O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpc0J1ZmZlcihhcmcpIHtcbiAgcmV0dXJuIGFyZyAmJiB0eXBlb2YgYXJnID09PSAnb2JqZWN0J1xuICAgICYmIHR5cGVvZiBhcmcuY29weSA9PT0gJ2Z1bmN0aW9uJ1xuICAgICYmIHR5cGVvZiBhcmcuZmlsbCA9PT0gJ2Z1bmN0aW9uJ1xuICAgICYmIHR5cGVvZiBhcmcucmVhZFVJbnQ4ID09PSAnZnVuY3Rpb24nO1xufSIsIi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG52YXIgZm9ybWF0UmVnRXhwID0gLyVbc2RqJV0vZztcbmV4cG9ydHMuZm9ybWF0ID0gZnVuY3Rpb24oZikge1xuICBpZiAoIWlzU3RyaW5nKGYpKSB7XG4gICAgdmFyIG9iamVjdHMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgb2JqZWN0cy5wdXNoKGluc3BlY3QoYXJndW1lbnRzW2ldKSk7XG4gICAgfVxuICAgIHJldHVybiBvYmplY3RzLmpvaW4oJyAnKTtcbiAgfVxuXG4gIHZhciBpID0gMTtcbiAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XG4gIHZhciBsZW4gPSBhcmdzLmxlbmd0aDtcbiAgdmFyIHN0ciA9IFN0cmluZyhmKS5yZXBsYWNlKGZvcm1hdFJlZ0V4cCwgZnVuY3Rpb24oeCkge1xuICAgIGlmICh4ID09PSAnJSUnKSByZXR1cm4gJyUnO1xuICAgIGlmIChpID49IGxlbikgcmV0dXJuIHg7XG4gICAgc3dpdGNoICh4KSB7XG4gICAgICBjYXNlICclcyc6IHJldHVybiBTdHJpbmcoYXJnc1tpKytdKTtcbiAgICAgIGNhc2UgJyVkJzogcmV0dXJuIE51bWJlcihhcmdzW2krK10pO1xuICAgICAgY2FzZSAnJWonOlxuICAgICAgICB0cnkge1xuICAgICAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShhcmdzW2krK10pO1xuICAgICAgICB9IGNhdGNoIChfKSB7XG4gICAgICAgICAgcmV0dXJuICdbQ2lyY3VsYXJdJztcbiAgICAgICAgfVxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIHg7XG4gICAgfVxuICB9KTtcbiAgZm9yICh2YXIgeCA9IGFyZ3NbaV07IGkgPCBsZW47IHggPSBhcmdzWysraV0pIHtcbiAgICBpZiAoaXNOdWxsKHgpIHx8ICFpc09iamVjdCh4KSkge1xuICAgICAgc3RyICs9ICcgJyArIHg7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciArPSAnICcgKyBpbnNwZWN0KHgpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gc3RyO1xufTtcblxuXG4vLyBNYXJrIHRoYXQgYSBtZXRob2Qgc2hvdWxkIG5vdCBiZSB1c2VkLlxuLy8gUmV0dXJucyBhIG1vZGlmaWVkIGZ1bmN0aW9uIHdoaWNoIHdhcm5zIG9uY2UgYnkgZGVmYXVsdC5cbi8vIElmIC0tbm8tZGVwcmVjYXRpb24gaXMgc2V0LCB0aGVuIGl0IGlzIGEgbm8tb3AuXG5leHBvcnRzLmRlcHJlY2F0ZSA9IGZ1bmN0aW9uKGZuLCBtc2cpIHtcbiAgLy8gQWxsb3cgZm9yIGRlcHJlY2F0aW5nIHRoaW5ncyBpbiB0aGUgcHJvY2VzcyBvZiBzdGFydGluZyB1cC5cbiAgaWYgKGlzVW5kZWZpbmVkKGdsb2JhbC5wcm9jZXNzKSkge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBleHBvcnRzLmRlcHJlY2F0ZShmbiwgbXNnKS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH07XG4gIH1cblxuICBpZiAocHJvY2Vzcy5ub0RlcHJlY2F0aW9uID09PSB0cnVlKSB7XG4gICAgcmV0dXJuIGZuO1xuICB9XG5cbiAgdmFyIHdhcm5lZCA9IGZhbHNlO1xuICBmdW5jdGlvbiBkZXByZWNhdGVkKCkge1xuICAgIGlmICghd2FybmVkKSB7XG4gICAgICBpZiAocHJvY2Vzcy50aHJvd0RlcHJlY2F0aW9uKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihtc2cpO1xuICAgICAgfSBlbHNlIGlmIChwcm9jZXNzLnRyYWNlRGVwcmVjYXRpb24pIHtcbiAgICAgICAgY29uc29sZS50cmFjZShtc2cpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihtc2cpO1xuICAgICAgfVxuICAgICAgd2FybmVkID0gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gIH1cblxuICByZXR1cm4gZGVwcmVjYXRlZDtcbn07XG5cblxudmFyIGRlYnVncyA9IHt9O1xudmFyIGRlYnVnRW52aXJvbjtcbmV4cG9ydHMuZGVidWdsb2cgPSBmdW5jdGlvbihzZXQpIHtcbiAgaWYgKGlzVW5kZWZpbmVkKGRlYnVnRW52aXJvbikpXG4gICAgZGVidWdFbnZpcm9uID0gcHJvY2Vzcy5lbnYuTk9ERV9ERUJVRyB8fCAnJztcbiAgc2V0ID0gc2V0LnRvVXBwZXJDYXNlKCk7XG4gIGlmICghZGVidWdzW3NldF0pIHtcbiAgICBpZiAobmV3IFJlZ0V4cCgnXFxcXGInICsgc2V0ICsgJ1xcXFxiJywgJ2knKS50ZXN0KGRlYnVnRW52aXJvbikpIHtcbiAgICAgIHZhciBwaWQgPSBwcm9jZXNzLnBpZDtcbiAgICAgIGRlYnVnc1tzZXRdID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBtc2cgPSBleHBvcnRzLmZvcm1hdC5hcHBseShleHBvcnRzLCBhcmd1bWVudHMpO1xuICAgICAgICBjb25zb2xlLmVycm9yKCclcyAlZDogJXMnLCBzZXQsIHBpZCwgbXNnKTtcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIGRlYnVnc1tzZXRdID0gZnVuY3Rpb24oKSB7fTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGRlYnVnc1tzZXRdO1xufTtcblxuXG4vKipcbiAqIEVjaG9zIHRoZSB2YWx1ZSBvZiBhIHZhbHVlLiBUcnlzIHRvIHByaW50IHRoZSB2YWx1ZSBvdXRcbiAqIGluIHRoZSBiZXN0IHdheSBwb3NzaWJsZSBnaXZlbiB0aGUgZGlmZmVyZW50IHR5cGVzLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmogVGhlIG9iamVjdCB0byBwcmludCBvdXQuXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0cyBPcHRpb25hbCBvcHRpb25zIG9iamVjdCB0aGF0IGFsdGVycyB0aGUgb3V0cHV0LlxuICovXG4vKiBsZWdhY3k6IG9iaiwgc2hvd0hpZGRlbiwgZGVwdGgsIGNvbG9ycyovXG5mdW5jdGlvbiBpbnNwZWN0KG9iaiwgb3B0cykge1xuICAvLyBkZWZhdWx0IG9wdGlvbnNcbiAgdmFyIGN0eCA9IHtcbiAgICBzZWVuOiBbXSxcbiAgICBzdHlsaXplOiBzdHlsaXplTm9Db2xvclxuICB9O1xuICAvLyBsZWdhY3kuLi5cbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPj0gMykgY3R4LmRlcHRoID0gYXJndW1lbnRzWzJdO1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+PSA0KSBjdHguY29sb3JzID0gYXJndW1lbnRzWzNdO1xuICBpZiAoaXNCb29sZWFuKG9wdHMpKSB7XG4gICAgLy8gbGVnYWN5Li4uXG4gICAgY3R4LnNob3dIaWRkZW4gPSBvcHRzO1xuICB9IGVsc2UgaWYgKG9wdHMpIHtcbiAgICAvLyBnb3QgYW4gXCJvcHRpb25zXCIgb2JqZWN0XG4gICAgZXhwb3J0cy5fZXh0ZW5kKGN0eCwgb3B0cyk7XG4gIH1cbiAgLy8gc2V0IGRlZmF1bHQgb3B0aW9uc1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LnNob3dIaWRkZW4pKSBjdHguc2hvd0hpZGRlbiA9IGZhbHNlO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmRlcHRoKSkgY3R4LmRlcHRoID0gMjtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5jb2xvcnMpKSBjdHguY29sb3JzID0gZmFsc2U7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguY3VzdG9tSW5zcGVjdCkpIGN0eC5jdXN0b21JbnNwZWN0ID0gdHJ1ZTtcbiAgaWYgKGN0eC5jb2xvcnMpIGN0eC5zdHlsaXplID0gc3R5bGl6ZVdpdGhDb2xvcjtcbiAgcmV0dXJuIGZvcm1hdFZhbHVlKGN0eCwgb2JqLCBjdHguZGVwdGgpO1xufVxuZXhwb3J0cy5pbnNwZWN0ID0gaW5zcGVjdDtcblxuXG4vLyBodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0FOU0lfZXNjYXBlX2NvZGUjZ3JhcGhpY3Ncbmluc3BlY3QuY29sb3JzID0ge1xuICAnYm9sZCcgOiBbMSwgMjJdLFxuICAnaXRhbGljJyA6IFszLCAyM10sXG4gICd1bmRlcmxpbmUnIDogWzQsIDI0XSxcbiAgJ2ludmVyc2UnIDogWzcsIDI3XSxcbiAgJ3doaXRlJyA6IFszNywgMzldLFxuICAnZ3JleScgOiBbOTAsIDM5XSxcbiAgJ2JsYWNrJyA6IFszMCwgMzldLFxuICAnYmx1ZScgOiBbMzQsIDM5XSxcbiAgJ2N5YW4nIDogWzM2LCAzOV0sXG4gICdncmVlbicgOiBbMzIsIDM5XSxcbiAgJ21hZ2VudGEnIDogWzM1LCAzOV0sXG4gICdyZWQnIDogWzMxLCAzOV0sXG4gICd5ZWxsb3cnIDogWzMzLCAzOV1cbn07XG5cbi8vIERvbid0IHVzZSAnYmx1ZScgbm90IHZpc2libGUgb24gY21kLmV4ZVxuaW5zcGVjdC5zdHlsZXMgPSB7XG4gICdzcGVjaWFsJzogJ2N5YW4nLFxuICAnbnVtYmVyJzogJ3llbGxvdycsXG4gICdib29sZWFuJzogJ3llbGxvdycsXG4gICd1bmRlZmluZWQnOiAnZ3JleScsXG4gICdudWxsJzogJ2JvbGQnLFxuICAnc3RyaW5nJzogJ2dyZWVuJyxcbiAgJ2RhdGUnOiAnbWFnZW50YScsXG4gIC8vIFwibmFtZVwiOiBpbnRlbnRpb25hbGx5IG5vdCBzdHlsaW5nXG4gICdyZWdleHAnOiAncmVkJ1xufTtcblxuXG5mdW5jdGlvbiBzdHlsaXplV2l0aENvbG9yKHN0ciwgc3R5bGVUeXBlKSB7XG4gIHZhciBzdHlsZSA9IGluc3BlY3Quc3R5bGVzW3N0eWxlVHlwZV07XG5cbiAgaWYgKHN0eWxlKSB7XG4gICAgcmV0dXJuICdcXHUwMDFiWycgKyBpbnNwZWN0LmNvbG9yc1tzdHlsZV1bMF0gKyAnbScgKyBzdHIgK1xuICAgICAgICAgICAnXFx1MDAxYlsnICsgaW5zcGVjdC5jb2xvcnNbc3R5bGVdWzFdICsgJ20nO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBzdHI7XG4gIH1cbn1cblxuXG5mdW5jdGlvbiBzdHlsaXplTm9Db2xvcihzdHIsIHN0eWxlVHlwZSkge1xuICByZXR1cm4gc3RyO1xufVxuXG5cbmZ1bmN0aW9uIGFycmF5VG9IYXNoKGFycmF5KSB7XG4gIHZhciBoYXNoID0ge307XG5cbiAgYXJyYXkuZm9yRWFjaChmdW5jdGlvbih2YWwsIGlkeCkge1xuICAgIGhhc2hbdmFsXSA9IHRydWU7XG4gIH0pO1xuXG4gIHJldHVybiBoYXNoO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFZhbHVlKGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcykge1xuICAvLyBQcm92aWRlIGEgaG9vayBmb3IgdXNlci1zcGVjaWZpZWQgaW5zcGVjdCBmdW5jdGlvbnMuXG4gIC8vIENoZWNrIHRoYXQgdmFsdWUgaXMgYW4gb2JqZWN0IHdpdGggYW4gaW5zcGVjdCBmdW5jdGlvbiBvbiBpdFxuICBpZiAoY3R4LmN1c3RvbUluc3BlY3QgJiZcbiAgICAgIHZhbHVlICYmXG4gICAgICBpc0Z1bmN0aW9uKHZhbHVlLmluc3BlY3QpICYmXG4gICAgICAvLyBGaWx0ZXIgb3V0IHRoZSB1dGlsIG1vZHVsZSwgaXQncyBpbnNwZWN0IGZ1bmN0aW9uIGlzIHNwZWNpYWxcbiAgICAgIHZhbHVlLmluc3BlY3QgIT09IGV4cG9ydHMuaW5zcGVjdCAmJlxuICAgICAgLy8gQWxzbyBmaWx0ZXIgb3V0IGFueSBwcm90b3R5cGUgb2JqZWN0cyB1c2luZyB0aGUgY2lyY3VsYXIgY2hlY2suXG4gICAgICAhKHZhbHVlLmNvbnN0cnVjdG9yICYmIHZhbHVlLmNvbnN0cnVjdG9yLnByb3RvdHlwZSA9PT0gdmFsdWUpKSB7XG4gICAgdmFyIHJldCA9IHZhbHVlLmluc3BlY3QocmVjdXJzZVRpbWVzLCBjdHgpO1xuICAgIGlmICghaXNTdHJpbmcocmV0KSkge1xuICAgICAgcmV0ID0gZm9ybWF0VmFsdWUoY3R4LCByZXQsIHJlY3Vyc2VUaW1lcyk7XG4gICAgfVxuICAgIHJldHVybiByZXQ7XG4gIH1cblxuICAvLyBQcmltaXRpdmUgdHlwZXMgY2Fubm90IGhhdmUgcHJvcGVydGllc1xuICB2YXIgcHJpbWl0aXZlID0gZm9ybWF0UHJpbWl0aXZlKGN0eCwgdmFsdWUpO1xuICBpZiAocHJpbWl0aXZlKSB7XG4gICAgcmV0dXJuIHByaW1pdGl2ZTtcbiAgfVxuXG4gIC8vIExvb2sgdXAgdGhlIGtleXMgb2YgdGhlIG9iamVjdC5cbiAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyh2YWx1ZSk7XG4gIHZhciB2aXNpYmxlS2V5cyA9IGFycmF5VG9IYXNoKGtleXMpO1xuXG4gIGlmIChjdHguc2hvd0hpZGRlbikge1xuICAgIGtleXMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyh2YWx1ZSk7XG4gIH1cblxuICAvLyBJRSBkb2Vzbid0IG1ha2UgZXJyb3IgZmllbGRzIG5vbi1lbnVtZXJhYmxlXG4gIC8vIGh0dHA6Ly9tc2RuLm1pY3Jvc29mdC5jb20vZW4tdXMvbGlicmFyeS9pZS9kd3c1MnNidCh2PXZzLjk0KS5hc3B4XG4gIGlmIChpc0Vycm9yKHZhbHVlKVxuICAgICAgJiYgKGtleXMuaW5kZXhPZignbWVzc2FnZScpID49IDAgfHwga2V5cy5pbmRleE9mKCdkZXNjcmlwdGlvbicpID49IDApKSB7XG4gICAgcmV0dXJuIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgfVxuXG4gIC8vIFNvbWUgdHlwZSBvZiBvYmplY3Qgd2l0aG91dCBwcm9wZXJ0aWVzIGNhbiBiZSBzaG9ydGN1dHRlZC5cbiAgaWYgKGtleXMubGVuZ3RoID09PSAwKSB7XG4gICAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgICB2YXIgbmFtZSA9IHZhbHVlLm5hbWUgPyAnOiAnICsgdmFsdWUubmFtZSA6ICcnO1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKCdbRnVuY3Rpb24nICsgbmFtZSArICddJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gICAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKFJlZ0V4cC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdyZWdleHAnKTtcbiAgICB9XG4gICAgaWYgKGlzRGF0ZSh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShEYXRlLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ2RhdGUnKTtcbiAgICB9XG4gICAgaWYgKGlzRXJyb3IodmFsdWUpKSB7XG4gICAgICByZXR1cm4gZm9ybWF0RXJyb3IodmFsdWUpO1xuICAgIH1cbiAgfVxuXG4gIHZhciBiYXNlID0gJycsIGFycmF5ID0gZmFsc2UsIGJyYWNlcyA9IFsneycsICd9J107XG5cbiAgLy8gTWFrZSBBcnJheSBzYXkgdGhhdCB0aGV5IGFyZSBBcnJheVxuICBpZiAoaXNBcnJheSh2YWx1ZSkpIHtcbiAgICBhcnJheSA9IHRydWU7XG4gICAgYnJhY2VzID0gWydbJywgJ10nXTtcbiAgfVxuXG4gIC8vIE1ha2UgZnVuY3Rpb25zIHNheSB0aGF0IHRoZXkgYXJlIGZ1bmN0aW9uc1xuICBpZiAoaXNGdW5jdGlvbih2YWx1ZSkpIHtcbiAgICB2YXIgbiA9IHZhbHVlLm5hbWUgPyAnOiAnICsgdmFsdWUubmFtZSA6ICcnO1xuICAgIGJhc2UgPSAnIFtGdW5jdGlvbicgKyBuICsgJ10nO1xuICB9XG5cbiAgLy8gTWFrZSBSZWdFeHBzIHNheSB0aGF0IHRoZXkgYXJlIFJlZ0V4cHNcbiAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpO1xuICB9XG5cbiAgLy8gTWFrZSBkYXRlcyB3aXRoIHByb3BlcnRpZXMgZmlyc3Qgc2F5IHRoZSBkYXRlXG4gIGlmIChpc0RhdGUodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIERhdGUucHJvdG90eXBlLnRvVVRDU3RyaW5nLmNhbGwodmFsdWUpO1xuICB9XG5cbiAgLy8gTWFrZSBlcnJvciB3aXRoIG1lc3NhZ2UgZmlyc3Qgc2F5IHRoZSBlcnJvclxuICBpZiAoaXNFcnJvcih2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgZm9ybWF0RXJyb3IodmFsdWUpO1xuICB9XG5cbiAgaWYgKGtleXMubGVuZ3RoID09PSAwICYmICghYXJyYXkgfHwgdmFsdWUubGVuZ3RoID09IDApKSB7XG4gICAgcmV0dXJuIGJyYWNlc1swXSArIGJhc2UgKyBicmFjZXNbMV07XG4gIH1cblxuICBpZiAocmVjdXJzZVRpbWVzIDwgMCkge1xuICAgIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAncmVnZXhwJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZSgnW09iamVjdF0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuXG4gIGN0eC5zZWVuLnB1c2godmFsdWUpO1xuXG4gIHZhciBvdXRwdXQ7XG4gIGlmIChhcnJheSkge1xuICAgIG91dHB1dCA9IGZvcm1hdEFycmF5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleXMpO1xuICB9IGVsc2Uge1xuICAgIG91dHB1dCA9IGtleXMubWFwKGZ1bmN0aW9uKGtleSkge1xuICAgICAgcmV0dXJuIGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleSwgYXJyYXkpO1xuICAgIH0pO1xuICB9XG5cbiAgY3R4LnNlZW4ucG9wKCk7XG5cbiAgcmV0dXJuIHJlZHVjZVRvU2luZ2xlU3RyaW5nKG91dHB1dCwgYmFzZSwgYnJhY2VzKTtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRQcmltaXRpdmUoY3R4LCB2YWx1ZSkge1xuICBpZiAoaXNVbmRlZmluZWQodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgndW5kZWZpbmVkJywgJ3VuZGVmaW5lZCcpO1xuICBpZiAoaXNTdHJpbmcodmFsdWUpKSB7XG4gICAgdmFyIHNpbXBsZSA9ICdcXCcnICsgSlNPTi5zdHJpbmdpZnkodmFsdWUpLnJlcGxhY2UoL15cInxcIiQvZywgJycpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvJy9nLCBcIlxcXFwnXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxcXFwiL2csICdcIicpICsgJ1xcJyc7XG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKHNpbXBsZSwgJ3N0cmluZycpO1xuICB9XG4gIGlmIChpc051bWJlcih2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCcnICsgdmFsdWUsICdudW1iZXInKTtcbiAgaWYgKGlzQm9vbGVhbih2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCcnICsgdmFsdWUsICdib29sZWFuJyk7XG4gIC8vIEZvciBzb21lIHJlYXNvbiB0eXBlb2YgbnVsbCBpcyBcIm9iamVjdFwiLCBzbyBzcGVjaWFsIGNhc2UgaGVyZS5cbiAgaWYgKGlzTnVsbCh2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCdudWxsJywgJ251bGwnKTtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRFcnJvcih2YWx1ZSkge1xuICByZXR1cm4gJ1snICsgRXJyb3IucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpICsgJ10nO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdEFycmF5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleXMpIHtcbiAgdmFyIG91dHB1dCA9IFtdO1xuICBmb3IgKHZhciBpID0gMCwgbCA9IHZhbHVlLmxlbmd0aDsgaSA8IGw7ICsraSkge1xuICAgIGlmIChoYXNPd25Qcm9wZXJ0eSh2YWx1ZSwgU3RyaW5nKGkpKSkge1xuICAgICAgb3V0cHV0LnB1c2goZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cyxcbiAgICAgICAgICBTdHJpbmcoaSksIHRydWUpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgb3V0cHV0LnB1c2goJycpO1xuICAgIH1cbiAgfVxuICBrZXlzLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XG4gICAgaWYgKCFrZXkubWF0Y2goL15cXGQrJC8pKSB7XG4gICAgICBvdXRwdXQucHVzaChmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLFxuICAgICAgICAgIGtleSwgdHJ1ZSkpO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiBvdXRwdXQ7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5LCBhcnJheSkge1xuICB2YXIgbmFtZSwgc3RyLCBkZXNjO1xuICBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcih2YWx1ZSwga2V5KSB8fCB7IHZhbHVlOiB2YWx1ZVtrZXldIH07XG4gIGlmIChkZXNjLmdldCkge1xuICAgIGlmIChkZXNjLnNldCkge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tHZXR0ZXIvU2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbR2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGlmIChkZXNjLnNldCkge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tTZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cbiAgaWYgKCFoYXNPd25Qcm9wZXJ0eSh2aXNpYmxlS2V5cywga2V5KSkge1xuICAgIG5hbWUgPSAnWycgKyBrZXkgKyAnXSc7XG4gIH1cbiAgaWYgKCFzdHIpIHtcbiAgICBpZiAoY3R4LnNlZW4uaW5kZXhPZihkZXNjLnZhbHVlKSA8IDApIHtcbiAgICAgIGlmIChpc051bGwocmVjdXJzZVRpbWVzKSkge1xuICAgICAgICBzdHIgPSBmb3JtYXRWYWx1ZShjdHgsIGRlc2MudmFsdWUsIG51bGwpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3RyID0gZm9ybWF0VmFsdWUoY3R4LCBkZXNjLnZhbHVlLCByZWN1cnNlVGltZXMgLSAxKTtcbiAgICAgIH1cbiAgICAgIGlmIChzdHIuaW5kZXhPZignXFxuJykgPiAtMSkge1xuICAgICAgICBpZiAoYXJyYXkpIHtcbiAgICAgICAgICBzdHIgPSBzdHIuc3BsaXQoJ1xcbicpLm1hcChmdW5jdGlvbihsaW5lKSB7XG4gICAgICAgICAgICByZXR1cm4gJyAgJyArIGxpbmU7XG4gICAgICAgICAgfSkuam9pbignXFxuJykuc3Vic3RyKDIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHN0ciA9ICdcXG4nICsgc3RyLnNwbGl0KCdcXG4nKS5tYXAoZnVuY3Rpb24obGluZSkge1xuICAgICAgICAgICAgcmV0dXJuICcgICAnICsgbGluZTtcbiAgICAgICAgICB9KS5qb2luKCdcXG4nKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0NpcmN1bGFyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG4gIGlmIChpc1VuZGVmaW5lZChuYW1lKSkge1xuICAgIGlmIChhcnJheSAmJiBrZXkubWF0Y2goL15cXGQrJC8pKSB7XG4gICAgICByZXR1cm4gc3RyO1xuICAgIH1cbiAgICBuYW1lID0gSlNPTi5zdHJpbmdpZnkoJycgKyBrZXkpO1xuICAgIGlmIChuYW1lLm1hdGNoKC9eXCIoW2EtekEtWl9dW2EtekEtWl8wLTldKilcIiQvKSkge1xuICAgICAgbmFtZSA9IG5hbWUuc3Vic3RyKDEsIG5hbWUubGVuZ3RoIC0gMik7XG4gICAgICBuYW1lID0gY3R4LnN0eWxpemUobmFtZSwgJ25hbWUnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmFtZSA9IG5hbWUucmVwbGFjZSgvJy9nLCBcIlxcXFwnXCIpXG4gICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXFxcXCIvZywgJ1wiJylcbiAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLyheXCJ8XCIkKS9nLCBcIidcIik7XG4gICAgICBuYW1lID0gY3R4LnN0eWxpemUobmFtZSwgJ3N0cmluZycpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBuYW1lICsgJzogJyArIHN0cjtcbn1cblxuXG5mdW5jdGlvbiByZWR1Y2VUb1NpbmdsZVN0cmluZyhvdXRwdXQsIGJhc2UsIGJyYWNlcykge1xuICB2YXIgbnVtTGluZXNFc3QgPSAwO1xuICB2YXIgbGVuZ3RoID0gb3V0cHV0LnJlZHVjZShmdW5jdGlvbihwcmV2LCBjdXIpIHtcbiAgICBudW1MaW5lc0VzdCsrO1xuICAgIGlmIChjdXIuaW5kZXhPZignXFxuJykgPj0gMCkgbnVtTGluZXNFc3QrKztcbiAgICByZXR1cm4gcHJldiArIGN1ci5yZXBsYWNlKC9cXHUwMDFiXFxbXFxkXFxkP20vZywgJycpLmxlbmd0aCArIDE7XG4gIH0sIDApO1xuXG4gIGlmIChsZW5ndGggPiA2MCkge1xuICAgIHJldHVybiBicmFjZXNbMF0gK1xuICAgICAgICAgICAoYmFzZSA9PT0gJycgPyAnJyA6IGJhc2UgKyAnXFxuICcpICtcbiAgICAgICAgICAgJyAnICtcbiAgICAgICAgICAgb3V0cHV0LmpvaW4oJyxcXG4gICcpICtcbiAgICAgICAgICAgJyAnICtcbiAgICAgICAgICAgYnJhY2VzWzFdO1xuICB9XG5cbiAgcmV0dXJuIGJyYWNlc1swXSArIGJhc2UgKyAnICcgKyBvdXRwdXQuam9pbignLCAnKSArICcgJyArIGJyYWNlc1sxXTtcbn1cblxuXG4vLyBOT1RFOiBUaGVzZSB0eXBlIGNoZWNraW5nIGZ1bmN0aW9ucyBpbnRlbnRpb25hbGx5IGRvbid0IHVzZSBgaW5zdGFuY2VvZmBcbi8vIGJlY2F1c2UgaXQgaXMgZnJhZ2lsZSBhbmQgY2FuIGJlIGVhc2lseSBmYWtlZCB3aXRoIGBPYmplY3QuY3JlYXRlKClgLlxuZnVuY3Rpb24gaXNBcnJheShhcikge1xuICByZXR1cm4gQXJyYXkuaXNBcnJheShhcik7XG59XG5leHBvcnRzLmlzQXJyYXkgPSBpc0FycmF5O1xuXG5mdW5jdGlvbiBpc0Jvb2xlYW4oYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnYm9vbGVhbic7XG59XG5leHBvcnRzLmlzQm9vbGVhbiA9IGlzQm9vbGVhbjtcblxuZnVuY3Rpb24gaXNOdWxsKGFyZykge1xuICByZXR1cm4gYXJnID09PSBudWxsO1xufVxuZXhwb3J0cy5pc051bGwgPSBpc051bGw7XG5cbmZ1bmN0aW9uIGlzTnVsbE9yVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09IG51bGw7XG59XG5leHBvcnRzLmlzTnVsbE9yVW5kZWZpbmVkID0gaXNOdWxsT3JVbmRlZmluZWQ7XG5cbmZ1bmN0aW9uIGlzTnVtYmVyKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ251bWJlcic7XG59XG5leHBvcnRzLmlzTnVtYmVyID0gaXNOdW1iZXI7XG5cbmZ1bmN0aW9uIGlzU3RyaW5nKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ3N0cmluZyc7XG59XG5leHBvcnRzLmlzU3RyaW5nID0gaXNTdHJpbmc7XG5cbmZ1bmN0aW9uIGlzU3ltYm9sKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ3N5bWJvbCc7XG59XG5leHBvcnRzLmlzU3ltYm9sID0gaXNTeW1ib2w7XG5cbmZ1bmN0aW9uIGlzVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09PSB2b2lkIDA7XG59XG5leHBvcnRzLmlzVW5kZWZpbmVkID0gaXNVbmRlZmluZWQ7XG5cbmZ1bmN0aW9uIGlzUmVnRXhwKHJlKSB7XG4gIHJldHVybiBpc09iamVjdChyZSkgJiYgb2JqZWN0VG9TdHJpbmcocmUpID09PSAnW29iamVjdCBSZWdFeHBdJztcbn1cbmV4cG9ydHMuaXNSZWdFeHAgPSBpc1JlZ0V4cDtcblxuZnVuY3Rpb24gaXNPYmplY3QoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnb2JqZWN0JyAmJiBhcmcgIT09IG51bGw7XG59XG5leHBvcnRzLmlzT2JqZWN0ID0gaXNPYmplY3Q7XG5cbmZ1bmN0aW9uIGlzRGF0ZShkKSB7XG4gIHJldHVybiBpc09iamVjdChkKSAmJiBvYmplY3RUb1N0cmluZyhkKSA9PT0gJ1tvYmplY3QgRGF0ZV0nO1xufVxuZXhwb3J0cy5pc0RhdGUgPSBpc0RhdGU7XG5cbmZ1bmN0aW9uIGlzRXJyb3IoZSkge1xuICByZXR1cm4gaXNPYmplY3QoZSkgJiZcbiAgICAgIChvYmplY3RUb1N0cmluZyhlKSA9PT0gJ1tvYmplY3QgRXJyb3JdJyB8fCBlIGluc3RhbmNlb2YgRXJyb3IpO1xufVxuZXhwb3J0cy5pc0Vycm9yID0gaXNFcnJvcjtcblxuZnVuY3Rpb24gaXNGdW5jdGlvbihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdmdW5jdGlvbic7XG59XG5leHBvcnRzLmlzRnVuY3Rpb24gPSBpc0Z1bmN0aW9uO1xuXG5mdW5jdGlvbiBpc1ByaW1pdGl2ZShhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gbnVsbCB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ2Jvb2xlYW4nIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnbnVtYmVyJyB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ3N0cmluZycgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdzeW1ib2wnIHx8ICAvLyBFUzYgc3ltYm9sXG4gICAgICAgICB0eXBlb2YgYXJnID09PSAndW5kZWZpbmVkJztcbn1cbmV4cG9ydHMuaXNQcmltaXRpdmUgPSBpc1ByaW1pdGl2ZTtcblxuZXhwb3J0cy5pc0J1ZmZlciA9IHJlcXVpcmUoJy4vc3VwcG9ydC9pc0J1ZmZlcicpO1xuXG5mdW5jdGlvbiBvYmplY3RUb1N0cmluZyhvKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwobyk7XG59XG5cblxuZnVuY3Rpb24gcGFkKG4pIHtcbiAgcmV0dXJuIG4gPCAxMCA/ICcwJyArIG4udG9TdHJpbmcoMTApIDogbi50b1N0cmluZygxMCk7XG59XG5cblxudmFyIG1vbnRocyA9IFsnSmFuJywgJ0ZlYicsICdNYXInLCAnQXByJywgJ01heScsICdKdW4nLCAnSnVsJywgJ0F1ZycsICdTZXAnLFxuICAgICAgICAgICAgICAnT2N0JywgJ05vdicsICdEZWMnXTtcblxuLy8gMjYgRmViIDE2OjE5OjM0XG5mdW5jdGlvbiB0aW1lc3RhbXAoKSB7XG4gIHZhciBkID0gbmV3IERhdGUoKTtcbiAgdmFyIHRpbWUgPSBbcGFkKGQuZ2V0SG91cnMoKSksXG4gICAgICAgICAgICAgIHBhZChkLmdldE1pbnV0ZXMoKSksXG4gICAgICAgICAgICAgIHBhZChkLmdldFNlY29uZHMoKSldLmpvaW4oJzonKTtcbiAgcmV0dXJuIFtkLmdldERhdGUoKSwgbW9udGhzW2QuZ2V0TW9udGgoKV0sIHRpbWVdLmpvaW4oJyAnKTtcbn1cblxuXG4vLyBsb2cgaXMganVzdCBhIHRoaW4gd3JhcHBlciB0byBjb25zb2xlLmxvZyB0aGF0IHByZXBlbmRzIGEgdGltZXN0YW1wXG5leHBvcnRzLmxvZyA9IGZ1bmN0aW9uKCkge1xuICBjb25zb2xlLmxvZygnJXMgLSAlcycsIHRpbWVzdGFtcCgpLCBleHBvcnRzLmZvcm1hdC5hcHBseShleHBvcnRzLCBhcmd1bWVudHMpKTtcbn07XG5cblxuLyoqXG4gKiBJbmhlcml0IHRoZSBwcm90b3R5cGUgbWV0aG9kcyBmcm9tIG9uZSBjb25zdHJ1Y3RvciBpbnRvIGFub3RoZXIuXG4gKlxuICogVGhlIEZ1bmN0aW9uLnByb3RvdHlwZS5pbmhlcml0cyBmcm9tIGxhbmcuanMgcmV3cml0dGVuIGFzIGEgc3RhbmRhbG9uZVxuICogZnVuY3Rpb24gKG5vdCBvbiBGdW5jdGlvbi5wcm90b3R5cGUpLiBOT1RFOiBJZiB0aGlzIGZpbGUgaXMgdG8gYmUgbG9hZGVkXG4gKiBkdXJpbmcgYm9vdHN0cmFwcGluZyB0aGlzIGZ1bmN0aW9uIG5lZWRzIHRvIGJlIHJld3JpdHRlbiB1c2luZyBzb21lIG5hdGl2ZVxuICogZnVuY3Rpb25zIGFzIHByb3RvdHlwZSBzZXR1cCB1c2luZyBub3JtYWwgSmF2YVNjcmlwdCBkb2VzIG5vdCB3b3JrIGFzXG4gKiBleHBlY3RlZCBkdXJpbmcgYm9vdHN0cmFwcGluZyAoc2VlIG1pcnJvci5qcyBpbiByMTE0OTAzKS5cbiAqXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBjdG9yIENvbnN0cnVjdG9yIGZ1bmN0aW9uIHdoaWNoIG5lZWRzIHRvIGluaGVyaXQgdGhlXG4gKiAgICAgcHJvdG90eXBlLlxuICogQHBhcmFtIHtmdW5jdGlvbn0gc3VwZXJDdG9yIENvbnN0cnVjdG9yIGZ1bmN0aW9uIHRvIGluaGVyaXQgcHJvdG90eXBlIGZyb20uXG4gKi9cbmV4cG9ydHMuaW5oZXJpdHMgPSByZXF1aXJlKCdpbmhlcml0cycpO1xuXG5leHBvcnRzLl9leHRlbmQgPSBmdW5jdGlvbihvcmlnaW4sIGFkZCkge1xuICAvLyBEb24ndCBkbyBhbnl0aGluZyBpZiBhZGQgaXNuJ3QgYW4gb2JqZWN0XG4gIGlmICghYWRkIHx8ICFpc09iamVjdChhZGQpKSByZXR1cm4gb3JpZ2luO1xuXG4gIHZhciBrZXlzID0gT2JqZWN0LmtleXMoYWRkKTtcbiAgdmFyIGkgPSBrZXlzLmxlbmd0aDtcbiAgd2hpbGUgKGktLSkge1xuICAgIG9yaWdpbltrZXlzW2ldXSA9IGFkZFtrZXlzW2ldXTtcbiAgfVxuICByZXR1cm4gb3JpZ2luO1xufTtcblxuZnVuY3Rpb24gaGFzT3duUHJvcGVydHkob2JqLCBwcm9wKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKTtcbn1cbiIsIi8vIFJlbGVhc2VkIHVuZGVyIE1JVCBsaWNlbnNlXG4vLyBDb3B5cmlnaHQgKGMpIDIwMDktMjAxMCBEb21pbmljIEJhZ2dvdHRcbi8vIENvcHlyaWdodCAoYykgMjAwOS0yMDEwIEFzaCBCZXJsaW5cbi8vIENvcHlyaWdodCAoYykgMjAxMSBDaHJpc3RvcGggRG9ybiA8Y2hyaXN0b3BoQGNocmlzdG9waGRvcm4uY29tPiAoaHR0cDovL3d3dy5jaHJpc3RvcGhkb3JuLmNvbSlcblxuLypqc2hpbnQgYnJvd3Nlcjp0cnVlLCBkZXZlbDp0cnVlICovXG5cbihmdW5jdGlvbiggZXhwb3NlICkge1xuXG4vKipcbiAqICBjbGFzcyBNYXJrZG93blxuICpcbiAqICBNYXJrZG93biBwcm9jZXNzaW5nIGluIEphdmFzY3JpcHQgZG9uZSByaWdodC4gV2UgaGF2ZSB2ZXJ5IHBhcnRpY3VsYXIgdmlld3NcbiAqICBvbiB3aGF0IGNvbnN0aXR1dGVzICdyaWdodCcgd2hpY2ggaW5jbHVkZTpcbiAqXG4gKiAgLSBwcm9kdWNlcyB3ZWxsLWZvcm1lZCBIVE1MICh0aGlzIG1lYW5zIHRoYXQgZW0gYW5kIHN0cm9uZyBuZXN0aW5nIGlzXG4gKiAgICBpbXBvcnRhbnQpXG4gKlxuICogIC0gaGFzIGFuIGludGVybWVkaWF0ZSByZXByZXNlbnRhdGlvbiB0byBhbGxvdyBwcm9jZXNzaW5nIG9mIHBhcnNlZCBkYXRhIChXZVxuICogICAgaW4gZmFjdCBoYXZlIHR3bywgYm90aCBhcyBbSnNvbk1MXTogYSBtYXJrZG93biB0cmVlIGFuZCBhbiBIVE1MIHRyZWUpLlxuICpcbiAqICAtIGlzIGVhc2lseSBleHRlbnNpYmxlIHRvIGFkZCBuZXcgZGlhbGVjdHMgd2l0aG91dCBoYXZpbmcgdG8gcmV3cml0ZSB0aGVcbiAqICAgIGVudGlyZSBwYXJzaW5nIG1lY2hhbmljc1xuICpcbiAqICAtIGhhcyBhIGdvb2QgdGVzdCBzdWl0ZVxuICpcbiAqICBUaGlzIGltcGxlbWVudGF0aW9uIGZ1bGZpbGxzIGFsbCBvZiB0aGVzZSAoZXhjZXB0IHRoYXQgdGhlIHRlc3Qgc3VpdGUgY291bGRcbiAqICBkbyB3aXRoIGV4cGFuZGluZyB0byBhdXRvbWF0aWNhbGx5IHJ1biBhbGwgdGhlIGZpeHR1cmVzIGZyb20gb3RoZXIgTWFya2Rvd25cbiAqICBpbXBsZW1lbnRhdGlvbnMuKVxuICpcbiAqICAjIyMjIyBJbnRlcm1lZGlhdGUgUmVwcmVzZW50YXRpb25cbiAqXG4gKiAgKlRPRE8qIFRhbGsgYWJvdXQgdGhpcyA6KSBJdHMgSnNvbk1MLCBidXQgZG9jdW1lbnQgdGhlIG5vZGUgbmFtZXMgd2UgdXNlLlxuICpcbiAqICBbSnNvbk1MXTogaHR0cDovL2pzb25tbC5vcmcvIFwiSlNPTiBNYXJrdXAgTGFuZ3VhZ2VcIlxuICoqL1xudmFyIE1hcmtkb3duID0gZXhwb3NlLk1hcmtkb3duID0gZnVuY3Rpb24oZGlhbGVjdCkge1xuICBzd2l0Y2ggKHR5cGVvZiBkaWFsZWN0KSB7XG4gICAgY2FzZSBcInVuZGVmaW5lZFwiOlxuICAgICAgdGhpcy5kaWFsZWN0ID0gTWFya2Rvd24uZGlhbGVjdHMuR3J1YmVyO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBcIm9iamVjdFwiOlxuICAgICAgdGhpcy5kaWFsZWN0ID0gZGlhbGVjdDtcbiAgICAgIGJyZWFrO1xuICAgIGRlZmF1bHQ6XG4gICAgICBpZiAoIGRpYWxlY3QgaW4gTWFya2Rvd24uZGlhbGVjdHMgKSB7XG4gICAgICAgIHRoaXMuZGlhbGVjdCA9IE1hcmtkb3duLmRpYWxlY3RzW2RpYWxlY3RdO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlVua25vd24gTWFya2Rvd24gZGlhbGVjdCAnXCIgKyBTdHJpbmcoZGlhbGVjdCkgKyBcIidcIik7XG4gICAgICB9XG4gICAgICBicmVhaztcbiAgfVxuICB0aGlzLmVtX3N0YXRlID0gW107XG4gIHRoaXMuc3Ryb25nX3N0YXRlID0gW107XG4gIHRoaXMuZGVidWdfaW5kZW50ID0gXCJcIjtcbn07XG5cbi8qKlxuICogIHBhcnNlKCBtYXJrZG93biwgW2RpYWxlY3RdICkgLT4gSnNvbk1MXG4gKiAgLSBtYXJrZG93biAoU3RyaW5nKTogbWFya2Rvd24gc3RyaW5nIHRvIHBhcnNlXG4gKiAgLSBkaWFsZWN0IChTdHJpbmcgfCBEaWFsZWN0KTogdGhlIGRpYWxlY3QgdG8gdXNlLCBkZWZhdWx0cyB0byBncnViZXJcbiAqXG4gKiAgUGFyc2UgYG1hcmtkb3duYCBhbmQgcmV0dXJuIGEgbWFya2Rvd24gZG9jdW1lbnQgYXMgYSBNYXJrZG93bi5Kc29uTUwgdHJlZS5cbiAqKi9cbmV4cG9zZS5wYXJzZSA9IGZ1bmN0aW9uKCBzb3VyY2UsIGRpYWxlY3QgKSB7XG4gIC8vIGRpYWxlY3Qgd2lsbCBkZWZhdWx0IGlmIHVuZGVmaW5lZFxuICB2YXIgbWQgPSBuZXcgTWFya2Rvd24oIGRpYWxlY3QgKTtcbiAgcmV0dXJuIG1kLnRvVHJlZSggc291cmNlICk7XG59O1xuXG4vKipcbiAqICB0b0hUTUwoIG1hcmtkb3duLCBbZGlhbGVjdF0gICkgLT4gU3RyaW5nXG4gKiAgdG9IVE1MKCBtZF90cmVlICkgLT4gU3RyaW5nXG4gKiAgLSBtYXJrZG93biAoU3RyaW5nKTogbWFya2Rvd24gc3RyaW5nIHRvIHBhcnNlXG4gKiAgLSBtZF90cmVlIChNYXJrZG93bi5Kc29uTUwpOiBwYXJzZWQgbWFya2Rvd24gdHJlZVxuICpcbiAqICBUYWtlIG1hcmtkb3duIChlaXRoZXIgYXMgYSBzdHJpbmcgb3IgYXMgYSBKc29uTUwgdHJlZSkgYW5kIHJ1biBpdCB0aHJvdWdoXG4gKiAgW1t0b0hUTUxUcmVlXV0gdGhlbiB0dXJuIGl0IGludG8gYSB3ZWxsLWZvcm1hdGVkIEhUTUwgZnJhZ21lbnQuXG4gKiovXG5leHBvc2UudG9IVE1MID0gZnVuY3Rpb24gdG9IVE1MKCBzb3VyY2UgLCBkaWFsZWN0ICwgb3B0aW9ucyApIHtcbiAgdmFyIGlucHV0ID0gZXhwb3NlLnRvSFRNTFRyZWUoIHNvdXJjZSAsIGRpYWxlY3QgLCBvcHRpb25zICk7XG5cbiAgcmV0dXJuIGV4cG9zZS5yZW5kZXJKc29uTUwoIGlucHV0ICk7XG59O1xuXG4vKipcbiAqICB0b0hUTUxUcmVlKCBtYXJrZG93biwgW2RpYWxlY3RdICkgLT4gSnNvbk1MXG4gKiAgdG9IVE1MVHJlZSggbWRfdHJlZSApIC0+IEpzb25NTFxuICogIC0gbWFya2Rvd24gKFN0cmluZyk6IG1hcmtkb3duIHN0cmluZyB0byBwYXJzZVxuICogIC0gZGlhbGVjdCAoU3RyaW5nIHwgRGlhbGVjdCk6IHRoZSBkaWFsZWN0IHRvIHVzZSwgZGVmYXVsdHMgdG8gZ3J1YmVyXG4gKiAgLSBtZF90cmVlIChNYXJrZG93bi5Kc29uTUwpOiBwYXJzZWQgbWFya2Rvd24gdHJlZVxuICpcbiAqICBUdXJuIG1hcmtkb3duIGludG8gSFRNTCwgcmVwcmVzZW50ZWQgYXMgYSBKc29uTUwgdHJlZS4gSWYgYSBzdHJpbmcgaXMgZ2l2ZW5cbiAqICB0byB0aGlzIGZ1bmN0aW9uLCBpdCBpcyBmaXJzdCBwYXJzZWQgaW50byBhIG1hcmtkb3duIHRyZWUgYnkgY2FsbGluZ1xuICogIFtbcGFyc2VdXS5cbiAqKi9cbmV4cG9zZS50b0hUTUxUcmVlID0gZnVuY3Rpb24gdG9IVE1MVHJlZSggaW5wdXQsIGRpYWxlY3QgLCBvcHRpb25zICkge1xuICAvLyBjb252ZXJ0IHN0cmluZyBpbnB1dCB0byBhbiBNRCB0cmVlXG4gIGlmICggdHlwZW9mIGlucHV0ID09PVwic3RyaW5nXCIgKSBpbnB1dCA9IHRoaXMucGFyc2UoIGlucHV0LCBkaWFsZWN0ICk7XG5cbiAgLy8gTm93IGNvbnZlcnQgdGhlIE1EIHRyZWUgdG8gYW4gSFRNTCB0cmVlXG5cbiAgLy8gcmVtb3ZlIHJlZmVyZW5jZXMgZnJvbSB0aGUgdHJlZVxuICB2YXIgYXR0cnMgPSBleHRyYWN0X2F0dHIoIGlucHV0ICksXG4gICAgICByZWZzID0ge307XG5cbiAgaWYgKCBhdHRycyAmJiBhdHRycy5yZWZlcmVuY2VzICkge1xuICAgIHJlZnMgPSBhdHRycy5yZWZlcmVuY2VzO1xuICB9XG5cbiAgdmFyIGh0bWwgPSBjb252ZXJ0X3RyZWVfdG9faHRtbCggaW5wdXQsIHJlZnMgLCBvcHRpb25zICk7XG4gIG1lcmdlX3RleHRfbm9kZXMoIGh0bWwgKTtcbiAgcmV0dXJuIGh0bWw7XG59O1xuXG4vLyBGb3IgU3BpZGVybW9ua2V5IGJhc2VkIGVuZ2luZXNcbmZ1bmN0aW9uIG1rX2Jsb2NrX3RvU291cmNlKCkge1xuICByZXR1cm4gXCJNYXJrZG93bi5ta19ibG9jayggXCIgK1xuICAgICAgICAgIHVuZXZhbCh0aGlzLnRvU3RyaW5nKCkpICtcbiAgICAgICAgICBcIiwgXCIgK1xuICAgICAgICAgIHVuZXZhbCh0aGlzLnRyYWlsaW5nKSArXG4gICAgICAgICAgXCIsIFwiICtcbiAgICAgICAgICB1bmV2YWwodGhpcy5saW5lTnVtYmVyKSArXG4gICAgICAgICAgXCIgKVwiO1xufVxuXG4vLyBub2RlXG5mdW5jdGlvbiBta19ibG9ja19pbnNwZWN0KCkge1xuICB2YXIgdXRpbCA9IHJlcXVpcmUoXCJ1dGlsXCIpO1xuICByZXR1cm4gXCJNYXJrZG93bi5ta19ibG9jayggXCIgK1xuICAgICAgICAgIHV0aWwuaW5zcGVjdCh0aGlzLnRvU3RyaW5nKCkpICtcbiAgICAgICAgICBcIiwgXCIgK1xuICAgICAgICAgIHV0aWwuaW5zcGVjdCh0aGlzLnRyYWlsaW5nKSArXG4gICAgICAgICAgXCIsIFwiICtcbiAgICAgICAgICB1dGlsLmluc3BlY3QodGhpcy5saW5lTnVtYmVyKSArXG4gICAgICAgICAgXCIgKVwiO1xuXG59XG5cbnZhciBta19ibG9jayA9IE1hcmtkb3duLm1rX2Jsb2NrID0gZnVuY3Rpb24oYmxvY2ssIHRyYWlsLCBsaW5lKSB7XG4gIC8vIEJlIGhlbHBmdWwgZm9yIGRlZmF1bHQgY2FzZSBpbiB0ZXN0cy5cbiAgaWYgKCBhcmd1bWVudHMubGVuZ3RoID09IDEgKSB0cmFpbCA9IFwiXFxuXFxuXCI7XG5cbiAgdmFyIHMgPSBuZXcgU3RyaW5nKGJsb2NrKTtcbiAgcy50cmFpbGluZyA9IHRyYWlsO1xuICAvLyBUbyBtYWtlIGl0IGNsZWFyIGl0cyBub3QganVzdCBhIHN0cmluZ1xuICBzLmluc3BlY3QgPSBta19ibG9ja19pbnNwZWN0O1xuICBzLnRvU291cmNlID0gbWtfYmxvY2tfdG9Tb3VyY2U7XG5cbiAgaWYgKCBsaW5lICE9IHVuZGVmaW5lZCApXG4gICAgcy5saW5lTnVtYmVyID0gbGluZTtcblxuICByZXR1cm4gcztcbn07XG5cbmZ1bmN0aW9uIGNvdW50X2xpbmVzKCBzdHIgKSB7XG4gIHZhciBuID0gMCwgaSA9IC0xO1xuICB3aGlsZSAoICggaSA9IHN0ci5pbmRleE9mKFwiXFxuXCIsIGkgKyAxKSApICE9PSAtMSApIG4rKztcbiAgcmV0dXJuIG47XG59XG5cbi8vIEludGVybmFsIC0gc3BsaXQgc291cmNlIGludG8gcm91Z2ggYmxvY2tzXG5NYXJrZG93bi5wcm90b3R5cGUuc3BsaXRfYmxvY2tzID0gZnVuY3Rpb24gc3BsaXRCbG9ja3MoIGlucHV0LCBzdGFydExpbmUgKSB7XG4gIGlucHV0ID0gaW5wdXQucmVwbGFjZSgvKFxcclxcbnxcXG58XFxyKS9nLCBcIlxcblwiKTtcbiAgLy8gW1xcc1xcU10gbWF0Y2hlcyBfYW55dGhpbmdfIChuZXdsaW5lIG9yIHNwYWNlKVxuICAvLyBbXl0gaXMgZXF1aXZhbGVudCBidXQgZG9lc24ndCB3b3JrIGluIElFcy5cbiAgdmFyIHJlID0gLyhbXFxzXFxTXSs/KSgkfFxcbiN8XFxuKD86XFxzKlxcbnwkKSspL2csXG4gICAgICBibG9ja3MgPSBbXSxcbiAgICAgIG07XG5cbiAgdmFyIGxpbmVfbm8gPSAxO1xuXG4gIGlmICggKCBtID0gL14oXFxzKlxcbikvLmV4ZWMoaW5wdXQpICkgIT0gbnVsbCApIHtcbiAgICAvLyBza2lwIChidXQgY291bnQpIGxlYWRpbmcgYmxhbmsgbGluZXNcbiAgICBsaW5lX25vICs9IGNvdW50X2xpbmVzKCBtWzBdICk7XG4gICAgcmUubGFzdEluZGV4ID0gbVswXS5sZW5ndGg7XG4gIH1cblxuICB3aGlsZSAoICggbSA9IHJlLmV4ZWMoaW5wdXQpICkgIT09IG51bGwgKSB7XG4gICAgaWYgKG1bMl0gPT0gXCJcXG4jXCIpIHtcbiAgICAgIG1bMl0gPSBcIlxcblwiO1xuICAgICAgcmUubGFzdEluZGV4LS07XG4gICAgfVxuICAgIGJsb2Nrcy5wdXNoKCBta19ibG9jayggbVsxXSwgbVsyXSwgbGluZV9ubyApICk7XG4gICAgbGluZV9ubyArPSBjb3VudF9saW5lcyggbVswXSApO1xuICB9XG5cbiAgcmV0dXJuIGJsb2Nrcztcbn07XG5cbi8qKlxuICogIE1hcmtkb3duI3Byb2Nlc3NCbG9jayggYmxvY2ssIG5leHQgKSAtPiB1bmRlZmluZWQgfCBbIEpzb25NTCwgLi4uIF1cbiAqICAtIGJsb2NrIChTdHJpbmcpOiB0aGUgYmxvY2sgdG8gcHJvY2Vzc1xuICogIC0gbmV4dCAoQXJyYXkpOiB0aGUgZm9sbG93aW5nIGJsb2Nrc1xuICpcbiAqIFByb2Nlc3MgYGJsb2NrYCBhbmQgcmV0dXJuIGFuIGFycmF5IG9mIEpzb25NTCBub2RlcyByZXByZXNlbnRpbmcgYGJsb2NrYC5cbiAqXG4gKiBJdCBkb2VzIHRoaXMgYnkgYXNraW5nIGVhY2ggYmxvY2sgbGV2ZWwgZnVuY3Rpb24gaW4gdGhlIGRpYWxlY3QgdG8gcHJvY2Vzc1xuICogdGhlIGJsb2NrIHVudGlsIG9uZSBjYW4uIFN1Y2Nlc2Z1bCBoYW5kbGluZyBpcyBpbmRpY2F0ZWQgYnkgcmV0dXJuaW5nIGFuXG4gKiBhcnJheSAod2l0aCB6ZXJvIG9yIG1vcmUgSnNvbk1MIG5vZGVzKSwgZmFpbHVyZSBieSBhIGZhbHNlIHZhbHVlLlxuICpcbiAqIEJsb2NrcyBoYW5kbGVycyBhcmUgcmVzcG9uc2libGUgZm9yIGNhbGxpbmcgW1tNYXJrZG93biNwcm9jZXNzSW5saW5lXV1cbiAqIHRoZW1zZWx2ZXMgYXMgYXBwcm9wcmlhdGUuXG4gKlxuICogSWYgdGhlIGJsb2NrcyB3ZXJlIHNwbGl0IGluY29ycmVjdGx5IG9yIGFkamFjZW50IGJsb2NrcyBuZWVkIGNvbGxhcHNpbmcgeW91XG4gKiBjYW4gYWRqdXN0IGBuZXh0YCBpbiBwbGFjZSB1c2luZyBzaGlmdC9zcGxpY2UgZXRjLlxuICpcbiAqIElmIGFueSBvZiB0aGlzIGRlZmF1bHQgYmVoYXZpb3VyIGlzIG5vdCByaWdodCBmb3IgdGhlIGRpYWxlY3QsIHlvdSBjYW5cbiAqIGRlZmluZSBhIGBfX2NhbGxfX2AgbWV0aG9kIG9uIHRoZSBkaWFsZWN0IHRoYXQgd2lsbCBnZXQgaW52b2tlZCB0byBoYW5kbGVcbiAqIHRoZSBibG9jayBwcm9jZXNzaW5nLlxuICovXG5NYXJrZG93bi5wcm90b3R5cGUucHJvY2Vzc0Jsb2NrID0gZnVuY3Rpb24gcHJvY2Vzc0Jsb2NrKCBibG9jaywgbmV4dCApIHtcbiAgdmFyIGNicyA9IHRoaXMuZGlhbGVjdC5ibG9jayxcbiAgICAgIG9yZCA9IGNicy5fX29yZGVyX187XG5cbiAgaWYgKCBcIl9fY2FsbF9fXCIgaW4gY2JzICkge1xuICAgIHJldHVybiBjYnMuX19jYWxsX18uY2FsbCh0aGlzLCBibG9jaywgbmV4dCk7XG4gIH1cblxuICBmb3IgKCB2YXIgaSA9IDA7IGkgPCBvcmQubGVuZ3RoOyBpKysgKSB7XG4gICAgLy9EOnRoaXMuZGVidWcoIFwiVGVzdGluZ1wiLCBvcmRbaV0gKTtcbiAgICB2YXIgcmVzID0gY2JzWyBvcmRbaV0gXS5jYWxsKCB0aGlzLCBibG9jaywgbmV4dCApO1xuICAgIGlmICggcmVzICkge1xuICAgICAgLy9EOnRoaXMuZGVidWcoXCIgIG1hdGNoZWRcIik7XG4gICAgICBpZiAoICFpc0FycmF5KHJlcykgfHwgKCByZXMubGVuZ3RoID4gMCAmJiAhKCBpc0FycmF5KHJlc1swXSkgKSApIClcbiAgICAgICAgdGhpcy5kZWJ1ZyhvcmRbaV0sIFwiZGlkbid0IHJldHVybiBhIHByb3BlciBhcnJheVwiKTtcbiAgICAgIC8vRDp0aGlzLmRlYnVnKCBcIlwiICk7XG4gICAgICByZXR1cm4gcmVzO1xuICAgIH1cbiAgfVxuXG4gIC8vIFVob2ghIG5vIG1hdGNoISBTaG91bGQgd2UgdGhyb3cgYW4gZXJyb3I/XG4gIHJldHVybiBbXTtcbn07XG5cbk1hcmtkb3duLnByb3RvdHlwZS5wcm9jZXNzSW5saW5lID0gZnVuY3Rpb24gcHJvY2Vzc0lubGluZSggYmxvY2sgKSB7XG4gIHJldHVybiB0aGlzLmRpYWxlY3QuaW5saW5lLl9fY2FsbF9fLmNhbGwoIHRoaXMsIFN0cmluZyggYmxvY2sgKSApO1xufTtcblxuLyoqXG4gKiAgTWFya2Rvd24jdG9UcmVlKCBzb3VyY2UgKSAtPiBKc29uTUxcbiAqICAtIHNvdXJjZSAoU3RyaW5nKTogbWFya2Rvd24gc291cmNlIHRvIHBhcnNlXG4gKlxuICogIFBhcnNlIGBzb3VyY2VgIGludG8gYSBKc29uTUwgdHJlZSByZXByZXNlbnRpbmcgdGhlIG1hcmtkb3duIGRvY3VtZW50LlxuICoqL1xuLy8gY3VzdG9tX3RyZWUgbWVhbnMgc2V0IHRoaXMudHJlZSB0byBgY3VzdG9tX3RyZWVgIGFuZCByZXN0b3JlIG9sZCB2YWx1ZSBvbiByZXR1cm5cbk1hcmtkb3duLnByb3RvdHlwZS50b1RyZWUgPSBmdW5jdGlvbiB0b1RyZWUoIHNvdXJjZSwgY3VzdG9tX3Jvb3QgKSB7XG4gIHZhciBibG9ja3MgPSBzb3VyY2UgaW5zdGFuY2VvZiBBcnJheSA/IHNvdXJjZSA6IHRoaXMuc3BsaXRfYmxvY2tzKCBzb3VyY2UgKTtcblxuICAvLyBNYWtlIHRyZWUgYSBtZW1iZXIgdmFyaWFibGUgc28gaXRzIGVhc2llciB0byBtZXNzIHdpdGggaW4gZXh0ZW5zaW9uc1xuICB2YXIgb2xkX3RyZWUgPSB0aGlzLnRyZWU7XG4gIHRyeSB7XG4gICAgdGhpcy50cmVlID0gY3VzdG9tX3Jvb3QgfHwgdGhpcy50cmVlIHx8IFsgXCJtYXJrZG93blwiIF07XG5cbiAgICBibG9ja3M6XG4gICAgd2hpbGUgKCBibG9ja3MubGVuZ3RoICkge1xuICAgICAgdmFyIGIgPSB0aGlzLnByb2Nlc3NCbG9jayggYmxvY2tzLnNoaWZ0KCksIGJsb2NrcyApO1xuXG4gICAgICAvLyBSZWZlcmVuY2UgYmxvY2tzIGFuZCB0aGUgbGlrZSB3b24ndCByZXR1cm4gYW55IGNvbnRlbnRcbiAgICAgIGlmICggIWIubGVuZ3RoICkgY29udGludWUgYmxvY2tzO1xuXG4gICAgICB0aGlzLnRyZWUucHVzaC5hcHBseSggdGhpcy50cmVlLCBiICk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLnRyZWU7XG4gIH1cbiAgZmluYWxseSB7XG4gICAgaWYgKCBjdXN0b21fcm9vdCApIHtcbiAgICAgIHRoaXMudHJlZSA9IG9sZF90cmVlO1xuICAgIH1cbiAgfVxufTtcblxuLy8gTm9vcCBieSBkZWZhdWx0XG5NYXJrZG93bi5wcm90b3R5cGUuZGVidWcgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoIGFyZ3VtZW50cyk7XG4gIGFyZ3MudW5zaGlmdCh0aGlzLmRlYnVnX2luZGVudCk7XG4gIGlmICggdHlwZW9mIHByaW50ICE9PSBcInVuZGVmaW5lZFwiIClcbiAgICAgIHByaW50LmFwcGx5KCBwcmludCwgYXJncyApO1xuICBpZiAoIHR5cGVvZiBjb25zb2xlICE9PSBcInVuZGVmaW5lZFwiICYmIHR5cGVvZiBjb25zb2xlLmxvZyAhPT0gXCJ1bmRlZmluZWRcIiApXG4gICAgICBjb25zb2xlLmxvZy5hcHBseSggbnVsbCwgYXJncyApO1xufVxuXG5NYXJrZG93bi5wcm90b3R5cGUubG9vcF9yZV9vdmVyX2Jsb2NrID0gZnVuY3Rpb24oIHJlLCBibG9jaywgY2IgKSB7XG4gIC8vIERvbnQgdXNlIC9nIHJlZ2V4cHMgd2l0aCB0aGlzXG4gIHZhciBtLFxuICAgICAgYiA9IGJsb2NrLnZhbHVlT2YoKTtcblxuICB3aGlsZSAoIGIubGVuZ3RoICYmIChtID0gcmUuZXhlYyhiKSApICE9IG51bGwgKSB7XG4gICAgYiA9IGIuc3Vic3RyKCBtWzBdLmxlbmd0aCApO1xuICAgIGNiLmNhbGwodGhpcywgbSk7XG4gIH1cbiAgcmV0dXJuIGI7XG59O1xuXG4vKipcbiAqIE1hcmtkb3duLmRpYWxlY3RzXG4gKlxuICogTmFtZXNwYWNlIG9mIGJ1aWx0LWluIGRpYWxlY3RzLlxuICoqL1xuTWFya2Rvd24uZGlhbGVjdHMgPSB7fTtcblxuLyoqXG4gKiBNYXJrZG93bi5kaWFsZWN0cy5HcnViZXJcbiAqXG4gKiBUaGUgZGVmYXVsdCBkaWFsZWN0IHRoYXQgZm9sbG93cyB0aGUgcnVsZXMgc2V0IG91dCBieSBKb2huIEdydWJlcidzXG4gKiBtYXJrZG93bi5wbCBhcyBjbG9zZWx5IGFzIHBvc3NpYmxlLiBXZWxsIGFjdHVhbGx5IHdlIGZvbGxvdyB0aGUgYmVoYXZpb3VyIG9mXG4gKiB0aGF0IHNjcmlwdCB3aGljaCBpbiBzb21lIHBsYWNlcyBpcyBub3QgZXhhY3RseSB3aGF0IHRoZSBzeW50YXggd2ViIHBhZ2VcbiAqIHNheXMuXG4gKiovXG5NYXJrZG93bi5kaWFsZWN0cy5HcnViZXIgPSB7XG4gIGJsb2NrOiB7XG4gICAgYXR4SGVhZGVyOiBmdW5jdGlvbiBhdHhIZWFkZXIoIGJsb2NrLCBuZXh0ICkge1xuICAgICAgdmFyIG0gPSBibG9jay5tYXRjaCggL14oI3sxLDZ9KVxccyooLio/KVxccyojKlxccyooPzpcXG58JCkvICk7XG5cbiAgICAgIGlmICggIW0gKSByZXR1cm4gdW5kZWZpbmVkO1xuXG4gICAgICB2YXIgaGVhZGVyID0gWyBcImhlYWRlclwiLCB7IGxldmVsOiBtWyAxIF0ubGVuZ3RoIH0gXTtcbiAgICAgIEFycmF5LnByb3RvdHlwZS5wdXNoLmFwcGx5KGhlYWRlciwgdGhpcy5wcm9jZXNzSW5saW5lKG1bIDIgXSkpO1xuXG4gICAgICBpZiAoIG1bMF0ubGVuZ3RoIDwgYmxvY2subGVuZ3RoIClcbiAgICAgICAgbmV4dC51bnNoaWZ0KCBta19ibG9jayggYmxvY2suc3Vic3RyKCBtWzBdLmxlbmd0aCApLCBibG9jay50cmFpbGluZywgYmxvY2subGluZU51bWJlciArIDIgKSApO1xuXG4gICAgICByZXR1cm4gWyBoZWFkZXIgXTtcbiAgICB9LFxuXG4gICAgc2V0ZXh0SGVhZGVyOiBmdW5jdGlvbiBzZXRleHRIZWFkZXIoIGJsb2NrLCBuZXh0ICkge1xuICAgICAgdmFyIG0gPSBibG9jay5tYXRjaCggL14oLiopXFxuKFstPV0pXFwyXFwyKyg/OlxcbnwkKS8gKTtcblxuICAgICAgaWYgKCAhbSApIHJldHVybiB1bmRlZmluZWQ7XG5cbiAgICAgIHZhciBsZXZlbCA9ICggbVsgMiBdID09PSBcIj1cIiApID8gMSA6IDI7XG4gICAgICB2YXIgaGVhZGVyID0gWyBcImhlYWRlclwiLCB7IGxldmVsIDogbGV2ZWwgfSwgbVsgMSBdIF07XG5cbiAgICAgIGlmICggbVswXS5sZW5ndGggPCBibG9jay5sZW5ndGggKVxuICAgICAgICBuZXh0LnVuc2hpZnQoIG1rX2Jsb2NrKCBibG9jay5zdWJzdHIoIG1bMF0ubGVuZ3RoICksIGJsb2NrLnRyYWlsaW5nLCBibG9jay5saW5lTnVtYmVyICsgMiApICk7XG5cbiAgICAgIHJldHVybiBbIGhlYWRlciBdO1xuICAgIH0sXG5cbiAgICBjb2RlOiBmdW5jdGlvbiBjb2RlKCBibG9jaywgbmV4dCApIHtcbiAgICAgIC8vIHwgICAgRm9vXG4gICAgICAvLyB8YmFyXG4gICAgICAvLyBzaG91bGQgYmUgYSBjb2RlIGJsb2NrIGZvbGxvd2VkIGJ5IGEgcGFyYWdyYXBoLiBGdW5cbiAgICAgIC8vXG4gICAgICAvLyBUaGVyZSBtaWdodCBhbHNvIGJlIGFkamFjZW50IGNvZGUgYmxvY2sgdG8gbWVyZ2UuXG5cbiAgICAgIHZhciByZXQgPSBbXSxcbiAgICAgICAgICByZSA9IC9eKD86IHswLDN9XFx0fCB7NH0pKC4qKVxcbj8vLFxuICAgICAgICAgIGxpbmVzO1xuXG4gICAgICAvLyA0IHNwYWNlcyArIGNvbnRlbnRcbiAgICAgIGlmICggIWJsb2NrLm1hdGNoKCByZSApICkgcmV0dXJuIHVuZGVmaW5lZDtcblxuICAgICAgYmxvY2tfc2VhcmNoOlxuICAgICAgZG8ge1xuICAgICAgICAvLyBOb3cgcHVsbCBvdXQgdGhlIHJlc3Qgb2YgdGhlIGxpbmVzXG4gICAgICAgIHZhciBiID0gdGhpcy5sb29wX3JlX292ZXJfYmxvY2soXG4gICAgICAgICAgICAgICAgICByZSwgYmxvY2sudmFsdWVPZigpLCBmdW5jdGlvbiggbSApIHsgcmV0LnB1c2goIG1bMV0gKTsgfSApO1xuXG4gICAgICAgIGlmICggYi5sZW5ndGggKSB7XG4gICAgICAgICAgLy8gQ2FzZSBhbGx1ZGVkIHRvIGluIGZpcnN0IGNvbW1lbnQuIHB1c2ggaXQgYmFjayBvbiBhcyBhIG5ldyBibG9ja1xuICAgICAgICAgIG5leHQudW5zaGlmdCggbWtfYmxvY2soYiwgYmxvY2sudHJhaWxpbmcpICk7XG4gICAgICAgICAgYnJlYWsgYmxvY2tfc2VhcmNoO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKCBuZXh0Lmxlbmd0aCApIHtcbiAgICAgICAgICAvLyBDaGVjayB0aGUgbmV4dCBibG9jayAtIGl0IG1pZ2h0IGJlIGNvZGUgdG9vXG4gICAgICAgICAgaWYgKCAhbmV4dFswXS5tYXRjaCggcmUgKSApIGJyZWFrIGJsb2NrX3NlYXJjaDtcblxuICAgICAgICAgIC8vIFB1bGwgaG93IGhvdyBtYW55IGJsYW5rcyBsaW5lcyBmb2xsb3cgLSBtaW51cyB0d28gdG8gYWNjb3VudCBmb3IgLmpvaW5cbiAgICAgICAgICByZXQucHVzaCAoIGJsb2NrLnRyYWlsaW5nLnJlcGxhY2UoL1teXFxuXS9nLCBcIlwiKS5zdWJzdHJpbmcoMikgKTtcblxuICAgICAgICAgIGJsb2NrID0gbmV4dC5zaGlmdCgpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIGJyZWFrIGJsb2NrX3NlYXJjaDtcbiAgICAgICAgfVxuICAgICAgfSB3aGlsZSAoIHRydWUgKTtcblxuICAgICAgcmV0dXJuIFsgWyBcImNvZGVfYmxvY2tcIiwgcmV0LmpvaW4oXCJcXG5cIikgXSBdO1xuICAgIH0sXG5cbiAgICBob3JpelJ1bGU6IGZ1bmN0aW9uIGhvcml6UnVsZSggYmxvY2ssIG5leHQgKSB7XG4gICAgICAvLyB0aGlzIG5lZWRzIHRvIGZpbmQgYW55IGhyIGluIHRoZSBibG9jayB0byBoYW5kbGUgYWJ1dHRpbmcgYmxvY2tzXG4gICAgICB2YXIgbSA9IGJsb2NrLm1hdGNoKCAvXig/OihbXFxzXFxTXSo/KVxcbik/WyBcXHRdKihbLV8qXSkoPzpbIFxcdF0qXFwyKXsyLH1bIFxcdF0qKD86XFxuKFtcXHNcXFNdKikpPyQvICk7XG5cbiAgICAgIGlmICggIW0gKSB7XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICB9XG5cbiAgICAgIHZhciBqc29ubWwgPSBbIFsgXCJoclwiIF0gXTtcblxuICAgICAgLy8gaWYgdGhlcmUncyBhIGxlYWRpbmcgYWJ1dHRpbmcgYmxvY2ssIHByb2Nlc3MgaXRcbiAgICAgIGlmICggbVsgMSBdICkge1xuICAgICAgICBqc29ubWwudW5zaGlmdC5hcHBseSgganNvbm1sLCB0aGlzLnByb2Nlc3NCbG9jayggbVsgMSBdLCBbXSApICk7XG4gICAgICB9XG5cbiAgICAgIC8vIGlmIHRoZXJlJ3MgYSB0cmFpbGluZyBhYnV0dGluZyBibG9jaywgc3RpY2sgaXQgaW50byBuZXh0XG4gICAgICBpZiAoIG1bIDMgXSApIHtcbiAgICAgICAgbmV4dC51bnNoaWZ0KCBta19ibG9jayggbVsgMyBdICkgKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGpzb25tbDtcbiAgICB9LFxuXG4gICAgLy8gVGhlcmUgYXJlIHR3byB0eXBlcyBvZiBsaXN0cy4gVGlnaHQgYW5kIGxvb3NlLiBUaWdodCBsaXN0cyBoYXZlIG5vIHdoaXRlc3BhY2VcbiAgICAvLyBiZXR3ZWVuIHRoZSBpdGVtcyAoYW5kIHJlc3VsdCBpbiB0ZXh0IGp1c3QgaW4gdGhlIDxsaT4pIGFuZCBsb29zZSBsaXN0cyxcbiAgICAvLyB3aGljaCBoYXZlIGFuIGVtcHR5IGxpbmUgYmV0d2VlbiBsaXN0IGl0ZW1zLCByZXN1bHRpbmcgaW4gKG9uZSBvciBtb3JlKVxuICAgIC8vIHBhcmFncmFwaHMgaW5zaWRlIHRoZSA8bGk+LlxuICAgIC8vXG4gICAgLy8gVGhlcmUgYXJlIGFsbCBzb3J0cyB3ZWlyZCBlZGdlIGNhc2VzIGFib3V0IHRoZSBvcmlnaW5hbCBtYXJrZG93bi5wbCdzXG4gICAgLy8gaGFuZGxpbmcgb2YgbGlzdHM6XG4gICAgLy9cbiAgICAvLyAqIE5lc3RlZCBsaXN0cyBhcmUgc3VwcG9zZWQgdG8gYmUgaW5kZW50ZWQgYnkgZm91ciBjaGFycyBwZXIgbGV2ZWwuIEJ1dFxuICAgIC8vICAgaWYgdGhleSBhcmVuJ3QsIHlvdSBjYW4gZ2V0IGEgbmVzdGVkIGxpc3QgYnkgaW5kZW50aW5nIGJ5IGxlc3MgdGhhblxuICAgIC8vICAgZm91ciBzbyBsb25nIGFzIHRoZSBpbmRlbnQgZG9lc24ndCBtYXRjaCBhbiBpbmRlbnQgb2YgYW4gZXhpc3RpbmcgbGlzdFxuICAgIC8vICAgaXRlbSBpbiB0aGUgJ25lc3Qgc3RhY2snLlxuICAgIC8vXG4gICAgLy8gKiBUaGUgdHlwZSBvZiB0aGUgbGlzdCAoYnVsbGV0IG9yIG51bWJlcikgaXMgY29udHJvbGxlZCBqdXN0IGJ5IHRoZVxuICAgIC8vICAgIGZpcnN0IGl0ZW0gYXQgdGhlIGluZGVudC4gU3Vic2VxdWVudCBjaGFuZ2VzIGFyZSBpZ25vcmVkIHVubGVzcyB0aGV5XG4gICAgLy8gICAgYXJlIGZvciBuZXN0ZWQgbGlzdHNcbiAgICAvL1xuICAgIGxpc3RzOiAoZnVuY3Rpb24oICkge1xuICAgICAgLy8gVXNlIGEgY2xvc3VyZSB0byBoaWRlIGEgZmV3IHZhcmlhYmxlcy5cbiAgICAgIHZhciBhbnlfbGlzdCA9IFwiWyorLV18XFxcXGQrXFxcXC5cIixcbiAgICAgICAgICBidWxsZXRfbGlzdCA9IC9bKistXS8sXG4gICAgICAgICAgbnVtYmVyX2xpc3QgPSAvXFxkK1xcLi8sXG4gICAgICAgICAgLy8gQ2FwdHVyZSBsZWFkaW5nIGluZGVudCBhcyBpdCBtYXR0ZXJzIGZvciBkZXRlcm1pbmluZyBuZXN0ZWQgbGlzdHMuXG4gICAgICAgICAgaXNfbGlzdF9yZSA9IG5ldyBSZWdFeHAoIFwiXiggezAsM30pKFwiICsgYW55X2xpc3QgKyBcIilbIFxcdF0rXCIgKSxcbiAgICAgICAgICBpbmRlbnRfcmUgPSBcIig/OiB7MCwzfVxcXFx0fCB7NH0pXCI7XG5cbiAgICAgIC8vIFRPRE86IENhY2hlIHRoaXMgcmVnZXhwIGZvciBjZXJ0YWluIGRlcHRocy5cbiAgICAgIC8vIENyZWF0ZSBhIHJlZ2V4cCBzdWl0YWJsZSBmb3IgbWF0Y2hpbmcgYW4gbGkgZm9yIGEgZ2l2ZW4gc3RhY2sgZGVwdGhcbiAgICAgIGZ1bmN0aW9uIHJlZ2V4X2Zvcl9kZXB0aCggZGVwdGggKSB7XG5cbiAgICAgICAgcmV0dXJuIG5ldyBSZWdFeHAoXG4gICAgICAgICAgLy8gbVsxXSA9IGluZGVudCwgbVsyXSA9IGxpc3RfdHlwZVxuICAgICAgICAgIFwiKD86XihcIiArIGluZGVudF9yZSArIFwiezAsXCIgKyBkZXB0aCArIFwifSB7MCwzfSkoXCIgKyBhbnlfbGlzdCArIFwiKVxcXFxzKyl8XCIgK1xuICAgICAgICAgIC8vIG1bM10gPSBjb250XG4gICAgICAgICAgXCIoXlwiICsgaW5kZW50X3JlICsgXCJ7MCxcIiArIChkZXB0aC0xKSArIFwifVsgXXswLDR9KVwiXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgICBmdW5jdGlvbiBleHBhbmRfdGFiKCBpbnB1dCApIHtcbiAgICAgICAgcmV0dXJuIGlucHV0LnJlcGxhY2UoIC8gezAsM31cXHQvZywgXCIgICAgXCIgKTtcbiAgICAgIH1cblxuICAgICAgLy8gQWRkIGlubGluZSBjb250ZW50IGBpbmxpbmVgIHRvIGBsaWAuIGlubGluZSBjb21lcyBmcm9tIHByb2Nlc3NJbmxpbmVcbiAgICAgIC8vIHNvIGlzIGFuIGFycmF5IG9mIGNvbnRlbnRcbiAgICAgIGZ1bmN0aW9uIGFkZChsaSwgbG9vc2UsIGlubGluZSwgbmwpIHtcbiAgICAgICAgaWYgKCBsb29zZSApIHtcbiAgICAgICAgICBsaS5wdXNoKCBbIFwicGFyYVwiIF0uY29uY2F0KGlubGluZSkgKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgLy8gSG1tbSwgc2hvdWxkIHRoaXMgYmUgYW55IGJsb2NrIGxldmVsIGVsZW1lbnQgb3IganVzdCBwYXJhcz9cbiAgICAgICAgdmFyIGFkZF90byA9IGxpW2xpLmxlbmd0aCAtMV0gaW5zdGFuY2VvZiBBcnJheSAmJiBsaVtsaS5sZW5ndGggLSAxXVswXSA9PSBcInBhcmFcIlxuICAgICAgICAgICAgICAgICAgID8gbGlbbGkubGVuZ3RoIC0xXVxuICAgICAgICAgICAgICAgICAgIDogbGk7XG5cbiAgICAgICAgLy8gSWYgdGhlcmUgaXMgYWxyZWFkeSBzb21lIGNvbnRlbnQgaW4gdGhpcyBsaXN0LCBhZGQgdGhlIG5ldyBsaW5lIGluXG4gICAgICAgIGlmICggbmwgJiYgbGkubGVuZ3RoID4gMSApIGlubGluZS51bnNoaWZ0KG5sKTtcblxuICAgICAgICBmb3IgKCB2YXIgaSA9IDA7IGkgPCBpbmxpbmUubGVuZ3RoOyBpKysgKSB7XG4gICAgICAgICAgdmFyIHdoYXQgPSBpbmxpbmVbaV0sXG4gICAgICAgICAgICAgIGlzX3N0ciA9IHR5cGVvZiB3aGF0ID09IFwic3RyaW5nXCI7XG4gICAgICAgICAgaWYgKCBpc19zdHIgJiYgYWRkX3RvLmxlbmd0aCA+IDEgJiYgdHlwZW9mIGFkZF90b1thZGRfdG8ubGVuZ3RoLTFdID09IFwic3RyaW5nXCIgKSB7XG4gICAgICAgICAgICBhZGRfdG9bIGFkZF90by5sZW5ndGgtMSBdICs9IHdoYXQ7XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgYWRkX3RvLnB1c2goIHdoYXQgKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gY29udGFpbmVkIG1lYW5zIGhhdmUgYW4gaW5kZW50IGdyZWF0ZXIgdGhhbiB0aGUgY3VycmVudCBvbmUuIE9uXG4gICAgICAvLyAqZXZlcnkqIGxpbmUgaW4gdGhlIGJsb2NrXG4gICAgICBmdW5jdGlvbiBnZXRfY29udGFpbmVkX2Jsb2NrcyggZGVwdGgsIGJsb2NrcyApIHtcblxuICAgICAgICB2YXIgcmUgPSBuZXcgUmVnRXhwKCBcIl4oXCIgKyBpbmRlbnRfcmUgKyBcIntcIiArIGRlcHRoICsgXCJ9Lio/XFxcXG4/KSokXCIgKSxcbiAgICAgICAgICAgIHJlcGxhY2UgPSBuZXcgUmVnRXhwKFwiXlwiICsgaW5kZW50X3JlICsgXCJ7XCIgKyBkZXB0aCArIFwifVwiLCBcImdtXCIpLFxuICAgICAgICAgICAgcmV0ID0gW107XG5cbiAgICAgICAgd2hpbGUgKCBibG9ja3MubGVuZ3RoID4gMCApIHtcbiAgICAgICAgICBpZiAoIHJlLmV4ZWMoIGJsb2Nrc1swXSApICkge1xuICAgICAgICAgICAgdmFyIGIgPSBibG9ja3Muc2hpZnQoKSxcbiAgICAgICAgICAgICAgICAvLyBOb3cgcmVtb3ZlIHRoYXQgaW5kZW50XG4gICAgICAgICAgICAgICAgeCA9IGIucmVwbGFjZSggcmVwbGFjZSwgXCJcIik7XG5cbiAgICAgICAgICAgIHJldC5wdXNoKCBta19ibG9jayggeCwgYi50cmFpbGluZywgYi5saW5lTnVtYmVyICkgKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICAgIH1cblxuICAgICAgLy8gcGFzc2VkIHRvIHN0YWNrLmZvckVhY2ggdG8gdHVybiBsaXN0IGl0ZW1zIHVwIHRoZSBzdGFjayBpbnRvIHBhcmFzXG4gICAgICBmdW5jdGlvbiBwYXJhZ3JhcGhpZnkocywgaSwgc3RhY2spIHtcbiAgICAgICAgdmFyIGxpc3QgPSBzLmxpc3Q7XG4gICAgICAgIHZhciBsYXN0X2xpID0gbGlzdFtsaXN0Lmxlbmd0aC0xXTtcblxuICAgICAgICBpZiAoIGxhc3RfbGlbMV0gaW5zdGFuY2VvZiBBcnJheSAmJiBsYXN0X2xpWzFdWzBdID09IFwicGFyYVwiICkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIGkgKyAxID09IHN0YWNrLmxlbmd0aCApIHtcbiAgICAgICAgICAvLyBMYXN0IHN0YWNrIGZyYW1lXG4gICAgICAgICAgLy8gS2VlcCB0aGUgc2FtZSBhcnJheSwgYnV0IHJlcGxhY2UgdGhlIGNvbnRlbnRzXG4gICAgICAgICAgbGFzdF9saS5wdXNoKCBbXCJwYXJhXCJdLmNvbmNhdCggbGFzdF9saS5zcGxpY2UoMSwgbGFzdF9saS5sZW5ndGggLSAxKSApICk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgdmFyIHN1Ymxpc3QgPSBsYXN0X2xpLnBvcCgpO1xuICAgICAgICAgIGxhc3RfbGkucHVzaCggW1wicGFyYVwiXS5jb25jYXQoIGxhc3RfbGkuc3BsaWNlKDEsIGxhc3RfbGkubGVuZ3RoIC0gMSkgKSwgc3VibGlzdCApO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIFRoZSBtYXRjaGVyIGZ1bmN0aW9uXG4gICAgICByZXR1cm4gZnVuY3Rpb24oIGJsb2NrLCBuZXh0ICkge1xuICAgICAgICB2YXIgbSA9IGJsb2NrLm1hdGNoKCBpc19saXN0X3JlICk7XG4gICAgICAgIGlmICggIW0gKSByZXR1cm4gdW5kZWZpbmVkO1xuXG4gICAgICAgIGZ1bmN0aW9uIG1ha2VfbGlzdCggbSApIHtcbiAgICAgICAgICB2YXIgbGlzdCA9IGJ1bGxldF9saXN0LmV4ZWMoIG1bMl0gKVxuICAgICAgICAgICAgICAgICAgID8gW1wiYnVsbGV0bGlzdFwiXVxuICAgICAgICAgICAgICAgICAgIDogW1wibnVtYmVybGlzdFwiXTtcblxuICAgICAgICAgIHN0YWNrLnB1c2goIHsgbGlzdDogbGlzdCwgaW5kZW50OiBtWzFdIH0gKTtcbiAgICAgICAgICByZXR1cm4gbGlzdDtcbiAgICAgICAgfVxuXG5cbiAgICAgICAgdmFyIHN0YWNrID0gW10sIC8vIFN0YWNrIG9mIGxpc3RzIGZvciBuZXN0aW5nLlxuICAgICAgICAgICAgbGlzdCA9IG1ha2VfbGlzdCggbSApLFxuICAgICAgICAgICAgbGFzdF9saSxcbiAgICAgICAgICAgIGxvb3NlID0gZmFsc2UsXG4gICAgICAgICAgICByZXQgPSBbIHN0YWNrWzBdLmxpc3QgXSxcbiAgICAgICAgICAgIGk7XG5cbiAgICAgICAgLy8gTG9vcCB0byBzZWFyY2ggb3ZlciBibG9jayBsb29raW5nIGZvciBpbm5lciBibG9jayBlbGVtZW50cyBhbmQgbG9vc2UgbGlzdHNcbiAgICAgICAgbG9vc2Vfc2VhcmNoOlxuICAgICAgICB3aGlsZSAoIHRydWUgKSB7XG4gICAgICAgICAgLy8gU3BsaXQgaW50byBsaW5lcyBwcmVzZXJ2aW5nIG5ldyBsaW5lcyBhdCBlbmQgb2YgbGluZVxuICAgICAgICAgIHZhciBsaW5lcyA9IGJsb2NrLnNwbGl0KCAvKD89XFxuKS8gKTtcblxuICAgICAgICAgIC8vIFdlIGhhdmUgdG8gZ3JhYiBhbGwgbGluZXMgZm9yIGEgbGkgYW5kIGNhbGwgcHJvY2Vzc0lubGluZSBvbiB0aGVtXG4gICAgICAgICAgLy8gb25jZSBhcyB0aGVyZSBhcmUgc29tZSBpbmxpbmUgdGhpbmdzIHRoYXQgY2FuIHNwYW4gbGluZXMuXG4gICAgICAgICAgdmFyIGxpX2FjY3VtdWxhdGUgPSBcIlwiO1xuXG4gICAgICAgICAgLy8gTG9vcCBvdmVyIHRoZSBsaW5lcyBpbiB0aGlzIGJsb2NrIGxvb2tpbmcgZm9yIHRpZ2h0IGxpc3RzLlxuICAgICAgICAgIHRpZ2h0X3NlYXJjaDpcbiAgICAgICAgICBmb3IgKCB2YXIgbGluZV9ubyA9IDA7IGxpbmVfbm8gPCBsaW5lcy5sZW5ndGg7IGxpbmVfbm8rKyApIHtcbiAgICAgICAgICAgIHZhciBubCA9IFwiXCIsXG4gICAgICAgICAgICAgICAgbCA9IGxpbmVzW2xpbmVfbm9dLnJlcGxhY2UoL15cXG4vLCBmdW5jdGlvbihuKSB7IG5sID0gbjsgcmV0dXJuIFwiXCI7IH0pO1xuXG4gICAgICAgICAgICAvLyBUT0RPOiByZWFsbHkgc2hvdWxkIGNhY2hlIHRoaXNcbiAgICAgICAgICAgIHZhciBsaW5lX3JlID0gcmVnZXhfZm9yX2RlcHRoKCBzdGFjay5sZW5ndGggKTtcblxuICAgICAgICAgICAgbSA9IGwubWF0Y2goIGxpbmVfcmUgKTtcbiAgICAgICAgICAgIC8vcHJpbnQoIFwibGluZTpcIiwgdW5ldmFsKGwpLCBcIlxcbmxpbmUgbWF0Y2g6XCIsIHVuZXZhbChtKSApO1xuXG4gICAgICAgICAgICAvLyBXZSBoYXZlIGEgbGlzdCBpdGVtXG4gICAgICAgICAgICBpZiAoIG1bMV0gIT09IHVuZGVmaW5lZCApIHtcbiAgICAgICAgICAgICAgLy8gUHJvY2VzcyB0aGUgcHJldmlvdXMgbGlzdCBpdGVtLCBpZiBhbnlcbiAgICAgICAgICAgICAgaWYgKCBsaV9hY2N1bXVsYXRlLmxlbmd0aCApIHtcbiAgICAgICAgICAgICAgICBhZGQoIGxhc3RfbGksIGxvb3NlLCB0aGlzLnByb2Nlc3NJbmxpbmUoIGxpX2FjY3VtdWxhdGUgKSwgbmwgKTtcbiAgICAgICAgICAgICAgICAvLyBMb29zZSBtb2RlIHdpbGwgaGF2ZSBiZWVuIGRlYWx0IHdpdGguIFJlc2V0IGl0XG4gICAgICAgICAgICAgICAgbG9vc2UgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBsaV9hY2N1bXVsYXRlID0gXCJcIjtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIG1bMV0gPSBleHBhbmRfdGFiKCBtWzFdICk7XG4gICAgICAgICAgICAgIHZhciB3YW50ZWRfZGVwdGggPSBNYXRoLmZsb29yKG1bMV0ubGVuZ3RoLzQpKzE7XG4gICAgICAgICAgICAgIC8vcHJpbnQoIFwid2FudDpcIiwgd2FudGVkX2RlcHRoLCBcInN0YWNrOlwiLCBzdGFjay5sZW5ndGgpO1xuICAgICAgICAgICAgICBpZiAoIHdhbnRlZF9kZXB0aCA+IHN0YWNrLmxlbmd0aCApIHtcbiAgICAgICAgICAgICAgICAvLyBEZWVwIGVub3VnaCBmb3IgYSBuZXN0ZWQgbGlzdCBvdXRyaWdodFxuICAgICAgICAgICAgICAgIC8vcHJpbnQgKCBcIm5ldyBuZXN0ZWQgbGlzdFwiICk7XG4gICAgICAgICAgICAgICAgbGlzdCA9IG1ha2VfbGlzdCggbSApO1xuICAgICAgICAgICAgICAgIGxhc3RfbGkucHVzaCggbGlzdCApO1xuICAgICAgICAgICAgICAgIGxhc3RfbGkgPSBsaXN0WzFdID0gWyBcImxpc3RpdGVtXCIgXTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBXZSBhcmVuJ3QgZGVlcCBlbm91Z2ggdG8gYmUgc3RyaWN0bHkgYSBuZXcgbGV2ZWwuIFRoaXMgaXNcbiAgICAgICAgICAgICAgICAvLyB3aGVyZSBNZC5wbCBnb2VzIG51dHMuIElmIHRoZSBpbmRlbnQgbWF0Y2hlcyBhIGxldmVsIGluIHRoZVxuICAgICAgICAgICAgICAgIC8vIHN0YWNrLCBwdXQgaXQgdGhlcmUsIGVsc2UgcHV0IGl0IG9uZSBkZWVwZXIgdGhlbiB0aGVcbiAgICAgICAgICAgICAgICAvLyB3YW50ZWRfZGVwdGggZGVzZXJ2ZXMuXG4gICAgICAgICAgICAgICAgdmFyIGZvdW5kID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgZm9yICggaSA9IDA7IGkgPCBzdGFjay5sZW5ndGg7IGkrKyApIHtcbiAgICAgICAgICAgICAgICAgIGlmICggc3RhY2tbIGkgXS5pbmRlbnQgIT0gbVsxXSApIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgbGlzdCA9IHN0YWNrWyBpIF0ubGlzdDtcbiAgICAgICAgICAgICAgICAgIHN0YWNrLnNwbGljZSggaSsxLCBzdGFjay5sZW5ndGggLSAoaSsxKSApO1xuICAgICAgICAgICAgICAgICAgZm91bmQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKCFmb3VuZCkge1xuICAgICAgICAgICAgICAgICAgLy9wcmludChcIm5vdCBmb3VuZC4gbDpcIiwgdW5ldmFsKGwpKTtcbiAgICAgICAgICAgICAgICAgIHdhbnRlZF9kZXB0aCsrO1xuICAgICAgICAgICAgICAgICAgaWYgKCB3YW50ZWRfZGVwdGggPD0gc3RhY2subGVuZ3RoICkge1xuICAgICAgICAgICAgICAgICAgICBzdGFjay5zcGxpY2Uod2FudGVkX2RlcHRoLCBzdGFjay5sZW5ndGggLSB3YW50ZWRfZGVwdGgpO1xuICAgICAgICAgICAgICAgICAgICAvL3ByaW50KFwiRGVzaXJlZCBkZXB0aCBub3dcIiwgd2FudGVkX2RlcHRoLCBcInN0YWNrOlwiLCBzdGFjay5sZW5ndGgpO1xuICAgICAgICAgICAgICAgICAgICBsaXN0ID0gc3RhY2tbd2FudGVkX2RlcHRoLTFdLmxpc3Q7XG4gICAgICAgICAgICAgICAgICAgIC8vcHJpbnQoXCJsaXN0OlwiLCB1bmV2YWwobGlzdCkgKTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvL3ByaW50IChcIm1hZGUgbmV3IHN0YWNrIGZvciBtZXNzeSBpbmRlbnRcIik7XG4gICAgICAgICAgICAgICAgICAgIGxpc3QgPSBtYWtlX2xpc3QobSk7XG4gICAgICAgICAgICAgICAgICAgIGxhc3RfbGkucHVzaChsaXN0KTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvL3ByaW50KCB1bmV2YWwobGlzdCksIFwibGFzdFwiLCBsaXN0ID09PSBzdGFja1tzdGFjay5sZW5ndGgtMV0ubGlzdCApO1xuICAgICAgICAgICAgICAgIGxhc3RfbGkgPSBbIFwibGlzdGl0ZW1cIiBdO1xuICAgICAgICAgICAgICAgIGxpc3QucHVzaChsYXN0X2xpKTtcbiAgICAgICAgICAgICAgfSAvLyBlbmQgZGVwdGggb2Ygc2hlbmVnYWluc1xuICAgICAgICAgICAgICBubCA9IFwiXCI7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIEFkZCBjb250ZW50XG4gICAgICAgICAgICBpZiAoIGwubGVuZ3RoID4gbVswXS5sZW5ndGggKSB7XG4gICAgICAgICAgICAgIGxpX2FjY3VtdWxhdGUgKz0gbmwgKyBsLnN1YnN0ciggbVswXS5sZW5ndGggKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IC8vIHRpZ2h0X3NlYXJjaFxuXG4gICAgICAgICAgaWYgKCBsaV9hY2N1bXVsYXRlLmxlbmd0aCApIHtcbiAgICAgICAgICAgIGFkZCggbGFzdF9saSwgbG9vc2UsIHRoaXMucHJvY2Vzc0lubGluZSggbGlfYWNjdW11bGF0ZSApLCBubCApO1xuICAgICAgICAgICAgLy8gTG9vc2UgbW9kZSB3aWxsIGhhdmUgYmVlbiBkZWFsdCB3aXRoLiBSZXNldCBpdFxuICAgICAgICAgICAgbG9vc2UgPSBmYWxzZTtcbiAgICAgICAgICAgIGxpX2FjY3VtdWxhdGUgPSBcIlwiO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIExvb2sgYXQgdGhlIG5leHQgYmxvY2sgLSB3ZSBtaWdodCBoYXZlIGEgbG9vc2UgbGlzdC4gT3IgYW4gZXh0cmFcbiAgICAgICAgICAvLyBwYXJhZ3JhcGggZm9yIHRoZSBjdXJyZW50IGxpXG4gICAgICAgICAgdmFyIGNvbnRhaW5lZCA9IGdldF9jb250YWluZWRfYmxvY2tzKCBzdGFjay5sZW5ndGgsIG5leHQgKTtcblxuICAgICAgICAgIC8vIERlYWwgd2l0aCBjb2RlIGJsb2NrcyBvciBwcm9wZXJseSBuZXN0ZWQgbGlzdHNcbiAgICAgICAgICBpZiAoIGNvbnRhaW5lZC5sZW5ndGggPiAwICkge1xuICAgICAgICAgICAgLy8gTWFrZSBzdXJlIGFsbCBsaXN0aXRlbXMgdXAgdGhlIHN0YWNrIGFyZSBwYXJhZ3JhcGhzXG4gICAgICAgICAgICBmb3JFYWNoKCBzdGFjaywgcGFyYWdyYXBoaWZ5LCB0aGlzKTtcblxuICAgICAgICAgICAgbGFzdF9saS5wdXNoLmFwcGx5KCBsYXN0X2xpLCB0aGlzLnRvVHJlZSggY29udGFpbmVkLCBbXSApICk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdmFyIG5leHRfYmxvY2sgPSBuZXh0WzBdICYmIG5leHRbMF0udmFsdWVPZigpIHx8IFwiXCI7XG5cbiAgICAgICAgICBpZiAoIG5leHRfYmxvY2subWF0Y2goaXNfbGlzdF9yZSkgfHwgbmV4dF9ibG9jay5tYXRjaCggL14gLyApICkge1xuICAgICAgICAgICAgYmxvY2sgPSBuZXh0LnNoaWZ0KCk7XG5cbiAgICAgICAgICAgIC8vIENoZWNrIGZvciBhbiBIUiBmb2xsb3dpbmcgYSBsaXN0OiBmZWF0dXJlcy9saXN0cy9ocl9hYnV0dGluZ1xuICAgICAgICAgICAgdmFyIGhyID0gdGhpcy5kaWFsZWN0LmJsb2NrLmhvcml6UnVsZSggYmxvY2ssIG5leHQgKTtcblxuICAgICAgICAgICAgaWYgKCBociApIHtcbiAgICAgICAgICAgICAgcmV0LnB1c2guYXBwbHkocmV0LCBocik7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBNYWtlIHN1cmUgYWxsIGxpc3RpdGVtcyB1cCB0aGUgc3RhY2sgYXJlIHBhcmFncmFwaHNcbiAgICAgICAgICAgIGZvckVhY2goIHN0YWNrLCBwYXJhZ3JhcGhpZnksIHRoaXMpO1xuXG4gICAgICAgICAgICBsb29zZSA9IHRydWU7XG4gICAgICAgICAgICBjb250aW51ZSBsb29zZV9zZWFyY2g7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9IC8vIGxvb3NlX3NlYXJjaFxuXG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgICB9O1xuICAgIH0pKCksXG5cbiAgICBibG9ja3F1b3RlOiBmdW5jdGlvbiBibG9ja3F1b3RlKCBibG9jaywgbmV4dCApIHtcbiAgICAgIGlmICggIWJsb2NrLm1hdGNoKCAvXj4vbSApIClcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcblxuICAgICAgdmFyIGpzb25tbCA9IFtdO1xuXG4gICAgICAvLyBzZXBhcmF0ZSBvdXQgdGhlIGxlYWRpbmcgYWJ1dHRpbmcgYmxvY2ssIGlmIGFueS4gSS5lLiBpbiB0aGlzIGNhc2U6XG4gICAgICAvL1xuICAgICAgLy8gIGFcbiAgICAgIC8vICA+IGJcbiAgICAgIC8vXG4gICAgICBpZiAoIGJsb2NrWyAwIF0gIT0gXCI+XCIgKSB7XG4gICAgICAgIHZhciBsaW5lcyA9IGJsb2NrLnNwbGl0KCAvXFxuLyApLFxuICAgICAgICAgICAgcHJldiA9IFtdLFxuICAgICAgICAgICAgbGluZV9ubyA9IGJsb2NrLmxpbmVOdW1iZXI7XG5cbiAgICAgICAgLy8ga2VlcCBzaGlmdGluZyBsaW5lcyB1bnRpbCB5b3UgZmluZCBhIGNyb3RjaGV0XG4gICAgICAgIHdoaWxlICggbGluZXMubGVuZ3RoICYmIGxpbmVzWyAwIF1bIDAgXSAhPSBcIj5cIiApIHtcbiAgICAgICAgICAgIHByZXYucHVzaCggbGluZXMuc2hpZnQoKSApO1xuICAgICAgICAgICAgbGluZV9ubysrO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGFidXR0aW5nID0gbWtfYmxvY2soIHByZXYuam9pbiggXCJcXG5cIiApLCBcIlxcblwiLCBibG9jay5saW5lTnVtYmVyICk7XG4gICAgICAgIGpzb25tbC5wdXNoLmFwcGx5KCBqc29ubWwsIHRoaXMucHJvY2Vzc0Jsb2NrKCBhYnV0dGluZywgW10gKSApO1xuICAgICAgICAvLyByZWFzc2VtYmxlIG5ldyBibG9jayBvZiBqdXN0IGJsb2NrIHF1b3RlcyFcbiAgICAgICAgYmxvY2sgPSBta19ibG9jayggbGluZXMuam9pbiggXCJcXG5cIiApLCBibG9jay50cmFpbGluZywgbGluZV9ubyApO1xuICAgICAgfVxuXG5cbiAgICAgIC8vIGlmIHRoZSBuZXh0IGJsb2NrIGlzIGFsc28gYSBibG9ja3F1b3RlIG1lcmdlIGl0IGluXG4gICAgICB3aGlsZSAoIG5leHQubGVuZ3RoICYmIG5leHRbIDAgXVsgMCBdID09IFwiPlwiICkge1xuICAgICAgICB2YXIgYiA9IG5leHQuc2hpZnQoKTtcbiAgICAgICAgYmxvY2sgPSBta19ibG9jayggYmxvY2sgKyBibG9jay50cmFpbGluZyArIGIsIGIudHJhaWxpbmcsIGJsb2NrLmxpbmVOdW1iZXIgKTtcbiAgICAgIH1cblxuICAgICAgLy8gU3RyaXAgb2ZmIHRoZSBsZWFkaW5nIFwiPiBcIiBhbmQgcmUtcHJvY2VzcyBhcyBhIGJsb2NrLlxuICAgICAgdmFyIGlucHV0ID0gYmxvY2sucmVwbGFjZSggL14+ID8vZ20sIFwiXCIgKSxcbiAgICAgICAgICBvbGRfdHJlZSA9IHRoaXMudHJlZSxcbiAgICAgICAgICBwcm9jZXNzZWRCbG9jayA9IHRoaXMudG9UcmVlKCBpbnB1dCwgWyBcImJsb2NrcXVvdGVcIiBdICksXG4gICAgICAgICAgYXR0ciA9IGV4dHJhY3RfYXR0ciggcHJvY2Vzc2VkQmxvY2sgKTtcblxuICAgICAgLy8gSWYgYW55IGxpbmsgcmVmZXJlbmNlcyB3ZXJlIGZvdW5kIGdldCByaWQgb2YgdGhlbVxuICAgICAgaWYgKCBhdHRyICYmIGF0dHIucmVmZXJlbmNlcyApIHtcbiAgICAgICAgZGVsZXRlIGF0dHIucmVmZXJlbmNlcztcbiAgICAgICAgLy8gQW5kIHRoZW4gcmVtb3ZlIHRoZSBhdHRyaWJ1dGUgb2JqZWN0IGlmIGl0J3MgZW1wdHlcbiAgICAgICAgaWYgKCBpc0VtcHR5KCBhdHRyICkgKSB7XG4gICAgICAgICAgcHJvY2Vzc2VkQmxvY2suc3BsaWNlKCAxLCAxICk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAganNvbm1sLnB1c2goIHByb2Nlc3NlZEJsb2NrICk7XG4gICAgICByZXR1cm4ganNvbm1sO1xuICAgIH0sXG5cbiAgICByZWZlcmVuY2VEZWZuOiBmdW5jdGlvbiByZWZlcmVuY2VEZWZuKCBibG9jaywgbmV4dCkge1xuICAgICAgdmFyIHJlID0gL15cXHMqXFxbKC4qPylcXF06XFxzKihcXFMrKSg/OlxccysoPzooWydcIl0pKC4qPylcXDN8XFwoKC4qPylcXCkpKT9cXG4/LztcbiAgICAgIC8vIGludGVyZXN0aW5nIG1hdGNoZXMgYXJlIFsgLCByZWZfaWQsIHVybCwgLCB0aXRsZSwgdGl0bGUgXVxuXG4gICAgICBpZiAoICFibG9jay5tYXRjaChyZSkgKVxuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuXG4gICAgICAvLyBtYWtlIGFuIGF0dHJpYnV0ZSBub2RlIGlmIGl0IGRvZXNuJ3QgZXhpc3RcbiAgICAgIGlmICggIWV4dHJhY3RfYXR0ciggdGhpcy50cmVlICkgKSB7XG4gICAgICAgIHRoaXMudHJlZS5zcGxpY2UoIDEsIDAsIHt9ICk7XG4gICAgICB9XG5cbiAgICAgIHZhciBhdHRycyA9IGV4dHJhY3RfYXR0ciggdGhpcy50cmVlICk7XG5cbiAgICAgIC8vIG1ha2UgYSByZWZlcmVuY2VzIGhhc2ggaWYgaXQgZG9lc24ndCBleGlzdFxuICAgICAgaWYgKCBhdHRycy5yZWZlcmVuY2VzID09PSB1bmRlZmluZWQgKSB7XG4gICAgICAgIGF0dHJzLnJlZmVyZW5jZXMgPSB7fTtcbiAgICAgIH1cblxuICAgICAgdmFyIGIgPSB0aGlzLmxvb3BfcmVfb3Zlcl9ibG9jayhyZSwgYmxvY2ssIGZ1bmN0aW9uKCBtICkge1xuXG4gICAgICAgIGlmICggbVsyXSAmJiBtWzJdWzBdID09IFwiPFwiICYmIG1bMl1bbVsyXS5sZW5ndGgtMV0gPT0gXCI+XCIgKVxuICAgICAgICAgIG1bMl0gPSBtWzJdLnN1YnN0cmluZyggMSwgbVsyXS5sZW5ndGggLSAxICk7XG5cbiAgICAgICAgdmFyIHJlZiA9IGF0dHJzLnJlZmVyZW5jZXNbIG1bMV0udG9Mb3dlckNhc2UoKSBdID0ge1xuICAgICAgICAgIGhyZWY6IG1bMl1cbiAgICAgICAgfTtcblxuICAgICAgICBpZiAoIG1bNF0gIT09IHVuZGVmaW5lZCApXG4gICAgICAgICAgcmVmLnRpdGxlID0gbVs0XTtcbiAgICAgICAgZWxzZSBpZiAoIG1bNV0gIT09IHVuZGVmaW5lZCApXG4gICAgICAgICAgcmVmLnRpdGxlID0gbVs1XTtcblxuICAgICAgfSApO1xuXG4gICAgICBpZiAoIGIubGVuZ3RoIClcbiAgICAgICAgbmV4dC51bnNoaWZ0KCBta19ibG9jayggYiwgYmxvY2sudHJhaWxpbmcgKSApO1xuXG4gICAgICByZXR1cm4gW107XG4gICAgfSxcblxuICAgIHBhcmE6IGZ1bmN0aW9uIHBhcmEoIGJsb2NrLCBuZXh0ICkge1xuICAgICAgLy8gZXZlcnl0aGluZydzIGEgcGFyYSFcbiAgICAgIHJldHVybiBbIFtcInBhcmFcIl0uY29uY2F0KCB0aGlzLnByb2Nlc3NJbmxpbmUoIGJsb2NrICkgKSBdO1xuICAgIH1cbiAgfVxufTtcblxuTWFya2Rvd24uZGlhbGVjdHMuR3J1YmVyLmlubGluZSA9IHtcblxuICAgIF9fb25lRWxlbWVudF9fOiBmdW5jdGlvbiBvbmVFbGVtZW50KCB0ZXh0LCBwYXR0ZXJuc19vcl9yZSwgcHJldmlvdXNfbm9kZXMgKSB7XG4gICAgICB2YXIgbSxcbiAgICAgICAgICByZXMsXG4gICAgICAgICAgbGFzdEluZGV4ID0gMDtcblxuICAgICAgcGF0dGVybnNfb3JfcmUgPSBwYXR0ZXJuc19vcl9yZSB8fCB0aGlzLmRpYWxlY3QuaW5saW5lLl9fcGF0dGVybnNfXztcbiAgICAgIHZhciByZSA9IG5ldyBSZWdFeHAoIFwiKFtcXFxcc1xcXFxTXSo/KShcIiArIChwYXR0ZXJuc19vcl9yZS5zb3VyY2UgfHwgcGF0dGVybnNfb3JfcmUpICsgXCIpXCIgKTtcblxuICAgICAgbSA9IHJlLmV4ZWMoIHRleHQgKTtcbiAgICAgIGlmICghbSkge1xuICAgICAgICAvLyBKdXN0IGJvcmluZyB0ZXh0XG4gICAgICAgIHJldHVybiBbIHRleHQubGVuZ3RoLCB0ZXh0IF07XG4gICAgICB9XG4gICAgICBlbHNlIGlmICggbVsxXSApIHtcbiAgICAgICAgLy8gU29tZSB1bi1pbnRlcmVzdGluZyB0ZXh0IG1hdGNoZWQuIFJldHVybiB0aGF0IGZpcnN0XG4gICAgICAgIHJldHVybiBbIG1bMV0ubGVuZ3RoLCBtWzFdIF07XG4gICAgICB9XG5cbiAgICAgIHZhciByZXM7XG4gICAgICBpZiAoIG1bMl0gaW4gdGhpcy5kaWFsZWN0LmlubGluZSApIHtcbiAgICAgICAgcmVzID0gdGhpcy5kaWFsZWN0LmlubGluZVsgbVsyXSBdLmNhbGwoXG4gICAgICAgICAgICAgICAgICB0aGlzLFxuICAgICAgICAgICAgICAgICAgdGV4dC5zdWJzdHIoIG0uaW5kZXggKSwgbSwgcHJldmlvdXNfbm9kZXMgfHwgW10gKTtcbiAgICAgIH1cbiAgICAgIC8vIERlZmF1bHQgZm9yIG5vdyB0byBtYWtlIGRldiBlYXNpZXIuIGp1c3Qgc2x1cnAgc3BlY2lhbCBhbmQgb3V0cHV0IGl0LlxuICAgICAgcmVzID0gcmVzIHx8IFsgbVsyXS5sZW5ndGgsIG1bMl0gXTtcbiAgICAgIHJldHVybiByZXM7XG4gICAgfSxcblxuICAgIF9fY2FsbF9fOiBmdW5jdGlvbiBpbmxpbmUoIHRleHQsIHBhdHRlcm5zICkge1xuXG4gICAgICB2YXIgb3V0ID0gW10sXG4gICAgICAgICAgcmVzO1xuXG4gICAgICBmdW5jdGlvbiBhZGQoeCkge1xuICAgICAgICAvL0Q6c2VsZi5kZWJ1ZyhcIiAgYWRkaW5nIG91dHB1dFwiLCB1bmV2YWwoeCkpO1xuICAgICAgICBpZiAoIHR5cGVvZiB4ID09IFwic3RyaW5nXCIgJiYgdHlwZW9mIG91dFtvdXQubGVuZ3RoLTFdID09IFwic3RyaW5nXCIgKVxuICAgICAgICAgIG91dFsgb3V0Lmxlbmd0aC0xIF0gKz0geDtcbiAgICAgICAgZWxzZVxuICAgICAgICAgIG91dC5wdXNoKHgpO1xuICAgICAgfVxuXG4gICAgICB3aGlsZSAoIHRleHQubGVuZ3RoID4gMCApIHtcbiAgICAgICAgcmVzID0gdGhpcy5kaWFsZWN0LmlubGluZS5fX29uZUVsZW1lbnRfXy5jYWxsKHRoaXMsIHRleHQsIHBhdHRlcm5zLCBvdXQgKTtcbiAgICAgICAgdGV4dCA9IHRleHQuc3Vic3RyKCByZXMuc2hpZnQoKSApO1xuICAgICAgICBmb3JFYWNoKHJlcywgYWRkIClcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIG91dDtcbiAgICB9LFxuXG4gICAgLy8gVGhlc2UgY2hhcmFjdGVycyBhcmUgaW50ZXJzdGluZyBlbHNld2hlcmUsIHNvIGhhdmUgcnVsZXMgZm9yIHRoZW0gc28gdGhhdFxuICAgIC8vIGNodW5rcyBvZiBwbGFpbiB0ZXh0IGJsb2NrcyBkb24ndCBpbmNsdWRlIHRoZW1cbiAgICBcIl1cIjogZnVuY3Rpb24gKCkge30sXG4gICAgXCJ9XCI6IGZ1bmN0aW9uICgpIHt9LFxuXG4gICAgX19lc2NhcGVfXyA6IC9eXFxcXFtcXFxcYFxcKl97fVxcW1xcXSgpI1xcKy4hXFwtXS8sXG5cbiAgICBcIlxcXFxcIjogZnVuY3Rpb24gZXNjYXBlZCggdGV4dCApIHtcbiAgICAgIC8vIFsgbGVuZ3RoIG9mIGlucHV0IHByb2Nlc3NlZCwgbm9kZS9jaGlsZHJlbiB0byBhZGQuLi4gXVxuICAgICAgLy8gT25seSBlc2FjYXBlOiBcXCBgICogXyB7IH0gWyBdICggKSAjICogKyAtIC4gIVxuICAgICAgaWYgKCB0aGlzLmRpYWxlY3QuaW5saW5lLl9fZXNjYXBlX18uZXhlYyggdGV4dCApIClcbiAgICAgICAgcmV0dXJuIFsgMiwgdGV4dC5jaGFyQXQoIDEgKSBdO1xuICAgICAgZWxzZVxuICAgICAgICAvLyBOb3QgYW4gZXNhY3BlXG4gICAgICAgIHJldHVybiBbIDEsIFwiXFxcXFwiIF07XG4gICAgfSxcblxuICAgIFwiIVtcIjogZnVuY3Rpb24gaW1hZ2UoIHRleHQgKSB7XG5cbiAgICAgIC8vIFVubGlrZSBpbWFnZXMsIGFsdCB0ZXh0IGlzIHBsYWluIHRleHQgb25seS4gbm8gb3RoZXIgZWxlbWVudHMgYXJlXG4gICAgICAvLyBhbGxvd2VkIGluIHRoZXJlXG5cbiAgICAgIC8vICFbQWx0IHRleHRdKC9wYXRoL3RvL2ltZy5qcGcgXCJPcHRpb25hbCB0aXRsZVwiKVxuICAgICAgLy8gICAgICAxICAgICAgICAgIDIgICAgICAgICAgICAzICAgICAgIDQgICAgICAgICA8LS0tIGNhcHR1cmVzXG4gICAgICB2YXIgbSA9IHRleHQubWF0Y2goIC9eIVxcWyguKj8pXFxdWyBcXHRdKlxcKFsgXFx0XSooW15cIildKj8pKD86WyBcXHRdKyhbXCInXSkoLio/KVxcMyk/WyBcXHRdKlxcKS8gKTtcblxuICAgICAgaWYgKCBtICkge1xuICAgICAgICBpZiAoIG1bMl0gJiYgbVsyXVswXSA9PSBcIjxcIiAmJiBtWzJdW21bMl0ubGVuZ3RoLTFdID09IFwiPlwiIClcbiAgICAgICAgICBtWzJdID0gbVsyXS5zdWJzdHJpbmcoIDEsIG1bMl0ubGVuZ3RoIC0gMSApO1xuXG4gICAgICAgIG1bMl0gPSB0aGlzLmRpYWxlY3QuaW5saW5lLl9fY2FsbF9fLmNhbGwoIHRoaXMsIG1bMl0sIC9cXFxcLyApWzBdO1xuXG4gICAgICAgIHZhciBhdHRycyA9IHsgYWx0OiBtWzFdLCBocmVmOiBtWzJdIHx8IFwiXCIgfTtcbiAgICAgICAgaWYgKCBtWzRdICE9PSB1bmRlZmluZWQpXG4gICAgICAgICAgYXR0cnMudGl0bGUgPSBtWzRdO1xuXG4gICAgICAgIHJldHVybiBbIG1bMF0ubGVuZ3RoLCBbIFwiaW1nXCIsIGF0dHJzIF0gXTtcbiAgICAgIH1cblxuICAgICAgLy8gIVtBbHQgdGV4dF1baWRdXG4gICAgICBtID0gdGV4dC5tYXRjaCggL14hXFxbKC4qPylcXF1bIFxcdF0qXFxbKC4qPylcXF0vICk7XG5cbiAgICAgIGlmICggbSApIHtcbiAgICAgICAgLy8gV2UgY2FuJ3QgY2hlY2sgaWYgdGhlIHJlZmVyZW5jZSBpcyBrbm93biBoZXJlIGFzIGl0IGxpa2VseSB3b250IGJlXG4gICAgICAgIC8vIGZvdW5kIHRpbGwgYWZ0ZXIuIENoZWNrIGl0IGluIG1kIHRyZWUtPmhtdGwgdHJlZSBjb252ZXJzaW9uXG4gICAgICAgIHJldHVybiBbIG1bMF0ubGVuZ3RoLCBbIFwiaW1nX3JlZlwiLCB7IGFsdDogbVsxXSwgcmVmOiBtWzJdLnRvTG93ZXJDYXNlKCksIG9yaWdpbmFsOiBtWzBdIH0gXSBdO1xuICAgICAgfVxuXG4gICAgICAvLyBKdXN0IGNvbnN1bWUgdGhlICchWydcbiAgICAgIHJldHVybiBbIDIsIFwiIVtcIiBdO1xuICAgIH0sXG5cbiAgICBcIltcIjogZnVuY3Rpb24gbGluayggdGV4dCApIHtcblxuICAgICAgdmFyIG9yaWcgPSBTdHJpbmcodGV4dCk7XG4gICAgICAvLyBJbmxpbmUgY29udGVudCBpcyBwb3NzaWJsZSBpbnNpZGUgYGxpbmsgdGV4dGBcbiAgICAgIHZhciByZXMgPSBNYXJrZG93bi5EaWFsZWN0SGVscGVycy5pbmxpbmVfdW50aWxfY2hhci5jYWxsKCB0aGlzLCB0ZXh0LnN1YnN0cigxKSwgXCJdXCIgKTtcblxuICAgICAgLy8gTm8gY2xvc2luZyAnXScgZm91bmQuIEp1c3QgY29uc3VtZSB0aGUgW1xuICAgICAgaWYgKCAhcmVzICkgcmV0dXJuIFsgMSwgXCJbXCIgXTtcblxuICAgICAgdmFyIGNvbnN1bWVkID0gMSArIHJlc1sgMCBdLFxuICAgICAgICAgIGNoaWxkcmVuID0gcmVzWyAxIF0sXG4gICAgICAgICAgbGluayxcbiAgICAgICAgICBhdHRycztcblxuICAgICAgLy8gQXQgdGhpcyBwb2ludCB0aGUgZmlyc3QgWy4uLl0gaGFzIGJlZW4gcGFyc2VkLiBTZWUgd2hhdCBmb2xsb3dzIHRvIGZpbmRcbiAgICAgIC8vIG91dCB3aGljaCBraW5kIG9mIGxpbmsgd2UgYXJlIChyZWZlcmVuY2Ugb3IgZGlyZWN0IHVybClcbiAgICAgIHRleHQgPSB0ZXh0LnN1YnN0ciggY29uc3VtZWQgKTtcblxuICAgICAgLy8gW2xpbmsgdGV4dF0oL3BhdGgvdG8vaW1nLmpwZyBcIk9wdGlvbmFsIHRpdGxlXCIpXG4gICAgICAvLyAgICAgICAgICAgICAgICAgMSAgICAgICAgICAgIDIgICAgICAgMyAgICAgICAgIDwtLS0gY2FwdHVyZXNcbiAgICAgIC8vIFRoaXMgd2lsbCBjYXB0dXJlIHVwIHRvIHRoZSBsYXN0IHBhcmVuIGluIHRoZSBibG9jay4gV2UgdGhlbiBwdWxsXG4gICAgICAvLyBiYWNrIGJhc2VkIG9uIGlmIHRoZXJlIGEgbWF0Y2hpbmcgb25lcyBpbiB0aGUgdXJsXG4gICAgICAvLyAgICAoW2hlcmVdKC91cmwvKHRlc3QpKVxuICAgICAgLy8gVGhlIHBhcmVucyBoYXZlIHRvIGJlIGJhbGFuY2VkXG4gICAgICB2YXIgbSA9IHRleHQubWF0Y2goIC9eXFxzKlxcKFsgXFx0XSooW15cIiddKikoPzpbIFxcdF0rKFtcIiddKSguKj8pXFwyKT9bIFxcdF0qXFwpLyApO1xuICAgICAgaWYgKCBtICkge1xuICAgICAgICB2YXIgdXJsID0gbVsxXTtcbiAgICAgICAgY29uc3VtZWQgKz0gbVswXS5sZW5ndGg7XG5cbiAgICAgICAgaWYgKCB1cmwgJiYgdXJsWzBdID09IFwiPFwiICYmIHVybFt1cmwubGVuZ3RoLTFdID09IFwiPlwiIClcbiAgICAgICAgICB1cmwgPSB1cmwuc3Vic3RyaW5nKCAxLCB1cmwubGVuZ3RoIC0gMSApO1xuXG4gICAgICAgIC8vIElmIHRoZXJlIGlzIGEgdGl0bGUgd2UgZG9uJ3QgaGF2ZSB0byB3b3JyeSBhYm91dCBwYXJlbnMgaW4gdGhlIHVybFxuICAgICAgICBpZiAoICFtWzNdICkge1xuICAgICAgICAgIHZhciBvcGVuX3BhcmVucyA9IDE7IC8vIE9uZSBvcGVuIHRoYXQgaXNuJ3QgaW4gdGhlIGNhcHR1cmVcbiAgICAgICAgICBmb3IgKCB2YXIgbGVuID0gMDsgbGVuIDwgdXJsLmxlbmd0aDsgbGVuKysgKSB7XG4gICAgICAgICAgICBzd2l0Y2ggKCB1cmxbbGVuXSApIHtcbiAgICAgICAgICAgIGNhc2UgXCIoXCI6XG4gICAgICAgICAgICAgIG9wZW5fcGFyZW5zKys7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcIilcIjpcbiAgICAgICAgICAgICAgaWYgKCAtLW9wZW5fcGFyZW5zID09IDApIHtcbiAgICAgICAgICAgICAgICBjb25zdW1lZCAtPSB1cmwubGVuZ3RoIC0gbGVuO1xuICAgICAgICAgICAgICAgIHVybCA9IHVybC5zdWJzdHJpbmcoMCwgbGVuKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBQcm9jZXNzIGVzY2FwZXMgb25seVxuICAgICAgICB1cmwgPSB0aGlzLmRpYWxlY3QuaW5saW5lLl9fY2FsbF9fLmNhbGwoIHRoaXMsIHVybCwgL1xcXFwvIClbMF07XG5cbiAgICAgICAgYXR0cnMgPSB7IGhyZWY6IHVybCB8fCBcIlwiIH07XG4gICAgICAgIGlmICggbVszXSAhPT0gdW5kZWZpbmVkKVxuICAgICAgICAgIGF0dHJzLnRpdGxlID0gbVszXTtcblxuICAgICAgICBsaW5rID0gWyBcImxpbmtcIiwgYXR0cnMgXS5jb25jYXQoIGNoaWxkcmVuICk7XG4gICAgICAgIHJldHVybiBbIGNvbnN1bWVkLCBsaW5rIF07XG4gICAgICB9XG5cbiAgICAgIC8vIFtBbHQgdGV4dF1baWRdXG4gICAgICAvLyBbQWx0IHRleHRdIFtpZF1cbiAgICAgIG0gPSB0ZXh0Lm1hdGNoKCAvXlxccypcXFsoLio/KVxcXS8gKTtcblxuICAgICAgaWYgKCBtICkge1xuXG4gICAgICAgIGNvbnN1bWVkICs9IG1bIDAgXS5sZW5ndGg7XG5cbiAgICAgICAgLy8gW2xpbmtzXVtdIHVzZXMgbGlua3MgYXMgaXRzIHJlZmVyZW5jZVxuICAgICAgICBhdHRycyA9IHsgcmVmOiAoIG1bIDEgXSB8fCBTdHJpbmcoY2hpbGRyZW4pICkudG9Mb3dlckNhc2UoKSwgIG9yaWdpbmFsOiBvcmlnLnN1YnN0ciggMCwgY29uc3VtZWQgKSB9O1xuXG4gICAgICAgIGxpbmsgPSBbIFwibGlua19yZWZcIiwgYXR0cnMgXS5jb25jYXQoIGNoaWxkcmVuICk7XG5cbiAgICAgICAgLy8gV2UgY2FuJ3QgY2hlY2sgaWYgdGhlIHJlZmVyZW5jZSBpcyBrbm93biBoZXJlIGFzIGl0IGxpa2VseSB3b250IGJlXG4gICAgICAgIC8vIGZvdW5kIHRpbGwgYWZ0ZXIuIENoZWNrIGl0IGluIG1kIHRyZWUtPmhtdGwgdHJlZSBjb252ZXJzaW9uLlxuICAgICAgICAvLyBTdG9yZSB0aGUgb3JpZ2luYWwgc28gdGhhdCBjb252ZXJzaW9uIGNhbiByZXZlcnQgaWYgdGhlIHJlZiBpc24ndCBmb3VuZC5cbiAgICAgICAgcmV0dXJuIFsgY29uc3VtZWQsIGxpbmsgXTtcbiAgICAgIH1cblxuICAgICAgLy8gW2lkXVxuICAgICAgLy8gT25seSBpZiBpZCBpcyBwbGFpbiAobm8gZm9ybWF0dGluZy4pXG4gICAgICBpZiAoIGNoaWxkcmVuLmxlbmd0aCA9PSAxICYmIHR5cGVvZiBjaGlsZHJlblswXSA9PSBcInN0cmluZ1wiICkge1xuXG4gICAgICAgIGF0dHJzID0geyByZWY6IGNoaWxkcmVuWzBdLnRvTG93ZXJDYXNlKCksICBvcmlnaW5hbDogb3JpZy5zdWJzdHIoIDAsIGNvbnN1bWVkICkgfTtcbiAgICAgICAgbGluayA9IFsgXCJsaW5rX3JlZlwiLCBhdHRycywgY2hpbGRyZW5bMF0gXTtcbiAgICAgICAgcmV0dXJuIFsgY29uc3VtZWQsIGxpbmsgXTtcbiAgICAgIH1cblxuICAgICAgLy8gSnVzdCBjb25zdW1lIHRoZSBcIltcIlxuICAgICAgcmV0dXJuIFsgMSwgXCJbXCIgXTtcbiAgICB9LFxuXG5cbiAgICBcIjxcIjogZnVuY3Rpb24gYXV0b0xpbmsoIHRleHQgKSB7XG4gICAgICB2YXIgbTtcblxuICAgICAgaWYgKCAoIG0gPSB0ZXh0Lm1hdGNoKCAvXjwoPzooKGh0dHBzP3xmdHB8bWFpbHRvKTpbXj5dKyl8KC4qP0AuKj9cXC5bYS16QS1aXSspKT4vICkgKSAhPSBudWxsICkge1xuICAgICAgICBpZiAoIG1bM10gKSB7XG4gICAgICAgICAgcmV0dXJuIFsgbVswXS5sZW5ndGgsIFsgXCJsaW5rXCIsIHsgaHJlZjogXCJtYWlsdG86XCIgKyBtWzNdIH0sIG1bM10gXSBdO1xuXG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoIG1bMl0gPT0gXCJtYWlsdG9cIiApIHtcbiAgICAgICAgICByZXR1cm4gWyBtWzBdLmxlbmd0aCwgWyBcImxpbmtcIiwgeyBocmVmOiBtWzFdIH0sIG1bMV0uc3Vic3RyKFwibWFpbHRvOlwiLmxlbmd0aCApIF0gXTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlXG4gICAgICAgICAgcmV0dXJuIFsgbVswXS5sZW5ndGgsIFsgXCJsaW5rXCIsIHsgaHJlZjogbVsxXSB9LCBtWzFdIF0gXTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIFsgMSwgXCI8XCIgXTtcbiAgICB9LFxuXG4gICAgXCJgXCI6IGZ1bmN0aW9uIGlubGluZUNvZGUoIHRleHQgKSB7XG4gICAgICAvLyBJbmxpbmUgY29kZSBibG9jay4gYXMgbWFueSBiYWNrdGlja3MgYXMgeW91IGxpa2UgdG8gc3RhcnQgaXRcbiAgICAgIC8vIEFsd2F5cyBza2lwIG92ZXIgdGhlIG9wZW5pbmcgdGlja3MuXG4gICAgICB2YXIgbSA9IHRleHQubWF0Y2goIC8oYCspKChbXFxzXFxTXSo/KVxcMSkvICk7XG5cbiAgICAgIGlmICggbSAmJiBtWzJdIClcbiAgICAgICAgcmV0dXJuIFsgbVsxXS5sZW5ndGggKyBtWzJdLmxlbmd0aCwgWyBcImlubGluZWNvZGVcIiwgbVszXSBdIF07XG4gICAgICBlbHNlIHtcbiAgICAgICAgLy8gVE9ETzogTm8gbWF0Y2hpbmcgZW5kIGNvZGUgZm91bmQgLSB3YXJuIVxuICAgICAgICByZXR1cm4gWyAxLCBcImBcIiBdO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICBcIiAgXFxuXCI6IGZ1bmN0aW9uIGxpbmVCcmVhayggdGV4dCApIHtcbiAgICAgIHJldHVybiBbIDMsIFsgXCJsaW5lYnJlYWtcIiBdIF07XG4gICAgfVxuXG59O1xuXG4vLyBNZXRhIEhlbHBlci9nZW5lcmF0b3IgbWV0aG9kIGZvciBlbSBhbmQgc3Ryb25nIGhhbmRsaW5nXG5mdW5jdGlvbiBzdHJvbmdfZW0oIHRhZywgbWQgKSB7XG5cbiAgdmFyIHN0YXRlX3Nsb3QgPSB0YWcgKyBcIl9zdGF0ZVwiLFxuICAgICAgb3RoZXJfc2xvdCA9IHRhZyA9PSBcInN0cm9uZ1wiID8gXCJlbV9zdGF0ZVwiIDogXCJzdHJvbmdfc3RhdGVcIjtcblxuICBmdW5jdGlvbiBDbG9zZVRhZyhsZW4pIHtcbiAgICB0aGlzLmxlbl9hZnRlciA9IGxlbjtcbiAgICB0aGlzLm5hbWUgPSBcImNsb3NlX1wiICsgbWQ7XG4gIH1cblxuICByZXR1cm4gZnVuY3Rpb24gKCB0ZXh0LCBvcmlnX21hdGNoICkge1xuXG4gICAgaWYgKCB0aGlzW3N0YXRlX3Nsb3RdWzBdID09IG1kICkge1xuICAgICAgLy8gTW9zdCByZWNlbnQgZW0gaXMgb2YgdGhpcyB0eXBlXG4gICAgICAvL0Q6dGhpcy5kZWJ1ZyhcImNsb3NpbmdcIiwgbWQpO1xuICAgICAgdGhpc1tzdGF0ZV9zbG90XS5zaGlmdCgpO1xuXG4gICAgICAvLyBcIkNvbnN1bWVcIiBldmVyeXRoaW5nIHRvIGdvIGJhY2sgdG8gdGhlIHJlY3J1c2lvbiBpbiB0aGUgZWxzZS1ibG9jayBiZWxvd1xuICAgICAgcmV0dXJuWyB0ZXh0Lmxlbmd0aCwgbmV3IENsb3NlVGFnKHRleHQubGVuZ3RoLW1kLmxlbmd0aCkgXTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAvLyBTdG9yZSBhIGNsb25lIG9mIHRoZSBlbS9zdHJvbmcgc3RhdGVzXG4gICAgICB2YXIgb3RoZXIgPSB0aGlzW290aGVyX3Nsb3RdLnNsaWNlKCksXG4gICAgICAgICAgc3RhdGUgPSB0aGlzW3N0YXRlX3Nsb3RdLnNsaWNlKCk7XG5cbiAgICAgIHRoaXNbc3RhdGVfc2xvdF0udW5zaGlmdChtZCk7XG5cbiAgICAgIC8vRDp0aGlzLmRlYnVnX2luZGVudCArPSBcIiAgXCI7XG5cbiAgICAgIC8vIFJlY3Vyc2VcbiAgICAgIHZhciByZXMgPSB0aGlzLnByb2Nlc3NJbmxpbmUoIHRleHQuc3Vic3RyKCBtZC5sZW5ndGggKSApO1xuICAgICAgLy9EOnRoaXMuZGVidWdfaW5kZW50ID0gdGhpcy5kZWJ1Z19pbmRlbnQuc3Vic3RyKDIpO1xuXG4gICAgICB2YXIgbGFzdCA9IHJlc1tyZXMubGVuZ3RoIC0gMV07XG5cbiAgICAgIC8vRDp0aGlzLmRlYnVnKFwicHJvY2Vzc0lubGluZSBmcm9tXCIsIHRhZyArIFwiOiBcIiwgdW5ldmFsKCByZXMgKSApO1xuXG4gICAgICB2YXIgY2hlY2sgPSB0aGlzW3N0YXRlX3Nsb3RdLnNoaWZ0KCk7XG4gICAgICBpZiAoIGxhc3QgaW5zdGFuY2VvZiBDbG9zZVRhZyApIHtcbiAgICAgICAgcmVzLnBvcCgpO1xuICAgICAgICAvLyBXZSBtYXRjaGVkISBIdXp6YWguXG4gICAgICAgIHZhciBjb25zdW1lZCA9IHRleHQubGVuZ3RoIC0gbGFzdC5sZW5fYWZ0ZXI7XG4gICAgICAgIHJldHVybiBbIGNvbnN1bWVkLCBbIHRhZyBdLmNvbmNhdChyZXMpIF07XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgLy8gUmVzdG9yZSB0aGUgc3RhdGUgb2YgdGhlIG90aGVyIGtpbmQuIFdlIG1pZ2h0IGhhdmUgbWlzdGFrZW5seSBjbG9zZWQgaXQuXG4gICAgICAgIHRoaXNbb3RoZXJfc2xvdF0gPSBvdGhlcjtcbiAgICAgICAgdGhpc1tzdGF0ZV9zbG90XSA9IHN0YXRlO1xuXG4gICAgICAgIC8vIFdlIGNhbid0IHJldXNlIHRoZSBwcm9jZXNzZWQgcmVzdWx0IGFzIGl0IGNvdWxkIGhhdmUgd3JvbmcgcGFyc2luZyBjb250ZXh0cyBpbiBpdC5cbiAgICAgICAgcmV0dXJuIFsgbWQubGVuZ3RoLCBtZCBdO1xuICAgICAgfVxuICAgIH1cbiAgfTsgLy8gRW5kIHJldHVybmVkIGZ1bmN0aW9uXG59XG5cbk1hcmtkb3duLmRpYWxlY3RzLkdydWJlci5pbmxpbmVbXCIqKlwiXSA9IHN0cm9uZ19lbShcInN0cm9uZ1wiLCBcIioqXCIpO1xuTWFya2Rvd24uZGlhbGVjdHMuR3J1YmVyLmlubGluZVtcIl9fXCJdID0gc3Ryb25nX2VtKFwic3Ryb25nXCIsIFwiX19cIik7XG5NYXJrZG93bi5kaWFsZWN0cy5HcnViZXIuaW5saW5lW1wiKlwiXSAgPSBzdHJvbmdfZW0oXCJlbVwiLCBcIipcIik7XG5NYXJrZG93bi5kaWFsZWN0cy5HcnViZXIuaW5saW5lW1wiX1wiXSAgPSBzdHJvbmdfZW0oXCJlbVwiLCBcIl9cIik7XG5cblxuLy8gQnVpbGQgZGVmYXVsdCBvcmRlciBmcm9tIGluc2VydGlvbiBvcmRlci5cbk1hcmtkb3duLmJ1aWxkQmxvY2tPcmRlciA9IGZ1bmN0aW9uKGQpIHtcbiAgdmFyIG9yZCA9IFtdO1xuICBmb3IgKCB2YXIgaSBpbiBkICkge1xuICAgIGlmICggaSA9PSBcIl9fb3JkZXJfX1wiIHx8IGkgPT0gXCJfX2NhbGxfX1wiICkgY29udGludWU7XG4gICAgb3JkLnB1c2goIGkgKTtcbiAgfVxuICBkLl9fb3JkZXJfXyA9IG9yZDtcbn07XG5cbi8vIEJ1aWxkIHBhdHRlcm5zIGZvciBpbmxpbmUgbWF0Y2hlclxuTWFya2Rvd24uYnVpbGRJbmxpbmVQYXR0ZXJucyA9IGZ1bmN0aW9uKGQpIHtcbiAgdmFyIHBhdHRlcm5zID0gW107XG5cbiAgZm9yICggdmFyIGkgaW4gZCApIHtcbiAgICAvLyBfX2Zvb19fIGlzIHJlc2VydmVkIGFuZCBub3QgYSBwYXR0ZXJuXG4gICAgaWYgKCBpLm1hdGNoKCAvXl9fLipfXyQvKSApIGNvbnRpbnVlO1xuICAgIHZhciBsID0gaS5yZXBsYWNlKCAvKFtcXFxcLiorP3woKVxcW1xcXXt9XSkvZywgXCJcXFxcJDFcIiApXG4gICAgICAgICAgICAgLnJlcGxhY2UoIC9cXG4vLCBcIlxcXFxuXCIgKTtcbiAgICBwYXR0ZXJucy5wdXNoKCBpLmxlbmd0aCA9PSAxID8gbCA6IFwiKD86XCIgKyBsICsgXCIpXCIgKTtcbiAgfVxuXG4gIHBhdHRlcm5zID0gcGF0dGVybnMuam9pbihcInxcIik7XG4gIGQuX19wYXR0ZXJuc19fID0gcGF0dGVybnM7XG4gIC8vcHJpbnQoXCJwYXR0ZXJuczpcIiwgdW5ldmFsKCBwYXR0ZXJucyApICk7XG5cbiAgdmFyIGZuID0gZC5fX2NhbGxfXztcbiAgZC5fX2NhbGxfXyA9IGZ1bmN0aW9uKHRleHQsIHBhdHRlcm4pIHtcbiAgICBpZiAoIHBhdHRlcm4gIT0gdW5kZWZpbmVkICkge1xuICAgICAgcmV0dXJuIGZuLmNhbGwodGhpcywgdGV4dCwgcGF0dGVybik7XG4gICAgfVxuICAgIGVsc2VcbiAgICB7XG4gICAgICByZXR1cm4gZm4uY2FsbCh0aGlzLCB0ZXh0LCBwYXR0ZXJucyk7XG4gICAgfVxuICB9O1xufTtcblxuTWFya2Rvd24uRGlhbGVjdEhlbHBlcnMgPSB7fTtcbk1hcmtkb3duLkRpYWxlY3RIZWxwZXJzLmlubGluZV91bnRpbF9jaGFyID0gZnVuY3Rpb24oIHRleHQsIHdhbnQgKSB7XG4gIHZhciBjb25zdW1lZCA9IDAsXG4gICAgICBub2RlcyA9IFtdO1xuXG4gIHdoaWxlICggdHJ1ZSApIHtcbiAgICBpZiAoIHRleHQuY2hhckF0KCBjb25zdW1lZCApID09IHdhbnQgKSB7XG4gICAgICAvLyBGb3VuZCB0aGUgY2hhcmFjdGVyIHdlIHdlcmUgbG9va2luZyBmb3JcbiAgICAgIGNvbnN1bWVkKys7XG4gICAgICByZXR1cm4gWyBjb25zdW1lZCwgbm9kZXMgXTtcbiAgICB9XG5cbiAgICBpZiAoIGNvbnN1bWVkID49IHRleHQubGVuZ3RoICkge1xuICAgICAgLy8gTm8gY2xvc2luZyBjaGFyIGZvdW5kLiBBYm9ydC5cbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIHZhciByZXMgPSB0aGlzLmRpYWxlY3QuaW5saW5lLl9fb25lRWxlbWVudF9fLmNhbGwodGhpcywgdGV4dC5zdWJzdHIoIGNvbnN1bWVkICkgKTtcbiAgICBjb25zdW1lZCArPSByZXNbIDAgXTtcbiAgICAvLyBBZGQgYW55IHJldHVybmVkIG5vZGVzLlxuICAgIG5vZGVzLnB1c2guYXBwbHkoIG5vZGVzLCByZXMuc2xpY2UoIDEgKSApO1xuICB9XG59XG5cbi8vIEhlbHBlciBmdW5jdGlvbiB0byBtYWtlIHN1Yi1jbGFzc2luZyBhIGRpYWxlY3QgZWFzaWVyXG5NYXJrZG93bi5zdWJjbGFzc0RpYWxlY3QgPSBmdW5jdGlvbiggZCApIHtcbiAgZnVuY3Rpb24gQmxvY2soKSB7fVxuICBCbG9jay5wcm90b3R5cGUgPSBkLmJsb2NrO1xuICBmdW5jdGlvbiBJbmxpbmUoKSB7fVxuICBJbmxpbmUucHJvdG90eXBlID0gZC5pbmxpbmU7XG5cbiAgcmV0dXJuIHsgYmxvY2s6IG5ldyBCbG9jaygpLCBpbmxpbmU6IG5ldyBJbmxpbmUoKSB9O1xufTtcblxuTWFya2Rvd24uYnVpbGRCbG9ja09yZGVyICggTWFya2Rvd24uZGlhbGVjdHMuR3J1YmVyLmJsb2NrICk7XG5NYXJrZG93bi5idWlsZElubGluZVBhdHRlcm5zKCBNYXJrZG93bi5kaWFsZWN0cy5HcnViZXIuaW5saW5lICk7XG5cbk1hcmtkb3duLmRpYWxlY3RzLk1hcnVrdSA9IE1hcmtkb3duLnN1YmNsYXNzRGlhbGVjdCggTWFya2Rvd24uZGlhbGVjdHMuR3J1YmVyICk7XG5cbk1hcmtkb3duLmRpYWxlY3RzLk1hcnVrdS5wcm9jZXNzTWV0YUhhc2ggPSBmdW5jdGlvbiBwcm9jZXNzTWV0YUhhc2goIG1ldGFfc3RyaW5nICkge1xuICB2YXIgbWV0YSA9IHNwbGl0X21ldGFfaGFzaCggbWV0YV9zdHJpbmcgKSxcbiAgICAgIGF0dHIgPSB7fTtcblxuICBmb3IgKCB2YXIgaSA9IDA7IGkgPCBtZXRhLmxlbmd0aDsgKytpICkge1xuICAgIC8vIGlkOiAjZm9vXG4gICAgaWYgKCAvXiMvLnRlc3QoIG1ldGFbIGkgXSApICkge1xuICAgICAgYXR0ci5pZCA9IG1ldGFbIGkgXS5zdWJzdHJpbmcoIDEgKTtcbiAgICB9XG4gICAgLy8gY2xhc3M6IC5mb29cbiAgICBlbHNlIGlmICggL15cXC4vLnRlc3QoIG1ldGFbIGkgXSApICkge1xuICAgICAgLy8gaWYgY2xhc3MgYWxyZWFkeSBleGlzdHMsIGFwcGVuZCB0aGUgbmV3IG9uZVxuICAgICAgaWYgKCBhdHRyW1wiY2xhc3NcIl0gKSB7XG4gICAgICAgIGF0dHJbXCJjbGFzc1wiXSA9IGF0dHJbXCJjbGFzc1wiXSArIG1ldGFbIGkgXS5yZXBsYWNlKCAvLi8sIFwiIFwiICk7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgYXR0cltcImNsYXNzXCJdID0gbWV0YVsgaSBdLnN1YnN0cmluZyggMSApO1xuICAgICAgfVxuICAgIH1cbiAgICAvLyBhdHRyaWJ1dGU6IGZvbz1iYXJcbiAgICBlbHNlIGlmICggL1xcPS8udGVzdCggbWV0YVsgaSBdICkgKSB7XG4gICAgICB2YXIgcyA9IG1ldGFbIGkgXS5zcGxpdCggL1xcPS8gKTtcbiAgICAgIGF0dHJbIHNbIDAgXSBdID0gc1sgMSBdO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBhdHRyO1xufVxuXG5mdW5jdGlvbiBzcGxpdF9tZXRhX2hhc2goIG1ldGFfc3RyaW5nICkge1xuICB2YXIgbWV0YSA9IG1ldGFfc3RyaW5nLnNwbGl0KCBcIlwiICksXG4gICAgICBwYXJ0cyA9IFsgXCJcIiBdLFxuICAgICAgaW5fcXVvdGVzID0gZmFsc2U7XG5cbiAgd2hpbGUgKCBtZXRhLmxlbmd0aCApIHtcbiAgICB2YXIgbGV0dGVyID0gbWV0YS5zaGlmdCgpO1xuICAgIHN3aXRjaCAoIGxldHRlciApIHtcbiAgICAgIGNhc2UgXCIgXCIgOlxuICAgICAgICAvLyBpZiB3ZSdyZSBpbiBhIHF1b3RlZCBzZWN0aW9uLCBrZWVwIGl0XG4gICAgICAgIGlmICggaW5fcXVvdGVzICkge1xuICAgICAgICAgIHBhcnRzWyBwYXJ0cy5sZW5ndGggLSAxIF0gKz0gbGV0dGVyO1xuICAgICAgICB9XG4gICAgICAgIC8vIG90aGVyd2lzZSBtYWtlIGEgbmV3IHBhcnRcbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgcGFydHMucHVzaCggXCJcIiApO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcIidcIiA6XG4gICAgICBjYXNlICdcIicgOlxuICAgICAgICAvLyByZXZlcnNlIHRoZSBxdW90ZXMgYW5kIG1vdmUgc3RyYWlnaHQgb25cbiAgICAgICAgaW5fcXVvdGVzID0gIWluX3F1b3RlcztcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiXFxcXFwiIDpcbiAgICAgICAgLy8gc2hpZnQgb2ZmIHRoZSBuZXh0IGxldHRlciB0byBiZSB1c2VkIHN0cmFpZ2h0IGF3YXkuXG4gICAgICAgIC8vIGl0IHdhcyBlc2NhcGVkIHNvIHdlJ2xsIGtlZXAgaXQgd2hhdGV2ZXIgaXQgaXNcbiAgICAgICAgbGV0dGVyID0gbWV0YS5zaGlmdCgpO1xuICAgICAgZGVmYXVsdCA6XG4gICAgICAgIHBhcnRzWyBwYXJ0cy5sZW5ndGggLSAxIF0gKz0gbGV0dGVyO1xuICAgICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcGFydHM7XG59XG5cbk1hcmtkb3duLmRpYWxlY3RzLk1hcnVrdS5ibG9jay5kb2N1bWVudF9tZXRhID0gZnVuY3Rpb24gZG9jdW1lbnRfbWV0YSggYmxvY2ssIG5leHQgKSB7XG4gIC8vIHdlJ3JlIG9ubHkgaW50ZXJlc3RlZCBpbiB0aGUgZmlyc3QgYmxvY2tcbiAgaWYgKCBibG9jay5saW5lTnVtYmVyID4gMSApIHJldHVybiB1bmRlZmluZWQ7XG5cbiAgLy8gZG9jdW1lbnRfbWV0YSBibG9ja3MgY29uc2lzdCBvZiBvbmUgb3IgbW9yZSBsaW5lcyBvZiBgS2V5OiBWYWx1ZVxcbmBcbiAgaWYgKCAhIGJsb2NrLm1hdGNoKCAvXig/Olxcdys6LipcXG4pKlxcdys6LiokLyApICkgcmV0dXJuIHVuZGVmaW5lZDtcblxuICAvLyBtYWtlIGFuIGF0dHJpYnV0ZSBub2RlIGlmIGl0IGRvZXNuJ3QgZXhpc3RcbiAgaWYgKCAhZXh0cmFjdF9hdHRyKCB0aGlzLnRyZWUgKSApIHtcbiAgICB0aGlzLnRyZWUuc3BsaWNlKCAxLCAwLCB7fSApO1xuICB9XG5cbiAgdmFyIHBhaXJzID0gYmxvY2suc3BsaXQoIC9cXG4vICk7XG4gIGZvciAoIHAgaW4gcGFpcnMgKSB7XG4gICAgdmFyIG0gPSBwYWlyc1sgcCBdLm1hdGNoKCAvKFxcdyspOlxccyooLiopJC8gKSxcbiAgICAgICAga2V5ID0gbVsgMSBdLnRvTG93ZXJDYXNlKCksXG4gICAgICAgIHZhbHVlID0gbVsgMiBdO1xuXG4gICAgdGhpcy50cmVlWyAxIF1bIGtleSBdID0gdmFsdWU7XG4gIH1cblxuICAvLyBkb2N1bWVudF9tZXRhIHByb2R1Y2VzIG5vIGNvbnRlbnQhXG4gIHJldHVybiBbXTtcbn07XG5cbk1hcmtkb3duLmRpYWxlY3RzLk1hcnVrdS5ibG9jay5ibG9ja19tZXRhID0gZnVuY3Rpb24gYmxvY2tfbWV0YSggYmxvY2ssIG5leHQgKSB7XG4gIC8vIGNoZWNrIGlmIHRoZSBsYXN0IGxpbmUgb2YgdGhlIGJsb2NrIGlzIGFuIG1ldGEgaGFzaFxuICB2YXIgbSA9IGJsb2NrLm1hdGNoKCAvKF58XFxuKSB7MCwzfVxcezpcXHMqKCg/OlxcXFxcXH18W15cXH1dKSopXFxzKlxcfSQvICk7XG4gIGlmICggIW0gKSByZXR1cm4gdW5kZWZpbmVkO1xuXG4gIC8vIHByb2Nlc3MgdGhlIG1ldGEgaGFzaFxuICB2YXIgYXR0ciA9IHRoaXMuZGlhbGVjdC5wcm9jZXNzTWV0YUhhc2goIG1bIDIgXSApO1xuXG4gIHZhciBoYXNoO1xuXG4gIC8vIGlmIHdlIG1hdGNoZWQgXiB0aGVuIHdlIG5lZWQgdG8gYXBwbHkgbWV0YSB0byB0aGUgcHJldmlvdXMgYmxvY2tcbiAgaWYgKCBtWyAxIF0gPT09IFwiXCIgKSB7XG4gICAgdmFyIG5vZGUgPSB0aGlzLnRyZWVbIHRoaXMudHJlZS5sZW5ndGggLSAxIF07XG4gICAgaGFzaCA9IGV4dHJhY3RfYXR0ciggbm9kZSApO1xuXG4gICAgLy8gaWYgdGhlIG5vZGUgaXMgYSBzdHJpbmcgKHJhdGhlciB0aGFuIEpzb25NTCksIGJhaWxcbiAgICBpZiAoIHR5cGVvZiBub2RlID09PSBcInN0cmluZ1wiICkgcmV0dXJuIHVuZGVmaW5lZDtcblxuICAgIC8vIGNyZWF0ZSB0aGUgYXR0cmlidXRlIGhhc2ggaWYgaXQgZG9lc24ndCBleGlzdFxuICAgIGlmICggIWhhc2ggKSB7XG4gICAgICBoYXNoID0ge307XG4gICAgICBub2RlLnNwbGljZSggMSwgMCwgaGFzaCApO1xuICAgIH1cblxuICAgIC8vIGFkZCB0aGUgYXR0cmlidXRlcyBpblxuICAgIGZvciAoIGEgaW4gYXR0ciApIHtcbiAgICAgIGhhc2hbIGEgXSA9IGF0dHJbIGEgXTtcbiAgICB9XG5cbiAgICAvLyByZXR1cm4gbm90aGluZyBzbyB0aGUgbWV0YSBoYXNoIGlzIHJlbW92ZWRcbiAgICByZXR1cm4gW107XG4gIH1cblxuICAvLyBwdWxsIHRoZSBtZXRhIGhhc2ggb2ZmIHRoZSBibG9jayBhbmQgcHJvY2VzcyB3aGF0J3MgbGVmdFxuICB2YXIgYiA9IGJsb2NrLnJlcGxhY2UoIC9cXG4uKiQvLCBcIlwiICksXG4gICAgICByZXN1bHQgPSB0aGlzLnByb2Nlc3NCbG9jayggYiwgW10gKTtcblxuICAvLyBnZXQgb3IgbWFrZSB0aGUgYXR0cmlidXRlcyBoYXNoXG4gIGhhc2ggPSBleHRyYWN0X2F0dHIoIHJlc3VsdFsgMCBdICk7XG4gIGlmICggIWhhc2ggKSB7XG4gICAgaGFzaCA9IHt9O1xuICAgIHJlc3VsdFsgMCBdLnNwbGljZSggMSwgMCwgaGFzaCApO1xuICB9XG5cbiAgLy8gYXR0YWNoIHRoZSBhdHRyaWJ1dGVzIHRvIHRoZSBibG9ja1xuICBmb3IgKCBhIGluIGF0dHIgKSB7XG4gICAgaGFzaFsgYSBdID0gYXR0clsgYSBdO1xuICB9XG5cbiAgcmV0dXJuIHJlc3VsdDtcbn07XG5cbk1hcmtkb3duLmRpYWxlY3RzLk1hcnVrdS5ibG9jay5kZWZpbml0aW9uX2xpc3QgPSBmdW5jdGlvbiBkZWZpbml0aW9uX2xpc3QoIGJsb2NrLCBuZXh0ICkge1xuICAvLyBvbmUgb3IgbW9yZSB0ZXJtcyBmb2xsb3dlZCBieSBvbmUgb3IgbW9yZSBkZWZpbml0aW9ucywgaW4gYSBzaW5nbGUgYmxvY2tcbiAgdmFyIHRpZ2h0ID0gL14oKD86W15cXHM6XS4qXFxuKSspOlxccysoW1xcc1xcU10rKSQvLFxuICAgICAgbGlzdCA9IFsgXCJkbFwiIF0sXG4gICAgICBpLCBtO1xuXG4gIC8vIHNlZSBpZiB3ZSdyZSBkZWFsaW5nIHdpdGggYSB0aWdodCBvciBsb29zZSBibG9ja1xuICBpZiAoICggbSA9IGJsb2NrLm1hdGNoKCB0aWdodCApICkgKSB7XG4gICAgLy8gcHVsbCBzdWJzZXF1ZW50IHRpZ2h0IERMIGJsb2NrcyBvdXQgb2YgYG5leHRgXG4gICAgdmFyIGJsb2NrcyA9IFsgYmxvY2sgXTtcbiAgICB3aGlsZSAoIG5leHQubGVuZ3RoICYmIHRpZ2h0LmV4ZWMoIG5leHRbIDAgXSApICkge1xuICAgICAgYmxvY2tzLnB1c2goIG5leHQuc2hpZnQoKSApO1xuICAgIH1cblxuICAgIGZvciAoIHZhciBiID0gMDsgYiA8IGJsb2Nrcy5sZW5ndGg7ICsrYiApIHtcbiAgICAgIHZhciBtID0gYmxvY2tzWyBiIF0ubWF0Y2goIHRpZ2h0ICksXG4gICAgICAgICAgdGVybXMgPSBtWyAxIF0ucmVwbGFjZSggL1xcbiQvLCBcIlwiICkuc3BsaXQoIC9cXG4vICksXG4gICAgICAgICAgZGVmbnMgPSBtWyAyIF0uc3BsaXQoIC9cXG46XFxzKy8gKTtcblxuICAgICAgLy8gcHJpbnQoIHVuZXZhbCggbSApICk7XG5cbiAgICAgIGZvciAoIGkgPSAwOyBpIDwgdGVybXMubGVuZ3RoOyArK2kgKSB7XG4gICAgICAgIGxpc3QucHVzaCggWyBcImR0XCIsIHRlcm1zWyBpIF0gXSApO1xuICAgICAgfVxuXG4gICAgICBmb3IgKCBpID0gMDsgaSA8IGRlZm5zLmxlbmd0aDsgKytpICkge1xuICAgICAgICAvLyBydW4gaW5saW5lIHByb2Nlc3Npbmcgb3ZlciB0aGUgZGVmaW5pdGlvblxuICAgICAgICBsaXN0LnB1c2goIFsgXCJkZFwiIF0uY29uY2F0KCB0aGlzLnByb2Nlc3NJbmxpbmUoIGRlZm5zWyBpIF0ucmVwbGFjZSggLyhcXG4pXFxzKy8sIFwiJDFcIiApICkgKSApO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBlbHNlIHtcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG5cbiAgcmV0dXJuIFsgbGlzdCBdO1xufTtcblxuLy8gc3BsaXRzIG9uIHVuZXNjYXBlZCBpbnN0YW5jZXMgb2YgQGNoLiBJZiBAY2ggaXMgbm90IGEgY2hhcmFjdGVyIHRoZSByZXN1bHRcbi8vIGNhbiBiZSB1bnByZWRpY3RhYmxlXG5cbk1hcmtkb3duLmRpYWxlY3RzLk1hcnVrdS5ibG9jay50YWJsZSA9IGZ1bmN0aW9uIHRhYmxlIChibG9jaywgbmV4dCkge1xuXG4gICAgdmFyIF9zcGxpdF9vbl91bmVzY2FwZWQgPSBmdW5jdGlvbihzLCBjaCkge1xuICAgICAgICBjaCA9IGNoIHx8ICdcXFxccyc7XG4gICAgICAgIGlmIChjaC5tYXRjaCgvXltcXFxcfFxcW1xcXXt9PyouK14kXSQvKSkgeyBjaCA9ICdcXFxcJyArIGNoOyB9XG4gICAgICAgIHZhciByZXMgPSBbIF0sXG4gICAgICAgICAgICByID0gbmV3IFJlZ0V4cCgnXigoPzpcXFxcXFxcXC58W15cXFxcXFxcXCcgKyBjaCArICddKSopJyArIGNoICsgJyguKiknKSxcbiAgICAgICAgICAgIG07XG4gICAgICAgIHdoaWxlKG0gPSBzLm1hdGNoKHIpKSB7XG4gICAgICAgICAgICByZXMucHVzaChtWzFdKTtcbiAgICAgICAgICAgIHMgPSBtWzJdO1xuICAgICAgICB9XG4gICAgICAgIHJlcy5wdXNoKHMpO1xuICAgICAgICByZXR1cm4gcmVzO1xuICAgIH1cblxuICAgIHZhciBsZWFkaW5nX3BpcGUgPSAvXiB7MCwzfVxcfCguKylcXG4gezAsM31cXHxcXHMqKFtcXC06XStbXFwtfCA6XSopXFxuKCg/OlxccypcXHwuKig/OlxcbnwkKSkqKSg/PVxcbnwkKS8sXG4gICAgICAgIC8vIGZpbmQgYXQgbGVhc3QgYW4gdW5lc2NhcGVkIHBpcGUgaW4gZWFjaCBsaW5lXG4gICAgICAgIG5vX2xlYWRpbmdfcGlwZSA9IC9eIHswLDN9KFxcUyg/OlxcXFwufFteXFxcXHxdKSpcXHwuKilcXG4gezAsM30oW1xcLTpdK1xccypcXHxbXFwtfCA6XSopXFxuKCg/Oig/OlxcXFwufFteXFxcXHxdKSpcXHwuKig/OlxcbnwkKSkqKSg/PVxcbnwkKS8sXG4gICAgICAgIGksIG07XG4gICAgaWYgKG0gPSBibG9jay5tYXRjaChsZWFkaW5nX3BpcGUpKSB7XG4gICAgICAgIC8vIHJlbW92ZSBsZWFkaW5nIHBpcGVzIGluIGNvbnRlbnRzXG4gICAgICAgIC8vIChoZWFkZXIgYW5kIGhvcml6b250YWwgcnVsZSBhbHJlYWR5IGhhdmUgdGhlIGxlYWRpbmcgcGlwZSBsZWZ0IG91dClcbiAgICAgICAgbVszXSA9IG1bM10ucmVwbGFjZSgvXlxccypcXHwvZ20sICcnKTtcbiAgICB9IGVsc2UgaWYgKCEgKCBtID0gYmxvY2subWF0Y2gobm9fbGVhZGluZ19waXBlKSkpIHtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICB2YXIgdGFibGUgPSBbIFwidGFibGVcIiwgWyBcInRoZWFkXCIsIFsgXCJ0clwiIF0gXSwgWyBcInRib2R5XCIgXSBdO1xuXG4gICAgLy8gcmVtb3ZlIHRyYWlsaW5nIHBpcGVzLCB0aGVuIHNwbGl0IG9uIHBpcGVzXG4gICAgLy8gKG5vIGVzY2FwZWQgcGlwZXMgYXJlIGFsbG93ZWQgaW4gaG9yaXpvbnRhbCBydWxlKVxuICAgIG1bMl0gPSBtWzJdLnJlcGxhY2UoL1xcfFxccyokLywgJycpLnNwbGl0KCd8Jyk7XG5cbiAgICAvLyBwcm9jZXNzIGFsaWdubWVudFxuICAgIHZhciBodG1sX2F0dHJzID0gWyBdO1xuICAgIGZvckVhY2ggKG1bMl0sIGZ1bmN0aW9uIChzKSB7XG4gICAgICAgIGlmIChzLm1hdGNoKC9eXFxzKi0rOlxccyokLykpICAgICAgIGh0bWxfYXR0cnMucHVzaCh7YWxpZ246IFwicmlnaHRcIn0pO1xuICAgICAgICBlbHNlIGlmIChzLm1hdGNoKC9eXFxzKjotK1xccyokLykpICBodG1sX2F0dHJzLnB1c2goe2FsaWduOiBcImxlZnRcIn0pO1xuICAgICAgICBlbHNlIGlmIChzLm1hdGNoKC9eXFxzKjotKzpcXHMqJC8pKSBodG1sX2F0dHJzLnB1c2goe2FsaWduOiBcImNlbnRlclwifSk7XG4gICAgICAgIGVsc2UgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBodG1sX2F0dHJzLnB1c2goe30pO1xuICAgIH0pO1xuXG4gICAgLy8gbm93IGZvciB0aGUgaGVhZGVyLCBhdm9pZCBlc2NhcGVkIHBpcGVzXG4gICAgbVsxXSA9IF9zcGxpdF9vbl91bmVzY2FwZWQobVsxXS5yZXBsYWNlKC9cXHxcXHMqJC8sICcnKSwgJ3wnKTtcbiAgICBmb3IgKGkgPSAwOyBpIDwgbVsxXS5sZW5ndGg7IGkrKykge1xuICAgICAgICB0YWJsZVsxXVsxXS5wdXNoKFsndGgnLCBodG1sX2F0dHJzW2ldIHx8IHt9XS5jb25jYXQoXG4gICAgICAgICAgICB0aGlzLnByb2Nlc3NJbmxpbmUobVsxXVtpXS50cmltKCkpKSk7XG4gICAgfVxuXG4gICAgLy8gbm93IGZvciBib2R5IGNvbnRlbnRzXG4gICAgZm9yRWFjaCAobVszXS5yZXBsYWNlKC9cXHxcXHMqJC9tZywgJycpLnNwbGl0KCdcXG4nKSwgZnVuY3Rpb24gKHJvdykge1xuICAgICAgICB2YXIgaHRtbF9yb3cgPSBbJ3RyJ107XG4gICAgICAgIHJvdyA9IF9zcGxpdF9vbl91bmVzY2FwZWQocm93LCAnfCcpO1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgcm93Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBodG1sX3Jvdy5wdXNoKFsndGQnLCBodG1sX2F0dHJzW2ldIHx8IHt9XS5jb25jYXQodGhpcy5wcm9jZXNzSW5saW5lKHJvd1tpXS50cmltKCkpKSk7XG4gICAgICAgIH1cbiAgICAgICAgdGFibGVbMl0ucHVzaChodG1sX3Jvdyk7XG4gICAgfSwgdGhpcyk7XG5cbiAgICByZXR1cm4gW3RhYmxlXTtcbn1cblxuTWFya2Rvd24uZGlhbGVjdHMuTWFydWt1LmlubGluZVsgXCJ7OlwiIF0gPSBmdW5jdGlvbiBpbmxpbmVfbWV0YSggdGV4dCwgbWF0Y2hlcywgb3V0ICkge1xuICBpZiAoICFvdXQubGVuZ3RoICkge1xuICAgIHJldHVybiBbIDIsIFwiezpcIiBdO1xuICB9XG5cbiAgLy8gZ2V0IHRoZSBwcmVjZWVkaW5nIGVsZW1lbnRcbiAgdmFyIGJlZm9yZSA9IG91dFsgb3V0Lmxlbmd0aCAtIDEgXTtcblxuICBpZiAoIHR5cGVvZiBiZWZvcmUgPT09IFwic3RyaW5nXCIgKSB7XG4gICAgcmV0dXJuIFsgMiwgXCJ7OlwiIF07XG4gIH1cblxuICAvLyBtYXRjaCBhIG1ldGEgaGFzaFxuICB2YXIgbSA9IHRleHQubWF0Y2goIC9eXFx7OlxccyooKD86XFxcXFxcfXxbXlxcfV0pKilcXHMqXFx9LyApO1xuXG4gIC8vIG5vIG1hdGNoLCBmYWxzZSBhbGFybVxuICBpZiAoICFtICkge1xuICAgIHJldHVybiBbIDIsIFwiezpcIiBdO1xuICB9XG5cbiAgLy8gYXR0YWNoIHRoZSBhdHRyaWJ1dGVzIHRvIHRoZSBwcmVjZWVkaW5nIGVsZW1lbnRcbiAgdmFyIG1ldGEgPSB0aGlzLmRpYWxlY3QucHJvY2Vzc01ldGFIYXNoKCBtWyAxIF0gKSxcbiAgICAgIGF0dHIgPSBleHRyYWN0X2F0dHIoIGJlZm9yZSApO1xuXG4gIGlmICggIWF0dHIgKSB7XG4gICAgYXR0ciA9IHt9O1xuICAgIGJlZm9yZS5zcGxpY2UoIDEsIDAsIGF0dHIgKTtcbiAgfVxuXG4gIGZvciAoIHZhciBrIGluIG1ldGEgKSB7XG4gICAgYXR0clsgayBdID0gbWV0YVsgayBdO1xuICB9XG5cbiAgLy8gY3V0IG91dCB0aGUgc3RyaW5nIGFuZCByZXBsYWNlIGl0IHdpdGggbm90aGluZ1xuICByZXR1cm4gWyBtWyAwIF0ubGVuZ3RoLCBcIlwiIF07XG59O1xuXG5NYXJrZG93bi5kaWFsZWN0cy5NYXJ1a3UuaW5saW5lLl9fZXNjYXBlX18gPSAvXlxcXFxbXFxcXGBcXCpfe31cXFtcXF0oKSNcXCsuIVxcLXw6XS87XG5cbk1hcmtkb3duLmJ1aWxkQmxvY2tPcmRlciAoIE1hcmtkb3duLmRpYWxlY3RzLk1hcnVrdS5ibG9jayApO1xuTWFya2Rvd24uYnVpbGRJbmxpbmVQYXR0ZXJucyggTWFya2Rvd24uZGlhbGVjdHMuTWFydWt1LmlubGluZSApO1xuXG52YXIgaXNBcnJheSA9IEFycmF5LmlzQXJyYXkgfHwgZnVuY3Rpb24ob2JqKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqKSA9PSBcIltvYmplY3QgQXJyYXldXCI7XG59O1xuXG52YXIgZm9yRWFjaDtcbi8vIERvbid0IG1lc3Mgd2l0aCBBcnJheS5wcm90b3R5cGUuIEl0cyBub3QgZnJpZW5kbHlcbmlmICggQXJyYXkucHJvdG90eXBlLmZvckVhY2ggKSB7XG4gIGZvckVhY2ggPSBmdW5jdGlvbiggYXJyLCBjYiwgdGhpc3AgKSB7XG4gICAgcmV0dXJuIGFyci5mb3JFYWNoKCBjYiwgdGhpc3AgKTtcbiAgfTtcbn1cbmVsc2Uge1xuICBmb3JFYWNoID0gZnVuY3Rpb24oYXJyLCBjYiwgdGhpc3ApIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKykge1xuICAgICAgY2IuY2FsbCh0aGlzcCB8fCBhcnIsIGFycltpXSwgaSwgYXJyKTtcbiAgICB9XG4gIH1cbn1cblxudmFyIGlzRW1wdHkgPSBmdW5jdGlvbiggb2JqICkge1xuICBmb3IgKCB2YXIga2V5IGluIG9iaiApIHtcbiAgICBpZiAoIGhhc093blByb3BlcnR5LmNhbGwoIG9iaiwga2V5ICkgKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59XG5cbmZ1bmN0aW9uIGV4dHJhY3RfYXR0cigganNvbm1sICkge1xuICByZXR1cm4gaXNBcnJheShqc29ubWwpXG4gICAgICAmJiBqc29ubWwubGVuZ3RoID4gMVxuICAgICAgJiYgdHlwZW9mIGpzb25tbFsgMSBdID09PSBcIm9iamVjdFwiXG4gICAgICAmJiAhKCBpc0FycmF5KGpzb25tbFsgMSBdKSApXG4gICAgICA/IGpzb25tbFsgMSBdXG4gICAgICA6IHVuZGVmaW5lZDtcbn1cblxuXG5cbi8qKlxuICogIHJlbmRlckpzb25NTCgganNvbm1sWywgb3B0aW9uc10gKSAtPiBTdHJpbmdcbiAqICAtIGpzb25tbCAoQXJyYXkpOiBKc29uTUwgYXJyYXkgdG8gcmVuZGVyIHRvIFhNTFxuICogIC0gb3B0aW9ucyAoT2JqZWN0KTogb3B0aW9uc1xuICpcbiAqICBDb252ZXJ0cyB0aGUgZ2l2ZW4gSnNvbk1MIGludG8gd2VsbC1mb3JtZWQgWE1MLlxuICpcbiAqICBUaGUgb3B0aW9ucyBjdXJyZW50bHkgdW5kZXJzdG9vZCBhcmU6XG4gKlxuICogIC0gcm9vdCAoQm9vbGVhbik6IHdldGhlciBvciBub3QgdGhlIHJvb3Qgbm9kZSBzaG91bGQgYmUgaW5jbHVkZWQgaW4gdGhlXG4gKiAgICBvdXRwdXQsIG9yIGp1c3QgaXRzIGNoaWxkcmVuLiBUaGUgZGVmYXVsdCBgZmFsc2VgIGlzIHRvIG5vdCBpbmNsdWRlIHRoZVxuICogICAgcm9vdCBpdHNlbGYuXG4gKi9cbmV4cG9zZS5yZW5kZXJKc29uTUwgPSBmdW5jdGlvbigganNvbm1sLCBvcHRpb25zICkge1xuICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgLy8gaW5jbHVkZSB0aGUgcm9vdCBlbGVtZW50IGluIHRoZSByZW5kZXJlZCBvdXRwdXQ/XG4gIG9wdGlvbnMucm9vdCA9IG9wdGlvbnMucm9vdCB8fCBmYWxzZTtcblxuICB2YXIgY29udGVudCA9IFtdO1xuXG4gIGlmICggb3B0aW9ucy5yb290ICkge1xuICAgIGNvbnRlbnQucHVzaCggcmVuZGVyX3RyZWUoIGpzb25tbCApICk7XG4gIH1cbiAgZWxzZSB7XG4gICAganNvbm1sLnNoaWZ0KCk7IC8vIGdldCByaWQgb2YgdGhlIHRhZ1xuICAgIGlmICgganNvbm1sLmxlbmd0aCAmJiB0eXBlb2YganNvbm1sWyAwIF0gPT09IFwib2JqZWN0XCIgJiYgISgganNvbm1sWyAwIF0gaW5zdGFuY2VvZiBBcnJheSApICkge1xuICAgICAganNvbm1sLnNoaWZ0KCk7IC8vIGdldCByaWQgb2YgdGhlIGF0dHJpYnV0ZXNcbiAgICB9XG5cbiAgICB3aGlsZSAoIGpzb25tbC5sZW5ndGggKSB7XG4gICAgICBjb250ZW50LnB1c2goIHJlbmRlcl90cmVlKCBqc29ubWwuc2hpZnQoKSApICk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGNvbnRlbnQuam9pbiggXCJcXG5cXG5cIiApO1xufTtcblxuZnVuY3Rpb24gZXNjYXBlSFRNTCggdGV4dCApIHtcbiAgcmV0dXJuIHRleHQucmVwbGFjZSggLyYvZywgXCImYW1wO1wiIClcbiAgICAgICAgICAgICAucmVwbGFjZSggLzwvZywgXCImbHQ7XCIgKVxuICAgICAgICAgICAgIC5yZXBsYWNlKCAvPi9nLCBcIiZndDtcIiApXG4gICAgICAgICAgICAgLnJlcGxhY2UoIC9cIi9nLCBcIiZxdW90O1wiIClcbiAgICAgICAgICAgICAucmVwbGFjZSggLycvZywgXCImIzM5O1wiICk7XG59XG5cbmZ1bmN0aW9uIHJlbmRlcl90cmVlKCBqc29ubWwgKSB7XG4gIC8vIGJhc2ljIGNhc2VcbiAgaWYgKCB0eXBlb2YganNvbm1sID09PSBcInN0cmluZ1wiICkge1xuICAgIHJldHVybiBlc2NhcGVIVE1MKCBqc29ubWwgKTtcbiAgfVxuXG4gIHZhciB0YWcgPSBqc29ubWwuc2hpZnQoKSxcbiAgICAgIGF0dHJpYnV0ZXMgPSB7fSxcbiAgICAgIGNvbnRlbnQgPSBbXTtcblxuICBpZiAoIGpzb25tbC5sZW5ndGggJiYgdHlwZW9mIGpzb25tbFsgMCBdID09PSBcIm9iamVjdFwiICYmICEoIGpzb25tbFsgMCBdIGluc3RhbmNlb2YgQXJyYXkgKSApIHtcbiAgICBhdHRyaWJ1dGVzID0ganNvbm1sLnNoaWZ0KCk7XG4gIH1cblxuICB3aGlsZSAoIGpzb25tbC5sZW5ndGggKSB7XG4gICAgY29udGVudC5wdXNoKCByZW5kZXJfdHJlZSgganNvbm1sLnNoaWZ0KCkgKSApO1xuICB9XG5cbiAgdmFyIHRhZ19hdHRycyA9IFwiXCI7XG4gIGZvciAoIHZhciBhIGluIGF0dHJpYnV0ZXMgKSB7XG4gICAgdGFnX2F0dHJzICs9IFwiIFwiICsgYSArICc9XCInICsgZXNjYXBlSFRNTCggYXR0cmlidXRlc1sgYSBdICkgKyAnXCInO1xuICB9XG5cbiAgLy8gYmUgY2FyZWZ1bCBhYm91dCBhZGRpbmcgd2hpdGVzcGFjZSBoZXJlIGZvciBpbmxpbmUgZWxlbWVudHNcbiAgaWYgKCB0YWcgPT0gXCJpbWdcIiB8fCB0YWcgPT0gXCJiclwiIHx8IHRhZyA9PSBcImhyXCIgKSB7XG4gICAgcmV0dXJuIFwiPFwiKyB0YWcgKyB0YWdfYXR0cnMgKyBcIi8+XCI7XG4gIH1cbiAgZWxzZSB7XG4gICAgcmV0dXJuIFwiPFwiKyB0YWcgKyB0YWdfYXR0cnMgKyBcIj5cIiArIGNvbnRlbnQuam9pbiggXCJcIiApICsgXCI8L1wiICsgdGFnICsgXCI+XCI7XG4gIH1cbn1cblxuZnVuY3Rpb24gY29udmVydF90cmVlX3RvX2h0bWwoIHRyZWUsIHJlZmVyZW5jZXMsIG9wdGlvbnMgKSB7XG4gIHZhciBpO1xuICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAvLyBzaGFsbG93IGNsb25lXG4gIHZhciBqc29ubWwgPSB0cmVlLnNsaWNlKCAwICk7XG5cbiAgaWYgKCB0eXBlb2Ygb3B0aW9ucy5wcmVwcm9jZXNzVHJlZU5vZGUgPT09IFwiZnVuY3Rpb25cIiApIHtcbiAgICAgIGpzb25tbCA9IG9wdGlvbnMucHJlcHJvY2Vzc1RyZWVOb2RlKGpzb25tbCwgcmVmZXJlbmNlcyk7XG4gIH1cblxuICAvLyBDbG9uZSBhdHRyaWJ1dGVzIGlmIHRoZXkgZXhpc3RcbiAgdmFyIGF0dHJzID0gZXh0cmFjdF9hdHRyKCBqc29ubWwgKTtcbiAgaWYgKCBhdHRycyApIHtcbiAgICBqc29ubWxbIDEgXSA9IHt9O1xuICAgIGZvciAoIGkgaW4gYXR0cnMgKSB7XG4gICAgICBqc29ubWxbIDEgXVsgaSBdID0gYXR0cnNbIGkgXTtcbiAgICB9XG4gICAgYXR0cnMgPSBqc29ubWxbIDEgXTtcbiAgfVxuXG4gIC8vIGJhc2ljIGNhc2VcbiAgaWYgKCB0eXBlb2YganNvbm1sID09PSBcInN0cmluZ1wiICkge1xuICAgIHJldHVybiBqc29ubWw7XG4gIH1cblxuICAvLyBjb252ZXJ0IHRoaXMgbm9kZVxuICBzd2l0Y2ggKCBqc29ubWxbIDAgXSApIHtcbiAgICBjYXNlIFwiaGVhZGVyXCI6XG4gICAgICBqc29ubWxbIDAgXSA9IFwiaFwiICsganNvbm1sWyAxIF0ubGV2ZWw7XG4gICAgICBkZWxldGUganNvbm1sWyAxIF0ubGV2ZWw7XG4gICAgICBicmVhaztcbiAgICBjYXNlIFwiYnVsbGV0bGlzdFwiOlxuICAgICAganNvbm1sWyAwIF0gPSBcInVsXCI7XG4gICAgICBicmVhaztcbiAgICBjYXNlIFwibnVtYmVybGlzdFwiOlxuICAgICAganNvbm1sWyAwIF0gPSBcIm9sXCI7XG4gICAgICBicmVhaztcbiAgICBjYXNlIFwibGlzdGl0ZW1cIjpcbiAgICAgIGpzb25tbFsgMCBdID0gXCJsaVwiO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBcInBhcmFcIjpcbiAgICAgIGpzb25tbFsgMCBdID0gXCJwXCI7XG4gICAgICBicmVhaztcbiAgICBjYXNlIFwibWFya2Rvd25cIjpcbiAgICAgIGpzb25tbFsgMCBdID0gXCJodG1sXCI7XG4gICAgICBpZiAoIGF0dHJzICkgZGVsZXRlIGF0dHJzLnJlZmVyZW5jZXM7XG4gICAgICBicmVhaztcbiAgICBjYXNlIFwiY29kZV9ibG9ja1wiOlxuICAgICAganNvbm1sWyAwIF0gPSBcInByZVwiO1xuICAgICAgaSA9IGF0dHJzID8gMiA6IDE7XG4gICAgICB2YXIgY29kZSA9IFsgXCJjb2RlXCIgXTtcbiAgICAgIGNvZGUucHVzaC5hcHBseSggY29kZSwganNvbm1sLnNwbGljZSggaSwganNvbm1sLmxlbmd0aCAtIGkgKSApO1xuICAgICAganNvbm1sWyBpIF0gPSBjb2RlO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBcImlubGluZWNvZGVcIjpcbiAgICAgIGpzb25tbFsgMCBdID0gXCJjb2RlXCI7XG4gICAgICBicmVhaztcbiAgICBjYXNlIFwiaW1nXCI6XG4gICAgICBqc29ubWxbIDEgXS5zcmMgPSBqc29ubWxbIDEgXS5ocmVmO1xuICAgICAgZGVsZXRlIGpzb25tbFsgMSBdLmhyZWY7XG4gICAgICBicmVhaztcbiAgICBjYXNlIFwibGluZWJyZWFrXCI6XG4gICAgICBqc29ubWxbIDAgXSA9IFwiYnJcIjtcbiAgICBicmVhaztcbiAgICBjYXNlIFwibGlua1wiOlxuICAgICAganNvbm1sWyAwIF0gPSBcImFcIjtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgXCJsaW5rX3JlZlwiOlxuICAgICAganNvbm1sWyAwIF0gPSBcImFcIjtcblxuICAgICAgLy8gZ3JhYiB0aGlzIHJlZiBhbmQgY2xlYW4gdXAgdGhlIGF0dHJpYnV0ZSBub2RlXG4gICAgICB2YXIgcmVmID0gcmVmZXJlbmNlc1sgYXR0cnMucmVmIF07XG5cbiAgICAgIC8vIGlmIHRoZSByZWZlcmVuY2UgZXhpc3RzLCBtYWtlIHRoZSBsaW5rXG4gICAgICBpZiAoIHJlZiApIHtcbiAgICAgICAgZGVsZXRlIGF0dHJzLnJlZjtcblxuICAgICAgICAvLyBhZGQgaW4gdGhlIGhyZWYgYW5kIHRpdGxlLCBpZiBwcmVzZW50XG4gICAgICAgIGF0dHJzLmhyZWYgPSByZWYuaHJlZjtcbiAgICAgICAgaWYgKCByZWYudGl0bGUgKSB7XG4gICAgICAgICAgYXR0cnMudGl0bGUgPSByZWYudGl0bGU7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBnZXQgcmlkIG9mIHRoZSB1bm5lZWRlZCBvcmlnaW5hbCB0ZXh0XG4gICAgICAgIGRlbGV0ZSBhdHRycy5vcmlnaW5hbDtcbiAgICAgIH1cbiAgICAgIC8vIHRoZSByZWZlcmVuY2UgZG9lc24ndCBleGlzdCwgc28gcmV2ZXJ0IHRvIHBsYWluIHRleHRcbiAgICAgIGVsc2Uge1xuICAgICAgICByZXR1cm4gYXR0cnMub3JpZ2luYWw7XG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICBjYXNlIFwiaW1nX3JlZlwiOlxuICAgICAganNvbm1sWyAwIF0gPSBcImltZ1wiO1xuXG4gICAgICAvLyBncmFiIHRoaXMgcmVmIGFuZCBjbGVhbiB1cCB0aGUgYXR0cmlidXRlIG5vZGVcbiAgICAgIHZhciByZWYgPSByZWZlcmVuY2VzWyBhdHRycy5yZWYgXTtcblxuICAgICAgLy8gaWYgdGhlIHJlZmVyZW5jZSBleGlzdHMsIG1ha2UgdGhlIGxpbmtcbiAgICAgIGlmICggcmVmICkge1xuICAgICAgICBkZWxldGUgYXR0cnMucmVmO1xuXG4gICAgICAgIC8vIGFkZCBpbiB0aGUgaHJlZiBhbmQgdGl0bGUsIGlmIHByZXNlbnRcbiAgICAgICAgYXR0cnMuc3JjID0gcmVmLmhyZWY7XG4gICAgICAgIGlmICggcmVmLnRpdGxlICkge1xuICAgICAgICAgIGF0dHJzLnRpdGxlID0gcmVmLnRpdGxlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gZ2V0IHJpZCBvZiB0aGUgdW5uZWVkZWQgb3JpZ2luYWwgdGV4dFxuICAgICAgICBkZWxldGUgYXR0cnMub3JpZ2luYWw7XG4gICAgICB9XG4gICAgICAvLyB0aGUgcmVmZXJlbmNlIGRvZXNuJ3QgZXhpc3QsIHNvIHJldmVydCB0byBwbGFpbiB0ZXh0XG4gICAgICBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGF0dHJzLm9yaWdpbmFsO1xuICAgICAgfVxuICAgICAgYnJlYWs7XG4gIH1cblxuICAvLyBjb252ZXJ0IGFsbCB0aGUgY2hpbGRyZW5cbiAgaSA9IDE7XG5cbiAgLy8gZGVhbCB3aXRoIHRoZSBhdHRyaWJ1dGUgbm9kZSwgaWYgaXQgZXhpc3RzXG4gIGlmICggYXR0cnMgKSB7XG4gICAgLy8gaWYgdGhlcmUgYXJlIGtleXMsIHNraXAgb3ZlciBpdFxuICAgIGZvciAoIHZhciBrZXkgaW4ganNvbm1sWyAxIF0gKSB7XG4gICAgICAgIGkgPSAyO1xuICAgICAgICBicmVhaztcbiAgICB9XG4gICAgLy8gaWYgdGhlcmUgYXJlbid0LCByZW1vdmUgaXRcbiAgICBpZiAoIGkgPT09IDEgKSB7XG4gICAgICBqc29ubWwuc3BsaWNlKCBpLCAxICk7XG4gICAgfVxuICB9XG5cbiAgZm9yICggOyBpIDwganNvbm1sLmxlbmd0aDsgKytpICkge1xuICAgIGpzb25tbFsgaSBdID0gY29udmVydF90cmVlX3RvX2h0bWwoIGpzb25tbFsgaSBdLCByZWZlcmVuY2VzLCBvcHRpb25zICk7XG4gIH1cblxuICByZXR1cm4ganNvbm1sO1xufVxuXG5cbi8vIG1lcmdlcyBhZGphY2VudCB0ZXh0IG5vZGVzIGludG8gYSBzaW5nbGUgbm9kZVxuZnVuY3Rpb24gbWVyZ2VfdGV4dF9ub2RlcygganNvbm1sICkge1xuICAvLyBza2lwIHRoZSB0YWcgbmFtZSBhbmQgYXR0cmlidXRlIGhhc2hcbiAgdmFyIGkgPSBleHRyYWN0X2F0dHIoIGpzb25tbCApID8gMiA6IDE7XG5cbiAgd2hpbGUgKCBpIDwganNvbm1sLmxlbmd0aCApIHtcbiAgICAvLyBpZiBpdCdzIGEgc3RyaW5nIGNoZWNrIHRoZSBuZXh0IGl0ZW0gdG9vXG4gICAgaWYgKCB0eXBlb2YganNvbm1sWyBpIF0gPT09IFwic3RyaW5nXCIgKSB7XG4gICAgICBpZiAoIGkgKyAxIDwganNvbm1sLmxlbmd0aCAmJiB0eXBlb2YganNvbm1sWyBpICsgMSBdID09PSBcInN0cmluZ1wiICkge1xuICAgICAgICAvLyBtZXJnZSB0aGUgc2Vjb25kIHN0cmluZyBpbnRvIHRoZSBmaXJzdCBhbmQgcmVtb3ZlIGl0XG4gICAgICAgIGpzb25tbFsgaSBdICs9IGpzb25tbC5zcGxpY2UoIGkgKyAxLCAxIClbIDAgXTtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICArK2k7XG4gICAgICB9XG4gICAgfVxuICAgIC8vIGlmIGl0J3Mgbm90IGEgc3RyaW5nIHJlY3Vyc2VcbiAgICBlbHNlIHtcbiAgICAgIG1lcmdlX3RleHRfbm9kZXMoIGpzb25tbFsgaSBdICk7XG4gICAgICArK2k7XG4gICAgfVxuICB9XG59XG5cbn0gKSggKGZ1bmN0aW9uKCkge1xuICBpZiAoIHR5cGVvZiBleHBvcnRzID09PSBcInVuZGVmaW5lZFwiICkge1xuICAgIHdpbmRvdy5tYXJrZG93biA9IHt9O1xuICAgIHJldHVybiB3aW5kb3cubWFya2Rvd247XG4gIH1cbiAgZWxzZSB7XG4gICAgcmV0dXJuIGV4cG9ydHM7XG4gIH1cbn0gKSgpICk7XG4iLCIvLyBzYW0vUmFuLmpzXG4vL1xuLy8gU2FtcGxlIGZvciByYW5nZS10eXBlIGlucHV0IGVsZW1uZXQuXG5cblxuaW1wb3J0IHtFLCBVLCBULCBGLCBWfSBmcm9tICd1cHdhcmQnO1xuXG52YXIgZG9tO1xuXG5cbi8vLyAjIyMgU2xpZGVyc1xuLy8vXG4vLy8gQSBzbGlkZXIgaXMganVzdCBhbiBgaW5wdXRgIGVsZW1lbnQgd2l0aCB0eXBlIGByYW5nZWAuXG4vLy8gYC5zZXRzSW1tZWRpYXRlYCB3b3JrcyBsaWtlIGAuc2V0c2AgYnV0IHJlYWN0cyBpbiByZWFsIHRpbWUgdG8gYW55IGNoYW5nZXMuXG4vLy8gVGhlIGBWYCBzZXRzIHVwIGEgc2luZ2xlIHVwd2FyZGFibGUgdmFsdWUuXG4vLy8gSGVyZSwgd2UgdGllIHRoZSBzbGlkZXIgdmFsdWUgdG8gZm9udCBzaXplLlxuXG5cbi8vPT09U1RBUlRcbnZhciBzaXplID0gVigxMik7XG52YXIgc3R5bGUgPSB7IGZvbnRTaXplOiBGYCR7c2l6ZX1wdGAgfTtcbnZhciBTTElERVIgPSB7IHR5cGU6ICdyYW5nZScsIG1pbjogNiwgbWF4OiA0OCwgdmFsdWU6IDEyIH07XG5cbmRvbSA9IEUoJ2RpdicpIC4gaGFzKFtcbiAgRSgnc3BhbicpXG4gICAgLiBoYXMoXCJTYW1wbGUgdGV4dFwiKVxuICAgIC4gaXMoVSh7IHN0eWxlIH0pKVxuICAsXG5cbiAgRSgnaW5wdXQnKVxuICAgIC4gaXMoU0xJREVSKVxuICAgIC4gc2V0c0ltbWVkaWF0ZShzaXplKVxuICAsXG5cbiAgRmBTaXplOiAke3N0eWxlLmZvbnRTaXplfWBcbl0pO1xuLy89PT1FTkRcblxuXG5leHBvcnQgZGVmYXVsdCBkb207XG4iLCIvLyBzYW0vbWFpbi5qc1xuLy9cbi8vIE1haW4gZmlsZSBmb3IgdXB3YXJkIHNhbXBsZXMuXG5cbmltcG9ydCB7RX0gZnJvbSAndXB3YXJkJztcblxuXG4vLyBNYXJrZG93biBpcyB1c2VkIHRvIGZvcm1hdCB0aGUgZGVzY3JpcHRpb24gb2YgZWFjaCBzYW1wbGUuXG5pbXBvcnQgbWFya2Rvd24gZnJvbSAnbWFya2Rvd24vbGliL21hcmtkb3duJztcblxuXG4vLyBTdHlsaW5nIGZvciBzYW1wbGUgcGFnZS5cbmltcG9ydCAnLi9zdHlsZSc7XG5cblxuLy9pbXBvcnQgY250U2FtcGxlIGZyb20gJy4vQ250Jztcbi8vaW1wb3J0IHRtcFNhbXBsZSBmcm9tICcuL1RlbSc7XG4vL2ltcG9ydCBmdW5TYW1wbGUgZnJvbSAnLi9GdW4nO1xuLy9pbXBvcnQgYnV0U2FtcGxlIGZyb20gJy4vQnV0Jztcbi8vaW1wb3J0IGFwaVNhbXBsZSBmcm9tICcuL0FwaSc7XG4vL2ltcG9ydCBtYXBTYW1wbGUgZnJvbSAnLi9NYXAnO1xuLy9pbXBvcnQgc3J0U2FtcGxlIGZyb20gJy4vU3J0Jztcbi8vaW1wb3J0IGNzc1NhbXBsZSBmcm9tICcuL0Nzcyc7XG4vL2ltcG9ydCBmYWRTYW1wbGUgZnJvbSAnLi9GYWQnO1xuaW1wb3J0IHJhblNhbXBsZSBmcm9tICcuL1Jhbic7XG5cbnZhciBzYW1wbGVzID0gW1xuLy8gIHsgc2FtcGxlOiBjbnRTYW1wbGUsIGpzOiAnQ250JywgZGVzYzogXCJDb3VudGluZ1wiIH0sXG4vLyAgeyBzYW1wbGU6IHRtcFNhbXBsZSwganM6ICdUZW0nIH0sXG4vLyAgeyBzYW1wbGU6IGZ1blNhbXBsZSwganM6ICdGdW4nIH0sXG4vLyAgeyBzYW1wbGU6IGJ1dFNhbXBsZSwganM6ICdCdXQnIH0sXG4vLyAgeyBzYW1wbGU6IGFwaVNhbXBsZSwganM6ICdBcGknIH0sXG4vLyAgeyBzYW1wbGU6IG1hcFNhbXBsZSwganM6ICdNYXAnIH0sXG4vLyAgeyBzYW1wbGU6IHNydFNhbXBsZSwganM6ICdTcnQnIH0sXG4vLyAgeyBzYW1wbGU6IGNzc1NhbXBsZSwganM6ICdDc3MnIH0sXG4vLyAgeyBzYW1wbGU6IGZhZFNhbXBsZSwganM6ICdGYWQnIH0sXG4gIHsgc2FtcGxlOiByYW5TYW1wbGUsIGpzOiAnUmFuJywgZGVzYzogXCJTbGlkZXJcIiB9XG5dO1xuXG52YXIgZGl2ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3NhbXBsZXMnKTtcblxuXG4vLyBSZXRyaWV2ZSB0aGUgc2VjdGlvbiBvZiBjb2RlIGJldHdlZW4gPT09U1RBUlQgYW5kID09PUVORC5cbmZ1bmN0aW9uIGdldENvZGUoanMpIHtcbiAgcmV0dXJuIGpzIC5cbiAgICByZXBsYWNlKC9eW15dKj9cXC9cXC89PT1TVEFSVFxcbi8sICcnKSAuXG4gICAgcmVwbGFjZSgvXFwvXFwvPT09RU5EW15dKi8sICcnKTtcbn1cblxuZnVuY3Rpb24gZ2V0RGVzY3JpcHRpb24oanMpIHtcbiAgcmV0dXJuIGpzIC5cbiAgICBtYXRjaCgvXlxcL1xcL1xcLyguKikkL2dtKSAuXG4gICAgbWFwKGxpbmUgPT4gbGluZS5yZXBsYWNlKC9eXFwvXFwvXFwvXFxzKi8sICcnKSkgLlxuICAgIGpvaW4oJ1xcbicpO1xufVxuXG5cbi8vIEluc2VydCBhIHNpbmdsZSBzYW1wbGUuXG5mdW5jdGlvbiBvbmVTYW1wbGUoc2FtcGxlKSB7XG5cbiAgZnVuY3Rpb24gdGV4dChyZXNwb25zZSkgeyByZXR1cm4gcmVzcG9uc2UudGV4dCgpOyB9XG4gIGZ1bmN0aW9uIGFwcGVuZCh0ZXh0KSAgIHsgY29kZS5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShnZXRDb2RlKHRleHQpKSk7IH1cblxuICB2YXIgc2VjdGlvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NlY3Rpb24nKTtcbiAgc2VjdGlvbi5pZCA9IHNhbXBsZS5qcztcbiAgdmFyIGpzID0gZmV0Y2goJ3NyYy8nICsgc2FtcGxlLmpzICsgJy5qcycpIC4gdGhlbih0ZXh0KTtcblxuICAvLyBkZXNjcmlwdGlvbiBibG9ja1xuICB2YXIgZGVzY3JpcHRpb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgZGVzY3JpcHRpb24uY2xhc3NOYW1lID0gJ2Rlc2MnO1xuICBzZWN0aW9uLmFwcGVuZENoaWxkKGRlc2NyaXB0aW9uKTtcbiAganMudGhlbih0ZXh0ID0+IGRlc2NyaXB0aW9uLmlubmVySFRNTCA9IG1hcmtkb3duLnRvSFRNTChnZXREZXNjcmlwdGlvbih0ZXh0KSkpO1xuXG4gIC8vIGNvZGUgYmxvY2tcbiAgdmFyIGNvZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgY29kZS5jbGFzc05hbWUgPSAnY29kZSc7XG4gIHNlY3Rpb24uYXBwZW5kQ2hpbGQoY29kZSk7XG4gIGpzLnRoZW4oYXBwZW5kKTtcblxuICAvLyByZXN1bHQgYmxvY2tcbiAgdmFyIHJlc3VsdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICByZXN1bHQuY2xhc3NOYW1lID0gJ3Jlc3VsdCc7XG4gIHNlY3Rpb24uYXBwZW5kQ2hpbGQocmVzdWx0KTtcbiAgcmVzdWx0LmFwcGVuZENoaWxkKHNhbXBsZS5zYW1wbGUpO1xuXG4gIC8vIFB1dCB0aGlzIHNhbXBsZSBpbiB0aGUgSFRNTC5cbiAgZGl2LmFwcGVuZENoaWxkKHNlY3Rpb24pO1xufVxuXG5mdW5jdGlvbiBnbygpIHtcbiAgc2FtcGxlcy5mb3JFYWNoKG9uZVNhbXBsZSk7XG59XG5cbmRpdi5hcHBlbmRDaGlsZChFKCdkaXYnKSAuIGhhcyhbXG4gIFwiU2FtcGxlczogXCIsXG5cbiAgRSgnc3BhbicpIC4gaGFzKFxuICAgIHNhbXBsZXMgLiBhcyhcbiAgICAgIHNhbXBsZSA9PlxuICAgICAgICBFKCdBJykgLiBpcyh7IGhyZWY6IGAjJHtzYW1wbGUuanN9YCB9KSAuIGhhcyhzYW1wbGUuZGVzYywgJyAnKVxuICAgIClcbiAgKVxuXSkpO1xuXG5nbygpO1xuIiwiLy8gU3R5bGluZyBmb3Igc2FtcGxlcy5cbi8vID09PT09PT09PT09PT09PT09PT09XG5cbmltcG9ydCB7VSwgVXBTdHlsZX0gZnJvbSAndXB3YXJkJztcblxudmFyIHthc3NpZ24sIGtleXN9ID0gT2JqZWN0O1xuXG5cbnZhciB0aGVtZSA9IFUoe1xufSk7XG5cbnZhciBzZXRUaGVtZSA9IHQgPT4gYXNzaWduKHRoZW1lLCB0aGVtZXNbdF0pO1xudmFyIGdldFRoZW1lTmFtZXMgPSBfID0+IGtleXModGhlbWVzKTtcblxudmFyIHRoZW1lcyA9IHtcbiAgc3Vuc2V0OiB7XG4gICAgYm9keUJhY2tncm91bmRDb2xvcjogXCJ3aGVhdFwiXG4gIH1cbn07XG5cbnNldFRoZW1lKFwic3Vuc2V0XCIpO1xuXG5VcFN0eWxlKFtcblxuICBbXCJib2R5XCIsIHtcbiAgICBmb250RmFtaWx5IDogJ0xhdG8sIHNhbnMtc2VyaWYnLFxuICAgIGJhY2tncm91bmRDb2xvcjogdGhlbWUuYm9keUJhY2tncm91bmRDb2xvcixcbiAgICBwYWRkaW5nTGVmdDogJzEycHgnLFxuICAgIHBhZGRpbmdSaWdodDogJzEycHgnXG4gIH1dLFxuXG4gIFtcImgzXCIsIHtcbiAgICBiYWNrZ3JvdW5kQ29sb3I6ICdicm93bicsXG4gICAgY29sb3I6ICd3aGl0ZScsXG4gICAgcGFkZGluZzogJzZweCdcbiAgfV0sXG5cbiAgW1wiLmNvZGVcIiwge1xuICAgIHdoaXRlU3BhY2U6ICdwcmUnLFxuICAgIGZvbnRGYW1pbHk6ICdtb25vc3BhY2UnLFxuICAgIGJhY2tncm91bmRDb2xvcjogJ3BpbmsnLFxuICAgIG1hcmdpbjogJzEycHggNDBweCcsXG4gICAgcGFkZGluZzogJzEycHgnLFxuICAgIGZvbnRTaXplOiAnbGFyZ2VyJ1xuICB9XSxcblxuICBbXCIucmVzdWx0XCIsIHtcbiAgICBiYWNrZ3JvdW5kQ29sb3I6ICdiZWlnZScsXG4gICAgbWFyZ2luOiAnMTJweCA0MHB4JyxcbiAgICBwYWRkaW5nOiAnMTJweCdcbiAgfV0sXG5cbiAgW1wiLmhpZGVcIiwge1xuICAgIGRpc3BsYXk6ICdub25lJ1xuICB9XSxcblxuICBbXCJjb2RlXCIsIHtcbiAgICBmb250U2l6ZTogJ2xhcmdlcicsXG4gICAgYmFja2dyb3VuZENvbG9yOiAnbGlnaHRncmF5JyxcbiAgICBib3JkZXI6IFwiMXB4IHNvbGlkIGdyYXlcIixcbiAgICBwYWRkaW5nTGVmdDogXCIwLjJlbVwiLFxuICAgIHBhZGRpbmdSaWdodDogXCIwLjJlbVwiXG4gIH1dXG5cbl0pO1xuXG5leHBvcnQge1xuICBzZXRUaGVtZSxcbiAgZ2V0VGhlbWVOYW1lc1xufVxuIiwiLy8gQmFzaWMgZXhwb3J0c1xuLy8gPT09PT09PT09PT09PVxuXG4vLyBUaGlzIGZpbGUgaXMgaW5kZXguanMgaW4gdGhlIHJvb3Qgb2YgdGhlIHByb2plY3QsXG4vLyBzbyB0aGF0IGFwcHMgdXNpbmcgaXQgY2FuIGRvIGBpbXBvcnQge1V9IGZyb20gJ3Vwd2FyZCc7YC5cbi8vIEl0IHJlLWV4cG9ydHMgaW50ZXJmYWNlcyBzbyBjbGllbnRzIGNhbiBpbXBvcnQgZnJvbSB0aGlzIHNpbmdsZSBtb2R1bGUuXG5cbmltcG9ydCAgICAgICAgICAgICAgJy4vc3JjL0Fycic7XG5pbXBvcnQgVXBTdHlsZSBmcm9tICcuL3NyYy9Dc3MnO1xuaW1wb3J0IFVwQ291bnQgZnJvbSAnLi9zcmMvQ250JztcbmltcG9ydCBFICAgICAgIGZyb20gJy4vc3JjL0VsdCc7XG5pbXBvcnQgRkFERSAgICBmcm9tICcuL3NyYy9GYWQnO1xuaW1wb3J0IEMgICAgICAgZnJvbSAnLi9zcmMvRnVuJztcbmltcG9ydCBVICAgICAgIGZyb20gJy4vc3JjL09iaic7XG5pbXBvcnQgRiAgICAgICBmcm9tICcuL3NyYy9UZW0nO1xuaW1wb3J0IFQgICAgICAgZnJvbSAnLi9zcmMvVHh0JztcbmltcG9ydCBWICAgICAgIGZyb20gJy4vc3JjL1Vwdyc7XG5cbmV4cG9ydCB7VSwgVCwgRSwgRiwgQywgViwgVXBDb3VudCwgVXBTdHlsZSwgRkFERX07XG5cbmV4cG9ydCB7dGVzdCwgdGVzdEdyb3VwLCBza2lwLCB1bnNraXAsIGNvbnNvbGVSZXBvcnRlciwgaHRtbFJlcG9ydGVyfSBmcm9tICcuL3NyYy9Uc3QnO1xuXG5leHBvcnQgKiBmcm9tICcuL3NyYy9UYWcnO1xuIiwiLy8gQWNjZXNzQ29udHJvbGxlclxuLy8gPT09PT09PT09PT09PT09PVxuXG4vLyBDYXB0dXJlIGFuZCB3YXRjaCBhY2Nlc3NlcyB0byBwcm9wZXJ0aWVzIG1hZGUgZHVyaW5nIGNvbXB1dGF0aW9ucy5cblxuLy8gQ29udmVuaWVuY2UuXG52YXIge29ic2VydmUsIHVub2JzZXJ2ZX0gPSBPYmplY3Q7XG5cbmltcG9ydCB7T2JzZXJ2ZXJ9IGZyb20gJy4vT2JzJztcblxuLy8gQWNjZXNzTm90aWZpZXJcbi8vIC0tLS0tLS0tLS0tLS0tXG5cbi8vIGBhY2Nlc3NOb3RpZmllcmAgYWxsb3dzIHVwd2FyZGFibGVzIHRvIHJlcG9ydCBwcm9wZXJ0eSBhY2Nlc3Nlcy5cbi8vIEl0IGlzIGEgc3RhY2sgdG8gaGFuZGxlIG5lc3RlZCBpbnZvY2F0aW9ucyBvZiBjb21wdXRhYmxlcy5cbnZhciBfYWNjZXNzTm90aWZpZXIgPSBbXTtcblxudmFyIGFjY2Vzc05vdGlmaWVyID0ge1xuICBwb3A6ICBmdW5jdGlvbigpICAgICAgICAgICAgICAgeyBfYWNjZXNzTm90aWZpZXIuc2hpZnQoKTsgfSxcbiAgcHVzaDogZnVuY3Rpb24obm90aWZpZXIpICAgICAgIHsgX2FjY2Vzc05vdGlmaWVyLnVuc2hpZnQobm90aWZpZXIpOyB9LFxuICBub3RpZnk6IGZ1bmN0aW9uKG5vdGlmaWNhdGlvbikge1xuICAgIGlmIChfYWNjZXNzTm90aWZpZXIubGVuZ3RoKSBfYWNjZXNzTm90aWZpZXJbMF0obm90aWZpY2F0aW9uKSA7XG4gIH1cbn07XG5cbi8vIG1ha2VBY2Nlc3NDb250cm9sbGVyXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4vLyBNYWtlIGFuIGFjY2VzcyBjb250cm9sbGVyLCBhbGxvd2luZyBhY2Nlc3NlcyB0byBiZSBjYXB0dXJlZCBhbmQgb2JzZXJ2ZWQuXG5mdW5jdGlvbiBtYWtlQWNjZXNzQ29udHJvbGxlcihyZXJ1bikge1xuICAvLyBgYWNjZXNzZXNgIGlzIGEgbWFwIGluZGV4ZWQgYnkgb2JqZWN0LFxuICAvLyBjb250YWluaW5nIFwiYWNjZXNzXCIgZW50cmllcyB3aXRoIHZhbHVlcyBvZiBge25hbWVzOiBbXSwgb2JzZXJ2ZXJ9YC5cbiAgLy8gYG5hbWVzYCBvZiBudWxsIG1lYW5zIHRvIHdhdGNoIHByb3BlcnRpZXMgb2YgYW55IG5hbWUuXG4gIC8vIEl0IGlzIGJ1aWx0IGJ5IGNhbGxzIHRvIGBub3RpZnlBY2Nlc3NgLCBpbnZva2VkIHRocm91Z2ggYGFjY2Vzc05vdGlmaWVyYC5cbiAgdmFyIGFjY2Vzc2VzID0gbmV3IE1hcCgpO1xuXG4gIGZ1bmN0aW9uIHVub2JzZXJ2ZSgpIHtcbiAgICBhY2Nlc3Nlcy5mb3JFYWNoKCh7b2JzZXJ2ZXJ9KSA9PiBvYnNlcnZlci51bm9ic2VydmUoKSk7XG4gIH1cblxuICBmdW5jdGlvbiBvYnNlcnZlKCkge1xuICAgIGFjY2Vzc2VzLmZvckVhY2goKHtvYnNlcnZlcn0pID0+IG9ic2VydmVyLm9ic2VydmUoWyd1cGRhdGUnLCAnYWRkJywgJ2RlbGV0ZSddKSk7XG4gIH1cblxuICAvLyBTdGFydCBjYXB0dXJpbmcgYWNjZXNzZWQgZGVwZW5kZW5jaWVzLlxuICBmdW5jdGlvbiBjYXB0dXJlKCkge1xuICAgIGFjY2Vzc2VzLmNsZWFyKCk7XG4gICAgYWNjZXNzTm90aWZpZXIucHVzaChub3RpZnlBY2Nlc3MpO1xuICB9XG5cbiAgLy8gU3RvcCBjYXB0dXJpbmcgYWNjZXNzZWQgZGVwZW5kZW5jaWVzLlxuICBmdW5jdGlvbiB1bmNhcHR1cmUoKSB7XG4gICAgYWNjZXNzTm90aWZpZXIucG9wKCk7XG4gIH1cblxuICBmdW5jdGlvbiBzdGFydCgpIHtcbiAgICB1bm9ic2VydmUoKTtcbiAgICBjYXB0dXJlKCk7XG4gIH1cblxuICBmdW5jdGlvbiBzdG9wKCkge1xuICAgIHVuY2FwdHVyZSgpO1xuICAgIG9ic2VydmUoKTtcbiAgfVxuXG4gIC8vIGBub3RpZnlBY2Nlc3NgIGlzIHRoZSBjYWxsYmFjayBpbnZva2VkIGJ5IHVwd2FyZGFibGVzIHdoZW4gYSBwcm9wZXJ0eSBpcyBhY2Nlc3NlZC5cbiAgLy8gSXQgcmVjb3JkcyB0aGUgYWNjZXNzIGluIHRoZSBgYWNjZXNzZXNgIG1hcC5cbiAgZnVuY3Rpb24gbm90aWZ5QWNjZXNzKHtvYmplY3QsIG5hbWV9KSB7XG5cbiAgICAvLyBDcmVhdGUgYW4gb2JzZXJ2ZXIgZm9yIGNoYW5nZXMgaW4gcHJvcGVydGllcyBhY2Nlc3NlZCBkdXJpbmcgZXhlY3V0aW9uIG9mIHRoaXMgZnVuY3Rpb24uXG4gICAgZnVuY3Rpb24gbWFrZUFjY2Vzc2VkT2JzZXJ2ZXIoKSB7XG4gICAgICByZXR1cm4gT2JzZXJ2ZXIob2JqZWN0LCBmdW5jdGlvbihjaGFuZ2VzKSB7XG4gICAgICAgIGNoYW5nZXMuZm9yRWFjaCgoe3R5cGUsIG5hbWV9KSA9PiB7XG4gICAgICAgICAgdmFyIHtuYW1lc30gPSBhY2Nlc3NFbnRyeTtcbiAgICAgICAgICBpZiAoIW5hbWVzIHx8IHR5cGUgPT09ICd1cGRhdGUnICYmIG5hbWVzLmluZGV4T2YobmFtZSkgIT09IC0xKVxuICAgICAgICAgICAgcmVydW4oKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBNYWtlIGEgbmV3IGVudHJ5IGluIHRoZSBhY2Nlc3MgdGFibGUsIGNvbnRhaW5pbmcgaW5pdGlhbCBwcm9wZXJ0eSBuYW1lIGlmIGFueVxuICAgIC8vIGFuZCBvYnNlcnZlciBmb3IgcHJvcGVydGllcyBhY2Nlc3NlZCBvbiB0aGUgb2JqZWN0LlxuICAgIGZ1bmN0aW9uIG1ha2VBY2Nlc3NFbnRyeSgpIHtcbiAgICAgIGFjY2Vzc2VzLnNldChvYmplY3QsIHtcbiAgICAgICAgbmFtZXM6ICAgIG5hbWUgPyBbbmFtZV0gOiBudWxsLFxuICAgICAgICBvYnNlcnZlcjogbWFrZUFjY2Vzc2VkT2JzZXJ2ZXIoKVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gSWYgcHJvcGVydGllcyBvbiB0aGlzIG9iamVjdCBhcmUgYWxyZWFkeSBiZWluZyB3YXRjaGVkLCB0aGVyZSBpcyBhbHJlYWR5IGFuIGVudHJ5XG4gICAgLy8gaW4gdGhlIGFjY2VzcyB0YWJsZSBmb3IgaXQuIEFkZCBhIG5ldyBwcm9wZXJ0eSBuYW1lIHRvIHRoZSBleGlzdGluZyBlbnRyeS5cbiAgICBmdW5jdGlvbiBzZXRBY2Nlc3NFbnRyeSgpIHtcbiAgICAgIGlmIChuYW1lICYmIGFjY2Vzc0VudHJ5Lm5hbWVzKSBhY2Nlc3NFbnRyeS5uYW1lcy5wdXNoKG5hbWUpO1xuICAgICAgZWxzZSBhY2Nlc3NFbnRyeS5uYW1lcyA9IG51bGw7XG4gICAgfVxuXG4gICAgdmFyIGFjY2Vzc0VudHJ5ID0gYWNjZXNzZXMuZ2V0KG9iamVjdCk7XG4gICAgaWYgKGFjY2Vzc0VudHJ5KSBzZXRBY2Nlc3NFbnRyeSgpO1xuICAgIGVsc2UgbWFrZUFjY2Vzc0VudHJ5KCk7XG4gIH1cblxuICByZXR1cm4ge3N0YXJ0LCBzdG9wfTtcbn1cblxuZXhwb3J0IHtcbiAgbWFrZUFjY2Vzc0NvbnRyb2xsZXIsXG4gIGFjY2Vzc05vdGlmaWVyXG59O1xuIiwiLy8gQXJyYXkgbWV0aG9kcyBmb3IgbWFpbnRhaW5pbmcgbWFwcywgZmlsdGVycywgZXRjLlxuLy8gUGxhY2UgcHJvdG90eXBlcyBvbiBBcnJheSBhbmQgVXB3YXJkYWJsZSBvYmplY3RzLlxuLy9pbXBvcnQga2VlcFJldmVyc2VkIGZyb20gJy4vUmV2Jztcbi8vaW1wb3J0IGtlZXBVbmlxdWUgICBmcm9tICcuL1VucSc7XG4vL2ltcG9ydCBrZWVwRmlsdGVyZWQgZnJvbSAnLi9GaWwnO1xuaW1wb3J0IFVwTWFwICAgICAgIGZyb20gJy4vTWFwJztcbmltcG9ydCB7bWFwT2JqZWN0fSBmcm9tICcuL091dCc7XG5pbXBvcnQgVXBTb3J0ICAgICAgZnJvbSAnLi9TcnQnO1xuLy9pbXBvcnQga2VlcFNsaWNlZCBmcm9tICcuL1NsYyc7XG5cbnZhciB7ZGVmaW5lUHJvcGVydHksIGRlZmluZVByb3BlcnRpZXN9ID0gT2JqZWN0O1xudmFyIHtwcm90b3R5cGV9ID0gQXJyYXk7XG5cbi8vIFBsYWNlIHRoZSBtZXRob2RzIG9uIHRoZSBBcnJheSBhbmQgVXB3YXJkYWJsZSBwcm90b3R5cGUuXG52YXIgbWV0aG9kTWFwID0ge1xuICBhczogICBVcE1hcCxcbiAgYnk6ICAgVXBTb3J0Ly8sXG4vLyAgaWY6ICAga2VlcEZpbHRlcmVkLFxuLy8gIG9mOiAgIGtlZXBTbGljZWQsXG4vLyAgdXA6ICAga2VlcFJldmVyc2VkLFxuLy8gIHVuaXE6IGtlZXBVbmlxdWVcbn07XG5cbnZhciBhcnJheVByb3RvTXVuZ2VkID0gXCJfX1VQV0FSRF9NRVRIT0RTXCI7XG5cbnZhciBtZXRob2REZXNjcmlwdG9ycyA9IG1hcE9iamVjdChtZXRob2RNYXAsIHYgPT4gKHtcbiAgdmFsdWUoLi4uYXJncykgeyByZXR1cm4gdih0aGlzLCAuLi5hcmdzKTsgfX0pXG4pO1xuXG5pZiAoIXByb3RvdHlwZVthcnJheVByb3RvTXVuZ2VkXSkge1xuICBkZWZpbmVQcm9wZXJ0aWVzKHByb3RvdHlwZSwgbWV0aG9kRGVzY3JpcHRvcnMpO1xuICBkZWZpbmVQcm9wZXJ0eShwcm90b3R5cGUsIGFycmF5UHJvdG9NdW5nZWQsIHt2YWx1ZTogdHJ1ZX0pO1xufVxuIiwiLy8ga2VlcEFzc2lnbmVkXG4vLyA9PT09PT09PT09PT1cblxuLy8gRGVmaW5lIGFuIG9iamVjdCBjb21wb3NlZCBvZiBtdWx0aXBsZSBvYmplY3RzLCB3aGljaCBrZWVwcyBpdHNlbGYgdXBkYXRlZC5cbi8vIEFkZGl0aW9uIG9iamVjdHMgY2FuIGJlIGFkZGVkIHdpdGggYGFuZGAgYW5kIGBvcmAuXG4vLyBBbHNvIGhhbmRsZXMgc3Vib2JqZWN0cy5cblxuLy8gQ29udmVuaWVuY2UuXG5pbXBvcnQge3Vwd2FyZENvbmZpZywgdXB3YXJkYWJsZUlkfSAgIGZyb20gJy4vQ2ZnJztcbmltcG9ydCB7YXJnaWZ5fSAgICAgICAgICAgICAgICAgICAgICAgZnJvbSAnLi9JZnknO1xuaW1wb3J0IHttYWtlT2JzZXJ2ZXIsIG9ic2VydmVPYmplY3R9ICBmcm9tICcuL09icyc7XG5pbXBvcnQge2lzT2JqZWN0LCB2YWx1ZWl6ZSwgbWFwT2JqZWN0LCBwcm9wR2V0dGVyfSBmcm9tICcuL091dCc7XG5pbXBvcnQgVSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZyb20gJy4vVXB3JztcbmltcG9ydCB7cmVwbGFjZX0gICAgICAgICAgICAgICAgICAgICAgZnJvbSAnLi9VdGwnO1xuXG52YXIge2NyZWF0ZSwgYXNzaWduLCBkZWZpbmVQcm9wZXJ0eX0gPSBPYmplY3Q7XG52YXIge3B1c2gsIHVuc2hpZnR9ID0gQXJyYXkucHJvdG90eXBlO1xuXG4vLyBDcmVhdGUgdGhlIGBrZWVwQXNzaWduZWRgIG9iamVjdC5cbmZ1bmN0aW9uIGtlZXBBc3NpZ25lZCguLi5vYmpzKSB7XG4gIHZhciBrYSA9IGNyZWF0ZShrZWVwQXNzaWduZWRQcm90b3R5cGUpO1xuICBkZWZpbmVQcm9wZXJ0eShrYSwgJ29ianMnLCB7IHZhbHVlOiBbXSB9KTsgLy8gZmlyc3QtY29tZSBmaXJzdC1zZXJ2ZWRcbiAgWy4uLm9ianNdLmZvckVhY2gobyA9PiBfa2VlcEFzc2lnbmVkKGthLCBvKSk7XG4gIHJldHVybiBrYTtcbn1cblxuLy8gUmV0dXJuIHByb3BlcnR5J3MgdmFsdWUgZnJvbSB0aGUgZmlyc3Qgb2JqZWN0IGluIHdoaWNoIGl0IGFwcGVhcnMuXG5mdW5jdGlvbiBmaW5kRmlyc3RQcm9wKG9ianMsIHApIHtcbiAgZm9yIChsZXQgb2JqIG9mIG9ianMpIHtcbiAgICBpZiAob2JqICYmIG9iai5oYXNPd25Qcm9wZXJ0eShwKSkgeyByZXR1cm4gdmFsdWVpemUob2JqW3BdKTsgfVxuICB9XG59XG5cbi8vIENhbGN1bGF0ZSB2YWx1ZSBmb3IgYSBwcm9wZXJ0eSwgcmVjdXJzaXZlbHkuXG5mdW5jdGlvbiBjYWxjUHJvcChrYSwgcCkge1xuICB2YXIgdmFsID0ga2FbcF07XG4gIGlmIChpc0tlZXBBc3NpZ25lZCh2YWwpKSB7XG4gICAgcmVjYWxjKHZhbCk7XG4gIH0gZWxzZSB7XG4gICAgdmFsLnZhbCA9IGZpbmRGaXJzdFByb3Aoa2Eub2JqcywgcCk7XG4gIH1cbn1cblxuLy8gUGxhY2UgYSBrZXkgaW4gdGhlIGtlcHQgb2JqZWN0LlxuZnVuY3Rpb24gcGxhY2VLZXkoa2EsIHYsIGssIHB1c2hlcikge1xuICBpZiAoaXNPYmplY3QodikpIHtcbiAgICBpZiAoayBpbiBrYSkge1xuICAgICAgX2tlZXBBc3NpZ25lZChrYVtrXSwgdiwgcHVzaGVyKTtcbiAgICB9IGVsc2Uge1xuICAgICAga2Fba10gPSBzdWJLZWVwQXNzaWduZWQoa2Eub2JqcywgaywgcHVzaGVyKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgaWYgKGsgaW4ga2EpIHtcbiAgICAgIGthW2tdLnZhbCA9IGNhbGNQcm9wKGthLCBrKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZGVmaW5lUHJvcGVydHkoa2EsIGssIHtcbiAgICAgICAgZ2V0KCkgeyByZXR1cm4gVShmaW5kRmlyc3RQcm9wKGthLm9ianMsIGspKTsgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZVxuICAgICAgfSk7XG4gICAgICAvL3Vwd2FyZCh2LCBrYVtrXSk7XG4gICAgfVxuICB9XG59XG5cbi8vIFJlY2FsY3VsYXRlIHZhbHVlcyBmb3IgYWxsIGtleXMsIGFzIHdoZW4gYW4gb2JqZWN0IGNoYW5nZXMuXG5mdW5jdGlvbiByZWNhbGMoa2EpIHtcbiAgZm9yIChsZXQgW2tleSwgdmFsXSBvZiBvYmplY3RQYWlycyhrYSkpIHtcbiAgICBpZiAoaXNLZWVwQXNzaWduZWQodmFsKSkgeyByZWNhbGModmFsKTsgfVxuICAgIGVsc2UgeyB2YWwudmFsID0gZ2V0dGVyKGtleSk7IH1cbiAgfVxufVxuXG4vLyBNYWtlIGEga2VlcEFzc2lnbmVkIG9iamVjdCBmb3Igc3Vib2JqZWN0cyB3aXRoIHNvbWUga2V5LlxuZnVuY3Rpb24gc3ViS2VlcEFzc2lnbmVkKG9ianMsIGssIHB1c2hlcikge1xuICB2YXIga2EgPSBrZWVwQXNzaWduZWQoKTtcbiAgb2Jqc1xuICAgIC5tYXAocHJvcEdldHRlcihrKSlcbiAgICAuZmlsdGVyKEJvb2xlYW4pXG4gICAgLmZvckVhY2gobyA9PiBfa2VlcEFzc2lnbmVkKGthLCBvLCBwdXNoZXIpKTtcbiAgcmV0dXJuIGthO1xufVxuXG4vLyBQdXNoIG9uZSBvYmplY3Qgb250byBhIGtlZXBBc3NpZ25lZCBvYmplY3QsIGVpdGhlciBhdCB0aGUgZnJvbnQgb3IgYmFjay5cbmZ1bmN0aW9uIF9rZWVwQXNzaWduZWQoa2EsIG8sIHB1c2hlciA9IHVuc2hpZnQpIHtcblxuICAvLyBIYW5kbGUgYW4gdXB3YXJkYWJsZSBvYmplY3QgY2hhbmdpbmcsIGluIGNhc2Ugb2YgYE8obW9kZWwub2JqKWAuXG4gIGZ1bmN0aW9uIG9iamVjdENoYW5nZWQoX28pIHtcbiAgICByZXBsYWNlKGthLm9ianMsIG8sIF9vKTtcbiAgICByZWNhbGMoa2EpO1xuICB9XG5cbiAgLy8gQFRPRE86IGZpZ3VyZSBvdXQgaG93IHRvIGhhbmRsZSB0aGlzLlxuICAvLyAgdXB3YXJkKG8sIG9iamVjdENoYW5nZWQpO1xuXG4gIGZ1bmN0aW9uIGtleSh2LCBrKSB7XG4gICAgcGxhY2VLZXkoa2EsIHYsIGspO1xuICB9XG5cbiAgZnVuY3Rpb24gdXBkYXRlKGssIHYpIHtcbiAgICBwcm9jZXNzS2V5KGssIHYpO1xuICB9XG5cbiAgZnVuY3Rpb24gX2RlbGV0ZShrKSB7XG4gICAgcmVjYWxjKGthKTtcbiAgfVxuXG4gIHZhciBoYW5kbGVycyA9IHtcbiAgICBhZGQ6IGFyZ2lmeShwbGFjZUtleSwga2EpLFxuICAgIHVwZGF0ZTogYXJnaWZ5KHBsYWNlS2V5LCBrYSksXG4gICAgZGVsZXRlOiBfZGVsZXRlXG4gIH07XG4gIG9ic2VydmVPYmplY3QobywgbWFrZU9ic2VydmVyKGhhbmRsZXJzKSk7XG5cbiAgcHVzaGVyLmNhbGwoa2Eub2Jqcywgbyk7XG4gIG1hcE9iamVjdChvLCAodiwgaykgPT4gcGxhY2VLZXkoa2EsIHYsIGssIHB1c2hlcikpO1xuICByZXR1cm4ga2E7XG59XG5cbi8vIFByb3RvdHlwZSBvZiBrZWVwQXNzaWduZWQgb2JqZWN0czsgZGVmaW5lIGBhbmRgIGFuZCBgb3JgLlxudmFyIGtlZXBBc3NpZ25lZFByb3RvdHlwZSA9IHtcbiAgYW5kKG8pIHsgcmV0dXJuIF9rZWVwQXNzaWduZWQodGhpcywgbywgdW5zaGlmdCk7IH0sXG4gIG9yIChvKSB7IHJldHVybiBfa2VlcEFzc2lnbmVkKHRoaXMsIG8sIHB1c2ggICApOyB9XG59O1xuXG4vLyBJcyBzb21ldGhpbmcgYSBga2VlcEFzc2lnbmVkYCBvYmplY3Q/XG5mdW5jdGlvbiBpc0tlZXBBc3NpZ25lZChvKSB7XG4gIHJldHVybiBrZWVwQXNzaWduZWRQcm90b3R5cGUuaXNQcm90b3R5cGVPZihvKTtcbn1cblxuZXhwb3J0IGRlZmF1bHQga2VlcEFzc2lnbmVkO1xuZXhwb3J0IHtpc0tlZXBBc3NpZ25lZH07IC8vbmVlZGVkP1xuIiwiLy8gQXN5bmNocm9ub3VzIGZ1bmN0aW9uc1xuLy8gPT09PT09PT09PT09PT09PT09PT09PVxuXG52YXIge2Fzc2lnbiwgZGVmaW5lUHJvcGVydHksIG9ic2VydmUsIHVub2JzZXJ2ZX0gPSBPYmplY3Q7XG52YXIge2FwcGx5fSA9IEZ1bmN0aW9uLnByb3RvdHlwZTtcblxuaW1wb3J0IHt1cHdhcmRDb25maWd9IGZyb20gJy4vQ2ZnJztcblxuLy8gUmV0dXJuIGEgcHJvbWlzZSBmb3Igc29tZSB0aW1lIGluIHRoZSBmdXR1cmUsXG4vLyBwYXNzaW5nIHRocm91Z2ggdGhlIGludm9raW5nIHByb21pc2UncyB2YWx1ZTpcbi8vIGBgYFxuLy8gUHJvbWlzZS5yZXNvbHZlKDk5KS50aGVuKHdhaXQoMjUwKSkgLy8gcHJvbWlzZSB2YWx1ZSBpcyA5OVxuLy8gYGBgXG5mdW5jdGlvbiB3YWl0KG1zID0gMCkge1xuICByZXR1cm4gZnVuY3Rpb24odmFsKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4gc2V0VGltZW91dChfID0+IHJlc29sdmUodmFsKSwgbXMpKTtcbiAgfTtcbn1cblxuLy8gSW1wbGVtZW50IFByb21pc2UuZG9uZS5cbi8vIFVzZSBtYXkgc2V0IFByb21pc2Uub25Eb25lRXJyb3IgdG8gdHJhcCBlcnJvcnMuXG5mdW5jdGlvbiBfdGhyb3coZSkgeyB0aHJvdyBlOyB9XG5pZiAoIVByb21pc2UucHJvdG90eXBlLmRvbmUpIHtcbiAgZGVmaW5lUHJvcGVydHkoUHJvbWlzZS5wcm90b3R5cGUsICdkb25lJywge1xuICAgIHZhbHVlOiBmdW5jdGlvbihmdWxmaWxsLCByZWplY3QpIHtcbiAgICAgIHJldHVybiB0aGlzXG4gICAgICAgIC50aGVuKGZ1bGZpbGwsIHJlamVjdClcbiAgICAgICAgLmNhdGNoKGUgPT4gc2V0VGltZW91dChQcm9taXNlLm9uRG9uZUVycm9yIHx8IF90aHJvdywgMSwgZSkpO1xuICAgIH1cbiAgfSk7XG59XG5cbi8vIEltcGxlbWVudCBgZ2V0YCBvbiBwcm9taXNlcy5cbmlmICghUHJvbWlzZS5wcm90b3R5cGUuZ2V0KSB7XG4gIGRlZmluZVByb3BlcnR5KFByb21pc2UucHJvdG90eXBlLCAnZ2V0Jywge1xuICAgIHZhbHVlOiBmdW5jdGlvbihwcm9wKSB7IHJldHVybiB0aGlzLnRoZW4obyA9PiBvW3Byb3BdKTsgfVxuICB9KTtcbn1cblxuLy8gQ3JlYXRlIGEgYERlZmVycmVkYCBvYmplY3QsIGEgY29tYmluYXRpb24gb2YgYSBwcm9taXNlIGFuZCBpdHNcbi8vIHJlc29sdmUgYW5kIHJlamVjdCBmdW5jdGlvbnMuXG5mdW5jdGlvbiBEZWZlcnJlZCgpIHtcbiAgdmFyIGRlZmVycmVkID0ge307XG4gIGRlZmVycmVkLnByb21pc2UgPSBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICBkZWZlcnJlZC5yZXNvbHZlID0gcmVzb2x2ZTtcbiAgICBkZWZlcnJlZC5yZWplY3QgID0gcmVqZWN0O1xuICB9KTtcbiAgcmV0dXJuIGRlZmVycmVkO1xufVxuXG4vLyBJbXBsZW1lbnQgYGRlZmVyYCBvbiBgUHJvbWlzZWAuXG5pZiAodXB3YXJkQ29uZmlnLk1PRElGWV9CVUlMVElOX1BST1RPVFlQRSAmJiAhUHJvbWlzZS5kZWZlcikge1xuICBkZWZpbmVQcm9wZXJ0eShQcm9taXNlLCAnZGVmZXInLCB7XG4gICAgdmFsdWU6IERlZmVycmVkXG4gIH0pO1xufVxuXG4vLyBQcm9taXNlIGZyb20gb25lLXRpbWUgT2JqZWN0Lm9ic2VydmUuXG4vLyBVc2FnZTogYGBgcHJvbWlzZUNoYW5nZXMob2JqLCBbJ3VwZGF0ZSddKS50aGVuKGZ1bmN0aW9uKGNoYW5nZXMpIHsuLi5gXG5mdW5jdGlvbiBwcm9taXNlQ2hhbmdlcyhvYmplY3QsIHR5cGVzKSB7XG4gIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlKSB7XG4gICAgZnVuY3Rpb24gb2JzZXJ2ZXIoY2hhbmdlcykge1xuICAgICAgcmVzb2x2ZShjaGFuZ2VzKTtcbiAgICAgIHVub2JzZXJ2ZShvYmplY3QsIG9ic2VydmVyKTtcbiAgICB9XG4gICAgb2JzZXJ2ZShvYmplY3QsIG9ic2VydmVyLCB0eXBlcyk7XG4gIH0pO1xufVxuXG5cbi8vIE1ha2UgYSBnZW5lcmF0b3Igd2hpY2ggY2FsbHMgYSBmdW5jdGlvbiBvdmVyIGFuZCBvdmVyLlxuLy8gRWFjaCBpdGVyYXRpb24ncyBhcmd1bWVudHMgYXJlIHRoZSBwYXJhbWV0ZXJzIHBhc3NlZCB0byBgaXRlcmF0ZS5uZXh0KClgLlxuZnVuY3Rpb24gZ2VuZXJhdGVGb3JldmVyKGYsIGluaXQgPSBudWxsKSB7XG4gIHJldHVybiBmdW5jdGlvbiAqX2dlbmVyYXRlRm9yZXZlcigpIHtcbiAgICB2YXIgYXJncyA9IHlpZWxkIGluaXQ7XG4gICAgd2hpbGUgKHRydWUpIGFyZ3MgPSB5aWVsZCBmLmFwcGx5KDAsIGFyZ3MpO1xuICB9O1xufVxuXG4vLyBcIlByb21pc2lmeVwiIGEgZnVuY3Rpb24sIG1lYW5pbmcgdG8gY3JlYXRlIGEgZnVuY3Rpb24gd2hpY2ggcmV0dXJucyBhIHByb21pc2Vcbi8vIGZvciB0aGUgdmFsdWUgb2YgdGhlIGZ1bmN0aW9uIG9uY2UgYHRoaXNgIGFuZCBhbGwgYXJndW1lbnRzIGhhdmUgYmVlbiBmdWxmaWxsZWQuXG5mdW5jdGlvbiBwcm9taXNpZnkoZikgeyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGdpdmVuIGFuIHVuZGVybHlpbmcgZnVuY3Rpb24sXG4gIHJldHVybiBmdW5jdGlvbiBfcHJvbWlzaWZ5KC4uLmFyZ3MpIHsgICAgICAgICAgICAgIC8vIHJldHVybiBhIGZ1bmN0aW9uIHdoaWNoXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHJldHVybnMgYSBwcm9taXNlXG4gICAgICByZXNvbHZlID0+IFByb21pc2UuYWxsKFt0aGlzLCAuLi5hcmdzXSkgICAgICAgIC8vIHdoaWNoLCB3aGVuIGFsbCBhcmdzIGFyZSByZXNvbHZlZCxcbiAgICAgICAgLnRoZW4oXG4gICAgICAgICAgcGFybXMgPT4gcmVzb2x2ZShmLmNhbGwoLi4ucGFybXMpKSAgICAgICAgIC8vIHJlc29sdmVzIHRvIHRoZSBmdW5jdGlvbiByZXN1bHRcbiAgICAgICAgKVxuICAgICk7XG4gIH07XG59XG5cbmV4cG9ydCB7XG4gIHdhaXQsXG4gIHByb21pc2VDaGFuZ2VzLFxuICBEZWZlcnJlZCxcbiAgZ2VuZXJhdGVGb3JldmVyLFxuICBwcm9taXNpZnlcbn07XG4iLCIvLyBVcEF0dHJpYnV0ZXMvLmlzXG4vLyA9PT09PT09PT09PT09PT09XG5cbmltcG9ydCBrZWVwQXNzaWduZWQgICAgZnJvbSAnLi9Bc3MnO1xuaW1wb3J0IEMgICAgICAgICAgICAgICBmcm9tICcuL0Z1bic7XG5pbXBvcnQge2ludmVydGlmeX0gICAgIGZyb20gJy4vSWZ5JztcbmltcG9ydCB7b2JzZXJ2ZU9iamVjdCwgbWFrZU9ic2VydmVyfSBmcm9tICcuL09icyc7XG5pbXBvcnQge2Rhc2hlcml6ZX0gICAgIGZyb20gJy4vU3RyJztcblxudmFyIHtwdXNofSA9IEFycmF5LnByb3RvdHlwZTtcbnZhciB7a2V5cywgZGVmaW5lUHJvcGVydHl9ID0gT2JqZWN0O1xuXG52YXIgc3ViQXR0cnMgPSBbJ3N0eWxlJywgJ2NsYXNzJywgJ2RhdGFzZXQnXTtcbmZ1bmN0aW9uIGlzU3ViYXR0cihhKSB7IHJldHVybiBzdWJBdHRycy5pbmRleE9mKGEpICE9PSAtMTsgfVxuXG4vLyBNYWtlIG9ic2VydmVycyBmb3IgYXR0cmlidXRlcywgYW5kIHN1YmF0dHJpYnV0ZXNcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuZnVuY3Rpb24gbWFrZUF0dHJzT2JzZXJ2ZXIoZSkge1xuICBmdW5jdGlvbiBhZGQodiwgaykgICAgIHsgZS5zZXRBdHRyaWJ1dGUoaywgdmFsdWVpemUodikpOyB9XG4gIGZ1bmN0aW9uIF9kZWxldGUodiwgaykgeyBlLnJlbW92ZUF0dHJpYnV0ZShrKTsgfVxuICByZXR1cm4gbWFrZU9ic2VydmVyKHthZGQsIHVwZGF0ZTogYWRkLCBkZWxldGU6IF9kZWxldGV9KTtcbn1cblxuZnVuY3Rpb24gbWFrZVN0eWxlT2JzZXJ2ZXIoZSkge1xuICBmdW5jdGlvbiBhZGQodiwgaykgICAgIHsgZS5zdHlsZVtrXSA9IHY7IH1cbiAgZnVuY3Rpb24gX2RlbGV0ZSh2LCBrKSB7IGUuc3R5bGVba10gPSAnJzsgfVxuICByZXR1cm4gbWFrZU9ic2VydmVyKHthZGQsIHVwZGF0ZTogYWRkLCBkZWxldGU6IF9kZWxldGV9KTtcbn1cblxuZnVuY3Rpb24gbWFrZURhdGFzZXRPYnNlcnZlcihlKSB7XG4gIGZ1bmN0aW9uIGFkZCh2LCBrKSAgICAgeyBlLmRhdGFzZXRba10gPSB2OyB9XG4gIGZ1bmN0aW9uIF9kZWxldGUodiwgaykgeyBkZWxldGUgZS5kYXRhc2V0W2tdOyB9XG4gIHJldHVybiBtYWtlT2JzZXJ2ZXIoe2FkZCwgY2hhbmdlOiBhZGQsIGRlbGV0ZTogX2RlbGV0ZX0pO1xufVxuXG5mdW5jdGlvbiBtYWtlQ2xhc3NPYnNlcnZlcihlKSB7XG4gIGZ1bmN0aW9uIGFkZCh2LCBrKSAgICAgeyBlLmNsYXNzTGlzdC50b2dnbGUoZGFzaGVyaXplKGspLCB2KTsgfVxuICBmdW5jdGlvbiBfZGVsZXRlKHYsIGspIHsgZS5jbGFzc0xpc3QucmVtb3ZlKGRhc2hlcml6ZShrKSk7IH1cbiAgcmV0dXJuIG1ha2VPYnNlcnZlcih7YWRkLCBjaGFuZ2U6IGFkZCwgZGVsZXRlOiBfZGVsZXRlfSk7XG59XG5cbmZ1bmN0aW9uIFVwQXR0cmlidXRlcyhlbHQsIGF0dHJzKSB7XG5cbiAgLy8gRnVuY3Rpb24gdG8gcmVwb3B1bGF0ZSBjbGFzc2VzIG9uIHRoZSBlbGVtZW50IHdoZW4gdGhleSBjaGFuZ2UuXG4gIHZhciB1cENsYXNzZXMgPSBDKGZ1bmN0aW9uKGNsYXNzZXMpIHtcbiAgICBjbGFzc2VzID0gY2xhc3NlcyB8fCB7fTtcbiAgICBrZXlzKGNsYXNzZXMpLmZvckVhY2goY2xzID0+IGVsdC5jbGFzc0xpc3QudG9nZ2xlKGRhc2hlcml6ZShjbHMpLCBjbGFzc2VzW2Nsc10pKTtcbiAgfSk7XG5cbiAgLy8gRnVuY3Rpb24gdG8gcmVwb3B1bGF0ZSBzdHlsZXMgb24gdGhlIGVsZW1lbnQgd2hlbiB0aGV5IGNoYW5nZS5cbiAgdmFyIHVwU3R5bGVzID0gQyhmdW5jdGlvbihzdHlsZXMpIHtcbiAgICBzdHlsZXMgPSBzdHlsZXMgfHwge307XG4gICAga2V5cyhzdHlsZXMpLmZvckVhY2gocHJvcCA9PiBlbHQuc3R5bGVbcHJvcF0gPSBzdHlsZXNbcHJvcF0pO1xuICB9KTtcblxuICAvLyBUT0RPOiBkbyBkYXRhc2V0c1xuXG4gIC8vIEZ1bmN0aW9uIHRvIHJlcG9wdWxhdGUgYXR0cmlidXRlcyBvbiB0aGUgZWxlbWVudCB3aGVuIHRoZXkgY2hhbmdlLlxuICB2YXIgdXBBdHRycyA9IEMoZnVuY3Rpb24oYXR0cnMpIHtcbiAgICBhdHRycyA9IGF0dHJzIHx8IHt9O1xuICAgIGtleXMoYXR0cnMpXG4gICAgICAuZmlsdGVyKGludmVydGlmeShpc1N1YmF0dHIpKVxuICAgICAgLmZvckVhY2goYXR0ciA9PiBlbHQuc2V0QXR0cmlidXRlKGF0dHIsIGF0dHJzW2F0dHJdKSk7XG4gIH0pO1xuXG4gIHVwQXR0cnMgIChhdHRycyk7XG4gIHVwQ2xhc3NlcyhhdHRycy5jbGFzcyk7XG4gIHVwU3R5bGVzIChhdHRycy5zdHlsZSk7XG4gIHJldHVybiBlbHQ7XG59XG5cbi8vIEFkZCBVcEF0dHJpYnV0ZXMgdG8gRWxlbWVudCBwcm90b3R5cGUgYXMgYC5pc2AuXG5jb25zdCBJU1BST1AgPSAnaXMnO1xuY29uc29sZS5hc3NlcnQoIUhUTUxFbGVtZW50LnByb3RvdHlwZVtJU1BST1BdLCBcIkR1cGxpY2F0ZSBhc3NpZ25tZW50IHRvIEhUTUxFbGVtZW50LmlzXCIpO1xuZGVmaW5lUHJvcGVydHkoSFRNTEVsZW1lbnQucHJvdG90eXBlLCBJU1BST1AsIHtcbiAgdmFsdWUoYXR0cnMpIHsgcmV0dXJuIFVwQXR0cmlidXRlcyh0aGlzLCBhdHRycyk7IH1cbn0pO1xuXG5leHBvcnQgZGVmYXVsdCBVcEF0dHJpYnV0ZXM7XG4iLCIvLyAjIyMgQ29uZmlndXJhdGlvblxuXG4vLyBJbml0aWFsaXphdGlvbi9zZXR1cC5cbnZhciB7YXNzaWdufSA9IE9iamVjdDtcblxuLy8gQ29udHJvbCB1cHdhcmQgY29uZmlndXJhdGlvbiB3aXRoIGBMT0dHSU5HYCBhbmQgYERFQlVHYCBmbGFncy5cbnZhciB1cHdhcmRDb25maWcgPSB7XG4gIExPR0dJTkc6IHRydWUsXG4gIERFQlVHOiB0cnVlLFxuICBNT0RJRllfQlVJTFRJTl9QUk9UT1RZUEVTOiBmYWxzZSxcbiAgVEVTVDogZmFsc2Vcbn07XG5cbi8vIEtlZXAgYSBjb3VudGVyIHdoaWNoIGlkZW50aWZpZXMgdXB3YXJkYWJsZXMgZm9yIGRlYnVnZ2luZyBwdXJwb3Nlcy5cbnZhciBpZCA9IDA7XG5cbmZ1bmN0aW9uIHVwd2FyZGFibGVJZCgpIHtcbiAgcmV0dXJuIGlkKys7XG59XG5cbi8vIFNldCBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG5mdW5jdGlvbiBjb25maWd1cmVVcHdhcmRhYmxlKG9wdHMpIHtcbiAgYXNzaWduKHVwd2FyZENvbmZpZywgb3B0cyk7XG59XG5cbmZ1bmN0aW9uIGxvZyguLi5hcmdzKSB7XG4gIGlmICh1cHdhcmRDb25maWcuTE9HR0lORykge1xuICAgIGNvbnNvbGUubG9nKCdVUFdBUkRJRlk6XFx0JywgLi4uYXJncyk7XG4gIH1cbn1cblxuZXhwb3J0IHtcbiAgdXB3YXJkQ29uZmlnLFxuICBjb25maWd1cmVVcHdhcmRhYmxlLFxuICB1cHdhcmRhYmxlSWQsXG4gIGxvZ1xufTtcbiIsIi8vIHVwQ2hpbGRyZW5cbi8vID09PT09PT09PT1cblxuaW1wb3J0IEMgZnJvbSAnLi9GdW4nO1xuaW1wb3J0IFQgZnJvbSAnLi9UeHQnO1xuXG52YXIge2FwcGVuZENoaWxkLCByZW1vdmVDaGlsZH0gPSBOb2RlLnByb3RvdHlwZTtcbnZhciB7ZmlsdGVyfSAgICAgICAgICAgICAgICAgICA9IEFycmF5LnByb3RvdHlwZTtcbnZhciB7ZGVmaW5lUHJvcGVydHl9ICAgICAgICAgICA9IE9iamVjdDtcblxuLyoqXG4gKiAjIyB1cENoaWxkcmVuXG4gKlxuICogU3BlY2lmeSB0aGUgY2hpbGRyZW4gb2YgYW4gSFRNTCBlbGVtZW50LlxuICogQXMgdGhlIGlucHV0IGFycmF5IGNoYW5nZXMsIHRoZSBlbGVtZW50J3MgY2hpbGRyZW4gYXJlIGFkZGVkIGFuZCByZW1vdmVkLlxuICpcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsdCBlbGVtZW50IHRvIGFkZCBjaGlsZHJlbiB0b1xuICogQHBhcmFtIHtOb2RlW119IGNoaWxkcmVuIGFycmF5IG9mIG5vZGVzIHRvIGFkZCBhcyBjaGlsZHJlblxuICovXG5cbmZ1bmN0aW9uIFVwQ2hpbGRyZW4oZWx0LCBjaGlsZHJlbikge1xuICB2YXIgZiA9IEMoZnVuY3Rpb24gX1VwQ2hpbGRyZW4oY2hpbGRyZW4pIHtcblxuICAgIGZpbHRlci5jYWxsKGVsdC5jaGlsZE5vZGVzLCBjaGlsZCA9PiBjaGlsZHJlbi5pbmRleE9mKGNoaWxkKSA9PT0gLTEpXG4gICAgICAuZm9yRWFjaChyZW1vdmVDaGlsZCwgZWx0KTtcblxuICAgIGNoaWxkcmVuXG4gICAgICAuZmlsdGVyKEJvb2xlYW4pXG4gICAgICAubWFwKGMgPT4gdHlwZW9mIGMudmFsdWVPZigpID09PSAnc3RyaW5nJyA/IFQoYykgOiBjKVxuICAgICAgLmZvckVhY2goYXBwZW5kQ2hpbGQsIGVsdCk7XG4gIH0pO1xuXG4gIC8vIFBlcm1pdCBhbnkgY29tYmluYXRpb24gb2Ygc2luZ2xlIG5vZGVzIGFuZCBhcnJheXMgYXMgYXJndW1lbnRzLlxuICBmKEFycmF5LmlzQXJyYXkoY2hpbGRyZW4pID8gY2hpbGRyZW4gOiBbY2hpbGRyZW5dKTtcbiAgcmV0dXJuIGVsdDtcbn1cblxuLy8gQWRkIGBVcENoaWxkcmVuYCBhcyBwcm9wZXJ0eSBvbiBOb2RlIHByb3RvdHlwZSwgbmFtZWQgYGhhc2AuXG4vLyBVc2FnZTpcbi8vIGBgYFxuLy8gRSgnZGl2JykgLiBoYXMgKFtjaGlsZHJlbiwgLi4uXSlcbi8vIGBgYFxuY29uc3QgSEFTUFJPUCA9ICdoYXMnO1xuXG4vKiBAVE9ETzogTWFrZSB0aGlzIGEgbm9uLWVudW1lcmFibGUgcHJvcGVydHkgb24gcHJvdG90eXBlLiAqL1xuTm9kZS5wcm90b3R5cGUuaGFzID0gZnVuY3Rpb24oY2hpbGRyZW4pIHtcbiAgcmV0dXJuIFVwQ2hpbGRyZW4odGhpcywgY2hpbGRyZW4pO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgVXBDaGlsZHJlbjtcblxuIiwiLy8gQ291bnRlciBhcyBjb21wdXRhYmxlLlxuLy8gPT09PT09PT09PT09PT09PT09PT09PVxuXG5pbXBvcnQge21ha2VVcHdhcmRhYmxlRnVuY3Rpb259IGZyb20gJy4vRnVuJztcblxuLy8gQ291bnRzIHVwIGJ5IG9uZSBldmVyeSBgdGlja2AgbXMuXG5leHBvcnQgZGVmYXVsdCBtYWtlVXB3YXJkYWJsZUZ1bmN0aW9uKFxuICBmdW5jdGlvbiAqKHJ1bikge1xuICAgIHZhciB0aW1lcjtcbiAgICB2YXIgc3RhcnQgPSAwO1xuICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICBsZXQgW3RpY2tdID0geWllbGQgc3RhcnQrKztcbiAgICAgIHRpY2sgPSB0aWNrIHx8IDEwMDA7XG4gICAgICBjbGVhclRpbWVvdXQodGltZXIpO1xuICAgICAgdGltZXIgPSBzZXRUaW1lb3V0KHJ1biwgdGljayk7XG4gICAgfVxuICB9XG4pOyAgICAgICAgICAgICAgICAgICAgICAgICAgXG4iLCIvLyBCdWlsZCBDU1Mgc2hlZXRzIGFuZCBydWxlcy5cbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG4vLyBTZXR1cC5cbmltcG9ydCB7ZGFzaGVyaXplfSBmcm9tICcuL1N0cic7XG5pbXBvcnQge3Vwd2FyZENvbmZpZ30gZnJvbSAnLi9DZmcnO1xuXG52YXIge2Fzc2lnbiwgZGVmaW5lUHJvcGVydHl9ID0gT2JqZWN0O1xuXG4vLyBIYW5kbGUgc2NvcGluZy5cbi8vIC0tLS0tLS0tLS0tLS0tLVxuXG52YXIgc2NvcGVkU3VwcG9ydGVkID0gJ3Njb3BlZCcgaW4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKTtcblxudmFyIHNjb3BlZFN0eWxlSWQgPSAwO1xudmFyIHNjb3BlZFN0eWxlSWRzUHJvcCA9IFwic2NvcGVkU3R5bGVJZHNcIjtcbnZhciBtYWtlU2NvcGVkU3R5bGVJZCA9IGlkID0+ICdzJyArIGlkO1xuXG4vLyBcIlNjb3BpZnlcIiBhIHNldCBvZiBzZWxlY3RvcnMgdG8gYW4gZWxlbWVudCBpZGVudGlmZWQgYnkgYSBkYXRhLXNjb3BlZC1zdHlsZS1pZHMgYXR0cmlidXRlLlxuLy8gRWFjaCBzZWxlY3RvciBpcyB0dXJuZWQgaW50byB0d28gc2VsZWN0b3JzLlxuLy8gVGhlIGZpcnN0IHBsYWNlcyB0aGUgYFtkYXRhLS4uLl1gIHNlbGVjdG9yIGluIGZyb250LCB0byBhZGRyZXNzIGRlc2NlbmRuYXRzLlxuLy8gVGhlIHNlY29uZCBhdHRhY2hlcyBpdCB0byB0aGUgZmlyc3Qgc3Vic2VsZWN0b3IsIHRvIGFkZHJlc3MgdGhlIGVsZW1lbnQgaXRzZWxmLlxuZnVuY3Rpb24gc2NvcGlmeVNlbGVjdG9ycyhzZWxlY3RvcnMsIHNjb3BlX2lkKSB7XG4gIHZhciBzY29wZXIgPSBgW2RhdGEtJHtkYXNoZXJpemUoc2NvcGVkU3R5bGVJZHNQcm9wKX1+PSR7c2NvcGVfaWR9XWA7XG4gIHJldHVybiBbXS5jb25jYXQoXG4gICAgc2VsZWN0b3JzLnNwbGl0KCcsJylcbiAgICAgIC5tYXAoc2VsZWN0b3IgPT4ge1xuICAgICAgICB2YXIgW2hlYWQsIC4uLnRhaWxdID0gc2VsZWN0b3IudHJpbSgpLnNwbGl0KC8oW1xccys+fl0pLykuZmlsdGVyKEJvb2xlYW4pO1xuICAgICAgICByZXR1cm4gW1xuICAgICAgICAgIGAke3Njb3Blcn0gJHtzZWxlY3Rvcn1gLFxuICAgICAgICAgIFtgJHtoZWFkfSR7c2NvcGVyfWAsIC4uLnRhaWxdLmpvaW4oJycpXG4gICAgICAgIF07XG4gICAgICB9KVxuICApLmpvaW4oJywnKTtcbn1cblxuLy8gQ3JlYXRlIGEgbmV3IHN0eWxlc2hlZXQsIG9wdGlvbmFsbHkgc2NvcGVkIHRvIGEgRE9NIGVsZW1lbnQuXG5mdW5jdGlvbiBtYWtlU2hlZXQoc2NvcGUpIHtcbiAgdmFyIHN0eWxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKTtcbiAgZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChzdHlsZSk7XG4gIHZhciBzaGVldCA9IHN0eWxlLnNoZWV0O1xuXG4gIGlmIChzY29wZSkge1xuICAgIHN0eWxlLnNldEF0dHJpYnV0ZSgnc2NvcGVkJywgXCJzY29wZWRcIik7XG4gICAgaWYgKCFzY29wZWRTdXBwb3J0ZWQpIHtcbiAgICAgIHNjb3BlLmRhdGFzZXRbc2NvcGVkU3R5bGVJZHNQcm9wXSA9IChzY29wZS5kYXRhc2V0W3Njb3BlZFN0eWxlSWRzUHJvcF0gfHwgXCJcIikgKyBcIiBcIiArXG4gICAgICAgIChzaGVldC5zY29wZWRTdHlsZUlkID0gbWFrZVNjb3BlZFN0eWxlSWQoc2NvcGVkU3R5bGVJZCsrKSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHNoZWV0O1xufVxuXG4vLyBJbnNlcnQgYSBDU1MgcnVsZSwgZ2l2ZW4gYnkgc2VsZWN0b3IocykgYW5kIGRlY2xhcmF0aW9ucywgaW50byBhIHNoZWV0LlxuLy8gSWYgdGhlIHNjb3BlZCBhdHRyaWJ1dGUgd2FzIHNwZWNpZmllZCwgYW5kIHNjb3BpbmcgaXMgbm90IHN1cHBvcnRlZCxcbi8vIHRoZW4gZW11bGF0ZSBzY29waW5nLCBieSBhZGRpbmcgYSBkYXRhLSogYXR0cmlidXRlIHRvIHRoZSBwYXJlbnQgZWxlbWVudCxcbi8vIGFuZCByZXdyaXRpbmcgdGhlIHNlbGVjdG9ycy5cbmZ1bmN0aW9uIGluc2VydChzaGVldCwgW3NlbGVjdG9ycywgc3R5bGVzXSkge1xuICBpZiAoc2hlZXQuc2NvcGVkU3R5bGVJZCkge1xuICAgIHNlbGVjdG9ycyA9IHNjb3BpZnlTZWxlY3RvcnMoc2VsZWN0b3JzLCBzaGVldC5zY29wZWRTdHlsZUlkKTtcbiAgfVxuXG4gIHZhciBpZHggPSBzaGVldC5pbnNlcnRSdWxlKGAke3NlbGVjdG9yc30geyB9YCwgc2hlZXQucnVsZXMubGVuZ3RoKTtcbiAgdmFyIHJ1bGUgPSBzaGVldC5ydWxlc1tpZHhdO1xuXG4gIGlmICh0eXBlb2Ygc3R5bGVzID09PSAnc3RyaW5nJykgeyBydWxlLnN0eWxlID0gc3R5bGVzOyB9XG4gIGVsc2Uge1xuICAgIC8vIEBUT0RPIEZpeCB0aGlzIHRvIGJlIHVwd2FyZC1mcmllbmRseSwgYW5kIHZhbHVlaXplIHN0eWxlIG9iamVjdC5cbiAgICBhc3NpZ24ocnVsZS5zdHlsZSwgc3R5bGVzKTtcbiAgICAvL21pcnJvclByb3BlcnRpZXMocnVsZS5zdHlsZSwgc3R5bGVzKTtcbiAgfVxuXG4gIHJldHVybiBydWxlO1xufVxuXG4vLyBgYXNzaWduU3R5bGVgIGlzIGFuIFVwd2FyZGlmaWVkIGZ1bmN0aW9uIHdoaWNoIG9uIGZpcnN0IGludm9jYXRpb25cbi8vIFwiYXNzaWduc1wiIGhhc2ggcGFzc2VkIGFzIGFyZ3VtZW50IHRvIHRoZSBgc3R5bGVgIGF0dHJpYnV0ZSBvZiBgdGhpc2AuXG4vLyBXaGVuIHByb3BlcnRpZXMgd2l0aGluIHRoZSBoYXNoIGNoYW5nZSwgc3R5bGUgYXR0cmlidXRlIGFyZSB1cGRhdGVkLlxuZnVuY3Rpb24gYXNzaWduU3R5bGUoKSB7XG4gIHJldHVybiB1cHdhcmRpZmllZE1lcmdlKGZ1bmN0aW9uKCkgeyByZXR1cm4gdGhpcy5zdHlsZTsgfSk7XG59XG5cbi8vSFRNTEVsZW1lbnQucHJvdG90eXBlLnN0eWxlID0gYXNzaWduU3R5bGU7XG4vL0NTU1N0eWxlUnVsZS5wcm90b3R5cGUuc3R5bGUgPSBhc3NpZ25TdHlsZTtcblxuQ1NTU3R5bGVTaGVldC5wcm90b3R5cGUucmVwbGFjZVJ1bGUgPSBmdW5jdGlvbihydWxlLCBpZHgpIHtcbiAgdGhpcy5kZWxldGVSdWxlKGlkeCk7XG4gIHJldHVybiB0aGlzLmluc2VydFJ1bGUocnVsZSwgaWR4KTtcbn07XG5cbi8vT2JqZWN0LmFzc2lnbihDU1NTdHlsZVNoZWV0LnByb3RvdHlwZSwge1xuLy8gICAgICAgICAgICAgIHJ1bGU6IHVwd2FyZGlmeShjaGFpbmlmeShpbnNlcnRSdWxlKSwgcmVwbGFjZUNoaWxkKSxcblxuLy8gSW5zZXJ0IGEgcnVsZSAoc2VsZWN0b3JzIHBsdXMgdmFsdWVzKSBpbnRvIGEgc3R5bGVzaGVldC5cbkNTU1N0eWxlU2hlZXQucHJvdG90eXBlLnJ1bGUgPSBmdW5jdGlvbihzZWxlY3Rvciwgc3R5bGVzKSB7XG4gIHZhciBpZHggPSB0aGlzLmluc2VydFJ1bGUoYCR7c2VsZWN0b3J9IHsgfWAsIHRoaXMucnVsZXMubGVuZ3RoKTtcbiAgdmFyIHJ1bGUgPSB0aGlzLnJ1bGVzW2lkeF07XG4gIC8vIFRPRE86IHJlcGxhY2Ugd2l0aCBhc3NpZ25TdHlsZS5cbiAgYXNzaWduKHJ1bGUuc3R5bGUsIHN0eWxlcyk7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLy8gRGVmaW5lIENTUyB1bml0cyBvbiBudW1iZXJzLCBhcyBub24tZW51bWVyYWJsZSBwcm9wZXJ0aWVzIG9uIHByb3RvdHlwZS5cbi8vIENhbm5vdCBjYWxsIGFzIGAxMi5weGA7IGluc3RlYWQsIHRyeSBgMTIuLnB4YCwgb3IgYDEyIC5weGAuXG5pZiAodXB3YXJkQ29uZmlnLk1PRElGWV9CVUlMVElOX1BST1RPVFlQRVMpIHtcbiAgW1xuICAgICdlbScsICdleCcsICdjaCcsICdyZW0nLCAncHgnLCAnbW0nLCAnY20nLCAnaW4nLCAncHQnLCAncGMnLCAncHgnLFxuICAgICd2aCcsICd2dycsICd2bWluJywgJ3ZtYXgnLFxuICAgICdwY3QnLFxuICAgICdkZWcnLCAnZ3JhZCcsICdyYWQnLCAndHVybicsXG4gICAgJ21zJywgJ3MnLFxuICAgICdIeicsICdrSHonXG4gIF0uZm9yRWFjaCh1bml0ID0+IGRlZmluZVByb3BlcnR5KE51bWJlci5wcm90b3R5cGUsIHVuaXQsIHtcbiAgICBnZXQoKSB7IHJldHVybiB0aGlzICsgdW5pdDsgfVxuICB9KSk7XG59XG5cbmV4cG9ydCB2YXIgdHJhbnNmb3JtID1cbiAgW1xuICAgICd0cmFuc2xhdGUnLCd0cmFuc2xhdGVYJywndHJhbnNsYXRlWScsXG4gICAgJ3NjYWxlJywnc2NhbGVYJywnc2NhbGVZJywnc2NhbGUzZCcsJ3NjYWxlWicsXG4gICAgJ3JvdGF0ZScsJ3JvdGF0ZVgnLCdyb3RhdGVZJywncm90YXRlWicsJ3JvdGF0ZTNkJyxcbiAgICAncGVyc3BlY3RpdmUnLCdtYXRyaXgnLCdtYXRyaXgzZCcsXG4gICAgJ3NrZXdYJywnc2tld1knXG4gIF0ucmVkdWNlKFxuICAgIChyZXN1bHQsIGtleSkgPT5cbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShyZXN1bHQsIGtleSwge1xuICAgICAgICB2YWx1ZTogKC4uLmFyZ3MpID0+IGAke2tleX0oJHthcmdzfSlgXG4gICAgICB9KSxcbiAgICB7fVxuICApO1xuXG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIFVwU3R5bGUocnVsZXMsIHNjb3BlKSB7XG4gIHZhciBzaGVldCA9IG1ha2VTaGVldChzY29wZSk7XG4gIHJ1bGVzLmZvckVhY2gocnVsZSA9PiBpbnNlcnQoc2hlZXQsIHJ1bGUpKTtcbiAgcmV0dXJuIHNoZWV0O1xufVxuIiwiLy8gVXBFbGVtZW50L0Vcbi8vID09PT09PT09PT09XG4vLyBDcmVhdGUgSFRNTCBlbGVtZW50cy5cblxuaW1wb3J0ICcuL0V2dCc7XG5pbXBvcnQgJy4vQ2hpJztcbmltcG9ydCAnLi9JbnAnO1xuaW1wb3J0ICcuL0F0dCc7XG5cbi8qKlxuICogIyMgVXBFbGVtZW50XG5cbiAqIENyZWF0ZSBhbiBlbGVtZW50LlxuICogU3VwcG9ydCBsb3ctbGV2ZWwgc3VnYXIgaW4gZm9ybSBvZiBgZGl2I2lkLmNsYXNzYC5cbiAqL1xuZnVuY3Rpb24gVXBFbGVtZW50KHRhZykge1xuICB2YXIgcGFydHMgPSB0YWcuc3BsaXQoLyhbIy5dKS8pO1xuICB0YWcgPSBwYXJ0cy5zaGlmdCgpO1xuICB2YXIgZWx0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCh0YWcpO1xuXG4gIHdoaWxlIChwYXJ0cy5sZW5ndGgpIHtcbiAgICBsZXQgc3ltYm9sID0gcGFydHMuc2hpZnQoKTtcbiAgICBsZXQgdmFsICAgID0gcGFydHMuc2hpZnQoKTtcbiAgICBzd2l0Y2ggKHN5bWJvbCkge1xuICAgIGNhc2UgJyMnOiBlbHQuaWQgPSB2YWw7ICAgICAgICAgICBicmVhaztcbiAgICBjYXNlICcuJzogZWx0LmNsYXNzTGlzdC5hZGQodmFsKTsgYnJlYWs7XG4gICAgfVxuICB9XG4gIFxuICByZXR1cm4gZWx0O1xufVxuXG4vLyBSZS1leHBvcnRlZCBhcyBgRWAgYnkgYFVwLmpzYC5cbmV4cG9ydCBkZWZhdWx0IFVwRWxlbWVudDtcbiIsIi8vIEV2ZW50IGhhbmRsaW5nXG4vLyA9PT09PT09PT09PT09PVxuXG4vLyBFdmVudHMgYXJlIGhhbmRsZWQgYnkgY2FsbGluZyBgZG9lc2Agb24gYW4gZWxlbWVudCwgYW5kIHBhc3NpbmcgYSBoYXNoIG9mIGhhbmRsZXJzLlxuXG52YXIge2NyZWF0ZSwga2V5cywgYXNzaWduLCBkZWZpbmVQcm9wZXJ0eX0gPSBPYmplY3Q7XG52YXIge3Byb3RvdHlwZX0gPSBIVE1MRWxlbWVudDtcblxuLy8gUHJvdG90eXBlIGZvciBldmVudCBsaXN0ZW5lcnMsIGRlZmluaW5nIGBoYW5kbGVFdmVudGAsXG4vLyB3aGljaCBkaXNwYXRjaGVzIGV2ZW50cyB0byBhIG1ldGhvZCBvZiB0aGUgc2FtZSBuYW1lLlxudmFyIEV2ZW50TGlzdGVuZXJQcm90b3R5cGUgPSB7XG4gIGhhbmRsZUV2ZW50KGV2dCkgeyByZXR1cm4gdGhpc1tldnQudHlwZV0oZXZ0KTsgfVxufTtcblxuLy8gUGxhY2UgcHJvcGVydHkgb24gYEVsZW1lbnRgIHByb3RvdHlwZS5cbi8vIFVzYWdlOlxuLy8gYGBgXG4vLyBFKCdidXR0b24nKSAuIGRvZXMoe2NsaWNrOiBoYW5kbGVCdXR0b25DbGlja30pXG4vL1xuLy8gZnVuY3Rpb24gaGFuZGxlQnV0dG9uQ2xpY2soZXZ0KSB7XG4vLyAgICAgLy8gdGhpcy5jb250ZXh0IGlzIHRoZSBidXR0b25cbi8vIH1cbi8vIGBgYFxuY29uc3QgRE9FU1BST1AgPSAnZG9lcyc7XG5cbmlmICghcHJvdG90eXBlW0RPRVNQUk9QXSkge1xuICBkZWZpbmVQcm9wZXJ0eShwcm90b3R5cGUsIERPRVNQUk9QLCB7XG4gICAgdmFsdWUoaGFuZGxlcnMpIHtcbiAgICAgIHZhciBsaXN0ZW5lciA9IGNyZWF0ZShFdmVudExpc3RlbmVyUHJvdG90eXBlKTtcbiAgICAgIGFzc2lnbihsaXN0ZW5lciwgaGFuZGxlcnMsIHtjb250ZXh0OiB0aGlzfSk7XG4gICAgICBrZXlzKGhhbmRsZXJzKS5mb3JFYWNoKGV2dF90eXBlID0+IHRoaXMuYWRkRXZlbnRMaXN0ZW5lcihldnRfdHlwZSwgbGlzdGVuZXIpKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgfSk7XG59XG4iLCIvLyBzcmMvRmFkLmpzXG4vL1xuLy8gSW1wbGVtZW50IGZhZGluZyBvciBvdGhlciBlZmZlY3RzIHdoZW4gc3BlY2lmaWVkIERPTSBlbGVtZW50IGNoYW5nZXMuXG4vLyBSZXF1cmVzIE11dGF0aW9uT2JzZXJ2ZXIgKG5vdCBhdmFpbGFibGUgaW4gSUUgPD0gMTApLlxuLy8gSW4gaXRzIGFic2VuY2UsIGRvZXMgbm90aGluZy5cbi8vXG4vLyBUbyBzZWxlY3Qgc3BlY2lmaWMgZWZmZWN0cyBpbiBhZGRpdGlvbiB0byB0aGUgZGVmYXVsdCBmYWRpbmcsIHN1cHBseSBhZGRpdGlvbmFsIGVmZmVjdHM6XG4vLyBgYGBcbi8vIEZBREUoZWx0LCBbJ2ZsaXBWZXJ0aWNhbCddKVxuLy8gYGBgXG4vL1xuXG5cbmltcG9ydCBVcFN0eWxlLCB7dHJhbnNmb3JtfSBmcm9tICcuL0Nzcyc7XG5pbXBvcnQgRSBmcm9tICcuL0VsdCc7XG5pbXBvcnQgVSBmcm9tICcuL1Vwdyc7XG5cblxuY29uc3QgTk9fTVVUQVRJT05fT0JTRVJWRVIgPSB0eXBlb2YgTXV0YXRpb25PYnNlcnZlciA9PT0gJ3VuZGVmaW5lZCc7XG5jb25zdCBNVVRBVElPTl9DT05GSUcgPSB7IGNoaWxkTGlzdDogdHJ1ZSwgY2hhcmFjdGVyRGF0YTogdHJ1ZSwgc3VidHJlZTogdHJ1ZSwgYXR0cmlidXRlczogdHJ1ZSB9O1xuY29uc3QgRUZGRUNUUyA9IFsnZmxpcFZlcnRpY2FsJywgJ2ZsaXBIb3Jpem9udGFsJywgJ3JvdGF0ZVJpZ2h0JywgJ3NsaWRlVXAnLCAnc2xpZGVEb3duJywgJ3NsaWRlTGVmdCcsICdzbGlkZVJpZ2h0JywgJ3pvb20nXTtcblxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbihlbHQsIGVmZmVjdCkge1xuXG4gIC8vIFN0YXJ0IChpbikgYW5kIHN0b3AgKG91dCkgdHJhbnNpdGlvbi5cbiAgZnVuY3Rpb24gc3RhcnQoKSB7XG4gICAgY2xhc3Nlcy5pc1RyYW5zaXRpb24gPSB0cnVlO1xuICAgIG9yaWdpbmFsLmFkZEV2ZW50TGlzdGVuZXIoJ3RyYW5zaXRpb25lbmQnLCBlbmQpO1xuICB9XG5cbiAgZnVuY3Rpb24gZW5kKCkge1xuICAgIGZhZGVyLnJlcGxhY2VDaGlsZChvcmlnaW5hbC5jbG9uZU5vZGUodHJ1ZSksIG9yaWdpbmFsLm5leHRTaWJsaW5nKTtcbiAgICBjbGFzc2VzLmlzVHJhbnNpdGlvbiA9IGZhbHNlO1xuICAgIG9yaWdpbmFsLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RyYW5zaXRpb25lbmQnLCBlbmQpO1xuICB9XG5cbiAgaWYgKE5PX01VVEFUSU9OX09CU0VSVkVSKSByZXR1cm47XG5cbiAgdmFyIGNsYXNzZXMgPSBVKHtcbiAgICBGYWRlRWxlbWVudDogICAgICAgICB0cnVlLFxuICAgICdGYWRlRWxlbWVudC0tZmFkZSc6IHRydWUsXG4gICAgaXNUcmFuc2l0aW9uOiAgICAgICAgZmFsc2UsXG4gICAgaXNEaXNhYmxlZDogICAgICAgICAgTk9fTVVUQVRJT05fT0JTRVJWRVJcbiAgfSk7XG4gIGlmIChlZmZlY3QpIGNsYXNzZXNbJ0ZhZGVFbGVtZW50LS0nICsgZWZmZWN0XSA9IHRydWU7XG5cbiAgdmFyIG9yaWdpbmFsID0gRSgnZGl2JykgLiBoYXMoZWx0KTtcbiAgdmFyIGZhZGVyICAgID0gRSgnZGl2JykgLiBpcyh7Y2xhc3M6IGNsYXNzZXN9KSAuIGhhcyhbb3JpZ2luYWwsIEUoJ2RpdicpXSk7XG5cbiAgZW5kKCk7XG4gIG5ldyBNdXRhdGlvbk9ic2VydmVyKHN0YXJ0KS5vYnNlcnZlKG9yaWdpbmFsLCBNVVRBVElPTl9DT05GSUcpO1xuXG4gIHJldHVybiBmYWRlcjtcbn1cblxuXG4vLyAjIyMjIFNUWUxFU1xuLy8gVGhlIGBGYWRlRWxlbWVudGAgZWxlbWVudCBoYXMgdHdvIGNoaWxkcmVuLiBGaXJzdCBpcyBvcmlnaW5hbCwgc2Vjb25kIGlzIGNsb25lLlxuLy9cbi8vIFRvIGNvbnRyb2wgZHVyYXRpb24sIHNldCB0aGUgYHRyYW5zaXRpb24tZHVyYXRpb25gIHByb3BlcnR5IG9uIHRoZSBgRmFkZUVsZW1lbnRgIGNvbXBvbmVudC5cbi8vIGB0cmFuc2l0aW9uLXRpbWluZy1mdW5jdGlvbmAgYW5kIGB0cmFuc2Zvcm0tb3JpZ2luYCBtYXkgYmUgc2ltaWxhcmx5IHNldC5cblxudmFyIGNzc1J1bGVzID0gW1xuXG4gIFsnLkZhZGUtZWxlbWVudCcsIHtcbiAgICAvKiBNYWtlIHRoaXMgYW4gb2Zmc2V0IHBhcmVudCwgc28gdGhlIGFic29sdXRlIHBvc2l0aW9uaW5nIG9mIHRoZSBjbG9uZSBpcyByZWxhdGl2ZSB0byBpdC4gKi9cbiAgICBwb3NpdGlvbjogJ3JlbGF0aXZlJywgICAgICAgICAvKiBjcmVhdGUgZm9ybWF0dGluZyBjb250ZXh0IGZvciBhYnNvbHV0ZWx5LXBvc2l0aW9uZWQgY2xvbmUgKi9cblxuICAgIC8qIFNldCB0cmFuc2l0aW9uIHByb3BlcnRpZXMsIHRvIGJlIGluaGVyaXRlZCBieSBjaGlsZHJlbi4gKi9cbiAgICB0cmFuc2l0aW9uRHVyYXRpb246ICAgICAgICc4MDBtcycsICAgICAgICAgICAgICAgICAgICAgICAgLyogb3ZlcnJpZGUgdGhpcyB0byBjaGFuZ2UgZHVyYXRpb24gKi9cbiAgICB0cmFuc2l0aW9uVGltaW5nRnVuY3Rpb246ICdjdWJpYy1iZXppZXIoMCwgMS4yLCAxLCAxLjIpJywgLyogbGl0dGxlIGJvdW5jZSBhdCB0b3AgKi9cblxuICAgIG92ZXJmbG93OiAnaGlkZGVuJ1xuICB9XSxcblxuICAvKiBXZSB3YW50IHRvIHRyYW5zaXRpb24gb25seSBnb2luZyBpbiwgbm90IGNvbWluZyBvdXQuICovXG4gIFsnLkZhZGUtZWxlbWVudC5pcy10cmFuc2l0aW9uID4gKicsIHsgdHJhbnNpdGlvblByb3BlcnR5OiAnYWxsJyB9XSxcblxuICAvKiBDSElMRCBFTEVNRU5UUyAob3JpZ2luYWwgYW5kIGNsb25lKSAqL1xuXG4gIC8qIFRoZSBzZWNvbmQgY2hpbGQgaXMgdGhlIGNsb25lLiBQbGFjZSBpdCBkaXJlY3RseSBvdmVyIHRoZSBvcmlnaW5hbCB2ZXJzaW9uLiAqL1xuICBbJy5GYWRlLWVsZW1lbnQgPiA6bnRoLWNoaWxkKDIpJywgeyBwb3NpdGlvbjogJ2Fic29sdXRlJywgdG9wOiAwLCBsZWZ0OiAwIH1dLFxuXG4gIFsnLkZhZGUtZWxlbWVudCA+IConLCB7XG4gICAgLyogQnkgZGVmYXVsdCwgbm8gdHJhbnNpdGlvbiwgdW5sZXNzIGBpcy10cmFuc2l0aW9uYCBpcyBwcmVzZW50OyBzZWUgbmV4dCBydWxlLiAqL1xuICAgIHRyYW5zaXRpb25Qcm9wZXJ0eTogICAgICAgJ25vbmUnLFxuXG4gICAgLyogSW5oZXJpdCBwcm9wZXJ0aWVzIHNldCBvbiBtYWluIGVsZW1lbnQuICovXG4gICAgdHJhbnNpdGlvbkR1cmF0aW9uOiAgICAgICAnaW5oZXJpdCcsXG4gICAgdHJhbnNpdGlvblRpbWluZ0Z1bmN0aW9uOiAnaW5oZXJpdCcsXG4gICAgdHJhbnNmb3JtT3JpZ2luOiAgICAgICAgICAnaW5oZXJpdCcsXG5cbiAgICBiYWNrZmFjZVZpc2liaWxpdHk6ICAgICAgICdoaWRkZW4nLFxuXG4gICAgZGlzcGxheTogICAgICAgICAgICAgICAgICAnaW5saW5lLWJsb2NrJ1xuICB9XSxcblxuXG4gIC8vIEVGRkVDVFNcblxuICBbJy5GYWRlLWVsZW1lbnQtLWZhZGUgICAgICAgICAgICAgICAgICAgICAgICAgID4gOm50aC1jaGlsZCgxKScsIHsgb3BhY2l0eTogMCB9XSxcbiAgWycuRmFkZS1lbGVtZW50LS1mYWRlICAgICAgICAgICAgICAgICAgICAgICAgICA+IDpudGgtY2hpbGQoMiknLCB7IG9wYWNpdHk6IDEgfV0sXG4gIFsnLkZhZGUtZWxlbWVudC0tZmFkZS5pcy10cmFuc2l0aW9uICAgICAgICAgICAgPiA6bnRoLWNoaWxkKDEpJywgeyBvcGFjaXR5OiAxIH1dLFxuICBbJy5GYWRlLWVsZW1lbnQtLWZhZGUuaXMtdHJhbnNpdGlvbiAgICAgICAgICAgID4gOm50aC1jaGlsZCgyKScsIHsgb3BhY2l0eTogMCB9XSxcblxuICBbJy5GYWRlLWVsZW1lbnQtLXNsaWRlLXJpZ2h0ICAgICAgICAgICAgICAgICAgID4gOm50aC1jaGlsZCgxKScsIHsgdHJhbnNmb3JtOiB0cmFuc2Zvcm0udHJhbnNsYXRlWCgnLTEwMCUnKSB9XSxcbiAgWycuRmFkZS1lbGVtZW50LS1zbGlkZS1yaWdodCAgICAgICAgICAgICAgICAgICA+IDpudGgtY2hpbGQoMiknLCB7IHRyYW5zZm9ybTogdHJhbnNmb3JtLnRyYW5zbGF0ZVgoMCkgICAgICAgfV0sXG4gIFsnLkZhZGUtZWxlbWVudC0tc2xpZGUtcmlnaHQuaXMtdHJhbnNpdGlvbiAgICAgPiA6bnRoLWNoaWxkKDEpJywgeyB0cmFuc2Zvcm06IHRyYW5zZm9ybS50cmFuc2xhdGVYKDApICAgICAgIH1dLFxuICBbJy5GYWRlLWVsZW1lbnQtLXNsaWRlLXJpZ2h0LmlzLXRyYW5zaXRpb24gICAgID4gOm50aC1jaGlsZCgyKScsIHsgdHJhbnNmb3JtOiB0cmFuc2Zvcm0udHJhbnNsYXRlWCgnKzEwMCUnKSB9XSxcblxuICBbJy5GYWRlLWVsZW1lbnQtLXNsaWRlLWxlZnQgICAgICAgICAgICAgICAgICAgID4gOm50aC1jaGlsZCgxKScsIHsgdHJhbnNmb3JtOiB0cmFuc2Zvcm0udHJhbnNsYXRlWCgnKzEwMCUnKSB9XSxcbiAgWycuRmFkZS1lbGVtZW50LS1zbGlkZS1sZWZ0ICAgICAgICAgICAgICAgICAgICA+IDpudGgtY2hpbGQoMiknLCB7IHRyYW5zZm9ybTogdHJhbnNmb3JtLnRyYW5zbGF0ZVgoMCkgICAgICAgfV0sXG4gIFsnLkZhZGUtZWxlbWVudC0tc2xpZGUtbGVmdC5pcy10cmFuc2l0aW9uICAgICAgPiA6bnRoLWNoaWxkKDEpJywgeyB0cmFuc2Zvcm06IHRyYW5zZm9ybS50cmFuc2xhdGVYKDApICAgICAgIH1dLFxuICBbJy5GYWRlLWVsZW1lbnQtLXNsaWRlLWxlZnQuaXMtdHJhbnNpdGlvbiAgICAgID4gOm50aC1jaGlsZCgyKScsIHsgdHJhbnNmb3JtOiB0cmFuc2Zvcm0udHJhbnNsYXRlWCgnLTEwMCUnKSB9XSxcblxuICBbJy5GYWRlLWVsZW1lbnQtLXNsaWRlRG93biAgICAgICAgICAgICAgICAgICAgID4gOm50aC1jaGlsZCgxKScsIHsgdHJhbnNmb3JtOiB0cmFuc2Zvcm0udHJhbnNsYXRlWSgnLTEwMCUnKSB9XSxcbiAgWycuRmFkZS1lbGVtZW50LS1zbGlkZURvd24gICAgICAgICAgICAgICAgICAgICA+IDpudGgtY2hpbGQoMiknLCB7IHRyYW5zZm9ybTogdHJhbnNmb3JtLnRyYW5zbGF0ZVkoMCkgICAgICAgfV0sXG4gIFsnLkZhZGUtZWxlbWVudC0tc2xpZGVEb3duLmlzLXRyYW5zaXRpb24gICAgICAgPiA6bnRoLWNoaWxkKDEpJywgeyB0cmFuc2Zvcm06IHRyYW5zZm9ybS50cmFuc2xhdGVZKDApICAgICAgIH1dLFxuICBbJy5GYWRlLWVsZW1lbnQtLXNsaWRlRG93bi5pcy10cmFuc2l0aW9uICAgICAgID4gOm50aC1jaGlsZCgyKScsIHsgdHJhbnNmb3JtOiB0cmFuc2Zvcm0udHJhbnNsYXRlWSgnKzEwMCUnKSB9XSxcblxuICBbJy5GYWRlLWVsZW1lbnQtLXNsaWRlVXAgICAgICAgICAgICAgICAgICAgICAgID4gOm50aC1jaGlsZCgxKScsIHsgdHJhbnNmb3JtOiB0cmFuc2Zvcm0udHJhbnNsYXRlWSgnKzEwMCUnKSB9XSxcbiAgWycuRmFkZS1lbGVtZW50LS1zbGlkZVVwICAgICAgICAgICAgICAgICAgICAgICA+IDpudGgtY2hpbGQoMiknLCB7IHRyYW5zZm9ybTogdHJhbnNmb3JtLnRyYW5zbGF0ZVkoMCkgICAgICAgfV0sXG4gIFsnLkZhZGUtZWxlbWVudC0tc2xpZGVVcC5pcy10cmFuc2l0aW9uICAgICAgICAgPiA6bnRoLWNoaWxkKDEpJywgeyB0cmFuc2Zvcm06IHRyYW5zZm9ybS50cmFuc2xhdGVZKDApICAgICAgIH1dLFxuICBbJy5GYWRlLWVsZW1lbnQtLXNsaWRlVXAuaXMtdHJhbnNpdGlvbiAgICAgICAgID4gOm50aC1jaGlsZCgyKScsIHsgdHJhbnNmb3JtOiB0cmFuc2Zvcm0udHJhbnNsYXRlWSgnLTEwMCUnKSB9XSxcblxuICBbJy5GYWRlLWVsZW1lbnQtLXJvdGF0ZVJpZ2h0ICAgICAgICAgICAgICAgICAgID4gOm50aC1jaGlsZCgxKScsIHsgdHJhbnNmb3JtOiB0cmFuc2Zvcm0ucm90YXRlKDApICAgICAgICAgICB9XSxcbiAgWycuRmFkZS1lbGVtZW50LS1yb3RhdGVSaWdodCAgICAgICAgICAgICAgICAgICA+IDpudGgtY2hpbGQoMiknLCB7IHRyYW5zZm9ybTogdHJhbnNmb3JtLnJvdGF0ZSgwKSAgICAgICAgICAgfV0sXG4gIFsnLkZhZGUtZWxlbWVudC0tcm90YXRlUmlnaHQuaXMtdHJhbnNpdGlvbiAgICAgPiA6bnRoLWNoaWxkKDEpJywgeyB0cmFuc2Zvcm06IHRyYW5zZm9ybS5yb3RhdGUoJzM2MGRlZycpICAgIH1dLFxuICBbJy5GYWRlLWVsZW1lbnQtLXJvdGF0ZVJpZ2h0LmlzLXRyYW5zaXRpb24gICAgID4gOm50aC1jaGlsZCgyKScsIHsgdHJhbnNmb3JtOiB0cmFuc2Zvcm0ucm90YXRlKCczNjBkZWcnKSAgICB9XSxcblxuICBbJy5GYWRlLWVsZW1lbnQtLWZsaXAtdmVydGljYWwgICAgICAgICAgICAgICAgID4gOm50aC1jaGlsZCgxKScsIHsgdHJhbnNmb3JtOiB0cmFuc2Zvcm0ucm90YXRlWCgwKSAgICAgICAgICB9XSxcbiAgWycuRmFkZS1lbGVtZW50LS1mbGlwLXZlcnRpY2FsICAgICAgICAgICAgICAgICA+IDpudGgtY2hpbGQoMiknLCB7IHRyYW5zZm9ybTogdHJhbnNmb3JtLnJvdGF0ZVgoMCkgICAgICAgICAgfV0sXG4gIFsnLkZhZGUtZWxlbWVudC0tZmxpcC12ZXJ0aWNhbC5pcy10cmFuc2l0aW9uICAgPiA6bnRoLWNoaWxkKDEpJywgeyB0cmFuc2Zvcm06IHRyYW5zZm9ybS5yb3RhdGVYKCczNjBkZWcnKSAgIH1dLFxuICBbJy5GYWRlLWVsZW1lbnQtLWZsaXAtdmVydGljYWwuaXMtdHJhbnNpdGlvbiAgID4gOm50aC1jaGlsZCgyKScsIHsgdHJhbnNmb3JtOiB0cmFuc2Zvcm0ucm90YXRlWCgnMzYwZGVnJykgICB9XSxcblxuICBbJy5GYWRlLWVsZW1lbnQtLWZsaXAtaG9yaXpvbnRhbCAgICAgICAgICAgICAgID4gOm50aC1jaGlsZCgxKScsIHsgdHJhbnNmb3JtOiB0cmFuc2Zvcm0ucm90YXRlWSgwKSAgICAgICAgICB9XSxcbiAgWycuRmFkZS1lbGVtZW50LS1mbGlwLWhvcml6b250YWwgICAgICAgICAgICAgICA+IDpudGgtY2hpbGQoMiknLCB7IHRyYW5zZm9ybTogdHJhbnNmb3JtLnJvdGF0ZVkoMCkgICAgICAgICAgfV0sXG4gIFsnLkZhZGUtZWxlbWVudC0tZmxpcC1ob3Jpem9udGFsLmlzLXRyYW5zaXRpb24gPiA6bnRoLWNoaWxkKDEpJywgeyB0cmFuc2Zvcm06IHRyYW5zZm9ybS5yb3RhdGVZKCczNjBkZWcnKSAgIH1dLFxuICBbJy5GYWRlLWVsZW1lbnQtLWZsaXAtaG9yaXpvbnRhbC5pcy10cmFuc2l0aW9uID4gOm50aC1jaGlsZCgyKScsIHsgdHJhbnNmb3JtOiB0cmFuc2Zvcm0ucm90YXRlWSgnMzYwZGVnJykgICB9XSxcblxuICBbJy5GYWRlLWVsZW1lbnQtLXpvb20gICAgICAgICAgICAgICA+IDpudGgtY2hpbGQoMSknLCB7IHRyYW5zZm9ybTogdHJhbnNmb3JtLnNjYWxlKDEuNSkgfV0sXG4gIFsnLkZhZGUtZWxlbWVudC0tem9vbSAgICAgICAgICAgICAgID4gOm50aC1jaGlsZCgyKScsIHsgdHJhbnNmb3JtOiB0cmFuc2Zvcm0uc2NhbGUoMS4wKSB9XSxcbiAgWycuRmFkZS1lbGVtZW50LS16b29tLmlzLXRyYW5zaXRpb24gPiA6bnRoLWNoaWxkKDEpJywgeyB0cmFuc2Zvcm06IHRyYW5zZm9ybS5zY2FsZSgxLjApIH1dLFxuICBbJy5GYWRlLWVsZW1lbnQtLXpvb20uaXMtdHJhbnNpdGlvbiA+IDpudGgtY2hpbGQoMiknLCB7IHRyYW5zZm9ybTogdHJhbnNmb3JtLnNjYWxlKDEuNSkgfV0sXG5cbiAgLyogSWYgY29tcG9uZW50IGlzIHR1cm5lZCBvZmYgKE11dGF0aW9uT2JzZXJ2ZXIgbm90IGF2YWlsYWJsZT8pLCBqdXN0IHNob3cgdGhlIG9yaWdpbmFsLiAqL1xuICBbJy5GYWRlLWVsZW1lbnQuaXMtZGlzYWJsZWQgID4gOm50aC1jaGlsZCgxKScsIHsgb3BhY2l0eTogMSwgdHJhbnNmb3JtOiB0cmFuc2Zvcm0udHJhbnNsYXRlKDAsIDApIH1dXG5dO1xuXG5VcFN0eWxlKGNzc1J1bGVzKTtcbiIsIi8vIFVwd2FyZGFibGUgRnVuY3Rpb25zXG4vLyA9PT09PT09PT09PT09PT09PT09PVxuXG4vLyBUaGUgKip1cHdhcmRhYmxlIGZ1bmN0aW9uKiogaXMgb25lIG9mIHRoZSB0d28ga2V5IGNvbXBvbmVudHMgb2YgdGhlIHVwd2FyZCBsaWJyYXJ5LFxuLy8gYWxvbmcgd2l0aCB0aGUgKip1cHdhcmRhYmxlIG9iamVjdCoqLlxuLy8gQW4gKip1cHdhcmRhYmxlIGZ1bmN0aW9uKiogaXMgYW4gZW5oYW5jZWQgZnVuY3Rpb24gd2hpY2ggcmVjb21wdXRlcyBpdHNlbGZcbi8vIHdoZW4gaXRzIGlucHV0cyBvciBkZXBlbmRlbmNpZXMgY2hhbmdlLlxuLy8gSW5vdmtpbmcgYW4gdXB3YXJkYWJsZSBmdW5jdGlvbiByZXN1bHRzIGluIGEgKip1cHdhcmRhYmxlKiosIHdoaWNoIGhvbGRzIHRoZSB2YWx1ZS5cbi8vIEFuIHVwd2FyZGFibGUgaXMgYWx3YXlzIGFuIG9iamVjdDsgaWYgcHJpbWl0aXZlLCBpdCBpcyB3cmFwcGVkLlxuXG4vLyBDb252ZW5pZW5jZS5cbnZhciB7Z2V0Tm90aWZpZXIsIG9ic2VydmUsIHVub2JzZXJ2ZSwgZGVmaW5lUHJvcGVydHl9ID0gT2JqZWN0O1xuXG5pbXBvcnQge21ha2VBY2Nlc3NDb250cm9sbGVyfSBmcm9tICcuL0FjYyc7XG5pbXBvcnQge2dlbmVyYXRlRm9yZXZlcn0gICAgICBmcm9tICcuL0FzeSc7XG5pbXBvcnQge09ic2VydmVyfSAgICAgICAgICAgICBmcm9tICcuL09icyc7XG5pbXBvcnQge2NvcHlPbnRvLCBpc09iamVjdH0gICBmcm9tICcuL091dCc7XG5pbXBvcnQgbWFrZVVwd2FyZGFibGUgICAgICAgICBmcm9tICcuL1Vwdyc7XG5cbi8vIEtlZXAgdHJhY2sgb2YgY29tcHV0YWJsZXMsIGNvbXB1dGVkcywgYW5kIGNvbXB1dGlmaWVkcy5cbnZhciBzZXQgPSBuZXcgV2Vha1NldCgpO1xudmFyIGdlbmVyYXRvcnMgPSBuZXcgV2Vha01hcCgpO1xuXG5mdW5jdGlvbiBpcyAoZikgICAgeyByZXR1cm4gc2V0LmhhcyhmKTsgfVxuZnVuY3Rpb24gZ2V0KGcpICAgIHsgcmV0dXJuIGcgJiYgdHlwZW9mIGcgPT09ICdvYmplY3QnICYmIGdlbmVyYXRvcnMuZ2V0KGcpOyB9XG5mdW5jdGlvbiBhZGQoZiwgZykgeyBzZXQuYWRkKGYpOyBnZW5lcmF0b3JzLnNldChnLCBmKTsgfVxuXG4vLyBDb252ZW5pZW5jZSBjb25zdHJ1Y3RvciBmb3IgY29tcHV0YWJsZSB3aGVuIG9uIHNpbXBsZSBmdW5jdGlvbi5cbi8vIFRvIHByb3ZpZGUgeW91ciBvd24gZ2VuZXJhdG9yLCB1c2UgYGNvbnN0cnVjdENvbXB1dGFibGVgLlxuLy8gVGhpcyBpcyB0aGUgZGVmYXVsdCBleHBvcnQgZnJvbSB0aGlzIG1vZHVsZS5cbmZ1bmN0aW9uIEMoZiwgaW5pdCkge1xuICByZXR1cm4gbWFrZShnZW5lcmF0ZUZvcmV2ZXIoZiwgaW5pdCkpO1xufVxuXG4vLyBDb25zdHJ1Y3QgdXB3YXJkYWJsZSBmdW5jdGlvbiBmcm9tIGdlbmVyYXRvciAoaWYgbm90IGFscmVhZHkgY29uc3RydWN0ZWQpLlxuZnVuY3Rpb24gbWFrZShnKSB7XG4gIHZhciBmID0gZ2V0KGcpO1xuICBpZiAoIWYpIHtcbiAgICBmICA9IF9tYWtlKGcpO1xuICAgIGFkZChmLCBnKTtcbiAgfVxuICByZXR1cm4gZjtcbn1cblxuLy8gQ3JlYXRlIGFuIHVwd2FyZGFibGUgZnVuY3Rpb24gYmFzZWQgb24gYSBnZW5lcmF0b3IuXG4vLyBUaGUgZ2VuZXJhdG9yIG11c3QgcHJvdmlkZSB0aGUgZm9sbG93aW5nIGJlaGF2aW9yLlxuLy8gVGhlIGZpcnN0IGBpdGVyYXRvci5uZXh0KClgIGlzIGludm9rZWQgc3luY2hyb25vdXNseSwgYW5kIG11c3QgeWllbGQgYSBuZXV0cmFsLCBkZWZhdWx0LCBzYWZlIHZhbHVlLlxuLy8gRm9sbG93aW5nIGBpdGVyYXRvci5uZXh0KClgIGNhbGxzIGFyZSBwYXNzZWQgZnVuY3Rpb24gYXJndW1lbnRzIGFzIGFuIGFycmF5LlxuLy8gSW4gb3RoZXIgd29yZHMsIGB5aWVsZGAgc3RhdGVtZW50cyBzaG91bGQgYmUgd3JpdHRlbiBhcyBgYXJncyA9IHlpZWxkIHg7YCxcbi8vIHdoZXJlIGBhcmdzYCB3aWxsIGJlL3Nob3VsZCBiZS9taWdodCBiZSB1c2VkIGluIGRlcml2aW5nIHRoZSBuZXh0IHZhbHVlIHRvIHlpZWxkLlxuLy8gVGhlIHlpZWxkZWQgdmFsdWUgbWF5IGJlIChidXQgbm90IG5lZWQgYmUpIGJlIGEgcHJvbWlzZSB0byBiZSB3YWl0ZWQgZm9yLlxuZnVuY3Rpb24gX21ha2UoZykge1xuXG4gIGZ1bmN0aW9uIGYoLi4uYXJncykge1xuXG4gICAgLy8gUmVzb2x2ZSB0aGUgcHJvbWlzZSB3aGljaCB3aWxsIHRyaWdnZXIgcmVjb21wdXRhdGlvbi5cbiAgICBmdW5jdGlvbiBydW4oKSAgICAgICAgIHsgcnVubmVyKCk7IH1cbiAgICBmdW5jdGlvbiBhY2Nlc3NTdGFydCgpIHsgYWNjZXNzQ29udHJvbGxlci5zdGFydCgpOyB9XG4gICAgZnVuY3Rpb24gYWNjZXNzU3RvcCgpICB7IGFjY2Vzc0NvbnRyb2xsZXIuc3RvcCgpOyB9XG5cbiAgICBmdW5jdGlvbiBpdGVyYXRlKCkge1xuICAgICAgdmFyIGNoYW5nZSA9IG5ldyBQcm9taXNlKHJlc29sdmUgPT4gcnVubmVyID0gcmVzb2x2ZSk7XG4gICAgICBmdW5jdGlvbiByZWl0ZXJhdGUoKSB7IGNoYW5nZS50aGVuKGl0ZXJhdGUpOyB9XG5cbiAgICAgIGFjY2Vzc1N0YXJ0KCk7XG4gICAgICB2YXIge2RvbmUsIHZhbHVlfSA9IGl0ZXJhdG9yLm5leHQoYXJncyk7XG4gICAgICBjb25zb2xlLmFzc2VydCghZG9uZSwgXCJJdGVyYXRvciB1bmRlcmx5aW5nIGNvbXB1dGFibGUgcmFuIG91dCBvZiBnYXMuXCIpO1xuXG4gICAgICB2YXIgcHJvbWlzZSA9IFByb21pc2UucmVzb2x2ZSh2YWx1ZSk7XG4gICAgICBwcm9taXNlLnRoZW4oYWNjZXNzU3RvcCwgYWNjZXNzU3RvcCk7IC8vIHNob3VsZCB0aGlzIGJlIHN5bmNocm9ub3VzP1xuICAgICAgcHJvbWlzZVxuICAgICAgICAudGhlbihcbiAgICAgICAgICBuZXdWYWx1ZSA9PiByZXN1bHQgPSByZXN1bHQuY2hhbmdlKG5ld1ZhbHVlKSxcbiAgICAgICAgICByZWFzb24gPT4geyBjb25zb2xlLmxvZyhyZWFzb24pOyB9XG4gICAgICAgIClcbiAgICAgICAgLnRoZW4ocmVpdGVyYXRlKTtcbiAgICB9XG5cbiAgICB2YXIgaXRlcmF0b3IgPSBnKHJ1bik7XG4gICAgdmFyIHJlc3VsdCA9IG1ha2VVcHdhcmRhYmxlKGl0ZXJhdG9yLm5leHQoKS52YWx1ZSk7XG4gICAgdmFyIGFjY2Vzc0NvbnRyb2xsZXIgPSBtYWtlQWNjZXNzQ29udHJvbGxlcihydW4pO1xuICAgIHZhciBydW5uZXI7XG5cbi8vICAgIGlmIChjb21wdXRlZCkge1xuLy8gICAgICBhY2Nlc3NOb3RpZmllci5ub3RpZnkoe3R5cGU6ICd1cGRhdGUnLCAgb2JqZWN0OiBjb21wdXRlZH0pO1xuLy8gICAgfVxuXG4gICAgb2JzZXJ2ZUFyZ3MoYXJncywgcnVuKTtcbiAgICBpdGVyYXRlKCk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIHJldHVybiBmO1xufVxuXG4vLyBPYnNlcnZlIGNoYW5nZXMgdG8gYXJndW1lbnRzLlxuLy8gVGhpcyB3aWxsIGhhbmRsZSAnY29tcHV0ZScgY2hhbmdlcywgYW5kIHRyaWdnZXIgcmVjb21wdXRhdGlvbiBvZiBmdW5jdGlvbi5cbi8vIFdoZW4gYXJncyBjaGFuZ2VzLCB0aGUgbmV3IHZhbHVlIGlzIHJlb2JzZXJ2ZWQuXG5mdW5jdGlvbiBvYnNlcnZlQXJncyhhcmdzLCBydW4pIHtcblxuICBmdW5jdGlvbiBvYnNlcnZlQXJnKGFyZywgaSwgYXJncykge1xuICAgIHZhciBvYnNlcnZlciA9IE9ic2VydmVyKFxuICAgICAgYXJnLFxuICAgICAgZnVuY3Rpb24gYXJnT2JzZXJ2ZXIoY2hhbmdlcykge1xuICAgICAgICBjaGFuZ2VzLmZvckVhY2goKHt0eXBlLCBuZXdWYWx1ZX0pID0+IHtcbiAgICAgICAgICBpZiAodHlwZSA9PT0gJ3Vwd2FyZCcpIHtcbiAgICAgICAgICAgIGFyZ3NbaV0gPSBuZXdWYWx1ZTtcbiAgICAgICAgICAgIG9ic2VydmVyLnJlb2JzZXJ2ZShuZXdWYWx1ZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICBydW4oKTtcbiAgICAgIH0sXG4gICAgICAvLyBAVE9ETzogY29uc2lkZXIgd2hldGhlciB0byBjaGVjayBmb3IgRC9BL1UgaGVyZSwgb3IgdXNlICdtb2RpZnknIGNoYW5nZSB0eXBlXG4gICAgICBbJ3Vwd2FyZCcsICdkZWxldGUnLCAnYWRkJywgJ3VwZGF0ZSddIC8vIEBUT0RPOiBjaGVjayBhbGwgdGhlc2UgYXJlIG5lY2Vzc2FyeVxuICAgICk7XG4gICAgb2JzZXJ2ZXIub2JzZXJ2ZSgpO1xuICB9XG5cbiAgYXJncy5mb3JFYWNoKG9ic2VydmVBcmcpO1xufVxuXG4vLyBUaGUgdXItdXB3YXJkYWJsZSBmdW5jdGlvbiBpcyB0byBnZXQgYSBwcm9wZXJ0eSBmcm9tIGFuIG9iamVjdC5cbi8vIFRoaXMgdmVyc2lvbiBkb2VzIG5vdCBzdXBwb3J0IHVwd2FyZGFibGVzIGFzIGFyZ3VtZW50cy5cbnZhciBnZXRVcHdhcmRhYmxlUHJvcGVydHkgPSBDKFxuICBmdW5jdGlvbiBnZXRQcm9wZXJ0eShbb2JqZWN0LCBuYW1lXSwgcnVuKSB7XG4gICAgb2JzZXJ2ZShvYmplY3QsIGNoYW5nZXMgPT4gY2hhbmdlcy5mb3JFYWNoKGNoYW5nZSA9PiB7XG4gICAgICBpZiAoY2hhbmdlLm5hbWUgPT09IG5hbWUpIHJ1bigpO1xuICAgIH0pKTtcbiAgICByZXR1cm4gb2JqZWN0W25hbWVdO1xuICB9XG4pO1xuXG52YXIgbWFrZVVwd2FyZGFibGVGdW5jdGlvbiA9IG1ha2U7XG5cbkMuaXMgPSBpcztcbmV4cG9ydCBkZWZhdWx0IEM7XG5cbmV4cG9ydCB7XG4gIG1ha2VVcHdhcmRhYmxlRnVuY3Rpb24sXG4gIGdldFVwd2FyZGFibGVQcm9wZXJ0eVxufTtcbiIsIi8vIEZ1bmN0aW9uYWwgdXRpbGl0aWVzXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4vLyBIb3VzZWtlZXBpbmcuXG5pbXBvcnQge3Vwd2FyZENvbmZpZ30gZnJvbSAnLi9DZmcnO1xuXG52YXIge3Byb3RvdHlwZX0gICAgICAgICAgICAgICAgICAgICAgICA9IEZ1bmN0aW9uO1xudmFyIHtjYWxsLCBiaW5kLCBhcHBseX0gICAgICAgICAgICAgICAgPSBwcm90b3R5cGU7XG52YXIge2RlZmluZVByb3BlcnR5LCBkZWZpbmVQcm9wZXJ0aWVzfSA9IE9iamVjdDtcbnZhciB7Zm9yRWFjaH0gICAgICAgICAgICAgICAgICAgICAgICAgID0gQXJyYXkucHJvdG90eXBlO1xuXG4vLyBDb21wb3NlIGZ1bmN0aW9ucywgY2FsbGluZyBmcm9tIHJpZ2h0IHRvIGxlZnQuXG5mdW5jdGlvbiBjb21wb3NlKC4uLmZucykge1xuICByZXR1cm4gZnVuY3Rpb24oeCkge1xuICAgIHJldHVybiBmbnMucmVkdWNlUmlnaHQoKHJlc3VsdCwgdmFsKSA9PiB2YWwocmVzdWx0KSwgeCk7XG4gIH07XG59XG5cbi8vIENyZWF0ZSBhIGZ1bmN0aW9uIHdoaWNoIHJ1bnMgb24gbmV4dCB0aWNrLlxuZnVuY3Rpb24gdGlja2lmeShmbiwge2RlbGF5fSA9IHt9KSB7XG4gIGRlbGF5ID0gZGVsYXkgfHwgMTA7XG4gIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gc2V0VGltZW91dCgoKSA9PiBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpLCBkZWxheSk7XG4gIH07XG59XG5cbi8vIFRyYW5zZm9ybSBhIGZ1bmN0aW9uIHNvIHRoYXQgaXQgYWx3YXlzIHJldHVybnMgYHRoaXNgLlxuZnVuY3Rpb24gY2hhaW5pZnkoZm4pIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKC4uLmFyZ3MpIHtcbiAgICBmbi5jYWxsKHRoaXMsIC4uLmFyZ3MpO1xuICAgIHJldHVybiB0aGlzO1xuICB9O1xufVxuXG4vLyBNYWtlIGEgZnVuY3Rpb24gd2hpY2ggcmV0dXJucyBpdHNlbGYsIGFsbG93aW5nIHN5bnRheCBgZm4oeCkoeSlgLlxuZnVuY3Rpb24gc2VsZmlmeShmbikge1xuICByZXR1cm4gZnVuY3Rpb24gc2VsZmlmaWVkKCkge1xuICAgICBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICByZXR1cm4gc2VsZmlmaWVkO1xuICB9O1xufVxuXG4vLyBNYWtlIGEgZnVuY3Rpb24gd2hpY2ggdGFrZXMgYXJndW1lbnRzIGluIHJldmVyc2Ugb3JkZXIuXG5mdW5jdGlvbiBzd2FwaWZ5KGZuKSB7XG4gIHJldHVybiBmdW5jdGlvbihhLCBiKSB7XG4gICAgcmV0dXJuIGZuLmNhbGwodGhpcywgYiwgYSk7XG4gIH07XG59XG5cbi8vIE1ha2UgYSBmdW5jdGlvbiB3aGljaCBkcm9wcyBzb21lIGxlYWRpbmcgYXJndW1lbnRzLlxuZnVuY3Rpb24gZHJvcGlmeShmbiwgbiA9IDEpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKC4uLmFyZ3MpIHtcbiAgICByZXR1cm4gZm4uYXBwbHkodGhpcywgWy4uLmFyZ3NdLnNsaWNlKG4pKTtcbiAgfTtcbn1cblxuLy8gTWFrZSBhIGZ1bmN0aW9uIHdoaWNoIG1lbW96aWVzIGl0cyByZXN1bHQuXG5mdW5jdGlvbiBtZW1vaWZ5KGZuLCB7aGFzaCwgY2FjaGV9ID0ge30pIHtcbiAgaGFzaCA9IGhhc2ggfHwgaWRlbnRpZnk7XG4gIGNhY2hlID0gY2FjaGUgPSB7fTtcbiAgZnVuY3Rpb24gbWVtb2lmaWVkKC4uLmFyZ3MpIHtcbiAgICB2YXIga2V5ID0gaGFzaCguLi5hcmdzKTtcbiAgICByZXR1cm4ga2V5IGluIGNhY2hlID8gY2FjaGVba2V5XSA6IGNhY2hlW2tleV0gPSBmbi5jYWxsKHRoaXMsIC4uLmFyZ3MpO1xuICB9XG4gIG1lbW9pZmllZC5jbGVhciA9ICgpID0+IGNhY2hlID0ge307XG4gIHJldHVybiBtZW1vaWZpZWQ7XG59XG5cbi8vIE1ha2UgYSBmdW5jdGlvbiB3aXRoIHNvbWUgcHJlLWZpbGxlZCBhcmd1bWVudHMuXG5mdW5jdGlvbiBhcmdpZnkoZm4sIC4uLmFyZ3MxKSB7XG4gIHJldHVybiBmdW5jdGlvbiguLi5hcmdzMikge1xuICAgIHJldHVybiBmbi5jYWxsKHRoaXMsIC4uLmFyZ3MxLCAuLi5hcmdzMik7XG4gIH07XG59XG5cbi8vIFJldHVybiB0aGUgZnVuY3Rpb24gaWYgaXQgaXMgb25lLlxuZnVuY3Rpb24gbWF5YmVpZnkoZm4pIHtcbiAgcmV0dXJuIHR5cGVvZiBmbiA9PT0gJ2Z1bmN0aW9uJyA/IGZuIDogZml4ZWQoZm4pO1xufVxuXG4vLyBNYWtlIGEgZnVuY3Rpb24gd2hpY2ggaW52ZXJ0cyB0aGUgcmVzdWx0LlxuZnVuY3Rpb24gaW52ZXJ0aWZ5KGZuKSB7XG4gIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gIWZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gIH07XG59XG5cbi8vIE1ha2UgYSBmdW5jdGlvbiB3aGljaCB0aHJvd3MgYXdheSBzb21lIGFyZ3MuXG5mdW5jdGlvbiB0cmltaWZ5KGZuLCBuID0gMSkge1xuICByZXR1cm4gZnVuY3Rpb24oLi4uYXJncykge1xuICAgIHJldHVybiBmbi5jYWxsKHRoaXMsIC4uLmFyZ3Muc2xpY2UoMCwgbikpO1xuICB9O1xufVxuXG4vLyBNYWtlIGEgZnVuY3Rpb24gd2hpY2ggdGhyb3dzIGF3YXkgc29tZSBhcmdzIGF0IHRoZSBlbmQuXG5mdW5jdGlvbiB0cmltaWZ5UmlnaHQoZm4sIG4gPSAxKSB7XG4gIHJldHVybiBmdW5jdGlvbiguLi5hcmdzKSB7XG4gICAgcmV0dXJuIGZuLmNhbGwodGhpcywgLi4uYXJncy5zbGljZSgwLCAtbikpO1xuICB9O1xufVxuXG4vLyBNYWtlIGEgdmVyc2lvbiBvZiB0aGUgZnVuY3Rpb24gd2hpY2ggbG9ncyBlbnRyeSBhbmQgZXhpdC5cbmZ1bmN0aW9uIGxvZ2lmeShmbikge1xuICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgY29uc29sZS5sb2coXCJlbnRlcmluZ1wiLCBmbi5uYW1lKTtcbiAgICB2YXIgcmV0ID0gZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICBjb25zb2xlLmxvZyhcImxlYXZpbmdcIiwgZm4ubmFtZSk7XG4gICAgcmV0dXJuIHJldDtcbiAgfTtcbn1cblxuLy8gTWFrZSBhIGZ1bmN0aW9uIGJvdW5kIHRvIGl0c2VsZiwgYWxsb3dpbmcgZnVuY3Rpb24gdG8gYWNjZXNzIGl0c2VsZiB3aXRoIGB0aGlzYC5cbmZ1bmN0aW9uIHNlbGZ0aGlzaWZ5KGZuKSB7XG4gIHJldHVybiBmbi5iaW5kKGZuKTtcbn1cblxuLy8gTWFrZSBhIGZ1bmN0aW9uIHdoaWNoIGNhbGxzIHNvbWUgZnVuY3Rpb24gZm9yIGVhY2ggYXJndW1lbnQsIHJldHVybmluZyBhcnJheSBvZiByZXN1bHRzLlxuZnVuY3Rpb24gcmVwZWF0aWZ5KGZuKSB7XG4gIHJldHVybiBmdW5jdGlvbiguLi5hcmdzKSB7XG4gICAgcmV0dXJuIFsuLi5hcmdzXS5tYXAoZm4sIHRoaXMpO1xuICB9O1xufVxuXG4vLyBNYWtlIGNyZWF0ZSBhIHZlcnNpb24gb2YgYSBmdW5jdGlvbiB3aGljaCBydW5zIGp1c3Qgb25jZSBvbiBmaXJzdCBjYWxsLlxuLy8gUmV0dXJucyBzYW1lIHZhbHVlIG9uIHN1Y2NlZWRpbmcgY2FsbHMuXG5mdW5jdGlvbiBvbmNlaWZ5KGYpIHtcbiAgdmFyIHJhbiwgcmV0O1xuICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHJhbiA/IHJldCA6IChyYW49dHJ1ZSwgcmV0PWYuYXBwbHkodGhpcyxhcmd1bWVudHMpKTtcbiAgfTtcbn1cblxuLy8gQ3JlYXRlIGEgZnVuY3Rpb24gd2l0aCBhbiBpbnNlcnRlZCBmaXJzdCBhcmd1bWVudCBlcXVhbCB0byB0aGUgY3JlYXRlZCBmdW5jdGlvbi5cbi8vIFBvc3NpYmxlIHVzZSBjYXNlIGlzOlxuLy8gYGBgXG4vLyBlLmFkZEV2ZW50TGlzdGVybmVyKFwiY2xpY2tcIiwgaW5zZXJ0c2VsZmlmeShmdW5jdGlvbihzZWxmLCBldnQpIHtcbi8vICAgLy8gZG8gc3R1ZmYgb24gZXZlbnQ7XG4vLyAgIGUucmVtb3ZlRXZlbnRMaXN0ZW5lcihzZWxmKTtcbi8vIH0pKTtcbi8vIGBgYFxuZnVuY3Rpb24gaW5zZXJ0c2VsZmlmeShmbikge1xuICByZXR1cm4gZnVuY3Rpb24geCguLi5hcmdzKSB7XG4gICAgcmV0dXJuIGZuLmNhbGwodGhpcywgeCwgLi4uYXJncyk7XG4gIH07XG59XG5cbi8vIENyZWF0ZSBhIGZ1bmN0aW9uIHdpdGggYSBwcmVsdWRlIGFuZCBwb3N0bHVkZS5cbmZ1bmN0aW9uIHdyYXBpZnkoZm4sIGJlZm9yZSA9IG5vb3AsIGFmdGVyID0gbm9vcCkge1xuICByZXR1cm4gZnVuY3Rpb24oLi4uYXJncykge1xuICAgIGJlZm9yZS5jYWxsKHRoaXMpO1xuICAgIHZhciByZXQgPSBmbi5jYWxsKHRoaXMsIC4uLmFyZ3MpO1xuICAgIGFmdGVyLmNhbGwodGhpcyk7XG4gICAgcmV0dXJuIHJldDtcbiAgfTtcbn1cblxuZnVuY3Rpb24gZGVidWdpZnkoZm4pIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKC4uLmFyZ3MpIHtcbiAgICAvKmpzaGludCBkZWJ1ZzogdHJ1ZSAqL1xuICAgIGRlYnVnZ2VyO1xuICAgIHJldHVybiBmbi5jYWxsKHRoaXMsIC4uLmFyZ3MpO1xuICB9O1xufVxuXG5cbi8vIFJldHVybiBhbiBhcnJheSBvZiBhcmd1bWVudCBuYW1lcy5cbi8vIFdBUk5JTkc6IHBhcnNpbmcgSlMgd2l0aCByZWdleHBzIVxuLy8gV2lsbCBmYWlsIG9uIGRlY29uc3RydWN0ZWQgcGFyYW1ldGVycy5cbi8vIEBUT0RPIEhhbmRsZSBwYXJhbWV0ZXJzIHdpdGggZGVmYXVsdHMuXG5mdW5jdGlvbiBwYXJhbWlmeShmbil7XG4gIC8vZ2V0IGFyZ3VtZW50cyB0byBmdW5jdGlvbiBhcyBhcnJheSBvZiBzdHJpbmdzXG4gIHZhciBhcmdzPWZuLmFyZ3M9Zm4uYXJnc3x8ICAgICAgLy9jYWNoZSByZXN1bHQgaW4gYXJncyBwcm9wZXJ0eSBvZiBmdW5jdGlvblxuICAgICAgZm4udG9TdHJpbmcoKSAgICAgICAgICAgICAgIC8vZ2V0IHN0cmluZyB2ZXJzaW9uIG9mIGZ1bmN0aW9uXG4gICAgICAucmVwbGFjZSgvXFwvXFwvLiokfFxcL1xcKltcXHNcXFNdKj9cXCpcXC8vbWcsICcnKSAgIC8vc3RyaXAgY29tbWVudHNcbiAgICAgIC5tYXRjaCgvXFwoLio/XFwpL20pWzBdICAgICAgIC8vZmluZCBhcmd1bWVudCBsaXN0LCBpbmNsdWRpbmcgcGFyZW5zXG4gICAgICAubWF0Y2goL1teXFxzKCksXSsvZykgICAgICAgIC8vZmluZCBhcmd1bWVudHNcbiAgO1xuICByZXR1cm4gYXJnczsgLy8gb3IgZm4/XG59XG5cbi8vIFJldHVybiBmdW5jdGlvbiBib2R5LlxuZnVuY3Rpb24gcGFyc2VCb2R5KGZuKXtcbiAgLy9nZXQgYXJndW1lbnRzIHRvIGZ1bmN0aW9uIGFzIGFycmF5IG9mIHN0cmluZ3NcbiAgdmFyIGJvZHk9Zm4uYm9keT1mbi5ib2R5fHwgICAgICAvL2NhY2hlIHJlc3VsdCBpbiBgYm9keWAgcHJvcGVydHkgb2YgZnVuY3Rpb25cbiAgICAgIGZuLnRvU3RyaW5nKCkgICAgICAgICAgICAgICAvL2dldCBzdHJpbmcgdmVyc2lvbiBvZiBmdW5jdGlvblxuICAgICAgLnJlcGxhY2UoL1xcL1xcLy4qJHxcXC9cXCpbXFxzXFxTXSo/XFwqXFwvL21nLCAnJykgICAvL3N0cmlwIGNvbW1lbnRzXG4gICAgICAucmVwbGFjZSgvXlxccyokL21nLCAnJykgICAgIC8vIGtpbGwgZW1wdHkgbGluZXNcbiAgICAgIC5yZXBsYWNlKC9eLio/XFwpXFxzKlxce1xccyoocmV0dXJuKT9cXHMqLywgJycpIC8vIGtpbGwgYXJndW1lbnQgbGlzdCBhbmQgbGVhZGluZyBjdXJseVxuICAgICAgLnJlcGxhY2UoL1xccypcXH1cXHMqJC8sICcnKSAgIC8vIGtpbGwgdHJhaWxpbmcgY3VybHlcbiAgO1xuICByZXR1cm4gYm9keTsgLy8gb3IgZm4/XG59XG5cbi8vIFJldHVybiBhbiBvYmplY3Qgb2YgbmFtZWQgZnVuY3Rpb24gcGFyYW1ldGVycyBhbmQgdGhlaXIgdmFsdWVzLlxuLy8gSW52b2tlIGFzIGBwYXJhbXNBc09iamVjdCh0aGlzRnVuY3Rpb24sIGFyZ3VtZW50cyk7YC5cbmZ1bmN0aW9uIHBhcmFtc0FzT2JqZWN0KGZuLCBhcmdzKSB7XG4gIHJldHVybiBvYmplY3RGcm9tTGlzdHMocGFyYW1pZnkoZm4pLCBhcmdzKTtcbn1cblxuLy8gRnVuY3Rpb24gd2hpY2ggZG9lcyBub3RoaW5nLlxuZnVuY3Rpb24gbm9vcCgpIHsgfVxuXG4vLyBGdW5jdGlvbiB3aGljaCByZXR1cm5zIGl0cyBhcmd1bWVudC5cbmZ1bmN0aW9uIGlkZW50aXR5KHgpIHtcbiAgcmV0dXJuIHg7XG59XG5cbi8vIEZ1bmN0aW9uIHdoaWNoIGFsd2F5cyByZXR1cm5zIHRoZSBzYW1lIHZhbHVlLlxuZnVuY3Rpb24gZml4ZWQoYykge1xuICByZXR1cm4gKCkgPT4gYztcbn1cblxuLy8gRnVuY3Rpb24gd2hpY2ggaW52ZXJ0cyBpdHMgYXJndW1lbnQuXG5mdW5jdGlvbiBpbnZlcnQoYykge1xuICByZXR1cm4gIWM7XG59XG5cbi8vIFBsYWNlIGEgZnVuY3Rpb24gdHJhbnNmb3JtZXIgb24gdGhlIEZ1bmN0aW9uIHByb3RvdHlwZS5cbi8vIFRoaXMgYWxsb3dzIGl0IGJlIHVzZWQgYXMgYGZuLnN3YXBpZnkoMSwyKWAuXG5mdW5jdGlvbiBwcm90b3R5cGVpemUoZm4sIG5hbWUgPSBmbi5uYW1lKSB7XG4gIGlmIChuYW1lKSB7IC8vIElFMTEgZG9lcyBub3Qgc3VwcG9ydCBuYW1lXG4gICAgZGVmaW5lUHJvcGVydHkocHJvdG90eXBlLCBuYW1lLCB7XG4gICAgICBnZXQ6IGZ1bmN0aW9uKCkgeyByZXR1cm4gZm4odGhpcyk7IH1cbiAgICB9KTtcbiAgfVxufVxuXG4vLyBQcm92aWRlIHZlcnNpb25zIG9uIGZ1bmN0aW9uIHByb3RvdHlwZSB0aGF0IGNhbiBiZSBjYWxsZWQgYXNcbi8vIGZ1bmN0aW9uLnN3YXBpZnkoMSwgMikuXG5pZiAodXB3YXJkQ29uZmlnLk1PRElGWV9CVUlMVElOX1BST1RPVFlQRVMpIHtcbiAgbGV0IGZsYWcgPSAnVVBXQVJEX01PRElGSUVEX0JVSUxUSU5fUFJPUEVSVElFUyc7XG4gIGlmICghcHJvdG90eXBlW2ZsYWddKSB7XG4gICAgW1xuICAgICAgdGlja2lmeSwgY2hhaW5pZnksIHNlbGZpZnksIG1lbW9pZnksIHN3YXBpZnksIGRyb3BpZnksIGFyZ2lmeSwgaW52ZXJ0aWZ5LFxuICAgICAgdHJpbWlmeSwgc2VsZnRoaXNpZnksIHJlcGVhdGlmeSwgb25jZWlmeSwgaW5zZXJ0c2VsZmlmeSwgd3JhcGlmeSwgcGFyYW1pZnksIGxvZ2lmeVxuICAgIF1cbiAgICAgIC5mb3JFYWNoKHRyaW1pZnkocHJvdG90eXBlaXplKSk7XG4gICAgZGVmaW5lUHJvcGVydHkocHJvdG90eXBlLCBmbGFnLCB7IHZhbHVlOiB0cnVlIH0pO1xuICB9XG59XG5cbmV4cG9ydCB7XG4gIGNvbXBvc2UsXG5cbiAgICAgICAgdGlja2lmeSxcbiAgICAgICBjaGFpbmlmeSxcbiAgICAgICAgc2VsZmlmeSxcbiAgICAgICAgbWVtb2lmeSxcbiAgICAgICAgc3dhcGlmeSxcbiAgICAgICAgZHJvcGlmeSxcbiAgICAgICAgIGFyZ2lmeSxcbiAgICAgIGludmVydGlmeSxcbiAgICAgICBtYXliZWlmeSxcbiAgICBzZWxmdGhpc2lmeSxcbiAgICAgIHJlcGVhdGlmeSxcbiAgICAgICAgb25jZWlmeSxcbiAgaW5zZXJ0c2VsZmlmeSxcbiAgICAgICAgd3JhcGlmeSxcbiAgICAgICBkZWJ1Z2lmeSxcbiAgICAgICBwYXJhbWlmeSxcbiAgICAgICAgIGxvZ2lmeSxcblxuICBwYXJzZUJvZHksXG5cbiAgbm9vcCxcbiAgaWRlbnRpdHksXG4gIGludmVydCxcbiAgZml4ZWRcbn07XG4iLCIvLyBIVE1MIGlucHV0IGVsZW1lbnRzXG4vLyA9PT09PT09PT09PT09PT09PT09XG5cbi8vIEJvb2trZWVwaW5nIGFuZCBpbml0aWFsaXphdGlvbi5cbmltcG9ydCB7aXNVcHdhcmRhYmxlfSBmcm9tICcuL1Vwdyc7XG52YXIge2RlZmluZVByb3BlcnRpZXMsIG9ic2VydmV9ID0gT2JqZWN0O1xuXG4vKipcbiAqICMjIFVwSW5wdXRzICguc2V0cylcbiAqXG4gKiBBc3NvY2lhdGVzIGFuIHVwd2FyZGFibGUgd2l0aCB0aGUgdmFsdWUgb2YgYW4gaW5wdXQgZWxlbWVudC5cbiAqXG4gKiBAcGFyYW0ge0hUTUxJbnB1dEVsZW1lbnR9IGVsdCBlbGVtZW50IHRvIGFzc29jaWF0ZVxuICogQHBhcmFtIHtVcHdhcmRhYmxlfSB1cHdhcmRhYmxlIHVwd2FyZGFibGUgdG8gYXNzb2NpYXRlXG4gKiBAcGFyYW0gW2Jvb2xlYW49ZmFsc2VdIHJlYWx0aW1lIGlmIHRydWUsIHVwZGF0ZSB1cHdhcmRhYmxlIGVhY2ggY2hhclxuICovXG5cbmZ1bmN0aW9uIFVwSW5wdXRzKGVsdCwgdXB3YXJkYWJsZSwgcmVhbHRpbWUgPSBmYWxzZSkge1xuICBjb25zb2xlLmFzc2VydChlbHQgaW5zdGFuY2VvZiBIVE1MSW5wdXRFbGVtZW50LCBcIkZpcnN0IGFyZ3VtZW50IHRvIFVwSW5wdXRzIG11c3QgYmUgaW5wdXQgZWxlbWVudFwiKTtcbiAgY29uc29sZS5hc3NlcnQoaXNVcHdhcmRhYmxlKHVwd2FyZGFibGUpLCBcIlNlY29uZCBhcmd1bWVudCB0byBVcElucHV0cyAoLmlucHV0cykgbXVzdCBiZSB1cHdhcmRhYmxlXCIpO1xuXG4gIGZ1bmN0aW9uIG9ic2VydmVVcHdhcmRhYmxlKCkge1xuICAgIG9ic2VydmUodXB3YXJkYWJsZSwgY2hhbmdlcyA9PiBjaGFuZ2VzLmZvckVhY2goXG4gICAgICBjaGFuZ2UgPT4gZWx0LnZhbHVlID0gY2hhbmdlLm5ld1ZhbHVlKSwgWyd1cHdhcmQnXSk7XG4gIH1cblxuICBlbHQuYWRkRXZlbnRMaXN0ZW5lcihyZWFsdGltZSA/ICdpbnB1dCcgOiAnY2hhbmdlJywgXyA9PiB7XG4gICAgdXB3YXJkYWJsZSA9IHVwd2FyZGFibGUuY2hhbmdlKGVsdC52YWx1ZSk7XG4gICAgb2JzZXJ2ZVVwd2FyZGFibGUoKTtcbiAgfSk7XG5cbiAgZWx0LnZhbHVlID0gdXB3YXJkYWJsZTtcbiAgb2JzZXJ2ZVVwd2FyZGFibGUoKTtcbiAgcmV0dXJuIGVsdDtcbn1cblxuLy8gRXh0ZW5kIEhUTUxJbnB1dEVsZW1lbnQgcHJvdG90eXBlIHdpdGggYHNldHNgIGFuZCBgc2V0c0ltbWVkaWF0ZWAgbWV0aG9kcy5cbnZhciB7cHJvdG90eXBlfSA9IEhUTUxJbnB1dEVsZW1lbnQ7XG52YXIgU0VUU19QUk9QID0gJ3NldHMnO1xudmFyIFNFVFNfSU1NRURJQVRFX1BST1AgPSAnc2V0c0ltbWVkaWF0ZSc7XG5cbmlmICghcHJvdG90eXBlLmhhc093blByb3BlcnR5KFNFVFNfUFJPUCkpIHtcbiAgZGVmaW5lUHJvcGVydGllcyhwcm90b3R5cGUsIHtcbiAgICBbU0VUU19QUk9QXTogICAgICAgICAgIHsgdmFsdWUodXB3YXJkYWJsZSkgeyByZXR1cm4gVXBJbnB1dHModGhpcywgdXB3YXJkYWJsZSwgZmFsc2UpOyB9IH0sXG4gICAgW1NFVFNfSU1NRURJQVRFX1BST1BdOiB7IHZhbHVlKHVwd2FyZGFibGUpIHsgcmV0dXJuIFVwSW5wdXRzKHRoaXMsIHVwd2FyZGFibGUsIHRydWUgKTsgfSB9XG4gIH0pO1xufVxuXG5cbi8vIE5vcm1hbGx5IHRoaXMgbW9kdWxlIHdpbGwgYmUgaW1wb3J0ZWQgYXMgYGltcG9ydCAnLi9zcmMvSW5wJztgLlxuZXhwb3J0IGRlZmF1bHQgVXBJbnB1dHM7XG4iLCIvLyBMT0dHSU5HXG4vLyA9PT09PT09XG4vL1xuLy8gQ3JlYXRlIHBhcmFtZXRlciBsaXN0cyBmb3IgYGNvbnNvbGUubG9nYCBldGMuXG4vL1xuLy8gRXhwb3NpbmcgYW5vdGhlciB0b3AtbGV2ZWwgbG9nZ2luZyBBUEksIHdoaWNoIGluIHR1cm4gd291bGQgY2FsbFxuLy8gYGNvbnNvbGUubG9nYCwgd291bGQgcmVzdWx0IGluIGZpbGUvbGluZSBpbmZvcm1hdGlvbiBpbiB0aGUgY29uc29sZVxuLy8gcmVmZXJyaW5nIHRvIHdoZXJlIG91ciByb3V0aW5lIG1hZGUgdGhlIGBjb25zb2xlLmxvZ2AgY2FsbCwgcmF0aGVyIHRoYW5cbi8vIHdoZXJlIHRoZSBhY3R1YWwgbG9nZ2luZyBjYWxsIHdhcyBtYWRlLlxuLy9cbi8vIFRoZXJlZm9yZSwgd2UgYWRvcHQgYSBsb3ctaW1wYWN0IHNvbHV0aW9uXG4vLyBkZWZpbmluZyBhIHJvdXRpbmUgdG8gc2ltcGx5IGZvcm1hdCBsb2dnaW5nIHBhcmFtZXRlcnMgYW5kIHJldHVybiBhbiBhcnJheVxuLy8gc3VpdGFibGUgZm9yIHBhc3NpbmcgdG8gKiphbnkqKiBsb2dnaW5nIHJvdXRpbmUgdXNpbmcgdGhlIHNwcmVhZCBvcGVyYXRvci5cbi8vXG4vLyBVc2FnZTpcbi8vIGBgYFxuLy8gaW1wb3J0IGxvZ0NoYW5uZWwgZnJvbSAnY29ubmVjdC91dGlscy9sb2ctY2hhbm5lbCc7XG4vLyB2YXIgY2hhbm5lbCA9IGxvZ0NoYW5uZWwoJ215Y2hhbicsIHsgc3R5bGU6IHsgY29sb3I6IHJlZCB9IH0pO1xuLy8gY29uc29sZS5sb2coLi4uY2hhbm5lbChtc2cpKTtcbi8vIGBgYFxuLy9cbi8vIEEgYHRyYW5zcG9ydHNgIG9wdGlvbiBtYXkgYmUgc3BlY2lmaWVkIGdpdmluZyBhIGxpc3Qgb2YgdHJhbnNwb3J0cyB3aGljaCBhcmUgdG9cbi8vIGNhbGxlZCB3aGVuIGludm9rZWQgdmlhIGBjaGFubmVsLndhcm5gIGV0Yy5cbi8vIFN1Y2ggdHJhbnNwb3J0cyBtaWdodCBzZW5kIHRoZSBsb2cgbWVzc2FnZSB0byBhIHNlcnZlciwgb3Igd3JpdGUgaXQgdG8gbG9jYWxTdG9yYWdlLlxuLy8gVHJhbnNwb3J0cyBhcmUgY2FsbGVkIHdpdGggYSBgeyBjaGFubmVsLCBzZXZlcml0eSwgcGFyYW1zIH1gIGhhc2guXG4vLyBBIHN0YWNrIHRyYWNlIGlzIGFsc28gcGFzc2VkIGZvciBzZXZlcml0aWVzIG9mIGVycm9yIGFuZCBmYXRhbC5cbi8vIEN1cnJlbnRseSB3ZSBoYXZlIGBsb2NhbFN0b3JhZ2VUcmFuc3BvcnRgLCBgcmVtb3RlVHJhbnNwb3J0YCxcbi8vIGBkb21FdmVudFRyYW5zcG9ydGAsIGFuZCBgd2Vic29ja2V0VHJhbnNwb3J0YC5cblxuaW1wb3J0IHtkYXNoZXJpemV9IGZyb20gJy4vU3RyJztcblxuLy8gU2V2ZXJpdGllcyBzdXBwb3J0ZWQgYnkgdHJhbnNwb3J0cywgd2hlbiBsb2dnZXIgaXMgaW52b2tlZCBhcyBgY2hhbm5lbC5lcnJvciguLi4pYCBldGMuXG5jb25zdCBTRVZFUklUSUVTID0gWyd0cmFjZScsICdkZWJ1ZycsICdpbmZvJywgJ3dhcm4nLCAnZXJyb3InLCAnZmF0YWwnXTtcblxuZnVuY3Rpb24gY29uc29sZVN1cHBvcnQoKSB7XG4gIHZhciBicm93c2VyID0ge307XG4gIGJyb3dzZXIuaXNGaXJlZm94ID0gL2ZpcmVmb3gvaS50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpO1xuICBicm93c2VyLmlzSUUgPSBkb2N1bWVudC5kb2N1bWVudE1vZGU7XG5cbiAgdmFyIHN1cHBvcnQgPSB7fTtcbiAgc3VwcG9ydC5jb25zb2xlQXBwbHkgPSAhYnJvd3Nlci5pc0lFIHx8IGRvY3VtZW50LmRvY3VtZW50TW9kZSAmJiBkb2N1bWVudC5kb2N1bWVudE1vZGUgPiA5O1xuICBzdXBwb3J0LmZ1bmN0aW9uR2V0dGVycyA9IHN1cHBvcnQuY29uc29sZUFwcGx5O1xuICBzdXBwb3J0LmNvbnNvbGUgPSAhIXdpbmRvdy5jb25zb2xlO1xuICBzdXBwb3J0Lm1vZGlmaWVkQ29uc29sZSA9ICFicm93c2VyLmlzSUUgJiYgc3VwcG9ydC5jb25zb2xlICYmIGNvbnNvbGUubG9nLnRvU3RyaW5nKCkuaW5kZXhPZignYXBwbHknKSAhPT0gLTE7XG4gIHN1cHBvcnQuc3R5bGVzID0gISF3aW5kb3cuY2hyb21lIHx8ICEhKGJyb3dzZXIuaXNGaXJlZm94ICYmIHN1cHBvcnQubW9kaWZpZWRDb25zb2xlKTtcbiAgc3VwcG9ydC5ncm91cHMgPSAhISh3aW5kb3cuY29uc29sZSAmJiBjb25zb2xlLmdyb3VwKTtcblxuICByZXR1cm4gc3VwcG9ydDtcbn1cbnZhciBzdXBwb3J0ID0gY29uc29sZVN1cHBvcnQoKTtcblxuY29uc3QgQUxMID0gLy4qLztcblxudmFyIGNoYW5uZWxzICAgICAgICAgID0ge307ICAgIC8vIFJlbWVtYmVyIGdyb3Vwc1xudmFyIGVuYWJsZWRDaGFubmVscyAgID0gQUxMOyAgIC8vIEVuYWJsZWQgY2hhbm5lbCByZWdleHAsIHNldCBieSBgc2V0RW5hYmxlZENoYW5uZWxzYFxudmFyIGVuYWJsZWRTZXZlcml0aWVzID0gQUxMOyAgIC8vIEVuYWJsZWQgc2V2ZXJpdGllcywgc2V0IGJ5IGBzZXRFbmFibGVkU2V2ZXJpdGllc2BcblxuLy8gQ1JFQVRFIEEgTkVXIExPRyBDSEFOTkVMXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vXG4vLyBBIGNoYW5uZWwgaGFzIGEgbmFtZSwgYHN0eWxlYCBmb3JtYXR0aW5nIG9wdGlvbnMgZm9yIGBjb25zb2xlLm91dGAsIGEgbGlzdCBvZiB0cmFuc3BvcnRzLFxuLy8gYW5kIGEgbGlzdCBvZiBzdXBwcmVzc2VkIGVycm9yIGxldmVscy5cbi8vIEl0IGlzIGEgZnVuY3Rpb24gd2hpY2ggcmV0dXJucyBhbiBhcnJheSBvZiBwYXJhbWV0ZXJzIHN1aXRhYmxlIGZvciBzcHJlYWRpbmcgaW50byBgY29uc29sZS5sb2dgLlxuLy8gQ2hhbm5lbHMgYWxzbyBoYXZlIHByb3BlcnRpZXMgYGluZm9gLCBgd2FybmAgZXRjLiwgZnVuY3Rpb25zIHdoaWNoIGluIGFkZGl0aW9uIHRvIHJldHVybmluZyB0aGVcbi8vIGFycmF5IG9mIHBhcmFtZXRlcnMsIGludm9rZSB0aGUgY2hhbm5lbCdzIGRlc2lnbmF0ZWQgdHJhbnNwb3J0cy5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGxvZ0NoYW5uZWwoY2hhbm5lbCwgb3B0aW9ucyA9IHt9KSAge1xuICB2YXIgc3R5bGUgICAgICA9IG9wdGlvbnMuc3R5bGUgfHwge307XG4gIHZhciBlbmFibGVkICAgID0gb3B0aW9ucy5lbmFibGVkO1xuICB2YXIgdHJhbnNwb3J0cyA9IG9wdGlvbnMudHJhbnNwb3J0cyB8fCBbXTtcbiAgdmFyIHN1cHByZXNzICAgPSBvcHRpb25zLnN1cHByZXNzIHx8IFtdO1xuXG4gIGVuYWJsZWQgPSBlbmFibGVkID09PSB1bmRlZmluZWQgPyB0cnVlIDogZW5hYmxlZDtcblxuICAvLyBUT0RPOiByZXBsYWNlIGFib3ZlIHdpdGggdGhlIGJlbG93LCB3aGVuIGpzaGludCBnZXRzIHNtYXJ0ZXIuXG4gIC8vIHZhciB7IHN0eWxlID0ge30sIGVuYWJsZWQgPSB0cnVlLCB0cmFuc3BvcnRzID0gW10sIHN1cHByZXNzID0gW10gKSA9IG9wdGlvbnM7XG5cbiAgLy8gQ3JlYXRlIHN0cmluZyBvZiBmb3JtIGBjb2xvcjpyZWRgIGZvciB1c2Ugd2l0aCBjb25zb2xlJ3MgYCVjYCBmb3JtYXQgc3BlY2lmaWVyLlxuICB2YXIgc3R5bGVTdHJpbmcgPSBPYmplY3Qua2V5cyhzdHlsZSkgLiBtYXAoa2V5ID0+IGRhc2hlcml6ZShrZXkpICsgJzonICsgc3R5bGVba2V5XSkuam9pbignOycpO1xuXG4gIHZhciBmbiA9IGZ1bmN0aW9uKG1heWJlRm9ybWF0LCAuLi5wYXJhbXMpIHtcbiAgICB2YXIgZm9ybWF0ID0gc3VwcG9ydC5zdHlsZXMgPyBgJWNbJHtjaGFubmVsfV1gIDogYFske2NoYW5uZWx9XWA7XG5cbiAgICBpZiAoIWVuYWJsZWQgfHwgIWVuYWJsZWRDaGFubmVscy50ZXN0KGNoYW5uZWwpKSByZXR1cm4gW107XG5cbiAgICAvLyBJZiB0aGUgZmlyc3QgcGFyYW1ldGVyIGlzIGEgc3RyaW5nLCBpdCBtYXkgY29udGFpbiBmb3JtYXR0aW5nIGNvZGVzIHN1Y2ggYXMgYCVzYC5cbiAgICAvLyBJbiB0aGF0IGNhc2UsIGFwcGVuZCBpdCB0byBvdXIgZm9ybWF0dGluZyBzdHJpbmcgc28gdGhpbmdzIHdvcmsgYXMgZXhwZWN0ZWQuXG4gICAgaWYgKHR5cGVvZiBtYXliZUZvcm1hdCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIGZvcm1hdCArPSAnICcgKyBtYXliZUZvcm1hdDtcbiAgICAgIHJldHVybiBzdXBwb3J0LnN0eWxlcyA/IFtmb3JtYXQsIHN0eWxlU3RyaW5nLCAuLi5wYXJhbXNdIDogW2Zvcm1hdCwgLi4ucGFyYW1zXTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHN1cHBvcnQuc3R5bGVzID8gW2Zvcm1hdCwgc3R5bGVTdHJpbmcsIG1heWJlRm9ybWF0LCAuLi5wYXJhbXNdIDogW2Zvcm1hdCwgbWF5YmVGb3JtYXQsIC4uLnBhcmFtc107XG4gICAgfVxuICB9O1xuXG4gIC8vIEFkZCBzZXZlcml0eS1zcGVjaWZpYyBpbnRlcmZhY2VzIGludm9rZWQgdmlhIGBjaGFubmVsLndhcm5gIGV0Yy5cbiAgLy8gVGhlc2UgYWxzbyBzZW5kIHRoZSBsb2cgaW5mb3JtYXRpb24gdG8gdGhlIHNwZWNpZmllZCB0cmFuc3BvcnRzLlxuICBTRVZFUklUSUVTLmZvckVhY2goXG4gICAgc2V2ZXJpdHkgPT5cbiAgICAgIGZuW3NldmVyaXR5XSA9IGZ1bmN0aW9uKC4uLnBhcmFtcykge1xuICAgICAgICBpZiAoIWVuYWJsZWQgfHwgc3VwcHJlc3MuaW5kZXhPZihzZXZlcml0eSkgIT09IC0xIHx8ICFlbmFibGVkU2V2ZXJpdGllcy50ZXN0KHNldmVyaXR5KSkgcmV0dXJuIFtdO1xuXG4gICAgICAgIGlmIChzZXZlcml0eSA9PT0gJ2Vycm9yJyB8fCBzZXZlcml0eSA9PT0gJ2ZhdGFsJykge1xuICAgICAgICAgIHZhciBzdGFjayA9IG5ldyBFcnJvcigpLnN0YWNrO1xuICAgICAgICAgIHRyYW5zcG9ydHMuZm9yRWFjaCh0cmFuc3BvcnQgPT4gdHJhbnNwb3J0KHsgY2hhbm5lbCwgc2V2ZXJpdHksIHBhcmFtcywgc3RhY2sgfSkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRyYW5zcG9ydHMuZm9yRWFjaCh0cmFuc3BvcnQgPT4gdHJhbnNwb3J0KHsgY2hhbm5lbCwgc2V2ZXJpdHksIHBhcmFtcyB9KSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBSZXR1cm4gdGhlIGFycmF5IG9mIHBhcmFtZXRlcnMgaW4gY2FzZSB0aGlzIGlzIHRvIGJlIHNwcmVhZCBpbnRvIGBjb25zb2xlLmxvZ2AuXG4gICAgICAgIHJldHVybiBmbihuYW1lLCAuLi5wYXJhbXMpO1xuICAgICAgfVxuICApO1xuXG4gIC8vIEFkZCBpbnRlcmZhY2VzIGZvciBlbmFibGluZyBhbmQgZGlzYWJsaW5nIHRoaXMgY2hhbm5lbC5cbiAgLy8gYGBgXG4gIC8vIHZhciBjaGFubmVsID0gbG9nQ2hhbm5lbCgnc3BlZWNoJyk7XG4gIC8vIGNoYW5uZWwuZGlzYWJsZSgpO1xuICAvLyBgYGBcbiAgZm4uZW5hYmxlICA9ICgpID0+IGVuYWJsZWQgPSB0cnVlO1xuICBmbi5kaXNhYmxlID0gKCkgPT4gZW5hYmxlZCA9IGZhbHNlO1xuXG4gIHJldHVybiBjaGFubmVsc1tjaGFubmVsXSA9IGZuO1xufVxuXG4vLyBFbmFibGUgY2hhbm5lbHMgYXQgZ2xvYmFsIGxldmVsLlxuZXhwb3J0IGZ1bmN0aW9uIGVuYWJsZUNoYW5uZWwgKGNoYW5uZWwpICB7IGlmIChjaGFubmVsc1tjaGFubmVsXSkgY2hhbm5lbHNbY2hhbm5lbF0uZW5hYmxlKCk7ICB9XG5leHBvcnQgZnVuY3Rpb24gZGlzYWJsZUNoYW5uZWwoY2hhbm5lbCkgIHsgaWYgKGNoYW5uZWxzW2NoYW5uZWxdKSBjaGFubmVsc1tjaGFubmVsXS5kaXNhYmxlKCk7IH1cblxuZXhwb3J0IGZ1bmN0aW9uIGVuYWJsZUNoYW5uZWxzKHJlZ2V4cCkgICB7IGVuYWJsZWRDaGFubmVscyAgID0gbmV3IFJlZ0V4cChyZWdleHApOyB9XG5leHBvcnQgZnVuY3Rpb24gZW5hYmxlQWxsQ2hhbm5lbHMoKSAgICAgIHsgZW5hYmxlZENoYW5uZWxzICAgPSBBTEw7ICAgICAgICAgICAgfVxuXG5leHBvcnQgZnVuY3Rpb24gZW5hYmxlU2V2ZXJpdGllcyhyZWdleHApIHsgZW5hYmxlZFNldmVyaXRpZXMgPSBuZXcgUmVnRXhwKHJlZ2V4cCk7IH1cbmV4cG9ydCBmdW5jdGlvbiBlbmFibGVBbGxTZXZlcml0aWVzKCkgICAgeyBlbmFibGVkU2V2ZXJpdGllcyA9IEFMTDsgICAgICAgICAgICB9XG5cblxuLy8gTE9DQUwgU1RPUkFHRS1CQVNFRCBUUkFOU1BPUlRcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vL1xuLy8gVGhlIHZhbHVlIGluIGxvY2FsIHN0b3JhZ2UgdW5kZXIgdGhlIHNwZWNpZmllZCBrZXkgaXMgSlNPTmlmaWVkIGFycmF5IG9mIGxvZyBlbnRyaWVzLlxuLy8gVGhlIHRyYW5zcG9ydCBleHBvc2VzIGBnZXRgIGFuZCBgY2xlYXJgIEFQSXMgdG8gZ2V0IGFycmF5IG9mIGxvZyBlbnRyaWVzIGV0Yy5cbi8vIFVOVEVTVEVELlxuZXhwb3J0IGZ1bmN0aW9uIGxvY2FsU3RvcmFnZVRyYW5zcG9ydChrZXkpIHtcblxuICAvLyBHZXQgdGhlIGFycmF5IG9mIGxvZyBlbnRyaWVzIGZyb20gbG9jYWwgc3RvcmFnZS5cbiAgZnVuY3Rpb24gZ2V0KCkgeyByZXR1cm4gSlNPTi5wYXJzZShsb2NhbFN0b3JhZ2UuZ2V0SXRlbShrZXkpIHx8ICdbXScpOyB9XG5cbiAgLy8gQ2xlYXIgdGhlIGxvY2FsIHN0b3JhZ2Uga2V5LlxuICBmdW5jdGlvbiBjbGVhcigpIHsgbG9jYWxTdG9yYWdlLmNsZWFyKGtleSk7IH1cblxuIC8vIFB1dCB0aGUgYXJyYXkgb2YgbG9nIGVudHJpZXMgaW50byBsb2NhbCBzdG9yYWdlLlxuICBmdW5jdGlvbiBwdXQobG9ncykgeyBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShrZXksIEpTT04uc3RyaW5naWZ5KGxvZ3MpKTsgfVxuXG4gIC8vIFRyYW5zcG9ydCByZXRyaWV2ZXMgY3VycmVudCBzZXQgb2YgbG9nIGVudHJpZXMgYW5kIGFkZHMgbmV3IG9uZS5cbiAgZnVuY3Rpb24gdHJhbnNwb3J0KGxvZykgeyBwdXQoZ2V0KCkgLiBjb25jYXQobG9nKSk7IH1cblxuICAvLyBBZGQgdXRpbGl0eSBmdW5jdGlvbnMgdG8gcmV0dXJuIGFycmF5IG9mIGxvZyBhbmQgY2xlYXIuXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKHRyYW5zcG9ydCwgeyBnZXQ6IHsgdmFsdWU6IGdldCB9LCBjbGVhcjogeyB2YWx1ZTogY2xlYXIgfSB9KTtcblxuICByZXR1cm4gdHJhbnNwb3J0O1xufVxuXG5cbi8vIFRSQU5TUE9SVCBGT1IgUE9TVElORyBMT0cgREFUQSBUTyBSRU1PVEUgVVJMXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gVU5URVNURUQuIE5lZWRzIGZldGNoLlxuZXhwb3J0IGZ1bmN0aW9uIHJlbW90ZVRyYW5zcG9ydCh1cmwpIHtcblxuICByZXR1cm4gZnVuY3Rpb24obG9nKSB7XG4gICAgLy8gVE9ETzogYnJpbmcgaW4gZmV0Y2ggZnJvbSBzb21ld2hlcmVcbiAgICB2YXIgZmV0Y2g7XG4gICAgdmFyIGhlYWRlcnMgPSB7ICdBY2NlcHQnOiAnYXBwbGljYXRpb24vanNvbicsICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfTtcbiAgICB2YXIgbWV0aG9kICA9ICdQT1NUJztcbiAgICB2YXIgYm9keSAgICA9ICBKU09OLnN0cmluZ2lmeShsb2cpO1xuXG4gICBmZXRjaCh1cmwsIHsgbWV0aG9kLCBoZWFkZXJzLCBib2R5IH0pO1xuICAgIC8vIEhvdyB0byByZXBvcnQgZXJyb3I/XG4gIH07XG5cbn1cblxuXG4vLyBXRUJTT0NLRVQtQkFTRUQgVFJBTlNQT1JUXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5leHBvcnQgZnVuY3Rpb24gd2Vic29ja2V0VHJhbnNwb3J0KHNvY2tldCkge1xuICByZXR1cm4gZnVuY3Rpb24obG9nKSB7IHNvY2tldC5zZW5kKEpTT04uc3RyaW5naWZ5KGxvZykpOyB9O1xufVxuXG5cbi8vIERPTSBFVkVOVC1CQVNFRCBUUkFOU1BPUlRcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vXG4vLyBVc2UgdGhlIERPTSBldmVudCBtZWNoYW5pc20gdG8gcmVwb3J0IGxvZyBlbnRyaWVzLlxuLy8gVGhlIHRhcmdldCBlbGVtZW50IGlzIHNwZWNpZmllZCwgb3IgZGVmYXVsdHMgdG8gYGRvY3VtZW50YC5cbi8vIFRoZSBsaXN0ZW5lciBjb25zdWx0cyB0aGUgYGRldGFpbGAgcHJvcGVydHkgb2YgdGhlIGV2ZW50IG9iamVjdCB0byBmaW5kIHRoZSBsb2cgaW5mby5cbi8vXG4vLyBVc2FnZTpcbi8vIGBgYFxuLy8gaW1wb3J0IGxvZ0NoYW5uZWwsIHtkb21FdmVudFRyYW5zcG9ydH0gZnJvbSAnY29ubmVjdC91dGlscy9sb2ctY2hhbm5lbCc7XG4vLyB2YXIgdHJhbnNwb3J0ID0gZG9tRXZlbnRUcmFuc3BvcnQoJ215ZXZlbnQnKTtcbi8vIHZhciBjaGFubmVsICAgPSBsb2dDaGFubmVsKCdteWNoYW4nLCB7IHRyYW5zcG9ydHM6IFt0cmFuc3BvcnRdIH0pO1xuLy8gY2hhbm5lbC53YXJuKFwiV2FybmluZ1wiKTtcbi8vXG4vLyBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwibXlldmVudFwiLCBmdW5jdGlvbih7IGRldGFpbDogeyBjaGFubmVsIH0pICB7IGFsZXJ0KFwiR290IHdhcm5pbmchXCIpOyB9KTtcbi8vIGBgYFxuZXhwb3J0IGZ1bmN0aW9uIGRvbUV2ZW50VHJhbnNwb3J0KGV2ZW50TmFtZSwgZWx0ID0gZG9jdW1lbnQpIHtcblxuICBmdW5jdGlvbiB0cmFuc3BvcnQoZGV0YWlsKSB7XG4gICAgdmFyIGV2ZW50ID0gbmV3IEN1c3RvbUV2ZW50KGV2ZW50TmFtZSwgeyBkZXRhaWwgfSk7XG4gICAgZWx0LmRpc3BhdGNoRXZlbnQoZXZlbnQpO1xuICB9XG5cbiAgcmV0dXJuIHRyYW5zcG9ydDtcbn1cblxuXG4vLyBQT1NUTUVTU0FHRS1CQVNFRCBUUkFOU1BPUlRcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4vLyBVc2UgcG9zdE1lc3NhZ2UgdG8gcG9zdCB0aGUgbG9nIGluZm8gdG8gYW5vdGhlciB3aW5kb3cuXG5leHBvcnQgZnVuY3Rpb24gcG9zdE1lc3NhZ2VUcmFuc3BvcnQob3RoZXJXaW5kb3csIHRhcmdldE9yaWdpbiA9ICcqJykge1xuICByZXR1cm4gZnVuY3Rpb24gdHJhbnNwb3J0KGxvZykge1xuICAgIG90aGVyV2luZG93LnBvc3RNZXNzYWdlKGxvZywgdGFyZ2V0T3JpZ2luKTtcbiAgfTtcbn1cbiIsIi8vIE1hcC5qc1xuLy8gVXB3YXJkLWF3YXJlIHZlcnNpb24gb2YgQXJyYXkjbWFwXG5cbmltcG9ydCB7bWFrZVVwd2FyZGFibGVGdW5jdGlvbn0gZnJvbSAnLi9GdW4nO1xuaW1wb3J0IHtjb3B5T250b0FycmF5fSBmcm9tICcuL091dCc7XG5cbmV4cG9ydCBkZWZhdWx0IG1ha2VVcHdhcmRhYmxlRnVuY3Rpb24oZnVuY3Rpb24gKlVwTWFwKHJ1bikge1xuICB2YXIgciA9IFtdO1xuICB2YXIgYSwgbmV3YTtcbiAgdmFyIGYsIG5ld2Y7XG4gIHZhciBjdHh0LCBuZXdjdHh0O1xuICB2YXIgbWFwID0gbmV3IE1hcCgpO1xuXG4gIGZ1bmN0aW9uIF9tYXAoZWx0KSB7XG4gICAgdmFyIHJldCA9IG1hcC5nZXQoT2JqZWN0KGVsdCkpO1xuICAgIGlmICghcmV0KSB7XG4gICAgICByZXQgPSBmLmNhbGwoY3R4dCwgZWx0KTtcbiAgICAgIG1hcC5zZXQoT2JqZWN0KGVsdCksIHJldCk7XG4gICAgfVxuICAgIHJldHVybiByZXQ7XG4gIH1cblxuICB3aGlsZSAodHJ1ZSkge1xuICAgIFtuZXdhLCBuZXdmLCBuZXdjdHh0XSA9IHlpZWxkIHI7XG4gICAgaWYgKG5ld2YgIT09IGYpIG1hcC5jbGVhcigpO1xuICAgIGEgPSBuZXdhO1xuICAgIGYgPSBuZXdmO1xuICAgIGN0eHQgPSBuZXdjdHh0O1xuICAgIGNvcHlPbnRvQXJyYXkociwgYS5tYXAoX21hcCkpO1xuICB9XG59KTtcbiIsIi8vIFVwd2FyZGFibGUgT2JqZWN0c1xuLy8gPT09PT09PT09PT09PT09PT09PVxuXG4vLyBVcHdhcmRhYmxlIG9iamVjdHMgYXJlIG9uZSBvZiB0aGUgdGhyZWUga2V5IGNvbXBvbmVudHMgb2YgdGhlIHVwd2FyZCBsaWJyYXJ5LFxuLy8gYWxvbmcgd2l0aCB1cHdhcmRhYmxlIHZhbHVlcyBhbmQgdXB3YXJkYWJsZSBmdW5jdGlvbnMuXG4vLyBBbiAqKnVwd2FyZGFibGUgb2JqZWN0KiogaXMgYW4gZW5oYW5jZWQgb2JqZWN0IHdoaWNoIGNhbiBkZXRlY3QgYW5kIGFuZCBhY3Qgb25cbi8vIGFjY2Vzc2VzIHRvIGl0cyBwcm9wZXJ0aWVzLlxuXG4vLyBBbiB1cHdhcmRhYmxlIG9iamVjdCBpcyBjcmVhdGVkIGJ5IGNhbGxpbmcgYG1ha2VVcHdhcmRhYmxlT2JqZWN0YCxcbi8vIHRoZSBkZWZhdWx0IGV4cG9ydCBmcm9tIHRoaXMgbW9kdWxlLCBvbiBhbiBvYmplY3QuXG4vLyBJbiBgaW5kZXguanNgLCB0aGlzIGlzIGFsaWFzZWQgdG8gYFVgLlxuLy8gYGEgPSBVcChbMSwgMiwgM10pYCBvciBgbz1VcCh7eDogMSwgeTogMn1gIGNyZWF0ZSB1cHdhcmRhYmxlcy5cbi8vIEFsbCBhY2Nlc3NlcyB0byB0aGUgZWxlbWVudHMgb2YgYGFgIGFuZCBgb2AgY29udGludWUgdG8gZnVuY3Rpb24gYXMgdXN1YWw6XG4vLyBgYVswXWAsIGBhWzBdID0gMTtgLCBgby54YCwgYW5kIGBvLnggPSAxYC5cbi8vIE5ld2x5IGFkZGVkIHByb3BlcnRpZXMgYXJlIGFsc28gaW1tZWRpYXRlbHkgb2JzZXJ2YWJsZS5cblxuLy8gQ29udmVuaWVuY2UuXG5pbXBvcnQge2FjY2Vzc05vdGlmaWVyfSAgICAgICAgZnJvbSAnLi9BY2MnO1xuaW1wb3J0IHtPYnNlcnZlcn0gICAgICAgICAgICAgIGZyb20gJy4vT2JzJztcbmltcG9ydCBtYWtlVXB3YXJkYWJsZSAgICAgICAgICBmcm9tICcuL1Vwdyc7XG5pbXBvcnQge2lzVXB3YXJkYWJsZX0gICAgICAgICAgZnJvbSAnLi9VcHcnO1xuXG52YXIge2NyZWF0ZSwga2V5cywgZ2V0Tm90aWZpZXIsIG9ic2VydmUsIHVub2JzZXJ2ZSwgZGVmaW5lUHJvcGVydHl9ID0gT2JqZWN0O1xuXG4vLyBMaXN0cyBvZiBhbGwgdXB3YXJkYWJsZXMsIGFuZCBvYmplY3RzIHdoaWNoIGhhdmUgYmVlbiB1cHdhcmRpZmllZC5cbnZhciBzZXQgICAgICAgICAgPSBuZXcgV2Vha1NldCgpO1xudmFyIHVwd2FyZGlmaWVkcyA9IG5ldyBXZWFrTWFwKCk7XG5cbi8qKlxuKiAjIyBpc1xuKlxuKiBDaGVjayBpZiBhbiBvYmplY3QgaXMgdXB3YXJkaWZpZWQuXG4qIEV4cG9ydGVkIGFzIGBpc1Vwd2FyZGFibGVPYmplY3RgLlxuKi9cbmZ1bmN0aW9uIGlzKHUpIHsgcmV0dXJuIHUgJiYgdHlwZW9mIHUgPT09ICdvYmplY3QnICYmIHNldC5oYXModSk7IH1cblxuLyoqXG4gKiAjIyBnZXRcbiAqXG4gKiBHZXQgdGhlIHVwd2FyZGFibGUgdmVyc2lvbiBvZiBhbiBvYmplY3QuXG4gKi9cbmZ1bmN0aW9uIGdldChvKSB7IHJldHVybiBvICYmIHR5cGVvZiBvID09PSAnb2JqZWN0JyAmJiB1cHdhcmRpZmllZHMuZ2V0KG8pOyB9XG5cbi8qKlxuICogIyMgbWFrZVxuICpcbiAqIENvbnN0cnVjdG9yIGZvciB1cHdhcmRhYmxlIG9iamVjdC5cbiAqIERlZmF1bHQgZXhwb3J0IGZyb20gdGhpcyBtb2R1bGUsIG9mdGVuIGltcG9ydGVkIGFzIGBtYWtlVXB3YXJkYWJsZU9iamVjdGAsXG4gKiBhbmQgYWxpYXNlZCBhcyBgVWAgaW4gYGluZGV4LmpzYC5cbiAqL1xuZnVuY3Rpb24gbWFrZShvKSB7XG4gIGlmIChpcyhvKSkgcmV0dXJuIG87XG4gIHZhciB1ID0gZ2V0KG8pO1xuICBpZiAoIXUpIHtcbiAgICB1ID0gX21ha2Uobyk7XG4gICAgc2V0LmFkZCh1KTtcbiAgICB1cHdhcmRpZmllZHMuc2V0KG8sIHUpO1xuICB9XG4gIHJldHVybiB1O1xufVxuXG4vKipcbiAqICMjIF9tYWtlXG4gKlxuICogTG93LWxldmVsIGNvbnN0cnVjdG9yIGZvciB1cHdhcmRhYmxlIG9iamVjdC5cbiAqL1xuZnVuY3Rpb24gX21ha2Uobykge1xuXG4gIHZhciBzaGFkb3cgPSB7fTtcbiAgdmFyIG9ic2VydmVycyA9IHt9O1xuICB2YXIgYWN0aW9ucyA9IHthZGQsIHVwZGF0ZSwgZGVsZXRlOiBfZGVsZXRlfTtcblxuICAvLyBEZWxldGUgYSBwcm9wZXJ0eS4gVW5vYnNlcnZlIGl0LCBkZWxldGUgc2hhZG93IGFuZCBwcm94eSBlbnRyaWVzLlxuICBmdW5jdGlvbiBfZGVsZXRlKG5hbWUpIHtcbiAgICBvYnNlcnZlcnNbbmFtZV0udW5vYnNlcnZlKCk7XG4gICAgZGVsZXRlIG9ic2VydmVyc1tuYW1lXTtcbiAgICBkZWxldGUgdSAgICAgICAgW25hbWVdO1xuICAgIGRlbGV0ZSBzaGFkb3cgICBbbmFtZV07XG4gIH1cblxuICAvLyBVcGRhdGUgYSBwcm9wZXJ0eSBieSByZW9ic2VydmluZy5cbiAgZnVuY3Rpb24gdXBkYXRlKG5hbWUpIHtcbiAgICBvYnNlcnZlcnNbbmFtZV0ucmVvYnNlcnZlKHNoYWRvd1tuYW1lXSk7XG4gIH1cblxuICAvLyBBZGQgYSBwcm9wZXJ0eS4gU2V0IHVwIGdldHRlciBhbmQgc2V0dGVyLCBPYnNlcnZlLiBQb3B1bGF0ZSBzaGFkb3cuXG4gIGZ1bmN0aW9uIGFkZChuYW1lKSB7XG5cbiAgICBmdW5jdGlvbiBzZXQodikge1xuICAgICAgdmFyIG9sZFZhbHVlID0gc2hhZG93W25hbWVdO1xuICAgICAgaWYgKG9sZFZhbHVlID09PSB2KSByZXR1cm47XG4gICAgICBvW25hbWVdID0gdjtcbiAgICAgIG5vdGlmaWVyLm5vdGlmeSh7dHlwZTogJ3VwZGF0ZScsIG9iamVjdDogdSwgbmFtZSwgb2xkVmFsdWV9KTtcbiAgICAgIHNoYWRvd1tuYW1lXSA9IG9sZFZhbHVlLmNoYW5nZSh2KTtcbiAgICB9XG5cbiAgICAvLyBXaGVuIHByb3BlcnR5IG9uIHVwd2FyZGFibGUgb2JqZWN0IGlzIGFjY2Vzc2VkLCByZXBvcnQgaXQgYW5kIHJldHVybiBzaGFkb3cgdmFsdWUuXG4gICAgZnVuY3Rpb24gZ2V0KCkge1xuICAgICAgYWNjZXNzTm90aWZpZXIubm90aWZ5KHt0eXBlOiAnYWNjZXNzJywgb2JqZWN0OiB1LCBuYW1lfSk7XG4gICAgICByZXR1cm4gc2hhZG93W25hbWVdO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG9ic2VydmUoY2hhbmdlcykge1xuLy8gICAgICBjaGFuZ2VzLmZvckVhY2goY2hhbmdlID0+IHNoYWRvd1tuYW1lXSA9IHNoYWRvd1tuYW1lXS5jaGFuZ2UoY2hhbmdlLm5ld1ZhbHVlKSk7XG4vLyAgICAgIG9ic2VydmVyc1tuYW1lXS5yZW9ic2VydmUoc2hhZG93W25hbWVdKTtcbiAgICB9XG5cbiAgICBzaGFkb3dbbmFtZV0gPSBtYWtlVXB3YXJkYWJsZShvW25hbWVdKTtcbiAgICBvYnNlcnZlcnNbbmFtZV0gPSBPYnNlcnZlcihzaGFkb3dbbmFtZV0sIG9ic2VydmUsIFsndXB3YXJkJ10pLm9ic2VydmUoKTtcbiAgICBkZWZpbmVQcm9wZXJ0eSh1LCBuYW1lLCB7c2V0OiBzZXQsIGdldDogZ2V0LCBlbnVtZXJhYmxlOiB0cnVlfSk7XG4gIH1cblxuICAvLyBPYnNlcnZlciB0byBoYW5kbGUgbmV3IG9yIGRlbGV0ZWQgcHJvcGVydGllcyBvbiB0aGUgb2JqZWN0LlxuICAvLyBQYXNzIHRocm91Z2ggdG8gdW5kZXJseWluZyBvYmplY3QsIHdoaWNoIHdpbGwgY2F1c2UgdGhlIHJpZ2h0IHRoaW5ncyB0byBoYXBwZW4uXG4gIGZ1bmN0aW9uIG9iamVjdE9ic2VydmVyKGNoYW5nZXMpIHtcbiAgICBjaGFuZ2VzLmZvckVhY2goKHt0eXBlLCBuYW1lfSkgPT4ge1xuICAgICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICBjYXNlICdhZGQnOiAgICBvW25hbWVdID0gdVtuYW1lXTsgYnJlYWs7XG4gICAgICBjYXNlICdkZWxldGUnOiBkZWxldGUgb1tuYW1lXTsgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAvLyBPYnNlcnZlciB0byBoYW5kbGUgbmV3LCBkZWxldGVkIG9yIHVwZGF0ZWQgcHJvcGVydGllcyBvbiB0aGUgdGFyZ2V0LlxuICBmdW5jdGlvbiB0YXJnZXRPYnNlcnZlcihjaGFuZ2VzKSB7XG4gICAgY2hhbmdlcy5mb3JFYWNoKCh7dHlwZSwgbmFtZX0pID0+IGFjdGlvbnNbdHlwZV0obmFtZSkpO1xuICAgIC8vbm90aWZpZXIubm90aWZ5KGNoYW5nZSk7IC8vIFRPRE86IGZpZ3VyZSBvdXQgd2hhdCB0aGlzIGxpbmUgd2FzIHN1cHBzb2VkIHRvIGRvXG4gIH1cblxuICB2YXIgdSA9IGNyZWF0ZSh7fSk7IC8vIG51bGw/XG4gIHZhciBub3RpZmllciA9IGdldE5vdGlmaWVyKHUpO1xuICBrZXlzKG8pLmZvckVhY2goYWRkKTtcbiAgb2JzZXJ2ZShvLCB0YXJnZXRPYnNlcnZlcik7XG4gIG9ic2VydmUodSwgb2JqZWN0T2JzZXJ2ZXIpO1xuICByZXR1cm4gdTtcbn1cblxuLy8gRXhwb3J0cy5cbmV4cG9ydCBkZWZhdWx0IG1ha2U7XG52YXIgaXNVcHdhcmRhYmxlT2JqZWN0ID0gaXM7XG5leHBvcnQge1xuICBpc1Vwd2FyZGFibGVPYmplY3Rcbn07XG4iLCIvLyBPYnNlcnZhdGlvbiB1dGlsaXRpZXNcbi8vID09PT09PT09PT09PT09PT09PT09PVxuXG4vLyBTZXR1cC5cbnZhciB7a2V5cywgY3JlYXRlLCBhc3NpZ24sIG9ic2VydmUsIHVub2JzZXJ2ZX0gPSBPYmplY3Q7XG5pbXBvcnQge2lzT2JqZWN0fSBmcm9tICcuL091dCc7XG5cbi8vIE1ha2UgYW4gb2JzZXJ2YXRpb24gaGFuZGxlciwgZ2l2ZW4gYSB0YXJnZXQgYW5kIGFuIG9iamVjdCBvZiBoYW5kbGVyc1xuLy8gd2l0aCBmdW5jdGlvbi12YWx1ZWQga2V5cyBzdWNoIGFzIFwiYWRkXCIsIFwiZGVsZXRlXCIsIGFuZCBcInVwZGF0ZVwiLlxuLy8gS2V5cyBvZiB0aGUgZm9ybSBgdHlwZV9uYW1lYCwgc3VjaCBhcyBgdXBkYXRlX2FgLCBtYXkgYWxzbyBiZSBnaXZlbi5cbi8vIE1hcCB0aGUgc2lnbmF0dXJlIHRvIG1hdGNoIGBBcnJheSNmb3JFYWNoYCwgd2l0aCBjaGFuZ2VyZWMgYXMgNHRoIGFyZy5cbi8vIEFmdGVyIGFsbCBjaGFuZ2VzIGFyZSBoYW5kbGVkLCB0aGUgJ2VuZCcgaG9vayBpcyBjYWxsZWQuXG52YXIgb2JzZXJ2ZXJQcm90b3R5cGUgPSB7XG4gIGhhbmRsZShjaGFuZ2VzKSB7XG4gICAgdmFyIHNhdmVPYmplY3Q7XG4gICAgY2hhbmdlcy5mb3JFYWNoKGNoYW5nZSA9PiB7XG4gICAgICBsZXQge3R5cGUsIG9iamVjdCwgbmFtZX0gPSBjaGFuZ2U7XG4gICAgICAvLyBJZiBoYW5kbGVyIGluY2x1ZGVzIGEgbWV0aG9kIG5hbWVkIGB0eXBlX25hbWVgLCB1c2UgdGhhdC5cbiAgICAgIGxldCBmbiA9IHRoaXNbdHlwZSArICdfJyArIG5hbWVdIHx8IHRoaXNbdHlwZV0gfHwgKF8gPT4gdW5kZWZpbmVkKTtcbiAgICAgIHNhdmVPYmplY3QgPSBvYmplY3Q7XG4gICAgICAvLyAgICAgIGlmICh0eXBlID09PSAndXBkYXRlJyAmJiBuYW1lID09PSAnbGVuZ3RoJykgeyB0eXBlID0gJ2xlbmd0aCc7IH1cbiAgICAgIGZuKG9iamVjdFtuYW1lXSwgbmFtZSwgb2JqZWN0LCBjaGFuZ2UpO1xuICAgIH0pO1xuICAgIGlmICh0aGlzLmVuZCkgeyB0aGlzLmVuZChzYXZlT2JqZWN0KTsgfVxuICB9XG59O1xuXG4vLyBUaGlzIHZlcnNpb24gb2Ygb2JzZXJ2ZXJQcm90b3R5cGUgaGFuZGxlcyB0aGUgY2hhbmdlIG9iamVjdHMgYXN5bmNocm9ub3VzbHksXG4vLyBhbGxvd2luZyB0aGVtIHRvIHJldHVybiBwcm9taXNlcy5cbi8vIEhvd2V2ZXIsIGl0IGRvZXNuJ3Qgd29yayByaWdodCBub3csIGF0IGxlYXN0IG5vdCBpbiBhIHRlc3RpbmcgY29udGV4dC5cbnZhciBhc3luY09ic2VydmVyUHJvdG90eXBlID0ge1xuICBoYW5kbGUoY2hhbmdlcykge1xuICAgIHZhciBzYXZlT2JqZWN0O1xuICAgIHNwYXduKGZ1bmN0aW9uICooKSB7XG4gICAgICBmb3IgKHZhciBjaGFuZ2Ugb2YgY2hhbmdlcykge1xuICAgICAgICBsZXQge3R5cGUsIG9iamVjdCwgbmFtZX0gPSBjaGFuZ2U7XG4gICAgICAgIHZhciBmbiA9IHRoaXNbdHlwZV07XG4gICAgICAgIHNhdmVPYmplY3QgPSBvYmplY3Q7XG4gICAgICAgIGlmIChmbikgeyB5aWVsZCBmbiAob2JqZWN0W25hbWVdLCBuYW1lLCBvYmplY3QsIGNoYW5nZSk7IH1cbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLmVuZCkgeyB5aWVsZCB0aGlzLmVuZChzYXZlT2JqZWN0KTsgfVxuICAgIH0pO1xuICB9XG59O1xuXG4vLyBQcmVwYXJlIHRoZSBsaXN0IG9mIGB0eXBlYHMgdG8gcGFzcyB0byBPLm8sIGJhc2VkIG9uIGhhbmRsZXIgbWV0aG9kcy5cbi8vIEV2ZW4gaWYgb25seSBgZW5kYCBpcyBwcmVzZW50LCB3ZSBuZWVkIHRvIGFkZCBgYWRkYCBldGMuXG4vLyBJZiBoYW5kbGVyIG5hbWVkIGB0eXBlX25hbWVgIGlzIHRoZXJlLCByZWdpc3RlciBgdHlwZWAgYXMgaGFuZGxlZC5cbmZ1bmN0aW9uIGdldFR5cGVzRnJvbUhhbmRsZXJzKGhhbmRsZXJzKSB7XG4gIHZhciB0eXBlcyA9IGtleXMoaGFuZGxlcnMpO1xuICB0eXBlcyA9IHR5cGVzLm1hcChrID0+IGsucmVwbGFjZSgvXy4qLywgJycpKTtcbiAgaWYgKHR5cGVzLmluZGV4T2YoJ2VuZCcpICE9PSAtMSkge1xuICAgIHR5cGVzLnB1c2goJ2FkZCcsICd1cGRhdGUnLCAnZGVsZXRlJyk7XG4gIH1cbiAgcmV0dXJuIHR5cGVzO1xufVxuXG4vLyBNYWtlIGFuIG9ic2VydmVyIGZyb20gYSBoYXNoIG9mIGhhbmRsZXJzIGZvciBvYnNlcnZhdGlvbiB0eXBlcy5cbi8vIFRoaXMgb2JzZXJ2ZXIgY2FuIGJlIHBhc3NlZCB0byBgb2JzZXJ2ZU9iamVjdGAuXG5mdW5jdGlvbiBtYWtlT2JzZXJ2ZXIoaGFuZGxlcnMpIHtcbiAgY29uc29sZS5hc3NlcnQoaGFuZGxlcnMgJiYgdHlwZW9mIGhhbmRsZXJzID09PSAnb2JqZWN0JywgXCJBcmd1bWVudCB0byBtYWtlT2JzZXJ2ZXIgbXVzdCBiZSBoYXNoLlwiKTtcbiAgdmFyIGhhbmRsZXIgPSBhc3NpZ24oY3JlYXRlKG9ic2VydmVyUHJvdG90eXBlKSwgaGFuZGxlcnMpO1xuICB2YXIgb2JzZXJ2ZXIgPSBoYW5kbGVyLmhhbmRsZS5iaW5kKGhhbmRsZXIpO1xuICBvYnNlcnZlci5rZXlzID0gZ2V0VHlwZXNGcm9tSGFuZGxlcnMoaGFuZGxlcnMpO1xuICByZXR1cm4gb2JzZXJ2ZXI7XG59XG5cbi8vIEludm9rZSBPYmplY3Qub2JzZXJ2ZSB3aXRoIG9ubHkgdGhlIHR5cGVzIGF2YWlsYWJsZSB0byBiZSBoYW5kbGVkLlxuZnVuY3Rpb24gb2JzZXJ2ZU9iamVjdChvLCBvYnNlcnZlcikge1xuICByZXR1cm4gbyAmJiB0eXBlb2YgbyA9PT0gJ29iamVjdCcgJiYgb2JzZXJ2ZShvLCBvYnNlcnZlciwgb2JzZXJ2ZXIua2V5cyk7XG59XG5cbmZ1bmN0aW9uIG9ic2VydmVPYmplY3ROb3cobywgb2JzZXJ2ZXIpIHtcbiAgb2JzZXJ2ZU9iamVjdChvLCBvYnNlcnZlcik7XG4gIG5vdGlmeVJldHJvYWN0aXZlbHkobyk7XG4gIHJldHVybiBvO1xufVxuXG4vLyBVbm9ic2VydmUgc29tZXRoaW5nIG9ic2V2ZWQgd2l0aCBgb2JzZXJ2ZU9iamVjdGAuXG5mdW5jdGlvbiB1bm9ic2VydmVPYmplY3Qobywgb2JzZXJ2ZXIpIHtcbiAgcmV0dXJuIG8gJiYgdHlwZW9mIG8gPT09ICdvYmplY3QnICYmIHVub2JzZXJ2ZShvLCBvYnNlcnZlcik7XG59XG5cbi8vIFJldHJvYWN0aXZlbHkgbm90aWZ5ICdhZGQnIHRvIGFsbCBwcm9wZXJ0aWVzIGluIGFuIG9iamVjdC5cbmZ1bmN0aW9uIG5vdGlmeVJldHJvYWN0aXZlbHkob2JqZWN0KSB7XG4gIGlmIChvYmplY3QgJiYgdHlwZW9mIG9iamVjdCA9PT0gJ29iamVjdCcpIHtcbiAgICBjb25zdCB0eXBlID0gJ2FkZCc7XG4gICAgdmFyIG5vdGlmaWVyID0gT2JqZWN0LmdldE5vdGlmaWVyKG9iamVjdCk7XG4gICAga2V5cyhvYmplY3QpLmZvckVhY2gobmFtZSA9PiBub3RpZmllci5ub3RpZnkoe3R5cGUsIG5hbWUsIG9iamVjdH0pKTtcbiAgfVxuICByZXR1cm4gb2JqZWN0O1xufVxuXG4vLyBTZXQgdXAgYW4gb2JzZXJ2ZXIgYW5kIHRlYXIgaXQgZG93biBhZnRlciB0aGUgZmlyc3QgcmVwb3J0XG5mdW5jdGlvbiBvYnNlcnZlT25jZShvYmplY3QsIG9ic2VydmVyLCB0eXBlcykge1xuICBmdW5jdGlvbiBfb2JzZXJ2ZXIoY2hhbmdlcykge1xuICAgIG9ic2VydmVyKGNoYW5nZXMpO1xuICAgIHVub2JzZXJ2ZShvYmplY3QsIF9vYnNlcnZlcik7XG4gIH1cbiAgb2JzZXJ2ZShvYmplY3QsIF9vYnNlcnZlciwgdHlwZXMpO1xufVxuXG4vLyBLZWVwIGFuIG9iamVjdCBpbiBzeW5jIHdpdGggYW5vdGhlci5cbmZ1bmN0aW9uIG1pcnJvclByb3BlcnRpZXMoc3JjLCBkZXN0ID0ge30pIHtcbiAgZnVuY3Rpb24gc2V0KG5hbWUpIHsgZGVzdFtuYW1lXSA9IHNyY1tuYW1lXTsgfVxuICBmdW5jdGlvbiBfZGVsZXRlKG5hbWUpIHsgZGVsZXRlIGRlc3RbbmFtZV07IH1cblxuICB2YXIgaGFuZGxlcnMgPSB7IGFkZDogc2V0LCB1cGRhdGU6IHNldCwgZGVsZXRlOiBfZGVsZXRlfTtcblxuICBhc3NpZ24oZGVzdCwgc3JjKTtcbiAgb2JzZXJ2ZShzcmMsIG1ha2VPYnNlcnZlcihoYW5kbGVycykpO1xuICByZXR1cm4gZGVzdDtcbn1cblxuLy8gTWFrZSBhbiBPYnNlcnZlciBvYmplY3QsIHdoaWNoIGFsbG93cyBlYXN5IHVub2JzZXJ2aW5nIGFuZCByZXNvYnNlcnZpbmcuXG5mdW5jdGlvbiBPYnNlcnZlcihvYmplY3QsIG9ic2VydmVyLCB0eXBlcykge1xuICByZXR1cm4ge1xuICAgIG9ic2VydmUoX3R5cGVzKSB7XG4gICAgICB0eXBlcyA9IF90eXBlcyB8fCB0eXBlcztcbiAgICAgIGlmIChpc09iamVjdChvYmplY3QpKSBvYnNlcnZlKG9iamVjdCwgb2JzZXJ2ZXIsIHR5cGVzKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG4gICAgdW5vYnNlcnZlKCkge1xuICAgICAgaWYgKGlzT2JqZWN0KG9iamVjdCkpIHVub2JzZXJ2ZShvYmplY3QsIG9ic2VydmVyKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG4gICAgcmVvYnNlcnZlKF9vYmplY3QpIHtcbiAgICAgIHRoaXMudW5vYnNlcnZlKCk7XG4gICAgICBvYmplY3QgPSBfb2JqZWN0O1xuICAgICAgcmV0dXJuIHRoaXMub2JzZXJ2ZSgpO1xuICAgIH1cbiAgfTtcbn1cblxuZXhwb3J0IHtcbiAgbWFrZU9ic2VydmVyLFxuICBvYnNlcnZlT2JqZWN0LFxuICBvYnNlcnZlT2JqZWN0Tm93LFxuICB1bm9ic2VydmVPYmplY3QsXG4gIG5vdGlmeVJldHJvYWN0aXZlbHksXG4gIG9ic2VydmVPbmNlLFxuICBtaXJyb3JQcm9wZXJ0aWVzLFxuICBPYnNlcnZlclxufTtcbiIsIi8vIE9iamVjdCB1dGlsaXRpZXNcbi8vID09PT09PT09PT09PT09PVxuXG4vLyBTZXR1cC4gTm8gZGVwZW5kZW5jaWVzLCBhbmQga2VlcCBpdCB0aGF0IHdheS5cbnZhciB7a2V5cywgYXNzaWduLCBvYnNlcnZlLCB1bm9ic2VydmV9ID0gT2JqZWN0O1xuXG5mdW5jdGlvbiBpc09iamVjdChvKSB7XG4gIHJldHVybiBvICYmIHR5cGVvZiBvID09PSAnb2JqZWN0Jztcbn1cblxuLy8gR2VuZXJpYyB2ZXJzaW9uIG9mIGB2YWx1ZU9mYCB3aGljaCB3b3JrcyBmb3IgYW55dGhpbmcuXG5mdW5jdGlvbiB2YWx1ZWl6ZSh2KSB7IHJldHVybiBpc09iamVjdCh2KSA/IHYudmFsdWVPZigpIDogdjsgfVxuXG4vLyBVc2VyLWZyaWVuZGx5IHJlcHJlc2VudGF0aW9uIG9mIGFuIG9iamVjdC5cbmZ1bmN0aW9uIG9iamVjdFRvU3RyaW5nKG8pIHtcbiAgcmV0dXJuICd7JyArIGtleXMobykubWFwKGsgPT4gYCR7a306ICR7b1trXX1gKS5qb2luKCcsICcpICsgJ30nO1xufVxuXG4vLyBNYWtlIGZ1bmN0aW9ucyB0byByZXR1cm4gcHJvcGVydGllcywgaW4gdmFyaW91cyBmbGF2b3JzLlxuZnVuY3Rpb24gcHJvcEdldHRlciAgICAgICAgICh2KSB7IHJldHVybiBvID0+IG9bdl07IH1cbmZ1bmN0aW9uIHByb3BWYWx1ZUdldHRlciAgICAodikgeyByZXR1cm4gbyA9PiB2YWx1ZWl6ZShvW3ZdKTsgfVxuZnVuY3Rpb24gdGhpc1Byb3BHZXR0ZXIgICAgICh2KSB7IHJldHVybiBmdW5jdGlvbigpIHsgcmV0dXJuIHRoaXNbdl07IH07IH1cbmZ1bmN0aW9uIHRoaXNQcm9wVmFsdWVHZXR0ZXIodikgeyByZXR1cm4gZnVuY3Rpb24oKSB7IHJldHVybiB2YWx1ZWl6ZSh0aGlzW3ZdKTsgfTsgfVxuXG4vLyBBbmFsb2cgb2YgYEFycmF5I21hcGAgZm9yIG9iamVjdHMuXG5mdW5jdGlvbiBtYXBPYmplY3QobywgZm4sIGN0eHQpIHtcbiAgdmFyIHJlc3VsdCA9IHt9O1xuICBmb3IgKHZhciBrZXkgaW4gbykge1xuICAgIGlmIChvLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgIHJlc3VsdFtrZXldID0gZm4uY2FsbChjdHh0LCBvW2tleV0sIGtleSwgbyk7XG4gICAgfVxuICB9XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbi8vIE1hcCBhbiBvYmplY3QncyB2YWx1ZXMsIHJlcGxhY2luZyBleGlzdGluZyBvbmVzLlxuZnVuY3Rpb24gbWFwT2JqZWN0SW5QbGFjZShvLCBmbiwgY3R4dCkge1xuICBmb3IgKGxldCBrZXkgaW4gbykge1xuICAgIGlmIChvLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgIG9ba2V5XSA9IGZuLmNhbGwoY3R4dCwgb1trZXldLCBrZXksIG8pO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbztcbn1cblxuLy8gTWFrZSBhIGNvcHkgb2Ygc29tZXRoaW5nLlxuZnVuY3Rpb24gY29weU9mKG8pIHtcbiAgaWYgKEFycmF5LmlzQXJyYXkobykpIHJldHVybiBvLnNsaWNlKCk7XG4gIGlmIChpc09iamVjdChvKSkgcmV0dXJuIGFzc2lnbih7fSwgbyk7XG4gIHJldHVybiBvO1xufVxuXG4vLyBDb3B5IGEgc2Vjb25kIGFycmF5IG9udG8gYSBmaXJzdCBvbmUgZGVzdHJ1Y3RpdmVseS5cbmZ1bmN0aW9uIGNvcHlPbnRvQXJyYXkoYTEsIGEyKSB7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgYTIubGVuZ3RoOyBpKyspIHtcbiAgICBhMVtpXSA9IGEyW2ldO1xuICB9XG4gIGExLmxlbmd0aCA9IGEyLmxlbmd0aDtcbiAgcmV0dXJuIGExO1xufVxuXG4vLyBPdmVyd3JpdGUgYSBmaXJzdCBvYmplY3QgZW50aXJlbHkgd2l0aCBhIHNlY29uZCBvbmUuXG5mdW5jdGlvbiBjb3B5T250b09iamVjdChvMSwgbzIpIHtcbiAgYXNzaWduKG8xLCBvMik7XG4gIGtleXMobzEpXG4gICAgLmZpbHRlcihrZXkgPT4gIShrZXkgaW4gbzIpKVxuICAgIC5mb3JFYWNoKGtleSA9PiAoZGVsZXRlIG8xW2tleV0pKTtcbiAgcmV0dXJuIG8xO1xufVxuXG4vLyBDb3B5IGEgc2Vjb25kIG9iamVjdCBvciBhcnJheSBkZXN0cnVjdGl2ZWx5IG9udG8gYSBmaXJzdCBvbmUuXG5mdW5jdGlvbiBjb3B5T250byhhMSwgYTIpIHtcbiAgaWYgKEFycmF5LmlzQXJyYXkoYTEpICYmIEFycmF5LmlzQXJyYXkoYTIpKSByZXR1cm4gY29weU9udG9BcnJheSAoYTEsIGEyKTtcbiAgaWYgKGlzT2JqZWN0ICAgICAoYTEpICYmIGlzT2JqZWN0ICAgICAoYTIpKSByZXR1cm4gY29weU9udG9PYmplY3QoYTEsIGEyKTtcbiAgcmV0dXJuIChhMSA9IGEyKTtcbn1cblxuLy8gXCJJbnZlcnRcIiBhbiBvYmplY3QsIHN3YXBwaW5nIGtleXMgYW5kIHZhbHVlcy5cbmZ1bmN0aW9uIGludmVydE9iamVjdChvKSB7XG4gIHZhciByZXN1bHQgPSB7fTtcbiAgZm9yIChsZXQgcGFpciBvZiBvYmplY3RQYWlycyhvKSkge1xuICAgIGxldCBba2V5LCB2YWxdID0gcGFpcjtcbiAgICByZXN1bHRbdmFsXSA9IGtleTtcbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufVxuXG4vLyBBbmFsb2cgb2YgYEFycmF5I3JlZHVjZWAgZm9yIG9iamVjdHMuXG5mdW5jdGlvbiByZWR1Y2VPYmplY3QobywgZm4sIGluaXQpIHtcbiAgZm9yIChsZXQgcGFpciBvZiBvYmplY3RQYWlycyhvKSkge1xuICAgIGxldCBba2V5LCB2YWxdID0gcGFpcjtcbiAgICBpbml0ID0gZm4oaW5pdCwgdmFsLCBrZXksIG8pO1xuICB9XG4gIHJldHVybiBpbml0O1xufVxuXG4vLyBDcmVhdGUgYW4gb2JqZWN0IGZyb20gdHdvIGFycmF5cyBvZiBrZXlzIGFuZCB2YWx1ZXMuXG5mdW5jdGlvbiBvYmplY3RGcm9tTGlzdHMoa2V5cywgdmFscykge1xuICB2YXIgcmVzdWx0ID0ge307XG4gIGZvciAobGV0IGkgPSAwLCBsZW4gPSBrZXlzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgcmVzdWx0W2tleXNbaV1dID0gdmFsc1tpXTtcbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufVxuXG4vLyBDcmVhdGUgYW4gb2JqZWN0IGZyb20gYSBsaXN0IG9mIGBba2V5LCB2YWxdYCBwYWlycy5cbmZ1bmN0aW9uIG9iamVjdEZyb21QYWlycyhwYWlycykge1xuICB2YXIgcmVzdWx0ID0ge307XG5cbiAgZm9yIChsZXQgaSA9IDAsIGxlbiA9IHBhaXJzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgbGV0IHBhaXIgPSBwYWlyc1tpXTtcbiAgICByZXN1bHRbcGFpclswXV0gPSBwYWlyWzFdO1xuICB9XG5cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuXG4vLyBDcmVhdGUgYSB2YWx1ZS1vbmx5IHByb3BlcnR5IGRlc2NyaXB0b3JzIG9iamVjdCBmcm9tIGFuIG9iamVjdC5cbmZ1bmN0aW9uIG1ha2VQcm9wZXJ0eURlc2NyaXB0b3JzKG8pIHtcbiAgcmV0dXJuIG1hcE9iamVjdChvLCB2ID0+ICh7IHZhbHVlOiB2IH0pKTtcbn1cblxuLy8gUmV0dXJuIGFuIG9iamVjdCBhbGwgb2YgdGhlIHZhbHVlcyBvZiB3aGljaCBhcmUgZXZhbHVhdGVkLlxuZnVuY3Rpb24gdmFsdWVpemVPYmplY3QobykgeyByZXR1cm4gbWFwT2JqZWN0KG8sIHZhbHVlaXplKTsgfVxuXG4vLyBHZXQgYSB2YWx1ZSBkb3duIGluc2lkZSBhbiBvYmplY3QsIGJhc2VkIG9uIGEgXCJwYXRoXCIgKGFycmF5IG9mIHByb3BlcnR5IG5hbWVzKS5cbmZ1bmN0aW9uIHZhbHVlRnJvbVBhdGgobywgcGF0aCA9IFtdKSB7XG4gIHJldHVybiBwYXRoLnJlZHVjZSgocmV0LCBzZWcpID0+IGlzT2JqZWN0KHJldCkgJiYgcmV0W3NlZ10sIG8pO1xufVxuXG4vLyBSZXR1cm4gYW4gYXJheSBhbGwgb2YgdGhlIHZhbHVlcyBvZiB3aGljaCBhcmUgZXZhbHVhdGVkLlxuZnVuY3Rpb24gdmFsdWVBcnJheShhKSB7IHJldHVybiBhLm1hcCh2YWx1ZWl6ZSk7IH1cblxuLy8gUmV0dXJuIGFuIGFycmF5IG9mIHRoZSBvYmplY3QncyB2YWx1ZXMuXG5mdW5jdGlvbiBvYmplY3RWYWx1ZXMobykgeyByZXR1cm4ga2V5cyhvKS5tYXAoayA9PiBvW2tdKTsgfVxuXG4vLyBHZW5lcmF0b3IgZm9yIG9iamVjdCdzIGtleS92YWx1ZSBwYWlycy4gVXNhZ2U6IGBmb3IgKFtrZXksIHZhbF0gb2Ygb2JqZWN0UGFpcnMobykpYC5cbmZ1bmN0aW9uICpvYmplY3RQYWlycyhvKSB7XG4gIGZvciAodmFyIGsgaW4gbykge1xuICAgIGlmIChvLmhhc093blByb3BlcnR5KGspKSB7IHlpZWxkIFtrLCBvW2tdXTsgfVxuICB9XG59XG5cbi8vIFwiRW1wdHlcIiB0aGUgb2JqZWN0LCBvcHRpb25hbGx5IGtlZXBpbmcgc3RydWN0dXJlIG9mIHN1Ym9iamVjdHMgd2l0aCBge2tlZXA6IHRydWV9YCBvcHRpb24uXG4vLyBOdW1iZXJzIHR1cm4gdG8gemVybywgYm9vbGVhbnMgdG8gZmFsc2UsIGFycmF5cyBhcmUgZW1wdGllZCwgZXRjLlxuZnVuY3Rpb24gZW1wdHlPYmplY3Qobywge2tlZXB9KSB7XG4gIGtlZXAgPSBrZWVwIHx8IHt9O1xuICBmb3IgKGxldCBwYWlyIG9mIG9iamVjdFBhaXJzKG8pKSB7XG4gICAgbGV0IFtrLCB2XSA9IHBhaXI7XG4gICAgdmFyIGN0b3IgPSB2ICYmIHYuY29uc3RydWN0b3I7XG4gICAgaWYgKGtlZXAgJiYgY3RvciA9PT0gT2JqZWN0KSBlbXB0eU9iamVjdCh2KTtcbiAgICBlbHNlIG9ba10gPSBjdG9yICYmIGN0b3IoKTtcbiAgfVxufVxuXG4vLyBDcmVhdGUgYSBmdW5jdGlvbiB3aGljaCBjb21iaW5lcyBwcm9wZXJ0aWVzIGZyb20gdHdvIG9iamVjdHMgdXNpbmcgYSBmdW5jdGlvbi5cbi8vIElmIHRoZSBwcm9wZXJ0eSBkb2Vzbid0IGV4aXN0IGluIHRoZSBmaXJzdCBvYmplY3QsIGp1c3QgY29weS5cbmZ1bmN0aW9uIG1ha2VBc3NpZ25lcihmbikge1xuICByZXR1cm4gZnVuY3Rpb24obzEsIG8yKSB7XG4gICAgYXNzaWduKG8xLCBtYXBPYmplY3QobzIsICh2LCBrKSA9PiBvMS5oYXNPd25Qcm9wZXJ0eShrKSA/IGZuKG8xW2tdLCB2KSA6IHYpKTtcbiAgfTtcbn1cblxuLy8gQWRkIHRoZSB2YWx1ZXMgb2YgcHJvcGVydGllcyBpbiBvbmUgYXJyYXkgdG8gdGhlIHNhbWUgcHJvcGVydHkgaW4gYW5vdGhlci5cbnZhciBhc3NpZ25BZGQgPSBtYWtlQXNzaWduZXIoKGEsIGIpID0+IGEgKyBiKTtcblxuZXhwb3J0IHtcbiAgaXNPYmplY3QsXG4gIG9iamVjdFRvU3RyaW5nLFxuXG4gIHByb3BHZXR0ZXIsXG4gIHByb3BWYWx1ZUdldHRlcixcbiAgdGhpc1Byb3BHZXR0ZXIsXG4gIHRoaXNQcm9wVmFsdWVHZXR0ZXIsXG5cbiAgbWFwT2JqZWN0LFxuICBtYXBPYmplY3RJblBsYWNlLFxuXG4gIGNvcHlPZixcbiAgY29weU9udG9PYmplY3QsXG4gIGNvcHlPbnRvLFxuICBjb3B5T250b0FycmF5LFxuXG4gIGludmVydE9iamVjdCxcbiAgcmVkdWNlT2JqZWN0LFxuICBvYmplY3RGcm9tUGFpcnMsXG4gIG9iamVjdEZyb21MaXN0cyxcblxuICBtYWtlUHJvcGVydHlEZXNjcmlwdG9ycyxcbiAgdmFsdWVpemVPYmplY3QsXG4gIHZhbHVlRnJvbVBhdGgsXG4gIHZhbHVlQXJyYXksXG4gIG9iamVjdFZhbHVlcyxcbiAgdmFsdWVpemUsXG4gIGVtcHR5T2JqZWN0LFxuICBtYWtlQXNzaWduZXIsXG4gIGFzc2lnbkFkZFxufTtcbiIsIi8vIGtlZXBSZW5kZXJlZDogY3JlYXRlIGR5bmFtaWNhbGx5IHVwZGF0ZWQgRE9NIG5vZGUuXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbi8vIEJvb2trZWVwaW5nIGFuZCBpbml0aWFsaXphdGlvbi5cbmltcG9ydCBVIGZyb20gJy4vVXB3JztcblxuaW1wb3J0IHtkYXNoZXJpemV9ICAgICAgICAgICAgICAgICAgIGZyb20gJy4vU3RyJztcbmltcG9ydCB7bWFwT2JqZWN0LCB2YWx1ZWl6ZSwgdmFsdWVpemVPYmplY3R9ICAgZnJvbSAnLi9PYmonO1xuaW1wb3J0IHtvYnNlcnZlT2JqZWN0LCBtYWtlT2JzZXJ2ZXIsIG9ic2VydmVPYmplY3ROb3d9IGZyb20gJy4vT2JzJztcbmltcG9ydCBrZWVwQXNzaWduZWQgICAgICAgICAgICAgICAgICBmcm9tICcuL0Fzcyc7XG5cbnZhciB7cHVzaH0gPSBBcnJheS5wcm90b3R5cGU7XG5cbnZhciBzdWJBdHRycyA9IFsnc3R5bGUnLCAnY2xhc3MnLCAnZGF0YXNldCddO1xuZnVuY3Rpb24gaXNTdWJhdHRyKGEpIHsgcmV0dXJuIHN1YkF0dHJzLmNvbnRhaW5zKGEpOyB9XG5cbi8vIE1ha2Ugb2JzZXJ2ZXJzIGZvciBjaGlsZHJlbiwgYXR0cmlidXRlcywgYW5kIHN1YmF0dHJpYnV0ZXMuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuZnVuY3Rpb24gbWFrZUNoaWxkcmVuT2JzZXJ2ZXIoZSkge1xuICBmdW5jdGlvbiBhZGQgICAgKHYpICAgICAgICAgICAgICAgICAgIHsgZS5hcHBlbmRDaGlsZCh2KTsgfVxuICBmdW5jdGlvbiBfZGVsZXRlKHYsIGksIG8sIHtvbGRWYWx1ZX0pIHsgZS5yZW1vdmVDaGlsZChvbGRWYWx1ZSk7IH1cbiAgZnVuY3Rpb24gdXBkYXRlICh2LCBpLCBjLCB7b2xkVmFsdWV9KSB7XG4gICAgaWYgKGkgIT09ICdsZW5ndGgnKSB7IGUucmVwbGFjZUNoaWxkKHYsIG9sZFZhbHVlKTsgfVxuICB9XG4gIHJldHVybiBtYWtlT2JzZXJ2ZXIoe2FkZCwgdXBkYXRlLCBkZWxldGU6IF9kZWxldGV9KTtcbn1cblxuZnVuY3Rpb24gbWFrZUF0dHJzT2JzZXJ2ZXIoZSkge1xuICBmdW5jdGlvbiBhZGQodiwgaykgICAgIHsgZS5zZXRBdHRyaWJ1dGUoaywgdmFsdWVpemUodikpOyB9XG4gIGZ1bmN0aW9uIF9kZWxldGUodiwgaykgeyBlLnJlbW92ZUF0dHJpYnV0ZShrKTsgfVxuICByZXR1cm4gbWFrZU9ic2VydmVyKHthZGQsIHVwZGF0ZTogYWRkLCBkZWxldGU6IF9kZWxldGV9KTtcbn1cblxuZnVuY3Rpb24gbWFrZVN0eWxlT2JzZXJ2ZXIocykge1xuICBmdW5jdGlvbiBhZGQodiwgaykgICAgIHsgZWx0LnN0eWxlW2tdID0gdjsgfVxuICBmdW5jdGlvbiBfZGVsZXRlKHYsIGspIHsgcmVzdWx0LnN0eWxlW25hbWVdID0gXCJcIjsgfVxuICByZXR1cm4gbWFrZU9ic2VydmVyKHthZGQsIHVwZGF0ZTogYWRkLCBkZWxldGU6IF9kZWxldGV9KTtcbn1cblxuZnVuY3Rpb24gbWFrZURhdGFzZXRPYnNlcnZlcihlKSB7XG4gIGZ1bmN0aW9uIGFkZCh2LCBrKSAgICAgeyBlLmRhdGFzZXRba10gPSB2OyB9XG4gIGZ1bmN0aW9uIF9kZWxldGUodiwgaykgeyBkZWxldGUgZS5kYXRhc2V0W2tdOyB9XG4gIHJldHVybiBtYWtlT2JzZXJ2ZXIoe2FkZCwgY2hhbmdlOiBhZGQsIGRlbGV0ZTogX2RlbGV0ZX0pO1xufVxuXG5mdW5jdGlvbiBtYWtlQ2xhc3NPYnNlcnZlcihlKSB7XG4gIGZ1bmN0aW9uIGFkZCh2LCBrKSAgICAgeyBlLmNsYXNzTGlzdC50b2dnbGUoZGFzaGVyaXplKGspLCB2KTsgfVxuICBmdW5jdGlvbiBfZGVsZXRlKHYsIGspIHsgZS5jbGFzc0xpc3QucmVtb3ZlKGRhc2hlcml6ZShrKSk7IH1cbiAgcmV0dXJuIG1ha2VPYnNlcnZlcih7YWRkLCBjaGFuZ2U6IGFkZCwgZGVsZXRlOiBfZGVsZXRlfSk7XG59XG5cbmZ1bmN0aW9uIF9rZWVwUmVuZGVyZWQodGFnTmFtZSwgcGFyYW1zKSB7XG5cbiAgLy8gSGFuZGxlIGNoYW5nZXMgdG8gcGFyYW1ldGVycy5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgZnVuY3Rpb24gbWFrZVBhcmFtc09ic2VydmVyKCkge1xuICAgIFxuICAgIC8vIE9ic2VydmUgYW5kIHVub2JzZXJ2ZSB0aGUgY2hpbGRyZW4uXG4gICAgZnVuY3Rpb24gX29ic2VydmVDaGlsZHJlbiAgKHYpIHsgb2JzZXJ2ZU9iamVjdE5vdyh2LCBjaGlsZHJlbk9ic2VydmVyKTsgfVxuICAgIGZ1bmN0aW9uIF91bm9ic2VydmVDaGlsZHJlbih2KSB7IHVub2JzZXJ2ZU9iamVjdCAodiwgY2hpbGRyZW5PYnNlcnZlcik7IH1cbiAgICBcbiAgICBmdW5jdGlvbiBfb2JzZXJ2ZUF0dHJzKHYpIHtcbiAgICAgIG9ic2VydmVPYmplY3ROb3codiwgYXR0cnNPYnNlcnZlcik7XG4gICAgICBzdWJBdHRycy5mb3JFYWNoKGEgPT4gb2JzZXJ2ZU9iamVjdE5vdyh2W2FdLCBzdWJBdHRyT2JzZXJ2ZXJzW2FdKSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIF91bm9ic2VydmVBdHRycyh2KSB7XG4gICAgICB1bm9ic2VydmVPYmplY3QodiwgQXR0cmlidXRlc09ic2VydmVyKTtcbiAgICAgIHN1YkF0dHIuZm9yRWFjaChhID0+IHVub2JzZXJ2ZU9iamVjdCh2W2FdLCBzdWJBdHRyT2JzZXJ2ZXJzW2FdKSk7XG4gICAgfVxuXG4gICAgLy8gV2hlbiB3ZSBnZXQgYSBuZXcgcGFyYW1ldGVyLCBzZXQgdXAgb2JzZXJ2ZXJzLlxuICAgIGZ1bmN0aW9uIGFkZCh2LCBpKSB7XG4gICAgICBzd2l0Y2ggKGkpIHtcbiAgICAgIGNhc2UgJ2NoaWxkcmVuJzpcbiAgICAgICAgX29ic2VydmVDaGlsZHJlbih2KTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdhdHRycyc6ICAgIF9vYnNlcnZlQXR0cnMgICAodik7IGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvLyBXaGVuIHBhcmFtZXRlcnMgY2hhbmdlLCB0ZWFyIGRvd24gYW5kIHJlc2V0dXAgb2JzZXJ2ZXJzLlxuICAgIGZ1bmN0aW9uIHVwZGF0ZSh2LCBpLCBwYXJhbXMsIHtvbGRWYWx1ZX0pIHtcbiAgICAgIHN3aXRjaCAoaSkge1xuICAgICAgY2FzZSAnY2hpbGRyZW4nOiBfdW5vYnNlcnZlQ2hpbGRyZW4ob2xkVmFsdWUpOyBfb2JzZXJ2ZUNoaWxkcmVuKHYpOyBicmVhaztcbiAgICAgIGNhc2UgJ2F0dHJzJzogICAgX3Vub2JzZXJ2ZUF0dHJzICAgKG9sZFZhbHVlKTsgX29ic2VydmVBdHRycyAgICh2KTsgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIHJldHVybiBtYWtlT2JzZXJ2ZXIoe2FkZCwgdXBkYXRlfSk7XG4gIH1cblxuICB2YXIgcmVzdWx0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCh0YWdOYW1lKTtcblxuICB2YXIgc3ViQXR0ck9ic2VydmVycyA9IHtcbiAgICBjbGFzczogICBtYWtlQ2xhc3NPYnNlcnZlcihyZXN1bHQpLFxuICAgIGRhdGFzZXQ6IG1ha2VEYXRhc2V0T2JzZXJ2ZXIocmVzdWx0KSxcbiAgICBzdHlsZTogICBtYWtlU3R5bGVPYnNlcnZlcihyZXN1bHQpXG4gIH07XG4gIHZhciBhdHRyc09ic2VydmVyID0gbWFrZUF0dHJzT2JzZXJ2ZXIocmVzdWx0KTtcbiAgdmFyIGNoaWxkcmVuT2JzZXJ2ZXIgPSBtYWtlQ2hpbGRyZW5PYnNlcnZlcihyZXN1bHQpO1xuICB2YXIgcGFyYW1zT2JzZXJ2ZXIgPSBtYWtlUGFyYW1zT2JzZXJ2ZXIoKTsgIFxuXG4gIC8vbWFwT2JqZWN0KHBhcmFtcywgKHYsIGspID0+IHVwd2FyZCh2LCB2diA9PiBwYXJhbXNba10gPSB2dikpO1xuICBwYXJhbXMgPSB2YWx1ZWl6ZU9iamVjdChwYXJhbXMpO1xuICBwYXJhbXMuYXR0cnMgPSBrZWVwQXNzaWduZWQocGFyYW1zLmF0dHJzLCB7c3R5bGU6IHt9LCBjbGFzczoge30sIGRhdGFzZXQ6IHt9fSwgcHVzaCk7XG4gIHBhcmFtcy5jaGlsZHJlbiA9IHBhcmFtcy5jaGlsZHJlbiB8fCBbXTtcbiAgb2JzZXJ2ZU9iamVjdE5vdyhwYXJhbXMsIHBhcmFtc09ic2VydmVyKTtcblxuICByZXR1cm4gcmVzdWx0O1xufVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbih0YWdOYW1lLCBjaGlsZHJlbiA9IFtdLCBhdHRycyA9IHt9KSB7XG4gIHJldHVybiBfa2VlcFJlbmRlcmVkKHRhZ05hbWUsIHthdHRycywgY2hpbGRyZW59KTtcbn1cbiIsIi8vIFVwU29ydDogdXB3YXJkLWF3YXJlIHZlcnNpb24gb2YgQXJyYXkjc29ydFxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbmltcG9ydCB7bWFrZVVwd2FyZGFibGVGdW5jdGlvbn0gZnJvbSAnLi9GdW4nO1xuaW1wb3J0IG1ha2VVcHdhcmRhYmxlT2JqZWN0IGZyb20gJy4vT2JqJztcbmltcG9ydCB7Y29weU9udG9BcnJheX0gZnJvbSAnLi9PdXQnO1xuaW1wb3J0IHttYWtlU29ydGZ1bmN9IGZyb20gJy4vVXRsJztcblxuZXhwb3J0IGRlZmF1bHQgbWFrZVVwd2FyZGFibGVGdW5jdGlvbihmdW5jdGlvbiAqVXBTb3J0KHJ1bikge1xuICB2YXIgciA9IFtdO1xuXG4gIHdoaWxlICh0cnVlKSB7XG4gICAgdmFyIFthLCBmLCBkZXNjXSA9IHlpZWxkIHI7XG4gICAgY29weU9udG9BcnJheShyLCBhLnNsaWNlKCkuc29ydChtYWtlU29ydGZ1bmMoZiwgZGVzYykpKTtcbiAgfVxufSk7XG4iLCIvLyBTdHJpbmcgdXRpbGl0aWVzXG4vLyAtLS0tLS0tLS0tLS0tLS0tXG5cbmltcG9ydCB7dXB3YXJkQ29uZmlnfSBmcm9tICcuL0NmZyc7XG5cbi8vIGBteS1jbGFzc2AgPT4gYG15Q2xhc3NgXG5mdW5jdGlvbiBjYW1lbGl6ZShzdHIpIHtcbiAgcmV0dXJuIHN0ci5yZXBsYWNlKFxuICAgICAgL1stX10rKFthLXpdKS9nLFxuICAgIChfLCBsZXR0ZXIpID0+IGxldHRlci50b1VwcGVyQ2FzZSgpKTtcbn1cblxuLy8gYG15Q2xhc3NgID0+IGBteS1jbGFzc2BcbmZ1bmN0aW9uIGRhc2hlcml6ZShzdHIpIHtcbiAgcmV0dXJuIHN0ci5yZXBsYWNlKFxuICAgICAgLyhbYS16XSkoW0EtWl0pL2csXG4gICAgKF8sIGxldDEsIGxldDIpID0+IGAke2xldDF9LSR7bGV0Mi50b0xvd2VyQ2FzZSgpfWBcbiAgKTtcbn1cblxuaWYgKHVwd2FyZENvbmZpZy5NT0RJRllfQlVJTFRJTl9QUk9UT1RZUEUpIHtcbiAgU3RyaW5nLnByb3RvdHlwZS5jYW1lbGl6ZSA9ICBmdW5jdGlvbigpIHsgcmV0dXJuIGNhbWVsaXplICh0aGlzKTsgfTtcbiAgU3RyaW5nLnByb3RvdHlwZS5kYXNoZXJpemUgPSBmdW5jdGlvbigpIHsgcmV0dXJuIGRhc2hlcml6ZSh0aGlzKTsgfTtcbn1cblxuZXhwb3J0IHtcbiAgY2FtZWxpemUsXG4gIGRhc2hlcml6ZVxufTtcbiIsIi8vIFRhZyBzaG9ydGhhbmRzXG4vLyA9PT09PT09PT09PT09PVxuXG5pbXBvcnQgRSBmcm9tICcuL0VsdCc7XG5pbXBvcnQgVCBmcm9tICcuL1R4dCc7XG5cbmZ1bmN0aW9uIHRleHQodGFnKSB7XG4gIHJldHVybiBmdW5jdGlvbih0KSB7XG4gICAgcmV0dXJuIEUodGFnKSAuIGhhcyAoW1QodCldKTtcbiAgfTtcbn1cblxudmFyIFAgPSB0ZXh0KCdwJyk7XG5cbnZhciBIMSA9IHRleHQoJ2gxJyk7XG52YXIgSDIgPSB0ZXh0KCdoMicpO1xudmFyIEgzID0gdGV4dCgnaDMnKTtcbnZhciBINCA9IHRleHQoJ2g0Jyk7XG52YXIgSDUgPSB0ZXh0KCdoNScpO1xudmFyIEg2ID0gdGV4dCgnaDYnKTtcblxudmFyIEIgPSB0ZXh0KCdiJyk7XG52YXIgSSA9IHRleHQoJ2knKTtcblxudmFyIExJID0gdGV4dCgnbGknKTtcblxudmFyIExBQkVMID0gdGV4dCgnbGFiZWwnKTtcblxuZnVuY3Rpb24gQSh0LCBocmVmKSB7XG4gIHJldHVybiBFKCdhJykgLiBoYXMoVCh0KSkgLiBpcyAoeyBocmVmIH0pO1xufVxuXG5mdW5jdGlvbiBCVVRUT04odCwgY2xpY2spIHtcbiAgcmV0dXJuIEUoJ2J1dHRvbicpIC4gaGFzKFQodCkpIC4gZG9lcyh7IGNsaWNrIH0pO1xufVxuXG5leHBvcnQge1AsIEgxLCBIMiwgSDMsIEg0LCBINSwgSDYsIEIsIEksIExJLCBMQUJFTCwgQSwgQlVUVE9OfTtcbiIsIi8vIFN0cmluZyB0ZW1wbGF0ZXNcbi8vIC0tLS0tLS0tLS0tLS0tLS1cblxuaW1wb3J0IEMgZnJvbSAnLi9GdW4nO1xuaW1wb3J0IHtpbnRlcmxlYXZlfSBmcm9tICcuL1V0bCc7XG5cbi8vIFV0aWxpdHkgcm91dGluZSB0byBjb21wb3NlIGEgc3RyaW5nIGJ5IGludGVyc3BlcnNpbmcgbGl0ZXJhbHMgYW5kIHZhbHVlcy5cbmZ1bmN0aW9uIGNvbXBvc2Uoc3RyaW5ncywgLi4udmFsdWVzKSB7XG4gIHJldHVybiBzdHJpbmdzICYmIHZhbHVlcyAmJiBpbnRlcmxlYXZlKHN0cmluZ3MsIHZhbHVlcykuam9pbignJyk7XG59XG5cbi8vIFRlbXBsYXRlIGhlbHBlciB3aGljaCBoYW5kbGVzIEhUTUw7IHJldHVybiBhIGRvY3VtZW50IGZyYWdtZW50LlxuLy8gRXhhbXBsZTpcbi8vIGBgYFxuLy8gZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChIVE1MYDxzcGFuPiR7Zm9vfTwvc3Bhbj48c3Bhbj4ke2Jhcn08L3NwYW4+YCk7XG4vLyBgYGBcbi8qIE5FRURTIFdPUksgKi9cbmZ1bmN0aW9uIEhUTUwoc3RyaW5ncywgLi4udmFsdWVzKSB7XG4gIHZhciBkdW1teSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICB2YXIgZnJhZ21lbnQgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XG4gIGR1bW15LmlubmVySFRNTCA9IGNvbXBvc2Uoc3RyaW5ncywgLi4udmFsdWVzKTtcbiAgZm9yRWFjaC5jYWxsKGR1bW15LmNoaWxkTm9kZXMsIGFwcGVuZENoaWxkLCBmcmFnbWVudCk7XG4gIHJldHVybiBmcmFnbWVudDtcbn1cblxuLy8gV2lsbCBvZnRlbiBiZSBpbXBvcnRlZC9yZS1leHBvcnRlZCBhcyBgdXB3YXJkYWJsZVRlbXBsYXRlYCwgb3IgYEZgLlxuLy8gVXNhZ2U6XG4vLyBgYGBcbi8vIFQoRmBUaGVyZSBhcmUgJHttb2RlbC5jb3VudH0gaXRlbXMuYCkpXG4vLyBgYGBcbmV4cG9ydCBkZWZhdWx0IEMoY29tcG9zZSwgXCJcIik7XG4iLCIvLyBUZXN0IGhhcm5lc3Nlc1xuLy8gPT09PT09PT09PT09PT1cblxuLy8gQSB0ZXN0IGlzIGRlZmluZWQgd2l0aCAndGVzdCcsIHdoaWNoIHJldHVybnMgYSBmdW5jdGlvbi5cbi8vIEEgZ3JvdXAgb2YgdGVzdHMgaXMgZGVmaW5lZCB3aXRoIGB0ZXN0R3JvdXBgLCB3aGljaCBhbHNvIHJldHVybnMgYSBmdW5jdGlvbi5cbi8vIEVpdGhlciBvbmUgaXMgZXhlY3V0ZWQgYnkgY2FsbGluZyBpdCB3aXRoIGEgXCJyZXBvcnRlclwiLlxuLy8gSFRNTCBhbmQgY29uc29sZSByZXBvcnRlcnMgYXJlIHByb3ZpZGVkLlxuXG4vLyBTZXR1cC5cbmltcG9ydCB7d2FpdH0gICAgICAgICAgICAgICAgIGZyb20gJy4vQXN5JztcbmltcG9ydCBFICAgICAgICAgICAgICAgICAgICAgIGZyb20gJy4vRWx0JztcbmltcG9ydCB7cGFyc2VCb2R5fSAgICAgICAgICAgIGZyb20gJy4vSWZ5JztcbmltcG9ydCBNICAgICAgICAgICAgICAgICAgICAgIGZyb20gJy4vTWFwJztcbmltcG9ydCB7YXNzaWduQWRkLCBtYXBPYmplY3R9IGZyb20gJy4vT3V0JztcbmltcG9ydCBSICAgICAgICAgICAgICAgICAgICAgIGZyb20gJy4vUmVuJztcbmltcG9ydCBUICAgICAgICAgICAgICAgICAgICAgIGZyb20gJy4vVHh0JztcbmltcG9ydCBVICAgICAgICAgICAgICAgICAgICAgIGZyb20gJy4vVXB3JztcbmltcG9ydCB7bWFrZVN0b3B3YXRjaCwgc3VtfSAgIGZyb20gJy4vVXRsJztcblxuXG52YXIge2Fzc2lnbiwgY3JlYXRlLCBrZXlzfSA9IE9iamVjdDtcblxuXG4vLyBSZXBvcnRlcnNcbi8vIC0tLS0tLS0tLVxuXG52YXIgc3RhdHVzSW5mbyA9IHtcbiAgcGFzczogeyBjb2xvcjogJ2dyZWVuJywgIG1hcms6ICfinJMnfSxcbiAgZmFpbDogeyBjb2xvcjogJ3JlZCcsICAgIG1hcms6ICfinJcnfSxcbiAgc2tpcDogeyBjb2xvcjogJ29yYW5nZScsIG1hcms6ICfinZYnfVxufTtcblxuLy8gQ1NTIHJ1bGVzIGZvciBIVE1MIG91dHB1dC4gU3RpY2sgdGhlc2Ugd2hlcmUgeW91IHdpbGwuXG52YXIgdGVzdENzc1J1bGVzID0gW107XG5rZXlzKHN0YXR1c0luZm8pLmZvckVhY2goXG4gIHN0YXR1cyA9PiB0ZXN0Q3NzUnVsZXMucHVzaChcbiAgICBbJy4nICsgc3RhdHVzLCB7Y29sb3I6IHN0YXR1c0luZm9bc3RhdHVzXS5jb2xvcn1dLFxuICAgIFsnLicgKyBzdGF0dXMgKyBcIjo6YmVmb3JlXCIsIHsgY29udGVudDogYFwiJHtzdGF0dXNJbmZvW3N0YXR1c10ubWFya30gXCJgIH1dXG4gIClcbik7XG5cbnZhciBzdGF0dXNlcyA9IGtleXMoc3RhdHVzSW5mbyk7XG5cbmZ1bmN0aW9uIG1ha2VDb3VudHMoY291bnRzKSB7XG4gIHJldHVybiBrZXlzKGNvdW50cylcbiAgICAuZmlsdGVyKHN0YXR1cyA9PiBjb3VudHNbc3RhdHVzXSlcbiAgICAubWFwICAgKHN0YXR1cyA9PiBgJHtjb3VudHNbc3RhdHVzXX0gJHtzdGF0dXN9YCkuam9pbignLCAnKTtcbn1cblxuLy8gQ29uc29sZSByZXBvcnRlciwgd2hpY2ggcmVwb3J0cyByZXN1bHRzIG9uIHRoZSBjb25zb2xlLlxuZnVuY3Rpb24gY29uc29sZVJlcG9ydGVyKHJlcG9ydHMsIG9wdGlvbnMgPSB7fSkge1xuICB2YXIgaGlkZSA9IG9wdGlvbnMuaGlkZSB8fCB7fTtcbiAgKGZ1bmN0aW9uIF9jb25zb2xlUmVwb3J0ZXIocmVwb3J0cykge1xuICAgIHJlcG9ydHMuZm9yRWFjaChcbiAgICAgICh7Y2hpbGRyZW4sIGRlc2MsIHN0YXR1cywgY291bnRzLCB0aW1lLCBjb2RlLCBlcnJvcn0pID0+IHtcbiAgICAgICAgbGV0IGNvdW50U3RyID0gbWFrZUNvdW50cyhjb3VudHMpO1xuICAgICAgICBsZXQgY29sb3IgICAgPSBzdGF0dXNJbmZvW3N0YXR1c10uY29sb3I7XG4gICAgICAgIGxldCBjb2xvclN0ciA9IGBjb2xvcjogJHtjb2xvcn1gO1xuICAgICAgICBpZiAoY2hpbGRyZW4pIHtcbiAgICAgICAgICBsZXQgbXNnID0gZGVzYztcbiAgICAgICAgICBsZXQgY29sbGFwc2UgPSBoaWRlLmNoaWxkcmVuIHx8IGhpZGUucGFzc2VkICYmIHN0YXR1cyA9PT0gJ3Bhc3MnO1xuICAgICAgICAgIGlmICghaGlkZS5jb3VudHMpIHsgbXNnID0gYCR7bXNnfSAoJHtjb3VudFN0cn0pYDsgfVxuICAgICAgICAgIGNvbnNvbGVbY29sbGFwc2UgPyAnZ3JvdXBDb2xsYXBzZWQnIDogJ2dyb3VwJ10oJyVjJyArIG1zZywgY29sb3JTdHIpO1xuICAgICAgICAgIF9jb25zb2xlUmVwb3J0ZXIoY2hpbGRyZW4pO1xuICAgICAgICAgIGNvbnNvbGUuZ3JvdXBFbmQoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZiAoZXJyb3IpIGNvbnNvbGUubG9nKCclYyAlcyAoJU8pJywgY29sb3JTdHIsIGRlc2MsIGVycm9yKTtcbiAgICAgICAgICBlbHNlIGNvbnNvbGUubG9nKCclYyAlcycsIGNvbG9yU3RyLCBkZXNjKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICk7XG4gIH0pKHJlcG9ydHMpO1xufVxuXG4vLyBIVE1MIHJlcG9ydGVyOyByZXR1cm5zIGFuIEFycmF5IG9mIERPTSBub2Rlcy5cbmZ1bmN0aW9uIGh0bWxSZXBvcnRlcihyZXBvcnRzLCBvcHRpb25zID0ge30pIHtcbiAgdmFyIHtoaWRlfSA9IG9wdGlvbnM7XG4gIGhpZGUgPSBoaWRlIHx8IHt9O1xuXG4gIGZ1bmN0aW9uIGh0bWxSZXBvcnRlck9uZSh7Y2hpbGRyZW4sIGRlc2MsIHN0YXR1cywgY291bnRzLCB0aW1lLCBjb2RlfSkge1xuICAgIHZhciB0ZXh0ID0gVChkZXNjKTtcbiAgICB2YXIgYXR0cnMgPSB7Y2xhc3M6IHtbc3RhdHVzXTogdHJ1ZX19O1xuICAgIGlmIChjaGlsZHJlbikge1xuICAgICAgcmV0dXJuIEUoJ2RldGFpbHMnKSAuXG4gICAgICAgIGhhcyhbXG4gICAgICAgICAgRSgnc3VtbWFyeScpIC4gaGFzKFt0ZXh0LCAhaGlkZS5jb3VudHMgJiYgVChgICgke21ha2VDb3VudHMoY291bnRzKX0pYCldKSAuIGlzKGF0dHJzKSxcbiAgICAgICAgICBFKCdkaXYnKSAuIGhhcyhodG1sUmVwb3J0ZXIoY2hpbGRyZW4sIG9wdGlvbnMpKVxuICAgICAgICBdKSAuXG4gICAgICAgIGlzKGhpZGUuY2hpbGRyZW4gPyB7fSA6IHtvcGVuOiB0cnVlfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBFKCdkaXYnKSAuIGhhcyh0ZXh0KSAuIGlzKGF0dHJzKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gTShyZXBvcnRzLCBodG1sUmVwb3J0ZXJPbmUpO1xufVxuXG4vLyBUZXN0IGNyZWF0b3JzXG4vLyAtLS0tLS0tLS0tLS0tXG5cbi8vIFRvIHNraXAgYSB0ZXN0LCBvciB0ZXN0IGdyb3VwLCBvciB1bnNraXAgaXQsIGNhbGwgdGhlc2Ugb24gaXQsXG4vLyBvciBjaGFpbiB3aXRoIGAuc2tpcCgpYCBhbmQgYC51bnNraXAoKWAuXG5mdW5jdGlvbiBza2lwICAodGVzdCwgcyA9IHRydWUpIHsgdGVzdC5fc2tpcCAgID0gczsgcmV0dXJuIHRlc3Q7IH1cbmZ1bmN0aW9uIHVuc2tpcCh0ZXN0LCBzID0gdHJ1ZSkgeyB0ZXN0Ll91bnNraXAgPSBzOyByZXR1cm4gdGVzdDsgfVxuXG4vLyBSZXR1cm4gYSBmdW5jdGlvbiB0byBydW4gYSBncm91cCBvZiB0ZXN0cy5cbmZ1bmN0aW9uIHRlc3RHcm91cChkZXNjLCB0ZXN0cyA9IFtdLCBvcHRpb25zID0ge30pIHtcblxuICBhc3luYyBmdW5jdGlvbiBfdGVzdEdyb3VwKHJlcG9ydGVyLCBza2lwcGluZykge1xuICAgIHZhciBjb3VudHMgPSB7ZmFpbDogMCwgcGFzczogMCwgc2tpcDogMH07XG4gICAgdmFyIGNoaWxkcmVuID0gW107XG4gICAgY29uc3QgdGltZSA9IDA7XG4gICAgdmFyIGdyb3VwID0ge2Rlc2MsIGNoaWxkcmVuOiBVKGNoaWxkcmVuKSwgY291bnRzLCB0aW1lLCBzdGF0dXM6ICdza2lwJ307XG5cbiAgICAvLyBSdW4gZWFjaCB0ZXN0IGluIHRoZSBncm91cC5cbiAgICBmb3IgKHZhciB0IG9mIHRlc3RzKSB7XG4gICAgICBhd2FpdCB0KGNoaWxkcmVuLCAhdC5fdW5za2lwICYmICh0Ll9za2lwIHx8IHNraXBwaW5nKSk7XG4gICAgICBpZiAob3B0aW9ucy5wYXVzZSkgeyBhd2FpdCB3YWl0KG9wdGlvbnMucGF1c2UpOyB9XG4gICAgfVxuXG4gICAgY2hpbGRyZW4uZm9yRWFjaChnID0+IGFzc2lnbkFkZChjb3VudHMsIGcuY291bnRzKSk7XG4gICAgbGV0IGFsbFNraXAgPSBjb3VudHMuc2tpcCAmJiAha2V5cyhjb3VudHMpLnNvbWUoayA9PiBrICE9PSAnc2tpcCcgJiYgY291bnRzW2tdKTtcbiAgICBncm91cC5zdGF0dXMgPSBhbGxTa2lwID8gJ3NraXAnIDogY291bnRzLmZhaWwgPyAnZmFpbCcgOiAncGFzcyc7XG4gICAgZ3JvdXAudGltZSA9IHN1bShjaGlsZHJlbi5tYXAoYyA9PiBjLnRpbWUpKTtcbiAgICByZXBvcnRlci5wdXNoKGdyb3VwKTtcbiAgfVxuXG5cbiAgLy8gQWxsb3cgc2tpcHBpbmcvdW5za2lwcGluZyBieSBjaGFpbmluZzogYHRlc3RHcm91cCguLi4pLnNraXAoKWAuXG4gIF90ZXN0R3JvdXAuc2tpcCAgID0gZnVuY3Rpb24ocykgeyByZXR1cm4gc2tpcCAgKHRoaXMsIHMpOyB9O1xuICBfdGVzdEdyb3VwLnVuc2tpcCA9IGZ1bmN0aW9uKHMpIHsgcmV0dXJuIHVuc2tpcCh0aGlzLCBzKTsgfTtcbiAgX3Rlc3RHcm91cC5wdXNoICAgPSBmdW5jdGlvbiguLi50KSB7IHRlc3RzLnB1c2goLi4udCk7IHJldHVybiB0aGlzOyB9O1xuXG4gIHJldHVybiBfdGVzdEdyb3VwO1xufVxuXG4vLyBSZXR1cm4gYSBmdW5jdGlvbiB0byBydW4gYSBzaW5nbGUgdGVzdC5cbmZ1bmN0aW9uIHRlc3QoZGVzYywgZm4sIG9wdGlvbnMgPSB7fSkge1xuICB2YXIgc3RhdHVzLCBtc2csIHRpbWU7XG4gIHZhciBjb2RlID0gcGFyc2VCb2R5KGZuKTtcbiAgdmFyIHN0b3B3YXRjaCA9IG1ha2VTdG9wd2F0Y2goKTtcblxuICBmdW5jdGlvbiBfdGVzdChyZXBvcnRlciwgc2tpcHBpbmcpIHtcbiAgICB2YXIgY291bnRzID0ge2ZhaWw6IDAsIHNraXA6IDAsIHBhc3M6IDB9O1xuICAgIHZhciB0aW1lID0gMDtcbiAgICB2YXIgc3RhdHVzID0gJ3NraXAnO1xuICAgIHZhciByZXN1bHQgPSB7ZGVzYywgY291bnRzLCB0aW1lLCBjb2RlLCBzdGF0dXN9O1xuXG4gICAgaWYgKHNraXBwaW5nKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZVxuICAgICAgICAucmVzb2x2ZSgpXG4gICAgICAgIC50aGVuKF8gPT4ge1xuICAgICAgICAgIGNvdW50cy5za2lwKys7XG4gICAgICAgICAgcmVwb3J0ZXIucHVzaChyZXN1bHQpO1xuICAgICAgICB9KVxuICAgICAgO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gUHJvbWlzZVxuICAgICAgICAucmVzb2x2ZSgpXG4gICAgICAgIC50aGVuICAoc3RvcHdhdGNoLnN0YXJ0KVxuICAgICAgICAudGhlbiAgKF8gPT4gZm4oY2hhaSkpXG4gICAgICAgIC50aGVuICAoXG4gICAgICAgICAgXyA9PiBzdGF0dXMgPSAncGFzcycsXG4gICAgICAgICAgZSA9PiB7XG4gICAgICAgICAgICBzdGF0dXMgPSAnZmFpbCc7XG4gICAgICAgICAgICByZXN1bHQuZXJyb3IgPSBlO1xuICAgICAgICAgIH1cbiAgICAgICAgKVxuICAgICAgICAudGhlbiAgKF8gPT4ge1xuICAgICAgICAgIHN0b3B3YXRjaC5zdG9wKCk7XG4gICAgICAgICAgcmVzdWx0LnRpbWUgPSBzdG9wd2F0Y2gudGltZTtcbiAgICAgICAgICBjb3VudHNbc3RhdHVzXSsrO1xuICAgICAgICAgIHJlc3VsdC5zdGF0dXMgPSBzdGF0dXM7XG4gICAgICAgICAgcmVwb3J0ZXIucHVzaChyZXN1bHQpO1xuICAgICAgICB9KVxuICAgICAgO1xuICAgIH1cbiAgfVxuXG4gIC8vIEFsbG93IHNraXBwaW5nL3Vuc2tpcHBpbmcgYnkgY2hhaW5pbmc6IGB0ZXN0KC4uLikuc2tpcCgpYC5cbiAgX3Rlc3Quc2tpcCAgID0gZnVuY3Rpb24ocykgeyByZXR1cm4gc2tpcCAgKHRoaXMsIHMpOyB9O1xuICBfdGVzdC51bnNraXAgPSBmdW5jdGlvbihzKSB7IHJldHVybiB1bnNraXAodGhpcywgcyk7IH07XG4gIHJldHVybiBfdGVzdDtcbn1cblxuLy8gUnVuIHRlc3RzLCByZXR1cm5pbmcgYSBwcm9taXNlIHdpdGggdGhlIHJlc3VsdHMuXG5mdW5jdGlvbiBydW5UZXN0cyh0ZXN0cywgb3B0aW9ucyA9IHt9LCBza2lwcGluZyA9IGZhbHNlKSB7XG4gIHZhciByZXN1bHQgPSBbXTtcbiAgcmV0dXJuIHRlc3RzKHJlc3VsdCwgc2tpcHBpbmcpIC4gdGhlbigoKSA9PiByZXN1bHQpO1xufVxuXG4vLyBFeHBvcnRzXG4vLyAtLS0tLS0tXG5leHBvcnQge1xuICAvLyBSZXBvcnRlcnMuXG4gIGNvbnNvbGVSZXBvcnRlcixcbiAgaHRtbFJlcG9ydGVyLFxuXG4gIC8vIFRlc3QgY3JlYXRvcnMuXG4gIHRlc3QsXG4gIHRlc3RHcm91cCxcbiAgc2tpcCxcbiAgdW5za2lwLFxuXG4gIC8vIENTUyBydWxlc1xuICB0ZXN0Q3NzUnVsZXMsXG5cbiAgLy8gcnVuIHRlc3RzXG4gIHJ1blRlc3RzXG59O1xuIiwiLy8gQ3JlYXRlIHRleHQgbm9kZSAoVClcbi8vID09PT09PT09PT09PT09PT09PT09XG5cbi8vIEJvb2trZWVwaW5nIGFuZCBpbml0aWFsaXphdGlvbi5cbmltcG9ydCB7bWFrZVVwd2FyZGFibGVGdW5jdGlvbn0gZnJvbSAnLi9GdW4nO1xuXG5leHBvcnQgZGVmYXVsdCBtYWtlVXB3YXJkYWJsZUZ1bmN0aW9uKGZ1bmN0aW9uICp1cFRleHQoKSB7XG4gIHZhciBub2RlID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoXCJcIik7XG4gIHdoaWxlICh0cnVlKSB7XG4gICAgbGV0IFt0ZXh0XSA9IHlpZWxkIG5vZGU7XG4gICAgbm9kZS5ub2RlVmFsdWUgPSB0ZXh0O1xuICB9XG59KTtcblxuLy8gRXh0ZW5kIFN0cmluZyBwcm90b3R5cGVcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIEFsbG93IHRoZSBTdHJpbmcgcHJvdG90eXBlIG1ldGhvZHMgdG8gYmUgYXBwbGllZCB0byBUZXh0IG5vZGVzLlxuXG4vLyBUaGVzZSBhcmUgbWV0aG9kcyB0aGF0IG92ZXJ3cml0ZSB0aGUgbm9kZSB2YWx1ZS5cblsnY29uY2F0JywgJ3JlcGxhY2UnLCAnc2xpY2UnLCAnc3Vic3RyJywgJ3N1YnN0cmluZycsICd0b1VwcGVyQ2FzZScsICd0b0xvd2VyQ2FzZScsICd0b0xvY2FsZVVwcGVyQ2FzZScsICd0b0xvY2FsZUxvd2VyQ2FzZScsICd0cmltJywgJ3RyaW1MZWZ0JywgJ3RyaW1SaWdodCcsICdyZXZlc2UnXVxuICAuZm9yRWFjaChtZXRob2QgPT4gVGV4dC5wcm90b3R5cGVbbWV0aG9kXSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiAodGhpcy5ub2RlVmFsdWUgPSBTdHJpbmcucHJvdG90eXBlW21ldGhvZF0uYXBwbHkodGhpcy5ub2RlVmFsdWUsIGFyZ3VtZW50cykpO1xuICB9KVxuO1xuXG4vLyBUaGVzZSBhcmUgbWV0aG9kcyB0aGF0IGRvIG5vdCBvdmVyd3JpdGUgdGhlIG5vZGUgdmFsdWUuXG5bJ2NoYXJBdCcsICdjaGFyQ29kZUF0JywgJ2luZGV4T2YnLCAnbGFzdEluZGV4T2YnLCAnbWF0Y2gnLCAnc2VhcmNoJywgJ3NwbGl0J11cbiAgLmZvckVhY2gobWV0aG9kID0+IFRleHQucHJvdG90eXBlW21ldGhvZF0gPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gU3RyaW5nLnByb3RvdHlwZVttZXRob2RdLmFwcGx5KHRoaXMubm9kZVZhbHVlLCBhcmd1bWVudHMpO1xuICB9KVxuO1xuIiwiLy8gVXB3YXJkYWJsZVxuLy8gPT09PT09PT09PVxuXG4vLyBUaGUgKip1cHdhcmRhYmxlKiogaXMgdGhlIGtleSBjb25jZXB0IGluIHRoZSB1cHdhcmQgbGlicmFyeS5cbi8vIFVwd2FyZGFibGVzIGFyZSByZXR1cm5lZCBieSB1cHdhcmRhYmxlIGZ1bmN0aW9ucyxcbi8vIHJlcHJlc2VudCB2YWx1ZXMgaW4gdXB3YXdyZGFibGUgb2JqZWN0cyxcbi8vIGFuZCBoYXZlIGEgYGNoYW5nZWAgbWV0aG9kIHRvIGNoYW5nZSB0aGVpciB2YWx1ZXMuXG5cbmltcG9ydCB7dXB3YXJkQ29uZmlnfSBmcm9tICcuL0NmZyc7XG5pbXBvcnQgbG9nIGZyb20gJy4vTG9nJztcblxuY29uc3QgREVCVUdfQUxMID0gdHJ1ZTtcbmNvbnN0IERFQlVHID0gdXB3YXJkQ29uZmlnLkRFQlVHO1xuXG52YXIge2NyZWF0ZSwgZ2V0Tm90aWZpZXIsIGRlZmluZVByb3BlcnR5LCBkZWZpbmVQcm9wZXJ0aWVzfSA9IE9iamVjdDtcblxudmFyIGNoYW5uZWwgPSBsb2coJ1VwdycsIHsgc3R5bGU6IHsgY29sb3I6ICdyZWQnIH0gfSk7XG5cblxuLy8gTWFuYWdlIHVwd2FyZGFibGVzLlxudmFyIHNldCA9IG5ldyBXZWFrU2V0KCk7XG5cbmZ1bmN0aW9uIGlzICh1KSB7IHJldHVybiB1ICYmIHR5cGVvZiB1ID09PSAnb2JqZWN0JyAmJiBzZXQuaGFzKHUpOyB9XG5mdW5jdGlvbiBhZGQodSwgZGVidWcpIHsgc2V0LmFkZCh1KTsgYWRvcm4odSwgZGVidWcpOyByZXR1cm4gdTsgfVxuXG4vLyBBZGQgaWRzIGFuZCBkZWJ1ZyBmbGFnIHRvIHVwd2FyZGFibGVzLlxudmFyIGlkID0gMDtcblxuZnVuY3Rpb24gYWRvcm4odSwgZGVidWcgPSBmYWxzZSkge1xuICBpZiAodXB3YXJkQ29uZmlnLkRFQlVHKSB7XG4gICAgZGVmaW5lUHJvcGVydGllcyh1LCB7XG4gICAgICBfdXB3YXJkYWJsZUlkOiB7IHZhbHVlOiBpZCsrIH0sXG4gICAgICBfdXB3YXJkYWJsZURlYnVnOiB7IHZhbHVlOiBkZWJ1ZyB9XG4gICAgfSk7XG4gIH1cbn1cblxuLy8gU3BlY2lhbCBtYWNoaW5lcnkgZm9yIHVwd2FyZGFibGUgYHVuZGVmaW5lZGAgYW5kIGBudWxsYC5cbnZhciBudWxsVXB3YXJkYWJsZVByb3RvdHlwZSAgICAgID0geyB2YWx1ZU9mKCkgeyByZXR1cm4gbnVsbDsgfSwgY2hhbmdlIH07XG52YXIgdW5kZWZpbmVkVXB3YXJkYWJsZVByb3RvdHlwZSA9IHsgdmFsdWVPZigpIHsgfSwgICAgICAgICAgICAgIGNoYW5nZSB9O1xuXG5mdW5jdGlvbiBtYWtlTnVsbCgpICAgICAgeyB2YXIgdSA9IGNyZWF0ZShudWxsVXB3YXJkYWJsZVByb3RvdHlwZSk7ICAgICAgYWRkKHUpOyByZXR1cm4gdTsgfVxuZnVuY3Rpb24gbWFrZVVuZGVmaW5lZCgpIHsgdmFyIHUgPSBjcmVhdGUodW5kZWZpbmVkVXB3YXJkYWJsZVByb3RvdHlwZSk7IGFkZCh1KTsgcmV0dXJuIHU7IH1cblxuLy8gTWFrZSBhIG5ldyB1cHdhcmRhYmxlLlxuLy8gUmVnaXN0ZXIgaXQsIGFuZCBhZGQgYSBgY2hhbmdlYCBtZXRob2Qgd2hpY2ggbm90aWZpZXMgd2hlbiBpdCBpcyB0byBiZSByZXBsYWNlZC5cbmZ1bmN0aW9uIG1ha2UoeCwgb3B0aW9ucyA9IHt9KSB7XG4gIHZhciB7ZGVidWcgPSBERUJVR19BTEx9ID0gb3B0aW9ucztcbiAgdmFyIHU7XG5cbiAgZGVidWcgPSBERUJVRyAmJiBkZWJ1ZztcblxuICBpZiAoeCA9PT0gdW5kZWZpbmVkKSB1ID0gbWFrZVVuZGVmaW5lZCgpO1xuICBlbHNlIGlmICh4ID09PSBudWxsKSB1ID0gbWFrZU51bGwoKTtcbiAgZWxzZSB7XG4gICAgdSA9IE9iamVjdCh4KTtcbiAgICBpZiAoIWlzKHUpKSB7XG4gICAgICBhZGQodSwgZGVidWcpO1xuICAgICAgZGVmaW5lUHJvcGVydHkodSwgJ2NoYW5nZScsIHsgdmFsdWU6IGNoYW5nZSB9KTtcbiAgICB9XG4gIH1cbiAgaWYgKGRlYnVnKSBjb25zb2xlLmRlYnVnKC4uLmNoYW5uZWwuZGVidWcoXCJDcmVhdGVkIHVwd2FyZGFibGVcIiwgdS5fdXB3YXJkYWJsZUlkLCBcImZyb21cIiwgeCkpO1xuICByZXR1cm4gdTtcbn1cblxuLy8gQ2hhbmdlIGFuIHVwd2FyZGFibGUuIElzc3VlIG5vdGlmaWNhdGlvbiB0aGF0IGl0IGhhcyBjaGFuZ2VkLlxuZnVuY3Rpb24gY2hhbmdlKHgpIHtcbiAgdmFyIHUgPSB0aGlzO1xuICB2YXIgZGVidWcgPSB1Ll91cHdhcmRhYmxlRGVidWc7XG5cbiAgaWYgKHggIT09IHRoaXMudmFsdWVPZigpKSB7XG4gICAgdSA9IG1ha2UoeCwgeyBkZWJ1ZyB9KTtcbiAgICBnZXROb3RpZmllcih0aGlzKS5ub3RpZnkoe29iamVjdDogdGhpcywgbmV3VmFsdWU6IHUsIHR5cGU6ICd1cHdhcmQnfSk7XG5cbiAgICBpZiAoZGVidWcpIHtcbiAgICAgIGNvbnNvbGUuZGVidWcoLi4uY2hhbm5lbC5kZWJ1ZyhcIlJlcGxhY2VkIHVwd2FyZGFibGVcIiwgdGhpcy5fdXB3YXJkYWJsZUlkLCBcIndpdGhcIiwgdS5fdXB3YXJkYWJsZUlkKSk7XG4gICAgfVxuICB9XG4gIHJldHVybiB1O1xufVxuXG5cbmV4cG9ydCB7bWFrZSBhcyBkZWZhdWx0LCBpcyBhcyBpc1Vwd2FyZGFibGV9O1xuIiwiLy8gVXRpbGl0eSBmdW5jdGlvbnNcbi8vID09PT09PT09PT09PT09PT09XG5cbmltcG9ydCB7dGVzdEdyb3VwLCB0ZXN0LCBhc3NlcnR9IGZyb20gJy4vVHN0JztcbmltcG9ydCB7b2JqZWN0RnJvbVBhaXJzfSBmcm9tICcuL091dCc7XG5cbi8vIFNldHVwLlxudmFyIHtjcmVhdGUsIGtleXN9ID0gT2JqZWN0O1xuXG52YXIgdGVzdHMgPSBbXTtcbnZhciBURVNUID0gdHJ1ZTtcblxuXG4vLyBDcmVhdGUgYW4gYXJyYXkgb2YgYSBzZXF1ZW5jZSBvZiBpbnRlZ2Vycy5cbmZ1bmN0aW9uIHNlcSh0bywgZnJvbSA9IDAsIHN0ZXAgPSAxKSB7XG4gIHZhciByZXN1bHQgPSBbXTtcbiAgdmFyIGNvdW50ID0gMDtcbiAgaWYgKHRvID4gZnJvbSkgZm9yIChsZXQgaSA9IGZyb207IGkgPCB0bzsgaSArPSBzdGVwKSByZXN1bHRbY291bnQrK10gPSBpO1xuICBlbHNlICAgICAgICAgICBmb3IgKGxldCBpID0gZnJvbTsgaSA+IHRvOyBpIC09IHN0ZXApIHJlc3VsdFtjb3VudCsrXSA9IGk7XG5cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuaWYgKFRFU1QpIHtcbiAgZnVuY3Rpb24gdHN0U2VxKCkge1xuICAgIHJldHVybiB0ZXN0R3JvdXAoXG4gICAgICBcInNlcVwiLFxuICAgICAgW1xuICAgICAgICB0ZXN0KFwic2ltcGxlIHNlcXVlbmNlXCIsICAgICh7YXNzZXJ0fSkgPT4gYXNzZXJ0LmRlZXBFcXVhbChzZXEoMiksICAgICAgIFswLCAxXSkpLFxuICAgICAgICB0ZXN0KFwic2VxdWVuY2Ugd2l0aCBmcm9tXCIsICh7YXNzZXJ0fSkgPT4gYXNzZXJ0LmRlZXBFcXVhbChzZXEoMywgMSksICAgIFsxLCAyXSkpLFxuICAgICAgICB0ZXN0KFwic3RlcHBlZCBzZXF1ZW5jZVwiLCAgICh7YXNzZXJ0fSkgPT4gYXNzZXJ0LmRlZXBFcXVhbChzZXEoMywgMCwgMiksIFswLCAyXSkpLFxuICAgICAgICB0ZXN0KFwicmV2ZXJzZSBzZXF1ZW5jZVwiLCAgICh7YXNzZXJ0fSkgPT4gYXNzZXJ0LmRlZXBFcXVhbChzZXEoMCwgMiksICAgIFsyLCAxXSkpXG4gICAgICBdXG4gICAgKTtcbiAgfVxuICB0ZXN0cy5wdXNoKHRzdFNlcSk7XG59XG5cblxuLy8gUmV0dXJuIHRhaWwgb2YgYXJyYXkuXG5mdW5jdGlvbiB0YWlsKGEpIHtcbiAgdmFyIFssIC4uLnRdID0gYTtcbiAgcmV0dXJuIHQ7XG59XG5cbmlmIChURVNUKSB7XG4gIGZ1bmN0aW9uIHRzdFRhaWwoKSB7XG4gICAgcmV0dXJuIHRlc3RHcm91cChcbiAgICAgIFwidGFpbFwiLCBbXG4gICAgICAgIHRlc3QoXCJub3JtYWxcIiwgICAgICAgICAoe2Fzc2VydH0pID0+IGFzc2VydC5kZWVwRXF1YWwodGFpbChbMSwyXSksIFsyXSkpLFxuICAgICAgICB0ZXN0KFwic2luZ2xlIGVsZW1lbnRcIiwgKHthc3NlcnR9KSA9PiBhc3NlcnQuZGVlcEVxdWFsKHRhaWwoWzFdKSwgICBbXSkpLFxuICAgICAgICB0ZXN0KFwiZW1wdHkgYXJyYXlcIiwgICAgKHthc3NlcnR9KSA9PiBhc3NlcnQuZGVlcEVxdWFsKHRhaWwoW10pLCAgICBbXSkpXG4gICAgICBdXG4gICAgKTtcbiAgfVxuICB0ZXN0cy5wdXNoKHRzdFRhaWwpO1xufVxuXG5cbmZ1bmN0aW9uIHBsdXMoYSwgYikge1xuICByZXR1cm4gYSArIGI7XG59XG5cbmlmIChURVNUKSB7XG4gIGZ1bmN0aW9uIHRzdFBsdXMoKSB7XG4gICAgcmV0dXJuIHRlc3QoXCJwbHVzXCIsICh7YXNzZXJ0fSkgPT4gYXNzZXJ0LmVxdWFsKHBsdXMoMSwgMiksIDMpKTtcbiAgfVxuICB0ZXN0cy5wdXNoKHRzdFBsdXMpO1xufVxuXG4vLyBTdW0gKG9yIGNvbmNhdGVuYXRlKSBlbGVtZW50cyBvZiBhcnJheVxuZnVuY3Rpb24gc3VtKGEpIHtcbiAgcmV0dXJuIGEucmVkdWNlKHBsdXMpO1xufVxuXG5mdW5jdGlvbiBhcnJheU1heChhKSB7XG4gIHJldHVybiBNYXRoLm1heCguLi5hKTtcbn1cblxuZnVuY3Rpb24gYXJyYXlNaW4oYSkge1xuICByZXR1cm4gTWF0aC5taW4oLi4uYSk7XG59XG5cbmZ1bmN0aW9uIGFycmF5TWVhbihhKSB7XG4gIHJldHVybiBzdW0oYSkgLyBhLmxlbmd0aDtcbn1cblxuLy8gU3dhcCB0aGUgZWxlbWVudHMgb2YgYSB0dXBsZSBpbiBwbGFjZS5cbmZ1bmN0aW9uIHN3YXAoYSkge1xuICBbYVsxXSwgYVsyXV0gPSBhO1xufVxuXG4vLyBBcHBlbmQgdG8gYW4gYXJyYXksIHJldHVybmluZyB0aGUgYXJyYXkuXG5mdW5jdGlvbiBhcHBlbmQoYSwgLi4uZWx0cykge1xuICBhLnB1c2goLi4uZWx0cyk7XG4gIHJldHVybiBhO1xufVxuXG4vLyBPbWl0IGVsZW1lbnRzIGZyb20gYXJyYXkgZGVzdHJ1Y3RpdmVseS5cbmZ1bmN0aW9uIG9taXQoYSwgZWx0KSB7XG4gIHZhciBpbmRleCA9IGEuaW5kZXhPZihlbHQpO1xuICBpZiAoaW5kZXggIT09IC0xKSB7XG4gICAgYS5zcGxpY2UoaW5kZXgsIDEpO1xuICB9XG4gIHJldHVybiBhO1xufVxuXG4vLyBSZXBsYWNlIG9uZSBlbGVtZW50IGluIGFuIGFycmF5IHdpdGggYW5vdGhlci5cbmZ1bmN0aW9uIHJlcGxhY2UoYSwgZWx0MSwgZWx0Mikge1xuICB2YXIgaWR4ID0gYS5pbmRleE9mKGVsdDEpO1xuICBpZiAoaWR4ICE9PSAtMSkgeyBhW2lkeF0gPSBlbHQyOyB9XG4gIHJldHVybiBhO1xufVxuXG4vLyByZXZlcnNlIGFuIGFycmF5IGluIHBsYWNlXG5mdW5jdGlvbiByZXZlcnNlKGEpIHtcbiAgdmFyIGxlbiA9IGEubGVuZ3RoO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IE1hdGguZmxvb3IobGVuLzIpOyBpKyspIHtcbiAgICBbYVtpXSwgYVtsZW4taS0xXV0gPSBbYVtsZW4taS0xXSwgYVtpXV07XG4gIH1cbiAgcmV0dXJuIGE7XG59XG5cbi8vIEZsYXR0ZW4gYW4gYXJyYXkuXG5mdW5jdGlvbiBmbGF0dGVuKGEpIHtcbiAgZnVuY3Rpb24gX3JlZHVjZShhKSB7IHJldHVybiBhLnJlZHVjZShfZmxhdHRlbiwgW10pOyB9XG5cbiAgZnVuY3Rpb24gX2ZsYXR0ZW4oYSwgYikge1xuICAgIHJldHVybiBhLmNvbmNhdChBcnJheS5pc0FycmF5KGIpID8gX3JlZHVjZShiKSA6IGIpO1xuICB9XG5cbiAgcmV0dXJuIF9yZWR1Y2UoYSk7XG59XG5cbmlmIChURVNUKSB7XG4gIHRlc3RzLnB1c2goKCkgPT4gdGVzdEdyb3VwKFxuICAgIFwiZmxhdHRlblwiLFxuICAgIFtcbiAgICAgIHRlc3QoXG4gICAgICAgIFwic2ltcGxlIGZsYXR0ZW5cIixcbiAgICAgICAgKHthc3NlcnR9KSA9PiBhc3NlcnQuZGVlcEVxdWFsKFxuICAgICAgICAgIGZsYXR0ZW4oW1sxLCAyXSwgWzMsIDRdXSksXG4gICAgICAgICAgWzEsIDIsIDMsIDRdXG4gICAgICAgIClcbiAgICAgICksXG4gICAgICB0ZXN0KFxuICAgICAgICBcImRlZXAgZmxhdHRlblwiLFxuICAgICAgICAoe2Fzc2VydH0pID0+IGFzc2VydC5kZWVwRXF1YWwoXG4gICAgICAgICAgZmxhdHRlbihbMSwgWzIsIFszLCBbNF1dXV0pLFxuICAgICAgICAgIFsxLCAyLCAzLCA0XVxuICAgICAgICApXG4gICAgICApXG4gICAgXVxuICApKTtcbn1cblxuXG5mdW5jdGlvbiBtYXBJblBsYWNlKGEsIGZuLCBjdHh0KSB7XG4gIGZvciAodmFyIGkgPSAwLCBsZW4gPSBhLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgYVtpXSA9IGZuLmNhbGwoY3R4dCwgYVtpXSk7XG4gIH1cbiAgcmV0dXJuIGE7XG59XG5cbmZ1bmN0aW9uIHJlcGVhdChuLCB2KSB7XG4gIHJldHVybiBzZXEobikuZmlsbCh2KTtcbn1cblxuLy8gQ3JlYXRlIGEgc29ydCBmdW5jdGlvbiBzdWl0YWJsZSBmb3IgcGFzc2luZyB0byBgQXJyYXkjc29ydGAuXG5mdW5jdGlvbiBtYWtlU29ydGZ1bmMoa2V5LCBkZXNjKSB7XG4gIHJldHVybiBmdW5jdGlvbihhLCBiKSB7XG4gICAgdmFyIGFrZXkgPSBrZXkoYSksIGJrZXkgPSBrZXkoYik7XG4gICAgdmFyIHJlc3VsdCA9IGFrZXkgPCBia2V5ID8gLTEgOiBha2V5ID4gYmtleSA/ICsxIDogMDtcbiAgICByZXR1cm4gZGVzYyA/IC1yZXN1bHQgOiByZXN1bHQ7XG4gIH07XG59XG5cbi8vIENvcHkgYSBzZWNvbmQgYXJyYXkgb250byBhIGZpcnN0IG9uZSBkZXN0cnVjdGl2ZWx5LlxuZnVuY3Rpb24gY29weU9udG9BcnJheShhMSwgYTIpIHtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBhMS5sZW5ndGg7IGkrKykge1xuICAgIGExW2ldID0gYTJbaV07XG4gIH1cbiAgYTEubGVuZ3RoID0gYTIubGVuZ3RoO1xuICByZXR1cm4gYTE7XG59XG5cbi8vIENyZWF0ZSBhbiBhcnJheSBvZiB1bmlxdWUgdmFsdWVzLlxuLy8gQFRPRE8gcmVwbGFjZSB0aGlzIGxvZ2ljIHVzaW5nIFNldC5cbmZ1bmN0aW9uIHVuaXF1ZWl6ZShhKSB7XG4gIHJldHVybiBhLmZpbHRlcigoZWx0LCBpKSA9PiBhLmluZGV4T2YoZWx0KSA9PT0gaSk7XG59XG5cbi8vIEZpbmQgYWxsIG9jY3VycmVuY2VzIG9mIGVsZW1lbnQgaW4gYW4gYXJyYXksIHJldHVybiBpbmRpY2VzLlxuLy8gQE5PVFVTRURcbmZ1bmN0aW9uIGluZGV4ZXNPZihhLCBlbHQpIHtcbiAgdmFyIHJldCA9IFtdLCBpbmRleCA9IDA7XG4gIHdoaWxlICgoaW5kZXggPSBhLmluZGV4T2YoZWx0LCBpbmRleCkpICE9PSAtMSkge1xuICAgIHJldC5wdXNoKGluZGV4KyspO1xuICB9XG4gIHJldHVybiByZXQ7XG59XG5cbi8vIEludGVybGVhdmUgYW4gZWxlbWVudCBpbnRvIGFuIGFycmF5IChhZGRpbmcgYXQgZW5kIHRvbykuXG5mdW5jdGlvbiBpbnRlcmxlYXZlRWxlbWVudChhMSwgZWx0KSB7XG4gIHJldHVybiBbXS5jb25jYXQoLi4uYTEubWFwKHYgPT4gW3YsIGVsdF0pKTtcbn1cblxuLy8gQ3JlYXRlIGFuIGFycmF5IG9mIHJ1bm5pbmcgdG90YWxzLCBldGMuXG5mdW5jdGlvbiBydW5uaW5nTWFwKGEsIGZuLCBpbml0KSB7XG4gIHJldHVybiBhLm1hcCh2ID0+IGluaXQgPSBmbih2LCBpbml0KSk7XG59XG5cbi8vIENyZWF0ZSBhbiBhcnJheSBvZiBydW5uaW5nIHRvdGFscy5cbmZ1bmN0aW9uIHJ1bm5pbmdUb3RhbChhKSB7XG4gIHJldHVybiBydW5uaW5nTWFwKGEsIE1hdGguc3VtKTtcbn1cblxuLy8gRmlsdGVyIGFuIGFycmF5IGluIHBsYWNlLCBiYXNlZCBvbiBwcmVkaWNhdGUgd2l0aCBzYW1lIHNpZ25hdHVyZSBhcyBgQXJyYXkjZmlsdGVyYC5cbmZ1bmN0aW9uIGZpbHRlckluUGxhY2UoYSwgZm4sIGN0eHQpIHtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBhLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKCFmbi5jYWxsKGN0eHQsIGFbaV0sIGksIGEpKSB7XG4gICAgICBhLnNwbGljZShpLS0sIDEpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gYTtcbn1cblxuLy8gQ2hhaW4gZm5zIHRvZ2V0aGVyIHVzaW5nIHByb21pc2VzLlxuZnVuY3Rpb24gY2hhaW5Qcm9taXNlcyguLi5mbnMpIHtcbiAgcmV0dXJuIFsuLi5mbnNdLnJlZHVjZShcbiAgICAocmVzdWx0LCBmbikgPT4gcmVzdWx0LnRoZW4oZm4pLFxuICAgIFByb21pc2UucmVzb2x2ZSgpXG4gICk7XG59XG5cbi8vIFN0b3B3YXRjaDogc3RhcnQgYW5kIHN0b3AsIHRoZW4gcmV0cmlldmUgZWxhcHNlZCB0aW1lLlxuLy8gU3RhcnQgYW5kIHN0b3AgcmV0dXJuIGlucHV0LCB0byBtYWtlIHRoZW0gZnJpZW5kbHkgdG8gcHJvbWlzZSBjaGFpbmluZy5cbi8vIFN0YXJ0LCBzdG9wIGFuZCByZXNldCBhcmUgcHJlLWJvdW5kIHRvIHRoZSBzdG9wd2F0Y2ggaXRzZWxmLlxudmFyIHN0b3B3YXRjaFByb3RvdHlwZSA9IGNyZWF0ZSh7XG4gIHN0YXJ0KHZhbCkgeyB0aGlzLnN0YXJ0ZWQgPSBEYXRlLm5vdygpOyB0aGlzLnN0b3BwZWQgPSBmYWxzZTsgcmV0dXJuIHZhbDsgfSxcbiAgc3RvcCAodmFsKSB7IHRoaXMuZWxhcHNlZCA9IHRoaXMudGltZTsgIHRoaXMuc3RvcHBlZCA9IHRydWU7ICByZXR1cm4gdmFsOyB9LFxuICByZXNldCh2YWwpIHsgdGhpcy5lbGFwc2VkID0gMDsgICAgICAgICAgdGhpcy5zdG9wcGVkID0gdHJ1ZTsgIHJldHVybiB2YWw7IH0sXG4gIHN0b3BwZWQ6ICAgdHJ1ZSxcbiAgZWxhcHNlZDogICAwXG59LCB7XG4gIGN1cnJlbnQ6ICAgeyBnZXQ6IGZ1bmN0aW9uKCkgeyByZXR1cm4gdGhpcy5zdG9wcGVkID8gMCA6IERhdGUubm93KCkgLSB0aGlzLnN0YXJ0ZWQ7IH0gfSxcbiAgdGltZTogICAgICB7IGdldDogZnVuY3Rpb24oKSB7IHJldHVybiB0aGlzLmVsYXBzZWQgKyB0aGlzLmN1cnJlbnQ7IH0gfVxufSk7XG5cbmZ1bmN0aW9uIG1ha2VTdG9wd2F0Y2goKSB7XG4gIHZhciBzdG9wd2F0Y2ggPSBjcmVhdGUoc3RvcHdhdGNoUHJvdG90eXBlKTtcbiAgWydzdGFydCcsICdzdG9wJywgJ3Jlc2V0J10uZm9yRWFjaChcbiAgICBtZXRob2QgPT4gc3RvcHdhdGNoW21ldGhvZF0gPSBzdG9wd2F0Y2hbbWV0aG9kXS5iaW5kKHN0b3B3YXRjaCkpO1xuICByZXR1cm4gc3RvcHdhdGNoO1xufVxuXG4vLyBNYWtlIGEgY291bnRlciBmb3Igb2NjdXJyZW5jZXMgb2Ygc29tZXRoaW5nIG9uIGFuIG9iamVjdCwgdXNpbmcgd2VhayBtYXAuXG4vLyBGb3IgZXhhbXBsZSwgdXNlZCB0byBjb3VudCByZWNvbXB1dGF0aW9ucyBvZiBcImtlZXBYWFhcIiByZXN1bHRzLlxuZnVuY3Rpb24gbWFrZUNvdW50ZXJNYXAoKSB7XG4gIHZhciBtYXAgPSBuZXcgV2Vha01hcCgpO1xuICByZXR1cm4ge1xuICAgIGluaXQob2JqKSB7IG1hcC5zZXQob2JqLCAwKTsgfSxcbiAgICBpbmNyKG9iaikge1xuICAgICAgY29uc29sZS5hc3NlcnQobWFwLmhhcyhvYmopLCBcIk9iamVjdCBtdXN0IGJlIGluIGNvdW50ZXIgbWFwLlwiKTtcbiAgICAgIG1hcC5zZXQob2JqLCBtYXAuZ2V0KG9iaikgKyAxKTtcbiAgICB9LFxuICAgICBnZXQob2JqKSAgeyByZXR1cm4gbWFwLmdldChvYmopOyB9XG4gIH07XG59XG5cbi8vIEludGVybGVhdmUgbXVsdGlwbGUgYXJyYXlzLlxuZnVuY3Rpb24gaW50ZXJsZWF2ZSguLi5hcnJheXMpIHtcbiAgdmFyIG1vcmUgPSB0cnVlO1xuICB2YXIgbiA9IDA7XG4gIHZhciByZXN1bHQgPSBbXTtcbiAgd2hpbGUgKG1vcmUpIHtcbiAgICBtb3JlID0gZmFsc2U7XG4gICAgZm9yICh2YXIgYXJyYXkgb2YgYXJyYXlzKSB7XG4gICAgICBpZiAobiA+PSBhcnJheS5sZW5ndGgpIGNvbnRpbnVlO1xuICAgICAgcmVzdWx0LnB1c2goYXJyYXlbbl0pO1xuICAgICAgbW9yZSA9IHRydWU7XG4gICAgfVxuICAgIG4rKztcbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufVxuXG4vLyBHZW5lcmF0b3IgZm9yIGludGVybGVhdmVkIHZhbHVlcyBmcm9tIG11bHRpcGxlIGl0ZXJhdGFibGVzLlxuZnVuY3Rpb24gKmludGVybGVhdmVJdGVyYWJsZXMoLi4uaXRlcmFibGVzKSB7XG4gIHZhciBtb3JlID0gdHJ1ZTtcbiAgd2hpbGUgKG1vcmUpIHtcbiAgICBtb3JlID0gZmFsc2U7XG4gICAgZm9yICh2YXIgaXQgb2YgaXRlcmFibGVzKSB7XG4gICAgICB2YXIge2RvbmUsIHZhbHVlfSA9IGl0Lm5leHQoKTtcbiAgICAgIGlmIChkb25lKSBjb250aW51ZTtcbiAgICAgIG1vcmUgPSB0cnVlO1xuICAgICAgeWllbGQgdmFsdWU7XG4gICAgfVxuICB9XG59XG5cbi8vIFVSTC1SRUxBVEVEIFVUSUxJVElFU1xuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbi8vIFBhcnNlIGEgc2VhcmNoIHN0cmluZyBpbnRvIGFuIG9iamVjdC5cbmZ1bmN0aW9uIHBhcnNlVXJsU2VhcmNoKHNlYXJjaCkge1xuICBpZiAoc2VhcmNoWzBdID09PSAnPycpIHNlYXJjaCA9IHNlYXJjaC5zbGljZSgxKTtcblxuICBmdW5jdGlvbiBzcGxpdFBhcmFtKHBhcmFtKSB7XG4gICAgdmFyIFtrZXksIHZhbHVlID0gJyddID0gcGFyYW0uc3BsaXQoJz0nKTtcbiAgICByZXR1cm4gW2tleSwgZGVjb2RlVVJJQ29tcG9uZW50KHZhbHVlKV07XG4gIH1cblxuICByZXR1cm4gb2JqZWN0RnJvbVBhaXJzKHNlYXJjaCAuIHNwbGl0KCcmJykgLiBtYXAoc3BsaXRQYXJhbSkpO1xufVxuXG5pZiAoVEVTVCkge1xuICB0ZXN0cy5wdXNoKGZ1bmN0aW9uIHRzdFBhcnNlVXJsU2VhcmNoKCkge1xuICAgIHJldHVybiB0ZXN0R3JvdXAoXCJwYXJzZVVybFNlYXJjaFwiLCBbXG4gICAgICB0ZXN0KFwiYmFzZSBjYXNlXCIsICh7YXNzZXJ0fSkgPT4gYXNzZXJ0LmRlZXBFcXVhbChwYXJzZVVybFNlYXJjaCgnYT0xJmI9MicpLCB7YTogXCIxXCIsIGI6IFwiMlwifSkpXG4gICAgXSk7XG4gIH0pO1xufVxuXG4vLyBCdWlsZCBhIHNlYXJjaCBzdHJpbmcgKHdpdGggbm8gPykgZnJvbSBhbiBvYmplY3QuXG5mdW5jdGlvbiBidWlsZFVybFNlYXJjaChxdWVyeSkge1xuXG4gIGZ1bmN0aW9uIGJ1aWxkUGFyYW0oa2V5KSB7XG4gICAgbGV0IHZhbHVlID0gcXVlcnlba2V5XTtcbiAgICBpZiAodmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09IHVuZGVmaW5lZCkgdmFsdWUgPSAnJztcbiAgICBlbHNlIHZhbHVlID0gZW5jb2RlVVJJQ29tcG9uZW50KHZhbHVlKTtcbiAgICByZXR1cm4gYCR7a2V5fT0ke3ZhbHVlfWA7XG4gIH1cblxuICByZXR1cm4ga2V5cyhxdWVyeSkgLiBtYXAoYnVpbGRQYXJhbSkgLiBqb2luKCcmJyk7XG59XG5cbmlmIChURVNUKSB7XG4gIHRlc3RzLnB1c2goZnVuY3Rpb24gdHN0QnVpbGRVcmxTZWFyY2goKSB7XG4gICAgcmV0dXJuIHRlc3RHcm91cChcImJ1aWxkVXJsU2VhcmNoXCIsIFtcbiAgICAgIHRlc3QoXCJiYXNlIGNhc2VcIiwgKHthc3NlcnR9KSA9PiBhc3NlcnQuZXF1YWwoYnVpbGRVcmxTZWFyY2goe2E6IDEsIGI6IDJ9KSwgJ2E9MSZiPTInKSlcbiAgICBdKTtcbiAgfSk7XG59XG5cbnZhciBwcm90b3R5cGVGbnMgPSB7XG4gIHRhaWwsIHN1bSwgc3dhcCwgYXBwZW5kLCByZXBsYWNlLCBtYXBJblBsYWNlLCBvbWl0LCBjb3B5T250b0FycmF5LCB1bmlxdWVpemUsXG4gIGluZGV4ZXNPZiwgaW50ZXJsZWF2ZSwgcnVubmluZ01hcCwgcnVubmluZ1RvdGFsLCBmaWx0ZXJJblBsYWNlLCBjaGFpblByb21pc2VzXG59O1xuXG4vLyBBbGxvdyBpbi1wbGFjZSBtb2RpZmllciBmdW5jdGlvbnMgdG8gYmUgYXBwbGllZCB0byBhcnJheSBhcyBgdGhpc2AuXG4vLyBpZiAoIUFycmF5LnByb3RvdHlwZS50YWlsKSB7XG4vLyAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKFxuLy8gICAgIEFycmF5LnByb3RvdHlwZSxcbi8vICAgICBtYXBPYmplY3QocHJvdG90eXBlRm5zLCB2ID0+IChcbi8vICAgICAgIHsgdmFsdWUoLi4uYXJncykgeyByZXR1cm4gdih0aGlzLCAuLi5hcmdzKTsgfSB9XG4vLyAgICAgKSlcbi8vICAgKTtcbi8vIH1cblxuXG4vLyBFeHBvcnRlZCBmdW5jdGlvbiB0byBDcmVhdGUgdGVzdCBncm91cC5cbmZ1bmN0aW9uIHV0bFRlc3RHcm91cCgpIHtcbiAgcmV0dXJuIHRlc3RHcm91cChcIm1vZHVsZSBVdGwgKGdlbmVyYWwgdXRpbGl0aWVzKVwiLCB0ZXN0cy5tYXAodGVzdCA9PiB0ZXN0KCkpKTtcbn1cblxuZXhwb3J0IHtcbiAgc2VxLFxuICB0YWlsLFxuICBwbHVzLFxuICBzdW0sXG4gIGFycmF5TWF4LFxuICBhcnJheU1pbixcbiAgYXJyYXlNZWFuLFxuICBzd2FwLFxuICBhcHBlbmQsXG4gIG9taXQsXG4gIHJlcGxhY2UsXG4gIHJldmVyc2UsXG4gIGZsYXR0ZW4sXG4gIG1hcEluUGxhY2UsXG4gIHJlcGVhdCxcbiAgbWFrZVNvcnRmdW5jLFxuICBjb3B5T250b0FycmF5LFxuICB1bmlxdWVpemUsXG4gIGluZGV4ZXNPZixcbiAgaW50ZXJsZWF2ZUVsZW1lbnQsXG4gIHJ1bm5pbmdNYXAsXG4gIHJ1bm5pbmdUb3RhbCxcbiAgZmlsdGVySW5QbGFjZSxcbiAgY2hhaW5Qcm9taXNlcyxcbiAgbWFrZVN0b3B3YXRjaCxcbiAgbWFrZUNvdW50ZXJNYXAsXG4gIGludGVybGVhdmUsXG4gIGludGVybGVhdmVJdGVyYWJsZXMsXG5cbiAgcGFyc2VVcmxTZWFyY2gsXG4gIGJ1aWxkVXJsU2VhcmNoLFxuXG4gIHV0bFRlc3RHcm91cCBhcyB0ZXN0c1xufTtcbiJdfQ==
