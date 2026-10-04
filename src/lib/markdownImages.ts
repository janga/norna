import { parseFragment, serializeOuter, type DefaultTreeAdapterMap } from 'parse5';
import { getPageImageSourceKey } from '../../scripts/lib/site-conventions.mjs';
import { getGeneratedImage, getImageAttributes, getImageInspectionAttributes } from './generatedImages';
import { getImageClass, getImageLoadingProps, getManagedImageSizes } from './imagePresentation';
import projectConfig from '../../scripts/lib/project-config.mjs';

type Node = DefaultTreeAdapterMap['node'];
type Element = DefaultTreeAdapterMap['element'];
const isElement = (node: Node): node is Element => 'tagName' in node;
const attribute = (node: Element, name: string) => node.attrs.find((attr) => attr.name === name)?.value;
const meaningfulChildren = (node: Element) => node.childNodes.filter((child) => child.nodeName !== '#text' || ('value' in child && child.value.trim()));
const soleImage = (node: Element): { image: Element; href?: string; linkTitle?: string } | null => {
	const children = meaningfulChildren(node);
	if (children.length !== 1 || !isElement(children[0])) return null;
	const child = children[0];
	if (child.tagName === 'img' && attribute(child, 'data-norna-managed-image')) return { image: child };
	if (child.tagName === 'a') {
		const nested = soleImage(child);
		if (nested) return { image: nested.image, href: attribute(child, 'href'), linkTitle: attribute(child, 'title') };
	}
	return null;
};

// Promote only top-level, single-image paragraphs to the shared Astro stack.
// Nested images stay in their original list, quote, table, details or text.
export const splitMarkdownImages = (html: string, pageDirectory: string) => {
	if (!html.includes('data-norna-managed-image=')) return [{ type: 'html' as const, html }];
	const fragment = parseFragment(html);
	const result: Array<{ type: 'html'; html: string } | { type: 'image-stack'; images: Array<{ image: string; src: string; alt: string; title?: string; href?: string; linkTitle?: string }> }> = [];
	let pending = '';
	const flush = () => { if (pending.trim()) result.push({ type: 'html', html: pending }); pending = ''; };
	const markSource = (node: Node) => {
		if (!isElement(node)) return;
		const marker = node.attrs.find((attr) => attr.name === 'data-norna-managed-image');
		if (marker) marker.value = getPageImageSourceKey(pageDirectory, marker.value);
		for (const child of node.childNodes) markSource(child);
	};
	for (const node of fragment.childNodes) {
		const standalone = isElement(node) && node.tagName === 'p' ? soleImage(node) : null;
		if (standalone) {
			flush();
			const name = attribute(standalone.image, 'data-norna-managed-image')!;
			result.push({ type: 'image-stack', images: [{ image: name, src: getPageImageSourceKey(pageDirectory, name), alt: attribute(standalone.image, 'alt') ?? '', title: attribute(standalone.image, 'title'), href: standalone.href, linkTitle: standalone.linkTitle }] });
		} else {
			markSource(node);
			pending += serializeOuter(node);
		}
	}
	flush();
	return result;
};

const escapeAttribute = (value: unknown) => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const attributes = (values: Record<string, unknown>) => Object.entries(values).filter(([, value]) => value !== undefined && value !== null).map(([key, value]) => ` ${key}="${escapeAttribute(value)}"`).join('');

export const renderNestedMarkdownImages = (html: string, title: string, width: { desktop: number; mobile: number }) => {
	if (!html.includes('data-norna-managed-image=')) return html;
	const fragment = parseFragment(html, { sourceCodeLocationInfo: true });
	const edits: Array<{ start: number; end: number; html: string }> = [];
	const renderImage = (node: Element, standalone = false, href?: string, linkTitle?: string) => {
		const src = attribute(node, 'data-norna-managed-image')!;
		if (!getGeneratedImage(src)) throw new Error(`Managed Markdown image is missing from the generated manifest: ${src}. Run Norna's image preparation after correcting the source file.`);
		const alt = attribute(node, 'alt') ?? '';
		const imageClass = standalone ? ['managed-image', getImageClass({ image: src })].filter(Boolean).join(' ') : 'managed-markdown-inline';
		const image = `<img${attributes({ ...getImageAttributes(src, getManagedImageSizes(width)), class: imageClass, alt, title: attribute(node, 'title'), ...getImageLoadingProps(false) })}>`;
		if (!standalone) return image;
		const inspection = getImageInspectionAttributes(src);
		const link = attributes({
			class: 'managed-image-inspection-link', href: href ?? inspection.href, title: linkTitle,
			'aria-label': href === undefined ? projectConfig.locale.labels.inspectImage.replace('{description}', alt || title) : undefined,
			'data-image-inspection-trigger': href === undefined ? '' : undefined,
			'data-image-intrinsic-width': inspection.width, 'data-image-intrinsic-height': inspection.height,
			'data-image-inspection-scalable': inspection.scalable ? 'true' : undefined,
			style: inspection.width && inspection.height ? `--managed-image-intrinsic-width: ${inspection.width}px; --managed-image-aspect-ratio: ${inspection.width / inspection.height}` : undefined,
		});
		// The same Lucide Maximize2 affordance used by ImageStack.astro; this
		// fragment stays inside the authored Markdown container.
		const affordance = href === undefined ? '<span class="managed-image-inspection-affordance" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="m21 3-7 7"/><path d="m3 21 7-7"/><path d="M9 21H3v-6"/></svg></span>' : '';
		return `<div class="image-stack managed-markdown-standalone content-block-note-lane-boundary"><figure class="managed-image-item"><div class="managed-image-frame"><a${link}>${image}${affordance}</a></div></figure></div>`;
	};
	const visit = (node: Node) => {
		if (!isElement(node)) return;
		const location = node.sourceCodeLocation;
		if (location && (node.tagName === 'p' || node.tagName === 'li')) {
			const standalone = soleImage(node);
			if (standalone) {
				const start = node.tagName === 'li' ? location.startTag!.endOffset : location.startOffset;
				const end = node.tagName === 'li' ? (location.endTag?.startOffset ?? location.endOffset) : location.endOffset;
				edits.push({ start, end, html: renderImage(standalone.image, true, standalone.href, standalone.linkTitle) });
				return;
			}
		}
		if (location && node.tagName === 'img' && attribute(node, 'data-norna-managed-image')) {
			edits.push({ start: location.startOffset, end: location.endOffset, html: renderImage(node) });
			return;
		}
		for (const child of node.childNodes) visit(child);
	};
	for (const node of fragment.childNodes) visit(node);
	return edits.sort((a, b) => b.start - a.start).reduce((result, edit) => result.slice(0, edit.start) + edit.html + result.slice(edit.end), html);
};
