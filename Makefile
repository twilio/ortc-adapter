BUILD=dist/ortc-adapter.js

LIB=$(shell find lib -name \*.js)
SRC=src/ortc-adapter.js

BROWSERIFY=./node_modules/browserify/bin/cmd.js
ESLINT=./node_modules/eslint/bin/eslint.js

all: $(BUILD)

clean:
	rm -rf .lint dist

# Lint

.lint: $(LIB) $(SRC)
	$(ESLINT) $?
	touch .lint

lint:
	$(ESLINT) $(LIB) $(SRC)

# Dependencies

node_modules:
	npm install

$(BROWSERIFY): node_modules

$(ESLINT): node_modules

# Build

$(BUILD): .lint $(BROWSERIFY) $(LIB) $(SRC)
	mkdir -p dist
	$(BROWSERIFY) $(SRC) -o $@

.PHONY: all clean lint
