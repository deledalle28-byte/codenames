# Rétroplanning Expat 2026

Frise interactive et autonome (un seul fichier HTML, aucune dépendance) issue de `Retroplanning_2026_EXPAT.pptx`.

## Utilisation

1. Ouvrir `retroplanning_expat_2026.html` dans un navigateur (double-clic).
2. Deux onglets : **Rétroplanning 2026** et **Renouvellement 2027 – Gammes individuelles**.
3. Cliquer sur un projet (libellé, barre ou losange) pour ouvrir le panneau de détail et modifier
   le nom, le type (jalon / période), les dates de début et de fin, la catégorie, le responsable,
   le statut, la couleur et la description. La frise se met à jour immédiatement.
4. **+ Ajouter un projet** crée un nouveau projet dans la vue courante ; **Supprimer** le retire.
5. **Enregistrer et générer** télécharge un nouveau fichier `retroplanning_expat_AAAA-MM-JJ_HHhMM.html`
   contenant toutes les modifications. Ce fichier est lui-même éditable de la même façon.

Les données sont stockées dans le bloc `<script id="retro-data" type="application/json">` en tête du fichier.
