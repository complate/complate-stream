import renderer, { createElement } from "./renderer";
import generateHTML, { HTMLString } from "./html";

export default renderer;
export { createElement, generateHTML, safe };

function safe(str) {
	return new HTMLString(str);
}
