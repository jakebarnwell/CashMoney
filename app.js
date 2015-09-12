
var OVERRIDE = {
	INCLUDE: {
		"FORM": "placeholder",
		"IMG": "alt",
		"TEXTAREA": "placeholder"
	},
	EXCLUDE: {
		"SCRIPT": true,
		"NOSCRIPT": true
	}
}

var GLOBAL = {
	MONEY: "money",
	CASH: "cash",
	AUTO_UPDATE_INPUT: false
}

$(document).ready(function() {
	CashMoney();
});

function CashMoney() {
	walk(document.body);
	monitor();
}

function monitor() {
	var observer = new MutationObserver(function(mutations) {
	    mutations.forEach(function(mutation) {
			var addedNodes = mutation.addedNodes;
			if(addedNodes) {
				for(var n = 0; n < addedNodes.length; n++) {
					walk(addedNodes[n]);
				}
			}
	    });
	});

	var config = {
		attributes: true,
		childList: true,
		characterData: true,
		subtree: true
	};

	observer.observe(document.body, config);

	// Event handlers to fire for textareas and input boxes:
	if(GLOBAL.AUTO_UPDATE_INPUT) {
		$("textarea").change(function(e) {
			walk(e.target);
		});
		$("textarea").keypress(function(e) {
			walk(e.target);
		});
		$("input").change(function(e) {
			walk(e.target);
		});
		$("input").keypress(function(e) {
			walk(e.target);
		});
	}
}

function walk(node) {
	handle(node);

	var children = node.childNodes;
	if(!OVERRIDE.EXCLUDE[node.tagName]) {
		for(var c = 0; c < children.length; c++) {
			walk(children[c]);
		}
	}
}

function handle(node) {
	if(node.nodeType === Node.TEXT_NODE) {
		replaceNodeText(node);
	} else if(node.nodeType === Node.ELEMENT_NODE) {
		if(OVERRIDE.INCLUDE[node.tagName]) {
			var jqNode = $(node);
			var attribute;
			if(attribute = jqNode.attr(OVERRIDE.INCLUDE[node.tagName])) {
				var newText = replaceText(attribute);
				jqNode.attr(OVERRIDE.INCLUDE[node.tagName], newText);
			}
		} else {
			// Very special cases... in particular, for:
			// <input type="submit" value="..." ... >
			// <input type="text" value="..." ... >
			var jqNode = $(node);
			var type;
			if(node.tagName === "INPUT" && (type = jqNode.attr("type"))
				&& (type.toLowerCase() === "submit" || type.toLowerCase() === "text" || type.toLowerCase() === "search")
				&& (jqNode.attr("value") || jqNode.val())) {
					var newText = replaceText(jqNode.val());
				jqNode.attr("value", newText);
				jqNode.val(newText);
			}
			// Warning! We want to fetch the input text with .val(), NOT with .attr("value"),
			// since the latter does not get
			// properly updated when the user types (since we're getting this info from
			// keypress/change events). And, when setting the new value, we should set both
			// the attribute as well as the actual seen value, using .attr and .val

		}
	}
}

function replaceNodeText(text_node) {
	var newText = replaceText(text_node.nodeValue);

	text_node.nodeValue = newText;
}

function replaceText(text) {
	// make sure input is well-formed
	if(!(text && typeof text === "string")) {
		return text;
	}

	// finds cash or money (case-insensitive); only finds cash if it's not followed
	// by money; however, will still match 'money' in 'cash money'
	var regex = /\b((?:cash(?!\s*money))|money)\b/gi;

	// expands 'cash' or 'money' (case-insensitive) into cash money (with correct casing)
	var expandCashMoney = function(str, thing) {
		if(thing === GLOBAL.CASH) {
			switch(str) {
				case "cash": return "cash money";
				case "Cash": return "Cash Money";
				case "CASH": return "CASH MONEY";
				default: return "cash money";
			}
		} else if(thing === GLOBAL.MONEY) {
			switch(str) {
				case "money": return "cash money";
				case "Money": return "Cash Money";
				case "MONEY": return "CASH MONEY";
				default: return "cash money";
			}
		} else {
			return str; // should never happen
		}
	}

	// the replacement function to turn cash or money into cash money
	var replaceCashMoney = function(match_string, capture1, offset, original) {
		// match_string is either "cash" or "money" (the case of each letter can be anything)
		console.log("original:");console.log(original);
		console.log(match_string);

		// If matched "money" need to check that "cash" didn't come before it
		if(match_string.toLowerCase() === GLOBAL.MONEY) {
			var tokens = original.slice(0, offset).trim().split(" ");
			if(tokens[tokens.length - 1].search(/cash/i) >= 0) {
				return match_string; // do nothing with the match
			} else {
				return expandCashMoney(match_string, GLOBAL.MONEY); // expand appropriately
			}
		} else if(match_string.toLowerCase() === GLOBAL.CASH) { // matched "cash" which is safe
		console.log("safe cash");
			return expandCashMoney(match_string, GLOBAL.CASH);
		} else {
			return match_string; // should never happen
		}
	}

	// exec
	return text.replace(regex, replaceCashMoney);
}
