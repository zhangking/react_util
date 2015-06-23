var React = require('react');
// dom 
// event
// children


var dom = {
	getWindow:function(componentOrElement){
		var elem = React.findDOMNode(componentOrElement);

		return (elem != null && elem == elem.window) ?
		elem :
		elem.nodeType === 9 ?
			elem.defaultView || elem.parentWindow :
			false;
	},
	getDocument:function(componentOrElement){
		var elem = React.findDOMNode(componentOrElement);
		return (elem && elem.ownerDocument) || document;
	},
	getComputedStyles:function(elem){
		return this.getDocument(elem).defaultView.getComputedStyle(elem, null);
	},
	getOffset:function(DOMNode) {
		var docElem = this.getDocument(DOMNode).documentElement;
		var box = { top: 0, left: 0 };

		if ( typeof DOMNode.getBoundingClientRect !== 'undefined' ) {
			box = DOMNode.getBoundingClientRect();
		}

		return {
			top: box.top + (window.pageYOffset || docElem.scrollTop) - (docElem.clientTop || 0),
			left: box.left + (window.pageXOffset || docElem.scrollLeft) - (docElem.clientLeft || 0)
		};
	},
	getPosition:function(elem, offsetParent) {
		var offset,
		parentOffset = {top: 0, left: 0};

		if (this.getComputedStyles(elem).position === 'fixed' ) {
			offset = elem.getBoundingClientRect();
		} else {
			if (!offsetParent) {
				offsetParent = this.getOffsetParent(elem);
			}

			offset = this.getOffset(elem);
			if ( offsetParent.nodeName !== 'HTML') {
				parentOffset = this.getOffset(offsetParent);
			}

			parentOffset.top += parseInt(this.getComputedStyles(offsetParent).borderTopWidth, 10);
			parentOffset.left += parseInt(this.getComputedStyles(offsetParent).borderLeftWidth, 10);
		}

		  // Subtract parent offsets and element margins
		  return {
		  	top: offset.top - parentOffset.top - parseInt(this.getComputedStyles(elem).marginTop, 10),
		  	left: offset.left - parentOffset.left - parseInt(this.getComputedStyles(elem).marginLeft, 10)
		  };
	},
	getOffsetParent:function(elem){
		var docElem = this.getDocument(elem).documentElement;
		var offsetParent = elem.offsetParent || docElem;

		while ( offsetParent && ( offsetParent.nodeName !== 'HTML' &&
			this.getComputedStyles(offsetParent).position === 'static' ) ) {
			offsetParent = offsetParent.offsetParent;
		}

		return offsetParent || docElem;
	},
	contains:function(elem, inner){
		function ie8Contains(root, node) {
			while (node) {
				if (node === root) {
					return true;
				}
				node = node.parentNode;
			}
			return false;
		}

		return (elem && elem.contains)
		? elem.contains(inner)
		: (elem && elem.compareDocumentPosition)
		? elem === inner || !!(elem.compareDocumentPosition(inner) & 16)
		: ie8Contains(elem, inner);
	}
}



var EVENT_NAME_MAP = {
  transitionend: {
    'transition': 'transitionend',
    'WebkitTransition': 'webkitTransitionEnd',
    'MozTransition': 'mozTransitionEnd',
    'OTransition': 'oTransitionEnd',
    'msTransition': 'MSTransitionEnd'
  },

  animationend: {
    'animation': 'animationend',
    'WebkitAnimation': 'webkitAnimationEnd',
    'MozAnimation': 'mozAnimationEnd',
    'OAnimation': 'oAnimationEnd',
    'msAnimation': 'MSAnimationEnd'
  }
};

function detectEvents() {
  var testEl = document.createElement('div');
  var style = testEl.style;

  if (!('AnimationEvent' in window)) {
    delete EVENT_NAME_MAP.animationend.animation;
  }

  if (!('TransitionEvent' in window)) {
    delete EVENT_NAME_MAP.transitionend.transition;
  }

  for (let baseEventName in EVENT_NAME_MAP) {
    let baseEvents = EVENT_NAME_MAP[baseEventName];
    for (let styleName in baseEvents) {
      if (styleName in style) {
        endEvents.push(baseEvents[styleName]);
        break;
      }
    }
  }
}
detectEvents();


var event = {
	add:function(componentOrElement,type,handler){
		var elem = React.findDOMNode(componentOrElement);
		if (elem.addEventListener) {
               elem.addEventListener(type, handler, false);
           } else if (elem.attachEvent) {
               elem.attachEvent('on' + type, function() {
                   handler.call(elem);
               });
           } else {
               elem['on' + type] = handler;
           }
	},
	remove:function(componentOrElement,type,handler){
		var elem = React.findDOMNode(componentOrElement);
		if (elem.removeEnentListener) {
               elem.removeEnentListener(type, handler, false);
           } else if (elem.datachEvent) {
               elem.detachEvent('on' + type, handler);
           } else {
               elem['on' + type] = null;
           }
	},
	addEnd:function(elem,handler){
		if (endEvents.length === 0) {
	      window.setTimeout(handler, 0);
	      return;
    	}
	    endEvents.forEach(function(endEvent) {
	      this.add(elem, endEvent, handler);
	    });
	},
	removeEnd:function(elem,handler){
		if (endEvents.length === 0) {
      		return;
    	}
	    endEvents.forEach(function(endEvent) {
	      removeEventListener(elem, endEvent, handler);
	    });
	},
	preventDefault:function(e){
		if (e.preventDefault) {
            e.preventDefault();
        } else {
            e.returnValue = false;
        }
	},
	stopPropagation:function(e){
		if (e.stopPropagation) {
           e.stopPropagation();
        } else {
           e.cancelBubble = true;
        }
	}
}

var chileren = {
	map:function(children, func, context){
		var index = 0;

		return React.Children.map(children, function (child) {
			if (React.isValidElement(child)) {
				var lastIndex = index;
				index++;
				return func.call(context, child, lastIndex);
			}

			return child;
		});
	},
	forEach:function(children, func, context){
		var index = 0;

		return React.Children.forEach(children, function (child) {
			if (React.isValidElement(child)) {
				func.call(context, child, index);
				index++;
			}
		});
	},
	count:function(children){
		var count = 0;

		React.Children.forEach(children, function (child) {
			if (React.isValidElement(child)) { count++; }
		});

		return count;
	},
	toArray:function(children){
		var ret = [];
		React.Children.forEach(children, function (child) {
			ret.push(child);
		});
		return ret;
	}
}

module.exports = {
	dom : dom,
	event:event,
	children:chileren
}