#!/usr/bin/env python3
"""Fabrique la version hors ligne du site : un seul fichier HTML, autonome.

Reprend le CSS, les scripts, les tables de data/ et les images de assets/,
et les assemble dans hors-ligne/cyberpunk-new-dawn.html. Ce fichier s'ouvre
par un simple double-clic, sans serveur ni connexion — c'est la version à
emporter à la table de jeu.

    python build/build.py

Relancer après chaque modification du site.
"""
import base64
import json
import os
import re
import sys

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SORTIE = os.path.join(RACINE, 'hors-ligne', 'cyberpunk-new-dawn.html')

# L'ordre compte : core.js définit tout ce dont les autres se servent, app.js démarre.
JS = ['core.js', 'quiz.js', 'creation.js', 'sheet.js', 'feuille.js',
      'random.js', 'codex.js', 'accueil.js', 'app.js']

MIMES = {'.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
         '.svg': 'image/svg+xml', '.webp': 'image/webp'}


def lire(*bouts):
    with open(os.path.join(RACINE, *bouts), encoding='utf-8') as f:
        return f.read()


def data_uri(chemin):
    ext = os.path.splitext(chemin)[1].lower()
    mime = MIMES.get(ext)
    if not mime:
        sys.exit('Type d’image inconnu : ' + chemin)
    with open(chemin, 'rb') as f:
        brut = f.read()
    return 'data:%s;base64,%s' % (mime, base64.b64encode(brut).decode('ascii')), len(brut)


def main():
    # ---- CSS : les images deviennent des données incluses ----
    css = lire('css', 'style.css')
    poids_images = 0

    def remplace(m):
        nonlocal poids_images
        rel = m.group(1)
        chemin = os.path.normpath(os.path.join(RACINE, 'css', rel))
        if not os.path.exists(chemin):
            sys.exit('Image introuvable : ' + chemin)
        uri, n = data_uri(chemin)
        poids_images += n
        return 'url("%s")' % uri

    css = re.sub(r'url\("(\.\./assets/[^"]+)"\)', remplace, css)

    # La règle @import doit rester en tête du <style> : on l'extrait pour la remettre en premier.
    # Attention : l'adresse des polices contient des « ; », on découpe donc par ligne.
    IMPORT = re.compile(r'^[ \t]*@import[^\n]*\n?', re.M)
    imports = [m.group(0).strip() for m in IMPORT.finditer(css)]
    for imp in imports:
        if not imp.endswith(';'):
            sys.exit('Règle @import sur plusieurs lignes, non gérée : ' + imp[:60])
    corps_css = IMPORT.sub('', css)

    # ---- Tables du livre ----
    dossier_data = os.path.join(RACINE, 'data')
    noms = sorted(f[:-5] for f in os.listdir(dossier_data) if f.endswith('.json'))
    blocs = []
    for nom in noms:
        with open(os.path.join(dossier_data, nom + '.json'), encoding='utf-8') as f:
            obj = json.load(f)
        # JSON sûr dans un <script> : pas de </script> ni de séparateurs de ligne U+2028/9
        txt = (json.dumps(obj, ensure_ascii=False, separators=(',', ':'))
               .replace('</', '<\\/').replace('\u2028', '\\u2028').replace('\u2029', '\\u2029'))
        blocs.append('<script type="application/json" data-db="%s">%s</script>' % (nom, txt))

    # ---- Scripts ----
    morceaux = []
    for f in JS:
        morceaux.append('/* ==================== %s ==================== */\n%s' % (f, lire('js', f)))
    js = '\n\n'.join(morceaux)

    # ---- Favicon ----
    favicon, _ = data_uri(os.path.join(RACINE, 'assets', 'favicon.svg'))

    html = """<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#d9d9d9">
<title>Cyberpunk : New Dawn</title>
<meta name="description" content="Cyberpunk : New Dawn — questionnaire d'orientation, création de personnage assistée en neuf étapes, feuille interactive et intégralité des tables du livre. Version hors ligne, en un seul fichier.">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="New Dawn">
<meta name="mobile-web-app-capable" content="yes">
<link rel="icon" href="__FAVICON__">
<link rel="apple-touch-icon" href="__FAVICON__">
<style>
__IMPORTS__
__CSS__
</style>
</head>
<body data-mono="1">
<noscript><p style="font-family:sans-serif;padding:24px">Cette application a besoin de JavaScript pour fonctionner.</p></noscript>
__DATA__
<script>
__JS__
</script>
</body>
</html>
"""
    html = (html
            .replace('__FAVICON__', favicon)
            .replace('__IMPORTS__', '\n'.join(imports))
            .replace('__CSS__', corps_css)
            .replace('__DATA__', '\n'.join(blocs))
            .replace('__JS__', js))

    os.makedirs(os.path.dirname(SORTIE), exist_ok=True)
    with open(SORTIE, 'w', encoding='utf-8') as f:
        f.write(html)

    # ---- Garde-fous : le CSS et le JS assemblés doivent être valides ----
    style = html[html.index('<style>') + 7:html.index('</style>')]
    if style.count('{') != style.count('}'):
        sys.exit('CSS : accolades déséquilibrées (%d ouvrantes, %d fermantes)'
                 % (style.count('{'), style.count('}')))
    for imp in imports:
        if imp not in style[:400]:
            sys.exit('CSS : la règle @import n’est plus en tête du <style>')
    verif = os.path.join(RACINE, 'hors-ligne', '.verification.js')
    with open(verif, 'w', encoding='utf-8') as f:
        f.write(js)
    code = os.system('node --check "%s" 2> /dev/null' % verif)
    os.remove(verif)
    if code != 0:
        print('Note : node n’est pas installé ou le JS a une erreur de syntaxe — vérification ignorée.')

    print('Écrit : %s' % SORTIE)
    print('  %.0f Ko au total, dont %.0f Ko d’images et %d tables du livre.'
          % (len(html.encode('utf-8')) / 1024, poids_images * 1.34 / 1024, len(noms)))


if __name__ == '__main__':
    main()
