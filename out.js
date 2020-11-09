/**
 * @license
 * MIT License
 *
 * Copyright (c) 2018 Goffert van Gool
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

const e = Math.random()
    .toString(36)
    .slice(2)
    .padStart(10, '0'),
  t = `T${e}`,
  s = `\x3c!--${e}--\x3e`,
  i = `\x3c!--${t}--\x3e`,
  n = /<([^\0-\x1F\x7F-\x9F "'>=\/]+)/,
  r = /[ \x09\x0a\x0c\x0d]([^\0-\x1F\x7F-\x9F "'>=\/]+)[ \x09\x0a\x0c\x0d]*=[ \x09\x0a\x0c\x0d"']*$/,
  o = /([>'"])/,
  a = '--\x3e';
let h, l, d, c, p, m, u, f, g;
const x = e => {
    const t = e.match(n);
    if (t)
      return (
        (h += e.slice(0, t.index)),
        '\x3c!--' === (e = e.slice(t.index)).slice(0, 4)
          ? (m = N)
          : ((m = b), 'script' === (g = t[1]) || 'style' === g ? (u = v) : ('template' === g && (h += i), (u = x))),
        e
      );
    (h += e + s), l.push({ type: 'node' }), (m = x);
  },
  N = e => {
    const t = e.indexOf('--\x3e');
    if (t >= 0) {
      const i = t + 3;
      return d ? ((h += s), d.strings.push(e.slice(0, t)), l.push(d), (d = void 0)) : (h += e.slice(0, i)), (m = x), e.slice(i);
    }
    d || ((d = { type: 'comment', strings: [] }), (e = e.slice(4))), d.strings.push(e);
  },
  v = e => {
    const t = `</${g}>`,
      i = e.indexOf(t);
    if (i >= 0) {
      const n = i + t.length;
      return d ? ((h += t + s), d.strings.push(e.slice(0, i)), l.push(d), (d = void 0)) : (h += e.slice(0, n)), (m = x), e.slice(n);
    }
    d || (d = { type: 'scoped', strings: [] }), d.strings.push(e);
  },
  b = e => {
    let t = e.match(o);
    if (t) {
      const i = t.index + 1,
        n = e.slice(0, i);
      return '>' === t[1] ? (d && ((h += s), l.push(d), (d = void 0)), (h += p + n), (p = ''), (m = u)) : ((f = t[1]), (p += n), (m = _)), e.slice(i);
    }
    (t = e.match(r)), d ? d.attrs.push({ name: t[1] }) : (d = { type: 'attribute', attrs: [{ name: t[1] }] }), (p += e.slice(0, t.index));
  },
  _ = e => {
    const t = e.indexOf(f);
    if (t >= 0) return c ? (c.strings.push(e.slice(0, t)), (c = void 0)) : (p += e.slice(0, t + 1)), (m = b), e.slice(t + 1);
    if (c) c.strings.push(e);
    else {
      const t = p.match(r);
      (p = p.slice(0, t.index)), d || (d = { type: 'attribute', attrs: [] }), (c = { name: t[1], strings: [e] }), d.attrs.push(c);
    }
  },
  w = e => {
    let t;
    (l = []), (h = ''), (p = ''), (m = x);
    const s = e.length - 1;
    for (let i = 0; i < s; i++) {
      t = e[i];
      do {
        t = m(t);
      } while (void 0 !== t);
    }
    for (t = e[s]; m !== x; ) t = m(t);
    return { html: (h += t), parts: l };
  },
  y = document.createTreeWalker(document, 128, null, !1),
  S = (s, i) => n => {
    const r = [];
    let o;
    (y.currentNode = s),
      (o = y.nextNode()),
      i.forEach(s => {
        for (;;) {
          if (null === o) y.currentNode = r.pop();
          else {
            if (o.data === e) {
              const e = o;
              (o = y.nextNode()), n(e, s);
              break;
            }
            if (o.data === t) {
              const e = o.nextSibling;
              (y.currentNode = e.content), r.push(e);
            }
          }
          o = y.nextNode();
        }
      });
  },
  T = (e, t = null, s = null, i, n) => {
    let r = t ? t.nextSibling : e.firstChild;
    if (null !== r) {
      let t, o;
      for (t = i instanceof Node ? () => i.insertBefore(r, n) : () => e.removeChild(r); r !== s; ) (o = r.nextSibling), t(r), (r = o);
    }
  },
  C = () => document.createTextNode('');
class A {
  constructor(t, s) {
    const { html: i, parts: n } = w(t),
      r = document.createElement('template'),
      o = S(r.content, n);
    if (s) {
      r.innerHTML = `<svg>${i}</svg>`;
      const e = r.content,
        t = e.firstChild;
      e.removeChild(t), T(t, null, null, e);
    } else r.innerHTML = i;
    o((t, s) => {
      if ('scoped' === s.type) {
        const e = t.previousSibling;
        s.strings.forEach(t => {
          e.appendChild(document.createTextNode(t));
        });
      } else if ('node' === s.type) {
        t.previousSibling || t.parentNode.insertBefore(C(), t);
        const s = t.nextSibling;
        (s && s.data !== e) || t.parentNode.insertBefore(C(), s);
      }
    }),
      (this.walker = o),
      (this.element = r),
      (this.parts = n);
  }
}
const P = new Map();
class V {
  constructor(e, t) {
    (this.strings = e), (this.values = t);
  }
  get template() {
    let e = P.get(this.strings);
    return e || ((e = this.__createTemplate()), P.set(this.strings, e)), e;
  }
  __createTemplate() {
    return new A(this.strings);
  }
}
class B extends V {
  __createTemplate() {
    return new A(this.strings, !0);
  }
}
class E {
  constructor(e) {
    const t = [],
      s = document.importNode(e.element.content, !0),
      i = S(s, e.parts);
    (this.parts = t),
      (this.template = e),
      (this.fragment = s),
      (window.weirdFragment = s),
      i((e, s) => {
        const i = s.type;
        if ('node' === i) {
          const s = new W(),
            i = e.previousSibling;
          e.parentNode.removeChild(e), s.insertAfterNode(i), t.push(s);
        } else if ('scoped' === i) {
          let s = e.previousSibling.firstChild,
            i = s.nextSibling;
          for (; i; ) {
            const e = new W();
            e.insertAfterNode(s), t.push(e), (s = i), (i = i.nextSibling);
          }
          e.parentNode.removeChild(e);
        } else if ('comment' === i) {
          const i = e,
            n = s.strings,
            r = new H({ node: i, strings: n });
          t.push(...r.parts);
        } else if ('attribute' === i) {
          const i = e.nextSibling;
          s.attrs.forEach(e => {
            const s = new j({ node: i, ...e });
            t.push(...s.parts);
          }),
            e.parentNode.removeChild(e);
        }
      });
  }
  render(e) {
    this.parts.map((t, s) => t.setValue(e[s])), this.parts.map(e => e.commit());
  }
}
const F = new WeakMap(),
  I = e => F.has(e),
  M = e => null === e || !('object' == typeof e || 'function' == typeof e),
  k = e => Array.isArray(e) || !!onPrimitive[Symbol.iterator],
  $ = {},
  L = {},
  O = {};
class W {
  appendIntoNode(e) {
    (this.beforeNode = e.appendChild(C())), (this.afterNode = e.appendChild(C()));
  }
  insertAfterNode(e) {
    (this.beforeNode = e), (this.afterNode = e.nextSibling);
  }
  get parentNode() {
    return this.beforeNode.parentNode;
  }
  setValue(e) {
    this._pendingValue = e;
  }
  commit() {
    for (; I(this._pendingValue); ) {
      const e = this._pendingValue;
      (this._pendingValue = $), e(this);
    }
    const e = this._pendingValue;
    e !== $ &&
      (M(e)
        ? e !== this.value && this._renderText(e)
        : e instanceof V
        ? this._renderTemplateResult(e)
        : k(e)
        ? this._renderIterable(e)
        : e instanceof Node
        ? this._renderNode(e)
        : e === nothing
        ? ((this.value = e), this.clear())
        : this._renderText(String(e)),
      (this.value = e));
  }
  _renderText(e) {
    this.value !== e && (this.node && 3 === this.node.nodeType ? (this.node.textContent = e) : this._renderNode(document.createTextNode(e)));
  }
  _renderTemplateResult(e) {
    this.templateInstances = this.templateInstances || new Map();
    let t = this.templateInstances.get(e.template);
    t || ((t = new E(e.template, this.parentNode, this.beforeNode, this.afterNode)), this.templateInstances.set(e.template, t)),
      this.node !== t.fragment && (this.clear(), this.parentNode.insertBefore(t.fragment, this.afterNode), (this.node = t.fragment)),
      t.render(e.values);
  }
  _renderIterable(e) {
    this.node !== O && (this.clear(), (this.node = O), this.iterableParts ? (this.iterableParts.length = 0) : (this.iterableParts = []));
    let t,
      s = 0,
      i = this.afterNode ? this.afterNode.previousSibling : this.parentNode.lastChild;
    const n = this.parentNode;
    for (const r of e) {
      let e = this.iterableParts[s];
      void 0 === e && ((t = C()), n.insertBefore(t, this.afterNode), (e = new W()).insertAfterNode(i), this.iterableParts.push(e), (i = t)),
        e.setValue(r),
        e.commit(),
        s++;
    }
    if (0 === s) T(n, this.beforeNode, this.afterNode);
    else if (s < this.iterableParts.length) {
      const e = this.iterableParts[s - 1];
      T(n, e.afterNode, this.afterNode);
    }
    this.iterableParts.length = s;
  }
  _renderNode(e) {
    this.node !== e && (this.clear(), this.parentNode.insertBefore(e, this.afterNode), (this.node = e));
  }
  clear() {
    T(this.parentNode, this.beforeNode, this.afterNode, this.node instanceof DocumentFragment && this.node), (this.node = L);
  }
}
class H {
  constructor({ node: e, strings: t }) {
    const s = [],
      i = t.length - 1;
    (this.node = e), (this.strings = t), (this.parts = s), (this.dirty = !1);
    for (let e = 0; e < i; e++) s[e] = new R(this);
  }
  commit() {
    if (this.dirty) {
      let e = '';
      const { node: t, strings: s, parts: i } = this,
        n = i.length;
      for (let t = 0; t < n; t++) (e += s[t]), (e += i[t].value);
      (e += s[n]), (t.textContent = e), (this.dirty = !1);
    }
  }
}
class R {
  constructor(e) {
    this.committer = e;
  }
  setValue(e) {
    e === $ || (M(e) && e === this.value) || (I(e) ? e(this) : ((this.value = e), (this.committer.dirty = !0)));
  }
  commit() {
    this.committer.commit();
  }
}
class j {
  constructor({ node: e, name: t, strings: s }) {
    const i = [];
    if (((this.node = e), (this.name = t), (this.strings = s), (this.parts = i), s)) {
      const e = s.length - 1;
      for (let t = 0; t < e; t++) i[t] = new D(this);
    } else i[0] = new D(this);
    switch (t[0]) {
      case '.':
        this._render = this._renderProperty;
      case '?':
        this._render = this._render || this._renderBoolean;
      case '@':
        (this._render = this._render || this._renderEvent), (this.name = t.slice(1));
        break;
      default:
        (this._render = this._renderAttribute), (this.name = t);
    }
  }
  commit() {
    let e;
    const { strings: t, parts: s } = this;
    if (t) {
      const i = s.length;
      e = '';
      for (let n = 0; n < i; n++) e += t[n] + s[n].value;
      e += t[i];
    } else e = s[0].value;
    this._render(e);
  }
  _renderProperty(e) {
    this.node[this.name] = e;
  }
  _renderBoolean(e) {
    this.value !== !!e && (e ? this.node.setAttribute(this.name, '') : this.node.removeAttribute(this.name), (this.value = !!e));
  }
  _renderEvent(e) {
    this.value !== e && (this.node.removeEventListener(this.name, this.value), this.node.addEventListener(this.name, e), (this.value = e));
  }
  _renderAttribute(e) {
    this.value !== e && (this.node.setAttribute(this.name, e), (this.value = e));
  }
}
class D {
  constructor(e) {
    this.committer = e;
  }
  setValue(e) {
    e === $ || (M(e) && e === this.value) || (I(e) ? e(this) : ((this.value = e), (this.committer.dirty = !0)));
  }
  commit() {
    this.committer.commit();
  }
}
const q = new WeakMap(),
  z = (e, ...t) => new V(e, t),
  G = (e, ...t) => new B(e, t),
  J = (e, t) => {
    let s = q.get(t);
    s || ((s = new W()).appendIntoNode(t), q.set(t, s)), s.setValue(e), s.commit();
  };
export { z as html, G as svg, J as render };
//# sourceMappingURL=out.js.map
