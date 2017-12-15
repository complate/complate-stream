complate-stream
===============

[complate](https://complate.org)'s core library for rendering HTML


How It Works
------------

At the core of complate-stream lies `generateHTML`, an implementation of the
signature expected by [JSX](https://facebook.github.io/jsx/) (as
[pioneered by React](https://reactjs.org/docs/jsx-in-depth.html)). When invoked,
that function returns an "element generator"; a function serving as placeholder
for the HTML element to be generated:

```javascript
generateHTML("html", { lang: "en" },
        generateHTML("body", { id: "top" },
                generateHTML("h1", null, "hello world"),
                generateHTML("p", null, "lorem ipsum")));
```

This indirection is necessary primarily to ensure proper order and nesting, as
function arguments are evaluated before the surrounding invocation – otherwise
the code above would emit `<h1>` and `<p>` before the `<body>` and `<html>`
elements.

Thus the example above returns a hierarchy of element generators, encapsulated
by a single element generator at the root, which upon invocation writes HTML to
the `stream` object being passed in:

```javascript
let element = generateHTML(…);
element(stream, …);
```

(`stream` is expected to support the methods `#write`, `#writeln` and `#flush`;
see `BufferedStream` for a sample implementation).

With our example, this should result in the following string being emitted:

```html
<html lang="en"><body id="top"><h1>hello world</h1><p>lorem ipsum</p></body></html>
```
