import Renderer, { createElement } from "./renderer";
import generateHTML, { Fragment, HTMLString, htmlEncode } from "./html";

export default Renderer;
export { Fragment, createElement, generateHTML, safe, htmlEncode };

function safe(str) {
	return new HTMLString(str);
}
