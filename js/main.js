$(document).ready(function($) {
	var undefined;
	var creatures = [
		{name:'Peasant', off:1, def:1, dmg:1, spd:3, hp:1, cnt:25},
        {name:'Pikeman', off:4, def:5, dmg:'1-3', spd:4, hp:10, cnt:14},
        {name:'Halberdier', off:6, def:5, dmg:'2-3', spd:5, hp:10, cnt:14},
        {name:'Centaur', off:5, def:3, dmg:'2-3', spd:6, hp:8, cnt:14},
        {name:'Centaur Captain', off:6, def:3, dmg:'2-3', spd:8, hp:10, cnt:14},
        {name:'Gremlin', off:3, def:3, dmg:'1-2', spd:4, hp:4, cnt:16},
        {name:'Master Gremlin', off:4, def:4, dmg:'1-2', spd:5, hp:4, cnt:16},
        {name:'Skeleton', off:5, def:4, dmg:'1-3', spd:4, hp:6, cnt:12},
        {name:'Skeleton Warrior', off:6, def:6, dmg:'1-3', spd:5, hp:6, cnt:12},
        {name:'Troglodyte', off:4, def:3, dmg:'1-3', spd:4, hp:5, cnt:14},
        {name:'Infernal Troglodyte', off:5, def:4, dmg:'1-3', spd:5, hp:6, cnt:14},
        {name:'Imp', off:2, def:3, dmg:'1-2', spd:5, hp:4, cnt:15},
        {name:'Familiar', off:4, def:4, dmg:'1-2', spd:7, hp:4, cnt:15},
        {name:'Gnoll', off:3, def:5, dmg:'2-3', spd:4, hp:6, cnt:12},
        {name:'Gnoll Marauder', off:4, def:6, dmg:'2-3', spd:5, hp:6, cnt:12},
        {name:'Goblin', off:4, def:2, dmg:'1-2', spd:5, hp:5, cnt:15},
		{name:'Hobgoblin', off:5, def:3, dmg:'1-2', spd:7, hp:5, cnt:15},
        {name:'Pixie', off:2, def:2, dmg:'1-2', spd:7, hp:3, cnt:20},
        {name:'Sprite', off:2, def:2, dmg:'1-3', spd:9, hp:3, cnt:20},
        {name:'Nymph', off:5, def:2, dmg:'1-2', spd:6, hp:4, cnt:16},
        {name:'Oceanida', off:6, def:2, dmg:'1-3', spd:8, hp:4, cnt:16},
        {name:'Halfling', off:4, def:2, dmg:'1-3', spd:5, hp:4, cnt:15},
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
			return this._createElementByTemplate('formTemplate', params).appendTo('#'+containerId);
		},
		  
		createCreaturesList: function(creatures) {
			var template = $('#optionTemplate').html();
			var optionTmpl = {value:'none', text:'No available creature'};
			
			if (creatures.length === 0) {
				return this._replace(template, optionTmpl);
			}
			
			var result='';
			for (var i=0, size=creatures.length; i < size; i++) {
				optionTmpl.value = creatures[i].name;
				optionTmpl.text = creatures[i].name;
				result += this._replace(template, optionTmpl);
			}
			return result;
		},
		
		capitalize: function(input) {
			return input.charAt(0).toUpperCase() + input.slice(1);
		}
	};
  
  //------------------------------
	var FormComponent = function(unit) {
		if (FormComponent.index == undefined) FormComponent.index=0;   
    
        unit = unit || new Unit();
        
		this.htmlUtils=HtmlUtils.getInstance();
		this.calculator=Calculator.getInstance();
		this.log=Logger.getInstance();
        
        this._listeners={};
    
		this.index = ++FormComponent.index;
		var params = {
			i:this.index,
			textInputs:unit.getTextInputTemplates(this.index),
			creatures:creatures
		};
    
		this.$form = this.htmlUtils.createForm('formContainer', params).find('#creatureForm'+this.index);
    
		/**
		* Sets new value for specified parameter
		* @method setParameter
		* @param {String} Parameter name
		* @param {String | Number} New value for parameter
		* @param {Boolean} Flag to update form: if true form will be updated, and will not overwise
		*/
		this.setParameter=function(parameter, value, toUpdate) {
			unit.set(parameter, value);
			this.log.write('For unit '+unit.name+' is set parameter '+parameter+' = '+value);
			if (toUpdate === true) this._update(unit, parameter);
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
			this.$form.find('.text-input').change(onParameterChange);
			this.$form.find('.select-creature').change(onSelectUnit);
		  
			function onParameterChange(e) {
				var parameter = getParameter(this.id);
				
				self.setParameter(parameter, $(this).val());
				
				function getParameter(id) {
					return id.match(/creature([a-zA-Z]+)\d+/)[1].toLowerCase();
				}
			}
			
			function onSelectUnit() {
				self.setUnit(new Unit(creatures.get($(this).val())));
			}
		},
		
		_update: function(unit, parameter) {
			var self =this;
			if (parameter != undefined) {
				getInput(parameter).val(unit[parameter]);
			} else {      
				for (var par in unit) {
					if (unit.hasOwnProperty(par)) {        	
						getInput(par).val(unit[par]);
					}
				}
			}
			
			unit.isDead ? this._setDead(unit) : this._setAlive(unit);
			
			function getInput(parameter) {
				return $('#creature'+self.htmlUtils.capitalize(parameter)+self.index)
			}
		},
      
		_setDead: function(unit) {
			this.$form.addClass('creature-form-dead');
		},
      
		_setAlive: function(unit) {
			this.$form.removeClass('creature-form-dead');
		},
        
        addListener: function(type, handler) {
            if (this._listeners[type] == undefined) this._listeners[type] = [];
            this._listeners[type].push(handler)
        },        
        removeListener: function(type, handler) {
            var listeners = this._listeners[type];
            if (listeners == undefined) return;
            
            var index = listeners.indexOf(handler);
            if (index == -1) return;
            
            listeners.splice(index, 1);
        },
        trigger: function(type, event) {
            if (this._listeners[type] == undefined) return;
            
            var listeners = this._listeners[type];
            for (var i = 0, size = listeners.length; i < size; i++) {
                listeners[i](event);
            }
        }
	};
  
  //----------------------------------------
	var Unit = function(template) {
		this.htmlUtils=HtmlUtils.getInstance();
		template = template || {};
		  
		this.name=template.name||'Peasant';
		this.offense=template.off||1;
		this.defense=template.def||1;
		this.damage=template.dmg||'1';
		this.speed=template.spd||3;
		this.hitpoints=template.hp||1;
		this.shorts=template.shts||0;
		this.baseCount=template.bsCnt||25;
		this.count=template.cnt||this.baseCount;
		
		this.currentHitpoints = this.hitpoints;
		this.summaryHitpoints = this.hitpoints * this.count;
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
			if (parameter == 'hitpoints' || parameter == 'count') {
				this.summaryHitpoints = this.hitpoints * this.count;
				this.isDead = this.summaryHitpoints === 0;
			}
		},
		  
		/**
		* Method for pushing damage to unit
		* @method pushDamage
		* @param {Integer} Pushing damage
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
			var MIN_MODIFICATOR = -28;
			var MAX_MODIFICATOR = 60;
			var INCREASE_DAMAGE_COEFFICIENT = 0.05;
			var DECREASE_DAMAGE_COEFFICIENT = 0.025;
			
			
			var mod = offense-defense;
			if (mod < MIN_MODIFICATOR) mod = MIN_MODIFICATOR;
			if (mod > MAX_MODIFICATOR) mod = MAX_MODIFICATOR;
		
			var k = mod < 0 ? DECREASE_DAMAGE_COEFFICIENT : INCREASE_DAMAGE_COEFFICIENT;
			return 1 + k * mod;
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
			var dmgArr = damageStr.split(/\s*-\s*/);
			return {min: +dmgArr[0], max: +dmgArr[1]};
		}
	};
                                  
  //-------------------------------------------                                  
	var Logger = function() {
		this.$container = $('#logContainer');
		this.htmlUtils=HtmlUtils.getInstance();
		
		this.htmlUtils._createElementByTemplate('logTemplate', {})
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
	var App = function() {
		var app = this;
		this.log = Logger.getInstance();
		this.calculator = Calculator.getInstance();
	
		this.units = [
			new Unit(),
			new Unit()
		];
	
		this.formComponents = this.units.map(function(unit) {
			return new FormComponent(unit);
		});
	
		$('.btn-attack').click(onAttack);
	
		function onAttack(e) {
			var index = +e.target.id.replace('attack','');
			var targetIndex = index == 1 ? 2 : 1;
		
			app.attack(app.formComponents[index - 1], app.formComponents[targetIndex - 1]);
		}
	};
  
	App.prototype = {
		attack: function(offFc, defFc) {
            var offName = offFc.getParameter('name');
            var defName = defFc.getParameter('name');
            
			this._writeAttack(offName, defName);				
			var dmg=this.calculator.getDamage(
                offFc.getOffenseParameters(),
                defFc.getDefenseParameters()
            );
			
			this._writeHit(offName, defName, dmg);			
            
			defFc.pushDamage(dmg);
            
            if (defFc.getParameter('isDead')) {
                this._writeWon(offName);
            }
		},
        _writeAttack:function(offName, defName) {
            this.log.write(offName+' attacks '+defName, 'muted');
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
        },
        _writeWon: function(winnerName) {
            this.log.write(winnerName+' won!', 'success');
        }
	};
	
	new App;
});
