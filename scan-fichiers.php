<?php
header('Content-Type: application/json');
$dossier = 'exercices/';
$fichiers = [];

if (is_dir($dossier)) {
    $scan = scandir($dossier);
    foreach ($scan as $fichier) {
        if ($fichier != '.' && $fichier != '..') {
            $chemin = $dossier . $fichier;
            $fichiers[] = [
                'nom' => $fichier,
                'taille' => filesize($chemin),
                'date' => filemtime($chemin)
            ];
        }
    }
}

echo json_encode($fichiers);
?>