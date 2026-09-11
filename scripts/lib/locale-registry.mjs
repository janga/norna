import bulgarianLabels from './locales/bg.mjs';
import bosnianLabels from './locales/bs.mjs';
import catalanLabels from './locales/ca.mjs';
import montenegrinLabels from './locales/cnr.mjs';
import czechLabels from './locales/cs.mjs';
import danishLabels from './locales/da.mjs';
import germanLabels from './locales/de.mjs';
import greekLabels from './locales/el.mjs';
import englishLabels from './locales/en.mjs';
import spanishLabels from './locales/es.mjs';
import estonianLabels from './locales/et.mjs';
import filipinoLabels from './locales/fil.mjs';
import finnishLabels from './locales/fi.mjs';
import frenchLabels from './locales/fr.mjs';
import irishLabels from './locales/ga.mjs';
import hausaLabels from './locales/ha.mjs';
import croatianLabels from './locales/hr.mjs';
import hungarianLabels from './locales/hu.mjs';
import italianLabels from './locales/it.mjs';
import icelandicLabels from './locales/is.mjs';
import portugueseLabels from './locales/pt.mjs';
import indonesianLabels from './locales/id.mjs';
import javaneseLabels from './locales/jv.mjs';
import lithuanianLabels from './locales/lt.mjs';
import latvianLabels from './locales/lv.mjs';
import luxembourgishLabels from './locales/lb.mjs';
import macedonianLabels from './locales/mk.mjs';
import malteseLabels from './locales/mt.mjs';
import norwegianBokmalLabels from './locales/nb.mjs';
import norwegianNynorskLabels from './locales/nn.mjs';
import dutchLabels from './locales/nl.mjs';
import polishLabels from './locales/pl.mjs';
import pidginLabels from './locales/pcm.mjs';
import russianLabels from './locales/ru.mjs';
import romanianLabels from './locales/ro.mjs';
import slovakLabels from './locales/sk.mjs';
import slovenianLabels from './locales/sl.mjs';
import swedishLabels from './locales/sv.mjs';
import swahiliLabels from './locales/sw.mjs';
import albanianLabels from './locales/sq.mjs';
import serbianCyrillicLabels from './locales/sr-Cyrl.mjs';
import serbianLatinLabels from './locales/sr-Latn.mjs';
import turkishLabels from './locales/tr.mjs';
import ukrainianLabels from './locales/uk.mjs';
import vietnameseLabels from './locales/vi.mjs';
import azerbaijaniLatinLabels from './locales/az-Latn.mjs';
import belarusianLabels from './locales/be.mjs';
import { getPagefindTranslations } from './pagefind-translations.mjs';

const placeholderPattern = /\{([a-z]+)\}/g;
const englishLabelKeys = Object.freeze(Object.keys(englishLabels));

const getPlaceholders = (value) => [...value.matchAll(placeholderPattern)].map((match) => match[1]).sort();

const assertCompleteLabels = (tag, labels) => {
	if (!labels || typeof labels !== 'object' || Array.isArray(labels)) {
		throw new Error(`Locale ${tag} must provide an object of Norna interface labels.`);
	}

	const keys = Object.keys(labels);
	const missing = englishLabelKeys.filter((key) => !Object.hasOwn(labels, key));
	const unexpected = keys.filter((key) => !Object.hasOwn(englishLabels, key));
	if (missing.length > 0 || unexpected.length > 0) {
		throw new Error([
			`Locale ${tag} does not match the Norna interface-label contract.`,
			...(missing.length > 0 ? [`Missing: ${missing.join(', ')}`] : []),
			...(unexpected.length > 0 ? [`Unexpected: ${unexpected.join(', ')}`] : []),
		].join('\n'));
	}

	for (const key of englishLabelKeys) {
		const value = labels[key];
		if (typeof value !== 'string' || value.trim() === '') {
			throw new Error(`Locale ${tag} label ${key} must be a non-empty string.`);
		}
		const expectedPlaceholders = getPlaceholders(englishLabels[key]);
		const actualPlaceholders = getPlaceholders(value);
		if (expectedPlaceholders.join('\0') !== actualPlaceholders.join('\0')) {
			throw new Error(`Locale ${tag} label ${key} must preserve placeholders: ${expectedPlaceholders.join(', ') || '(none)'}.`);
		}
	}

	return Object.freeze(labels);
};

const pagefindBuiltInLanguages = new Set([
	'ca', 'cs', 'da', 'de', 'el', 'en', 'es', 'fi', 'fr', 'hr', 'hu', 'id', 'it',
	'nb', 'nl', 'nn', 'pl', 'pt', 'ro', 'ru', 'sr', 'sv', 'sw', 'tr', 'uk', 'vi',
]);

