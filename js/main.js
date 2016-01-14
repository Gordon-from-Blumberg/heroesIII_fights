$(document).ready(function($) {
	var undefined;
	var creatures = [
		{name:'Peasant', off:1, def:1, dmg:1, spd:3, hp:1, bsCnt:25},
        {name:'Pikeman', off:4, def:5, dmg:'1-3', spd:4, hp:10, bsCnt:14},
        {name:'Halberdier', off:6, def:5, dmg:'2-3', spd:5, hp:10, bsCnt:14},
        {name:'Centaur', off:5, def:3, dmg:'2-3', spd:6, hp:8, bsCnt:14},
        {name:'Centaur Captain', off:6, def:3, dmg:'2-3', spd:8, hp:10, bsCnt:14},
        {name:'Gremlin', off:3, def:3, dmg:'1-2', spd:4, hp:4, bsCnt:16},
        {name:'Master Gremlin', off:4, def:4, dmg:'1-2', spd:5, hp:4, bsCnt:16},
        {name:'Skeleton', off:5, def:4, dmg:'1-3', spd:4, hp:6, bsCnt:12},
        {name:'Skeleton Warrior', off:6, def:6, dmg:'1-3', spd:5, hp:6, bsCnt:12},
        {name:'Troglodyte', off:4, def:3, dmg:'1-3', spd:4, hp:5, bsCnt:14},
        {name:'Infernal Troglodyte', off:5, def:4, dmg:'1-3', spd:5, hp:6, bsCnt:14},
        {name:'Imp', off:2, def:3, dmg:'1-2', spd:5, hp:4, bsCnt:15},
        {name:'Familiar', off:4, def:4, dmg:'1-2', spd:7, hp:4, bsCnt:15},
        {name:'Gnoll', off:3, def:5, dmg:'2-3', spd:4, hp:6, bsCnt:12},
        {name:'Gnoll Marauder', off:4, def:6, dmg:'2-3', spd:5, hp:6, bsCnt:12},
        {name:'Goblin', off:4, def:2, dmg:'1-2', spd:5, hp:5, bsCnt:15},
		{name:'Hobgoblin', off:5, def:3, dmg:'1-2', spd:7, hp:5, bsCnt:15},
        {name:'Pixie', off:2, def:2, dmg:'1-2', spd:7, hp:3, bsCnt:20},
        {name:'Sprite', off:2, def:2, dmg:'1-3', spd:9, hp:3, bsCnt:20, getsCtrattk:false},
        {name:'Nymph', off:5, def:2, dmg:'1-2', spd:6, hp:4, bsCnt:16},
        {name:'Oceanida', off:6, def:2, dmg:'1-3', spd:8, hp:4, bsCnt:16},
        {name:'Halfling', off:4, def:2, dmg:'1-3', spd:5, hp:4, bsCnt:15},
        {name:'Azure Dragon', off:50, def:50, dmg:'70-80', spd:19, hp:1000, bsCnt:1},        
	];
	creatures.get = function(name) {
		for (var i = 0, size = this.length; i < size; i++) {
			if (this[i].name.toLowerCase() == name.toLowerCase()) return this[i];
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
				var match = property.match(reMethod);
				return match ?
					self._callMethod(match, params) :
					params[property];
		  });          
		},
    
		_getHtmlByTemplate: function(templateId, params) {
			return this._replace($('#' + templateId).html(), params);
		},
		
		_createElementByTemplate: function(templateId, params) {
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
			
			var result = '';
			for (var i = 0, size = creatures.length; i < size; i++) {
				optionTmpl.value = creatures[i].name;
				optionTmpl.text = creatures[i].name;
				result += this._replace(template, optionTmpl);
			}
			return result;
		},
		
		capitalize: function(input) {
			return input.charAt(0).toUpperCase() + input.slice(1);
		},
        
        radioInput: function(params) {
            return this._getHtmlByTemplate('radioTemplate', params);
        }
	};
  
  //------------------------------
	var FormComponent = function(unit) {
		if (FormComponent.index == undefined) FormComponent.index = 0;   
    
        unit = unit || new Unit();
        
		this.htmlUtils = HtmlUtils.getInstance();
		this.calculator = Calculator.getInstance();
		this.log = Logger.getInstance();
        
        this._listeners = {};
    
		this.index = ++FormComponent.index;
		var params = {
			i: this.index,
			textInputs: unit.getTextInputTemplates(this.index),
			creatures: creatures,
            damageTypes: this.calculator.getDamageTypesTemplate(this.index)
		};
        
        params.damageTypes.forEach(function(tmpl) {
            tmpl.checked = tmpl.value == unit.damageType ? ' checked' : '';
        });
    
		this.$form = this.htmlUtils.createForm('formContainer', params).find('#creatureForm' + this.index);
    
		/**
		* Sets new value for specified parameter
		* @method setParameter
		* @param {String} parameter Parameter name
		* @param {String | Number} value New value for parameter
		* @param {Boolean} toUpdate Flag to update form: if true form will be updated, and will not overwise
		*/
		this.setParameter = function(parameter, value, toUpdate) {
			unit.set(parameter, value);
            
            if (unit.fieldsForDisplay.indexOf(parameter) != -1) {
                this.log.write(parameter + ' = ' + value + ' is set for unit ' + unit.name, 'muted');
            }
            
			if (toUpdate === true) this._update(unit, parameter);
		};
		this.getParameter = function(parameter) {
			return unit[parameter];
		};
		this.setUnit = function(newUnit) {
			unit = newUnit;
			this._update(unit);
		};
		
		this.getOffenseParameters = function() {
			return {
				dmg: unit.damage,
				cnt: unit.count,
				off: unit.offense,
                dmgType: unit.damageType
			};
		};
		
		this.getDefenseParameters = function() {
			return {def: unit.defense};
		};
		
		this.pushDamage = function(dmg) {
			var message = this.log.composeMessage([
				{msg: unit.name, cls: 'primary'},
				{msg: 'got'},
				{msg: Math.min(dmg, unit.summaryHitpoints), cls: 'warn'},
				{msg: 'hitpoints of damage '}
			]);
			
			var killedCount = unit.pushDamage(dmg);        
			if (killedCount > 0) {
				message += this.log.composeMessage([
					{msg: '('},
					{msg: killedCount + (killedCount > 1 ? ' were': ' was') + ' killed', cls: 'warn'},
					{msg: ')'}
				]);
			}
			
			this.log.write(message);    	
			this._update(unit);
		};
		
		this.addHandlers();
	};
	FormComponent.prototype = {
        /*createInputTemplateModel:function(name, value) {
			return {
				id: 'creature' + name + this.index,
				label: name,
				value: value
			}
		},*/
    
		addHandlers: function() {
			var self = this;
			this.$form.find('.text-input').change(onParameterChange);
			this.$form.find('.select-creature').change(onSelectUnit);
            this.$form.find('[name=damageType' + this.index + ']').change(onDamageTypeChange);
		  
			function onParameterChange(e) {
				var parameter = getParameter(this.id);
				
				self.setParameter(parameter, $(this).val());
				
				function getParameter(id) {
					return id.match(/creature([a-zA-Z]+)\d+/)[1].toLowerCase();
				}
			}
			
			function onSelectUnit() {
				self.setUnit(new Unit(creatures.get($(this).val())));
                self.log.write('Selected ' + self.getParameter('name'), 'muted');
			}
            
            function onDamageTypeChange() {
                self.setParameter('damageType', $(this).val());
            }
		},
        
        addAttackHandlers: function(targetFc) {   
            var self = this;
            
            this.$form.find('.btn-attack').click(function() {
                if (check($(this))) return;
                
                self.attack(targetFc);
            });  
            
            this.$form.find('.btn-simple-attack').click(function() {
                if (check($(this))) return;
            
                self.log.write(self.getParameter('name') + ' attacks ' + targetFc.getParameter('name'), 'muted');
                
                self.simpleAttack(targetFc);
            });
            
            this.$form.find('.btn-show-damage').click(function() {
                if (check($(this))) return;
            
                self.showPossibleDamage(targetFc);
            });
            
            function check($this) {
                return $this.attr('disabled')
                    || self.getParameter('isDead')
                    || targetFc.getParameter('isDead');
            }
        },
		
		_update: function(unit, parameter) {
			var self = this;
			if (parameter != undefined) {
                getInput(parameter).val(unit[parameter]);
			} else {      
				for (var par in unit) {
					if (unit.hasOwnProperty(par)) {        	
						getInput(par).val(unit[par]);
					}
				}
			}
            
            $('#dmgType' + unit.damageType.toUpperCase() + this.index).attr('checked', 'checked');
			
			unit.isDead ? this._setDead(unit) : this._setAlive(unit);
            $('.creature-form-winner').removeClass('creature-form-winner');
			
			function getInput(parameter) {
				return $('#creature' + self.htmlUtils.capitalize(parameter) + self.index)
			}
		},
      
		_setDead: function() {
			this.$form.addClass('creature-form-dead');
            $('.creature-form .btn').attr('disabled', 'disabled');
		},
      
		_setAlive: function() {
			this.$form.removeClass('creature-form-dead');
            this.$form.find('.btn').removeAttr('disabled');
		},
        
        _setWinner: function() {
            this.$form.addClass('creature-form-winner');
        },
        
        showPossibleDamage: function(targetFc) {
            var offName = this.getParameter('name');
            var defName = targetFc.getParameter('name');
            
            var offPars = this.getOffenseParameters();
            var defPars = targetFc.getDefenseParameters();
            
            offPars.dmgType = 'min';
            var minDamage = this.calculator.getDamage(offPars, defPars);
            
            offPars.dmgType = 'max';
            var maxDamage = this.calculator.getDamage(offPars, defPars);
            
            this.log.composeAndWrite([
                {msg: offName, cls: 'primary'},
                {msg: 'can hit'},
                {msg: minDamage + ' - ' + maxDamage, cls: 'warn'},
                {msg: 'to'},
                {msg: defName, cls: 'primary'}
            ]);
        },
        
        simpleAttack: function(targetFc) {
            var attFc = this;
            var offName = this.getParameter('name');
            var defName = targetFc.getParameter('name');
            
			var dmg = this.calculator.getDamage(
                attFc.getOffenseParameters(),
                targetFc.getDefenseParameters()
            );
			
			writeHit(offName, defName, dmg);			
            
			targetFc.pushDamage(dmg);
            
            if (targetFc.getParameter('isDead')) {
                this.log.write(offName + ' won!', 'success');
                this._setWinner();
            }
            
            function writeHit(offName, defName, dmg) {
                attFc.log.composeAndWrite([
                    {msg: attFc.getParameter('count'), cls: 'primary'},
                    {msg: offName, cls: 'primary'},
                    {msg: 'hits'},
                    {msg: dmg, cls: 'warn'},
                    {msg: 'damage to'},
                    {msg: defName, cls: 'primary'}
                ]);
            }
        },
        
        attack: function(targetFc) {
            this.log.write(this.getParameter('name') + ' attacks ' + targetFc.getParameter('name'), 'muted');
            
            this.simpleAttack(targetFc);
            
            if (targetFc.getParameter('isDead')) return;
            
            if (this.getParameter('getsCounterattack') && targetFc.getParameter('counterattacksCount') > 0) {
                targetFc.counterattack(this);            
            }
        },
        
        counterattack: function(targetFc) {
            this.log.write(this.getParameter('name') + ' counterattacks ' + targetFc.getParameter('name'), 'muted');
            this.setParameter('counterattacksCount', this.getParameter('counterattacksCount') - 1);
            
            this.simpleAttack(targetFc);
        },
        
        reset: function() {
            var name = this.getParameter('name');
            var count = this.getParameter('baseCount');
            this.setParameter('isDead', false);
            this.setParameter('count', count, true);
        },
        
        doTurn: function(targetFc) {
            this.attack(targetFc);
        },
        
        // Pattern "Observer"
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
                listeners[i].call(this, event);
            }
        }
	};
  
  //----------------------------------------
	var Unit = function(template) {
		this.htmlUtils = HtmlUtils.getInstance();
		template = template || {};
		  
		this.name = template.name || 'Peasant';
		this.offense = template.off || 1;
		this.defense = template.def || 1;
		this.damage = template.dmg || '1';
        this.damageType = 'random';
		this.speed = template.spd || 3;
		this.hitpoints = template.hp || 1;
		this.shorts = template.shts || 0;
		this.baseCount = template.bsCnt || 25;
        this.additionalGrowth = template.addGrth || false;
		this.count = template.cnt || this.baseCount;
		
		this.currentHitpoints = this.hitpoints;
		this.summaryHitpoints = this.hitpoints * this.count;
		this.isDead = false;
        
        this.getsCounterattack = template.getsCtrattk == undefined ? true : template.getsCtrattk;
        this.baseCounterattacksCount = template.ctrattks || 1;
        this.counterattacksCount = this.baseCounterattacksCount;
	};
	Unit.prototype = {
        fieldsForDisplay: ['name', 'offense', 'defense', 'damage', 'speed', 'shorts', 'hitpoints', 'count'],
		getTextInputTemplates: function(index) {
			var self = this;
			return this.fieldsForDisplay.map(function(field) {
				return {
					id: 'creature' + self.htmlUtils.capitalize(field) + index,
					label: field,
					value: self[field]
				};
			});
		},
		set: function(parameter, value) {
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
		pushDamage: function(dmg) {
			var countBeforeAttack = this.count;
			this.summaryHitpoints -= dmg;
			
			if (this.summaryHitpoints <= 0) {
				this.summaryHitpoints = 0;
				this.count = 0;
				this.isDead = true;
				return countBeforeAttack;
			}
			
			this.count = Math.ceil(this.summaryHitpoints / this.hitpoints);		
			return countBeforeAttack - this.count;
		}
	};
  
  //-----------------------------
	var Calculator = function() {};
	Calculator.getInstance = function() {
		if (Calculator.instance == undefined) Calculator.instance = new Calculator;
		return Calculator.instance;
	};
  
	Calculator.prototype = {
        damageTypes: {
            random: function(dmgRange, k) {
                return this.getRandomFromRange(
                    k * dmgRange.min ^ 0,
                    k * dmgRange.max ^ 0                    
                );
            },
            min: function(dmgRange, k) {
                return k * dmgRange.min;
            },
            max: function(dmgRange, k) {
                return k * dmgRange.max;
            },
            avg: function(dmgRange, k) {
                return k * (dmgRange.min + dmgRange.max) / 2;
            }
        },
		getRandomFromRange: function(min, max) {
			return (Math.random() * (max - min + 1) ^ 0) + min;
		},
		getCoefficient: function(offense, defense) {
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
		getDamage: function(offPars, defPars) {
			var coef = this.getCoefficient(offPars.off, defPars.def);
			var count = offPars.cnt;
			
			var dmgRange = this.parseDamage(offPars.dmg);
            
            return this.damageTypes[offPars.dmgType]
                .call(this, dmgRange, coef * count) ^ 0 || 1;
		},
		parseDamage: function(damageStr) {
			var dmgRangeReg = /^\s*\d+\s*-\s*\d+\s*$/;
            var dmgArr = dmgRangeReg.test(damageStr) ?
                damageStr.split(/\s*-\s*/) :
                [damageStr, damageStr];
			return {min: +dmgArr[0], max: +dmgArr[1]};
		},
        getDamageTypesTemplate: function(index) {
            var labels = {
                random: 'Default',
                min: 'Minimal',
                max: 'Maximal',
                avg: 'Average'
            };
            
            var template = [];
            
            for (var type in this.damageTypes) {
                if (this.damageTypes.hasOwnProperty(type)) {
                    template.push({
                        id: 'dmgType' + type.toUpperCase() + index,
                        label: labels[type],
                        name: 'damageType' + index,
                        value: type
                    });
                }
            }
            
            return template;
        }
	};
                                  
  //-------------------------------------------                                  
	var Logger = function() {
        var logger = this;
		this.$container = $('#logContainer');
		this.htmlUtils = HtmlUtils.getInstance();
		
		this.htmlUtils._createElementByTemplate('logTemplate', {})
			.appendTo(this.$container);
		this.$log = $('#log');
        
        $('#clearLog').click(function() {
            logger.clear();
        });
	};      
	Logger.getInstance = function() {
		if (Logger.instance == undefined) Logger.instance = new Logger;
		return Logger.instance;
	};
	Logger.prototype = {
		clear: function() {
			this.$log.empty();
		},
    
		composeMessage: function(tmplList) {
			var logger = this;
			return tmplList.map(function(tmpl) {
				return logger._wrapToSpan(tmpl.msg, tmpl.cls);
			}).join(' ');
		},
    
		write: function(message, cls) {
			this.$log.prepend(
				this.htmlUtils
					._createElementByTemplate(
						'logMessageTemplate',
						{message:this._wrapToSpan(message, cls)})
			);
		},
        
        composeAndWrite: function(tmplList) {
            this.write(this.composeMessage(tmplList));
        },
      
		_wrapToSpan: function(message, cls) {
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
        this.htmlUtils = HtmlUtils.getInstance();
		this.log = Logger.getInstance();
		this.calculator = Calculator.getInstance();
	
		this.units = [
			new Unit(),
			new Unit()
		];
	
		this.formComponents = this.units.map(function(unit) {
			return new FormComponent(unit);
		});
        
        this.createSharedControls();
        
        this.formComponents[0].addAttackHandlers(this.formComponents[1]);
        this.formComponents[1].addAttackHandlers(this.formComponents[0]); 
	};
  
	App.prototype = {
        createSharedControls: function() {
            var app = this;
            
            this.htmlUtils
                ._createElementByTemplate('sharedControlsTemplate', {})
                .appendTo('#formContainer');
            
            $('#reset').click(onResetClick);
            $('#fight').click(onFightClick);
            
            function onResetClick() {
                app.formComponents.forEach(function(fc) {
                    fc.reset();
                });
            }
            
            function onFightClick() {                
                app.fight();
            }
        },
        
        round: function(first, second) {
            this._recoveryCounterattacks();
            
            first.doTurn(second);
            
            if (!first.getParameter('isDead') && !second.getParameter('isDead')) {
                second.doTurn(first);
            }
        },
        
        fight: function() {        
            var first = this._getFirstFc() || this.formComponents[0];
            
            var second = first == this.formComponents[0] ? this.formComponents[1] : this.formComponents[0];

            this.log.composeAndWrite([
                {msg: 'Start of fight:'},
                {msg: first.getParameter('name'), cls: 'primary'},
                {msg: 'vs'},
                {msg: second.getParameter('name'), cls: 'primary'}
            ]);

            while(isBothAlive()) {
                this.round(first, second);
            }            
            
            function isBothAlive() {
                return !first.getParameter('isDead')
                    && !second.getParameter('isDead');
            }    
        },
        
        _getFirstFc: function() {
            var fc0 = this.formComponents[0];
            var fc1 = this.formComponents[1];

            if (fc0.getParameter('speed') != fc1.getParameter('speed')) {
                return fc0.getParameter('speed') > fc1.getParameter('speed') ? fc0 : fc1;
            }

            return null;
        },

        _recoveryCounterattacks: function() {
            this.formComponents.forEach(function(fc) {
                fc.setParameter('counterattacksCount', fc.getParameter('baseCounterattacksCount'));
            });
        }
	};
	
	new App;
});
