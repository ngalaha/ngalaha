/**
 * Every piece of text the interface shows, in the three languages.
 *
 * French is the reference: EN and ES are typed as Record<keyof typeof FR,
 * string>, so adding a key to FR without translating it fails the typecheck
 * rather than showing up on a phone as a raw key.
 *
 * Keys read screen.thing. Diagnostics log lines are deliberately absent: they
 * are a technical record meant to be compared between phones, not interface.
 */

const FR = {
  // -- Shared ---------------------------------------------------------------
  'common.cancel': 'Annuler',
  'common.save': 'Enregistrer',
  'common.delete': 'Supprimer',
  'common.close': 'Fermer',
  'common.back': 'Retour',
  'common.retry': 'Réessayer',
  'common.ok': 'OK',
  'common.yes': 'Oui',
  'common.no': 'Non',
  'common.loading': 'Chargement…',
  'common.error': 'Erreur',

  // -- Settings -------------------------------------------------------------
  'settings.section.language': 'LANGUE',
  'settings.language.label': "Langue de l'application",
  'settings.language.hint':
    "Le changement est immédiat et ne concerne que ce téléphone. Les noms des bâtiments et des logements restent tels qu'ils ont été saisis.",
  'settings.section.appearance': 'APPARENCE',
  'settings.theme.label': "Fond de l'application",
  'settings.theme.light': 'Clair',
  'settings.theme.dark': 'Sombre',
  'settings.theme.system': 'Système',
  'settings.theme.hint':
    '« Système » suit le réglage du téléphone. Le fond clair reste conseillé en plein soleil.',
  'settings.section.capture': 'PRISE DE VUE',
  'settings.quality.label': 'Qualité des photos',
  'settings.quality.high': 'Haute',
  'settings.quality.high.detail': 'Plus de détail, fichiers plus lourds',
  'settings.quality.balanced': 'Équilibrée',
  'settings.quality.balanced.detail': 'Recommandé pour le chantier',
  'settings.quality.light': 'Légère',
  'settings.quality.light.detail': 'Fichiers légers, forfait limité',
  'settings.video.label': 'Durée maximale des vidéos',
  'settings.duration.minutes': '{count} min',
  'settings.duration.seconds': '{count} s',
  'settings.section.upload': 'ENVOI',
  'settings.wifiOnly.label': 'Envoyer uniquement en Wi-Fi',
  'settings.wifiOnly.detail':
    "Les photos attendent le Wi-Fi au lieu de consommer les données mobiles. Rien n'est perdu : la file part toute seule.",
  'settings.keepLocal.label': 'Conserver une copie sur le téléphone',
  'settings.keepLocal.detail':
    "Après l'envoi, la copie locale est gardée au lieu d'être supprimée. Utile pour vérifier, mais occupe la mémoire du téléphone.",
  'settings.footnote':
    "Ces réglages ne concernent que cet appareil. Ils ne sont pas partagés avec les autres téléphones de l'équipe.",
  // -- Navigation and menu --------------------------------------------------
  'nav.home': 'MA2D Photo',
  'nav.admin': 'Administration',
  'nav.newProject': 'Nouveau projet',
  'nav.newBuilding': 'Nouveau bâtiment',
  'nav.buildingFolder': 'Dossier OneDrive',
  'nav.apartments': 'Appartements',
  'nav.workspace': 'Espace partagé',
  'nav.settings': 'Paramètres',
  'nav.diagnostics': 'Diagnostic',
  'nav.about': 'À propos',
  'menu.title': 'Menu',

  // -- Sign-in and About ----------------------------------------------------
  'login.tagline': "Photos de chantier, classées automatiquement dans OneDrive.",
  'login.notConfigured': "Configuration Microsoft manquante. Voir docs/ENTRA_ID_SETUP.md pour renseigner MICROSOFT_CLIENT_ID.",
  'login.signIn': "Se connecter avec Microsoft",
  'login.credit': "Développé par Pierre NGALAHA",
  'about.tagline': "Gestion automatique des photos de chantier",
  'about.version': "Version {version}",
  'about.company.title': "À propos de MA2D Construction",
  'about.company.p1': "MA2D Construction est un entrepreneur général fondé en 2010, spécialisé dans les projets de développement immobilier résidentiel, commercial et industriel dans la région métropolitaine.",
  'about.company.p2': "Cette application permet aux équipes de chantier de photographier l'avancement des travaux et de les classer automatiquement dans OneDrive, par projet, bâtiment et appartement — sans manipulation manuelle sur le terrain.",
  'about.company.link': "Visiter le site de MA2D",
  'about.security.title': "Sécurité",
  'about.security.body': "Connexion via Microsoft Entra ID. Aucun mot de passe ni identifiant Microsoft n'est stocké dans l'application — uniquement une session sécurisée gérée par Microsoft.",
  'about.author.title': "Conception et développement",
  'about.author.role': "Adjoint de chantier — MA2D Construction",
  'about.author.body': "Application conçue et développée en interne pour répondre aux besoins réels des équipes de chantier de MA2D Construction.",

} as const;

