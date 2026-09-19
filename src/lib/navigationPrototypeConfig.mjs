// Internal build-time switches for local trials, not supported site settings.
export const areaNavigationPrototype = process.env.NORNA_AREA_NAVIGATION_PROTOTYPE === '1';
export const navigationPrototype = areaNavigationPrototype
	|| process.env.NORNA_NAVIGATION_PROTOTYPE === '1';
