import Renderer, { createElement } from "./renderer";
import generateHTML, { HTMLString } from "./html";

export default Renderer;
export { createElement, generateHTML, safe };

function safe(str) {
	return new HTMLString(str);
}
