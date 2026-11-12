export interface DomElementDescription {
	selector: string;
	components: string;
	text: string;
	rect: string;
	label: string;
}

const NOISY_CLASS = /^(ng-|sc-|ion-|hydrated$|md$|ios$|in-|item-|button-|activated$|interactive$|ion-activatable|cdk-)/;
const GENERATED_ID = /^(ion-|cdk-|mat-)|^[a-f0-9-]{16,}$/;
const STOP_TAGS = new Set(["BODY", "HTML", "ION-APP", "BO-APP"]);

export function getLightDomElement(path: EventTarget[]): Element | null {
	for (const target of path) {
		if (target instanceof Element && target.getRootNode() === document) return target;
	}
	return null;
}

export function describeElement(element: Element, textMaxLength: number): DomElementDescription {
	const rect = element.getBoundingClientRect();
	const components = getComponents(element);
	const text = getElementText(element, textMaxLength);

	return {
		selector: getSelector(element),
		components: components.join(" › "),
		text,
		rect: `${Math.round(rect.left)}, ${Math.round(rect.top)} · ${Math.round(rect.width)} × ${Math.round(rect.height)} px`,
		label: text || components[components.length - 1] || element.tagName.toLowerCase(),
	};
}

export function getElementName(element: Element): string {
	const component = getComponents(element).pop();
	const tag = element.tagName.toLowerCase();
	return component && component !== tag ? `${component} › ${tag}` : tag;
}

function getSelector(element: Element): string {
	const parts: string[] = [];
	let current: Element | null = element;

	while (current && !STOP_TAGS.has(current.tagName)) {
		const id = current.id;

		if (id && !GENERATED_ID.test(id)) {
			parts.unshift(`#${CSS.escape(id)}`);
			break;
		}

		parts.unshift(getSelectorPart(current));
		current = current.parentElement;
	}

	return parts.join(" > ");
}

function getSelectorPart(element: Element): string {
	const tag = element.tagName.toLowerCase();

	const classes = Array.from(element.classList)
		.filter((name) => !NOISY_CLASS.test(name))
		.slice(0, 2)
		.map((name) => `.${CSS.escape(name)}`)
		.join("");

	const parent = element.parentElement;
	if (!parent) return tag + classes;

	const sameTag = Array.from(parent.children).filter((child) => child.tagName === element.tagName);
	if (sameTag.length < 2) return tag + classes;

	return `${tag}${classes}:nth-of-type(${sameTag.indexOf(element) + 1})`;
}

function getComponents(element: Element): string[] {
	const components: string[] = [];
	let current: Element | null = element;

	while (current) {
		const tag = current.tagName.toLowerCase();
		if (tag.startsWith("bo-") && tag !== "bo-app") components.unshift(tag);
		current = current.parentElement;
	}

	return components;
}

function getElementText(element: Element, maxLength: number): string {
	const text =
		(element instanceof HTMLElement ? element.innerText : element.textContent) ||
		element.getAttribute("aria-label") ||
		element.getAttribute("title") ||
		element.getAttribute("placeholder") ||
		element.getAttribute("alt") ||
		"";

	const normalized = text.replace(/\s+/g, " ").trim();

	return normalized.length > maxLength ? `${normalized.slice(0, maxLength - 1).trimEnd()}…` : normalized;
}
