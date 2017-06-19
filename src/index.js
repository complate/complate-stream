import documentRenderer, { registerMacro, createElement } from "./renderer";
import generateHTML, { HTMLString } from "./html";

export default documentRenderer;
export { registerMacro, createElement, generateHTML, safe };

function safe(str) {
	return new HTMLString(str);
}
