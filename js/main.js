$(document).ready(function($) {
	var undefined;
	var creatures = [
		{name:'Spearman', off:10, def:10, dmg:'2-3', spd:4, hp:10, cnt:14},
		{name:'Goblin', off:8, def:5, dmg:'1-2', spd:5, hp:5, cnt:16}
	];
	creatures.get=function(name) {
		for (var i=0, size=this.length; i<size; i++) {
			if (this[i].name.toLowerCase()==name.toLowerCase()) return this[i];
		}
		return null;
	};
  
  var HtmlUtils = function() {};
  HtmlUtils.getInstance=function() {
	  if (HtmlUtils.instance == undefined) HtmlUtils.instance = new HtmlUtils;
	  return HtmlUtils.instance;
  };
  
  HtmlUtils.prototype = {
    _replace:function(htmlTemplate, params) {
      var self = this;
      var reg = /%([\w.()_,\s]+)%/g;    
      return htmlTemplate.replace(reg, function(m, property) {
        var reMethod = /^([\w._]+)\(([\w._,\s]*)\)$/;
        var match=property.match(reMethod);
        return match ?
          self._callMethod(match, params) :
        	params[property];
      });          
    },
    
    _getHtmlByTemplate:function(templateId, params) {
    	return this._replace($('#'+templateId).html(), params);
    },
    
    _createElementByTemplate:function(templateId, params) {
    	return $(this._getHtmlByTemplate(templateId, params));
    },
    
    _callMethod:function(match, params) {
    	var method = match[1];
      var props = match[2].split(/\s*,\s*/);
      
      if (method == 'foreach') {
      	return this.foreach(params[props[0]], props[1]);
      }
      
      return this[method].apply(this, props.map(function(prop) {
      	return params[prop];
      }));
    },
    
    foreach:function(list, method) {
    	var self = this;
    	return list.reduce(function(result, item) {
      	return result + self[method](item)
      }, '');
    },
          
    textInput: function(params) {
      return this._getHtmlByTemplate('textInputTemplate', params);
    },
          
    createForm: function(containerId, params) {
      var self = this;
      var form = this._createElementByTemplate('formTemplate', params);
     	form.find('select[data-options]')
        .each(function() {
          $this = $(this);
          self._createOptions($this, params[$this.attr('data-options')]);
        });
        
        return form.appendTo('#'+containerId);
    },
      
    _createOptions: function($select, options) {
      if (options.length === 0) return;
      var html='';
      for (var i = 0, size = options.length; i<size; i++) {
        html += this._replace($('#optionTemplate').html(), options[i]);
      }
      $select.html(html);
    },
    
    capitalize: function(input) {
      return input.charAt(0).toUpperCase() + input.slice(1);
    }
  };
  
  //------------------------------
  var FormComponent = function(unit) {
    if (FormComponent.index == undefined) FormComponent.index=0;   
    
    this.htmlUtils=HtmlUtils.getInstance();
    this.calculator=Calculator.getInstance();
    this.log=Logger.getInstance();
    
    this.index = ++FormComponent.index;
    var params = {
    	i:this.index,
		textInputs:unit.getTextInputTemplates(this.index),
		creatures:[]
    };
    
    this.$form = this.htmlUtils.createForm('formContainer', params);
    
    this.setParameter=function(parameter, value) {
    	unit.set(parameter, value);
      this.log.write('For unit '+unit.name+' is set parameter '+parameter+' = '+value);
    };
	this.getParameter=function(parameter) {
		return unit[parameter];
	};
    this.setUnit = function(newUnit) {
    	unit = newUnit;
		this._update(unit);
    };
    
	this.attack=function() {
		var targetFC = fcs.getAnotherFc(this);
		this.log.write(unit.name+' attacks '+ta)
	};
	
	this.getOffenseParameters=function() {
    	return {
    		dmg:unit.damage,
    		cnt:unit.count,
    		off:unit.offense
    	};
    };
    
    this.getDefenseParameters=function() {
    	return {def:unit.defense};
    };
    
    this.pushDamage=function(dmg) {
        var message = this.log.composeMessage([
            {msg:unit.name, cls:'primary'},
            {msg:'got'},
            {msg:dmg, cls:'warn'},
            {msg:'hitpoints of damage '}
        ]);
        
        var killedCount = unit.pushDamage(dmg);        
        if (killedCount>0) {
            message += this.log.composeMessage([
                {msg:'('},
                {msg:killedCount + (killedCount>1 ? ' were': ' was')+' killed', cls:'warn'},
                {msg:')'}
            ]);
        }
        
    	this.log.write(message);    	
    	this._update(unit);
    };
	
    this.addHandlers();
  };
  FormComponent.prototype = {
  	createInputTemplateModel:function(name, value, index) {
    	return {
			id: 'creature' + name + index,
			label: name,
			value: value
      }
    },
    
    addHandlers: function() {
    	var self=this;
    	this.$form.change(onFormChange);
      
      function onFormChange(e) {
      	var $target = $(e.target);
      	var parameter = getParameter(e.target.id);
        
        self.setParameter(parameter, $target.val());
        
        function getParameter(id) {
        	return id.match(/creature([a-zA-Z]+)\d+/)[1].toLowerCase();
        }
      }
    },
    
    _update: function(unit, parameter) {
    	var self =this;
    	if (parameter != undefined) {
      	getInput(parameter).val(unit[parameter]);
        return;
      }
      
    	for (var par in unit) {
      	if (unit.hasOwnProperty(par)) {        	
          	getInput(par).val(unit[par]);
        }
      }
      
      function getInput(parameter) {
      	return $('#creature'+self.htmlUtils.capitalize(parameter)+self.index)
      }
    }
  };
  
  //----------------------------------------
  var Unit = function(template) {
	this.htmlUtils=HtmlUtils.getInstance();
	  
    this.name=template.name||'Some creature';
	this.offense=template.off||1;
	this.defense=template.def||1;
	this.damage=template.dmg||'1-1';
	this.speed=template.spd||1;
	this.hitpoints=template.hp||1;
	this.shorts=template.shts||0;
	this.baseCount=template.bsCnt||1;
	this.count=template.cnt||this.baseCount;
	
	this.summaryHitpoints=this.hitpoints*this.count;
	this.isDead=false;
  };
  Unit.prototype={
	fieldsForDisplay:['name','offense','defense','damage','speed','shorts','hitpoints','count'],
	getTextInputTemplates:function(index) {
		var self=this;
		return this.fieldsForDisplay.map(function(field) {
			return {
				id: 'creature'+self.htmlUtils.capitalize(field)+index,
				label:field,
				value:self[field]
			};
		});
	},
  	set:function(parameter, value) {
		this[parameter] = value;
	},
      
	/**
	* Description for pushDamage
	* @method pushDamage
	* @param {Integer} dmg
	* @return {Integer} Count of killed creatures
	*/
	pushDamage:function(dmg) {
        var countBeforeAttack = this.count;
		this.summaryHitpoints-=dmg;
        
		if (this.summaryHitpoints<=0) {
			this.summaryHitpoints = 0;
			this.count=0;
			this.isDead=true;
			return countBeforeAttack;
		}
		
		this.count=Math.ceil(this.summaryHitpoints/this.hitpoints);		
        return countBeforeAttack - this.count;
	}
  };
  
  //-----------------------------
  var Calculator = function() {};
  Calculator.getInstance=function() {
	  if (Calculator.instance == undefined) Calculator.instance = new Calculator;
	  return Calculator.instance;
  };
  
  Calculator.prototype={
  	getRandomFromRange:function(min, max) {
    	return (Math.random()*(max-min+1)^0)+min;
    },
    getCoefficient:function(offense, defense) {
    	var mod = offense-defense;
		if (mod < -28) mod = -28;
		if (mod > 60) mod = 60;
    
    	var k = mod<0?0.025:0.05;
    	return 1 + k*mod;
    },
    getDamage:function(offPars, defPars) {
    	var dmgRangeReg=/^\s*\d+\s*-\s*\d+\s*$/;
		var coef=this.getCoefficient(offPars.off, defPars.def);
		var count=offPars.cnt;
		
    	if (dmgRangeReg.test(offPars.dmg)) {
    		var dmgRange=this.parseDamage(offPars.dmg);
    		return this.getRandomFromRange(
    			_getDamage(dmgRange.min),
    			_getDamage(dmgRange.max)
    		);
    	} 
    	
    	return _getDamage(+offPars.dmg)
			
		function _getDamage(dmg) {
			return coef*dmg*count^0;
		}
    },
    parseDamage:function(damageStr) {
    	var dmgArr=damageStr.split(/\s*-\s*/);
    	return {min: +dmgArr[0], max: +dmgArr[1]};
    }
  };
                                  
  //-------------------------------------------                                  
  var Logger = function() {
  	this.$container = $('#logContainer');
    this.htmlUtils=HtmlUtils.getInstance();
    
    this.htmlUtils._createElementByTemplate('logTemplate',{})
    	.appendTo(this.$container);
    this.$log = $('#log');
  };      
  Logger.getInstance=function() {
	  if (Logger.instance == undefined) Logger.instance = new Logger;
	  return Logger.instance;
  };
  Logger.prototype = {
    clear:function() {
      this.$container.empty();
    },
    
    composeMessage:function(tmplList) {
        var logger=this;
        return tmplList.map(function(tmpl) {
          return logger._wrpaToSpan(tmpl.msg, tmpl.cls);
      }).join(' ');
    },
    
    write:function(message, cls) {
        this.$log.prepend(
            this.htmlUtils
                ._createElementByTemplate(
                    'logMessageTemplate',
                    {message:this._wrpaToSpan(message, cls)})
        );
    },
      
    _wrpaToSpan:function(message, cls) {
          return (cls == undefined || cls === '') ?
              message :
              this.htmlUtils._getHtmlByTemplate('logMessagePartTemplate', {
                  message:message,
                  cls:cls
              });
      }
  };
  
  // *** INIT ***
  var App=function() {
	var app=this;
	this.log=Logger.getInstance();
	this.calculator=Calculator.getInstance();
	
	this.units = [
		new Unit(creatures.get('spearman')),
		new Unit(creatures.get('goblin'))
	];
	
	this.formComponents = this.units.map(function(unit) {
		return new FormComponent(unit);
	});
	
	$('.btn-attack').click(onAttack);
	
	function onAttack(e) {
		var index = +e.target.id.replace('attack','');
		var targetIndex = index == 1 ? 2 : 1;
		
		app.attack(app.formComponents[index-1], app.formComponents[targetIndex-1]);
	}
  };
  
	App.prototype={
		attack:function(offFc, defFc) {
            var offName = offFc.getParameter('name');
            var defName = defFc.getParameter('name');
            
			this._writeAttack(offName, defName);				
			var dmg=this.calculator.getDamage(
                offFc.getOffenseParameters(),
                defFc.getDefenseParameters()
            );
			
			this._writeHit(offName, defName, dmg);			
            
			defFc.pushDamage(dmg);
		},
        _writeAttack:function(offName, defName) {
            this.log.write(offName+' attacks '+defName, 'muted');
            /*this.log.write(
                this.log.composeMessage([
                    {msg:offName, cls:'primary'},
                    {msg:'attacks'},
                    {msg:defName, cls:'primary'}
                ]));*/
        },
        _writeHit:function(offName, defName, dmg) {
            this.log.write(
                this.log.composeMessage([
                    {msg:offName, cls:'primary'},
                    {msg:'hits'},
                    {msg:dmg, cls:'warn'},
                    {msg:'damage to'},
                    {msg:defName, cls:'primary'}
                ]));
        }
	};
	
	new App;
});
