import settings from '../data/settings.json';
import gitesData from '../data/gites.json';
import prices from '../data/prices.json';
import { langs, defaultLang, type Lang } from '../i18n/ui';

export { settings, prices };
export const gites = gitesData.gites;
export type Gite = (typeof gites)[number];

const JIM = 'https://image.jimcdn.com/app/cms/image/transf';
const PATH = 'path/sb76bf8a295bc40bd';
/** Resolve an image reference: "jim:id/version" (current site's photos), an uploaded "/images/..." path, or a full URL. */
export function img(ref: string, w = 1600): string {
  if (!ref) return '';
  const m = ref.match(/^(jim|jimbg):([^/]+)\/(\d+)$/);
  if (!m) return ref;
  const kind = m[1] === 'jimbg' ? 'backgroundarea' : 'image';
  return `${JIM}/dimension=${w}x10000:format=jpg/${PATH}/${kind}/${m[2]}/version/${m[3]}/image.jpg`;
}

type MdModule = { frontmatter: Record<string, any>; Content: any; file: string };
const pageFiles = import.meta.glob<MdModule>('../content/pages/*/*.md', { eager: true });
const giteFiles = import.meta.glob<MdModule>('../content/gites/*/*.md', { eager: true });
const blogFiles = import.meta.glob<MdModule>('../content/blog/*/*.md', { eager: true });

function pick(files: Record<string, MdModule>, lang: Lang, slug: string): MdModule | undefined {
  const key = (l: string) => Object.keys(files).find((k) => k.endsWith(`/${l}/${slug}.md`));
  const k = key(lang) ?? key(defaultLang); // falls back to English if a translation is missing
  return k ? files[k] : undefined;
}
export const getPage = (lang: Lang, slug: string) => pick(pageFiles, lang, slug)!;
export const getGiteText = (lang: Lang, slug: string) => pick(giteFiles, lang, slug)!;

export const domainePages = ['about', 'location', 'area', 'things-to-do', 'themed-holidays'];

export function getPosts(lang: Lang) {
  const slugs = new Set(Object.keys(blogFiles).map((k) => k.split('/').pop()!.replace('.md', '')));
  return [...slugs]
    .map((slug) => ({ slug, ...pick(blogFiles, lang, slug)! }))
    .filter((p) => !p.frontmatter.draft)
    .sort((a, b) => +new Date(b.frontmatter.date) - +new Date(a.frontmatter.date));
}

export const langPaths = () => langs.map((lang) => ({ params: { lang } }));
export const url = (lang: Lang, path = '') => `/${lang}/${path ? path.replace(/^\/|\/$/g, '') + '/' : ''}`;
export const money = (n: number, locale: string) =>
  new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
export const youtubeId = (u: string) => u?.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/)?.[1];