const EN: Record<keyof typeof FR, string> = {
  'common.cancel': 'Cancel',
  'common.save': 'Save',
  'common.delete': 'Delete',
  'common.close': 'Close',
  'common.back': 'Back',
  'common.retry': 'Try again',
  'common.ok': 'OK',
  'common.yes': 'Yes',
  'common.no': 'No',
  'common.loading': 'Loading…',
  'common.error': 'Error',

  'settings.section.language': 'LANGUAGE',
  'settings.language.label': 'App language',
  'settings.language.hint':
    'The change is immediate and applies to this phone only. Building and unit names stay exactly as they were entered.',
  'settings.section.appearance': 'APPEARANCE',
  'settings.theme.label': 'App background',
  'settings.theme.light': 'Light',
  'settings.theme.dark': 'Dark',
  'settings.theme.system': 'System',
  'settings.theme.hint':
    '"System" follows the phone setting. The light background stays the better choice in direct sunlight.',
  'settings.section.capture': 'CAPTURE',
  'settings.quality.label': 'Photo quality',
  'settings.quality.high': 'High',
  'settings.quality.high.detail': 'More detail, larger files',
  'settings.quality.balanced': 'Balanced',
  'settings.quality.balanced.detail': 'Recommended on site',
  'settings.quality.light': 'Light',
  'settings.quality.light.detail': 'Small files, limited data plan',
  'settings.video.label': 'Maximum video length',
  'settings.duration.minutes': '{count} min',
  'settings.duration.seconds': '{count} s',
  'settings.section.upload': 'UPLOAD',
  'settings.wifiOnly.label': 'Upload over Wi-Fi only',
  'settings.wifiOnly.detail':
    'Photos wait for Wi-Fi instead of using mobile data. Nothing is lost: the queue goes out on its own.',
  'settings.keepLocal.label': 'Keep a copy on the phone',
  'settings.keepLocal.detail':
    'After upload the local copy is kept instead of deleted. Handy for checking, but it uses phone storage.',
  'settings.footnote':
    "These settings apply to this device only. They are not shared with the team's other phones.",

  'nav.home': 'MA2D Photo',
  'nav.admin': 'Administration',
  'nav.newProject': 'New project',
  'nav.newBuilding': 'New building',
  'nav.buildingFolder': 'OneDrive folder',
  'nav.apartments': 'Apartments',
  'nav.workspace': 'Shared workspace',
  'nav.settings': 'Settings',
  'nav.diagnostics': 'Diagnostics',
  'nav.about': 'About',
  'menu.title': 'Menu',


  'login.tagline': "Site photos, filed automatically into OneDrive.",
  'login.notConfigured': "Microsoft configuration missing. See docs/ENTRA_ID_SETUP.md to set MICROSOFT_CLIENT_ID.",
  'login.signIn': "Sign in with Microsoft",
  'login.credit': "Developed by Pierre NGALAHA",
  'about.tagline': "Automatic handling of site photos",
  'about.version': "Version {version}",
  'about.company.title': "About MA2D Construction",
  'about.company.p1': "MA2D Construction is a general contractor founded in 2010, specialising in residential, commercial and industrial real-estate development projects across the metropolitan area.",
  'about.company.p2': "This app lets site crews photograph progress and have the pictures filed into OneDrive automatically, by project, building and apartment — with nothing to sort by hand on site.",
  'about.company.link': "Visit the MA2D website",
  'about.security.title': "Security",
  'about.security.body': "Sign-in goes through Microsoft Entra ID. No Microsoft password or credential is stored in the app — only a secure session managed by Microsoft.",
  'about.author.title': "Design and development",
  'about.author.role': "Site assistant — MA2D Construction",
  'about.author.body': "Designed and built in-house to answer the real needs of MA2D Construction's site crews.",

};

