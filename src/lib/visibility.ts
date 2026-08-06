export interface VisibilityWindow {
	from?: string;
	until?: string;
}

const dateOnlyRegex = /^\d{4}-\d{2}-\d{2}$/;

export const isDateOnly = (value: string) => {
	if (!dateOnlyRegex.test(value)) return false;

	const date = new Date(`${value}T00:00:00.000Z`);
	return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

export const getToday = () => {
	const configuredToday = process.env.NORNA_TODAY?.trim();
	if (configuredToday) {
		if (!isDateOnly(configuredToday)) {
			throw new Error('NORNA_TODAY must use YYYY-MM-DD format.');
		}

		return configuredToday;
	}

	return new Date().toISOString().slice(0, 10);
};

export const isVisibleToday = (visible?: VisibilityWindow, today = getToday()) => {
	if (!visible) return true;

	return (
		(visible.from === undefined || today >= visible.from)
		&& (visible.until === undefined || today < visible.until)
	);
};
