DIST=dist
BUILD=$(DIST)/ortc-adapter.js

LIB=$(shell find lib -name \*.js)
SRC=src/ortc-adapter.js

BROWSERIFY=./node_modules/browserify/bin/cmd.js

all: $(BUILD)

clean:
	rm -f $(BUILD)

$(BUILD): $(BROWSERIFY) $(LIB) $(SRC)
	mkdir -p $(DIST)
	$(BROWSERIFY) $(MAIN) -o $@

.PHONY: all clean
