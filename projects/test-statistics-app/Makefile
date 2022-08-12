
rsync-demo:
	rsync -r -a -v -e ssh --delete ../../dist/test-statistics-app/ 10.0.0.120:/srv/statistics-demo/dist/

build-demo:
	ng build test-statistics-app --configuration=production