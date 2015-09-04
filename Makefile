BUILD=js/index.js
BROWSERIFY=./node_modules/browserify/bin/cmd.js
SRC=$(shell find lib -name \*.js)

all: $(BUILD)

clean:
	rm $(OUT)

$(BUILD): $(BROWSERIFY) $(SRC)
	$(BROWSERIFY) lib/index.js -o $@

.PHONY: all clean
