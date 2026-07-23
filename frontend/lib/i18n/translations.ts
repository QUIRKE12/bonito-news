// Site-wide translations: English (en), French (fr), Kirundi (rn)
// Covers: navbar, homepage, footer, and the admin dashboard shell.
export type LangKey =
  // Navbar
  | "home"
  | "politics"
  | "business"
  | "culture"
  | "sport"
  | "signIn"
  | "account"
  | "bookmarks"
  | "menu"
  | "closeMenu"
  | "tagline"
  // Homepage
  | "loadingFrontPage"
  | "backendErrorTitle"
  | "alsoToday"
  | "seeAll"
  | "exploreEverySection"
  | "breakingLabel"
  | "newsletterHeading"
  | "newsletterSub"
  | "newsletterSubscribed"
  | "newsletterError"
  | "newsletterSubscribe"
  | "newsletterSubscribing"
  | "newsletterFootnote"
  | "emailPlaceholder"
  // Footer
  | "footerTagline"
  | "footerSections"
  | "footerCompany"
  | "footerAccount"
  | "footerAbout"
  | "footerEthics"
  | "footerCareers"
  | "footerContact"
  | "footerCopyright"
  // Admin dashboard
  | "adminDashboard"
  | "adminArticles"
  | "adminMedia"
  | "adminModeration"
  | "adminCategories"
  | "adminAds"
  | "adminNewsletter"
  | "adminNotifications"
  | "adminAnalytics"
  | "adminAuditLog"
  | "adminSettings"
  | "adminUsersRoles"
  | "adminSignedInAs"
  | "adminSignOut"
  | "adminLoading"
  | "adminSignInRequiredTitle"
  | "adminSignInRequiredBody"
  | "adminGoToHomepage"
  | "adminNotAuthorizedTitle"
  | "adminNotAuthorizedBody";