const defineLocale = ({ tag, language, name, nativeName, script, labels, requiresScript = false }) => {
	const pagefindTranslations = getPagefindTranslations(tag);
	if (!pagefindTranslations && !pagefindBuiltInLanguages.has(language)) {
		throw new Error(`Locale ${tag} needs a complete Pagefind UI translation.`);
	}

	return Object.freeze({
		tag,
		language,
		name,
		nativeName,
		script,
		requiresScript,
		labels: assertCompleteLabels(tag, labels),
		pagefindTranslations,
	});
};

export const localeDefinitions = Object.freeze([
	defineLocale({
		tag: 'en',
		language: 'en',
		name: 'English',
		nativeName: 'English',
		script: 'Latn',
		labels: englishLabels,
	}),
	defineLocale({
		tag: 'es',
		language: 'es',
		name: 'Spanish',
		nativeName: 'Español',
		script: 'Latn',
		labels: spanishLabels,
	}),
	defineLocale({
		tag: 'fr',
		language: 'fr',
		name: 'French',
		nativeName: 'Français',
		script: 'Latn',
		labels: frenchLabels,
	}),
	defineLocale({
		tag: 'pt',
		language: 'pt',
		name: 'Portuguese',
		nativeName: 'Português',
		script: 'Latn',
		labels: portugueseLabels,
	}),
	defineLocale({
		tag: 'ru',
		language: 'ru',
		name: 'Russian',
		nativeName: 'Русский',
		script: 'Cyrl',
		labels: russianLabels,
	}),
	defineLocale({
		tag: 'sw',
		language: 'sw',
		name: 'Swahili',
		nativeName: 'Kiswahili',
		script: 'Latn',
		labels: swahiliLabels,
	}),
	defineLocale({
		tag: 'jv',
		language: 'jv',
		name: 'Javanese',
		nativeName: 'Basa Jawa',
		script: 'Latn',
		labels: javaneseLabels,
	}),
	defineLocale({
		tag: 'id',
		language: 'id',
		name: 'Indonesian',
		nativeName: 'Bahasa Indonesia',
		script: 'Latn',
		labels: indonesianLabels,
	}),
	defineLocale({
		tag: 'de',
		language: 'de',
		name: 'German',
		nativeName: 'Deutsch',
		script: 'Latn',
		labels: germanLabels,
	}),
	defineLocale({
		tag: 'it',
		language: 'it',
		name: 'Italian',
		nativeName: 'Italiano',
		script: 'Latn',
		labels: italianLabels,
	}),
	defineLocale({
		tag: 'vi',
		language: 'vi',
		name: 'Vietnamese',
		nativeName: 'Tiếng Việt',
		script: 'Latn',
		labels: vietnameseLabels,
	}),
	defineLocale({
		tag: 'tr',
		language: 'tr',
		name: 'Turkish',
		nativeName: 'Türkçe',
		script: 'Latn',
		labels: turkishLabels,
	}),
	defineLocale({
		tag: 'fil',
		language: 'fil',
		name: 'Filipino',
		nativeName: 'Filipino',
		script: 'Latn',
		labels: filipinoLabels,
	}),
	defineLocale({
		tag: 'pcm',
		language: 'pcm',
		name: 'Nigerian Pidgin',
		nativeName: 'Naijá',
		script: 'Latn',
		labels: pidginLabels,
	}),
	defineLocale({
		tag: 'ha',
		language: 'ha',
		name: 'Hausa',
		nativeName: 'Hausa',
		script: 'Latn',
		labels: hausaLabels,
	}),
	defineLocale({
		tag: 'sv',
		language: 'sv',
		name: 'Swedish',
		nativeName: 'Svenska',
		script: 'Latn',
		labels: swedishLabels,
	}),
	defineLocale({
		tag: 'bg',
		language: 'bg',
		name: 'Bulgarian',
		nativeName: 'Български',
		script: 'Cyrl',
		labels: bulgarianLabels,
	}),
	defineLocale({
		tag: 'hr',
		language: 'hr',
		name: 'Croatian',
		nativeName: 'Hrvatski',
		script: 'Latn',
		labels: croatianLabels,
	}),
	defineLocale({
		tag: 'cs',
		language: 'cs',
		name: 'Czech',
		nativeName: 'Čeština',
		script: 'Latn',
		labels: czechLabels,
	}),
	defineLocale({
		tag: 'da',
		language: 'da',
		name: 'Danish',
		nativeName: 'Dansk',
		script: 'Latn',
		labels: danishLabels,
	}),
	defineLocale({
		tag: 'nl',
		language: 'nl',
		name: 'Dutch',
		nativeName: 'Nederlands',
		script: 'Latn',
		labels: dutchLabels,
	}),
	defineLocale({
		tag: 'et',
		language: 'et',
		name: 'Estonian',
		nativeName: 'Eesti',
		script: 'Latn',
		labels: estonianLabels,
	}),
	defineLocale({
		tag: 'fi',
		language: 'fi',
		name: 'Finnish',
		nativeName: 'Suomi',
		script: 'Latn',
		labels: finnishLabels,
	}),
	defineLocale({
		tag: 'el',
		language: 'el',
		name: 'Greek',
		nativeName: 'Ελληνικά',
		script: 'Grek',
		labels: greekLabels,
	}),
	defineLocale({
		tag: 'hu',
		language: 'hu',
		name: 'Hungarian',
		nativeName: 'Magyar',
		script: 'Latn',
		labels: hungarianLabels,
	}),
	defineLocale({
		tag: 'ga',
		language: 'ga',
		name: 'Irish',
		nativeName: 'Gaeilge',
		script: 'Latn',
		labels: irishLabels,
	}),
	defineLocale({
		tag: 'lv',
		language: 'lv',
		name: 'Latvian',
		nativeName: 'Latviešu',
		script: 'Latn',
		labels: latvianLabels,
	}),
	defineLocale({
		tag: 'lt',
		language: 'lt',
		name: 'Lithuanian',
		nativeName: 'Lietuvių',
		script: 'Latn',
		labels: lithuanianLabels,
	}),
	defineLocale({
		tag: 'mt',
		language: 'mt',
		name: 'Maltese',
		nativeName: 'Malti',
		script: 'Latn',
		labels: malteseLabels,
	}),
	defineLocale({
		tag: 'pl',
		language: 'pl',
		name: 'Polish',
		nativeName: 'Polski',
		script: 'Latn',
		labels: polishLabels,
	}),
	defineLocale({
		tag: 'ro',
		language: 'ro',
		name: 'Romanian',
		nativeName: 'Română',
		script: 'Latn',
		labels: romanianLabels,
	}),
	defineLocale({
		tag: 'sk',
		language: 'sk',
		name: 'Slovak',
		nativeName: 'Slovenčina',
		script: 'Latn',
		labels: slovakLabels,
	}),
	defineLocale({
		tag: 'sl',
		language: 'sl',
		name: 'Slovenian',
		nativeName: 'Slovenščina',
		script: 'Latn',
		labels: slovenianLabels,
	}),
	defineLocale({
		tag: 'sq',
		language: 'sq',
		name: 'Albanian',
		nativeName: 'Shqip',
		script: 'Latn',
		labels: albanianLabels,
	}),
	defineLocale({
		tag: 'az-Latn',
		language: 'az',
		name: 'Azerbaijani (Latin)',
		nativeName: 'Azərbaycanca',
		script: 'Latn',
		requiresScript: true,
		labels: azerbaijaniLatinLabels,
	}),
	defineLocale({
		tag: 'be',
		language: 'be',
		name: 'Belarusian',
		nativeName: 'Беларуская',
		script: 'Cyrl',
		labels: belarusianLabels,
	}),
	defineLocale({
		tag: 'bs',
		language: 'bs',
		name: 'Bosnian',
		nativeName: 'Bosanski',
		script: 'Latn',
		labels: bosnianLabels,
	}),
	defineLocale({
		tag: 'ca',
		language: 'ca',
		name: 'Catalan',
		nativeName: 'Català',
		script: 'Latn',
		labels: catalanLabels,
	}),
	defineLocale({
		tag: 'is',
		language: 'is',
		name: 'Icelandic',
		nativeName: 'Íslenska',
		script: 'Latn',
		labels: icelandicLabels,
	}),
	defineLocale({
		tag: 'lb',
		language: 'lb',
		name: 'Luxembourgish',
		nativeName: 'Lëtzebuergesch',
		script: 'Latn',
		labels: luxembourgishLabels,
	}),
	defineLocale({
		tag: 'mk',
		language: 'mk',
		name: 'Macedonian',
		nativeName: 'Македонски',
		script: 'Cyrl',
		labels: macedonianLabels,
	}),
	defineLocale({
		tag: 'cnr',
		language: 'cnr',
		name: 'Montenegrin',
		nativeName: 'Crnogorski',
		script: 'Latn',
		labels: montenegrinLabels,
	}),
	defineLocale({
		tag: 'nb',
		language: 'nb',
		name: 'Norwegian Bokmål',
		nativeName: 'Norsk bokmål',
		script: 'Latn',
		labels: norwegianBokmalLabels,
	}),
	defineLocale({
		tag: 'nn',
		language: 'nn',
		name: 'Norwegian Nynorsk',
		nativeName: 'Norsk nynorsk',
		script: 'Latn',
		labels: norwegianNynorskLabels,
	}),
	defineLocale({
		tag: 'sr-Cyrl',
		language: 'sr',
		name: 'Serbian (Cyrillic)',
		nativeName: 'Српски',
		script: 'Cyrl',
		requiresScript: true,
		labels: serbianCyrillicLabels,
	}),
	defineLocale({
		tag: 'sr-Latn',
		language: 'sr',
		name: 'Serbian (Latin)',
		nativeName: 'Srpski',
		script: 'Latn',
		requiresScript: true,
		labels: serbianLatinLabels,
	}),
	defineLocale({
		tag: 'uk',
		language: 'uk',
		name: 'Ukrainian',
		nativeName: 'Українська',
		script: 'Cyrl',
		labels: ukrainianLabels,
	}),
]);

