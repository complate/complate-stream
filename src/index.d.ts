export default Renderer;
export { createElement, generateHTML, safe, htmlEncode };

// ** TSX configuration

declare global {
	namespace JSX {
		// This is needed for attribute type checking in custom components
		interface Element extends StatelessFunctionalComponent<any> { }
	}
}

// ** Types and interfaces

// Return value of createElement
declare type elementGenerator = (
	stream: Renderer.Stream,
	nonBlocking: boolean,
	callback: () => void
) => void;

// A macro
interface StatelessFunctionalComponent<P> {
	(props: P): elementGenerator;
}

// ** Exports

declare function createElement<T>(
	element: string | StatelessFunctionalComponent<T>,
	params: T,
	...children
): elementGenerator;

declare function generateHTML(
	tag: string,
	params,
	...children
): elementGenerator;

declare function safe(str: string): Renderer.HTMLString;

declare function htmlEncode(str: string, attribute: boolean): string;

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
