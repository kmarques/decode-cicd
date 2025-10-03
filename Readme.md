# decode-cicd

Ce dépôt contient un exemple d'application Node.js simple et sert de support pour expliquer les concepts de CI/CD et un workflow GitHub Actions.

## Qu'est-ce que la CI/CD ?

CI/CD signifie Intégration Continue (Continuous Integration) et Livraison/Déploiement Continu (Continuous Delivery/Continuous Deployment).

- Integration continue (CI) : automatiser la validation du code (tests, lint, builds) à chaque modification (push, PR). L'objectif est détecter rapidement les régressions.
- Livraison/Déploiement continu (CD) : automatiser la préparation et le déploiement du code vers des environnements (staging, production). "Delivery" prépare et valide les artefacts, "Deployment" les publie automatiquement selon la stratégie choisie.

Avantages principaux : feedback rapide, moins de régressions, déploiements plus fiables et processus reproductible.

## Principaux composants d'un pipeline CI

- Triggers : événements qui lancent le pipeline (push, pull_request, tag, schedule).
- Jobs : unités de travail exécutées sur des runners (ex : lint, test, build, publish).
- Steps : commandes ou actions au sein d'un job.
- Runners : machines (GitHub-hosted ou self-hosted) qui exécutent les jobs.
- Cache/artifacts : mécanismes pour accélérer les builds et conserver des sorties utiles (logs, rapports, binaires).

## GitHub Actions — concept rapide

GitHub Actions permet de définir des workflows (fichiers YAML) déclenchés par des événements GitHub. Un workflow contient un ou plusieurs jobs, qui eux-mêmes contiennent des steps. On peut définir des matrices pour tester plusieurs versions (par ex. Node.js 18/20), utiliser des caches, stocker des artefacts et sécuriser des secrets.

Une Github Action est une tâche réutilisable (ex : `actions/checkout`, `actions/setup-node`) développée par la communauté ou par GitHub retrouvable sur la Marketplace.

### Bonnes pratiques vues en cours

- Utiliser un nom de workflow explicite (ex : CI).
- Lancer les validations sur `push` et `pull_request` pour les branches principales.
- Utiliser `actions/checkout` pour préparer l'environnement.
- Mettre en cache les dossiers de packages (ex : `~/.npm` ou `node_modules` ou `vendor`).
- Séparer les étapes lint/test/build en jobs ou steps distincts.
- Exporter les artefacts (logs, coverage) pour faciliter le debugging.

## Exemple de workflow GitHub Actions (CI)

Placez ce fichier dans `.github/workflows/ci.yml`. Il illustre un pipeline typique pour un projet Node.js : checkout, setup Node, cache, install, lint, test.

```yaml
name: CI

on:
	push:
		branches: [ main ]
	pull_request:
		branches: [ main ]

jobs:
	build:
		name: Build and test
		runs-on: ubuntu-latest

		steps:
			- name: Checkout repository
				uses: actions/checkout@v4

			- name: Use Node.js ${{ matrix.node-version }}
				uses: actions/setup-node@v4
				with:
					node-version: ${{ matrix.node-version }}
					cache: 'npm'

			- name: Install dependencies
				run: |
					npm ci

			- name: Run linter
				run: |
					npm run lint

			- name: Run tests
				run: |
					npm test

			# Exemple : produire et uploader un artefact (coverage, rapports)
			- name: Upload test results (optional)
				if: always()
				uses: actions/upload-artifact@v4
				with:
					name: test-results
					path: |
						./test-results || ./coverage || ./reports || ./test

# Notes:
# - `npm ci` est recommandé en CI : installe proprement à partir du package-lock.json.
# - Si votre projet n'a pas encore de tests, le job échouera sur `npm test`. Adaptez la commande ou ajoutez des tests.
# - Ajustez les branches et la matrice selon vos besoins (par ex. exécuter seulement sur `main` pour les déploiements).
```

## Comment l'intégrer dans ce dépôt

1. Créez le dossier `.github/workflows/` à la racine si nécessaire.
2. Copiez le contenu YAML ci-dessus dans `.github/workflows/ci.yml`.
3. Poussez sur une branche et ouvrez une Pull Request pour voir le workflow s'exécuter.

## Astuces supplémentaires


## Dépendances entre jobs

Dans GitHub Actions, les jobs s'exécutent par défaut en parallèle. Pour ordonner l'exécution et partager des résultats entre jobs, on utilise plusieurs mécanismes :

- `needs`: permet à un job d'attendre la fin d'un ou plusieurs jobs précédents et d'accéder à leurs outputs. Syntaxe : `needs: [jobA, jobB]`.
- Outputs de job : un job peut définir des `outputs` via `echo "::set-output name=foo::value"` (remplacé par les outputs via steps) ou mieux, définir `outputs` au niveau du job en utilisant la valeur d'un step. Exemple moderne :

```yaml
jobs:
	build:
		runs-on: ubuntu-latest
		outputs:
			build-id: ${{ steps.get-id.outputs.build_id }}
		steps:
			- id: get-id
				run: echo "::set-output name=build_id::12345"

	deploy:
		needs: [build]
		runs-on: ubuntu-latest
		steps:
			- name: Use build id
				run: echo "Build id from build job = ${{ needs.build.outputs.build-id }}"
```

- Partager des artefacts : pour transmettre des fichiers (paquet, rapport, coverage) entre jobs, utilisez `actions/upload-artifact` dans le job producteur, puis `actions/download-artifact` dans le job consommateur.

```yaml
jobs:
	test:
		runs-on: ubuntu-latest
		steps:
			- run: npm test -- --output=report.xml
			- uses: actions/upload-artifact@v4
				with:
					name: test-report
					path: report.xml

	analyze:
		needs: [test]
		runs-on: ubuntu-latest
		steps:
			- uses: actions/download-artifact@v4
				with:
					name: test-report
			- run: cat report.xml
```

- Conditions d'exécution (`if`) : un job (ou une step) peut être conditionné par l'état des jobs précédents ou par une expression. Exemples :
	- exécuter seulement si le job précédent a réussi : `if: success()` (par défaut pour un `needs`).
	- exécuter même si le précédent a échoué : `if: always()` (utile pour nettoyage ou upload d'artefacts).
	- utiliser une condition basée sur la sortie d'un job : `if: needs.build.outputs.build-id == '12345'`.

- Gestion des erreurs et `continue-on-error` : vous pouvez autoriser un step à échouer sans faire échouer tout le job via `continue-on-error: true`. Pour un job entier, vous devez gérer les dépendances et conditions avec `if` et `needs`.

Points pratiques et bonnes pratiques :

- Favorisez les outputs et les artefacts pour transporter les informations nécessaires (id de build, rapports, binaire) entre jobs.
- N'abusez pas de `needs` en cascade inutile : gardez des graphes lisibles. Utilisez des jobs indépendants quand possible pour accélérer les pipelines.
- Pour les secrets ou clés, ne les transmettez jamais via outputs ou artefacts en clair : utilisez `secrets.*` ou stockez-les dans un gestionnaire externe.
- Documentez les relations entre jobs dans le README (comme ici) pour que l'équipe comprenne la logique du pipeline.

---

Si vous voulez, je peux aussi ajouter directement le fichier workflow dans le repo (option recommandée). Dites-moi si vous voulez que je le crée maintenant.
