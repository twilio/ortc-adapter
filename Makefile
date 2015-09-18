NAME=$(shell sed -n 's/^  "name": "\([^"]*\)\",$$/\1/p' package.json)
VERSION=$(shell sed -n 's/^  "version": "\([^"]*\)\",$$/\1/p' package.json)
MAIN=$(shell sed -n 's/^  "main": "\([^"]*\)\",$$/\1/p' package.json)

DIST=dist

JS=$(DIST)/$(NAME).js
MIN_JS=$(JS:%.js=%.min.js)

DOCS=$(DIST)/docs

LIB=$(shell find lib -name \*.js)
SRC=src/$(NAME).js
SRC_BUNDLE=$(SRC:%.js=%-bundle.js)

all: .linted $(JS) $(MIN_JS) $(DOCS)

clean:
	rm -rf .linted $(DIST) $(SRC_BUNDLE)

# Dependencies

BROWSERIFY=node_modules/browserify/bin/cmd.js
ESLINT=node_modules/eslint/bin/eslint.js
JSDOC=node_modules/jsdoc/jsdoc.js
UGLIFYJS=node_modules/uglify-js/bin/uglifyjs

$(BROWSERIFY):
	npm install

$(ESLINT):
	npm install

$(JSDOC):
	npm install

$(UGLIFYJS):
	npm install

# Lint

.linted: $(ESLINT) $(LIB) $(SRC)
	$(ESLINT) $(filter-out node_modules%,$?)
	touch .linted

lint: $(ESLINT)
	$(ESLINT) $(LIB) $(SRC)

# Bundled JavaScript

$(SRC_BUNDLE): .linted $(BROWSERIFY) $(LIB)
	$(BROWSERIFY) -e $(MAIN) -o $@

# JavaScript

$(JS): $(SRC_BUNDLE) $(SRC)
	mkdir -p $(DIST)
	sed \
    -e 's/$${name}/$(NAME)/' \
    -e 's/$${version}/$(VERSION)/' \
    $(SRC) \
      | sed \
        -e "/require('\.\/ortc-adapter-bundle\')/ {" \
          -e 'r src/ortc-adapter-bundle.js' \
          -e 'd' \
        -e '}' \
        >$@

# Minified JavaScript

$(MIN_JS): $(UGLIFYJS) $(JS)
	$(UGLIFYJS) --comments '/^!/' <$(JS) >$@

# Docs

$(DOCS): $(JSDOC) $(LIB) $(SRC)
	make docs

docs: $(JSDOC)
	rm -rf $(DOCS)
	$(JSDOC) -r lib -d $(DOCS)

.PHONY: all clean docs lint
