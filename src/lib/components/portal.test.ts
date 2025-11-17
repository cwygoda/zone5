import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import portal from './portal';

describe('portal', () => {
	let testElement: HTMLElement;
	let target: HTMLElement;

	beforeEach(() => {
		document.body.innerHTML = '';

		testElement = document.createElement('div');

		target = document.createElement('div');
		target.id = 'target';
		document.body.appendChild(target);
	});

	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('new portal without parameters is mounted into body', () => {
		expect(testElement.parentElement).not.toBe(document.body);

		portal(testElement, undefined);

		expect(Array.from(document.body.childNodes).includes(testElement)).toBe(true);
	});

	it('new portal with css string selector is added to element matching that selector', () => {
		expect(testElement.parentElement).not.toBe(document.body);

		portal(testElement, '#target');

		expect(Array.from(target.childNodes).includes(testElement)).toBe(true);
	});

	it('new portal given a HTMLElement instance is added to that element', () => {
		expect(testElement.parentElement).not.toBe(document.body);

		portal(testElement, target);

		expect(Array.from(target.childNodes).includes(testElement)).toBe(true);
	});

	it("passing a CSS selector which doesn't match any element in the document raises an error", () => {
		expect(() => {
			portal(testElement, '#non-existent-selector');
		}).toThrow('portal: no element found matching css selector: "#non-existent-selector"');
	});

	it('portal can be updated to move to different targets', () => {
		const secondTarget = document.createElement('div');
		secondTarget.className = 'second-target';
		document.body.appendChild(secondTarget);

		const portalAction = portal(testElement, target);
		expect(Array.from(target.childNodes).includes(testElement)).toBe(true);

		portalAction!.update!(secondTarget);
		expect(secondTarget.contains(testElement)).toBe(true);
		expect(Array.from(secondTarget.childNodes).includes(testElement)).toBe(true);
		expect(Array.from(target.childNodes).includes(testElement)).toBe(false);
	});

	it('destroy removes the element from its parent', () => {
		const portalAction = portal(testElement, target);
		expect(Array.from(target.childNodes).includes(testElement)).toBe(true);

		portalAction!.destroy!();
		expect(Array.from(target.childNodes).includes(testElement)).toBe(false);
		expect(document.body.contains(testElement)).toBe(false);
	});
});
