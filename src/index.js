import documentRenderer, { createElement } from "./renderer";
import generateHTML, { HTMLString } from "./html";

export default documentRenderer;
export { createElement, generateHTML, safe };

function safe(str) {
	return new HTMLString(str);
}