export const supportedLocaleTags = Object.freeze(localeDefinitions.map(({ tag }) => tag));

const escapeRegularExpression = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const regionPatternSource = String.raw`(?:[A-Za-z]{2}|[0-9]{3})`;
const definitionTagPattern = ({ tag, language, script, requiresScript }, requireQualifier = false) => {
	const escapedTag = escapeRegularExpression(tag);
	if (requiresScript) {
		return requireQualifier
			? `${escapedTag}-${regionPatternSource}`
			: `${escapedTag}(?:-${regionPatternSource})?`;
	}

	const escapedLanguage = escapeRegularExpression(language);
	const escapedScript = escapeRegularExpression(script);
	return requireQualifier
		? `${escapedLanguage}(?:-${escapedScript}(?:-${regionPatternSource})?|-${regionPatternSource})`
		: `${escapedLanguage}(?:-${escapedScript})?(?:-${regionPatternSource})?`;
};

export const supportedLocaleTagPatternSource = `^(?:${localeDefinitions
	.map((definition) => definitionTagPattern(definition))
	.join('|')})$`;
export const supportedQualifiedLocaleTagPatternSource = `^(?:${localeDefinitions
	.map((definition) => definitionTagPattern(definition, true))
	.join('|')})$`;
export const supportedLocaleTagPattern = new RegExp(supportedLocaleTagPatternSource);

