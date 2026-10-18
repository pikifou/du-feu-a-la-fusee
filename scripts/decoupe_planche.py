"""Découpe une planche de sprites sur fond blanc en PNG détourés.

Usage : python3 -I scripts/decoupe_planche.py <planche.png> <dossier_sortie> <nom1,nom2,...>

Les objets sont repérés par composantes connexes (fond blanc retiré),
triés en lignes puis colonnes, et nommés dans l'ordre de la liste.
L'alpha est progressif près du blanc pour garder des bords doux.
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage


def alpha_depuis_blanc(rgb: np.ndarray) -> np.ndarray:
    # distance au blanc : 0 = blanc pur ; rampe douce entre 12 et 60
    d = 255.0 - rgb.min(axis=2).astype(np.float32)
    a = np.clip((d - 12.0) / 48.0, 0.0, 1.0)
    return (a * 255).astype(np.uint8)


def decoupe(src: Path, out: Path, noms: list[str], marge: int = 12) -> None:
    im = Image.open(src).convert("RGB")
    rgb = np.asarray(im)
    alpha = alpha_depuis_blanc(rgb)

    masque = alpha > 40
    masque = ndimage.binary_dilation(masque, iterations=10)
    etiquettes, n = ndimage.label(masque)
    boites = ndimage.find_objects(etiquettes)
    tailles = ndimage.sum(np.ones_like(etiquettes), etiquettes, range(1, n + 1))
    seuil = max(tailles) * 0.02
    objets = [(b, i + 1) for i, (b, t) in enumerate(zip(boites, tailles)) if t >= seuil]

    # tri en lignes (centres verticaux proches) puis colonnes
    objets.sort(key=lambda o: (o[0][0].start + o[0][0].stop) / 2)
    lignes, courante = [], []
    for o in objets:
        cy = (o[0][0].start + o[0][0].stop) / 2
        if courante and cy - (courante[0][0][0].start + courante[0][0][0].stop) / 2 > rgb.shape[0] * 0.12:
            lignes.append(courante)
            courante = []
        courante.append(o)
    if courante:
        lignes.append(courante)
    ordonnes = [o for l in lignes for o in sorted(l, key=lambda o: o[0][1].start)]

    if len(ordonnes) != len(noms):
        print(f"ATTENTION {src.name} : {len(ordonnes)} objets trouvés pour {len(noms)} noms")

    out.mkdir(parents=True, exist_ok=True)
    # retire le liseré blanc : on "dé-mélange" la couleur du fond blanc
    a = alpha.astype(np.float32)[..., None] / 255.0
    propre = (rgb.astype(np.float32) - (1.0 - a) * 255.0) / np.maximum(a, 1e-3)
    propre = np.where(a > 0.02, np.clip(propre, 0, 255), 0).astype(np.uint8)
    rgba = np.dstack([propre, alpha])
    for (sl, lab), nom in zip(ordonnes, noms):
        y0 = max(sl[0].start - marge, 0)
        y1 = min(sl[0].stop + marge, rgb.shape[0])
        x0 = max(sl[1].start - marge, 0)
        x1 = min(sl[1].stop + marge, rgb.shape[1])
        bloc = rgba[y0:y1, x0:x1].copy()
        # on ne garde que l'objet courant (pas un bout de voisin)
        garde = etiquettes[y0:y1, x0:x1] == lab
        bloc[..., 3] = np.where(garde, bloc[..., 3], 0)
        Image.fromarray(bloc, "RGBA").save(out / f"{nom}.png")
        print(f"{nom}.png  {x1 - x0}x{y1 - y0}")


if __name__ == "__main__":
    decoupe(Path(sys.argv[1]), Path(sys.argv[2]), sys.argv[3].split(","))
