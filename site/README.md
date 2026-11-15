# Site Génie Civil Pro

Site vitrine de vente des livres de Pierre Ngalaha (RDM et béton armé).
Pur HTML/CSS/JS, sans outil de build : on peut l'héberger tel quel (GitHub Pages, Netlify, Vercel, OVH…).

- `index.html` : le contenu (textes, prix, liens d'achat)
- `styles.css` : le graphisme
- `app.js` : les animations et la poutre interactive (calcul réel des réactions, de la déformée et du moment)

## Modifier un prix ou un lien d'achat
Dans `index.html`, cherchez `prd_xlqjp915` (Tome 1) ou `prd_mxqf02ox` (Tome 2).
Le paiement (carte et Mobile Money) se fait sur la boutique Chariow.

## Ajouter un livre
Copiez un bloc `<article class="book-card reveal">` dans la section `#livres` et changez le texte, l'image et le lien.

## Voir le site en local
Ouvrez `index.html` dans un navigateur.