const ES: Record<keyof typeof FR, string> = {
  'common.cancel': 'Cancelar',
  'common.save': 'Guardar',
  'common.delete': 'Eliminar',
  'common.close': 'Cerrar',
  'common.back': 'Atrás',
  'common.retry': 'Reintentar',
  'common.ok': 'OK',
  'common.yes': 'Sí',
  'common.no': 'No',
  'common.loading': 'Cargando…',
  'common.error': 'Error',

  'settings.section.language': 'IDIOMA',
  'settings.language.label': 'Idioma de la aplicación',
  'settings.language.hint':
    'El cambio es inmediato y solo afecta a este teléfono. Los nombres de los edificios y de las viviendas se mantienen tal como se escribieron.',
  'settings.section.appearance': 'APARIENCIA',
  'settings.theme.label': 'Fondo de la aplicación',
  'settings.theme.light': 'Claro',
  'settings.theme.dark': 'Oscuro',
  'settings.theme.system': 'Sistema',
  'settings.theme.hint':
    '«Sistema» sigue el ajuste del teléfono. El fondo claro sigue siendo el aconsejable a pleno sol.',
  'settings.section.capture': 'CAPTURA',
  'settings.quality.label': 'Calidad de las fotos',
  'settings.quality.high': 'Alta',
  'settings.quality.high.detail': 'Más detalle, archivos más pesados',
  'settings.quality.balanced': 'Equilibrada',
  'settings.quality.balanced.detail': 'Recomendada en obra',
  'settings.quality.light': 'Ligera',
  'settings.quality.light.detail': 'Archivos ligeros, plan de datos limitado',
  'settings.video.label': 'Duración máxima de los vídeos',
  'settings.duration.minutes': '{count} min',
  'settings.duration.seconds': '{count} s',
  'settings.section.upload': 'ENVÍO',
  'settings.wifiOnly.label': 'Enviar solo por Wi-Fi',
  'settings.wifiOnly.detail':
    'Las fotos esperan al Wi-Fi en lugar de gastar datos móviles. No se pierde nada: la cola sale sola.',
  'settings.keepLocal.label': 'Conservar una copia en el teléfono',
  'settings.keepLocal.detail':
    'Tras el envío se conserva la copia local en lugar de borrarla. Útil para comprobar, pero ocupa memoria del teléfono.',
  'settings.footnote':
    'Estos ajustes solo afectan a este dispositivo. No se comparten con los demás teléfonos del equipo.',

  'nav.home': 'MA2D Photo',
  'nav.admin': 'Administración',
  'nav.newProject': 'Nuevo proyecto',
  'nav.newBuilding': 'Nuevo edificio',
  'nav.buildingFolder': 'Carpeta de OneDrive',
  'nav.apartments': 'Viviendas',
  'nav.workspace': 'Espacio compartido',
  'nav.settings': 'Ajustes',
  'nav.diagnostics': 'Diagnóstico',
  'nav.about': 'Acerca de',
  'menu.title': 'Menú',


  'login.tagline': "Fotos de obra, archivadas automáticamente en OneDrive.",
  'login.notConfigured': "Falta la configuración de Microsoft. Consulte docs/ENTRA_ID_SETUP.md para indicar MICROSOFT_CLIENT_ID.",
  'login.signIn': "Iniciar sesión con Microsoft",
  'login.credit': "Desarrollado por Pierre NGALAHA",
  'about.tagline': "Gestión automática de las fotos de obra",
  'about.version': "Versión {version}",
  'about.company.title': "Acerca de MA2D Construction",
  'about.company.p1': "MA2D Construction es un contratista general fundado en 2010, especializado en proyectos de desarrollo inmobiliario residencial, comercial e industrial en el área metropolitana.",
  'about.company.p2': "Esta aplicación permite a los equipos de obra fotografiar el avance y archivar las imágenes automáticamente en OneDrive, por proyecto, edificio y vivienda, sin ninguna manipulación manual sobre el terreno.",
  'about.company.link': "Visitar el sitio de MA2D",
  'about.security.title': "Seguridad",
  'about.security.body': "El inicio de sesión se realiza mediante Microsoft Entra ID. La aplicación no almacena ninguna contraseña ni credencial de Microsoft, solo una sesión segura gestionada por Microsoft.",
  'about.author.title': "Diseño y desarrollo",
  'about.author.role': "Auxiliar de obra — MA2D Construction",
  'about.author.body': "Aplicación diseñada y desarrollada internamente para responder a las necesidades reales de los equipos de obra de MA2D Construction.",

};

export const TRANSLATIONS = { fr: FR, en: EN, es: ES };
