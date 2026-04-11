import i18n from 'i18next';
import type { Resource } from 'i18next';
import { initReactI18next } from 'react-i18next';
import csAppShell from './locales/cs/appShell.json';
import enAppShell from './locales/en/appShell.json';
import csHomePage from './locales/cs/homePage.json';
import enHomePage from './locales/en/homePage.json';
import csDocumentPage from './locales/cs/documentPage.json';
import enDocumentPage from './locales/en/documentPage.json';
import csAudioRecorderPage from './locales/cs/audioRecorderPage.json';
import enAudioRecorderPage from './locales/en/audioRecorderPage.json';
import csSlideshowRecorderPage from './locales/cs/slideshowRecorderPage.json';
import enSlideshowRecorderPage from './locales/en/slideshowRecorderPage.json';
import csVideoRecorderPage from './locales/cs/videoRecorderPage.json';
import enVideoRecorderPage from './locales/en/videoRecorderPage.json';
import csArticlesPage from './locales/cs/articlesPage.json';
import enArticlesPage from './locales/en/articlesPage.json';
import csExamplesPage from './locales/cs/examplesPage.json';
import enExamplesPage from './locales/en/examplesPage.json';
import csPlaceholderPages from './locales/cs/placeholderPages.json';
import enPlaceholderPages from './locales/en/placeholderPages.json';
import csArticleBlocks from './locales/cs/articleBlocks.json';
import enArticleBlocks from './locales/en/articleBlocks.json';
import csFilePicker from './locales/cs/filePicker.json';
import enFilePicker from './locales/en/filePicker.json';
import csThemeToggle from './locales/cs/themeToggle.json';
import enThemeToggle from './locales/en/themeToggle.json';
import { detectLanguage, normalizeLanguage } from './utils/language';

const resources = {
  cs: {
    appShell: csAppShell,
    homePage: csHomePage,
    documentPage: csDocumentPage,
    audioRecorderPage: csAudioRecorderPage,
    slideshowRecorderPage: csSlideshowRecorderPage,
    videoRecorderPage: csVideoRecorderPage,
    articlesPage: csArticlesPage,
    examplesPage: csExamplesPage,
    placeholderPages: csPlaceholderPages,
    articleBlocks: csArticleBlocks,
    filePicker: csFilePicker,
    themeToggle: csThemeToggle,
  },
  en: {
    appShell: enAppShell,
    homePage: enHomePage,
    documentPage: enDocumentPage,
    audioRecorderPage: enAudioRecorderPage,
    slideshowRecorderPage: enSlideshowRecorderPage,
    videoRecorderPage: enVideoRecorderPage,
    articlesPage: enArticlesPage,
    examplesPage: enExamplesPage,
    placeholderPages: enPlaceholderPages,
    articleBlocks: enArticleBlocks,
    filePicker: enFilePicker,
    themeToggle: enThemeToggle,
  },
} as unknown as Resource;

i18n.use(initReactI18next).init({
  resources,
  lng: normalizeLanguage(detectLanguage()),
  fallbackLng: 'en',
  defaultNS: 'appShell',
  ns: ['appShell', 'homePage', 'documentPage', 'audioRecorderPage', 'slideshowRecorderPage', 'videoRecorderPage', 'articlesPage', 'examplesPage', 'placeholderPages', 'articleBlocks', 'filePicker', 'themeToggle'],
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

export default i18n;
