(function(f) {
    if (typeof exports === "object" && typeof module !== "undefined") { module.exports = f() } else if (typeof define === "function" && define.amd) { define([], f) } else {
        var g;
        if (typeof window !== "undefined") { g = window } else if (typeof global !== "undefined") { g = global } else if (typeof self !== "undefined") { g = self } else { g = this }
        g.StackTrace = f()
    }
})(function() {
    var define, module, exports;
    return (function() {
        function r(e, n, t) {
            function o(i, f) {
                if (!n[i]) {
                    if (!e[i]) { var c = "function" == typeof require && require; if (!f && c) return c(i, !0); if (u) return u(i, !0); var a = new Error("Cannot find module '" + i + "'"); throw a.code = "MODULE_NOT_FOUND", a }
                    var p = n[i] = { exports: {} };
                    e[i][0].call(p.exports, function(r) { var n = e[i][1][r]; return o(n || r) }, p, p.exports, r, e, n, t)
                }
                return n[i].exports
            }
            for (var u = "function" == typeof require && require, i = 0; i < t.length; i++) o(t[i]);
            return o
        }
        return r
    })()({
        1: [function(require, module, exports) {
            (function(root, factory) {
                'use strict';
                // Universal Module Definition (UMD) to support AMD, CommonJS/Node.js, Rhino, and browsers.

                /* istanbul ignore next */
                if (typeof define === 'function' && define.amd) {
                    define('error-stack-parser', ['stackframe'], factory);
                } else if (typeof exports === 'object') {
                    module.exports = factory(require('stackframe'));
                } else {
                    root.ErrorStackParser = factory(root.StackFrame);
                }
            }(this, function ErrorStackParser(StackFrame) {
                'use strict';

                var FIREFOX_SAFARI_STACK_REGEXP = /(^|@)\S+:\d+/;
                var CHROME_IE_STACK_REGEXP = /^\s*at .*(\S+:\d+|\(native\))/m;
                var SAFARI_NATIVE_CODE_REGEXP = /^(eval@)?(\[native code])?$/;

                return {
                    /**
                     * Given an Error object, extract the most information from it.
                     *
                     * @param {Error} error object
                     * @return {Array} of StackFrames
                     */
                    parse: function ErrorStackParser$$parse(error) {
                        if (typeof error.stacktrace !== 'undefined' || typeof error['opera#sourceloc'] !== 'undefined') {
                            return this.parseOpera(error);
                        } else if (error.stack && error.stack.match(CHROME_IE_STACK_REGEXP)) {
                            return this.parseV8OrIE(error);
                        } else if (error.stack) {
                            return this.parseFFOrSafari(error);
                        } else {
                            throw new Error('Cannot parse given Error object');
                        }
                    },

                    // Separate line and column numbers from a string of the form: (URI:Line:Column)
                    extractLocation: function ErrorStackParser$$extractLocation(urlLike) {
                        // Fail-fast but return locations like "(native)"
                        if (urlLike.indexOf(':') === -1) {
                            return [urlLike];
                        }

                        var regExp = /(.+?)(?::(\d+))?(?::(\d+))?$/;
                        var parts = regExp.exec(urlLike.replace(/[()]/g, ''));
                        return [parts[1], parts[2] || undefined, parts[3] || undefined];
                    },

                    parseV8OrIE: function ErrorStackParser$$parseV8OrIE(error) {
                        var filtered = error.stack.split('\n').filter(function(line) {
                            return !!line.match(CHROME_IE_STACK_REGEXP);
                        }, this);

                        return filtered.map(function(line) {
                            if (line.indexOf('(eval ') > -1) {
                                // Throw away eval information until we implement stacktrace.js/stackframe#8
                                line = line.replace(/eval code/g, 'eval').replace(/(\(eval at [^()]*)|(\),.*$)/g, '');
                            }
                            var sanitizedLine = line.replace(/^\s+/, '').replace(/\(eval code/g, '(');

                            // capture and preseve the parenthesized location "(/foo/my bar.js:12:87)" in
                            // case it has spaces in it, as the string is split on \s+ later on
                            var location = sanitizedLine.match(/ (\((.+):(\d+):(\d+)\)$)/);

                            // remove the parenthesized location from the line, if it was matched
                            sanitizedLine = location ? sanitizedLine.replace(location[0], '') : sanitizedLine;

                            var tokens = sanitizedLine.split(/\s+/).slice(1);
                            // if a location was matched, pass it to extractLocation() otherwise pop the last token
                            var locationParts = this.extractLocation(location ? location[1] : tokens.pop());
                            var functionName = tokens.join(' ') || undefined;
                            var fileName = ['eval', '<anonymous>'].indexOf(locationParts[0]) > -1 ? undefined : locationParts[0];

                            return new StackFrame({
                                functionName: functionName,
                                fileName: fileName,
                                lineNumber: locationParts[1],
                                columnNumber: locationParts[2],
                                source: line
                            });
                        }, this);
                    },

                    parseFFOrSafari: function ErrorStackParser$$parseFFOrSafari(error) {
                        var filtered = error.stack.split('\n').filter(function(line) {
                            return !line.match(SAFARI_NATIVE_CODE_REGEXP);
                        }, this);

                        return filtered.map(function(line) {
                            // Throw away eval information until we implement stacktrace.js/stackframe#8
                            if (line.indexOf(' > eval') > -1) {
                                line = line.replace(/ line (\d+)(?: > eval line \d+)* > eval:\d+:\d+/g, ':$1');
                            }

                            if (line.indexOf('@') === -1 && line.indexOf(':') === -1) {
                                // Safari eval frames only have function names and nothing else
                                return new StackFrame({
                                    functionName: line
                                });
                            } else {
                                var functionNameRegex = /((.*".+"[^@]*)?[^@]*)(?:@)/;
                                var matches = line.match(functionNameRegex);
                                var functionName = matches && matches[1] ? matches[1] : undefined;
                                var locationParts = this.extractLocation(line.replace(functionNameRegex, ''));

                                return new StackFrame({
                                    functionName: functionName,
                                    fileName: locationParts[0],
                                    lineNumber: locationParts[1],
                                    columnNumber: locationParts[2],
                                    source: line
                                });
                            }
                        }, this);
                    },

                    parseOpera: function ErrorStackParser$$parseOpera(e) {
                        if (!e.stacktrace || (e.message.indexOf('\n') > -1 &&
                                e.message.split('\n').length > e.stacktrace.split('\n').length)) {
                            return this.parseOpera9(e);
                        } else if (!e.stack) {
                            return this.parseOpera10(e);
                        } else {
                            return this.parseOpera11(e);
                        }
                    },

                    parseOpera9: function ErrorStackParser$$parseOpera9(e) {
                        var lineRE = /Line (\d+).*script (?:in )?(\S+)/i;
                        var lines = e.message.split('\n');
                        var result = [];

                        for (var i = 2, len = lines.length; i < len; i += 2) {
                            var match = lineRE.exec(lines[i]);
                            if (match) {
                                result.push(new StackFrame({
                                    fileName: match[2],
                                    lineNumber: match[1],
                                    source: lines[i]
                                }));
                            }
                        }

                        return result;
                    },

                    parseOpera10: function ErrorStackParser$$parseOpera10(e) {
                        var lineRE = /Line (\d+).*script (?:in )?(\S+)(?:: In function (\S+))?$/i;
                        var lines = e.stacktrace.split('\n');
                        var result = [];

                        for (var i = 0, len = lines.length; i < len; i += 2) {
                            var match = lineRE.exec(lines[i]);
                            if (match) {
                                result.push(
                                    new StackFrame({
                                        functionName: match[3] || undefined,
                                        fileName: match[2],
                                        lineNumber: match[1],
                                        source: lines[i]
                                    })
                                );
                            }
                        }

                        return result;
                    },

                    // Opera 10.65+ Error.stack very similar to FF/Safari
                    parseOpera11: function ErrorStackParser$$parseOpera11(error) {
                        var filtered = error.stack.split('\n').filter(function(line) {
                            return !!line.match(FIREFOX_SAFARI_STACK_REGEXP) && !line.match(/^Error created at/);
                        }, this);

                        return filtered.map(function(line) {
                            var tokens = line.split('@');
                            var locationParts = this.extractLocation(tokens.pop());
                            var functionCall = (tokens.shift() || '');
                            var functionName = functionCall
                                .replace(/<anonymous function(: (\w+))?>/, '$2')
                                .replace(/\([^)]*\)/g, '') || undefined;
                            var argsRaw;
                            if (functionCall.match(/\(([^)]*)\)/)) {
                                argsRaw = functionCall.replace(/^[^(]+\(([^)]*)\)$/, '$1');
                            }
                            var args = (argsRaw === undefined || argsRaw === '[arguments not available]') ?
                                undefined : argsRaw.split(',');

                            return new StackFrame({
                                functionName: functionName,
                                args: args,
                                fileName: locationParts[0],
                                lineNumber: locationParts[1],
                                columnNumber: locationParts[2],
                                source: line
                            });
                        }, this);
                    }
                };
            }));

        }, { "stackframe": 2 }],
        2: [function(require, module, exports) {
            (function(root, factory) {
                'use strict';
                // Universal Module Definition (UMD) to support AMD, CommonJS/Node.js, Rhino, and browsers.

                /* istanbul ignore next */
                if (typeof define === 'function' && define.amd) {
                    define('stackframe', [], factory);
                } else if (typeof exports === 'object') {
                    module.exports = factory();
                } else {
                    root.StackFrame = factory();
                }
            }(this, function() {
                'use strict';

                function _isNumber(n) {
                    return !isNaN(parseFloat(n)) && isFinite(n);
                }

                function _capitalize(str) {
                    return str.charAt(0).toUpperCase() + str.substring(1);
                }

                function _getter(p) {
                    return function() {
                        return this[p];
                    };
                }

                var booleanProps = ['isConstructor', 'isEval', 'isNative', 'isToplevel'];
                var numericProps = ['columnNumber', 'lineNumber'];
                var stringProps = ['fileName', 'functionName', 'source'];
                var arrayProps = ['args'];

                var props = booleanProps.concat(numericProps, stringProps, arrayProps);

                function StackFrame(obj) {
                    if (!obj) return;
                    for (var i = 0; i < props.length; i++) {
                        if (obj[props[i]] !== undefined) {
                            this['set' + _capitalize(props[i])](obj[props[i]]);
                        }
                    }
                }

                StackFrame.prototype = {
                    getArgs: function() {
                        return this.args;
                    },
                    setArgs: function(v) {
                        if (Object.prototype.toString.call(v) !== '[object Array]') {
                            throw new TypeError('Args must be an Array');
                        }
                        this.args = v;
                    },

                    getEvalOrigin: function() {
                        return this.evalOrigin;
                    },
                    setEvalOrigin: function(v) {
                        if (v instanceof StackFrame) {
                            this.evalOrigin = v;
                        } else if (v instanceof Object) {
                            this.evalOrigin = new StackFrame(v);
                        } else {
                            throw new TypeError('Eval Origin must be an Object or StackFrame');
                        }
                    },

                    toString: function() {
                        var fileName = this.getFileName() || '';
                        var lineNumber = this.getLineNumber() || '';
                        var columnNumber = this.getColumnNumber() || '';
                        var functionName = this.getFunctionName() || '';
                        if (this.getIsEval()) {
                            if (fileName) {
                                return '[eval] (' + fileName + ':' + lineNumber + ':' + columnNumber + ')';
                            }
                            return '[eval]:' + lineNumber + ':' + columnNumber;
                        }
                        if (functionName) {
                            return functionName + ' (' + fileName + ':' + lineNumber + ':' + columnNumber + ')';
                        }
                        return fileName + ':' + lineNumber + ':' + columnNumber;
                    }
                };

                StackFrame.fromString = function StackFrame$$fromString(str) {
                    var argsStartIndex = str.indexOf('(');
                    var argsEndIndex = str.lastIndexOf(')');

                    var functionName = str.substring(0, argsStartIndex);
                    var args = str.substring(argsStartIndex + 1, argsEndIndex).split(',');
                    var locationString = str.substring(argsEndIndex + 1);

                    if (locationString.indexOf('@') === 0) {
                        var parts = /@(.+?)(?::(\d+))?(?::(\d+))?$/.exec(locationString, '');
                        var fileName = parts[1];
                        var lineNumber = parts[2];
                        var columnNumber = parts[3];
                    }

                    return new StackFrame({
                        functionName: functionName,
                        args: args || undefined,
                        fileName: fileName,
                        lineNumber: lineNumber || undefined,
                        columnNumber: columnNumber || undefined
                    });
                };

                for (var i = 0; i < booleanProps.length; i++) {
                    StackFrame.prototype['get' + _capitalize(booleanProps[i])] = _getter(booleanProps[i]);
                    StackFrame.prototype['set' + _capitalize(booleanProps[i])] = (function(p) {
                        return function(v) {
                            this[p] = Boolean(v);
                        };
                    })(booleanProps[i]);
                }

                for (var j = 0; j < numericProps.length; j++) {
                    StackFrame.prototype['get' + _capitalize(numericProps[j])] = _getter(numericProps[j]);
                    StackFrame.prototype['set' + _capitalize(numericProps[j])] = (function(p) {
                        return function(v) {
                            if (!_isNumber(v)) {
                                throw new TypeError(p + ' must be a Number');
                            }
                            this[p] = Number(v);
                        };
                    })(numericProps[j]);
                }

                for (var k = 0; k < stringProps.length; k++) {
                    StackFrame.prototype['get' + _capitalize(stringProps[k])] = _getter(stringProps[k]);
                    StackFrame.prototype['set' + _capitalize(stringProps[k])] = (function(p) {
                        return function(v) {
                            this[p] = String(v);
                        };
                    })(stringProps[k]);
                }

                return StackFrame;
            }));

        }, {}],
        3: [function(require, module, exports) {
            (function(process, global) {
                /*!
                 * @overview es6-promise - a tiny implementation of Promises/A+.
                 * @copyright Copyright (c) 2014 Yehuda Katz, Tom Dale, Stefan Penner and contributors (Conversion to ES6 API by Jake Archibald)
                 * @license   Licensed under MIT license
                 *            See https://raw.githubusercontent.com/stefanpenner/es6-promise/master/LICENSE
                 * @version   3.3.1
                 */

                (function(global, factory) {
                    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
                        typeof define === 'function' && define.amd ? define(factory) :
                        (global.ES6Promise = factory());
                }(this, (function() {
                    'use strict';

                    function objectOrFunction(x) {
                        return typeof x === 'function' || typeof x === 'object' && x !== null;
                    }

                    function isFunction(x) {
                        return typeof x === 'function';
                    }

                    var _isArray = undefined;
                    if (!Array.isArray) {
                        _isArray = function(x) {
                            return Object.prototype.toString.call(x) === '[object Array]';
                        };
                    } else {
                        _isArray = Array.isArray;
                    }

                    var isArray = _isArray;

                    var len = 0;
                    var vertxNext = undefined;
                    var customSchedulerFn = undefined;

                    var asap = function asap(callback, arg) {
                        queue[len] = callback;
                        queue[len + 1] = arg;
                        len += 2;
                        if (len === 2) {
                            // If len is 2, that means that we need to schedule an async flush.
                            // If additional callbacks are queued before the queue is flushed, they
                            // will be processed by this flush that we are scheduling.
                            if (customSchedulerFn) {
                                customSchedulerFn(flush);
                            } else {
                                scheduleFlush();
                            }
                        }
                    };

                    function setScheduler(scheduleFn) {
                        customSchedulerFn = scheduleFn;
                    }

                    function setAsap(asapFn) {
                        asap = asapFn;
                    }

                    var browserWindow = typeof window !== 'undefined' ? window : undefined;
                    var browserGlobal = browserWindow || {};
                    var BrowserMutationObserver = browserGlobal.MutationObserver || browserGlobal.WebKitMutationObserver;
                    var isNode = typeof self === 'undefined' && typeof process !== 'undefined' && ({}).toString.call(process) === '[object process]';

                    // test for web worker but not in IE10
                    var isWorker = typeof Uint8ClampedArray !== 'undefined' && typeof importScripts !== 'undefined' && typeof MessageChannel !== 'undefined';

                    // node
                    function useNextTick() {
                        // node version 0.10.x displays a deprecation warning when nextTick is used recursively
                        // see https://github.com/cujojs/when/issues/410 for details
                        return function() {
                            return process.nextTick(flush);
                        };
                    }

                    // vertx
                    function useVertxTimer() {
                        return function() {
                            vertxNext(flush);
                        };
                    }

                    function useMutationObserver() {
                        var iterations = 0;
                        var observer = new BrowserMutationObserver(flush);
                        var node = document.createTextNode('');
                        observer.observe(node, { characterData: true });

                        return function() {
                            node.data = iterations = ++iterations % 2;
                        };
                    }

                    // web worker
                    function useMessageChannel() {
                        var channel = new MessageChannel();
                        channel.port1.onmessage = flush;
                        return function() {
                            return channel.port2.postMessage(0);
                        };
                    }

                    function useSetTimeout() {
                        // Store setTimeout reference so es6-promise will be unaffected by
                        // other code modifying setTimeout (like sinon.useFakeTimers())
                        var globalSetTimeout = setTimeout;
                        return function() {
                            return globalSetTimeout(flush, 1);
                        };
                    }

                    var queue = new Array(1000);

                    function flush() {
                        for (var i = 0; i < len; i += 2) {
                            var callback = queue[i];
                            var arg = queue[i + 1];

                            callback(arg);

                            queue[i] = undefined;
                            queue[i + 1] = undefined;
                        }

                        len = 0;
                    }

                    function attemptVertx() {
                        try {
                            var r = require;
                            var vertx = r('vertx');
                            vertxNext = vertx.runOnLoop || vertx.runOnContext;
                            return useVertxTimer();
                        } catch (e) {
                            return useSetTimeout();
                        }
                    }

                    var scheduleFlush = undefined;
                    // Decide what async method to use to triggering processing of queued callbacks:
                    if (isNode) {
                        scheduleFlush = useNextTick();
                    } else if (BrowserMutationObserver) {
                        scheduleFlush = useMutationObserver();
                    } else if (isWorker) {
                        scheduleFlush = useMessageChannel();
                    } else if (browserWindow === undefined && typeof require === 'function') {
                        scheduleFlush = attemptVertx();
                    } else {
                        scheduleFlush = useSetTimeout();
                    }

                    function then(onFulfillment, onRejection) {
                        var _arguments = arguments;

                        var parent = this;

                        var child = new this.constructor(noop);

                        if (child[PROMISE_ID] === undefined) {
                            makePromise(child);
                        }

                        var _state = parent._state;

                        if (_state) {
                            (function() {
                                var callback = _arguments[_state - 1];
                                asap(function() {
                                    return invokeCallback(_state, child, callback, parent._result);
                                });
                            })();
                        } else {
                            subscribe(parent, child, onFulfillment, onRejection);
                        }

                        return child;
                    }

                    /**
                      `Promise.resolve` returns a promise that will become resolved with the
                      passed `value`. It is shorthand for the following:

                      ```javascript
                      let promise = new Promise(function(resolve, reject){
                        resolve(1);
                      });

                      promise.then(function(value){
                        // value === 1
                      });
                      ```

                      Instead of writing the above, your code now simply becomes the following:

                      ```javascript
                      let promise = Promise.resolve(1);

                      promise.then(function(value){
                        // value === 1
                      });
                      ```

                      @method resolve
                      @static
                      @param {Any} value value that the returned promise will be resolved with
                      Useful for tooling.
                      @return {Promise} a promise that will become fulfilled with the given
                      `value`
                    */
                    function resolve(object) {
                        /*jshint validthis:true */
                        var Constructor = this;

                        if (object && typeof object === 'object' && object.constructor === Constructor) {
                            return object;
                        }

                        var promise = new Constructor(noop);
                        _resolve(promise, object);
                        return promise;
                    }

                    var PROMISE_ID = Math.random().toString(36).substring(16);

                    function noop() {}

                    var PENDING = void 0;
                    var FULFILLED = 1;
                    var REJECTED = 2;

                    var GET_THEN_ERROR = new ErrorObject();

                    function selfFulfillment() {
                        return new TypeError("You cannot resolve a promise with itself");
                    }

                    function cannotReturnOwn() {
                        return new TypeError('A promises callback cannot return that same promise.');
                    }

                    function getThen(promise) {
                        try {
                            return promise.then;
                        } catch (error) {
                            GET_THEN_ERROR.error = error;
                            return GET_THEN_ERROR;
                        }
                    }

                    function tryThen(then, value, fulfillmentHandler, rejectionHandler) {
                        try {
                            then.call(value, fulfillmentHandler, rejectionHandler);
                        } catch (e) {
                            return e;
                        }
                    }

                    function handleForeignThenable(promise, thenable, then) {
                        asap(function(promise) {
                            var sealed = false;
                            var error = tryThen(then, thenable, function(value) {
                                if (sealed) {
                                    return;
                                }
                                sealed = true;
                                if (thenable !== value) {
                                    _resolve(promise, value);
                                } else {
                                    fulfill(promise, value);
                                }
                            }, function(reason) {
                                if (sealed) {
                                    return;
                                }
                                sealed = true;

                                _reject(promise, reason);
                            }, 'Settle: ' + (promise._label || ' unknown promise'));

                            if (!sealed && error) {
                                sealed = true;
                                _reject(promise, error);
                            }
                        }, promise);
                    }

                    function handleOwnThenable(promise, thenable) {
                        if (thenable._state === FULFILLED) {
                            fulfill(promise, thenable._result);
                        } else if (thenable._state === REJECTED) {
                            _reject(promise, thenable._result);
                        } else {
                            subscribe(thenable, undefined, function(value) {
                                return _resolve(promise, value);
                            }, function(reason) {
                                return _reject(promise, reason);
                            });
                        }
                    }

                    function handleMaybeThenable(promise, maybeThenable, then$$) {
                        if (maybeThenable.constructor === promise.constructor && then$$ === then && maybeThenable.constructor.resolve === resolve) {
                            handleOwnThenable(promise, maybeThenable);
                        } else {
                            if (then$$ === GET_THEN_ERROR) {
                                _reject(promise, GET_THEN_ERROR.error);
                            } else if (then$$ === undefined) {
                                fulfill(promise, maybeThenable);
                            } else if (isFunction(then$$)) {
                                handleForeignThenable(promise, maybeThenable, then$$);
                            } else {
                                fulfill(promise, maybeThenable);
                            }
                        }
                    }

                    function _resolve(promise, value) {
                        if (promise === value) {
                            _reject(promise, selfFulfillment());
                        } else if (objectOrFunction(value)) {
                            handleMaybeThenable(promise, value, getThen(value));
                        } else {
                            fulfill(promise, value);
                        }
                    }

                    function publishRejection(promise) {
                        if (promise._onerror) {
                            promise._onerror(promise._result);
                        }

                        publish(promise);
                    }

                    function fulfill(promise, value) {
                        if (promise._state !== PENDING) {
                            return;
                        }

                        promise._result = value;
                        promise._state = FULFILLED;

                        if (promise._subscribers.length !== 0) {
                            asap(publish, promise);
                        }
                    }

                    function _reject(promise, reason) {
                        if (promise._state !== PENDING) {
                            return;
                        }
                        promise._state = REJECTED;
                        promise._result = reason;

                        asap(publishRejection, promise);
                    }

                    function subscribe(parent, child, onFulfillment, onRejection) {
                        var _subscribers = parent._subscribers;
                        var length = _subscribers.length;

                        parent._onerror = null;

                        _subscribers[length] = child;
                        _subscribers[length + FULFILLED] = onFulfillment;
                        _subscribers[length + REJECTED] = onRejection;

                        if (length === 0 && parent._state) {
                            asap(publish, parent);
                        }
                    }

                    function publish(promise) {
                        var subscribers = promise._subscribers;
                        var settled = promise._state;

                        if (subscribers.length === 0) {
                            return;
                        }

                        var child = undefined,
                            callback = undefined,
                            detail = promise._result;

                        for (var i = 0; i < subscribers.length; i += 3) {
                            child = subscribers[i];
                            callback = subscribers[i + settled];

                            if (child) {
                                invokeCallback(settled, child, callback, detail);
                            } else {
                                callback(detail);
                            }
                        }

                        promise._subscribers.length = 0;
                    }

                    function ErrorObject() {
                        this.error = null;
                    }

                    var TRY_CATCH_ERROR = new ErrorObject();

                    function tryCatch(callback, detail) {
                        try {
                            return callback(detail);
                        } catch (e) {
                            TRY_CATCH_ERROR.error = e;
                            return TRY_CATCH_ERROR;
                        }
                    }

                    function invokeCallback(settled, promise, callback, detail) {
                        var hasCallback = isFunction(callback),
                            value = undefined,
                            error = undefined,
                            succeeded = undefined,
                            failed = undefined;

                        if (hasCallback) {
                            value = tryCatch(callback, detail);

                            if (value === TRY_CATCH_ERROR) {
                                failed = true;
                                error = value.error;
                                value = null;
                            } else {
                                succeeded = true;
                            }

                            if (promise === value) {
                                _reject(promise, cannotReturnOwn());
                                return;
                            }
                        } else {
                            value = detail;
                            succeeded = true;
                        }

                        if (promise._state !== PENDING) {
                            // noop
                        } else if (hasCallback && succeeded) {
                            _resolve(promise, value);
                        } else if (failed) {
                            _reject(promise, error);
                        } else if (settled === FULFILLED) {
                            fulfill(promise, value);
                        } else if (settled === REJECTED) {
                            _reject(promise, value);
                        }
                    }

                    function initializePromise(promise, resolver) {
                        try {
                            resolver(function resolvePromise(value) {
                                _resolve(promise, value);
                            }, function rejectPromise(reason) {
                                _reject(promise, reason);
                            });
                        } catch (e) {
                            _reject(promise, e);
                        }
                    }

                    var id = 0;

                    function nextId() {
                        return id++;
                    }

                    function makePromise(promise) {
                        promise[PROMISE_ID] = id++;
                        promise._state = undefined;
                        promise._result = undefined;
                        promise._subscribers = [];
                    }

                    function Enumerator(Constructor, input) {
                        this._instanceConstructor = Constructor;
                        this.promise = new Constructor(noop);

                        if (!this.promise[PROMISE_ID]) {
                            makePromise(this.promise);
                        }

                        if (isArray(input)) {
                            this._input = input;
                            this.length = input.length;
                            this._remaining = input.length;

                            this._result = new Array(this.length);

                            if (this.length === 0) {
                                fulfill(this.promise, this._result);
                            } else {
                                this.length = this.length || 0;
                                this._enumerate();
                                if (this._remaining === 0) {
                                    fulfill(this.promise, this._result);
                                }
                            }
                        } else {
                            _reject(this.promise, validationError());
                        }
                    }

                    function validationError() {
                        return new Error('Array Methods must be provided an Array');
                    };

                    Enumerator.prototype._enumerate = function() {
                        var length = this.length;
                        var _input = this._input;

                        for (var i = 0; this._state === PENDING && i < length; i++) {
                            this._eachEntry(_input[i], i);
                        }
                    };

                    Enumerator.prototype._eachEntry = function(entry, i) {
                        var c = this._instanceConstructor;
                        var resolve$$ = c.resolve;

                        if (resolve$$ === resolve) {
                            var _then = getThen(entry);

                            if (_then === then && entry._state !== PENDING) {
                                this._settledAt(entry._state, i, entry._result);
                            } else if (typeof _then !== 'function') {
                                this._remaining--;
                                this._result[i] = entry;
                            } else if (c === Promise) {
                                var promise = new c(noop);
                                handleMaybeThenable(promise, entry, _then);
                                this._willSettleAt(promise, i);
                            } else {
                                this._willSettleAt(new c(function(resolve$$) {
                                    return resolve$$(entry);
                                }), i);
                            }
                        } else {
                            this._willSettleAt(resolve$$(entry), i);
                        }
                    };

                    Enumerator.prototype._settledAt = function(state, i, value) {
                        var promise = this.promise;

                        if (promise._state === PENDING) {
                            this._remaining--;

                            if (state === REJECTED) {
                                _reject(promise, value);
                            } else {
                                this._result[i] = value;
                            }
                        }

                        if (this._remaining === 0) {
                            fulfill(promise, this._result);
                        }
                    };

                    Enumerator.prototype._willSettleAt = function(promise, i) {
                        var enumerator = this;

                        subscribe(promise, undefined, function(value) {
                            return enumerator._settledAt(FULFILLED, i, value);
                        }, function(reason) {
                            return enumerator._settledAt(REJECTED, i, reason);
                        });
                    };

                    /**
                      `Promise.all` accepts an array of promises, and returns a new promise which
                      is fulfilled with an array of fulfillment values for the passed promises, or
                      rejected with the reason of the first passed promise to be rejected. It casts all
                      elements of the passed iterable to promises as it runs this algorithm.

                      Example:

                      ```javascript
                      let promise1 = resolve(1);
                      let promise2 = resolve(2);
                      let promise3 = resolve(3);
                      let promises = [ promise1, promise2, promise3 ];

                      Promise.all(promises).then(function(array){
                        // The array here would be [ 1, 2, 3 ];
                      });
                      ```

                      If any of the `promises` given to `all` are rejected, the first promise
                      that is rejected will be given as an argument to the returned promises's
                      rejection handler. For example:

                      Example:

                      ```javascript
                      let promise1 = resolve(1);
                      let promise2 = reject(new Error("2"));
                      let promise3 = reject(new Error("3"));
                      let promises = [ promise1, promise2, promise3 ];

                      Promise.all(promises).then(function(array){
                        // Code here never runs because there are rejected promises!
                      }, function(error) {
                        // error.message === "2"
                      });
                      ```

                      @method all
                      @static
                      @param {Array} entries array of promises
                      @param {String} label optional string for labeling the promise.
                      Useful for tooling.
                      @return {Promise} promise that is fulfilled when all `promises` have been
                      fulfilled, or rejected if any of them become rejected.
                      @static
                    */
                    function all(entries) {
                        return new Enumerator(this, entries).promise;
                    }

                    /**
                      `Promise.race` returns a new promise which is settled in the same way as the
                      first passed promise to settle.

                      Example:

                      ```javascript
                      let promise1 = new Promise(function(resolve, reject){
                        setTimeout(function(){
                          resolve('promise 1');
                        }, 200);
                      });

                      let promise2 = new Promise(function(resolve, reject){
                        setTimeout(function(){
                          resolve('promise 2');
                        }, 100);
                      });

                      Promise.race([promise1, promise2]).then(function(result){
                        // result === 'promise 2' because it was resolved before promise1
                        // was resolved.
                      });
                      ```

                      `Promise.race` is deterministic in that only the state of the first
                      settled promise matters. For example, even if other promises given to the
                      `promises` array argument are resolved, but the first settled promise has
                      become rejected before the other promises became fulfilled, the returned
                      promise will become rejected:

                      ```javascript
                      let promise1 = new Promise(function(resolve, reject){
                        setTimeout(function(){
                          resolve('promise 1');
                        }, 200);
                      });

                      let promise2 = new Promise(function(resolve, reject){
                        setTimeout(function(){
                          reject(new Error('promise 2'));
                        }, 100);
                      });

                      Promise.race([promise1, promise2]).then(function(result){
                        // Code here never runs
                      }, function(reason){
                        // reason.message === 'promise 2' because promise 2 became rejected before
                        // promise 1 became fulfilled
                      });
                      ```

                      An example real-world use case is implementing timeouts:

                      ```javascript
                      Promise.race([ajax('foo.json'), timeout(5000)])
                      ```

                      @method race
                      @static
                      @param {Array} promises array of promises to observe
                      Useful for tooling.
                      @return {Promise} a promise which settles in the same way as the first passed
                      promise to settle.
                    */
                    function race(entries) {
                        /*jshint validthis:true */
                        var Constructor = this;

                        if (!isArray(entries)) {
                            return new Constructor(function(_, reject) {
                                return reject(new TypeError('You must pass an array to race.'));
                            });
                        } else {
                            return new Constructor(function(resolve, reject) {
                                var length = entries.length;
                                for (var i = 0; i < length; i++) {
                                    Constructor.resolve(entries[i]).then(resolve, reject);
                                }
                            });
                        }
                    }

                    /**
                      `Promise.reject` returns a promise rejected with the passed `reason`.
                      It is shorthand for the following:

                      ```javascript
                      let promise = new Promise(function(resolve, reject){
                        reject(new Error('WHOOPS'));
                      });

                      promise.then(function(value){
                        // Code here doesn't run because the promise is rejected!
                      }, function(reason){
                        // reason.message === 'WHOOPS'
                      });
                      ```

                      Instead of writing the above, your code now simply becomes the following:

                      ```javascript
                      let promise = Promise.reject(new Error('WHOOPS'));

                      promise.then(function(value){
                        // Code here doesn't run because the promise is rejected!
                      }, function(reason){
                        // reason.message === 'WHOOPS'
                      });
                      ```

                      @method reject
                      @static
                      @param {Any} reason value that the returned promise will be rejected with.
                      Useful for tooling.
                      @return {Promise} a promise rejected with the given `reason`.
                    */
                    function reject(reason) {
                        /*jshint validthis:true */
                        var Constructor = this;
                        var promise = new Constructor(noop);
                        _reject(promise, reason);
                        return promise;
                    }

                    function needsResolver() {
                        throw new TypeError('You must pass a resolver function as the first argument to the promise constructor');
                    }

                    function needsNew() {
                        throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.");
                    }

                    /**
                      Promise objects represent the eventual result of an asynchronous operation. The
                      primary way of interacting with a promise is through its `then` method, which
                      registers callbacks to receive either a promise's eventual value or the reason
                      why the promise cannot be fulfilled.

                      Terminology
                      -----------

                      - `promise` is an object or function with a `then` method whose behavior conforms to this specification.
                      - `thenable` is an object or function that defines a `then` method.
                      - `value` is any legal JavaScript value (including undefined, a thenable, or a promise).
                      - `exception` is a value that is thrown using the throw statement.
                      - `reason` is a value that indicates why a promise was rejected.
                      - `settled` the final resting state of a promise, fulfilled or rejected.

                      A promise can be in one of three states: pending, fulfilled, or rejected.

                      Promises that are fulfilled have a fulfillment value and are in the fulfilled
                      state.  Promises that are rejected have a rejection reason and are in the
                      rejected state.  A fulfillment value is never a thenable.

                      Promises can also be said to *resolve* a value.  If this value is also a
                      promise, then the original promise's settled state will match the value's
                      settled state.  So a promise that *resolves* a promise that rejects will
                      itself reject, and a promise that *resolves* a promise that fulfills will
                      itself fulfill.


                      Basic Usage:
                      ------------

                      ```js
                      let promise = new Promise(function(resolve, reject) {
                        // on success
                        resolve(value);

                        // on failure
                        reject(reason);
                      });

                      promise.then(function(value) {
                        // on fulfillment
                      }, function(reason) {
                        // on rejection
                      });
                      ```

                      Advanced Usage:
                      ---------------

                      Promises shine when abstracting away asynchronous interactions such as
                      `XMLHttpRequest`s.

                      ```js
                      function getJSON(url) {
                        return new Promise(function(resolve, reject){
                          let xhr = new XMLHttpRequest();

                          xhr.open('GET', url);
                          xhr.onreadystatechange = handler;
                          xhr.responseType = 'json';
                          xhr.setRequestHeader('Accept', 'application/json');
                          xhr.send();

                          function handler() {
                            if (this.readyState === this.DONE) {
                              if (this.status === 200) {
                                resolve(this.response);
                              } else {
                                reject(new Error('getJSON: `' + url + '` failed with status: [' + this.status + ']'));
                              }
                            }
                          };
                        });
                      }

                      getJSON('/posts.json').then(function(json) {
                        // on fulfillment
                      }, function(reason) {
                        // on rejection
                      });
                      ```

                      Unlike callbacks, promises are great composable primitives.

                      ```js
                      Promise.all([
                        getJSON('/posts'),
                        getJSON('/comments')
                      ]).then(function(values){
                        values[0] // => postsJSON
                        values[1] // => commentsJSON

                        return values;
                      });
                      ```

                      @class Promise
                      @param {function} resolver
                      Useful for tooling.
                      @constructor
                    */
                    function Promise(resolver) {
                        this[PROMISE_ID] = nextId();
                        this._result = this._state = undefined;
                        this._subscribers = [];

                        if (noop !== resolver) {
                            typeof resolver !== 'function' && needsResolver();
                            this instanceof Promise ? initializePromise(this, resolver) : needsNew();
                        }
                    }

                    Promise.all = all;
                    Promise.race = race;
                    Promise.resolve = resolve;
                    Promise.reject = reject;
                    Promise._setScheduler = setScheduler;
                    Promise._setAsap = setAsap;
                    Promise._asap = asap;

                    Promise.prototype = {
                        constructor: Promise,

                        /**
                          The primary way of interacting with a promise is through its `then` method,
                          which registers callbacks to receive either a promise's eventual value or the
                          reason why the promise cannot be fulfilled.
  
                          ```js
                          findUser().then(function(user){
                            // user is available
                          }, function(reason){
                            // user is unavailable, and you are given the reason why
                          });
                          ```
  
                          Chaining
                          --------
  
                          The return value of `then` is itself a promise.  This second, 'downstream'
                          promise is resolved with the return value of the first promise's fulfillment
                          or rejection handler, or rejected if the handler throws an exception.
  
                          ```js
                          findUser().then(function (user) {
                            return user.name;
                          }, function (reason) {
                            return 'default name';
                          }).then(function (userName) {
                            // If `findUser` fulfilled, `userName` will be the user's name, otherwise it
                            // will be `'default name'`
                          });
  
                          findUser().then(function (user) {
                            throw new Error('Found user, but still unhappy');
                          }, function (reason) {
                            throw new Error('`findUser` rejected and we're unhappy');
                          }).then(function (value) {
                            // never reached
                          }, function (reason) {
                            // if `findUser` fulfilled, `reason` will be 'Found user, but still unhappy'.
                            // If `findUser` rejected, `reason` will be '`findUser` rejected and we're unhappy'.
                          });
                          ```
                          If the downstream promise does not specify a rejection handler, rejection reasons will be propagated further downstream.
  
                          ```js
                          findUser().then(function (user) {
                            throw new PedagogicalException('Upstream error');
                          }).then(function (value) {
                            // never reached
                          }).then(function (value) {
                            // never reached
                          }, function (reason) {
                            // The `PedgagocialException` is propagated all the way down to here
                          });
                          ```
  
                          Assimilation
                          ------------
  
                          Sometimes the value you want to propagate to a downstream promise can only be
                          retrieved asynchronously. This can be achieved by returning a promise in the
                          fulfillment or rejection handler. The downstream promise will then be pending
                          until the returned promise is settled. This is called *assimilation*.
  
                          ```js
                          findUser().then(function (user) {
                            return findCommentsByAuthor(user);
                          }).then(function (comments) {
                            // The user's comments are now available
                          });
                          ```
  
                          If the assimliated promise rejects, then the downstream promise will also reject.
  
                          ```js
                          findUser().then(function (user) {
                            return findCommentsByAuthor(user);
                          }).then(function (comments) {
                            // If `findCommentsByAuthor` fulfills, we'll have the value here
                          }, function (reason) {
                            // If `findCommentsByAuthor` rejects, we'll have the reason here
                          });
                          ```
  
                          Simple Example
                          --------------
  
                          Synchronous Example
  
                          ```javascript
                          let result;
  
                          try {
                            result = findResult();
                            // success
                          } catch(reason) {
                            // failure
                          }
                          ```
  
                          Errback Example
  
                          ```js
                          findResult(function(result, err){
                            if (err) {
                              // failure
                            } else {
                              // success
                            }
                          });
                          ```
  
                          Promise Example;
  
                          ```javascript
                          findResult().then(function(result){
                            // success
                          }, function(reason){
                            // failure
                          });
                          ```
  
                          Advanced Example
                          --------------
  
                          Synchronous Example
  
                          ```javascript
                          let author, books;
  
                          try {
                            author = findAuthor();
                            books  = findBooksByAuthor(author);
                            // success
                          } catch(reason) {
                            // failure
                          }
                          ```
  
                          Errback Example
  
                          ```js
  
                          function foundBooks(books) {
  
                          }
  
                          function failure(reason) {
  
                          }
  
                          findAuthor(function(author, err){
                            if (err) {
                              failure(err);
                              // failure
                            } else {
                              try {
                                findBoooksByAuthor(author, function(books, err) {
                                  if (err) {
                                    failure(err);
                                  } else {
                                    try {
                                      foundBooks(books);
                                    } catch(reason) {
                                      failure(reason);
                                    }
                                  }
                                });
                              } catch(error) {
                                failure(err);
                              }
                              // success
                            }
                          });
                          ```
  
                          Promise Example;
  
                          ```javascript
                          findAuthor().
                            then(findBooksByAuthor).
                            then(function(books){
                              // found books
                          }).catch(function(reason){
                            // something went wrong
                          });
                          ```
  
                          @method then
                          @param {Function} onFulfilled
                          @param {Function} onRejected
                          Useful for tooling.
                          @return {Promise}
                        */
                        then: then,

                        /**
                          `catch` is simply sugar for `then(undefined, onRejection)` which makes it the same
                          as the catch block of a try/catch statement.
  
                          ```js
                          function findAuthor(){
                            throw new Error('couldn't find that author');
                          }
  
                          // synchronous
                          try {
                            findAuthor();
                          } catch(reason) {
                            // something went wrong
                          }
  
                          // async with promises
                          findAuthor().catch(function(reason){
                            // something went wrong
                          });
                          ```
  
                          @method catch
                          @param {Function} onRejection
                          Useful for tooling.
                          @return {Promise}
                        */
                        'catch': function _catch(onRejection) {
                            return this.then(null, onRejection);
                        }
                    };

                    function polyfill() {
                        var local = undefined;

                        if (typeof global !== 'undefined') {
                            local = global;
                        } else if (typeof self !== 'undefined') {
                            local = self;
                        } else {
                            try {
                                local = Function('return this')();
                            } catch (e) {
                                throw new Error('polyfill failed because global object is unavailable in this environment');
                            }
                        }

                        var P = local.Promise;

                        if (P) {
                            var promiseToString = null;
                            try {
                                promiseToString = Object.prototype.toString.call(P.resolve());
                            } catch (e) {
                                // silently ignored
                            }

                            if (promiseToString === '[object Promise]' && !P.cast) {
                                return;
                            }
                        }

                        local.Promise = Promise;
                    }

                    polyfill();
                    // Strange compat..
                    Promise.polyfill = polyfill;
                    Promise.Promise = Promise;

                    return Promise;

                })));

            }).call(this, require('_process'), typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

        }, { "_process": 5 }],
        4: [function(require, module, exports) {
            (function(global) {
                /*! JSON v3.3.2 | http://bestiejs.github.io/json3 | Copyright 2012-2014, Kit Cambridge | http://kit.mit-license.org */
                ;
                (function() {
                    // Detect the `define` function exposed by asynchronous module loaders. The
                    // strict `define` check is necessary for compatibility with `r.js`.
                    var isLoader = typeof define === "function" && define.amd;

                    // A set of types used to distinguish objects from primitives.
                    var objectTypes = {
                        "function": true,
                        "object": true
                    };

                    // Detect the `exports` object exposed by CommonJS implementations.
                    var freeExports = objectTypes[typeof exports] && exports && !exports.nodeType && exports;

                    // Use the `global` object exposed by Node (including Browserify via
                    // `insert-module-globals`), Narwhal, and Ringo as the default context,
                    // and the `window` object in browsers. Rhino exports a `global` function
                    // instead.
                    var root = objectTypes[typeof window] && window || this,
                        freeGlobal = freeExports && objectTypes[typeof module] && module && !module.nodeType && typeof global == "object" && global;

                    if (freeGlobal && (freeGlobal["global"] === freeGlobal || freeGlobal["window"] === freeGlobal || freeGlobal["self"] === freeGlobal)) {
                        root = freeGlobal;
                    }

                    // Public: Initializes JSON 3 using the given `context` object, attaching the
                    // `stringify` and `parse` functions to the specified `exports` object.
                    function runInContext(context, exports) {
                        context || (context = root["Object"]());
                        exports || (exports = root["Object"]());

                        // Native constructor aliases.
                        var Number = context["Number"] || root["Number"],
                            String = context["String"] || root["String"],
                            Object = context["Object"] || root["Object"],
                            Date = context["Date"] || root["Date"],
                            SyntaxError = context["SyntaxError"] || root["SyntaxError"],
                            TypeError = context["TypeError"] || root["TypeError"],
                            Math = context["Math"] || root["Math"],
                            nativeJSON = context["JSON"] || root["JSON"];

                        // Delegate to the native `stringify` and `parse` implementations.
                        if (typeof nativeJSON == "object" && nativeJSON) {
                            exports.stringify = nativeJSON.stringify;
                            exports.parse = nativeJSON.parse;
                        }

                        // Convenience aliases.
                        var objectProto = Object.prototype,
                            getClass = objectProto.toString,
                            isProperty, forEach, undef;

                        // Test the `Date#getUTC*` methods. Based on work by @Yaffle.
                        var isExtended = new Date(-3509827334573292);
                        try {
                            // The `getUTCFullYear`, `Month`, and `Date` methods return nonsensical
                            // results for certain dates in Opera >= 10.53.
                            isExtended = isExtended.getUTCFullYear() == -109252 && isExtended.getUTCMonth() === 0 && isExtended.getUTCDate() === 1 &&
                                // Safari < 2.0.2 stores the internal millisecond time value correctly,
                                // but clips the values returned by the date methods to the range of
                                // signed 32-bit integers ([-2 ** 31, 2 ** 31 - 1]).
                                isExtended.getUTCHours() == 10 && isExtended.getUTCMinutes() == 37 && isExtended.getUTCSeconds() == 6 && isExtended.getUTCMilliseconds() == 708;
                        } catch (exception) {}

                        // Internal: Determines whether the native `JSON.stringify` and `parse`
                        // implementations are spec-compliant. Based on work by Ken Snyder.
                        function has(name) {
                            if (has[name] !== undef) {
                                // Return cached feature test result.
                                return has[name];
                            }
                            var isSupported;
                            if (name == "bug-string-char-index") {
                                // IE <= 7 doesn't support accessing string characters using square
                                // bracket notation. IE 8 only supports this for primitives.
                                isSupported = "a" [0] != "a";
                            } else if (name == "json") {
                                // Indicates whether both `JSON.stringify` and `JSON.parse` are
                                // supported.
                                isSupported = has("json-stringify") && has("json-parse");
                            } else {
                                var value, serialized = '{"a":[1,true,false,null,"\\u0000\\b\\n\\f\\r\\t"]}';
                                // Test `JSON.stringify`.
                                if (name == "json-stringify") {
                                    var stringify = exports.stringify,
                                        stringifySupported = typeof stringify == "function" && isExtended;
                                    if (stringifySupported) {
                                        // A test function object with a custom `toJSON` method.
                                        (value = function() {
                                            return 1;
                                        }).toJSON = value;
                                        try {
                                            stringifySupported =
                                                // Firefox 3.1b1 and b2 serialize string, number, and boolean
                                                // primitives as object literals.
                                                stringify(0) === "0" &&
                                                // FF 3.1b1, b2, and JSON 2 serialize wrapped primitives as object
                                                // literals.
                                                stringify(new Number()) === "0" &&
                                                stringify(new String()) == '""' &&
                                                // FF 3.1b1, 2 throw an error if the value is `null`, `undefined`, or
                                                // does not define a canonical JSON representation (this applies to
                                                // objects with `toJSON` properties as well, *unless* they are nested
                                                // within an object or array).
                                                stringify(getClass) === undef &&
                                                // IE 8 serializes `undefined` as `"undefined"`. Safari <= 5.1.7 and
                                                // FF 3.1b3 pass this test.
                                                stringify(undef) === undef &&
                                                // Safari <= 5.1.7 and FF 3.1b3 throw `Error`s and `TypeError`s,
                                                // respectively, if the value is omitted entirely.
                                                stringify() === undef &&
                                                // FF 3.1b1, 2 throw an error if the given value is not a number,
                                                // string, array, object, Boolean, or `null` literal. This applies to
                                                // objects with custom `toJSON` methods as well, unless they are nested
                                                // inside object or array literals. YUI 3.0.0b1 ignores custom `toJSON`
                                                // methods entirely.
                                                stringify(value) === "1" &&
                                                stringify([value]) == "[1]" &&
                                                // Prototype <= 1.6.1 serializes `[undefined]` as `"[]"` instead of
                                                // `"[null]"`.
                                                stringify([undef]) == "[null]" &&
                                                // YUI 3.0.0b1 fails to serialize `null` literals.
                                                stringify(null) == "null" &&
                                                // FF 3.1b1, 2 halts serialization if an array contains a function:
                                                // `[1, true, getClass, 1]` serializes as "[1,true,],". FF 3.1b3
                                                // elides non-JSON values from objects and arrays, unless they
                                                // define custom `toJSON` methods.
                                                stringify([undef, getClass, null]) == "[null,null,null]" &&
                                                // Simple serialization test. FF 3.1b1 uses Unicode escape sequences
                                                // where character escape codes are expected (e.g., `\b` => `\u0008`).
                                                stringify({ "a": [value, true, false, null, "\x00\b\n\f\r\t"] }) == serialized &&
                                                // FF 3.1b1 and b2 ignore the `filter` and `width` arguments.
                                                stringify(null, value) === "1" &&
                                                stringify([1, 2], null, 1) == "[\n 1,\n 2\n]" &&
                                                // JSON 2, Prototype <= 1.7, and older WebKit builds incorrectly
                                                // serialize extended years.
                                                stringify(new Date(-8.64e15)) == '"-271821-04-20T00:00:00.000Z"' &&
                                                // The milliseconds are optional in ES 5, but required in 5.1.
                                                stringify(new Date(8.64e15)) == '"+275760-09-13T00:00:00.000Z"' &&
                                                // Firefox <= 11.0 incorrectly serializes years prior to 0 as negative
                                                // four-digit years instead of six-digit years. Credits: @Yaffle.
                                                stringify(new Date(-621987552e5)) == '"-000001-01-01T00:00:00.000Z"' &&
                                                // Safari <= 5.1.5 and Opera >= 10.53 incorrectly serialize millisecond
                                                // values less than 1000. Credits: @Yaffle.
                                                stringify(new Date(-1)) == '"1969-12-31T23:59:59.999Z"';
                                        } catch (exception) {
                                            stringifySupported = false;
                                        }
                                    }
                                    isSupported = stringifySupported;
                                }
                                // Test `JSON.parse`.
                                if (name == "json-parse") {
                                    var parse = exports.parse;
                                    if (typeof parse == "function") {
                                        try {
                                            // FF 3.1b1, b2 will throw an exception if a bare literal is provided.
                                            // Conforming implementations should also coerce the initial argument to
                                            // a string prior to parsing.
                                            if (parse("0") === 0 && !parse(false)) {
                                                // Simple parsing test.
                                                value = parse(serialized);
                                                var parseSupported = value["a"].length == 5 && value["a"][0] === 1;
                                                if (parseSupported) {
                                                    try {
                                                        // Safari <= 5.1.2 and FF 3.1b1 allow unescaped tabs in strings.
                                                        parseSupported = !parse('"\t"');
                                                    } catch (exception) {}
                                                    if (parseSupported) {
                                                        try {
                                                            // FF 4.0 and 4.0.1 allow leading `+` signs and leading
                                                            // decimal points. FF 4.0, 4.0.1, and IE 9-10 also allow
                                                            // certain octal literals.
                                                            parseSupported = parse("01") !== 1;
                                                        } catch (exception) {}
                                                    }
                                                    if (parseSupported) {
                                                        try {
                                                            // FF 4.0, 4.0.1, and Rhino 1.7R3-R4 allow trailing decimal
                                                            // points. These environments, along with FF 3.1b1 and 2,
                                                            // also allow trailing commas in JSON objects and arrays.
                                                            parseSupported = parse("1.") !== 1;
                                                        } catch (exception) {}
                                                    }
                                                }
                                            }
                                        } catch (exception) {
                                            parseSupported = false;
                                        }
                                    }
                                    isSupported = parseSupported;
                                }
                            }
                            return has[name] = !!isSupported;
                        }

                        if (!has("json")) {
                            // Common `[[Class]]` name aliases.
                            var functionClass = "[object Function]",
                                dateClass = "[object Date]",
                                numberClass = "[object Number]",
                                stringClass = "[object String]",
                                arrayClass = "[object Array]",
                                booleanClass = "[object Boolean]";

                            // Detect incomplete support for accessing string characters by index.
                            var charIndexBuggy = has("bug-string-char-index");

                            // Define additional utility methods if the `Date` methods are buggy.
                            if (!isExtended) {
                                var floor = Math.floor;
                                // A mapping between the months of the year and the number of days between
                                // January 1st and the first of the respective month.
                                var Months = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
                                // Internal: Calculates the number of days between the Unix epoch and the
                                // first day of the given month.
                                var getDay = function(year, month) {
                                    return Months[month] + 365 * (year - 1970) + floor((year - 1969 + (month = +(month > 1))) / 4) - floor((year - 1901 + month) / 100) + floor((year - 1601 + month) / 400);
                                };
                            }

                            // Internal: Determines if a property is a direct property of the given
                            // object. Delegates to the native `Object#hasOwnProperty` method.
                            if (!(isProperty = objectProto.hasOwnProperty)) {
                                isProperty = function(property) {
                                    var members = {},
                                        constructor;
                                    if ((members.__proto__ = null, members.__proto__ = {
                                            // The *proto* property cannot be set multiple times in recent
                                            // versions of Firefox and SeaMonkey.
                                            "toString": 1
                                        }, members).toString != getClass) {
                                        // Safari <= 2.0.3 doesn't implement `Object#hasOwnProperty`, but
                                        // supports the mutable *proto* property.
                                        isProperty = function(property) {
                                            // Capture and break the object's prototype chain (see section 8.6.2
                                            // of the ES 5.1 spec). The parenthesized expression prevents an
                                            // unsafe transformation by the Closure Compiler.
                                            var original = this.__proto__,
                                                result = property in (this.__proto__ = null, this);
                                            // Restore the original prototype chain.
                                            this.__proto__ = original;
                                            return result;
                                        };
                                    } else {
                                        // Capture a reference to the top-level `Object` constructor.
                                        constructor = members.constructor;
                                        // Use the `constructor` property to simulate `Object#hasOwnProperty` in
                                        // other environments.
                                        isProperty = function(property) {
                                            var parent = (this.constructor || constructor).prototype;
                                            return property in this && !(property in parent && this[property] === parent[property]);
                                        };
                                    }
                                    members = null;
                                    return isProperty.call(this, property);
                                };
                            }

                            // Internal: Normalizes the `for...in` iteration algorithm across
                            // environments. Each enumerated key is yielded to a `callback` function.
                            forEach = function(object, callback) {
                                var size = 0,
                                    Properties, members, property;

                                // Tests for bugs in the current environment's `for...in` algorithm. The
                                // `valueOf` property inherits the non-enumerable flag from
                                // `Object.prototype` in older versions of IE, Netscape, and Mozilla.
                                (Properties = function() {
                                    this.valueOf = 0;
                                }).prototype.valueOf = 0;

                                // Iterate over a new instance of the `Properties` class.
                                members = new Properties();
                                for (property in members) {
                                    // Ignore all properties inherited from `Object.prototype`.
                                    if (isProperty.call(members, property)) {
                                        size++;
                                    }
                                }
                                Properties = members = null;

                                // Normalize the iteration algorithm.
                                if (!size) {
                                    // A list of non-enumerable properties inherited from `Object.prototype`.
                                    members = ["valueOf", "toString", "toLocaleString", "propertyIsEnumerable", "isPrototypeOf", "hasOwnProperty", "constructor"];
                                    // IE <= 8, Mozilla 1.0, and Netscape 6.2 ignore shadowed non-enumerable
                                    // properties.
                                    forEach = function(object, callback) {
                                        var isFunction = getClass.call(object) == functionClass,
                                            property, length;
                                        var hasProperty = !isFunction && typeof object.constructor != "function" && objectTypes[typeof object.hasOwnProperty] && object.hasOwnProperty || isProperty;
                                        for (property in object) {
                                            // Gecko <= 1.0 enumerates the `prototype` property of functions under
                                            // certain conditions; IE does not.
                                            if (!(isFunction && property == "prototype") && hasProperty.call(object, property)) {
                                                callback(property);
                                            }
                                        }
                                        // Manually invoke the callback for each non-enumerable property.
                                        for (length = members.length; property = members[--length]; hasProperty.call(object, property) && callback(property));
                                    };
                                } else if (size == 2) {
                                    // Safari <= 2.0.4 enumerates shadowed properties twice.
                                    forEach = function(object, callback) {
                                        // Create a set of iterated properties.
                                        var members = {},
                                            isFunction = getClass.call(object) == functionClass,
                                            property;
                                        for (property in object) {
                                            // Store each property name to prevent double enumeration. The
                                            // `prototype` property of functions is not enumerated due to cross-
                                            // environment inconsistencies.
                                            if (!(isFunction && property == "prototype") && !isProperty.call(members, property) && (members[property] = 1) && isProperty.call(object, property)) {
                                                callback(property);
                                            }
                                        }
                                    };
                                } else {
                                    // No bugs detected; use the standard `for...in` algorithm.
                                    forEach = function(object, callback) {
                                        var isFunction = getClass.call(object) == functionClass,
                                            property, isConstructor;
                                        for (property in object) {
                                            if (!(isFunction && property == "prototype") && isProperty.call(object, property) && !(isConstructor = property === "constructor")) {
                                                callback(property);
                                            }
                                        }
                                        // Manually invoke the callback for the `constructor` property due to
                                        // cross-environment inconsistencies.
                                        if (isConstructor || isProperty.call(object, (property = "constructor"))) {
                                            callback(property);
                                        }
                                    };
                                }
                                return forEach(object, callback);
                            };

                            // Public: Serializes a JavaScript `value` as a JSON string. The optional
                            // `filter` argument may specify either a function that alters how object and
                            // array members are serialized, or an array of strings and numbers that
                            // indicates which properties should be serialized. The optional `width`
                            // argument may be either a string or number that specifies the indentation
                            // level of the output.
                            if (!has("json-stringify")) {
                                // Internal: A map of control characters and their escaped equivalents.
                                var Escapes = {
                                    92: "\\\\",
                                    34: '\\"',
                                    8: "\\b",
                                    12: "\\f",
                                    10: "\\n",
                                    13: "\\r",
                                    9: "\\t"
                                };

                                // Internal: Converts `value` into a zero-padded string such that its
                                // length is at least equal to `width`. The `width` must be <= 6.
                                var leadingZeroes = "000000";
                                var toPaddedString = function(width, value) {
                                    // The `|| 0` expression is necessary to work around a bug in
                                    // Opera <= 7.54u2 where `0 == -0`, but `String(-0) !== "0"`.
                                    return (leadingZeroes + (value || 0)).slice(-width);
                                };

                                // Internal: Double-quotes a string `value`, replacing all ASCII control
                                // characters (characters with code unit values between 0 and 31) with
                                // their escaped equivalents. This is an implementation of the
                                // `Quote(value)` operation defined in ES 5.1 section 15.12.3.
                                var unicodePrefix = "\\u00";
                                var quote = function(value) {
                                    var result = '"',
                                        index = 0,
                                        length = value.length,
                                        useCharIndex = !charIndexBuggy || length > 10;
                                    var symbols = useCharIndex && (charIndexBuggy ? value.split("") : value);
                                    for (; index < length; index++) {
                                        var charCode = value.charCodeAt(index);
                                        // If the character is a control character, append its Unicode or
                                        // shorthand escape sequence; otherwise, append the character as-is.
                                        switch (charCode) {
                                            case 8:
                                            case 9:
                                            case 10:
                                            case 12:
                                            case 13:
                                            case 34:
                                            case 92:
                                                result += Escapes[charCode];
                                                break;
                                            default:
                                                if (charCode < 32) {
                                                    result += unicodePrefix + toPaddedString(2, charCode.toString(16));
                                                    break;
                                                }
                                                result += useCharIndex ? symbols[index] : value.charAt(index);
                                        }
                                    }
                                    return result + '"';
                                };

                                // Internal: Recursively serializes an object. Implements the
                                // `Str(key, holder)`, `JO(value)`, and `JA(value)` operations.
                                var serialize = function(property, object, callback, properties, whitespace, indentation, stack) {
                                    var value, className, year, month, date, time, hours, minutes, seconds, milliseconds, results, element, index, length, prefix, result;
                                    try {
                                        // Necessary for host object support.
                                        value = object[property];
                                    } catch (exception) {}
                                    if (typeof value == "object" && value) {
                                        className = getClass.call(value);
                                        if (className == dateClass && !isProperty.call(value, "toJSON")) {
                                            if (value > -1 / 0 && value < 1 / 0) {
                                                // Dates are serialized according to the `Date#toJSON` method
                                                // specified in ES 5.1 section 15.9.5.44. See section 15.9.1.15
                                                // for the ISO 8601 date time string format.
                                                if (getDay) {
                                                    // Manually compute the year, month, date, hours, minutes,
                                                    // seconds, and milliseconds if the `getUTC*` methods are
                                                    // buggy. Adapted from @Yaffle's `date-shim` project.
                                                    date = floor(value / 864e5);
                                                    for (year = floor(date / 365.2425) + 1970 - 1; getDay(year + 1, 0) <= date; year++);
                                                    for (month = floor((date - getDay(year, 0)) / 30.42); getDay(year, month + 1) <= date; month++);
                                                    date = 1 + date - getDay(year, month);
                                                    // The `time` value specifies the time within the day (see ES
                                                    // 5.1 section 15.9.1.2). The formula `(A % B + B) % B` is used
                                                    // to compute `A modulo B`, as the `%` operator does not
                                                    // correspond to the `modulo` operation for negative numbers.
                                                    time = (value % 864e5 + 864e5) % 864e5;
                                                    // The hours, minutes, seconds, and milliseconds are obtained by
                                                    // decomposing the time within the day. See section 15.9.1.10.
                                                    hours = floor(time / 36e5) % 24;
                                                    minutes = floor(time / 6e4) % 60;
                                                    seconds = floor(time / 1e3) % 60;
                                                    milliseconds = time % 1e3;
                                                } else {
                                                    year = value.getUTCFullYear();
                                                    month = value.getUTCMonth();
                                                    date = value.getUTCDate();
                                                    hours = value.getUTCHours();
                                                    minutes = value.getUTCMinutes();
                                                    seconds = value.getUTCSeconds();
                                                    milliseconds = value.getUTCMilliseconds();
                                                }
                                                // Serialize extended years correctly.
                                                value = (year <= 0 || year >= 1e4 ? (year < 0 ? "-" : "+") + toPaddedString(6, year < 0 ? -year : year) : toPaddedString(4, year)) +
                                                    "-" + toPaddedString(2, month + 1) + "-" + toPaddedString(2, date) +
                                                    // Months, dates, hours, minutes, and seconds should have two
                                                    // digits; milliseconds should have three.
                                                    "T" + toPaddedString(2, hours) + ":" + toPaddedString(2, minutes) + ":" + toPaddedString(2, seconds) +
                                                    // Milliseconds are optional in ES 5.0, but required in 5.1.
                                                    "." + toPaddedString(3, milliseconds) + "Z";
                                            } else {
                                                value = null;
                                            }
                                        } else if (typeof value.toJSON == "function" && ((className != numberClass && className != stringClass && className != arrayClass) || isProperty.call(value, "toJSON"))) {
                                            // Prototype <= 1.6.1 adds non-standard `toJSON` methods to the
                                            // `Number`, `String`, `Date`, and `Array` prototypes. JSON 3
                                            // ignores all `toJSON` methods on these objects unless they are
                                            // defined directly on an instance.
                                            value = value.toJSON(property);
                                        }
                                    }
                                    if (callback) {
                                        // If a replacement function was provided, call it to obtain the value
                                        // for serialization.
                                        value = callback.call(object, property, value);
                                    }
                                    if (value === null) {
                                        return "null";
                                    }
                                    className = getClass.call(value);
                                    if (className == booleanClass) {
                                        // Booleans are represented literally.
                                        return "" + value;
                                    } else if (className == numberClass) {
                                        // JSON numbers must be finite. `Infinity` and `NaN` are serialized as
                                        // `"null"`.
                                        return value > -1 / 0 && value < 1 / 0 ? "" + value : "null";
                                    } else if (className == stringClass) {
                                        // Strings are double-quoted and escaped.
                                        return quote("" + value);
                                    }
                                    // Recursively serialize objects and arrays.
                                    if (typeof value == "object") {
                                        // Check for cyclic structures. This is a linear search; performance
                                        // is inversely proportional to the number of unique nested objects.
                                        for (length = stack.length; length--;) {
                                            if (stack[length] === value) {
                                                // Cyclic structures cannot be serialized by `JSON.stringify`.
                                                throw TypeError();
                                            }
                                        }
                                        // Add the object to the stack of traversed objects.
                                        stack.push(value);
                                        results = [];
                                        // Save the current indentation level and indent one additional level.
                                        prefix = indentation;
                                        indentation += whitespace;
                                        if (className == arrayClass) {
                                            // Recursively serialize array elements.
                                            for (index = 0, length = value.length; index < length; index++) {
                                                element = serialize(index, value, callback, properties, whitespace, indentation, stack);
                                                results.push(element === undef ? "null" : element);
                                            }
                                            result = results.length ? (whitespace ? "[\n" + indentation + results.join(",\n" + indentation) + "\n" + prefix + "]" : ("[" + results.join(",") + "]")) : "[]";
                                        } else {
                                            // Recursively serialize object members. Members are selected from
                                            // either a user-specified list of property names, or the object
                                            // itself.
                                            forEach(properties || value, function(property) {
                                                var element = serialize(property, value, callback, properties, whitespace, indentation, stack);
                                                if (element !== undef) {
                                                    // According to ES 5.1 section 15.12.3: "If `gap` {whitespace}
                                                    // is not the empty string, let `member` {quote(property) + ":"}
                                                    // be the concatenation of `member` and the `space` character."
                                                    // The "`space` character" refers to the literal space
                                                    // character, not the `space` {width} argument provided to
                                                    // `JSON.stringify`.
                                                    results.push(quote(property) + ":" + (whitespace ? " " : "") + element);
                                                }
                                            });
                                            result = results.length ? (whitespace ? "{\n" + indentation + results.join(",\n" + indentation) + "\n" + prefix + "}" : ("{" + results.join(",") + "}")) : "{}";
                                        }
                                        // Remove the object from the traversed object stack.
                                        stack.pop();
                                        return result;
                                    }
                                };

                                // Public: `JSON.stringify`. See ES 5.1 section 15.12.3.
                                exports.stringify = function(source, filter, width) {
                                    var whitespace, callback, properties, className;
                                    if (objectTypes[typeof filter] && filter) {
                                        if ((className = getClass.call(filter)) == functionClass) {
                                            callback = filter;
                                        } else if (className == arrayClass) {
                                            // Convert the property names array into a makeshift set.
                                            properties = {};
                                            for (var index = 0, length = filter.length, value; index < length; value = filter[index++], ((className = getClass.call(value)), className == stringClass || className == numberClass) && (properties[value] = 1));
                                        }
                                    }
                                    if (width) {
                                        if ((className = getClass.call(width)) == numberClass) {
                                            // Convert the `width` to an integer and create a string containing
                                            // `width` number of space characters.
                                            if ((width -= width % 1) > 0) {
                                                for (whitespace = "", width > 10 && (width = 10); whitespace.length < width; whitespace += " ");
                                            }
                                        } else if (className == stringClass) {
                                            whitespace = width.length <= 10 ? width : width.slice(0, 10);
                                        }
                                    }
                                    // Opera <= 7.54u2 discards the values associated with empty string keys
                                    // (`""`) only if they are used directly within an object member list
                                    // (e.g., `!("" in { "": 1})`).
                                    return serialize("", (value = {}, value[""] = source, value), callback, properties, whitespace, "", []);
                                };
                            }

                            // Public: Parses a JSON source string.
                            if (!has("json-parse")) {
                                var fromCharCode = String.fromCharCode;

                                // Internal: A map of escaped control characters and their unescaped
                                // equivalents.
                                var Unescapes = {
                                    92: "\\",
                                    34: '"',
                                    47: "/",
                                    98: "\b",
                                    116: "\t",
                                    110: "\n",
                                    102: "\f",
                                    114: "\r"
                                };

                                // Internal: Stores the parser state.
                                var Index, Source;

                                // Internal: Resets the parser state and throws a `SyntaxError`.
                                var abort = function() {
                                    Index = Source = null;
                                    throw SyntaxError();
                                };

                                // Internal: Returns the next token, or `"$"` if the parser has reached
                                // the end of the source string. A token may be a string, number, `null`
                                // literal, or Boolean literal.
                                var lex = function() {
                                    var source = Source,
                                        length = source.length,
                                        value, begin, position, isSigned, charCode;
                                    while (Index < length) {
                                        charCode = source.charCodeAt(Index);
                                        switch (charCode) {
                                            case 9:
                                            case 10:
                                            case 13:
                                            case 32:
                                                // Skip whitespace tokens, including tabs, carriage returns, line
                                                // feeds, and space characters.
                                                Index++;
                                                break;
                                            case 123:
                                            case 125:
                                            case 91:
                                            case 93:
                                            case 58:
                                            case 44:
                                                // Parse a punctuator token (`{`, `}`, `[`, `]`, `:`, or `,`) at
                                                // the current position.
                                                value = charIndexBuggy ? source.charAt(Index) : source[Index];
                                                Index++;
                                                return value;
                                            case 34:
                                                // `"` delimits a JSON string; advance to the next character and
                                                // begin parsing the string. String tokens are prefixed with the
                                                // sentinel `@` character to distinguish them from punctuators and
                                                // end-of-string tokens.
                                                for (value = "@", Index++; Index < length;) {
                                                    charCode = source.charCodeAt(Index);
                                                    if (charCode < 32) {
                                                        // Unescaped ASCII control characters (those with a code unit
                                                        // less than the space character) are not permitted.
                                                        abort();
                                                    } else if (charCode == 92) {
                                                        // A reverse solidus (`\`) marks the beginning of an escaped
                                                        // control character (including `"`, `\`, and `/`) or Unicode
                                                        // escape sequence.
                                                        charCode = source.charCodeAt(++Index);
                                                        switch (charCode) {
                                                            case 92:
                                                            case 34:
                                                            case 47:
                                                            case 98:
                                                            case 116:
                                                            case 110:
                                                            case 102:
                                                            case 114:
                                                                // Revive escaped control characters.
                                                                value += Unescapes[charCode];
                                                                Index++;
                                                                break;
                                                            case 117:
                                                                // `\u` marks the beginning of a Unicode escape sequence.
                                                                // Advance to the first character and validate the
                                                                // four-digit code point.
                                                                begin = ++Index;
                                                                for (position = Index + 4; Index < position; Index++) {
                                                                    charCode = source.charCodeAt(Index);
                                                                    // A valid sequence comprises four hexdigits (case-
                                                                    // insensitive) that form a single hexadecimal value.
                                                                    if (!(charCode >= 48 && charCode <= 57 || charCode >= 97 && charCode <= 102 || charCode >= 65 && charCode <= 70)) {
                                                                        // Invalid Unicode escape sequence.
                                                                        abort();
                                                                    }
                                                                }
                                                                // Revive the escaped character.
                                                                value += fromCharCode("0x" + source.slice(begin, Index));
                                                                break;
                                                            default:
                                                                // Invalid escape sequence.
                                                                abort();
                                                        }
                                                    } else {
                                                        if (charCode == 34) {
                                                            // An unescaped double-quote character marks the end of the
                                                            // string.
                                                            break;
                                                        }
                                                        charCode = source.charCodeAt(Index);
                                                        begin = Index;
                                                        // Optimize for the common case where a string is valid.
                                                        while (charCode >= 32 && charCode != 92 && charCode != 34) {
                                                            charCode = source.charCodeAt(++Index);
                                                        }
                                                        // Append the string as-is.
                                                        value += source.slice(begin, Index);
                                                    }
                                                }
                                                if (source.charCodeAt(Index) == 34) {
                                                    // Advance to the next character and return the revived string.
                                                    Index++;
                                                    return value;
                                                }
                                                // Unterminated string.
                                                abort();
                                            default:
                                                // Parse numbers and literals.
                                                begin = Index;
                                                // Advance past the negative sign, if one is specified.
                                                if (charCode == 45) {
                                                    isSigned = true;
                                                    charCode = source.charCodeAt(++Index);
                                                }
                                                // Parse an integer or floating-point value.
                                                if (charCode >= 48 && charCode <= 57) {
                                                    // Leading zeroes are interpreted as octal literals.
                                                    if (charCode == 48 && ((charCode = source.charCodeAt(Index + 1)), charCode >= 48 && charCode <= 57)) {
                                                        // Illegal octal literal.
                                                        abort();
                                                    }
                                                    isSigned = false;
                                                    // Parse the integer component.
                                                    for (; Index < length && ((charCode = source.charCodeAt(Index)), charCode >= 48 && charCode <= 57); Index++);
                                                    // Floats cannot contain a leading decimal point; however, this
                                                    // case is already accounted for by the parser.
                                                    if (source.charCodeAt(Index) == 46) {
                                                        position = ++Index;
                                                        // Parse the decimal component.
                                                        for (; position < length && ((charCode = source.charCodeAt(position)), charCode >= 48 && charCode <= 57); position++);
                                                        if (position == Index) {
                                                            // Illegal trailing decimal.
                                                            abort();
                                                        }
                                                        Index = position;
                                                    }
                                                    // Parse exponents. The `e` denoting the exponent is
                                                    // case-insensitive.
                                                    charCode = source.charCodeAt(Index);
                                                    if (charCode == 101 || charCode == 69) {
                                                        charCode = source.charCodeAt(++Index);
                                                        // Skip past the sign following the exponent, if one is
                                                        // specified.
                                                        if (charCode == 43 || charCode == 45) {
                                                            Index++;
                                                        }
                                                        // Parse the exponential component.
                                                        for (position = Index; position < length && ((charCode = source.charCodeAt(position)), charCode >= 48 && charCode <= 57); position++);
                                                        if (position == Index) {
                                                            // Illegal empty exponent.
                                                            abort();
                                                        }
                                                        Index = position;
                                                    }
                                                    // Coerce the parsed value to a JavaScript number.
                                                    return +source.slice(begin, Index);
                                                }
                                                // A negative sign may only precede numbers.
                                                if (isSigned) {
                                                    abort();
                                                }
                                                // `true`, `false`, and `null` literals.
                                                if (source.slice(Index, Index + 4) == "true") {
                                                    Index += 4;
                                                    return true;
                                                } else if (source.slice(Index, Index + 5) == "false") {
                                                    Index += 5;
                                                    return false;
                                                } else if (source.slice(Index, Index + 4) == "null") {
                                                    Index += 4;
                                                    return null;
                                                }
                                                // Unrecognized token.
                                                abort();
                                        }
                                    }
                                    // Return the sentinel `$` character if the parser has reached the end
                                    // of the source string.
                                    return "$";
                                };

                                // Internal: Parses a JSON `value` token.
                                var get = function(value) {
                                    var results, hasMembers;
                                    if (value == "$") {
                                        // Unexpected end of input.
                                        abort();
                                    }
                                    if (typeof value == "string") {
                                        if ((charIndexBuggy ? value.charAt(0) : value[0]) == "@") {
                                            // Remove the sentinel `@` character.
                                            return value.slice(1);
                                        }
                                        // Parse object and array literals.
                                        if (value == "[") {
                                            // Parses a JSON array, returning a new JavaScript array.
                                            results = [];
                                            for (;; hasMembers || (hasMembers = true)) {
                                                value = lex();
                                                // A closing square bracket marks the end of the array literal.
                                                if (value == "]") {
                                                    break;
                                                }
                                                // If the array literal contains elements, the current token
                                                // should be a comma separating the previous element from the
                                                // next.
                                                if (hasMembers) {
                                                    if (value == ",") {
                                                        value = lex();
                                                        if (value == "]") {
                                                            // Unexpected trailing `,` in array literal.
                                                            abort();
                                                        }
                                                    } else {
                                                        // A `,` must separate each array element.
                                                        abort();
                                                    }
                                                }
                                                // Elisions and leading commas are not permitted.
                                                if (value == ",") {
                                                    abort();
                                                }
                                                results.push(get(value));
                                            }
                                            return results;
                                        } else if (value == "{") {
                                            // Parses a JSON object, returning a new JavaScript object.
                                            results = {};
                                            for (;; hasMembers || (hasMembers = true)) {
                                                value = lex();
                                                // A closing curly brace marks the end of the object literal.
                                                if (value == "}") {
                                                    break;
                                                }
                                                // If the object literal contains members, the current token
                                                // should be a comma separator.
                                                if (hasMembers) {
                                                    if (value == ",") {
                                                        value = lex();
                                                        if (value == "}") {
                                                            // Unexpected trailing `,` in object literal.
                                                            abort();
                                                        }
                                                    } else {
                                                        // A `,` must separate each object member.
                                                        abort();
                                                    }
                                                }
                                                // Leading commas are not permitted, object property names must be
                                                // double-quoted strings, and a `:` must separate each property
                                                // name and value.
                                                if (value == "," || typeof value != "string" || (charIndexBuggy ? value.charAt(0) : value[0]) != "@" || lex() != ":") {
                                                    abort();
                                                }
                                                results[value.slice(1)] = get(lex());
                                            }
                                            return results;
                                        }
                                        // Unexpected token encountered.
                                        abort();
                                    }
                                    return value;
                                };

                                // Internal: Updates a traversed object member.
                                var update = function(source, property, callback) {
                                    var element = walk(source, property, callback);
                                    if (element === undef) {
                                        delete source[property];
                                    } else {
                                        source[property] = element;
                                    }
                                };

                                // Internal: Recursively traverses a parsed JSON object, invoking the
                                // `callback` function for each value. This is an implementation of the
                                // `Walk(holder, name)` operation defined in ES 5.1 section 15.12.2.
                                var walk = function(source, property, callback) {
                                    var value = source[property],
                                        length;
                                    if (typeof value == "object" && value) {
                                        // `forEach` can't be used to traverse an array in Opera <= 8.54
                                        // because its `Object#hasOwnProperty` implementation returns `false`
                                        // for array indices (e.g., `![1, 2, 3].hasOwnProperty("0")`).
                                        if (getClass.call(value) == arrayClass) {
                                            for (length = value.length; length--;) {
                                                update(value, length, callback);
                                            }
                                        } else {
                                            forEach(value, function(property) {
                                                update(value, property, callback);
                                            });
                                        }
                                    }
                                    return callback.call(source, property, value);
                                };

                                // Public: `JSON.parse`. See ES 5.1 section 15.12.2.
                                exports.parse = function(source, callback) {
                                    var result, value;
                                    Index = 0;
                                    Source = "" + source;
                                    result = get(lex());
                                    // If a JSON string contains multiple tokens, it is invalid.
                                    if (lex() != "$") {
                                        abort();
                                    }
                                    // Reset the parser state.
                                    Index = Source = null;
                                    return callback && getClass.call(callback) == functionClass ? walk((value = {}, value[""] = result, value), "", callback) : result;
                                };
                            }
                        }

                        exports["runInContext"] = runInContext;
                        return exports;
                    }

                    if (freeExports && !isLoader) {
                        // Export for CommonJS environments.
                        runInContext(root, freeExports);
                    } else {
                        // Export for web browsers and JavaScript engines.
                        var nativeJSON = root.JSON,
                            previousJSON = root["JSON3"],
                            isRestored = false;

                        var JSON3 = runInContext(root, (root["JSON3"] = {
                            // Public: Restores the original value of the global `JSON` object and
                            // returns a reference to the `JSON3` object.
                            "noConflict": function() {
                                if (!isRestored) {
                                    isRestored = true;
                                    root.JSON = nativeJSON;
                                    root["JSON3"] = previousJSON;
                                    nativeJSON = previousJSON = null;
                                }
                                return JSON3;
                            }
                        }));

                        root.JSON = {
                            "parse": JSON3.parse,
                            "stringify": JSON3.stringify
                        };
                    }

                    // Export for asynchronous module loaders.
                    if (isLoader) {
                        define(function() {
                            return JSON3;
                        });
                    }
                }).call(this);

            }).call(this, typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

        }, {}],
        5: [function(require, module, exports) {
            // shim for using process in browser
            var process = module.exports = {};

            // cached from whatever global is present so that test runners that stub it
            // don't break things.  But we need to wrap it in a try catch in case it is
            // wrapped in strict mode code which doesn't define any globals.  It's inside a
            // function because try/catches deoptimize in certain engines.

            var cachedSetTimeout;
            var cachedClearTimeout;

            function defaultSetTimout() {
                throw new Error('setTimeout has not been defined');
            }

            function defaultClearTimeout() {
                throw new Error('clearTimeout has not been defined');
            }
            (function() {
                try {
                    if (typeof setTimeout === 'function') {
                        cachedSetTimeout = setTimeout;
                    } else {
                        cachedSetTimeout = defaultSetTimout;
                    }
                } catch (e) {
                    cachedSetTimeout = defaultSetTimout;
                }
                try {
                    if (typeof clearTimeout === 'function') {
                        cachedClearTimeout = clearTimeout;
                    } else {
                        cachedClearTimeout = defaultClearTimeout;
                    }
                } catch (e) {
                    cachedClearTimeout = defaultClearTimeout;
                }
            }())

            function runTimeout(fun) {
                if (cachedSetTimeout === setTimeout) {
                    //normal enviroments in sane situations
                    return setTimeout(fun, 0);
                }
                // if setTimeout wasn't available but was latter defined
                if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
                    cachedSetTimeout = setTimeout;
                    return setTimeout(fun, 0);
                }
                try {
                    // when when somebody has screwed with setTimeout but no I.E. maddness
                    return cachedSetTimeout(fun, 0);
                } catch (e) {
                    try {
                        // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
                        return cachedSetTimeout.call(null, fun, 0);
                    } catch (e) {
                        // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
                        return cachedSetTimeout.call(this, fun, 0);
                    }
                }


            }

            function runClearTimeout(marker) {
                if (cachedClearTimeout === clearTimeout) {
                    //normal enviroments in sane situations
                    return clearTimeout(marker);
                }
                // if clearTimeout wasn't available but was latter defined
                if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
                    cachedClearTimeout = clearTimeout;
                    return clearTimeout(marker);
                }
                try {
                    // when when somebody has screwed with setTimeout but no I.E. maddness
                    return cachedClearTimeout(marker);
                } catch (e) {
                    try {
                        // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
                        return cachedClearTimeout.call(null, marker);
                    } catch (e) {
                        // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
                        // Some versions of I.E. have different rules for clearTimeout vs setTimeout
                        return cachedClearTimeout.call(this, marker);
                    }
                }



            }
            var queue = [];
            var draining = false;
            var currentQueue;
            var queueIndex = -1;

            function cleanUpNextTick() {
                if (!draining || !currentQueue) {
                    return;
                }
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
                var timeout = runTimeout(cleanUpNextTick);
                draining = true;

                var len = queue.length;
                while (len) {
                    currentQueue = queue;
                    queue = [];
                    while (++queueIndex < len) {
                        if (currentQueue) {
                            currentQueue[queueIndex].run();
                        }
                    }
                    queueIndex = -1;
                    len = queue.length;
                }
                currentQueue = null;
                draining = false;
                runClearTimeout(timeout);
            }

            process.nextTick = function(fun) {
                var args = new Array(arguments.length - 1);
                if (arguments.length > 1) {
                    for (var i = 1; i < arguments.length; i++) {
                        args[i - 1] = arguments[i];
                    }
                }
                queue.push(new Item(fun, args));
                if (queue.length === 1 && !draining) {
                    runTimeout(drainQueue);
                }
            };

            // v8 likes predictible objects
            function Item(fun, array) {
                this.fun = fun;
                this.array = array;
            }
            Item.prototype.run = function() {
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
            process.prependListener = noop;
            process.prependOnceListener = noop;

            process.listeners = function(name) { return [] }

            process.binding = function(name) {
                throw new Error('process.binding is not supported');
            };

            process.cwd = function() { return '/' };
            process.chdir = function(dir) {
                throw new Error('process.chdir is not supported');
            };
            process.umask = function() { return 0; };

        }, {}],
        6: [function(require, module, exports) {
            /* -*- Mode: js; js-indent-level: 2; -*- */
            /*
             * Copyright 2011 Mozilla Foundation and contributors
             * Licensed under the New BSD license. See LICENSE or:
             * http://opensource.org/licenses/BSD-3-Clause
             */

            var util = require('./util');
            var has = Object.prototype.hasOwnProperty;

            /**
             * A data structure which is a combination of an array and a set. Adding a new
             * member is O(1), testing for membership is O(1), and finding the index of an
             * element is O(1). Removing elements from the set is not supported. Only
             * strings are supported for membership.
             */
            function ArraySet() {
                this._array = [];
                this._set = Object.create(null);
            }

            /**
             * Static method for creating ArraySet instances from an existing array.
             */
            ArraySet.fromArray = function ArraySet_fromArray(aArray, aAllowDuplicates) {
                var set = new ArraySet();
                for (var i = 0, len = aArray.length; i < len; i++) {
                    set.add(aArray[i], aAllowDuplicates);
                }
                return set;
            };

            /**
             * Return how many unique items are in this ArraySet. If duplicates have been
             * added, than those do not count towards the size.
             *
             * @returns Number
             */
            ArraySet.prototype.size = function ArraySet_size() {
                return Object.getOwnPropertyNames(this._set).length;
            };

            /**
             * Add the given string to this set.
             *
             * @param String aStr
             */
            ArraySet.prototype.add = function ArraySet_add(aStr, aAllowDuplicates) {
                var sStr = util.toSetString(aStr);
                var isDuplicate = has.call(this._set, sStr);
                var idx = this._array.length;
                if (!isDuplicate || aAllowDuplicates) {
                    this._array.push(aStr);
                }
                if (!isDuplicate) {
                    this._set[sStr] = idx;
                }
            };

            /**
             * Is the given string a member of this set?
             *
             * @param String aStr
             */
            ArraySet.prototype.has = function ArraySet_has(aStr) {
                var sStr = util.toSetString(aStr);
                return has.call(this._set, sStr);
            };

            /**
             * What is the index of the given string in the array?
             *
             * @param String aStr
             */
            ArraySet.prototype.indexOf = function ArraySet_indexOf(aStr) {
                var sStr = util.toSetString(aStr);
                if (has.call(this._set, sStr)) {
                    return this._set[sStr];
                }
                throw new Error('"' + aStr + '" is not in the set.');
            };

            /**
             * What is the element at the given index?
             *
             * @param Number aIdx
             */
            ArraySet.prototype.at = function ArraySet_at(aIdx) {
                if (aIdx >= 0 && aIdx < this._array.length) {
                    return this._array[aIdx];
                }
                throw new Error('No element indexed by ' + aIdx);
            };

            /**
             * Returns the array representation of this set (which has the proper indices
             * indicated by indexOf). Note that this is a copy of the internal array used
             * for storing the members so that no one can mess with internal state.
             */
            ArraySet.prototype.toArray = function ArraySet_toArray() {
                return this._array.slice();
            };

            exports.ArraySet = ArraySet;

        }, { "./util": 12 }],
        7: [function(require, module, exports) {
            /* -*- Mode: js; js-indent-level: 2; -*- */
            /*
             * Copyright 2011 Mozilla Foundation and contributors
             * Licensed under the New BSD license. See LICENSE or:
             * http://opensource.org/licenses/BSD-3-Clause
             *
             * Based on the Base 64 VLQ implementation in Closure Compiler:
             * https://code.google.com/p/closure-compiler/source/browse/trunk/src/com/google/debugging/sourcemap/Base64VLQ.java
             *
             * Copyright 2011 The Closure Compiler Authors. All rights reserved.
             * Redistribution and use in source and binary forms, with or without
             * modification, are permitted provided that the following conditions are
             * met:
             *
             *  * Redistributions of source code must retain the above copyright
             *    notice, this list of conditions and the following disclaimer.
             *  * Redistributions in binary form must reproduce the above
             *    copyright notice, this list of conditions and the following
             *    disclaimer in the documentation and/or other materials provided
             *    with the distribution.
             *  * Neither the name of Google Inc. nor the names of its
             *    contributors may be used to endorse or promote products derived
             *    from this software without specific prior written permission.
             *
             * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
             * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
             * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
             * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
             * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
             * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
             * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
             * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
             * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
             * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
             * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
             */

            var base64 = require('./base64');

            // A single base 64 digit can contain 6 bits of data. For the base 64 variable
            // length quantities we use in the source map spec, the first bit is the sign,
            // the next four bits are the actual value, and the 6th bit is the
            // continuation bit. The continuation bit tells us whether there are more
            // digits in this value following this digit.
            //
            //   Continuation
            //   |    Sign
            //   |    |
            //   V    V
            //   101011

            var VLQ_BASE_SHIFT = 5;

            // binary: 100000
            var VLQ_BASE = 1 << VLQ_BASE_SHIFT;

            // binary: 011111
            var VLQ_BASE_MASK = VLQ_BASE - 1;

            // binary: 100000
            var VLQ_CONTINUATION_BIT = VLQ_BASE;

            /**
             * Converts from a two-complement value to a value where the sign bit is
             * placed in the least significant bit.  For example, as decimals:
             *   1 becomes 2 (10 binary), -1 becomes 3 (11 binary)
             *   2 becomes 4 (100 binary), -2 becomes 5 (101 binary)
             */
            function toVLQSigned(aValue) {
                return aValue < 0 ?
                    ((-aValue) << 1) + 1 :
                    (aValue << 1) + 0;
            }

            /**
             * Converts to a two-complement value from a value where the sign bit is
             * placed in the least significant bit.  For example, as decimals:
             *   2 (10 binary) becomes 1, 3 (11 binary) becomes -1
             *   4 (100 binary) becomes 2, 5 (101 binary) becomes -2
             */
            function fromVLQSigned(aValue) {
                var isNegative = (aValue & 1) === 1;
                var shifted = aValue >> 1;
                return isNegative ?
                    -shifted :
                    shifted;
            }

            /**
             * Returns the base 64 VLQ encoded value.
             */
            exports.encode = function base64VLQ_encode(aValue) {
                var encoded = "";
                var digit;

                var vlq = toVLQSigned(aValue);

                do {
                    digit = vlq & VLQ_BASE_MASK;
                    vlq >>>= VLQ_BASE_SHIFT;
                    if (vlq > 0) {
                        // There are still more digits in this value, so we must make sure the
                        // continuation bit is marked.
                        digit |= VLQ_CONTINUATION_BIT;
                    }
                    encoded += base64.encode(digit);
                } while (vlq > 0);

                return encoded;
            };

            /**
             * Decodes the next base 64 VLQ value from the given string and returns the
             * value and the rest of the string via the out parameter.
             */
            exports.decode = function base64VLQ_decode(aStr, aIndex, aOutParam) {
                var strLen = aStr.length;
                var result = 0;
                var shift = 0;
                var continuation, digit;

                do {
                    if (aIndex >= strLen) {
                        throw new Error("Expected more digits in base 64 VLQ value.");
                    }

                    digit = base64.decode(aStr.charCodeAt(aIndex++));
                    if (digit === -1) {
                        throw new Error("Invalid base64 digit: " + aStr.charAt(aIndex - 1));
                    }

                    continuation = !!(digit & VLQ_CONTINUATION_BIT);
                    digit &= VLQ_BASE_MASK;
                    result = result + (digit << shift);
                    shift += VLQ_BASE_SHIFT;
                } while (continuation);

                aOutParam.value = fromVLQSigned(result);
                aOutParam.rest = aIndex;
            };

        }, { "./base64": 8 }],
        8: [function(require, module, exports) {
            /* -*- Mode: js; js-indent-level: 2; -*- */
            /*
             * Copyright 2011 Mozilla Foundation and contributors
             * Licensed under the New BSD license. See LICENSE or:
             * http://opensource.org/licenses/BSD-3-Clause
             */

            var intToCharMap = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'.split('');

            /**
             * Encode an integer in the range of 0 to 63 to a single base 64 digit.
             */
            exports.encode = function(number) {
                if (0 <= number && number < intToCharMap.length) {
                    return intToCharMap[number];
                }
                throw new TypeError("Must be between 0 and 63: " + number);
            };

            /**
             * Decode a single base 64 character code digit to an integer. Returns -1 on
             * failure.
             */
            exports.decode = function(charCode) {
                var bigA = 65; // 'A'
                var bigZ = 90; // 'Z'

                var littleA = 97; // 'a'
                var littleZ = 122; // 'z'

                var zero = 48; // '0'
                var nine = 57; // '9'

                var plus = 43; // '+'
                var slash = 47; // '/'

                var littleOffset = 26;
                var numberOffset = 52;

                // 0 - 25: ABCDEFGHIJKLMNOPQRSTUVWXYZ
                if (bigA <= charCode && charCode <= bigZ) {
                    return (charCode - bigA);
                }

                // 26 - 51: abcdefghijklmnopqrstuvwxyz
                if (littleA <= charCode && charCode <= littleZ) {
                    return (charCode - littleA + littleOffset);
                }

                // 52 - 61: 0123456789
                if (zero <= charCode && charCode <= nine) {
                    return (charCode - zero + numberOffset);
                }

                // 62: +
                if (charCode == plus) {
                    return 62;
                }

                // 63: /
                if (charCode == slash) {
                    return 63;
                }

                // Invalid base64 digit.
                return -1;
            };

        }, {}],
        9: [function(require, module, exports) {
            /* -*- Mode: js; js-indent-level: 2; -*- */
            /*
             * Copyright 2011 Mozilla Foundation and contributors
             * Licensed under the New BSD license. See LICENSE or:
             * http://opensource.org/licenses/BSD-3-Clause
             */

            exports.GREATEST_LOWER_BOUND = 1;
            exports.LEAST_UPPER_BOUND = 2;

            /**
             * Recursive implementation of binary search.
             *
             * @param aLow Indices here and lower do not contain the needle.
             * @param aHigh Indices here and higher do not contain the needle.
             * @param aNeedle The element being searched for.
             * @param aHaystack The non-empty array being searched.
             * @param aCompare Function which takes two elements and returns -1, 0, or 1.
             * @param aBias Either 'binarySearch.GREATEST_LOWER_BOUND' or
             *     'binarySearch.LEAST_UPPER_BOUND'. Specifies whether to return the
             *     closest element that is smaller than or greater than the one we are
             *     searching for, respectively, if the exact element cannot be found.
             */
            function recursiveSearch(aLow, aHigh, aNeedle, aHaystack, aCompare, aBias) {
                // This function terminates when one of the following is true:
                //
                //   1. We find the exact element we are looking for.
                //
                //   2. We did not find the exact element, but we can return the index of
                //      the next-closest element.
                //
                //   3. We did not find the exact element, and there is no next-closest
                //      element than the one we are searching for, so we return -1.
                var mid = Math.floor((aHigh - aLow) / 2) + aLow;
                var cmp = aCompare(aNeedle, aHaystack[mid], true);
                if (cmp === 0) {
                    // Found the element we are looking for.
                    return mid;
                } else if (cmp > 0) {
                    // Our needle is greater than aHaystack[mid].
                    if (aHigh - mid > 1) {
                        // The element is in the upper half.
                        return recursiveSearch(mid, aHigh, aNeedle, aHaystack, aCompare, aBias);
                    }

                    // The exact needle element was not found in this haystack. Determine if
                    // we are in termination case (3) or (2) and return the appropriate thing.
                    if (aBias == exports.LEAST_UPPER_BOUND) {
                        return aHigh < aHaystack.length ? aHigh : -1;
                    } else {
                        return mid;
                    }
                } else {
                    // Our needle is less than aHaystack[mid].
                    if (mid - aLow > 1) {
                        // The element is in the lower half.
                        return recursiveSearch(aLow, mid, aNeedle, aHaystack, aCompare, aBias);
                    }

                    // we are in termination case (3) or (2) and return the appropriate thing.
                    if (aBias == exports.LEAST_UPPER_BOUND) {
                        return mid;
                    } else {
                        return aLow < 0 ? -1 : aLow;
                    }
                }
            }

            /**
             * This is an implementation of binary search which will always try and return
             * the index of the closest element if there is no exact hit. This is because
             * mappings between original and generated line/col pairs are single points,
             * and there is an implicit region between each of them, so a miss just means
             * that you aren't on the very start of a region.
             *
             * @param aNeedle The element you are looking for.
             * @param aHaystack The array that is being searched.
             * @param aCompare A function which takes the needle and an element in the
             *     array and returns -1, 0, or 1 depending on whether the needle is less
             *     than, equal to, or greater than the element, respectively.
             * @param aBias Either 'binarySearch.GREATEST_LOWER_BOUND' or
             *     'binarySearch.LEAST_UPPER_BOUND'. Specifies whether to return the
             *     closest element that is smaller than or greater than the one we are
             *     searching for, respectively, if the exact element cannot be found.
             *     Defaults to 'binarySearch.GREATEST_LOWER_BOUND'.
             */
            exports.search = function search(aNeedle, aHaystack, aCompare, aBias) {
                if (aHaystack.length === 0) {
                    return -1;
                }

                var index = recursiveSearch(-1, aHaystack.length, aNeedle, aHaystack,
                    aCompare, aBias || exports.GREATEST_LOWER_BOUND);
                if (index < 0) {
                    return -1;
                }

                // We have found either the exact element, or the next-closest element than
                // the one we are searching for. However, there may be more than one such
                // element. Make sure we always return the smallest of these.
                while (index - 1 >= 0) {
                    if (aCompare(aHaystack[index], aHaystack[index - 1], true) !== 0) {
                        break;
                    }
                    --index;
                }

                return index;
            };

        }, {}],
        10: [function(require, module, exports) {
            /* -*- Mode: js; js-indent-level: 2; -*- */
            /*
             * Copyright 2011 Mozilla Foundation and contributors
             * Licensed under the New BSD license. See LICENSE or:
             * http://opensource.org/licenses/BSD-3-Clause
             */

            // It turns out that some (most?) JavaScript engines don't self-host
            // `Array.prototype.sort`. This makes sense because C++ will likely remain
            // faster than JS when doing raw CPU-intensive sorting. However, when using a
            // custom comparator function, calling back and forth between the VM's C++ and
            // JIT'd JS is rather slow *and* loses JIT type information, resulting in
            // worse generated code for the comparator function than would be optimal. In
            // fact, when sorting with a comparator, these costs outweigh the benefits of
            // sorting in C++. By using our own JS-implemented Quick Sort (below), we get
            // a ~3500ms mean speed-up in `bench/bench.html`.

            /**
             * Swap the elements indexed by `x` and `y` in the array `ary`.
             *
             * @param {Array} ary
             *        The array.
             * @param {Number} x
             *        The index of the first item.
             * @param {Number} y
             *        The index of the second item.
             */
            function swap(ary, x, y) {
                var temp = ary[x];
                ary[x] = ary[y];
                ary[y] = temp;
            }

            /**
             * Returns a random integer within the range `low .. high` inclusive.
             *
             * @param {Number} low
             *        The lower bound on the range.
             * @param {Number} high
             *        The upper bound on the range.
             */
            function randomIntInRange(low, high) {
                return Math.round(low + (Math.random() * (high - low)));
            }

            /**
             * The Quick Sort algorithm.
             *
             * @param {Array} ary
             *        An array to sort.
             * @param {function} comparator
             *        Function to use to compare two items.
             * @param {Number} p
             *        Start index of the array
             * @param {Number} r
             *        End index of the array
             */
            function doQuickSort(ary, comparator, p, r) {
                // If our lower bound is less than our upper bound, we (1) partition the
                // array into two pieces and (2) recurse on each half. If it is not, this is
                // the empty array and our base case.

                if (p < r) {
                    // (1) Partitioning.
                    //
                    // The partitioning chooses a pivot between `p` and `r` and moves all
                    // elements that are less than or equal to the pivot to the before it, and
                    // all the elements that are greater than it after it. The effect is that
                    // once partition is done, the pivot is in the exact place it will be when
                    // the array is put in sorted order, and it will not need to be moved
                    // again. This runs in O(n) time.

                    // Always choose a random pivot so that an input array which is reverse
                    // sorted does not cause O(n^2) running time.
                    var pivotIndex = randomIntInRange(p, r);
                    var i = p - 1;

                    swap(ary, pivotIndex, r);
                    var pivot = ary[r];

                    // Immediately after `j` is incremented in this loop, the following hold
                    // true:
                    //
                    //   * Every element in `ary[p .. i]` is less than or equal to the pivot.
                    //
                    //   * Every element in `ary[i+1 .. j-1]` is greater than the pivot.
                    for (var j = p; j < r; j++) {
                        if (comparator(ary[j], pivot) <= 0) {
                            i += 1;
                            swap(ary, i, j);
                        }
                    }

                    swap(ary, i + 1, j);
                    var q = i + 1;

                    // (2) Recurse on each half.

                    doQuickSort(ary, comparator, p, q - 1);
                    doQuickSort(ary, comparator, q + 1, r);
                }
            }

            /**
             * Sort the given array in-place with the given comparator function.
             *
             * @param {Array} ary
             *        An array to sort.
             * @param {function} comparator
             *        Function to use to compare two items.
             */
            exports.quickSort = function(ary, comparator) {
                doQuickSort(ary, comparator, 0, ary.length - 1);
            };

        }, {}],
        11: [function(require, module, exports) {
            /* -*- Mode: js; js-indent-level: 2; -*- */
            /*
             * Copyright 2011 Mozilla Foundation and contributors
             * Licensed under the New BSD license. See LICENSE or:
             * http://opensource.org/licenses/BSD-3-Clause
             */

            var util = require('./util');
            var binarySearch = require('./binary-search');
            var ArraySet = require('./array-set').ArraySet;
            var base64VLQ = require('./base64-vlq');
            var quickSort = require('./quick-sort').quickSort;

            function SourceMapConsumer(aSourceMap) {
                var sourceMap = aSourceMap;
                if (typeof aSourceMap === 'string') {
                    sourceMap = JSON.parse(aSourceMap.replace(/^\)\]\}'/, ''));
                }

                return sourceMap.sections != null ?
                    new IndexedSourceMapConsumer(sourceMap) :
                    new BasicSourceMapConsumer(sourceMap);
            }

            SourceMapConsumer.fromSourceMap = function(aSourceMap) {
                return BasicSourceMapConsumer.fromSourceMap(aSourceMap);
            }

            /**
             * The version of the source mapping spec that we are consuming.
             */
            SourceMapConsumer.prototype._version = 3;

            // `__generatedMappings` and `__originalMappings` are arrays that hold the
            // parsed mapping coordinates from the source map's "mappings" attribute. They
            // are lazily instantiated, accessed via the `_generatedMappings` and
            // `_originalMappings` getters respectively, and we only parse the mappings
            // and create these arrays once queried for a source location. We jump through
            // these hoops because there can be many thousands of mappings, and parsing
            // them is expensive, so we only want to do it if we must.
            //
            // Each object in the arrays is of the form:
            //
            //     {
            //       generatedLine: The line number in the generated code,
            //       generatedColumn: The column number in the generated code,
            //       source: The path to the original source file that generated this
            //               chunk of code,
            //       originalLine: The line number in the original source that
            //                     corresponds to this chunk of generated code,
            //       originalColumn: The column number in the original source that
            //                       corresponds to this chunk of generated code,
            //       name: The name of the original symbol which generated this chunk of
            //             code.
            //     }
            //
            // All properties except for `generatedLine` and `generatedColumn` can be
            // `null`.
            //
            // `_generatedMappings` is ordered by the generated positions.
            //
            // `_originalMappings` is ordered by the original positions.

            SourceMapConsumer.prototype.__generatedMappings = null;
            Object.defineProperty(SourceMapConsumer.prototype, '_generatedMappings', {
                get: function() {
                    if (!this.__generatedMappings) {
                        this._parseMappings(this._mappings, this.sourceRoot);
                    }

                    return this.__generatedMappings;
                }
            });

            SourceMapConsumer.prototype.__originalMappings = null;
            Object.defineProperty(SourceMapConsumer.prototype, '_originalMappings', {
                get: function() {
                    if (!this.__originalMappings) {
                        this._parseMappings(this._mappings, this.sourceRoot);
                    }

                    return this.__originalMappings;
                }
            });

            SourceMapConsumer.prototype._charIsMappingSeparator =
                function SourceMapConsumer_charIsMappingSeparator(aStr, index) {
                    var c = aStr.charAt(index);
                    return c === ";" || c === ",";
                };

            /**
             * Parse the mappings in a string in to a data structure which we can easily
             * query (the ordered arrays in the `this.__generatedMappings` and
             * `this.__originalMappings` properties).
             */
            SourceMapConsumer.prototype._parseMappings =
                function SourceMapConsumer_parseMappings(aStr, aSourceRoot) {
                    throw new Error("Subclasses must implement _parseMappings");
                };

            SourceMapConsumer.GENERATED_ORDER = 1;
            SourceMapConsumer.ORIGINAL_ORDER = 2;

            SourceMapConsumer.GREATEST_LOWER_BOUND = 1;
            SourceMapConsumer.LEAST_UPPER_BOUND = 2;

            /**
             * Iterate over each mapping between an original source/line/column and a
             * generated line/column in this source map.
             *
             * @param Function aCallback
             *        The function that is called with each mapping.
             * @param Object aContext
             *        Optional. If specified, this object will be the value of `this` every
             *        time that `aCallback` is called.
             * @param aOrder
             *        Either `SourceMapConsumer.GENERATED_ORDER` or
             *        `SourceMapConsumer.ORIGINAL_ORDER`. Specifies whether you want to
             *        iterate over the mappings sorted by the generated file's line/column
             *        order or the original's source/line/column order, respectively. Defaults to
             *        `SourceMapConsumer.GENERATED_ORDER`.
             */
            SourceMapConsumer.prototype.eachMapping =
                function SourceMapConsumer_eachMapping(aCallback, aContext, aOrder) {
                    var context = aContext || null;
                    var order = aOrder || SourceMapConsumer.GENERATED_ORDER;

                    var mappings;
                    switch (order) {
                        case SourceMapConsumer.GENERATED_ORDER:
                            mappings = this._generatedMappings;
                            break;
                        case SourceMapConsumer.ORIGINAL_ORDER:
                            mappings = this._originalMappings;
                            break;
                        default:
                            throw new Error("Unknown order of iteration.");
                    }

                    var sourceRoot = this.sourceRoot;
                    mappings.map(function(mapping) {
                        var source = mapping.source === null ? null : this._sources.at(mapping.source);
                        if (source != null && sourceRoot != null) {
                            source = util.join(sourceRoot, source);
                        }
                        return {
                            source: source,
                            generatedLine: mapping.generatedLine,
                            generatedColumn: mapping.generatedColumn,
                            originalLine: mapping.originalLine,
                            originalColumn: mapping.originalColumn,
                            name: mapping.name === null ? null : this._names.at(mapping.name)
                        };
                    }, this).forEach(aCallback, context);
                };

            /**
             * Returns all generated line and column information for the original source,
             * line, and column provided. If no column is provided, returns all mappings
             * corresponding to a either the line we are searching for or the next
             * closest line that has any mappings. Otherwise, returns all mappings
             * corresponding to the given line and either the column we are searching for
             * or the next closest column that has any offsets.
             *
             * The only argument is an object with the following properties:
             *
             *   - source: The filename of the original source.
             *   - line: The line number in the original source.
             *   - column: Optional. the column number in the original source.
             *
             * and an array of objects is returned, each with the following properties:
             *
             *   - line: The line number in the generated source, or null.
             *   - column: The column number in the generated source, or null.
             */
            SourceMapConsumer.prototype.allGeneratedPositionsFor =
                function SourceMapConsumer_allGeneratedPositionsFor(aArgs) {
                    var line = util.getArg(aArgs, 'line');

                    // When there is no exact match, BasicSourceMapConsumer.prototype._findMapping
                    // returns the index of the closest mapping less than the needle. By
                    // setting needle.originalColumn to 0, we thus find the last mapping for
                    // the given line, provided such a mapping exists.
                    var needle = {
                        source: util.getArg(aArgs, 'source'),
                        originalLine: line,
                        originalColumn: util.getArg(aArgs, 'column', 0)
                    };

                    if (this.sourceRoot != null) {
                        needle.source = util.relative(this.sourceRoot, needle.source);
                    }
                    if (!this._sources.has(needle.source)) {
                        return [];
                    }
                    needle.source = this._sources.indexOf(needle.source);

                    var mappings = [];

                    var index = this._findMapping(needle,
                        this._originalMappings,
                        "originalLine",
                        "originalColumn",
                        util.compareByOriginalPositions,
                        binarySearch.LEAST_UPPER_BOUND);
                    if (index >= 0) {
                        var mapping = this._originalMappings[index];

                        if (aArgs.column === undefined) {
                            var originalLine = mapping.originalLine;

                            // Iterate until either we run out of mappings, or we run into
                            // a mapping for a different line than the one we found. Since
                            // mappings are sorted, this is guaranteed to find all mappings for
                            // the line we found.
                            while (mapping && mapping.originalLine === originalLine) {
                                mappings.push({
                                    line: util.getArg(mapping, 'generatedLine', null),
                                    column: util.getArg(mapping, 'generatedColumn', null),
                                    lastColumn: util.getArg(mapping, 'lastGeneratedColumn', null)
                                });

                                mapping = this._originalMappings[++index];
                            }
                        } else {
                            var originalColumn = mapping.originalColumn;

                            // Iterate until either we run out of mappings, or we run into
                            // a mapping for a different line than the one we were searching for.
                            // Since mappings are sorted, this is guaranteed to find all mappings for
                            // the line we are searching for.
                            while (mapping &&
                                mapping.originalLine === line &&
                                mapping.originalColumn == originalColumn) {
                                mappings.push({
                                    line: util.getArg(mapping, 'generatedLine', null),
                                    column: util.getArg(mapping, 'generatedColumn', null),
                                    lastColumn: util.getArg(mapping, 'lastGeneratedColumn', null)
                                });

                                mapping = this._originalMappings[++index];
                            }
                        }
                    }

                    return mappings;
                };

            exports.SourceMapConsumer = SourceMapConsumer;

            /**
             * A BasicSourceMapConsumer instance represents a parsed source map which we can
             * query for information about the original file positions by giving it a file
             * position in the generated source.
             *
             * The only parameter is the raw source map (either as a JSON string, or
             * already parsed to an object). According to the spec, source maps have the
             * following attributes:
             *
             *   - version: Which version of the source map spec this map is following.
             *   - sources: An array of URLs to the original source files.
             *   - names: An array of identifiers which can be referrenced by individual mappings.
             *   - sourceRoot: Optional. The URL root from which all sources are relative.
             *   - sourcesContent: Optional. An array of contents of the original source files.
             *   - mappings: A string of base64 VLQs which contain the actual mappings.
             *   - file: Optional. The generated file this source map is associated with.
             *
             * Here is an example source map, taken from the source map spec[0]:
             *
             *     {
             *       version : 3,
             *       file: "out.js",
             *       sourceRoot : "",
             *       sources: ["foo.js", "bar.js"],
             *       names: ["src", "maps", "are", "fun"],
             *       mappings: "AA,AB;;ABCDE;"
             *     }
             *
             * [0]: https://docs.google.com/document/d/1U1RGAehQwRypUTovF1KRlpiOFze0b-_2gc6fAH0KY0k/edit?pli=1#
             */
            function BasicSourceMapConsumer(aSourceMap) {
                var sourceMap = aSourceMap;
                if (typeof aSourceMap === 'string') {
                    sourceMap = JSON.parse(aSourceMap.replace(/^\)\]\}'/, ''));
                }

                var version = util.getArg(sourceMap, 'version');
                var sources = util.getArg(sourceMap, 'sources');
                // Sass 3.3 leaves out the 'names' array, so we deviate from the spec (which
                // requires the array) to play nice here.
                var names = util.getArg(sourceMap, 'names', []);
                var sourceRoot = util.getArg(sourceMap, 'sourceRoot', null);
                var sourcesContent = util.getArg(sourceMap, 'sourcesContent', null);
                var mappings = util.getArg(sourceMap, 'mappings');
                var file = util.getArg(sourceMap, 'file', null);

                // Once again, Sass deviates from the spec and supplies the version as a
                // string rather than a number, so we use loose equality checking here.
                if (version != this._version) {
                    throw new Error('Unsupported version: ' + version);
                }

                sources = sources
                    .map(String)
                    // Some source maps produce relative source paths like "./foo.js" instead of
                    // "foo.js".  Normalize these first so that future comparisons will succeed.
                    // See bugzil.la/1090768.
                    .map(util.normalize)
                    // Always ensure that absolute sources are internally stored relative to
                    // the source root, if the source root is absolute. Not doing this would
                    // be particularly problematic when the source root is a prefix of the
                    // source (valid, but why??). See github issue #199 and bugzil.la/1188982.
                    .map(function(source) {
                        return sourceRoot && util.isAbsolute(sourceRoot) && util.isAbsolute(source) ?
                            util.relative(sourceRoot, source) :
                            source;
                    });

                // Pass `true` below to allow duplicate names and sources. While source maps
                // are intended to be compressed and deduplicated, the TypeScript compiler
                // sometimes generates source maps with duplicates in them. See Github issue
                // #72 and bugzil.la/889492.
                this._names = ArraySet.fromArray(names.map(String), true);
                this._sources = ArraySet.fromArray(sources, true);

                this.sourceRoot = sourceRoot;
                this.sourcesContent = sourcesContent;
                this._mappings = mappings;
                this.file = file;
            }

            BasicSourceMapConsumer.prototype = Object.create(SourceMapConsumer.prototype);
            BasicSourceMapConsumer.prototype.consumer = SourceMapConsumer;

            /**
             * Create a BasicSourceMapConsumer from a SourceMapGenerator.
             *
             * @param SourceMapGenerator aSourceMap
             *        The source map that will be consumed.
             * @returns BasicSourceMapConsumer
             */
            BasicSourceMapConsumer.fromSourceMap =
                function SourceMapConsumer_fromSourceMap(aSourceMap) {
                    var smc = Object.create(BasicSourceMapConsumer.prototype);

                    var names = smc._names = ArraySet.fromArray(aSourceMap._names.toArray(), true);
                    var sources = smc._sources = ArraySet.fromArray(aSourceMap._sources.toArray(), true);
                    smc.sourceRoot = aSourceMap._sourceRoot;
                    smc.sourcesContent = aSourceMap._generateSourcesContent(smc._sources.toArray(),
                        smc.sourceRoot);
                    smc.file = aSourceMap._file;

                    // Because we are modifying the entries (by converting string sources and
                    // names to indices into the sources and names ArraySets), we have to make
                    // a copy of the entry or else bad things happen. Shared mutable state
                    // strikes again! See github issue #191.

                    var generatedMappings = aSourceMap._mappings.toArray().slice();
                    var destGeneratedMappings = smc.__generatedMappings = [];
                    var destOriginalMappings = smc.__originalMappings = [];

                    for (var i = 0, length = generatedMappings.length; i < length; i++) {
                        var srcMapping = generatedMappings[i];
                        var destMapping = new Mapping;
                        destMapping.generatedLine = srcMapping.generatedLine;
                        destMapping.generatedColumn = srcMapping.generatedColumn;

                        if (srcMapping.source) {
                            destMapping.source = sources.indexOf(srcMapping.source);
                            destMapping.originalLine = srcMapping.originalLine;
                            destMapping.originalColumn = srcMapping.originalColumn;

                            if (srcMapping.name) {
                                destMapping.name = names.indexOf(srcMapping.name);
                            }

                            destOriginalMappings.push(destMapping);
                        }

                        destGeneratedMappings.push(destMapping);
                    }

                    quickSort(smc.__originalMappings, util.compareByOriginalPositions);

                    return smc;
                };

            /**
             * The version of the source mapping spec that we are consuming.
             */
            BasicSourceMapConsumer.prototype._version = 3;

            /**
             * The list of original sources.
             */
            Object.defineProperty(BasicSourceMapConsumer.prototype, 'sources', {
                get: function() {
                    return this._sources.toArray().map(function(s) {
                        return this.sourceRoot != null ? util.join(this.sourceRoot, s) : s;
                    }, this);
                }
            });

            /**
             * Provide the JIT with a nice shape / hidden class.
             */
            function Mapping() {
                this.generatedLine = 0;
                this.generatedColumn = 0;
                this.source = null;
                this.originalLine = null;
                this.originalColumn = null;
                this.name = null;
            }

            /**
             * Parse the mappings in a string in to a data structure which we can easily
             * query (the ordered arrays in the `this.__generatedMappings` and
             * `this.__originalMappings` properties).
             */
            BasicSourceMapConsumer.prototype._parseMappings =
                function SourceMapConsumer_parseMappings(aStr, aSourceRoot) {
                    var generatedLine = 1;
                    var previousGeneratedColumn = 0;
                    var previousOriginalLine = 0;
                    var previousOriginalColumn = 0;
                    var previousSource = 0;
                    var previousName = 0;
                    var length = aStr.length;
                    var index = 0;
                    var cachedSegments = {};
                    var temp = {};
                    var originalMappings = [];
                    var generatedMappings = [];
                    var mapping, str, segment, end, value;

                    while (index < length) {
                        if (aStr.charAt(index) === ';') {
                            generatedLine++;
                            index++;
                            previousGeneratedColumn = 0;
                        } else if (aStr.charAt(index) === ',') {
                            index++;
                        } else {
                            mapping = new Mapping();
                            mapping.generatedLine = generatedLine;

                            // Because each offset is encoded relative to the previous one,
                            // many segments often have the same encoding. We can exploit this
                            // fact by caching the parsed variable length fields of each segment,
                            // allowing us to avoid a second parse if we encounter the same
                            // segment again.
                            for (end = index; end < length; end++) {
                                if (this._charIsMappingSeparator(aStr, end)) {
                                    break;
                                }
                            }
                            str = aStr.slice(index, end);

                            segment = cachedSegments[str];
                            if (segment) {
                                index += str.length;
                            } else {
                                segment = [];
                                while (index < end) {
                                    base64VLQ.decode(aStr, index, temp);
                                    value = temp.value;
                                    index = temp.rest;
                                    segment.push(value);
                                }

                                if (segment.length === 2) {
                                    throw new Error('Found a source, but no line and column');
                                }

                                if (segment.length === 3) {
                                    throw new Error('Found a source and line, but no column');
                                }

                                cachedSegments[str] = segment;
                            }

                            // Generated column.
                            mapping.generatedColumn = previousGeneratedColumn + segment[0];
                            previousGeneratedColumn = mapping.generatedColumn;

                            if (segment.length > 1) {
                                // Original source.
                                mapping.source = previousSource + segment[1];
                                previousSource += segment[1];

                                // Original line.
                                mapping.originalLine = previousOriginalLine + segment[2];
                                previousOriginalLine = mapping.originalLine;
                                // Lines are stored 0-based
                                mapping.originalLine += 1;

                                // Original column.
                                mapping.originalColumn = previousOriginalColumn + segment[3];
                                previousOriginalColumn = mapping.originalColumn;

                                if (segment.length > 4) {
                                    // Original name.
                                    mapping.name = previousName + segment[4];
                                    previousName += segment[4];
                                }
                            }

                            generatedMappings.push(mapping);
                            if (typeof mapping.originalLine === 'number') {
                                originalMappings.push(mapping);
                            }
                        }
                    }

                    quickSort(generatedMappings, util.compareByGeneratedPositionsDeflated);
                    this.__generatedMappings = generatedMappings;

                    quickSort(originalMappings, util.compareByOriginalPositions);
                    this.__originalMappings = originalMappings;
                };

            /**
             * Find the mapping that best matches the hypothetical "needle" mapping that
             * we are searching for in the given "haystack" of mappings.
             */
            BasicSourceMapConsumer.prototype._findMapping =
                function SourceMapConsumer_findMapping(aNeedle, aMappings, aLineName,
                    aColumnName, aComparator, aBias) {
                    // To return the position we are searching for, we must first find the
                    // mapping for the given position and then return the opposite position it
                    // points to. Because the mappings are sorted, we can use binary search to
                    // find the best mapping.

                    if (aNeedle[aLineName] <= 0) {
                        throw new TypeError('Line must be greater than or equal to 1, got ' +
                            aNeedle[aLineName]);
                    }
                    if (aNeedle[aColumnName] < 0) {
                        throw new TypeError('Column must be greater than or equal to 0, got ' +
                            aNeedle[aColumnName]);
                    }

                    return binarySearch.search(aNeedle, aMappings, aComparator, aBias);
                };

            /**
             * Compute the last column for each generated mapping. The last column is
             * inclusive.
             */
            BasicSourceMapConsumer.prototype.computeColumnSpans =
                function SourceMapConsumer_computeColumnSpans() {
                    for (var index = 0; index < this._generatedMappings.length; ++index) {
                        var mapping = this._generatedMappings[index];

                        // Mappings do not contain a field for the last generated columnt. We
                        // can come up with an optimistic estimate, however, by assuming that
                        // mappings are contiguous (i.e. given two consecutive mappings, the
                        // first mapping ends where the second one starts).
                        if (index + 1 < this._generatedMappings.length) {
                            var nextMapping = this._generatedMappings[index + 1];

                            if (mapping.generatedLine === nextMapping.generatedLine) {
                                mapping.lastGeneratedColumn = nextMapping.generatedColumn - 1;
                                continue;
                            }
                        }

                        // The last mapping for each line spans the entire line.
                        mapping.lastGeneratedColumn = Infinity;
                    }
                };

            /**
             * Returns the original source, line, and column information for the generated
             * source's line and column positions provided. The only argument is an object
             * with the following properties:
             *
             *   - line: The line number in the generated source.
             *   - column: The column number in the generated source.
             *   - bias: Either 'SourceMapConsumer.GREATEST_LOWER_BOUND' or
             *     'SourceMapConsumer.LEAST_UPPER_BOUND'. Specifies whether to return the
             *     closest element that is smaller than or greater than the one we are
             *     searching for, respectively, if the exact element cannot be found.
             *     Defaults to 'SourceMapConsumer.GREATEST_LOWER_BOUND'.
             *
             * and an object is returned with the following properties:
             *
             *   - source: The original source file, or null.
             *   - line: The line number in the original source, or null.
             *   - column: The column number in the original source, or null.
             *   - name: The original identifier, or null.
             */
            BasicSourceMapConsumer.prototype.originalPositionFor =
                function SourceMapConsumer_originalPositionFor(aArgs) {
                    var needle = {
                        generatedLine: util.getArg(aArgs, 'line'),
                        generatedColumn: util.getArg(aArgs, 'column')
                    };

                    var index = this._findMapping(
                        needle,
                        this._generatedMappings,
                        "generatedLine",
                        "generatedColumn",
                        util.compareByGeneratedPositionsDeflated,
                        util.getArg(aArgs, 'bias', SourceMapConsumer.GREATEST_LOWER_BOUND)
                    );

                    if (index >= 0) {
                        var mapping = this._generatedMappings[index];

                        if (mapping.generatedLine === needle.generatedLine) {
                            var source = util.getArg(mapping, 'source', null);
                            if (source !== null) {
                                source = this._sources.at(source);
                                if (this.sourceRoot != null) {
                                    source = util.join(this.sourceRoot, source);
                                }
                            }
                            var name = util.getArg(mapping, 'name', null);
                            if (name !== null) {
                                name = this._names.at(name);
                            }
                            return {
                                source: source,
                                line: util.getArg(mapping, 'originalLine', null),
                                column: util.getArg(mapping, 'originalColumn', null),
                                name: name
                            };
                        }
                    }

                    return {
                        source: null,
                        line: null,
                        column: null,
                        name: null
                    };
                };

            /**
             * Return true if we have the source content for every source in the source
             * map, false otherwise.
             */
            BasicSourceMapConsumer.prototype.hasContentsOfAllSources =
                function BasicSourceMapConsumer_hasContentsOfAllSources() {
                    if (!this.sourcesContent) {
                        return false;
                    }
                    return this.sourcesContent.length >= this._sources.size() &&
                        !this.sourcesContent.some(function(sc) { return sc == null; });
                };

            /**
             * Returns the original source content. The only argument is the url of the
             * original source file. Returns null if no original source content is
             * available.
             */
            BasicSourceMapConsumer.prototype.sourceContentFor =
                function SourceMapConsumer_sourceContentFor(aSource, nullOnMissing) {
                    if (!this.sourcesContent) {
                        return null;
                    }

                    if (this.sourceRoot != null) {
                        aSource = util.relative(this.sourceRoot, aSource);
                    }

                    if (this._sources.has(aSource)) {
                        return this.sourcesContent[this._sources.indexOf(aSource)];
                    }

                    var url;
                    if (this.sourceRoot != null &&
                        (url = util.urlParse(this.sourceRoot))) {
                        // XXX: file:// URIs and absolute paths lead to unexpected behavior for
                        // many users. We can help them out when they expect file:// URIs to
                        // behave like it would if they were running a local HTTP server. See
                        // https://bugzilla.mozilla.org/show_bug.cgi?id=885597.
                        var fileUriAbsPath = aSource.replace(/^file:\/\//, "");
                        if (url.scheme == "file" &&
                            this._sources.has(fileUriAbsPath)) {
                            return this.sourcesContent[this._sources.indexOf(fileUriAbsPath)]
                        }

                        if ((!url.path || url.path == "/") &&
                            this._sources.has("/" + aSource)) {
                            return this.sourcesContent[this._sources.indexOf("/" + aSource)];
                        }
                    }

                    // This function is used recursively from
                    // IndexedSourceMapConsumer.prototype.sourceContentFor. In that case, we
                    // don't want to throw if we can't find the source - we just want to
                    // return null, so we provide a flag to exit gracefully.
                    if (nullOnMissing) {
                        return null;
                    } else {
                        throw new Error('"' + aSource + '" is not in the SourceMap.');
                    }
                };

            /**
             * Returns the generated line and column information for the original source,
             * line, and column positions provided. The only argument is an object with
             * the following properties:
             *
             *   - source: The filename of the original source.
             *   - line: The line number in the original source.
             *   - column: The column number in the original source.
             *   - bias: Either 'SourceMapConsumer.GREATEST_LOWER_BOUND' or
             *     'SourceMapConsumer.LEAST_UPPER_BOUND'. Specifies whether to return the
             *     closest element that is smaller than or greater than the one we are
             *     searching for, respectively, if the exact element cannot be found.
             *     Defaults to 'SourceMapConsumer.GREATEST_LOWER_BOUND'.
             *
             * and an object is returned with the following properties:
             *
             *   - line: The line number in the generated source, or null.
             *   - column: The column number in the generated source, or null.
             */
            BasicSourceMapConsumer.prototype.generatedPositionFor =
                function SourceMapConsumer_generatedPositionFor(aArgs) {
                    var source = util.getArg(aArgs, 'source');
                    if (this.sourceRoot != null) {
                        source = util.relative(this.sourceRoot, source);
                    }
                    if (!this._sources.has(source)) {
                        return {
                            line: null,
                            column: null,
                            lastColumn: null
                        };
                    }
                    source = this._sources.indexOf(source);

                    var needle = {
                        source: source,
                        originalLine: util.getArg(aArgs, 'line'),
                        originalColumn: util.getArg(aArgs, 'column')
                    };

                    var index = this._findMapping(
                        needle,
                        this._originalMappings,
                        "originalLine",
                        "originalColumn",
                        util.compareByOriginalPositions,
                        util.getArg(aArgs, 'bias', SourceMapConsumer.GREATEST_LOWER_BOUND)
                    );

                    if (index >= 0) {
                        var mapping = this._originalMappings[index];

                        if (mapping.source === needle.source) {
                            return {
                                line: util.getArg(mapping, 'generatedLine', null),
                                column: util.getArg(mapping, 'generatedColumn', null),
                                lastColumn: util.getArg(mapping, 'lastGeneratedColumn', null)
                            };
                        }
                    }

                    return {
                        line: null,
                        column: null,
                        lastColumn: null
                    };
                };

            exports.BasicSourceMapConsumer = BasicSourceMapConsumer;

            /**
             * An IndexedSourceMapConsumer instance represents a parsed source map which
             * we can query for information. It differs from BasicSourceMapConsumer in
             * that it takes "indexed" source maps (i.e. ones with a "sections" field) as
             * input.
             *
             * The only parameter is a raw source map (either as a JSON string, or already
             * parsed to an object). According to the spec for indexed source maps, they
             * have the following attributes:
             *
             *   - version: Which version of the source map spec this map is following.
             *   - file: Optional. The generated file this source map is associated with.
             *   - sections: A list of section definitions.
             *
             * Each value under the "sections" field has two fields:
             *   - offset: The offset into the original specified at which this section
             *       begins to apply, defined as an object with a "line" and "column"
             *       field.
             *   - map: A source map definition. This source map could also be indexed,
             *       but doesn't have to be.
             *
             * Instead of the "map" field, it's also possible to have a "url" field
             * specifying a URL to retrieve a source map from, but that's currently
             * unsupported.
             *
             * Here's an example source map, taken from the source map spec[0], but
             * modified to omit a section which uses the "url" field.
             *
             *  {
             *    version : 3,
             *    file: "app.js",
             *    sections: [{
             *      offset: {line:100, column:10},
             *      map: {
             *        version : 3,
             *        file: "section.js",
             *        sources: ["foo.js", "bar.js"],
             *        names: ["src", "maps", "are", "fun"],
             *        mappings: "AAAA,E;;ABCDE;"
             *      }
             *    }],
             *  }
             *
             * [0]: https://docs.google.com/document/d/1U1RGAehQwRypUTovF1KRlpiOFze0b-_2gc6fAH0KY0k/edit#heading=h.535es3xeprgt
             */
            function IndexedSourceMapConsumer(aSourceMap) {
                var sourceMap = aSourceMap;
                if (typeof aSourceMap === 'string') {
                    sourceMap = JSON.parse(aSourceMap.replace(/^\)\]\}'/, ''));
                }

                var version = util.getArg(sourceMap, 'version');
                var sections = util.getArg(sourceMap, 'sections');

                if (version != this._version) {
                    throw new Error('Unsupported version: ' + version);
                }

                this._sources = new ArraySet();
                this._names = new ArraySet();

                var lastOffset = {
                    line: -1,
                    column: 0
                };
                this._sections = sections.map(function(s) {
                    if (s.url) {
                        // The url field will require support for asynchronicity.
                        // See https://github.com/mozilla/source-map/issues/16
                        throw new Error('Support for url field in sections not implemented.');
                    }
                    var offset = util.getArg(s, 'offset');
                    var offsetLine = util.getArg(offset, 'line');
                    var offsetColumn = util.getArg(offset, 'column');

                    if (offsetLine < lastOffset.line ||
                        (offsetLine === lastOffset.line && offsetColumn < lastOffset.column)) {
                        throw new Error('Section offsets must be ordered and non-overlapping.');
                    }
                    lastOffset = offset;

                    return {
                        generatedOffset: {
                            // The offset fields are 0-based, but we use 1-based indices when
                            // encoding/decoding from VLQ.
                            generatedLine: offsetLine + 1,
                            generatedColumn: offsetColumn + 1
                        },
                        consumer: new SourceMapConsumer(util.getArg(s, 'map'))
                    }
                });
            }

            IndexedSourceMapConsumer.prototype = Object.create(SourceMapConsumer.prototype);
            IndexedSourceMapConsumer.prototype.constructor = SourceMapConsumer;

            /**
             * The version of the source mapping spec that we are consuming.
             */
            IndexedSourceMapConsumer.prototype._version = 3;

            /**
             * The list of original sources.
             */
            Object.defineProperty(IndexedSourceMapConsumer.prototype, 'sources', {
                get: function() {
                    var sources = [];
                    for (var i = 0; i < this._sections.length; i++) {
                        for (var j = 0; j < this._sections[i].consumer.sources.length; j++) {
                            sources.push(this._sections[i].consumer.sources[j]);
                        }
                    }
                    return sources;
                }
            });

            /**
             * Returns the original source, line, and column information for the generated
             * source's line and column positions provided. The only argument is an object
             * with the following properties:
             *
             *   - line: The line number in the generated source.
             *   - column: The column number in the generated source.
             *
             * and an object is returned with the following properties:
             *
             *   - source: The original source file, or null.
             *   - line: The line number in the original source, or null.
             *   - column: The column number in the original source, or null.
             *   - name: The original identifier, or null.
             */
            IndexedSourceMapConsumer.prototype.originalPositionFor =
                function IndexedSourceMapConsumer_originalPositionFor(aArgs) {
                    var needle = {
                        generatedLine: util.getArg(aArgs, 'line'),
                        generatedColumn: util.getArg(aArgs, 'column')
                    };

                    // Find the section containing the generated position we're trying to map
                    // to an original position.
                    var sectionIndex = binarySearch.search(needle, this._sections,
                        function(needle, section) {
                            var cmp = needle.generatedLine - section.generatedOffset.generatedLine;
                            if (cmp) {
                                return cmp;
                            }

                            return (needle.generatedColumn -
                                section.generatedOffset.generatedColumn);
                        });
                    var section = this._sections[sectionIndex];

                    if (!section) {
                        return {
                            source: null,
                            line: null,
                            column: null,
                            name: null
                        };
                    }

                    return section.consumer.originalPositionFor({
                        line: needle.generatedLine -
                            (section.generatedOffset.generatedLine - 1),
                        column: needle.generatedColumn -
                            (section.generatedOffset.generatedLine === needle.generatedLine ?
                                section.generatedOffset.generatedColumn - 1 :
                                0),
                        bias: aArgs.bias
                    });
                };

            /**
             * Return true if we have the source content for every source in the source
             * map, false otherwise.
             */
            IndexedSourceMapConsumer.prototype.hasContentsOfAllSources =
                function IndexedSourceMapConsumer_hasContentsOfAllSources() {
                    return this._sections.every(function(s) {
                        return s.consumer.hasContentsOfAllSources();
                    });
                };

            /**
             * Returns the original source content. The only argument is the url of the
             * original source file. Returns null if no original source content is
             * available.
             */
            IndexedSourceMapConsumer.prototype.sourceContentFor =
                function IndexedSourceMapConsumer_sourceContentFor(aSource, nullOnMissing) {
                    for (var i = 0; i < this._sections.length; i++) {
                        var section = this._sections[i];

                        var content = section.consumer.sourceContentFor(aSource, true);
                        if (content) {
                            return content;
                        }
                    }
                    if (nullOnMissing) {
                        return null;
                    } else {
                        throw new Error('"' + aSource + '" is not in the SourceMap.');
                    }
                };

            /**
             * Returns the generated line and column information for the original source,
             * line, and column positions provided. The only argument is an object with
             * the following properties:
             *
             *   - source: The filename of the original source.
             *   - line: The line number in the original source.
             *   - column: The column number in the original source.
             *
             * and an object is returned with the following properties:
             *
             *   - line: The line number in the generated source, or null.
             *   - column: The column number in the generated source, or null.
             */
            IndexedSourceMapConsumer.prototype.generatedPositionFor =
                function IndexedSourceMapConsumer_generatedPositionFor(aArgs) {
                    for (var i = 0; i < this._sections.length; i++) {
                        var section = this._sections[i];

                        // Only consider this section if the requested source is in the list of
                        // sources of the consumer.
                        if (section.consumer.sources.indexOf(util.getArg(aArgs, 'source')) === -1) {
                            continue;
                        }
                        var generatedPosition = section.consumer.generatedPositionFor(aArgs);
                        if (generatedPosition) {
                            var ret = {
                                line: generatedPosition.line +
                                    (section.generatedOffset.generatedLine - 1),
                                column: generatedPosition.column +
                                    (section.generatedOffset.generatedLine === generatedPosition.line ?
                                        section.generatedOffset.generatedColumn - 1 :
                                        0)
                            };
                            return ret;
                        }
                    }

                    return {
                        line: null,
                        column: null
                    };
                };

            /**
             * Parse the mappings in a string in to a data structure which we can easily
             * query (the ordered arrays in the `this.__generatedMappings` and
             * `this.__originalMappings` properties).
             */
            IndexedSourceMapConsumer.prototype._parseMappings =
                function IndexedSourceMapConsumer_parseMappings(aStr, aSourceRoot) {
                    this.__generatedMappings = [];
                    this.__originalMappings = [];
                    for (var i = 0; i < this._sections.length; i++) {
                        var section = this._sections[i];
                        var sectionMappings = section.consumer._generatedMappings;
                        for (var j = 0; j < sectionMappings.length; j++) {
                            var mapping = sectionMappings[j];

                            var source = section.consumer._sources.at(mapping.source);
                            if (section.consumer.sourceRoot !== null) {
                                source = util.join(section.consumer.sourceRoot, source);
                            }
                            this._sources.add(source);
                            source = this._sources.indexOf(source);

                            var name = section.consumer._names.at(mapping.name);
                            this._names.add(name);
                            name = this._names.indexOf(name);

                            // The mappings coming from the consumer for the section have
                            // generated positions relative to the start of the section, so we
                            // need to offset them to be relative to the start of the concatenated
                            // generated file.
                            var adjustedMapping = {
                                source: source,
                                generatedLine: mapping.generatedLine +
                                    (section.generatedOffset.generatedLine - 1),
                                generatedColumn: mapping.generatedColumn +
                                    (section.generatedOffset.generatedLine === mapping.generatedLine ?
                                        section.generatedOffset.generatedColumn - 1 :
                                        0),
                                originalLine: mapping.originalLine,
                                originalColumn: mapping.originalColumn,
                                name: name
                            };

                            this.__generatedMappings.push(adjustedMapping);
                            if (typeof adjustedMapping.originalLine === 'number') {
                                this.__originalMappings.push(adjustedMapping);
                            }
                        }
                    }

                    quickSort(this.__generatedMappings, util.compareByGeneratedPositionsDeflated);
                    quickSort(this.__originalMappings, util.compareByOriginalPositions);
                };

            exports.IndexedSourceMapConsumer = IndexedSourceMapConsumer;

        }, { "./array-set": 6, "./base64-vlq": 7, "./binary-search": 9, "./quick-sort": 10, "./util": 12 }],
        12: [function(require, module, exports) {
            /* -*- Mode: js; js-indent-level: 2; -*- */
            /*
             * Copyright 2011 Mozilla Foundation and contributors
             * Licensed under the New BSD license. See LICENSE or:
             * http://opensource.org/licenses/BSD-3-Clause
             */

            /**
             * This is a helper function for getting values from parameter/options
             * objects.
             *
             * @param args The object we are extracting values from
             * @param name The name of the property we are getting.
             * @param defaultValue An optional value to return if the property is missing
             * from the object. If this is not specified and the property is missing, an
             * error will be thrown.
             */
            function getArg(aArgs, aName, aDefaultValue) {
                if (aName in aArgs) {
                    return aArgs[aName];
                } else if (arguments.length === 3) {
                    return aDefaultValue;
                } else {
                    throw new Error('"' + aName + '" is a required argument.');
                }
            }
            exports.getArg = getArg;

            var urlRegexp = /^(?:([\w+\-.]+):)?\/\/(?:(\w+:\w+)@)?([\w.]*)(?::(\d+))?(\S*)$/;
            var dataUrlRegexp = /^data:.+\,.+$/;

            function urlParse(aUrl) {
                var match = aUrl.match(urlRegexp);
                if (!match) {
                    return null;
                }
                return {
                    scheme: match[1],
                    auth: match[2],
                    host: match[3],
                    port: match[4],
                    path: match[5]
                };
            }
            exports.urlParse = urlParse;

            function urlGenerate(aParsedUrl) {
                var url = '';
                if (aParsedUrl.scheme) {
                    url += aParsedUrl.scheme + ':';
                }
                url += '//';
                if (aParsedUrl.auth) {
                    url += aParsedUrl.auth + '@';
                }
                if (aParsedUrl.host) {
                    url += aParsedUrl.host;
                }
                if (aParsedUrl.port) {
                    url += ":" + aParsedUrl.port
                }
                if (aParsedUrl.path) {
                    url += aParsedUrl.path;
                }
                return url;
            }
            exports.urlGenerate = urlGenerate;

            /**
             * Normalizes a path, or the path portion of a URL:
             *
             * - Replaces consecutive slashes with one slash.
             * - Removes unnecessary '.' parts.
             * - Removes unnecessary '<dir>/..' parts.
             *
             * Based on code in the Node.js 'path' core module.
             *
             * @param aPath The path or url to normalize.
             */
            function normalize(aPath) {
                var path = aPath;
                var url = urlParse(aPath);
                if (url) {
                    if (!url.path) {
                        return aPath;
                    }
                    path = url.path;
                }
                var isAbsolute = exports.isAbsolute(path);

                var parts = path.split(/\/+/);
                for (var part, up = 0, i = parts.length - 1; i >= 0; i--) {
                    part = parts[i];
                    if (part === '.') {
                        parts.splice(i, 1);
                    } else if (part === '..') {
                        up++;
                    } else if (up > 0) {
                        if (part === '') {
                            // The first part is blank if the path is absolute. Trying to go
                            // above the root is a no-op. Therefore we can remove all '..' parts
                            // directly after the root.
                            parts.splice(i + 1, up);
                            up = 0;
                        } else {
                            parts.splice(i, 2);
                            up--;
                        }
                    }
                }
                path = parts.join('/');

                if (path === '') {
                    path = isAbsolute ? '/' : '.';
                }

                if (url) {
                    url.path = path;
                    return urlGenerate(url);
                }
                return path;
            }
            exports.normalize = normalize;

            /**
             * Joins two paths/URLs.
             *
             * @param aRoot The root path or URL.
             * @param aPath The path or URL to be joined with the root.
             *
             * - If aPath is a URL or a data URI, aPath is returned, unless aPath is a
             *   scheme-relative URL: Then the scheme of aRoot, if any, is prepended
             *   first.
             * - Otherwise aPath is a path. If aRoot is a URL, then its path portion
             *   is updated with the result and aRoot is returned. Otherwise the result
             *   is returned.
             *   - If aPath is absolute, the result is aPath.
             *   - Otherwise the two paths are joined with a slash.
             * - Joining for example 'http://' and 'www.example.com' is also supported.
             */
            function join(aRoot, aPath) {
                if (aRoot === "") {
                    aRoot = ".";
                }
                if (aPath === "") {
                    aPath = ".";
                }
                var aPathUrl = urlParse(aPath);
                var aRootUrl = urlParse(aRoot);
                if (aRootUrl) {
                    aRoot = aRootUrl.path || '/';
                }

                // `join(foo, '//www.example.org')`
                if (aPathUrl && !aPathUrl.scheme) {
                    if (aRootUrl) {
                        aPathUrl.scheme = aRootUrl.scheme;
                    }
                    return urlGenerate(aPathUrl);
                }

                if (aPathUrl || aPath.match(dataUrlRegexp)) {
                    return aPath;
                }

                // `join('http://', 'www.example.com')`
                if (aRootUrl && !aRootUrl.host && !aRootUrl.path) {
                    aRootUrl.host = aPath;
                    return urlGenerate(aRootUrl);
                }

                var joined = aPath.charAt(0) === '/' ?
                    aPath :
                    normalize(aRoot.replace(/\/+$/, '') + '/' + aPath);

                if (aRootUrl) {
                    aRootUrl.path = joined;
                    return urlGenerate(aRootUrl);
                }
                return joined;
            }
            exports.join = join;

            exports.isAbsolute = function(aPath) {
                return aPath.charAt(0) === '/' || !!aPath.match(urlRegexp);
            };

            /**
             * Make a path relative to a URL or another path.
             *
             * @param aRoot The root path or URL.
             * @param aPath The path or URL to be made relative to aRoot.
             */
            function relative(aRoot, aPath) {
                if (aRoot === "") {
                    aRoot = ".";
                }

                aRoot = aRoot.replace(/\/$/, '');

                // It is possible for the path to be above the root. In this case, simply
                // checking whether the root is a prefix of the path won't work. Instead, we
                // need to remove components from the root one by one, until either we find
                // a prefix that fits, or we run out of components to remove.
                var level = 0;
                while (aPath.indexOf(aRoot + '/') !== 0) {
                    var index = aRoot.lastIndexOf("/");
                    if (index < 0) {
                        return aPath;
                    }

                    // If the only part of the root that is left is the scheme (i.e. http://,
                    // file:///, etc.), one or more slashes (/), or simply nothing at all, we
                    // have exhausted all components, so the path is not relative to the root.
                    aRoot = aRoot.slice(0, index);
                    if (aRoot.match(/^([^\/]+:\/)?\/*$/)) {
                        return aPath;
                    }

                    ++level;
                }

                // Make sure we add a "../" for each component we removed from the root.
                return Array(level + 1).join("../") + aPath.substr(aRoot.length + 1);
            }
            exports.relative = relative;

            var supportsNullProto = (function() {
                var obj = Object.create(null);
                return !('__proto__' in obj);
            }());

            function identity(s) {
                return s;
            }

            /**
             * Because behavior goes wacky when you set `__proto__` on objects, we
             * have to prefix all the strings in our set with an arbitrary character.
             *
             * See https://github.com/mozilla/source-map/pull/31 and
             * https://github.com/mozilla/source-map/issues/30
             *
             * @param String aStr
             */
            function toSetString(aStr) {
                if (isProtoString(aStr)) {
                    return '$' + aStr;
                }

                return aStr;
            }
            exports.toSetString = supportsNullProto ? identity : toSetString;

            function fromSetString(aStr) {
                if (isProtoString(aStr)) {
                    return aStr.slice(1);
                }

                return aStr;
            }
            exports.fromSetString = supportsNullProto ? identity : fromSetString;

            function isProtoString(s) {
                if (!s) {
                    return false;
                }

                var length = s.length;

                if (length < 9 /* "__proto__".length */ ) {
                    return false;
                }

                if (s.charCodeAt(length - 1) !== 95 /* '_' */ ||
                    s.charCodeAt(length - 2) !== 95 /* '_' */ ||
                    s.charCodeAt(length - 3) !== 111 /* 'o' */ ||
                    s.charCodeAt(length - 4) !== 116 /* 't' */ ||
                    s.charCodeAt(length - 5) !== 111 /* 'o' */ ||
                    s.charCodeAt(length - 6) !== 114 /* 'r' */ ||
                    s.charCodeAt(length - 7) !== 112 /* 'p' */ ||
                    s.charCodeAt(length - 8) !== 95 /* '_' */ ||
                    s.charCodeAt(length - 9) !== 95 /* '_' */ ) {
                    return false;
                }

                for (var i = length - 10; i >= 0; i--) {
                    if (s.charCodeAt(i) !== 36 /* '$' */ ) {
                        return false;
                    }
                }

                return true;
            }

            /**
             * Comparator between two mappings where the original positions are compared.
             *
             * Optionally pass in `true` as `onlyCompareGenerated` to consider two
             * mappings with the same original source/line/column, but different generated
             * line and column the same. Useful when searching for a mapping with a
             * stubbed out mapping.
             */
            function compareByOriginalPositions(mappingA, mappingB, onlyCompareOriginal) {
                var cmp = mappingA.source - mappingB.source;
                if (cmp !== 0) {
                    return cmp;
                }

                cmp = mappingA.originalLine - mappingB.originalLine;
                if (cmp !== 0) {
                    return cmp;
                }

                cmp = mappingA.originalColumn - mappingB.originalColumn;
                if (cmp !== 0 || onlyCompareOriginal) {
                    return cmp;
                }

                cmp = mappingA.generatedColumn - mappingB.generatedColumn;
                if (cmp !== 0) {
                    return cmp;
                }

                cmp = mappingA.generatedLine - mappingB.generatedLine;
                if (cmp !== 0) {
                    return cmp;
                }

                return mappingA.name - mappingB.name;
            }
            exports.compareByOriginalPositions = compareByOriginalPositions;

            /**
             * Comparator between two mappings with deflated source and name indices where
             * the generated positions are compared.
             *
             * Optionally pass in `true` as `onlyCompareGenerated` to consider two
             * mappings with the same generated line and column, but different
             * source/name/original line and column the same. Useful when searching for a
             * mapping with a stubbed out mapping.
             */
            function compareByGeneratedPositionsDeflated(mappingA, mappingB, onlyCompareGenerated) {
                var cmp = mappingA.generatedLine - mappingB.generatedLine;
                if (cmp !== 0) {
                    return cmp;
                }

                cmp = mappingA.generatedColumn - mappingB.generatedColumn;
                if (cmp !== 0 || onlyCompareGenerated) {
                    return cmp;
                }

                cmp = mappingA.source - mappingB.source;
                if (cmp !== 0) {
                    return cmp;
                }

                cmp = mappingA.originalLine - mappingB.originalLine;
                if (cmp !== 0) {
                    return cmp;
                }

                cmp = mappingA.originalColumn - mappingB.originalColumn;
                if (cmp !== 0) {
                    return cmp;
                }

                return mappingA.name - mappingB.name;
            }
            exports.compareByGeneratedPositionsDeflated = compareByGeneratedPositionsDeflated;

            function strcmp(aStr1, aStr2) {
                if (aStr1 === aStr2) {
                    return 0;
                }

                if (aStr1 > aStr2) {
                    return 1;
                }

                return -1;
            }

            /**
             * Comparator between two mappings with inflated source and name strings where
             * the generated positions are compared.
             */
            function compareByGeneratedPositionsInflated(mappingA, mappingB) {
                var cmp = mappingA.generatedLine - mappingB.generatedLine;
                if (cmp !== 0) {
                    return cmp;
                }

                cmp = mappingA.generatedColumn - mappingB.generatedColumn;
                if (cmp !== 0) {
                    return cmp;
                }

                cmp = strcmp(mappingA.source, mappingB.source);
                if (cmp !== 0) {
                    return cmp;
                }

                cmp = mappingA.originalLine - mappingB.originalLine;
                if (cmp !== 0) {
                    return cmp;
                }

                cmp = mappingA.originalColumn - mappingB.originalColumn;
                if (cmp !== 0) {
                    return cmp;
                }

                return strcmp(mappingA.name, mappingB.name);
            }
            exports.compareByGeneratedPositionsInflated = compareByGeneratedPositionsInflated;

        }, {}],
        13: [function(require, module, exports) {
            arguments[4][2][0].apply(exports, arguments)
        }, { "dup": 2 }],
        14: [function(require, module, exports) {
            (function(root, factory) {
                'use strict';
                // Universal Module Definition (UMD) to support AMD, CommonJS/Node.js, Rhino, and browsers.

                /* istanbul ignore next */
                if (typeof define === 'function' && define.amd) {
                    define('stack-generator', ['stackframe'], factory);
                } else if (typeof exports === 'object') {
                    module.exports = factory(require('stackframe'));
                } else {
                    root.StackGenerator = factory(root.StackFrame);
                }
            }(this, function(StackFrame) {
                return {
                    backtrace: function StackGenerator$$backtrace(opts) {
                        var stack = [];
                        var maxStackSize = 10;

                        if (typeof opts === 'object' && typeof opts.maxStackSize === 'number') {
                            maxStackSize = opts.maxStackSize;
                        }

                        var curr = arguments.callee;
                        while (curr && stack.length < maxStackSize && curr['arguments']) {
                            // Allow V8 optimizations
                            var args = new Array(curr['arguments'].length);
                            for (var i = 0; i < args.length; ++i) {
                                args[i] = curr['arguments'][i];
                            }
                            if (/function(?:\s+([\w$]+))+\s*\(/.test(curr.toString())) {
                                stack.push(new StackFrame({ functionName: RegExp.$1 || undefined, args: args }));
                            } else {
                                stack.push(new StackFrame({ args: args }));
                            }

                            try {
                                curr = curr.caller;
                            } catch (e) {
                                break;
                            }
                        }
                        return stack;
                    }
                };
            }));

        }, { "stackframe": 13 }],
        15: [function(require, module, exports) {
            arguments[4][2][0].apply(exports, arguments)
        }, { "dup": 2 }],
        16: [function(require, module, exports) {
            (function(root, factory) {
                'use strict';
                // Universal Module Definition (UMD) to support AMD, CommonJS/Node.js, Rhino, and browsers.

                /* istanbul ignore next */
                if (typeof define === 'function' && define.amd) {
                    define('stacktrace-gps', ['source-map', 'stackframe'], factory);
                } else if (typeof exports === 'object') {
                    module.exports = factory(require('source-map/lib/source-map-consumer'), require('stackframe'));
                } else {
                    root.StackTraceGPS = factory(root.SourceMap || root.sourceMap, root.StackFrame);
                }
            }(this, function(SourceMap, StackFrame) {
                'use strict';

                /**
                 * Make a X-Domain request to url and callback.
                 *
                 * @param {String} url
                 * @returns {Promise} with response text if fulfilled
                 */
                function _xdr(url) {
                    return new Promise(function(resolve, reject) {
                        var req = new XMLHttpRequest();
                        req.open('get', url);
                        req.onerror = reject;
                        req.onreadystatechange = function onreadystatechange() {
                            if (req.readyState === 4) {
                                if ((req.status >= 200 && req.status < 300) ||
                                    (url.substr(0, 7) === 'file://' && req.responseText)) {
                                    resolve(req.responseText);
                                } else {
                                    reject(new Error('HTTP status: ' + req.status + ' retrieving ' + url));
                                }
                            }
                        };
                        req.send();
                    });

                }

                /**
                 * Convert a Base64-encoded string into its original representation.
                 * Used for inline sourcemaps.
                 *
                 * @param {String} b64str Base-64 encoded string
                 * @returns {String} original representation of the base64-encoded string.
                 */
                function _atob(b64str) {
                    if (typeof window !== 'undefined' && window.atob) {
                        return window.atob(b64str);
                    } else {
                        throw new Error('You must supply a polyfill for window.atob in this environment');
                    }
                }

                function _parseJson(string) {
                    if (typeof JSON !== 'undefined' && JSON.parse) {
                        return JSON.parse(string);
                    } else {
                        throw new Error('You must supply a polyfill for JSON.parse in this environment');
                    }
                }

                function _findFunctionName(source, lineNumber /*, columnNumber*/ ) {
                    var syntaxes = [
                        // {name} = function ({args}) TODO args capture
                        /['"]?([$_A-Za-z][$_A-Za-z0-9]*)['"]?\s*[:=]\s*function\b/,
                        // function {name}({args}) m[1]=name m[2]=args
                        /function\s+([^('"`]*?)\s*\(([^)]*)\)/,
                        // {name} = eval()
                        /['"]?([$_A-Za-z][$_A-Za-z0-9]*)['"]?\s*[:=]\s*(?:eval|new Function)\b/,
                        // fn_name() {
                        /\b(?!(?:if|for|switch|while|with|catch)\b)(?:(?:static)\s+)?(\S+)\s*\(.*?\)\s*\{/,
                        // {name} = () => {
                        /['"]?([$_A-Za-z][$_A-Za-z0-9]*)['"]?\s*[:=]\s*\(.*?\)\s*=>/
                    ];
                    var lines = source.split('\n');

                    // Walk backwards in the source lines until we find the line which matches one of the patterns above
                    var code = '';
                    var maxLines = Math.min(lineNumber, 20);
                    for (var i = 0; i < maxLines; ++i) {
                        // lineNo is 1-based, source[] is 0-based
                        var line = lines[lineNumber - i - 1];
                        var commentPos = line.indexOf('//');
                        if (commentPos >= 0) {
                            line = line.substr(0, commentPos);
                        }

                        if (line) {
                            code = line + code;
                            var len = syntaxes.length;
                            for (var index = 0; index < len; index++) {
                                var m = syntaxes[index].exec(code);
                                if (m && m[1]) {
                                    return m[1];
                                }
                            }
                        }
                    }
                    return undefined;
                }

                function _ensureSupportedEnvironment() {
                    if (typeof Object.defineProperty !== 'function' || typeof Object.create !== 'function') {
                        throw new Error('Unable to consume source maps in older browsers');
                    }
                }

                function _ensureStackFrameIsLegit(stackframe) {
                    if (typeof stackframe !== 'object') {
                        throw new TypeError('Given StackFrame is not an object');
                    } else if (typeof stackframe.fileName !== 'string') {
                        throw new TypeError('Given file name is not a String');
                    } else if (typeof stackframe.lineNumber !== 'number' ||
                        stackframe.lineNumber % 1 !== 0 ||
                        stackframe.lineNumber < 1) {
                        throw new TypeError('Given line number must be a positive integer');
                    } else if (typeof stackframe.columnNumber !== 'number' ||
                        stackframe.columnNumber % 1 !== 0 ||
                        stackframe.columnNumber < 0) {
                        throw new TypeError('Given column number must be a non-negative integer');
                    }
                    return true;
                }

                function _findSourceMappingURL(source) {
                    var sourceMappingUrlRegExp = /\/\/[#@] ?sourceMappingURL=([^\s'"]+)\s*$/mg;
                    var lastSourceMappingUrl;
                    var matchSourceMappingUrl;
                    // eslint-disable-next-line no-cond-assign
                    while (matchSourceMappingUrl = sourceMappingUrlRegExp.exec(source)) {
                        lastSourceMappingUrl = matchSourceMappingUrl[1];
                    }
                    if (lastSourceMappingUrl) {
                        return lastSourceMappingUrl;
                    } else {
                        throw new Error('sourceMappingURL not found');
                    }
                }

                function _extractLocationInfoFromSourceMapSource(stackframe, sourceMapConsumer, sourceCache) {
                    return new Promise(function(resolve, reject) {
                        var loc = sourceMapConsumer.originalPositionFor({
                            line: stackframe.lineNumber,
                            column: stackframe.columnNumber
                        });

                        if (loc.source) {
                            // cache mapped sources
                            var mappedSource = sourceMapConsumer.sourceContentFor(loc.source);
                            if (mappedSource) {
                                sourceCache[loc.source] = mappedSource;
                            }

                            resolve(
                                // given stackframe and source location, update stackframe
                                new StackFrame({
                                    functionName: loc.name || stackframe.functionName,
                                    args: stackframe.args,
                                    fileName: loc.source,
                                    lineNumber: loc.line,
                                    columnNumber: loc.column
                                }));
                        } else {
                            reject(new Error('Could not get original source for given stackframe and source map'));
                        }
                    });
                }

                /**
                 * @constructor
                 * @param {Object} opts
                 *      opts.sourceCache = {url: "Source String"} => preload source cache
                 *      opts.sourceMapConsumerCache = {/path/file.js.map: SourceMapConsumer}
                 *      opts.offline = True to prevent network requests.
                 *              Best effort without sources or source maps.
                 *      opts.ajax = Promise returning function to make X-Domain requests
                 */
                return function StackTraceGPS(opts) {
                    if (!(this instanceof StackTraceGPS)) {
                        return new StackTraceGPS(opts);
                    }
                    opts = opts || {};

                    this.sourceCache = opts.sourceCache || {};
                    this.sourceMapConsumerCache = opts.sourceMapConsumerCache || {};

                    this.ajax = opts.ajax || _xdr;

                    this._atob = opts.atob || _atob;

                    this._get = function _get(location) {
                        return new Promise(function(resolve, reject) {
                            var isDataUrl = location.substr(0, 5) === 'data:';
                            if (this.sourceCache[location]) {
                                resolve(this.sourceCache[location]);
                            } else if (opts.offline && !isDataUrl) {
                                reject(new Error('Cannot make network requests in offline mode'));
                            } else {
                                if (isDataUrl) {
                                    // data URLs can have parameters.
                                    // see http://tools.ietf.org/html/rfc2397
                                    var supportedEncodingRegexp =
                                        /^data:application\/json;([\w=:"-]+;)*base64,/;
                                    var match = location.match(supportedEncodingRegexp);
                                    if (match) {
                                        var sourceMapStart = match[0].length;
                                        var encodedSource = location.substr(sourceMapStart);
                                        var source = this._atob(encodedSource);
                                        this.sourceCache[location] = source;
                                        resolve(source);
                                    } else {
                                        reject(new Error('The encoding of the inline sourcemap is not supported'));
                                    }
                                } else {
                                    var xhrPromise = this.ajax(location, { method: 'get' });
                                    // Cache the Promise to prevent duplicate in-flight requests
                                    this.sourceCache[location] = xhrPromise;
                                    xhrPromise.then(resolve, reject);
                                }
                            }
                        }.bind(this));
                    };

                    /**
                     * Creating SourceMapConsumers is expensive, so this wraps the creation of a
                     * SourceMapConsumer in a per-instance cache.
                     *
                     * @param {String} sourceMappingURL = URL to fetch source map from
                     * @param {String} defaultSourceRoot = Default source root for source map if undefined
                     * @returns {Promise} that resolves a SourceMapConsumer
                     */
                    this._getSourceMapConsumer = function _getSourceMapConsumer(sourceMappingURL, defaultSourceRoot) {
                        return new Promise(function(resolve) {
                            if (this.sourceMapConsumerCache[sourceMappingURL]) {
                                resolve(this.sourceMapConsumerCache[sourceMappingURL]);
                            } else {
                                var sourceMapConsumerPromise = new Promise(function(resolve, reject) {
                                    return this._get(sourceMappingURL).then(function(sourceMapSource) {
                                        if (typeof sourceMapSource === 'string') {
                                            sourceMapSource = _parseJson(sourceMapSource.replace(/^\)\]\}'/, ''));
                                        }
                                        if (typeof sourceMapSource.sourceRoot === 'undefined') {
                                            sourceMapSource.sourceRoot = defaultSourceRoot;
                                        }

                                        resolve(new SourceMap.SourceMapConsumer(sourceMapSource));
                                    }, reject);
                                }.bind(this));
                                this.sourceMapConsumerCache[sourceMappingURL] = sourceMapConsumerPromise;
                                resolve(sourceMapConsumerPromise);
                            }
                        }.bind(this));
                    };

                    /**
                     * Given a StackFrame, enhance function name and use source maps for a
                     * better StackFrame.
                     *
                     * @param {StackFrame} stackframe object
                     * @returns {Promise} that resolves with with source-mapped StackFrame
                     */
                    this.pinpoint = function StackTraceGPS$$pinpoint(stackframe) {
                        return new Promise(function(resolve, reject) {
                            this.getMappedLocation(stackframe).then(function(mappedStackFrame) {
                                function resolveMappedStackFrame() {
                                    resolve(mappedStackFrame);
                                }

                                this.findFunctionName(mappedStackFrame)
                                    .then(resolve, resolveMappedStackFrame)
                                    // eslint-disable-next-line no-unexpected-multiline
                                    ['catch'](resolveMappedStackFrame);
                            }.bind(this), reject);
                        }.bind(this));
                    };

                    /**
                     * Given a StackFrame, guess function name from location information.
                     *
                     * @param {StackFrame} stackframe
                     * @returns {Promise} that resolves with enhanced StackFrame.
                     */
                    this.findFunctionName = function StackTraceGPS$$findFunctionName(stackframe) {
                        return new Promise(function(resolve, reject) {
                            _ensureStackFrameIsLegit(stackframe);
                            this._get(stackframe.fileName).then(function getSourceCallback(source) {
                                var lineNumber = stackframe.lineNumber;
                                var columnNumber = stackframe.columnNumber;
                                var guessedFunctionName = _findFunctionName(source, lineNumber, columnNumber);
                                // Only replace functionName if we found something
                                if (guessedFunctionName) {
                                    resolve(new StackFrame({
                                        functionName: guessedFunctionName,
                                        args: stackframe.args,
                                        fileName: stackframe.fileName,
                                        lineNumber: lineNumber,
                                        columnNumber: columnNumber
                                    }));
                                } else {
                                    resolve(stackframe);
                                }
                            }, reject)['catch'](reject);
                        }.bind(this));
                    };

                    /**
                     * Given a StackFrame, seek source-mapped location and return new enhanced StackFrame.
                     *
                     * @param {StackFrame} stackframe
                     * @returns {Promise} that resolves with enhanced StackFrame.
                     */
                    this.getMappedLocation = function StackTraceGPS$$getMappedLocation(stackframe) {
                        return new Promise(function(resolve, reject) {
                            _ensureSupportedEnvironment();
                            _ensureStackFrameIsLegit(stackframe);

                            var sourceCache = this.sourceCache;
                            var fileName = stackframe.fileName;
                            this._get(fileName).then(function(source) {
                                var sourceMappingURL = _findSourceMappingURL(source);
                                var isDataUrl = sourceMappingURL.substr(0, 5) === 'data:';
                                var defaultSourceRoot = fileName.substring(0, fileName.lastIndexOf('/') + 1);

                                if (sourceMappingURL[0] !== '/' && !isDataUrl && !(/^https?:\/\/|^\/\//i).test(sourceMappingURL)) {
                                    sourceMappingURL = defaultSourceRoot + sourceMappingURL;
                                }

                                return this._getSourceMapConsumer(sourceMappingURL, defaultSourceRoot)
                                    .then(function(sourceMapConsumer) {
                                        return _extractLocationInfoFromSourceMapSource(stackframe, sourceMapConsumer, sourceCache)
                                            .then(resolve)['catch'](function() {
                                                resolve(stackframe);
                                            });
                                    });
                            }.bind(this), reject)['catch'](reject);
                        }.bind(this));
                    };
                };
            }));

        }, { "source-map/lib/source-map-consumer": 11, "stackframe": 15 }],
        17: [function(require, module, exports) {
            // Polyfill for old browsers
            // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/isArray
            if (!Array.isArray) {
                Array.isArray = function(arg) {
                    return Object.prototype.toString.call(arg) === '[object Array]';
                };
            }

            if (typeof Promise === 'undefined') {
                ES6Promise.polyfill();
            }

            // ES5 Polyfills
            // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind
            if (!Function.prototype.bind) {
                Function.prototype.bind = function(oThis) {
                    if (typeof this !== 'function') {
                        throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable');
                    }

                    var aArgs = Array.prototype.slice.call(arguments, 1);
                    var fToBind = this;
                    var NoOp = function() {};
                    var fBound = function() {
                        return fToBind.apply(this instanceof NoOp && oThis ? this : oThis,
                            aArgs.concat(Array.prototype.slice.call(arguments)));
                    };

                    NoOp.prototype = this.prototype;
                    fBound.prototype = new NoOp();

                    return fBound;
                };
            }

            // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map
            if (!Array.prototype.map) {
                Array.prototype.map = function(callback, thisArg) {
                    if (this === void 0 || this === null) {
                        throw new TypeError('this is null or not defined');
                    }
                    var O = Object(this);
                    var len = O.length >>> 0;
                    var T;
                    if (typeof callback !== 'function') {
                        throw new TypeError(callback + ' is not a function');
                    }
                    if (arguments.length > 1) {
                        T = thisArg;
                    }

                    var A = new Array(len);
                    var k = 0;

                    while (k < len) {
                        var kValue;
                        var mappedValue;
                        if (k in O) {
                            kValue = O[k];
                            mappedValue = callback.call(T, kValue, k, O);
                            A[k] = mappedValue;
                        }
                        k++;
                    }

                    return A;
                };
            }

            // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter
            if (!Array.prototype.filter) {
                Array.prototype.filter = function(callback /*, thisArg*/ ) {
                    if (this === void 0 || this === null) {
                        throw new TypeError('this is null or not defined');
                    }

                    var t = Object(this);
                    var len = t.length >>> 0;
                    if (typeof callback !== 'function') {
                        throw new TypeError(callback + ' is not a function');
                    }

                    var res = [];
                    var thisArg = arguments.length >= 2 ? arguments[1] : void 0;
                    for (var i = 0; i < len; i++) {
                        if (i in t) {
                            var val = t[i];
                            if (callback.call(thisArg, val, i, t)) {
                                res.push(val);
                            }
                        }
                    }

                    return res;
                };
            }

            // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach
            if (!Array.prototype.forEach) {
                Array.prototype.forEach = function(callback, thisArg) {
                    var T;
                    var k;
                    if (this === null || this === undefined) {
                        throw new TypeError(' this is null or not defined');
                    }

                    var O = Object(this);
                    var len = O.length >>> 0;
                    if (typeof callback !== 'function') {
                        throw new TypeError(callback + ' is not a function');
                    }

                    if (arguments.length > 1) {
                        T = thisArg;
                    }
                    k = 0;
                    while (k < len) {
                        var kValue;
                        if (k in O) {
                            kValue = O[k];
                            callback.call(T, kValue, k, O);
                        }
                        k++;
                    }
                };
            }

        }, {}],
        18: [function(require, module, exports) {
            (function(root, factory) {
                'use strict';
                // Universal Module Definition (UMD) to support AMD, CommonJS/Node.js, Rhino, and browsers.

                /* istanbul ignore next */
                if (typeof define === 'function' && define.amd) {
                    define('stacktrace', ['error-stack-parser', 'stack-generator', 'stacktrace-gps'], factory);
                } else if (typeof exports === 'object') {
                    module.exports = factory(require('error-stack-parser'), require('stack-generator'), require('stacktrace-gps'));
                } else {
                    root.StackTrace = factory(root.ErrorStackParser, root.StackGenerator, root.StackTraceGPS);
                }
            }(this, function StackTrace(ErrorStackParser, StackGenerator, StackTraceGPS) {
                var _options = {
                    filter: function(stackframe) {
                        // Filter out stackframes for this library by default
                        return (stackframe.functionName || '').indexOf('StackTrace$$') === -1 &&
                            (stackframe.functionName || '').indexOf('ErrorStackParser$$') === -1 &&
                            (stackframe.functionName || '').indexOf('StackTraceGPS$$') === -1 &&
                            (stackframe.functionName || '').indexOf('StackGenerator$$') === -1;
                    },
                    sourceCache: {}
                };

                var _generateError = function StackTrace$$GenerateError() {
                    try {
                        // Error must be thrown to get stack in IE
                        throw new Error();
                    } catch (err) {
                        return err;
                    }
                };

                /**
                 * Merge 2 given Objects. If a conflict occurs the second object wins.
                 * Does not do deep merges.
                 *
                 * @param {Object} first base object
                 * @param {Object} second overrides
                 * @returns {Object} merged first and second
                 * @private
                 */
                function _merge(first, second) {
                    var target = {};

                    [first, second].forEach(function(obj) {
                        for (var prop in obj) {
                            if (Object.prototype.hasOwnProperty.call(obj, prop)) {
                                target[prop] = obj[prop];
                            }
                        }
                        return target;
                    });

                    return target;
                }

                function _isShapedLikeParsableError(err) {
                    return err.stack || err['opera#sourceloc'];
                }

                function _filtered(stackframes, filter) {
                    if (typeof filter === 'function') {
                        return stackframes.filter(filter);
                    }
                    return stackframes;
                }

                return {
                    /**
                     * Get a backtrace from invocation point.
                     *
                     * @param {Object} opts
                     * @returns {Array} of StackFrame
                     */
                    get: function StackTrace$$get(opts) {
                        var err = _generateError();
                        return _isShapedLikeParsableError(err) ? this.fromError(err, opts) : this.generateArtificially(opts);
                    },

                    /**
                     * Get a backtrace from invocation point.
                     * IMPORTANT: Does not handle source maps or guess function names!
                     *
                     * @param {Object} opts
                     * @returns {Array} of StackFrame
                     */
                    getSync: function StackTrace$$getSync(opts) {
                        opts = _merge(_options, opts);
                        var err = _generateError();
                        var stack = _isShapedLikeParsableError(err) ? ErrorStackParser.parse(err) : StackGenerator.backtrace(opts);
                        return _filtered(stack, opts.filter);
                    },

                    /**
                     * Given an error object, parse it.
                     *
                     * @param {Error} error object
                     * @param {Object} opts
                     * @returns {Promise} for Array[StackFrame}
                     */
                    fromError: function StackTrace$$fromError(error, opts) {
                        opts = _merge(_options, opts);
                        var gps = new StackTraceGPS(opts);
                        return new Promise(function(resolve) {
                            var stackframes = _filtered(ErrorStackParser.parse(error), opts.filter);
                            resolve(Promise.all(stackframes.map(function(sf) {
                                return new Promise(function(resolve) {
                                    function resolveOriginal() {
                                        resolve(sf);
                                    }

                                    gps.pinpoint(sf).then(resolve, resolveOriginal)['catch'](resolveOriginal);
                                });
                            })));
                        }.bind(this));
                    },

                    /**
                     * Use StackGenerator to generate a backtrace.
                     *
                     * @param {Object} opts
                     * @returns {Promise} of Array[StackFrame]
                     */
                    generateArtificially: function StackTrace$$generateArtificially(opts) {
                        opts = _merge(_options, opts);
                        var stackFrames = StackGenerator.backtrace(opts);
                        if (typeof opts.filter === 'function') {
                            stackFrames = stackFrames.filter(opts.filter);
                        }
                        return Promise.resolve(stackFrames);
                    },

                    /**
                     * Given a function, wrap it such that invocations trigger a callback that
                     * is called with a stack trace.
                     *
                     * @param {Function} fn to be instrumented
                     * @param {Function} callback function to call with a stack trace on invocation
                     * @param {Function} errback optional function to call with error if unable to get stack trace.
                     * @param {Object} thisArg optional context object (e.g. window)
                     */
                    instrument: function StackTrace$$instrument(fn, callback, errback, thisArg) {
                        if (typeof fn !== 'function') {
                            throw new Error('Cannot instrument non-function object');
                        } else if (typeof fn.__stacktraceOriginalFn === 'function') {
                            // Already instrumented, return given Function
                            return fn;
                        }

                        var instrumented = function StackTrace$$instrumented() {
                            try {
                                this.get().then(callback, errback)['catch'](errback);
                                return fn.apply(thisArg || this, arguments);
                            } catch (e) {
                                if (_isShapedLikeParsableError(e)) {
                                    this.fromError(e).then(callback, errback)['catch'](errback);
                                }
                                throw e;
                            }
                        }.bind(this);
                        instrumented.__stacktraceOriginalFn = fn;

                        return instrumented;
                    },

                    /**
                     * Given a function that has been instrumented,
                     * revert the function to it's original (non-instrumented) state.
                     *
                     * @param {Function} fn to de-instrument
                     */
                    deinstrument: function StackTrace$$deinstrument(fn) {
                        if (typeof fn !== 'function') {
                            throw new Error('Cannot de-instrument non-function object');
                        } else if (typeof fn.__stacktraceOriginalFn === 'function') {
                            return fn.__stacktraceOriginalFn;
                        } else {
                            // Function not instrumented, return original
                            return fn;
                        }
                    },

                    /**
                     * Given an error message and Array of StackFrames, serialize and POST to given URL.
                     *
                     * @param {Array} stackframes
                     * @param {String} url
                     * @param {String} errorMsg
                     * @param {Object} requestOptions
                     */
                    report: function StackTrace$$report(stackframes, url, errorMsg, requestOptions) {
                        return new Promise(function(resolve, reject) {
                            var req = new XMLHttpRequest();
                            req.onerror = reject;
                            req.onreadystatechange = function onreadystatechange() {
                                if (req.readyState === 4) {
                                    if (req.status >= 200 && req.status < 400) {
                                        resolve(req.responseText);
                                    } else {
                                        reject(new Error('POST to ' + url + ' failed with status: ' + req.status));
                                    }
                                }
                            };
                            req.open('post', url);

                            // Set request headers
                            req.setRequestHeader('Content-Type', 'application/json');
                            if (requestOptions && typeof requestOptions.headers === 'object') {
                                var headers = requestOptions.headers;
                                for (var header in headers) {
                                    if (Object.prototype.hasOwnProperty.call(headers, header)) {
                                        req.setRequestHeader(header, headers[header]);
                                    }
                                }
                            }

                            var reportPayload = { stack: stackframes };
                            if (errorMsg !== undefined && errorMsg !== null) {
                                reportPayload.message = errorMsg;
                            }

                            req.send(JSON.stringify(reportPayload));
                        });
                    }
                };
            }));

        }, { "error-stack-parser": 1, "stack-generator": 14, "stacktrace-gps": 16 }]
    }, {}, [3, 4, 17, 18])(18)
});