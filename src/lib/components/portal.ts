import type { Action } from 'svelte/action';

const resolveTarget = (target: HTMLElement | string = 'body'): HTMLElement => {
	if (typeof target === 'string') {
		const element = document.querySelector<HTMLElement>(target);
		if (element === null) {
			throw new Error(`portal: no element found matching css selector: "${target}"`);
		}
		return element;
	}
	return target;
};

const moveToTarget = (node: HTMLElement, target: HTMLElement | string) => {
	resolveTarget(target).appendChild(node);
};

const removeFromParent = (node: HTMLElement) => {
	if (node.parentNode) {
		node.parentNode.removeChild(node);
	}
};

type targetSelector = HTMLElement | string | undefined;

const portal: Action<HTMLElement, targetSelector> = (node, target) => {
	moveToTarget(node, resolveTarget(target));
	return {
		update: (target) => moveToTarget(node, resolveTarget(target)),
		destroy: () => removeFromParent(node),
	};
};

export default portal;
