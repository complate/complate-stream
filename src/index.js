import Renderer, { createElement } from "./renderer";
import generateHTML, { HTMLString, htmlEncode } from "./html";

export default Renderer;
export { createElement, generateHTML, safe, htmlEncode };

function safe(str) {
	return new HTMLString(str);
}
