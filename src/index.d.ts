declare type elementGenerator = (
  stream: Renderer.Stream,
  nonBlocking: boolean,
  callback: () => void
) => void;

interface StatelessFunctionalComponent<P> {
  (props: P): elementGenerator;
}

declare function createElement<T>(
  element: string | StatelessFunctionalComponent<T>,
  params: T,
  ...children
): elementGenerator;

declare function safe(str: string): Renderer.HTMLString;

declare class Renderer {
  constructor(doctype?: string);

  renderView(
    view: elementGenerator | string,
    params: Object,
    stream: Renderer.Stream,
    { fragment: boolean }?,
    callback?: () => void
  ): void;

  registerView(
    macro: () => elementGenerator,
    name?: string,
    replace?: boolean
  ): string;
}

declare namespace Renderer {
  export interface Stream {
    write(msg: string): void;
    writeln(msg: string): void;
    flush(): void;
  }
  export class HTMLString {

  }
}

export default Renderer;

export { createElement, safe };

// Global definitions
declare global {
  namespace JSX {
    // This is needed for attribute type checking in custom components
    interface Element extends StatelessFunctionalComponent<any> { }
  }
}