export const translations: Record<"en" | "fr" | "rn", Record<LangKey, string>> = {
  en: {
    home: "Home",
    politics: "Politics",
    business: "Business",
    culture: "Culture",
    sport: "Sport",
    signIn: "Sign in",
    account: "Account",
    bookmarks: "Bookmarks",
    menu: "☰ Menu",
    closeMenu: "✕ Close",
    tagline: "Great Lakes region, in three voices",

    loadingFrontPage: "Loading the front page…",
    backendErrorTitle: "Couldn't reach the backend. Is it running?",
    alsoToday: "Also today",
    seeAll: "See all →",
    exploreEverySection: "Explore every section",
    breakingLabel: "Breaking",
    newsletterHeading: "Never miss the story",
    newsletterSub: "Get breaking news and a daily digest, in the language you choose.",
    newsletterSubscribed: "You're subscribed — check your inbox.",
    newsletterError: "Something went wrong — try again.",
    newsletterSubscribe: "Subscribe",
    newsletterSubscribing: "…",
    newsletterFootnote: "EN · FR · KI — switch anytime in profile settings",
    emailPlaceholder: "you@example.com",

    footerTagline: "Independent news for the Great Lakes region, reported in English, French, and Kirundi.",
    footerSections: "Sections",
    footerCompany: "Company",
    footerAccount: "Account",
    footerAbout: "About",
    footerEthics: "Newsroom ethics",
    footerCareers: "Careers",
    footerContact: "Contact",
    footerCopyright: "Amakuru.",

    adminDashboard: "Admin dashboard",
    adminArticles: "Articles",
    adminMedia: "Media Library",
    adminModeration: "Comment Moderation",
    adminCategories: "Categories & Tags",
    adminAds: "Advertisements",
    adminNewsletter: "Newsletter",
    adminNotifications: "Notifications",
    adminAnalytics: "Analytics",
    adminAuditLog: "Audit Log",
    adminSettings: "Site Settings",
    adminUsersRoles: "Users & Roles",
    adminSignedInAs: "Signed in as",
    adminSignOut: "Sign out",
    adminLoading: "Loading…",
    adminSignInRequiredTitle: "Sign in required",
    adminSignInRequiredBody: "Sign in from the homepage first, then come back to the admin dashboard.",
    adminGoToHomepage: "Go to homepage",
    adminNotAuthorizedTitle: "Not authorized",
    adminNotAuthorizedBody: "doesn't have access to the admin dashboard. Ask an Admin to change your role.",
  },
  fr: {
    home: "Accueil",
    politics: "Politique",
    business: "Économie",
    culture: "Culture",
    sport: "Sport",
    signIn: "Se connecter",
    account: "Compte",
    bookmarks: "Favoris",
    menu: "☰ Menu",
    closeMenu: "✕ Fermer",
    tagline: "La région des Grands Lacs, en trois voix",

    loadingFrontPage: "Chargement de la une…",
    backendErrorTitle: "Impossible de joindre le serveur. Est-il actif ?",
    alsoToday: "Aussi aujourd'hui",
    seeAll: "Tout voir →",
    exploreEverySection: "Explorer toutes les rubriques",
    breakingLabel: "Urgent",
    newsletterHeading: "Ne manquez aucune actualité",
    newsletterSub: "Recevez les alertes et un résumé quotidien, dans la langue de votre choix.",
    newsletterSubscribed: "Vous êtes inscrit — vérifiez votre boîte mail.",
    newsletterError: "Une erreur est survenue — réessayez.",
    newsletterSubscribe: "S'abonner",
    newsletterSubscribing: "…",
    newsletterFootnote: "EN · FR · KI — changez à tout moment dans les paramètres",
    emailPlaceholder: "vous@exemple.com",

    footerTagline: "Actualités indépendantes pour la région des Grands Lacs, rapportées en anglais, français et kirundi.",
    footerSections: "Rubriques",
    footerCompany: "Entreprise",
    footerAccount: "Compte",
    footerAbout: "À propos",
    footerEthics: "Déontologie de la rédaction",
    footerCareers: "Carrières",
    footerContact: "Contact",
    footerCopyright: "Amakuru.",

    adminDashboard: "Tableau de bord admin",
    adminArticles: "Articles",
    adminMedia: "Médiathèque",
    adminModeration: "Modération des commentaires",
    adminCategories: "Catégories & étiquettes",
    adminAds: "Publicités",
    adminNewsletter: "Newsletter",
    adminNotifications: "Notifications",
    adminAnalytics: "Statistiques",
    adminAuditLog: "Journal d'audit",
    adminSettings: "Paramètres du site",
    adminUsersRoles: "Utilisateurs & rôles",
    adminSignedInAs: "Connecté en tant que",
    adminSignOut: "Se déconnecter",
    adminLoading: "Chargement…",
    adminSignInRequiredTitle: "Connexion requise",
    adminSignInRequiredBody: "Connectez-vous depuis l'accueil, puis revenez au tableau de bord admin.",
    adminGoToHomepage: "Retour à l'accueil",
    adminNotAuthorizedTitle: "Non autorisé",
    adminNotAuthorizedBody: "n'a pas accès au tableau de bord admin. Demandez à un administrateur de changer votre rôle.",
  },
  rn: {
    home: "Ahabanza",
    politics: "Politike",
    business: "Ubukungu",
    culture: "Umuco",
    sport: "Imikino",
    signIn: "Injira",
    account: "Konti",
    bookmarks: "Ivyabitswe",
    menu: "☰ Menyu",
    closeMenu: "✕ Funga",
    tagline: "Akarere k'ibiyaga bigari, mu ndimi zitatu",

    loadingFrontPage: "Turimo gupakira urupapuro rw'imbere…",
    backendErrorTitle: "Ntitwashoboye kwungana na seriveri. Yoba iriko irakora?",
    alsoToday: "Ibindi none",
    seeAll: "Reba vyose →",
    exploreEverySection: "Reba ibice vyose",
    breakingLabel: "Amakuru y'ihuta",
    newsletterHeading: "Ntuze wibagirwe inkuru",
    newsletterSub: "Ronka amakuru y'ihuta n'incamake ya buri musi, mu rurimi wahiswemo.",
    newsletterSubscribed: "Wiyandikishije — raba mu email yawe.",
    newsletterError: "Ikintu ntikagenze neza — ongera ugerageze.",
    newsletterSubscribe: "Iyandikishe",
    newsletterSubscribing: "…",
    newsletterFootnote: "EN · FR · KI — hindura igihe cose mu ngenga za konti yawe",
    emailPlaceholder: "wewe@akarorero.com",

    footerTagline: "Amakuru adafitanye isano n'ubuyobozi ku karere k'ibiyaga bigari, atangazwa mu Congereza, Igifaransa, n'Ikirundi.",
    footerSections: "Ibice",
    footerCompany: "Ikigo",
    footerAccount: "Konti",
    footerAbout: "Ibitwerekeye",
    footerEthics: "Imyitwarire y'abanyamakuru",
    footerCareers: "Akazi",
    footerContact: "Twandikire",
    footerCopyright: "Amakuru.",

    adminDashboard: "Ikibaho c'abakuru",
    adminArticles: "Inyandiko",
    adminMedia: "Ububiko bw'ibicishije",
    adminModeration: "Ugucungura ivyavuzwe",
    adminCategories: "Ibyiciro & Uduhinga",
    adminAds: "Amatangazo",
    adminNewsletter: "Newsletter",
    adminNotifications: "Ubumenyesha",
    adminAnalytics: "Isesengura",
    adminAuditLog: "Urutonde rw'ivyakozwe",
    adminSettings: "Igenamiterere ry'urubuga",
    adminUsersRoles: "Abakoresha & Inzego",
    adminSignedInAs: "Winjiye nka",
    adminSignOut: "Sohoka",
    adminLoading: "Turimo gupakira…",
    adminSignInRequiredTitle: "Kwinjira birakenewe",
    adminSignInRequiredBody: "Banza winjire uhereye ku rupapuro rw'ibanze, hanyuma usubire ku kibaho c'abakuru.",
    adminGoToHomepage: "Subira ku rupapuro rw'ibanze",
    adminNotAuthorizedTitle: "Ntabwo wemerewe",
    adminNotAuthorizedBody: "ntagira uburenganzira ku kibaho c'abakuru. Saba umukuru ahindure uruhare rwawe.",
  },
};