const definitionsByLanguage = new Map();
for (const definition of localeDefinitions) {
	const definitions = definitionsByLanguage.get(definition.language) ?? [];
	definitions.push(definition);
	definitionsByLanguage.set(definition.language, definitions);
}

const normalizeLanguageTag = (value) => {
	if (typeof value !== 'string' || value.trim() === '') {
		throw new TypeError('must be a non-empty BCP 47 language tag');
	}

	const source = value.trim();
	try {
		Intl.getCanonicalLocales(source);
	} catch {
		throw new TypeError('must be a valid BCP 47 language tag');
	}

	const parts = source.split('-');
	const language = parts.shift()?.toLowerCase();
	let script = null;
	let region = null;
	const canonicalParts = [language];

	if (parts[0] && /^[a-zA-Z]{4}$/.test(parts[0])) {
		script = `${parts[0][0].toUpperCase()}${parts[0].slice(1).toLowerCase()}`;
		canonicalParts.push(script);
		parts.shift();
	}
	if (parts[0] && /^(?:[a-zA-Z]{2}|\d{3})$/.test(parts[0])) {
		region = parts[0].toUpperCase();
		canonicalParts.push(region);
		parts.shift();
	}
	canonicalParts.push(...parts.map((part) => part.toLowerCase()));

	return Object.freeze({
		lang: canonicalParts.join('-'),
		language,
		region,
		script,
	});
};

const formatSupportedLanguages = () => supportedLocaleTags.join(', ');

export const resolveLocale = (configuredLanguage = 'en', sourceLabel = 'site/config.yaml') => {
	let parsed;
	try {
		parsed = normalizeLanguageTag(configuredLanguage);
	} catch (error) {
		throw new Error(`language ${error.message} in ${sourceLabel}.`);
	}

	const candidates = definitionsByLanguage.get(parsed.language) ?? [];
	if (candidates.length === 0) {
		throw new Error(`language "${parsed.lang}" has no built-in Norna UI text. Supported languages: ${formatSupportedLanguages()}.`);
	}

	const matchingScript = parsed.script
		? candidates.find(({ script }) => script === parsed.script)
		: candidates.find(({ requiresScript }) => !requiresScript);
	if (!matchingScript) {
		const alternatives = candidates.map(({ tag }) => tag).join(', ');
		if (!parsed.script) {
			throw new Error(`language "${parsed.lang}" must identify a supported script. Use one of: ${alternatives}.`);
		}
		throw new Error(`language "${parsed.lang}" uses an unsupported script. Use one of: ${alternatives}.`);
	}

	return Object.freeze({
		lang: parsed.lang,
		formattingLocale: parsed.lang,
		language: matchingScript.language,
		script: matchingScript.script,
		labels: matchingScript.labels,
		pagefindTranslations: matchingScript.pagefindTranslations,
	});
};
