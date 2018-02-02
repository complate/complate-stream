declare global {
	namespace JSX {
		interface Element extends StatelessFunctionalComponent<any> {}
	}
}

export default Renderer;
export { createElement, generateHTML, safe, htmlEncode, Fragment };

interface StatelessFunctionalComponent<T> {
	(props: T): elementGenerator;
}

declare type elementGenerator = (stream: Renderer.Stream, nonBlocking: boolean,
		callback: () => void) => void;

declare const Fragment;

declare function createElement<T>(element: string | StatelessFunctionalComponent<T>,
		params: T, ...children): elementGenerator;

declare function generateHTML(tag: string, params, ...children): elementGenerator;

declare function safe(str: string): Renderer.HTMLString;

declare function htmlEncode(str: string, attribute: boolean): string;

declare class Renderer {
	constructor(doctype?: string);

	renderView(view: elementGenerator | string, params: Object,
			stream: Renderer.Stream, { fragment: boolean }?,
			callback?: () => void): void;

	registerView(macro: () => elementGenerator, name?: string,
			replace?: boolean): string;
}

declare namespace Renderer {
	export interface Stream {
		write(msg: string): void;
		writeln(msg: string): void;
		flush(): void;
	}

	export class HTMLString {}
}
