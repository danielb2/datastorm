THRESHOLD=90
TIMEOUT=90000
FLAGS="-v"

test:
	@node node_modules/.bin/lab -m ${TIMEOUT} ${FLAGS}
test-json:
	@node node_modules/.bin/lab -m ${TIMEOUT} -r json -o results.json ${FLAGS}
test-cov:
	@node node_modules/.bin/lab -t ${THRESHOLD} -m ${TIMEOUT} ${FLAGS}
test-cov-mock:
	@MOCK=true node node_modules/.bin/lab -t ${THRESHOLD} -m ${TIMEOUT} ${FLAGS}
test-cov-html:
	@node node_modules/.bin/lab -r html -o coverage.html -m ${TIMEOUT}


install:
	@npm install

clean:
	@rm -rf node_modules

reinstall: clean install

.PHONY: test test-json test-cov test-cov-mock test-cov-html test-unit test-json-unit test-cov-html-unit test-integration test-integration-mock test-json-integration test-cov-html-integration
