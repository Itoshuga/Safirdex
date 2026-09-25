export type Locale = string;

export type Translations<T> = Record<Locale, T>;

export interface NameDescriptionTranslation {
  name: string;
  description?: string;
}

export interface RequiredNameDescriptionTranslation {
  name: string;
  description: string;
}
