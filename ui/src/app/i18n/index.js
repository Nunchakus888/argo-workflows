import i18n from 'i18next';
import Backend from 'i18next-http-backend';
import {initReactI18next} from 'react-i18next';
import resourcesToBackend from 'i18next-resources-to-backend';

i18n.use(Backend)
    .use(initReactI18next)
    .use(resourcesToBackend((language, namespace) => import(`./zh/translation.json`)))
    .init({
        lng: 'zh',
        fallbackLng: 'en',
        debug: false
    });

export default i18n;
