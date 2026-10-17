import { Locale } from './config';

export function translate(
  messages: Record<string, string>,
  key: string,
  params?: Record<string, string | number>
): string {
  let template = messages[key];
  if (template === undefined) {
    return key;
  }

  if (!params) {
    return template;
  }

  for (const [paramKey, paramVal] of Object.entries(params)) {
    template = template.replaceAll(`{${paramKey}}`, String(paramVal));
  }

  return template;
}

export function translatePlural(
  messages: Record<string, string>,
  locale: Locale,
  key: string,
  count: number,
  params?: Record<string, string | number>
): string {
  const pr = new Intl.PluralRules(locale);
  const rule = pr.select(count);

  const specificKey = `${key}.${rule}`;
  const otherKey = `${key}.other`;

  const mergedParams = { count, ...(params || {}) };

  if (messages[specificKey] !== undefined) {
    return translate(messages, specificKey, mergedParams);
  }

  if (messages[otherKey] !== undefined) {
    return translate(messages, otherKey, mergedParams);
  }

  return translate(messages, key, mergedParams);
}
