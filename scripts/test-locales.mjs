import assert from 'node:assert/strict';
import englishLabels from './lib/locales/en.mjs';
import { pagefindTranslationTags } from './lib/pagefind-translations.mjs';
import {
	localeDefinitions,
	resolveLocale,
	supportedLocaleTagPattern,
	supportedLocaleTags,
} from './lib/locale-registry.mjs';

const expectedTags = [
	'en', 'es', 'fr', 'pt', 'ru', 'sw', 'jv', 'id', 'de', 'it', 'vi', 'tr', 'fil', 'pcm', 'ha',
	'sv', 'bg', 'hr', 'cs', 'da', 'nl', 'et', 'fi', 'el', 'hu', 'ga', 'lv', 'lt', 'mt', 'pl', 'ro',
	'sk', 'sl', 'sq', 'az-Latn', 'be', 'bs', 'ca', 'is', 'lb', 'mk', 'cnr', 'nb', 'nn', 'sr-Cyrl',
	'sr-Latn', 'uk',
];
const placeholderPattern = /\{([a-z]+)\}/g;
const placeholders = (value) => [...value.matchAll(placeholderPattern)].map((match) => match[1]).sort();

assert.deepEqual(supportedLocaleTags, expectedTags);
assert.deepEqual(pagefindTranslationTags, [
	'jv', 'fil', 'pcm', 'ha', 'bg', 'et', 'ga', 'lv', 'lt', 'mt', 'sk', 'sl', 'sq', 'az-Latn',
	'be', 'bs', 'is', 'lb', 'mk', 'cnr', 'sr-Latn',
]);
assert.equal(localeDefinitions.length, 47);
assert.equal(new Set(supportedLocaleTags).size, supportedLocaleTags.length);
assert.deepEqual(new Set(localeDefinitions.map(({ script }) => script)), new Set(['Latn', 'Cyrl', 'Grek']));

const englishKeys = Object.keys(englishLabels).sort();
for (const definition of localeDefinitions) {
	assert.match(definition.tag, supportedLocaleTagPattern);
	assert.deepEqual(Object.keys(definition.labels).sort(), englishKeys, definition.tag);
	assert.ok(definition.name);
	assert.ok(definition.nativeName);
	for (const key of englishKeys) {
		assert.ok(definition.labels[key].trim(), `${definition.tag}.${key}`);
		assert.deepEqual(
			placeholders(definition.labels[key]),
			placeholders(englishLabels[key]),
			`${definition.tag}.${key}`,
		);
	}

	const resolved = resolveLocale(definition.tag);
	assert.equal(resolved.lang, definition.tag);
	assert.equal(resolved.language, definition.language);
	assert.equal(resolved.script, definition.script);
	assert.equal(resolved.labels, definition.labels);
	assert.equal(Boolean(resolved.pagefindTranslations), pagefindTranslationTags.includes(definition.tag));
	assert.doesNotThrow(() => new Intl.DateTimeFormat(resolved.formattingLocale).format(new Date('2026-09-11T12:00:00Z')));
}

for (const [configured, expectedLanguage, expectedScript] of [
	['en-GB', 'en', 'Latn'],
	['es-MX', 'es', 'Latn'],
	['pt-BR', 'pt', 'Latn'],
	['el-GR', 'el', 'Grek'],
	['uk-UA', 'uk', 'Cyrl'],
	['az-Latn-AZ', 'az', 'Latn'],
	['sr-Cyrl-RS', 'sr', 'Cyrl'],
	['sr-Latn-RS', 'sr', 'Latn'],
	['cnr-ME', 'cnr', 'Latn'],
]) {
	const resolved = resolveLocale(configured);
	assert.equal(resolved.lang, configured);
	assert.equal(resolved.language, expectedLanguage);
	assert.equal(resolved.script, expectedScript);
}

assert.equal(resolveLocale('PT-br').lang, 'pt-BR');
assert.equal(resolveLocale('sr-cyrl-rs').lang, 'sr-Cyrl-RS');
assert.equal(resolveLocale().lang, 'en');

assert.throws(
	() => resolveLocale('sr'),
	/language "sr" must identify a supported script\. Use one of: sr-Cyrl, sr-Latn\./,
);
assert.throws(
	() => resolveLocale('az'),
	/language "az" must identify a supported script\. Use one of: az-Latn\./,
);
assert.throws(
	() => resolveLocale('sr-Arab'),
	/language "sr-Arab" uses an unsupported script\. Use one of: sr-Cyrl, sr-Latn\./,
);
assert.throws(
	() => resolveLocale('ar', 'custom/config.yaml'),
	/language "ar" has no built-in Norna UI text[\s\S]*Supported languages:[\s\S]*en[\s\S]*uk/,
);
assert.throws(
	() => resolveLocale('not_a_tag'),
	/language must be a valid BCP 47 language tag/,
);

console.log('Locale registry tests passed.');
