! function(t, e) {
    if ("object" == typeof exports && "object" == typeof module) module.exports = e(require("jQuery"));
    else if ("function" == typeof define && define.amd) define(["jQuery"], e);
    else {
        var n = "object" == typeof exports ? e(require("jQuery")) : e(t.jQuery);
        for (var i in n)("object" == typeof exports ? exports : t)[i] = n[i]
    }
}(self, (function(t) {
    return function() {
        var e = {
                3943: function(t, e, n) {
                    var i, r, s;
                    s = this, i = [n(1145)], r = function(t) {
                        return s.Bloodhound = (e = t, n = function() {
                            "use strict";
                            return {
                                isMsie: function() {
                                    return !!/(msie|trident)/i.test(navigator.userAgent) && navigator.userAgent.match(/(msie |rv:)(\d+(.\d+)?)/i)[2]
                                },
                                isBlankString: function(t) {
                                    return !t || /^\s*$/.test(t)
                                },
                                escapeRegExChars: function(t) {
                                    return t.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&")
                                },
                                isString: function(t) {
                                    return "string" == typeof t
                                },
                                isNumber: function(t) {
                                    return "number" == typeof t
                                },
                                isArray: e.isArray,
                                isFunction: e.isFunction,
                                isObject: e.isPlainObject,
                                isUndefined: function(t) {
                                    return void 0 === t
                                },
                                isElement: function(t) {
                                    return !(!t || 1 !== t.nodeType)
                                },
                                isJQuery: function(t) {
                                    return t instanceof e
                                },
                                toStr: function(t) {
                                    return n.isUndefined(t) || null === t ? "" : t + ""
                                },
                                bind: e.proxy,
                                each: function(t, n) {
                                    function i(t, e) {
                                        return n(e, t)
                                    }
                                    e.each(t, i)
                                },
                                map: e.map,
                                filter: e.grep,
                                every: function(t, n) {
                                    var i = !0;
                                    return t ? (e.each(t, (function(e, r) {
                                        if (!(i = n.call(null, r, e, t))) return !1
                                    })), !!i) : i
                                },
                                some: function(t, n) {
                                    var i = !1;
                                    return t ? (e.each(t, (function(e, r) {
                                        if (i = n.call(null, r, e, t)) return !1
                                    })), !!i) : i
                                },
                                mixin: e.extend,
                                identity: function(t) {
                                    return t
                                },
                                clone: function(t) {
                                    return e.extend(!0, {}, t)
                                },
                                getIdGenerator: function() {
                                    var t = 0;
                                    return function() {
                                        return t++
                                    }
                                },
                                templatify: function(t) {
                                    return e.isFunction(t) ? t : n;

                                    function n() {
                                        return String(t)
                                    }
                                },
                                defer: function(t) {
                                    setTimeout(t, 0)
                                },
                                debounce: function(t, e, n) {
                                    var i, r;
                                    return function() {
                                        var s, o, u = this,
                                            a = arguments;
                                        return s = function() {
                                            i = null, n || (r = t.apply(u, a))
                                        }, o = n && !i, clearTimeout(i), i = setTimeout(s, e), o && (r = t.apply(u, a)), r
                                    }
                                },
                                throttle: function(t, e) {
                                    var n, i, r, s, o, u;
                                    return o = 0, u = function() {
                                            o = new Date, r = null, s = t.apply(n, i)
                                        },
                                        function() {
                                            var a = new Date,
                                                c = e - (a - o);
                                            return n = this, i = arguments, c <= 0 ? (clearTimeout(r), r = null, o = a, s = t.apply(n, i)) : r || (r = setTimeout(u, c)), s
                                        }
                                },
                                stringify: function(t) {
                                    return n.isString(t) ? t : JSON.stringify(t)
                                },
                                noop: function() {}
                            }
                        }(), i = "0.11.1", r = function() {
                            "use strict";
                            return {
                                nonword: e,
                                whitespace: t,
                                obj: {
                                    nonword: i(e),
                                    whitespace: i(t)
                                }
                            };

                            function t(t) {
                                return (t = n.toStr(t)) ? t.split(/\s+/) : []
                            }

                            function e(t) {
                                return (t = n.toStr(t)) ? t.split(/\W+/) : []
                            }

                            function i(t) {
                                return function(e) {
                                    return e = n.isArray(e) ? e : [].slice.call(arguments, 0),
                                        function(i) {
                                            var r = [];
                                            return n.each(e, (function(e) {
                                                r = r.concat(t(n.toStr(i[e])))
                                            })), r
                                        }
                                }
                            }
                        }(), o = function() {
                            "use strict";

                            function t(t) {
                                this.maxSize = n.isNumber(t) ? t : 100, this.reset(), this.maxSize <= 0 && (this.set = this.get = e.noop)
                            }

                            function i() {
                                this.head = this.tail = null
                            }

                            function r(t, e) {
                                this.key = t, this.val = e, this.prev = this.next = null
                            }
                            return n.mixin(t.prototype, {
                                set: function(t, e) {
                                    var n, i = this.list.tail;
                                    this.size >= this.maxSize && (this.list.remove(i), delete this.hash[i.key], this.size--), (n = this.hash[t]) ? (n.val = e, this.list.moveToFront(n)) : (n = new r(t, e), this.list.add(n), this.hash[t] = n, this.size++)
                                },
                                get: function(t) {
                                    var e = this.hash[t];
                                    if (e) return this.list.moveToFront(e), e.val
                                },
                                reset: function() {
                                    this.size = 0, this.hash = {}, this.list = new i
                                }
                            }), n.mixin(i.prototype, {
                                add: function(t) {
                                    this.head && (t.next = this.head, this.head.prev = t), this.head = t, this.tail = this.tail || t
                                },
                                remove: function(t) {
                                    t.prev ? t.prev.next = t.next : this.head = t.next, t.next ? t.next.prev = t.prev : this.tail = t.prev
                                },
                                moveToFront: function(t) {
                                    this.remove(t), this.add(t)
                                }
                            }), t
                        }(), u = function() {
                            "use strict";
                            var t;
                            try {
                                (t = window.localStorage).setItem("~~~", "!"), t.removeItem("~~~")
                            } catch (e) {
                                t = null
                            }

                            function i(e, i) {
                                this.prefix = ["__", e, "__"].join(""), this.ttlKey = "__ttl__", this.keyMatcher = new RegExp("^" + n.escapeRegExChars(this.prefix)), this.ls = i || t, !this.ls && this._noop()
                            }
                            return n.mixin(i.prototype, {
                                _prefix: function(t) {
                                    return this.prefix + t
                                },
                                _ttlKey: function(t) {
                                    return this._prefix(t) + this.ttlKey
                                },
                                _noop: function() {
                                    this.get = this.set = this.remove = this.clear = this.isExpired = n.noop
                                },
                                _safeSet: function(t, e) {
                                    try {
                                        this.ls.setItem(t, e)
                                    } catch (t) {
                                        "QuotaExceededError" === t.name && (this.clear(), this._noop())
                                    }
                                },
                                get: function(t) {
                                    return this.isExpired(t) && this.remove(t), o(this.ls.getItem(this._prefix(t)))
                                },
                                set: function(t, e, i) {
                                    return n.isNumber(i) ? this._safeSet(this._ttlKey(t), s(r() + i)) : this.ls.removeItem(this._ttlKey(t)), this._safeSet(this._prefix(t), s(e))
                                },
                                remove: function(t) {
                                    return this.ls.removeItem(this._ttlKey(t)), this.ls.removeItem(this._prefix(t)), this
                                },
                                clear: function() {
                                    var t, e = u(this.keyMatcher);
                                    for (t = e.length; t--;) this.remove(e[t]);
                                    return this
                                },
                                isExpired: function(t) {
                                    var e = o(this.ls.getItem(this._ttlKey(t)));
                                    return !!(n.isNumber(e) && r() > e)
                                }
                            }), i;

                            function r() {
                                return (new Date).getTime()
                            }

                            function s(t) {
                                return JSON.stringify(n.isUndefined(t) ? null : t)
                            }

                            function o(t) {
                                return e.parseJSON(t)
                            }

                            function u(e) {
                                var n, i, r = [],
                                    s = t.length;
                                for (n = 0; n < s; n++)(i = t.key(n)).match(e) && r.push(i.replace(e, ""));
                                return r
                            }
                        }(), a = function() {
                            "use strict";
                            var t = 0,
                                i = {},
                                r = 6,
                                s = new o(10);

                            function u(t) {
                                t = t || {}, this.cancelled = !1, this.lastReq = null, this._send = t.transport, this._get = t.limiter ? t.limiter(this._get) : this._get, this._cache = !1 === t.cache ? new o(0) : s
                            }
                            return u.setMaxPendingRequests = function(t) {
                                r = t
                            }, u.resetCache = function() {
                                s.reset()
                            }, n.mixin(u.prototype, {
                                _fingerprint: function(t) {
                                    return (t = t || {}).url + t.type + e.param(t.data || {})
                                },
                                _get: function(e, n) {
                                    var s, o, u = this;

                                    function a(t) {
                                        n(null, t), u._cache.set(s, t)
                                    }

                                    function c() {
                                        n(!0)
                                    }

                                    function h() {
                                        t--, delete i[s], u.onDeckRequestArgs && (u._get.apply(u, u.onDeckRequestArgs), u.onDeckRequestArgs = null)
                                    }
                                    s = this._fingerprint(e), this.cancelled || s !== this.lastReq || ((o = i[s]) ? o.done(a).fail(c) : t < r ? (t++, i[s] = this._send(e).done(a).fail(c).always(h)) : this.onDeckRequestArgs = [].slice.call(arguments, 0))
                                },
                                get: function(t, i) {
                                    var r, s;
                                    i = i || e.noop, t = n.isString(t) ? {
                                        url: t
                                    } : t || {}, s = this._fingerprint(t), this.cancelled = !1, this.lastReq = s, (r = this._cache.get(s)) ? i(null, r) : this._get(t, i)
                                },
                                cancel: function() {
                                    this.cancelled = !0
                                }
                            }), u
                        }(), c = window.SearchIndex = function() {
                            "use strict";
                            var t = "c",
                                i = "i";

                            function r(t) {
                                (t = t || {}).datumTokenizer && t.queryTokenizer || e.error("datumTokenizer and queryTokenizer are both required"), this.identify = t.identify || n.stringify, this.datumTokenizer = t.datumTokenizer, this.queryTokenizer = t.queryTokenizer, this.reset()
                            }
                            return n.mixin(r.prototype, {
                                bootstrap: function(t) {
                                    this.datums = t.datums, this.trie = t.trie
                                },
                                add: function(e) {
                                    var r = this;
                                    e = n.isArray(e) ? e : [e], n.each(e, (function(e) {
                                        var u, a;
                                        r.datums[u = r.identify(e)] = e, a = s(r.datumTokenizer(e)), n.each(a, (function(e) {
                                            var n, s, a;
                                            for (n = r.trie, s = e.split(""); a = s.shift();)(n = n[t][a] || (n[t][a] = o()))[i].push(u)
                                        }))
                                    }))
                                },
                                get: function(t) {
                                    var e = this;
                                    return n.map(t, (function(t) {
                                        return e.datums[t]
                                    }))
                                },
                                search: function(e) {
                                    var r, o, c = this;
                                    return r = s(this.queryTokenizer(e)), n.each(r, (function(e) {
                                        var n, r, s, u;
                                        if (o && 0 === o.length) return !1;
                                        for (n = c.trie, r = e.split(""); n && (s = r.shift());) n = n[t][s];
                                        if (!n || 0 !== r.length) return o = [], !1;
                                        u = n[i].slice(0), o = o ? a(o, u) : u
                                    })), o ? n.map(u(o), (function(t) {
                                        return c.datums[t]
                                    })) : []
                                },
                                all: function() {
                                    var t = [];
                                    for (var e in this.datums) t.push(this.datums[e]);
                                    return t
                                },
                                reset: function() {
                                    this.datums = {}, this.trie = o()
                                },
                                serialize: function() {
                                    return {
                                        datums: this.datums,
                                        trie: this.trie
                                    }
                                }
                            }), r;

                            function s(t) {
                                return t = n.filter(t, (function(t) {
                                    return !!t
                                })), t = n.map(t, (function(t) {
                                    return t.toLowerCase()
                                }))
                            }

                            function o() {
                                var e = {};
                                return e[i] = [], e[t] = {}, e
                            }

                            function u(t) {
                                for (var e = {}, n = [], i = 0, r = t.length; i < r; i++) e[t[i]] || (e[t[i]] = !0, n.push(t[i]));
                                return n
                            }

                            function a(t, e) {
                                var n = 0,
                                    i = 0,
                                    r = [];
                                t = t.sort(), e = e.sort();
                                for (var s = t.length, o = e.length; n < s && i < o;) t[n] < e[i] ? n++ : (t[n] > e[i] || (r.push(t[n]), n++), i++);
                                return r
                            }
                        }(), h = function() {
                            "use strict";
                            var t;

                            function e(t) {
                                this.url = t.url, this.ttl = t.ttl, this.cache = t.cache, this.prepare = t.prepare, this.transform = t.transform, this.transport = t.transport, this.thumbprint = t.thumbprint, this.storage = new u(t.cacheKey)
                            }
                            return t = {
                                data: "data",
                                protocol: "protocol",
                                thumbprint: "thumbprint"
                            }, n.mixin(e.prototype, {
                                _settings: function() {
                                    return {
                                        url: this.url,
                                        type: "GET",
                                        dataType: "json"
                                    }
                                },
                                store: function(e) {
                                    this.cache && (this.storage.set(t.data, e, this.ttl), this.storage.set(t.protocol, location.protocol, this.ttl), this.storage.set(t.thumbprint, this.thumbprint, this.ttl))
                                },
                                fromCache: function() {
                                    var e, n = {};
                                    return this.cache ? (n.data = this.storage.get(t.data), n.protocol = this.storage.get(t.protocol), n.thumbprint = this.storage.get(t.thumbprint), e = n.thumbprint !== this.thumbprint || n.protocol !== location.protocol, n.data && !e ? n.data : null) : null
                                },
                                fromNetwork: function(t) {
                                    var e, n = this;

                                    function i() {
                                        t(!0)
                                    }

                                    function r(e) {
                                        t(null, n.transform(e))
                                    }
                                    t && (e = this.prepare(this._settings()), this.transport(e).fail(i).done(r))
                                },
                                clear: function() {
                                    return this.storage.clear(), this
                                }
                            }), e
                        }(), l = function() {
                            "use strict";

                            function t(t) {
                                this.url = t.url, this.prepare = t.prepare, this.transform = t.transform, this.transport = new a({
                                    cache: t.cache,
                                    limiter: t.limiter,
                                    transport: t.transport
                                })
                            }
                            return n.mixin(t.prototype, {
                                _settings: function() {
                                    return {
                                        url: this.url,
                                        type: "GET",
                                        dataType: "json"
                                    }
                                },
                                get: function(t, e) {
                                    var n, i = this;
                                    if (e) return t = t || "", n = this.prepare(t, this._settings()), this.transport.get(n, r);

                                    function r(t, n) {
                                        e(t ? [] : i.transform(n))
                                    }
                                },
                                cancelLastRequest: function() {
                                    this.transport.cancel()
                                }
                            }), t
                        }(), f = function() {
                            "use strict";
                            return function(i) {
                                var s, o;
                                return s = {
                                    initialize: !0,
                                    identify: n.stringify,
                                    datumTokenizer: null,
                                    queryTokenizer: null,
                                    sufficient: 5,
                                    sorter: null,
                                    local: [],
                                    prefetch: null,
                                    remote: null
                                }, !(i = n.mixin(s, i || {})).datumTokenizer && e.error("datumTokenizer is required"), !i.queryTokenizer && e.error("queryTokenizer is required"), o = i.sorter, i.sorter = o ? function(t) {
                                    return t.sort(o)
                                } : n.identity, i.local = n.isFunction(i.local) ? i.local() : i.local, i.prefetch = t(i.prefetch), i.remote = r(i.remote), i
                            };

                            function t(t) {
                                var r;
                                return t ? (r = {
                                    url: null,
                                    ttl: 864e5,
                                    cache: !0,
                                    cacheKey: null,
                                    thumbprint: "",
                                    prepare: n.identity,
                                    transform: n.identity,
                                    transport: null
                                }, t = n.isString(t) ? {
                                    url: t
                                } : t, !(t = n.mixin(r, t)).url && e.error("prefetch requires url to be set"), t.transform = t.filter || t.transform, t.cacheKey = t.cacheKey || t.url, t.thumbprint = i + t.thumbprint, t.transport = t.transport ? u(t.transport) : e.ajax, t) : null
                            }

                            function r(t) {
                                var i;
                                if (t) return i = {
                                    url: null,
                                    cache: !0,
                                    prepare: null,
                                    replace: null,
                                    wildcard: null,
                                    limiter: null,
                                    rateLimitBy: "debounce",
                                    rateLimitWait: 300,
                                    transform: n.identity,
                                    transport: null
                                }, t = n.isString(t) ? {
                                    url: t
                                } : t, !(t = n.mixin(i, t)).url && e.error("remote requires url to be set"), t.transform = t.filter || t.transform, t.prepare = s(t), t.limiter = o(t), t.transport = t.transport ? u(t.transport) : e.ajax, delete t.replace, delete t.wildcard, delete t.rateLimitBy, delete t.rateLimitWait, t
                            }

                            function s(t) {
                                var e, n, i;
                                return e = t.prepare, n = t.replace, i = t.wildcard, e || (e = n ? r : t.wildcard ? s : o);

                                function r(t, e) {
                                    return e.url = n(e.url, t), e
                                }

                                function s(t, e) {
                                    return e.url = e.url.replace(i, encodeURIComponent(t)), e
                                }

                                function o(t, e) {
                                    return e
                                }
                            }

                            function o(t) {
                                var e, i, r;
                                return e = t.limiter, i = t.rateLimitBy, r = t.rateLimitWait, e || (e = /^throttle$/i.test(i) ? o(r) : s(r)), e;

                                function s(t) {
                                    return function(e) {
                                        return n.debounce(e, t)
                                    }
                                }

                                function o(t) {
                                    return function(e) {
                                        return n.throttle(e, t)
                                    }
                                }
                            }

                            function u(t) {
                                return function(i) {
                                    var r = e.Deferred();
                                    return t(i, s, o), r;

                                    function s(t) {
                                        n.defer((function() {
                                            r.resolve(t)
                                        }))
                                    }

                                    function o(t) {
                                        n.defer((function() {
                                            r.reject(t)
                                        }))
                                    }
                                }
                            }
                        }(), d = function() {
                            "use strict";
                            var t;

                            function i(t) {
                                t = f(t), this.sorter = t.sorter, this.identify = t.identify, this.sufficient = t.sufficient, this.local = t.local, this.remote = t.remote ? new l(t.remote) : null, this.prefetch = t.prefetch ? new h(t.prefetch) : null, this.index = new c({
                                    identify: this.identify,
                                    datumTokenizer: t.datumTokenizer,
                                    queryTokenizer: t.queryTokenizer
                                }), !1 !== t.initialize && this.initialize()
                            }
                            return t = window && window.Bloodhound, i.noConflict = function() {
                                return window && (window.Bloodhound = t), i
                            }, i.tokenizers = r, n.mixin(i.prototype, {
                                __ttAdapter: function() {
                                    var t = this;
                                    return this.remote ? e : n;

                                    function e(e, n, i) {
                                        return t.search(e, n, i)
                                    }

                                    function n(e, n) {
                                        return t.search(e, n)
                                    }
                                },
                                _loadPrefetch: function() {
                                    var t, n, i = this;
                                    return t = e.Deferred(), this.prefetch ? (n = this.prefetch.fromCache()) ? (this.index.bootstrap(n), t.resolve()) : this.prefetch.fromNetwork(r) : t.resolve(), t.promise();

                                    function r(e, n) {
                                        if (e) return t.reject();
                                        i.add(n), i.prefetch.store(i.index.serialize()), t.resolve()
                                    }
                                },
                                _initialize: function() {
                                    var t = this;
                                    return this.clear(), (this.initPromise = this._loadPrefetch()).done(e), this.initPromise;

                                    function e() {
                                        t.add(t.local)
                                    }
                                },
                                initialize: function(t) {
                                    return !this.initPromise || t ? this._initialize() : this.initPromise
                                },
                                add: function(t) {
                                    return this.index.add(t), this
                                },
                                get: function(t) {
                                    return t = n.isArray(t) ? t : [].slice.call(arguments), this.index.get(t)
                                },
                                search: function(t, e, i) {
                                    var r, s = this;
                                    return r = this.sorter(this.index.search(t)), e(this.remote ? r.slice() : r), this.remote && r.length < this.sufficient ? this.remote.get(t, o) : this.remote && this.remote.cancelLastRequest(), this;

                                    function o(t) {
                                        var e = [];
                                        n.each(t, (function(t) {
                                            !n.some(r, (function(e) {
                                                return s.identify(t) === s.identify(e)
                                            })) && e.push(t)
                                        })), i && i(e)
                                    }
                                },
                                all: function() {
                                    return this.index.all()
                                },
                                clear: function() {
                                    return this.index.reset(), this
                                },
                                clearPrefetchCache: function() {
                                    return this.prefetch && this.prefetch.clear(), this
                                },
                                clearRemoteCache: function() {
                                    return a.resetCache(), this
                                },
                                ttAdapter: function() {
                                    return this.__ttAdapter()
                                }
                            }), i
                        }(), d);
                        var e, n, i, r, o, u, a, c, h, l, f, d
                    }.apply(e, i), void 0 === r || (t.exports = r), i = [n(1145)], r = function(t) {
                        return e = t, n = function() {
                            "use strict";
                            return {
                                isMsie: function() {
                                    return !!/(msie|trident)/i.test(navigator.userAgent) && navigator.userAgent.match(/(msie |rv:)(\d+(.\d+)?)/i)[2]
                                },
                                isBlankString: function(t) {
                                    return !t || /^\s*$/.test(t)
                                },
                                escapeRegExChars: function(t) {
                                    return t.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&")
                                },
                                isString: function(t) {
                                    return "string" == typeof t
                                },
                                isNumber: function(t) {
                                    return "number" == typeof t
                                },
                                isArray: e.isArray,
                                isFunction: e.isFunction,
                                isObject: e.isPlainObject,
                                isUndefined: function(t) {
                                    return void 0 === t
                                },
                                isElement: function(t) {
                                    return !(!t || 1 !== t.nodeType)
                                },
                                isJQuery: function(t) {
                                    return t instanceof e
                                },
                                toStr: function(t) {
                                    return n.isUndefined(t) || null === t ? "" : t + ""
                                },
                                bind: e.proxy,
                                each: function(t, n) {
                                    function i(t, e) {
                                        return n(e, t)
                                    }
                                    e.each(t, i)
                                },
                                map: e.map,
                                filter: e.grep,
                                every: function(t, n) {
                                    var i = !0;
                                    return t ? (e.each(t, (function(e, r) {
                                        if (!(i = n.call(null, r, e, t))) return !1
                                    })), !!i) : i
                                },
                                some: function(t, n) {
                                    var i = !1;
                                    return t ? (e.each(t, (function(e, r) {
                                        if (i = n.call(null, r, e, t)) return !1
                                    })), !!i) : i
                                },
                                mixin: e.extend,
                                identity: function(t) {
                                    return t
                                },
                                clone: function(t) {
                                    return e.extend(!0, {}, t)
                                },
                                getIdGenerator: function() {
                                    var t = 0;
                                    return function() {
                                        return t++
                                    }
                                },
                                templatify: function(t) {
                                    return e.isFunction(t) ? t : n;

                                    function n() {
                                        return String(t)
                                    }
                                },
                                defer: function(t) {
                                    setTimeout(t, 0)
                                },
                                debounce: function(t, e, n) {
                                    var i, r;
                                    return function() {
                                        var s, o, u = this,
                                            a = arguments;
                                        return s = function() {
                                            i = null, n || (r = t.apply(u, a))
                                        }, o = n && !i, clearTimeout(i), i = setTimeout(s, e), o && (r = t.apply(u, a)), r
                                    }
                                },
                                throttle: function(t, e) {
                                    var n, i, r, s, o, u;
                                    return o = 0, u = function() {
                                            o = new Date, r = null, s = t.apply(n, i)
                                        },
                                        function() {
                                            var a = new Date,
                                                c = e - (a - o);
                                            return n = this, i = arguments, c <= 0 ? (clearTimeout(r), r = null, o = a, s = t.apply(n, i)) : r || (r = setTimeout(u, c)), s
                                        }
                                },
                                stringify: function(t) {
                                    return n.isString(t) ? t : JSON.stringify(t)
                                },
                                noop: function() {}
                            }
                        }(), i = function() {
                            "use strict";
                            var t = {
                                wrapper: "twitter-typeahead",
                                input: "tt-input",
                                hint: "tt-hint",
                                menu: "tt-menu",
                                dataset: "tt-dataset",
                                suggestion: "tt-suggestion",
                                selectable: "tt-selectable",
                                empty: "tt-empty",
                                open: "tt-open",
                                cursor: "tt-cursor",
                                highlight: "tt-highlight"
                            };
                            return e;

                            function e(e) {
                                var o, u;
                                return u = n.mixin({}, t, e), {
                                    css: (o = {
                                        css: s(),
                                        classes: u,
                                        html: i(u),
                                        selectors: r(u)
                                    }).css,
                                    html: o.html,
                                    classes: o.classes,
                                    selectors: o.selectors,
                                    mixin: function(t) {
                                        n.mixin(t, o)
                                    }
                                }
                            }

                            function i(t) {
                                return {
                                    wrapper: '<span class="' + t.wrapper + '"></span>',
                                    menu: '<div class="' + t.menu + '"></div>'
                                }
                            }

                            function r(t) {
                                var e = {};
                                return n.each(t, (function(t, n) {
                                    e[n] = "." + t
                                })), e
                            }

                            function s() {
                                var t = {
                                    wrapper: {
                                        position: "relative",
                                        display: "inline-block"
                                    },
                                    hint: {
                                        position: "absolute",
                                        top: "0",
                                        left: "0",
                                        borderColor: "transparent",
                                        boxShadow: "none",
                                        opacity: "1"
                                    },
                                    input: {
                                        position: "relative",
                                        verticalAlign: "top",
                                        backgroundColor: "transparent"
                                    },
                                    inputWithNoHint: {
                                        position: "relative",
                                        verticalAlign: "top"
                                    },
                                    menu: {
                                        position: "absolute",
                                        top: "100%",
                                        left: "0",
                                        zIndex: "100",
                                        display: "none"
                                    },
                                    ltr: {
                                        left: "0",
                                        right: "auto"
                                    },
                                    rtl: {
                                        left: "auto",
                                        right: " 0"
                                    }
                                };
                                return n.isMsie() && n.mixin(t.input, {
                                    backgroundImage: "url(data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7)"
                                }), t
                            }
                        }(), r = function() {
                            "use strict";
                            var t, i;

                            function r(t) {
                                t && t.el || e.error("EventBus initialized without el"), this.$el = e(t.el)
                            }
                            return t = "typeahead:", i = {
                                render: "rendered",
                                cursorchange: "cursorchanged",
                                select: "selected",
                                autocomplete: "autocompleted"
                            }, n.mixin(r.prototype, {
                                _trigger: function(n, i) {
                                    var r;
                                    return r = e.Event(t + n), (i = i || []).unshift(r), this.$el.trigger.apply(this.$el, i), r
                                },
                                before: function(t) {
                                    var e;
                                    return e = [].slice.call(arguments, 1), this._trigger("before" + t, e).isDefaultPrevented()
                                },
                                trigger: function(t) {
                                    var e;
                                    this._trigger(t, [].slice.call(arguments, 1)), (e = i[t]) && this._trigger(e, [].slice.call(arguments, 1))
                                }
                            }), r
                        }(), s = function() {
                            "use strict";
                            var t = /\s+/,
                                e = a();
                            return {
                                onSync: r,
                                onAsync: i,
                                off: s,
                                trigger: o
                            };

                            function n(e, n, i, r) {
                                var s;
                                if (!i) return this;
                                for (n = n.split(t), i = r ? c(i, r) : i, this._callbacks = this._callbacks || {}; s = n.shift();) this._callbacks[s] = this._callbacks[s] || {
                                    sync: [],
                                    async: []
                                }, this._callbacks[s][e].push(i);
                                return this
                            }

                            function i(t, e, i) {
                                return n.call(this, "async", t, e, i)
                            }

                            function r(t, e, i) {
                                return n.call(this, "sync", t, e, i)
                            }

                            function s(e) {
                                var n;
                                if (!this._callbacks) return this;
                                for (e = e.split(t); n = e.shift();) delete this._callbacks[n];
                                return this
                            }

                            function o(n) {
                                var i, r, s, o, a;
                                if (!this._callbacks) return this;
                                for (n = n.split(t), s = [].slice.call(arguments, 1);
                                    (i = n.shift()) && (r = this._callbacks[i]);) o = u(r.sync, this, [i].concat(s)), a = u(r.async, this, [i].concat(s)), o() && e(a);
                                return this
                            }

                            function u(t, e, n) {
                                return i;

                                function i() {
                                    for (var i, r = 0, s = t.length; !i && r < s; r += 1) i = !1 === t[r].apply(e, n);
                                    return !i
                                }
                            }

                            function a() {
                                return window.setImmediate ? function(t) {
                                    setImmediate((function() {
                                        t()
                                    }))
                                } : function(t) {
                                    setTimeout((function() {
                                        t()
                                    }), 0)
                                }
                            }

                            function c(t, e) {
                                return t.bind ? t.bind(e) : function() {
                                    t.apply(e, [].slice.call(arguments, 0))
                                }
                            }
                        }(), o = function(t) {
                            "use strict";
                            var e = {
                                node: null,
                                pattern: null,
                                tagName: "strong",
                                className: null,
                                wordsOnly: !1,
                                caseSensitive: !1
                            };
                            return function(r) {
                                var s;

                                function o(e) {
                                    var n, i, o;
                                    return (n = s.exec(e.data)) && (o = t.createElement(r.tagName), r.className && (o.className = r.className), (i = e.splitText(n.index)).splitText(n[0].length), o.appendChild(i.cloneNode(!0)), e.parentNode.replaceChild(o, i)), !!n
                                }

                                function u(t, e) {
                                    for (var n, i = 3, r = 0; r < t.childNodes.length; r++)(n = t.childNodes[r]).nodeType === i ? r += e(n) ? 1 : 0 : u(n, e)
                                }(r = n.mixin({}, e, r)).node && r.pattern && (r.pattern = n.isArray(r.pattern) ? r.pattern : [r.pattern], s = i(r.pattern, r.caseSensitive, r.wordsOnly), u(r.node, o))
                            };

                            function i(t, e, i) {
                                for (var r, s = [], o = 0, u = t.length; o < u; o++) s.push(n.escapeRegExChars(t[o]));
                                return r = i ? "\\b(" + s.join("|") + ")\\b" : "(" + s.join("|") + ")", e ? new RegExp(r) : new RegExp(r, "i")
                            }
                        }(window.document), u = function() {
                            "use strict";
                            var t;

                            function i(t, i) {
                                (t = t || {}).input || e.error("input is missing"), i.mixin(this), this.$hint = e(t.hint), this.$input = e(t.input), this.query = this.$input.val(), this.queryWhenFocused = this.hasFocus() ? this.query : null, this.$overflowHelper = r(this.$input), this._checkLanguageDirection(), 0 === this.$hint.length && (this.setHint = this.getHint = this.clearHint = this.clearHintIfInvalid = n.noop)
                            }
                            return t = {
                                9: "tab",
                                27: "esc",
                                37: "left",
                                39: "right",
                                13: "enter",
                                38: "up",
                                40: "down"
                            }, i.normalizeQuery = function(t) {
                                return n.toStr(t).replace(/^\s*/g, "").replace(/\s{2,}/g, " ")
                            }, n.mixin(i.prototype, s, {
                                _onBlur: function() {
                                    this.resetInputValue(), this.trigger("blurred")
                                },
                                _onFocus: function() {
                                    this.queryWhenFocused = this.query, this.trigger("focused")
                                },
                                _onKeydown: function(e) {
                                    var n = t[e.which || e.keyCode];
                                    this._managePreventDefault(n, e), n && this._shouldTrigger(n, e) && this.trigger(n + "Keyed", e)
                                },
                                _onInput: function() {
                                    this._setQuery(this.getInputValue()), this.clearHintIfInvalid(), this._checkLanguageDirection()
                                },
                                _managePreventDefault: function(t, e) {
                                    var n;
                                    switch (t) {
                                        case "up":
                                        case "down":
                                            n = !u(e);
                                            break;
                                        default:
                                            n = !1
                                    }
                                    n && e.preventDefault()
                                },
                                _shouldTrigger: function(t, e) {
                                    return "tab" !== t || !u(e)
                                },
                                _checkLanguageDirection: function() {
                                    var t = (this.$input.css("direction") || "ltr").toLowerCase();
                                    this.dir !== t && (this.dir = t, this.$hint.attr("dir", t), this.trigger("langDirChanged", t))
                                },
                                _setQuery: function(t, e) {
                                    var n, i;
                                    i = !!(n = o(t, this.query)) && this.query.length !== t.length, this.query = t, e || n ? !e && i && this.trigger("whitespaceChanged", this.query) : this.trigger("queryChanged", this.query)
                                },
                                bind: function() {
                                    var e, i, r, s, o = this;
                                    return e = n.bind(this._onBlur, this), i = n.bind(this._onFocus, this), r = n.bind(this._onKeydown, this), s = n.bind(this._onInput, this), this.$input.on("blur.tt", e).on("focus.tt", i).on("keydown.tt", r), !n.isMsie() || n.isMsie() > 9 ? this.$input.on("input.tt", s) : this.$input.on("keydown.tt keypress.tt cut.tt paste.tt", (function(e) {
                                        t[e.which || e.keyCode] || n.defer(n.bind(o._onInput, o, e))
                                    })), this
                                },
                                focus: function() {
                                    this.$input.focus()
                                },
                                blur: function() {
                                    this.$input.blur()
                                },
                                getLangDir: function() {
                                    return this.dir
                                },
                                getQuery: function() {
                                    return this.query || ""
                                },
                                setQuery: function(t, e) {
                                    this.setInputValue(t), this._setQuery(t, e)
                                },
                                hasQueryChangedSinceLastFocus: function() {
                                    return this.query !== this.queryWhenFocused
                                },
                                getInputValue: function() {
                                    return this.$input.val()
                                },
                                setInputValue: function(t) {
                                    this.$input.val(t), this.clearHintIfInvalid(), this._checkLanguageDirection()
                                },
                                resetInputValue: function() {
                                    this.setInputValue(this.query)
                                },
                                getHint: function() {
                                    return this.$hint.val()
                                },
                                setHint: function(t) {
                                    this.$hint.val(t)
                                },
                                clearHint: function() {
                                    this.setHint("")
                                },
                                clearHintIfInvalid: function() {
                                    var t, e, n;
                                    n = (t = this.getInputValue()) !== (e = this.getHint()) && 0 === e.indexOf(t), ("" === t || !n || this.hasOverflow()) && this.clearHint()
                                },
                                hasFocus: function() {
                                    return this.$input.is(":focus")
                                },
                                hasOverflow: function() {
                                    var t = this.$input.width() - 2;
                                    return this.$overflowHelper.text(this.getInputValue()), this.$overflowHelper.width() >= t
                                },
                                isCursorAtEnd: function() {
                                    var t, e, i;
                                    return t = this.$input.val().length, e = this.$input[0].selectionStart, n.isNumber(e) ? e === t : !document.selection || ((i = document.selection.createRange()).moveStart("character", -t), t === i.text.length)
                                },
                                destroy: function() {
                                    this.$hint.off(".tt"), this.$input.off(".tt"), this.$overflowHelper.remove(), this.$hint = this.$input = this.$overflowHelper = e("<div>")
                                }
                            }), i;

                            function r(t) {
                                return e('<pre aria-hidden="true"></pre>').css({
                                    position: "absolute",
                                    visibility: "hidden",
                                    whiteSpace: "pre",
                                    fontFamily: t.css("font-family"),
                                    fontSize: t.css("font-size"),
                                    fontStyle: t.css("font-style"),
                                    fontVariant: t.css("font-variant"),
                                    fontWeight: t.css("font-weight"),
                                    wordSpacing: t.css("word-spacing"),
                                    letterSpacing: t.css("letter-spacing"),
                                    textIndent: t.css("text-indent"),
                                    textRendering: t.css("text-rendering"),
                                    textTransform: t.css("text-transform")
                                }).insertAfter(t)
                            }

                            function o(t, e) {
                                return i.normalizeQuery(t) === i.normalizeQuery(e)
                            }

                            function u(t) {
                                return t.altKey || t.ctrlKey || t.metaKey || t.shiftKey
                            }
                        }(), a = function() {
                            "use strict";
                            var t, i;

                            function r(t, r) {
                                (t = t || {}).templates = t.templates || {}, t.templates.notFound = t.templates.notFound || t.templates.empty, t.source || e.error("missing source"), t.node || e.error("missing node"), t.name && !c(t.name) && e.error("invalid dataset name: " + t.name), r.mixin(this), this.highlight = !!t.highlight, this.name = t.name || i(), this.limit = t.limit || 5, this.displayFn = u(t.display || t.displayKey), this.templates = a(t.templates, this.displayFn), this.source = t.source.__ttAdapter ? t.source.__ttAdapter() : t.source, this.async = n.isUndefined(t.async) ? this.source.length > 2 : !!t.async, this._resetLastSuggestion(), this.$el = e(t.node).addClass(this.classes.dataset).addClass(this.classes.dataset + "-" + this.name)
                            }
                            return t = {
                                val: "tt-selectable-display",
                                obj: "tt-selectable-object"
                            }, i = n.getIdGenerator(), r.extractData = function(n) {
                                var i = e(n);
                                return i.data(t.obj) ? {
                                    val: i.data(t.val) || "",
                                    obj: i.data(t.obj) || null
                                } : null
                            }, n.mixin(r.prototype, s, {
                                _overwrite: function(t, e) {
                                    (e = e || []).length ? this._renderSuggestions(t, e) : this.async && this.templates.pending ? this._renderPending(t) : !this.async && this.templates.notFound ? this._renderNotFound(t) : this._empty(), this.trigger("rendered", this.name, e, !1)
                                },
                                _append: function(t, e) {
                                    (e = e || []).length && this.$lastSuggestion.length ? this._appendSuggestions(t, e) : e.length ? this._renderSuggestions(t, e) : !this.$lastSuggestion.length && this.templates.notFound && this._renderNotFound(t), this.trigger("rendered", this.name, e, !0)
                                },
                                _renderSuggestions: function(t, e) {
                                    var n;
                                    n = this._getSuggestionsFragment(t, e), this.$lastSuggestion = n.children().last(), this.$el.html(n).prepend(this._getHeader(t, e)).append(this._getFooter(t, e))
                                },
                                _appendSuggestions: function(t, e) {
                                    var n, i;
                                    i = (n = this._getSuggestionsFragment(t, e)).children().last(), this.$lastSuggestion.after(n), this.$lastSuggestion = i
                                },
                                _renderPending: function(t) {
                                    var e = this.templates.pending;
                                    this._resetLastSuggestion(), e && this.$el.html(e({
                                        query: t,
                                        dataset: this.name
                                    }))
                                },
                                _renderNotFound: function(t) {
                                    var e = this.templates.notFound;
                                    this._resetLastSuggestion(), e && this.$el.html(e({
                                        query: t,
                                        dataset: this.name
                                    }))
                                },
                                _empty: function() {
                                    this.$el.empty(), this._resetLastSuggestion()
                                },
                                _getSuggestionsFragment: function(i, r) {
                                    var s, u = this;
                                    return s = document.createDocumentFragment(), n.each(r, (function(n) {
                                        var r, o;
                                        o = u._injectQuery(i, n), r = e(u.templates.suggestion(o)).data(t.obj, n).data(t.val, u.displayFn(n)).addClass(u.classes.suggestion + " " + u.classes.selectable), s.appendChild(r[0])
                                    })), this.highlight && o({
                                        className: this.classes.highlight,
                                        node: s,
                                        pattern: i
                                    }), e(s)
                                },
                                _getFooter: function(t, e) {
                                    return this.templates.footer ? this.templates.footer({
                                        query: t,
                                        suggestions: e,
                                        dataset: this.name
                                    }) : null
                                },
                                _getHeader: function(t, e) {
                                    return this.templates.header ? this.templates.header({
                                        query: t,
                                        suggestions: e,
                                        dataset: this.name
                                    }) : null
                                },
                                _resetLastSuggestion: function() {
                                    this.$lastSuggestion = e()
                                },
                                _injectQuery: function(t, e) {
                                    return n.isObject(e) ? n.mixin({
                                        _query: t
                                    }, e) : e
                                },
                                update: function(t) {
                                    var n = this,
                                        i = !1,
                                        r = !1,
                                        s = 0;

                                    function o(e) {
                                        r || (r = !0, e = (e || []).slice(0, n.limit), s = e.length, n._overwrite(t, e), s < n.limit && n.async && n.trigger("asyncRequested", t))
                                    }

                                    function u(r) {
                                        r = r || [], !i && s < n.limit && (n.cancel = e.noop, s += r.length, n._append(t, r.slice(0, n.limit - s)), n.async && n.trigger("asyncReceived", t))
                                    }
                                    this.cancel(), this.cancel = function() {
                                        i = !0, n.cancel = e.noop, n.async && n.trigger("asyncCanceled", t)
                                    }, this.source(t, o, u), !r && o([])
                                },
                                cancel: e.noop,
                                clear: function() {
                                    this._empty(), this.cancel(), this.trigger("cleared")
                                },
                                isEmpty: function() {
                                    return this.$el.is(":empty")
                                },
                                destroy: function() {
                                    this.$el = e("<div>")
                                }
                            }), r;

                            function u(t) {
                                return t = t || n.stringify, n.isFunction(t) ? t : e;

                                function e(e) {
                                    return e[t]
                                }
                            }

                            function a(t, i) {
                                return {
                                    notFound: t.notFound && n.templatify(t.notFound),
                                    pending: t.pending && n.templatify(t.pending),
                                    header: t.header && n.templatify(t.header),
                                    footer: t.footer && n.templatify(t.footer),
                                    suggestion: t.suggestion || r
                                };

                                function r(t) {
                                    return e("<div>").text(i(t))
                                }
                            }

                            function c(t) {
                                return /^[_a-zA-Z0-9-]+$/.test(t)
                            }
                        }(), c = function() {
                            "use strict";

                            function t(t, i) {
                                var r = this;

                                function s(t) {
                                    var n = r.$node.find(t.node).first();
                                    return t.node = n.length ? n : e("<div>").appendTo(r.$node), new a(t, i)
                                }(t = t || {}).node || e.error("node is required"), i.mixin(this), this.$node = e(t.node), this.query = null, this.datasets = n.map(t.datasets, s)
                            }
                            return n.mixin(t.prototype, s, {
                                _onSelectableClick: function(t) {
                                    this.trigger("selectableClicked", e(t.currentTarget))
                                },
                                _onRendered: function(t, e, n, i) {
                                    this.$node.toggleClass(this.classes.empty, this._allDatasetsEmpty()), this.trigger("datasetRendered", e, n, i)
                                },
                                _onCleared: function() {
                                    this.$node.toggleClass(this.classes.empty, this._allDatasetsEmpty()), this.trigger("datasetCleared")
                                },
                                _propagate: function() {
                                    this.trigger.apply(this, arguments)
                                },
                                _allDatasetsEmpty: function() {
                                    return n.every(this.datasets, t);

                                    function t(t) {
                                        return t.isEmpty()
                                    }
                                },
                                _getSelectables: function() {
                                    return this.$node.find(this.selectors.selectable)
                                },
                                _removeCursor: function() {
                                    var t = this.getActiveSelectable();
                                    t && t.removeClass(this.classes.cursor)
                                },
                                _ensureVisible: function(t) {
                                    var e, n, i, r;
                                    n = (e = t.position().top) + t.outerHeight(!0), i = this.$node.scrollTop(), r = this.$node.height() + parseInt(this.$node.css("paddingTop"), 10) + parseInt(this.$node.css("paddingBottom"), 10), e < 0 ? this.$node.scrollTop(i + e) : r < n && this.$node.scrollTop(i + (n - r))
                                },
                                bind: function() {
                                    var t, e = this;
                                    return t = n.bind(this._onSelectableClick, this), this.$node.on("click.tt", this.selectors.selectable, t), n.each(this.datasets, (function(t) {
                                        t.onSync("asyncRequested", e._propagate, e).onSync("asyncCanceled", e._propagate, e).onSync("asyncReceived", e._propagate, e).onSync("rendered", e._onRendered, e).onSync("cleared", e._onCleared, e)
                                    })), this
                                },
                                isOpen: function() {
                                    return this.$node.hasClass(this.classes.open)
                                },
                                open: function() {
                                    this.$node.addClass(this.classes.open)
                                },
                                close: function() {
                                    this.$node.removeClass(this.classes.open), this._removeCursor()
                                },
                                setLanguageDirection: function(t) {
                                    this.$node.attr("dir", t)
                                },
                                selectableRelativeToCursor: function(t) {
                                    var e, n, i;
                                    return n = this.getActiveSelectable(), e = this._getSelectables(), -1 === (i = (i = ((i = (n ? e.index(n) : -1) + t) + 1) % (e.length + 1) - 1) < -1 ? e.length - 1 : i) ? null : e.eq(i)
                                },
                                setCursor: function(t) {
                                    this._removeCursor(), (t = t && t.first()) && (t.addClass(this.classes.cursor), this._ensureVisible(t))
                                },
                                getSelectableData: function(t) {
                                    return t && t.length ? a.extractData(t) : null
                                },
                                getActiveSelectable: function() {
                                    var t = this._getSelectables().filter(this.selectors.cursor).first();
                                    return t.length ? t : null
                                },
                                getTopSelectable: function() {
                                    var t = this._getSelectables().first();
                                    return t.length ? t : null
                                },
                                update: function(t) {
                                    var e = t !== this.query;
                                    return e && (this.query = t, n.each(this.datasets, i)), e;

                                    function i(e) {
                                        e.update(t)
                                    }
                                },
                                empty: function() {
                                    function t(t) {
                                        t.clear()
                                    }
                                    n.each(this.datasets, t), this.query = null, this.$node.addClass(this.classes.empty)
                                },
                                destroy: function() {
                                    function t(t) {
                                        t.destroy()
                                    }
                                    this.$node.off(".tt"), this.$node = e("<div>"), n.each(this.datasets, t)
                                }
                            }), t
                        }(), h = function() {
                            "use strict";
                            var t = c.prototype;

                            function e() {
                                c.apply(this, [].slice.call(arguments, 0))
                            }
                            return n.mixin(e.prototype, c.prototype, {
                                open: function() {
                                    return !this._allDatasetsEmpty() && this._show(), t.open.apply(this, [].slice.call(arguments, 0))
                                },
                                close: function() {
                                    return this._hide(), t.close.apply(this, [].slice.call(arguments, 0))
                                },
                                _onRendered: function() {
                                    return this._allDatasetsEmpty() ? this._hide() : this.isOpen() && this._show(), t._onRendered.apply(this, [].slice.call(arguments, 0))
                                },
                                _onCleared: function() {
                                    return this._allDatasetsEmpty() ? this._hide() : this.isOpen() && this._show(), t._onCleared.apply(this, [].slice.call(arguments, 0))
                                },
                                setLanguageDirection: function(e) {
                                    return this.$node.css("ltr" === e ? this.css.ltr : this.css.rtl), t.setLanguageDirection.apply(this, [].slice.call(arguments, 0))
                                },
                                _hide: function() {
                                    this.$node.hide()
                                },
                                _show: function() {
                                    this.$node.css("display", "block")
                                }
                            }), e
                        }(), l = function() {
                            "use strict";

                            function t(t, r) {
                                var s, o, u, a, c, h, l, f, d, p, g;
                                (t = t || {}).input || e.error("missing input"), t.menu || e.error("missing menu"), t.eventBus || e.error("missing event bus"), r.mixin(this), this.eventBus = t.eventBus, this.minLength = n.isNumber(t.minLength) ? t.minLength : 1, this.input = t.input, this.menu = t.menu, this.enabled = !0, this.active = !1, this.input.hasFocus() && this.activate(), this.dir = this.input.getLangDir(), this._hacks(), this.menu.bind().onSync("selectableClicked", this._onSelectableClicked, this).onSync("asyncRequested", this._onAsyncRequested, this).onSync("asyncCanceled", this._onAsyncCanceled, this).onSync("asyncReceived", this._onAsyncReceived, this).onSync("datasetRendered", this._onDatasetRendered, this).onSync("datasetCleared", this._onDatasetCleared, this), s = i(this, "activate", "open", "_onFocused"), o = i(this, "deactivate", "_onBlurred"), u = i(this, "isActive", "isOpen", "_onEnterKeyed"), a = i(this, "isActive", "isOpen", "_onTabKeyed"), c = i(this, "isActive", "_onEscKeyed"), h = i(this, "isActive", "open", "_onUpKeyed"), l = i(this, "isActive", "open", "_onDownKeyed"), f = i(this, "isActive", "isOpen", "_onLeftKeyed"), d = i(this, "isActive", "isOpen", "_onRightKeyed"), p = i(this, "_openIfActive", "_onQueryChanged"), g = i(this, "_openIfActive", "_onWhitespaceChanged"), this.input.bind().onSync("focused", s, this).onSync("blurred", o, this).onSync("enterKeyed", u, this).onSync("tabKeyed", a, this).onSync("escKeyed", c, this).onSync("upKeyed", h, this).onSync("downKeyed", l, this).onSync("leftKeyed", f, this).onSync("rightKeyed", d, this).onSync("queryChanged", p, this).onSync("whitespaceChanged", g, this).onSync("langDirChanged", this._onLangDirChanged, this)
                            }
                            return n.mixin(t.prototype, {
                                _hacks: function() {
                                    var t, i;
                                    t = this.input.$input || e("<div>"), i = this.menu.$node || e("<div>"), t.on("blur.tt", (function(e) {
                                        var r, s, o;
                                        r = document.activeElement, s = i.is(r), o = i.has(r).length > 0, n.isMsie() && (s || o) && (e.preventDefault(), e.stopImmediatePropagation(), n.defer((function() {
                                            t.focus()
                                        })))
                                    })), i.on("mousedown.tt", (function(t) {
                                        t.preventDefault()
                                    }))
                                },
                                _onSelectableClicked: function(t, e) {
                                    this.select(e)
                                },
                                _onDatasetCleared: function() {
                                    this._updateHint()
                                },
                                _onDatasetRendered: function(t, e, n, i) {
                                    this._updateHint(), this.eventBus.trigger("render", n, i, e)
                                },
                                _onAsyncRequested: function(t, e, n) {
                                    this.eventBus.trigger("asyncrequest", n, e)
                                },
                                _onAsyncCanceled: function(t, e, n) {
                                    this.eventBus.trigger("asynccancel", n, e)
                                },
                                _onAsyncReceived: function(t, e, n) {
                                    this.eventBus.trigger("asyncreceive", n, e)
                                },
                                _onFocused: function() {
                                    this._minLengthMet() && this.menu.update(this.input.getQuery())
                                },
                                _onBlurred: function() {
                                    this.input.hasQueryChangedSinceLastFocus() && this.eventBus.trigger("change", this.input.getQuery())
                                },
                                _onEnterKeyed: function(t, e) {
                                    var n;
                                    (n = this.menu.getActiveSelectable()) && this.select(n) && e.preventDefault()
                                },
                                _onTabKeyed: function(t, e) {
                                    var n;
                                    (n = this.menu.getActiveSelectable()) ? this.select(n) && e.preventDefault(): (n = this.menu.getTopSelectable()) && this.autocomplete(n) && e.preventDefault()
                                },
                                _onEscKeyed: function() {
                                    this.close()
                                },
                                _onUpKeyed: function() {
                                    this.moveCursor(-1)
                                },
                                _onDownKeyed: function() {
                                    this.moveCursor(1)
                                },
                                _onLeftKeyed: function() {
                                    "rtl" === this.dir && this.input.isCursorAtEnd() && this.autocomplete(this.menu.getTopSelectable())
                                },
                                _onRightKeyed: function() {
                                    "ltr" === this.dir && this.input.isCursorAtEnd() && this.autocomplete(this.menu.getTopSelectable())
                                },
                                _onQueryChanged: function(t, e) {
                                    this._minLengthMet(e) ? this.menu.update(e) : this.menu.empty()
                                },
                                _onWhitespaceChanged: function() {
                                    this._updateHint()
                                },
                                _onLangDirChanged: function(t, e) {
                                    this.dir !== e && (this.dir = e, this.menu.setLanguageDirection(e))
                                },
                                _openIfActive: function() {
                                    this.isActive() && this.open()
                                },
                                _minLengthMet: function(t) {
                                    return (t = n.isString(t) ? t : this.input.getQuery() || "").length >= this.minLength
                                },
                                _updateHint: function() {
                                    var t, e, i, r, s, o;
                                    t = this.menu.getTopSelectable(), e = this.menu.getSelectableData(t), i = this.input.getInputValue(), !e || n.isBlankString(i) || this.input.hasOverflow() ? this.input.clearHint() : (r = u.normalizeQuery(i), s = n.escapeRegExChars(r), (o = new RegExp("^(?:" + s + ")(.+$)", "i").exec(e.val)) && this.input.setHint(i + o[1]))
                                },
                                isEnabled: function() {
                                    return this.enabled
                                },
                                enable: function() {
                                    this.enabled = !0
                                },
                                disable: function() {
                                    this.enabled = !1
                                },
                                isActive: function() {
                                    return this.active
                                },
                                activate: function() {
                                    return !!this.isActive() || !(!this.isEnabled() || this.eventBus.before("active")) && (this.active = !0, this.eventBus.trigger("active"), !0)
                                },
                                deactivate: function() {
                                    return !this.isActive() || !this.eventBus.before("idle") && (this.active = !1, this.close(), this.eventBus.trigger("idle"), !0)
                                },
                                isOpen: function() {
                                    return this.menu.isOpen()
                                },
                                open: function() {
                                    return this.isOpen() || this.eventBus.before("open") || (this.menu.open(), this._updateHint(), this.eventBus.trigger("open")), this.isOpen()
                                },
                                close: function() {
                                    return this.isOpen() && !this.eventBus.before("close") && (this.menu.close(), this.input.clearHint(), this.input.resetInputValue(), this.eventBus.trigger("close")), !this.isOpen()
                                },
                                setVal: function(t) {
                                    this.input.setQuery(n.toStr(t))
                                },
                                getVal: function() {
                                    return this.input.getQuery()
                                },
                                select: function(t) {
                                    var e = this.menu.getSelectableData(t);
                                    return !(!e || this.eventBus.before("select", e.obj) || (this.input.setQuery(e.val, !0), this.eventBus.trigger("select", e.obj), this.close(), 0))
                                },
                                autocomplete: function(t) {
                                    var e, n;
                                    return e = this.input.getQuery(), !(!(n = this.menu.getSelectableData(t)) || e === n.val || this.eventBus.before("autocomplete", n.obj) || (this.input.setQuery(n.val), this.eventBus.trigger("autocomplete", n.obj), 0))
                                },
                                moveCursor: function(t) {
                                    var e, n, i, r;
                                    return e = this.input.getQuery(), n = this.menu.selectableRelativeToCursor(t), r = (i = this.menu.getSelectableData(n)) ? i.obj : null, !(this._minLengthMet() && this.menu.update(e) || this.eventBus.before("cursorchange", r) || (this.menu.setCursor(n), i ? this.input.setInputValue(i.val) : (this.input.resetInputValue(), this._updateHint()), this.eventBus.trigger("cursorchange", r), 0))
                                },
                                destroy: function() {
                                    this.input.destroy(), this.menu.destroy()
                                }
                            }), t;

                            function i(t) {
                                var e = [].slice.call(arguments, 1);
                                return function() {
                                    var i = [].slice.call(arguments);
                                    n.each(e, (function(e) {
                                        return t[e].apply(t, i)
                                    }))
                                }
                            }
                        }(), void
                        function() {
                            "use strict";
                            var t, s, o;

                            function a(t, n) {
                                t.each((function() {
                                    var t, i = e(this);
                                    (t = i.data(s.typeahead)) && n(t, i)
                                }))
                            }

                            function f(t, e) {
                                return t.clone().addClass(e.classes.hint).removeData().css(e.css.hint).css(p(t)).prop("readonly", !0).removeAttr("id name placeholder required").attr({
                                    autocomplete: "off",
                                    spellcheck: "false",
                                    tabindex: -1
                                })
                            }

                            function d(t, e) {
                                t.data(s.attrs, {
                                    dir: t.attr("dir"),
                                    autocomplete: t.attr("autocomplete"),
                                    spellcheck: t.attr("spellcheck"),
                                    style: t.attr("style")
                                }), t.addClass(e.classes.input).attr({
                                    autocomplete: "off",
                                    spellcheck: !1
                                });
                                try {
                                    !t.attr("dir") && t.attr("dir", "auto")
                                } catch (t) {}
                                return t
                            }

                            function p(t) {
                                return {
                                    backgroundAttachment: t.css("background-attachment"),
                                    backgroundClip: t.css("background-clip"),
                                    backgroundColor: t.css("background-color"),
                                    backgroundImage: t.css("background-image"),
                                    backgroundOrigin: t.css("background-origin"),
                                    backgroundPosition: t.css("background-position"),
                                    backgroundRepeat: t.css("background-repeat"),
                                    backgroundSize: t.css("background-size")
                                }
                            }

                            function g(t) {
                                var e, i;
                                e = t.data(s.www), i = t.parent().filter(e.selectors.wrapper), n.each(t.data(s.attrs), (function(e, i) {
                                    n.isUndefined(e) ? t.removeAttr(i) : t.attr(i, e)
                                })), t.removeData(s.typeahead).removeData(s.www).removeData(s.attr).removeClass(e.classes.input), i.length && (t.detach().insertAfter(i), i.remove())
                            }

                            function m(t) {
                                var i;
                                return (i = n.isJQuery(t) || n.isElement(t) ? e(t).first() : []).length ? i : null
                            }
                            t = e.fn.typeahead, s = {
                                www: "tt-www",
                                attrs: "tt-attrs",
                                typeahead: "tt-typeahead"
                            }, o = {
                                initialize: function(t, o) {
                                    var a;
                                    return o = n.isArray(o) ? o : [].slice.call(arguments, 1), a = i((t = t || {}).classNames), this.each(p);

                                    function p() {
                                        var i, p, g, y, v, _, b, w, S, x, A;
                                        n.each(o, (function(e) {
                                            e.highlight = !!t.highlight
                                        })), i = e(this), p = e(a.html.wrapper), g = m(t.hint), y = m(t.menu), v = !1 !== t.hint && !g, _ = !1 !== t.menu && !y, v && (g = f(i, a)), _ && (y = e(a.html.menu).css(a.css.menu)), g && g.val(""), i = d(i, a), (v || _) && (p.css(a.css.wrapper), i.css(v ? a.css.input : a.css.inputWithNoHint), i.wrap(p).parent().prepend(v ? g : null).append(_ ? y : null)), A = _ ? h : c, b = new r({
                                            el: i
                                        }), w = new u({
                                            hint: g,
                                            input: i
                                        }, a), S = new A({
                                            node: y,
                                            datasets: o
                                        }, a), x = new l({
                                            input: w,
                                            menu: S,
                                            eventBus: b,
                                            minLength: t.minLength
                                        }, a), i.data(s.www, a), i.data(s.typeahead, x)
                                    }
                                },
                                isEnabled: function() {
                                    var t;
                                    return a(this.first(), (function(e) {
                                        t = e.isEnabled()
                                    })), t
                                },
                                enable: function() {
                                    return a(this, (function(t) {
                                        t.enable()
                                    })), this
                                },
                                disable: function() {
                                    return a(this, (function(t) {
                                        t.disable()
                                    })), this
                                },
                                isActive: function() {
                                    var t;
                                    return a(this.first(), (function(e) {
                                        t = e.isActive()
                                    })), t
                                },
                                activate: function() {
                                    return a(this, (function(t) {
                                        t.activate()
                                    })), this
                                },
                                deactivate: function() {
                                    return a(this, (function(t) {
                                        t.deactivate()
                                    })), this
                                },
                                isOpen: function() {
                                    var t;
                                    return a(this.first(), (function(e) {
                                        t = e.isOpen()
                                    })), t
                                },
                                open: function() {
                                    return a(this, (function(t) {
                                        t.open()
                                    })), this
                                },
                                close: function() {
                                    return a(this, (function(t) {
                                        t.close()
                                    })), this
                                },
                                select: function(t) {
                                    var n = !1,
                                        i = e(t);
                                    return a(this.first(), (function(t) {
                                        n = t.select(i)
                                    })), n
                                },
                                autocomplete: function(t) {
                                    var n = !1,
                                        i = e(t);
                                    return a(this.first(), (function(t) {
                                        n = t.autocomplete(i)
                                    })), n
                                },
                                moveCursor: function(t) {
                                    var e = !1;
                                    return a(this.first(), (function(n) {
                                        e = n.moveCursor(t)
                                    })), e
                                },
                                val: function(t) {
                                    var e;
                                    return arguments.length ? (a(this, (function(e) {
                                        e.setVal(t)
                                    })), this) : (a(this.first(), (function(t) {
                                        e = t.getVal()
                                    })), e)
                                },
                                destroy: function() {
                                    return a(this, (function(t, e) {
                                        g(e), t.destroy()
                                    })), this
                                }
                            }, e.fn.typeahead = function(t) {
                                return o[t] ? o[t].apply(this, [].slice.call(arguments, 1)) : o.initialize.apply(this, arguments)
                            }, e.fn.typeahead.noConflict = function() {
                                return e.fn.typeahead = t, this
                            }
                        }();
                        var e, n, i, r, s, o, u, a, c, h, l
                    }.apply(e, i), void 0 === r || (t.exports = r)
                },
                1145: function(e) {
                    "use strict";
                    e.exports = t
                }
            },
            n = {};

        function i(t) {
            var r = n[t];
            if (void 0 !== r) return r.exports;
            var s = n[t] = {
                exports: {}
            };
            return e[t].call(s.exports, s, s.exports, i), s.exports
        }
        i.n = function(t) {
            var e = t && t.__esModule ? function() {
                return t.default
            } : function() {
                return t
            };
            return i.d(e, {
                a: e
            }), e
        }, i.d = function(t, e) {
            for (var n in e) i.o(e, n) && !i.o(t, n) && Object.defineProperty(t, n, {
                enumerable: !0,
                get: e[n]
            })
        }, i.o = function(t, e) {
            return Object.prototype.hasOwnProperty.call(t, e)
        }, i.r = function(t) {
            "undefined" != typeof Symbol && Symbol.toStringTag && Object.defineProperty(t, Symbol.toStringTag, {
                value: "Module"
            }), Object.defineProperty(t, "__esModule", {
                value: !0
            })
        };
        var r = {};
        return function() {
            "use strict";
            i.r(r);
            i(3943)
        }(), r
    }()
}));