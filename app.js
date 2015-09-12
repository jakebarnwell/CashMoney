
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
	CASH: "cash"
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
		// walk(document.body);
	    mutations.forEach(function(mutation) {
			// console.log(mutation.type);
	        // console.log(mutation.addedNodes);
			var addedNodes = mutation.addedNodes;
			if(addedNodes) {
				// console.log("MORE NODES!");
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
	$("textarea").change(function(e) {
		// console.log("change");
		// console.log(e.target);
		walk(e.target);
	});
	$("textarea").keypress(function(e) {
		// console.log("change");
		// console.log(e.target);
		walk(e.target);
	});
	$("input").change(function(e) {
		// console.log("change");
		// console.log(e.target);
		walk(e.target);
	});
	$("input").keypress(function(e) {
		console.log("change");
		console.log(e.target);
		console.log($(e.target).val());
		walk(e.target);
	});
}



function walk(DOM_node) {
	// console.log("Walking on node:");console.log(DOM_node);
	handle(DOM_node);

	var children = DOM_node.childNodes;

	if(!OVERRIDE.EXCLUDE[DOM_node.tagName]) {
		for(var c = 0; c < children.length; c++) {
			walk(children[c]);
		}
	}
}

function handle(DOM_node) {
	// console.log("Handling...");
	if(DOM_node.nodeType === Node.TEXT_NODE) {
		replaceNodeText(DOM_node);
		// console.log(DOM_node);
	} else if(DOM_node.nodeType === Node.ELEMENT_NODE) {
		if(OVERRIDE.INCLUDE[DOM_node.tagName]) {
			var jqNode = $(DOM_node);
			var attribute;
			if(attribute = jqNode.attr(OVERRIDE.INCLUDE[DOM_node.tagName])) {
				// console.log(DOM_node);
				var newText = replaceText(attribute);
				jqNode.attr(OVERRIDE.INCLUDE[DOM_node.tagName], newText);
			}
		} else {
			// Very special cases... in particular, for:
			// <input type="submit" value="..." ... >
			// <input type="text" value="..." ... >
			var jqNode = $(DOM_node);
			var type;
			if(DOM_node.tagName === "INPUT" && (type = jqNode.attr("type"))
				&& (type.toLowerCase() === "submit" || type.toLowerCase() === "text")
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

function replaceNodeText(DOM_text_node) {
	var newText = replaceText(DOM_text_node.nodeValue);

	DOM_text_node.nodeValue = newText;
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
		// console.log(str);
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

		// If matched "money" need to check that "cash" didn't come before it
		if(match_string.toLowerCase() === GLOBAL.MONEY) {
			var tokens = original.slice(0, offset).trim().split(" ");
			if(tokens[tokens.length - 1].search(/cash/i) >= 0) {
				return match_string; // do nothing with the match
			} else {
				return expandCashMoney(match_string, GLOBAL.MONEY); // expand appropriately
			}
		} else if(match_string.toLowerCase() === GLOBAL.CASH) { // matched "cash" which is safe
			return expandCashMoney(match_string, GLOBAL.CASH);
		} else {
			return match_string; // should never happen
		}
	}

	// exec
	return text.replace(regex, replaceCashMoney);
}
