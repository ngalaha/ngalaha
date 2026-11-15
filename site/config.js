/* =====================================================================
   RÉGLAGES DU SITE — le seul fichier à modifier au quotidien.
   Laisser "" (vide) cache automatiquement l'élément sur le site.
   ===================================================================== */
window.SITE = {

  /* Adresse email qui reçoit les messages du formulaire « Nous contacter ».
     Au premier message, FormSubmit envoie un email de confirmation à cette
     adresse : il suffit de cliquer une fois sur le lien pour l'activer. */
  email: "np.ngalaha@gmail.com",


  /* Numéro WhatsApp (chiffres seulement, avec l'indicatif du pays). */
  whatsapp: "15817811987",

  /* Réseaux sociaux : coller l'adresse complète de chaque page. */
  socials: {
    facebook:  "https://www.facebook.com/share/1TTpaNo5F3/",
    youtube:   "https://www.youtube.com/channel/UC7PMl8XA_weEr8ogXugtCUw",
    tiktok:    "https://www.tiktok.com/@np.construction_officiel",
    instagram: "https://www.instagram.com/quebec_construction/",
    threads:   "https://www.threads.net/@quebec_construction",
    linkedin:  "https://www.linkedin.com/in/pierre-ngalaha-421797405",
    pinterest: "https://www.pinterest.com/pierrengalaha/",
    telegram:  "",
    x:         "",
  },

  /* Vidéos : une ligne par vidéo, liens YouTube ou Facebook.
     Catégories proposées : "Épreuves corrigées", "Cours de RDM",
     "Béton armé", "Chantier" (ou toute autre, elle apparaîtra comme filtre).
     Exemple :
     { titre: "Épreuve RDM 2024 — corrigé complet", categorie: "Épreuves corrigées",
       lien: "https://www.youtube.com/watch?v=XXXXXXXXXXX", duree: "18:42" },
  */
  videos: [
    // Épreuves corrigées
    { titre: "Poteau P5 : charge permanente G — épreuve RDM-BA licence pro 2024", categorie: "Épreuves corrigées", lien: "https://www.youtube.com/watch?v=3gfW-7CD29c" },
    { titre: "Charge Q et effort Pu du poteau — épreuve RDM-BA licence pro 2024", categorie: "Épreuves corrigées", lien: "https://www.youtube.com/watch?v=QynV46Qpvrw" },
    { titre: "Ferraillage d'un poteau sous 120 kN — épreuve RDM-BA licence pro 2024", categorie: "Épreuves corrigées", lien: "https://www.youtube.com/watch?v=qBVN_8x3HqY" },
    { titre: "Semelle isolée sous un poteau — épreuve RDM-BA licence pro 2024", categorie: "Épreuves corrigées", lien: "https://www.youtube.com/watch?v=qUgyK6QVxO4" },
    { titre: "File de poutres, diagrammes et ferraillage — épreuve RDM-BA licence pro 2024", categorie: "Épreuves corrigées", lien: "https://www.youtube.com/watch?v=xJmnCRQlDHI" },
    { titre: "Exercice de RDM corrigé : où est le moment maximal ? (statique, T et M)", categorie: "Épreuves corrigées", lien: "https://www.youtube.com/watch?v=32sXqu71avE" },
    { titre: "Treillis : 3 barres en une seule coupe (méthode de Ritter) — exercice corrigé", categorie: "Épreuves corrigées", lien: "https://www.youtube.com/watch?v=CrBt8ldq6tA" },
    // Cours de RDM
    { titre: "Cours 1 : les charges et leur conversion en charge concentrée", categorie: "Cours de RDM", lien: "https://www.youtube.com/watch?v=Sxf5sM54xlk" },
    { titre: "Cours 2 : réactions d'appui, la méthode des 3 équations", categorie: "Cours de RDM", lien: "https://www.youtube.com/watch?v=ax98JvHsbS8" },
    { titre: "Cours 3 : les efforts internes N, T, M — où se fissure une poutre ?", categorie: "Cours de RDM", lien: "https://www.youtube.com/watch?v=9GeLu1VhPnQ" },
    { titre: "Cours 4 : le formulaire rapide de T(x) et M(x)", categorie: "Cours de RDM", lien: "https://www.youtube.com/watch?v=aUsqLQZyETA" },
    { titre: "Cours 5 : où est le centre de gravité ? (formule + 2 exercices)", categorie: "Cours de RDM", lien: "https://www.youtube.com/watch?v=iwL26fqn1GA" },
    { titre: "Planche à plat ou sur chant : le moment d'inertie expliqué", categorie: "Cours de RDM", lien: "https://www.youtube.com/watch?v=00HgTP2vEkE" },
    { titre: "Cours 7 : la flexion expliquée simplement", categorie: "Cours de RDM", lien: "https://www.youtube.com/watch?v=reOy9derSqQ" },
    { titre: "Cours 8 : traction, compression et loi de Hooke", categorie: "Cours de RDM", lien: "https://www.youtube.com/watch?v=Tq0kyL3FrR4" },
    // Béton armé
    { titre: "Poutre en béton armé de 5 m : combien de barres d'acier ? Calcul complet", categorie: "Béton armé", lien: "https://www.youtube.com/watch?v=Rld_bCOsEVg" },
    { titre: "Dimensionnement d'une semelle isolée : le calcul complet", categorie: "Béton armé", lien: "https://www.youtube.com/watch?v=dlT544rco7I" },
    { titre: "Descente de charges : quelle zone porte ce poteau ? Exemple complet", categorie: "Béton armé", lien: "https://www.youtube.com/watch?v=h6wijNNmm0o" },
    { titre: "Peut-on poser ce mur sur cette dalle ? Le calcul complet", categorie: "Béton armé", lien: "https://www.youtube.com/watch?v=oih4i3Y_XL4" },
    { titre: "Calcul d'un escalier en béton armé : la méthode complète", categorie: "Béton armé", lien: "https://www.youtube.com/watch?v=q2UKvMuo1Hw" },
    { titre: "Ferraillage d'un nœud poteau-poutre : l'ancrage expliqué", categorie: "Béton armé", lien: "https://www.youtube.com/watch?v=jbm-nIKkuVk" },
    { titre: "15M ou Ø16 ? Même section, pas la même résistance (CSA vs Eurocode)", categorie: "Béton armé", lien: "https://www.youtube.com/watch?v=22Kz9RgcVBM" },
  ],
};
