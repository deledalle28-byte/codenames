# Rétroplanning Expat 2025 → 2027

Frise interactive et autonome (un seul fichier HTML, aucune dépendance, fonctionne hors ligne)
issue de `Retroplanning_2026_EXPAT.pptx`. Tous les projets sont regroupés sur une frise unique
couvrant 2025, 2026 et 2027.

## Utilisation

1. Ouvrir `retroplanning_expat_2026.html` dans un navigateur (double-clic).
2. Naviguer : glisser la frise à la souris, **Ctrl + molette** ou boutons **− / +** pour zoomer,
   boutons **2025 / 2026 / 2027** et **Aujourd'hui** pour se déplacer.
3. Les pastilles de catégorie en haut filtrent l'affichage (clic pour masquer / réafficher).
4. Cliquer sur une carte (jalon) ou une barre (période) pour ouvrir le panneau de détail et modifier
   le nom, le type, les dates de début et de fin, la catégorie, le responsable, le statut, la couleur
   et la description. La frise se met à jour immédiatement.
5. **+ Ajouter** crée un nouveau projet ; **Supprimer** le retire.
6. **Enregistrer** (ou Ctrl + S) écrit directement dans le fichier : sur Chrome et Edge, une boîte de
   dialogue demande une seule fois de désigner le fichier à écraser (le fichier ouvert est proposé par
   défaut), puis les enregistrements suivants sont silencieux. **Enregistrer sous…** permet de choisir un
   autre fichier. Sur un navigateur sans cette possibilité (Firefox, Safari), un nouveau fichier
   `retroplanning_expat_AAAA-MM-JJ_HHhMM.html` est téléchargé.
7. Le titre et le sous-titre se modifient en cliquant dessus. **Catégories** ouvre le menu de gestion
   des catégories. Un jalon placé sur une nouvelle année fait apparaître cette année automatiquement.

Les données sont stockées dans le bloc `<script id="retro-data" type="application/json">` en tête du fichier.
