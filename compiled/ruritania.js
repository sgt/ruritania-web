var GameUI, LOCATION_NAMES, PlayerPanel, SIGHT_NAMES, TRAVEL_CONFIG, br, button, distance, div, h1, h2, h3, p, playerPanel, ref, span, table, tbody, td, tr,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

ref = React.DOM, div = ref.div, span = ref.span, h1 = ref.h1, h2 = ref.h2, h3 = ref.h3, button = ref.button, br = ref.br, p = ref.p, table = ref.table, tbody = ref.tbody, tr = ref.tr, td = ref.td;

LOCATION_NAMES = ['New Crobuzon', 'Gondoshka', 'El Sobaco', 'Wuthering Heights', 'Ingriastadt', 'Lost-Hope', 'Naryan Mar'];

SIGHT_NAMES = ['Cathedral', 'Eiffel Tower', 'Eternal Fire', 'Castle', 'Taj Mahal', 'Mosque', 'Video Arcade', 'Burial Grounds', 'Lincoln Memorial'];

TRAVEL_CONFIG = {
  map_size: 10,
  wear_per_day: 10,
  selfie_prize: 100,
  selfie_wear: 7,
  travel_price_multiplier: 20,
  travel_wear_multiplier: 10,
  sights_per_location: 3,
  tick_minutes: 10,
  tick_interval: 1,
  tick_wear: 1,
  startingTS: moment("2011-10-02T12:30").unix(),
  eat: {
    street: {
      price: 5,
      heal: 10
    },
    junk: {
      price: 10,
      heal: 30
    },
    restaurant: {
      price: 20,
      heal: 70
    }
  },
  sleep: {
    park: {
      price: 0,
      heal: 10,
      energy: -20
    },
    hostel: {
      price: 10,
      heal: 20,
      energy: 20
    },
    hotel: {
      price: 30,
      heal: 30,
      energy: 50
    }
  }
};

distance = function(c1, c2) {
  return Math.sqrt(Math.pow(c1[0] - c2[0], 2) + Math.pow(c1[1] - c2[1], 2));
};

GameUI = (function(superClass) {
  extend(GameUI, superClass);

  function GameUI(props) {
    this.handleTravel = bind(this.handleTravel, this);
    this.handleStatsChange = bind(this.handleStatsChange, this);
    this.tick = bind(this.tick, this);
    GameUI.__super__.constructor.call(this, props);
    this.locations = this.genLocations();
  }

  GameUI.prototype.componentWillMount = function() {
    return this.resetStats();
  };

  GameUI.prototype.resetStats = function() {
    return this.setState({
      currentLocation: this.locations[0],
      health: 100,
      hunger: 100,
      energy: 100,
      cash: 1000,
      ts: this.props.startingTS
    });
  };

  GameUI.prototype.tick = function() {
    return this.setState(function(prevState) {
      return {
        energy: prevState.energy - this.props.tick_wear,
        ts: prevState.ts + moment.duration(this.props.tick_minutes, 'minutes').asSeconds()
      };
    });
  };

  GameUI.prototype.componentDidMount = function() {
    return this.interval = setInterval(this.tick, 1000 * this.props.tick_interval);
  };

  GameUI.prototype.componentWillUnmount = function() {
    return clearInterval(this.interval);
  };

  GameUI.prototype.genLocation = function(locName) {
    return {
      name: locName,
      coords: [_.random(0, this.props.map_size), _.random(0, this.props.map_size)],
      sights: _.sample(SIGHT_NAMES, this.props.sights_per_location),
      destinations: []
    };
  };

  GameUI.prototype.genLocations = function() {
    var i, l, len, locations, x;
    locations = (function() {
      var i, len, results;
      results = [];
      for (i = 0, len = LOCATION_NAMES.length; i < len; i++) {
        x = LOCATION_NAMES[i];
        results.push(this.genLocation(x));
      }
      return results;
    }).call(this);
    for (i = 0, len = locations.length; i < len; i++) {
      l = locations[i];
      l.destinations = (function() {
        var j, len1, results;
        results = [];
        for (j = 0, len1 = locations.length; j < len1; j++) {
          x = locations[j];
          if (l.name !== x.name) {
            results.push({
              name: x.name,
              price: Math.floor(distance(l.coords, x.coords) * this.props.travel_price_multiplier),
              wear: Math.floor(distance(l.coords, x.coords) * this.props.wear_per_day)
            });
          }
        }
        return results;
      }).call(this);
    }
    return locations;
  };

  GameUI.prototype.handleStatsChange = function(statsChange) {
    return this.setState(function(prevState) {
      var epsilon, newValue, result, stat;
      result = {};
      if (prevState.cash < 0 - statsChange.cash) {
        alert('not enough cash');
        return false;
      }
      for (stat in statsChange) {
        epsilon = statsChange[stat];
        newValue = prevState[stat] + epsilon;
        if (stat === 'health' || stat === 'hunger' || stat === 'energy') {
          if (newValue > 100) {
            newValue = 100;
          } else if (newValue < 0) {
            newValue = 0;
          }
        }
        result[stat] = newValue;
      }
      return result;
    });
  };

  GameUI.prototype.handleTravel = function(destination) {
    var location;
    location = _.find(this.locations, function(x) {
      return x.name === destination.name;
    });
    this.handleStatsChange({
      cash: 0 - destination.price,
      energy: 0 - destination.wear,
      ts: moment.duration(1, 'day').asSeconds()
    });
    return this.setState({
      currentLocation: location
    });
  };

  GameUI.prototype.actionButton = function(caption, callback, config) {
    var c, cfg;
    if (config == null) {
      config = {};
    }
    cfg = _.extend({
      glyph: null,
      style: 'default'
    }, config);
    c = cfg.glyph === null ? caption : "<span class='glyphicon glyphicon-" + cfg.glyph + "'></span> " + caption;
    return p({
      key: caption
    }, button({
      className: "btn btn-" + cfg.style,
      dangerouslySetInnerHTML: {
        __html: c
      },
      onClick: callback
    }));
  };

  GameUI.prototype.eatButton = function(name, type) {
    return this.actionButton(name + " ($" + this.props.eat[type].price + ")", (function(_this) {
      return function() {
        return _this.handleStatsChange({
          health: _this.props.eat[type].heal,
          cash: 0 - _this.props.eat[type].price
        });
      };
    })(this), {
      glyph: 'cutlery'
    });
  };

  GameUI.prototype.sleepButton = function(name, type) {
    return this.actionButton(name + " ($" + this.props.sleep[type].price + ")", (function(_this) {
      return function() {
        return _this.handleStatsChange({
          health: _this.props.sleep[type].heal,
          cash: 0 - _this.props.sleep[type].price,
          energy: _this.props.sleep[type].energy,
          ts: moment.duration(1, 'day').asSeconds()
        });
      };
    })(this), {
      glyph: 'bed'
    });
  };

  GameUI.prototype.seeButton = function(name) {
    return this.actionButton(name, (function(_this) {
      return function() {
        return _this.handleStatsChange({
          cash: _this.props.selfie_prize,
          energy: 0 - _this.props.selfie_wear,
          ts: moment.duration(1, 'day').asSeconds()
        });
      };
    })(this), {
      glyph: 'picture'
    });
  };

  GameUI.prototype.render = function() {
    return div({}, h1({}, "Ruritania"), div({
      className: 'row'
    }, div({
      className: 'col-md-8'
    }, h2({
      style: {
        marginBottom: 50
      }
    }, this.state.currentLocation.name), div({
      className: 'row'
    }, div({
      className: 'col-md-3'
    }, h3({}, 'Eat'), this.eatButton('Street food', 'street'), this.eatButton('Junk food', 'junk'), this.eatButton('In a restaurant', 'restaurant')), div({
      className: 'col-md-3'
    }, h3({}, 'Sleep'), this.sleepButton('In a park', 'park'), this.sleepButton('In a hostel', 'hostel'), this.sleepButton('In a hotel', 'hotel')), div({
      className: 'col-md-6'
    }, h3({}, 'See'), _.map(this.state.currentLocation.sights, (function(_this) {
      return function(sight) {
        return _this.seeButton("The " + sight + " of " + _this.state.currentLocation.name);
      };
    })(this)))), div({
      className: 'row'
    }, table({
      className: 'table table-hover table-condensed',
      id: 'travelTable',
      style: {
        marginTop: '100px'
      }
    }, tbody({}, _.map(this.state.currentLocation.destinations, (function(_this) {
      return function(dest) {
        return tr({
          key: dest.name
        }, td({}, dest.name), td({}, "$" + dest.price), td({}, _this.actionButton('Travel', function() {
          return _this.handleTravel(dest, {
            glyph: 'plane'
          });
        })));
      };
    })(this)))))), playerPanel(this.state)));
  };

  return GameUI;

})(React.Component);

PlayerPanel = (function(superClass) {
  extend(PlayerPanel, superClass);

  function PlayerPanel() {
    return PlayerPanel.__super__.constructor.apply(this, arguments);
  }

  PlayerPanel.prototype.progressBar = function(value, max, style) {
    var percent;
    if (style == null) {
      style = 'default';
    }
    percent = max / 100.0 * value;
    return div({
      className: 'progress'
    }, div({
      className: "progress-bar progress-bar-" + style,
      style: {
        width: percent + "%"
      }
    }, value));
  };

  PlayerPanel.prototype.render = function() {
    return div({
      className: 'col-md-4',
      id: 'playerPanel'
    }, h2({}, 'Player'), table({
      className: 'table'
    }, tbody({}, tr({}, td({}, 'Health'), td({}, this.progressBar(this.props.health, 100, 'success'))), tr({}, td({}, 'Hunger'), td({}, this.progressBar(this.props.hunger, 100, 'danger'))), tr({}, td({}, 'Energy'), td({}, this.progressBar(this.props.energy, 100, 'info'))), tr({}, td({}, 'Cash'), td({}, "$" + this.props.cash)), tr({}, td({}, 'Date'), td({}, moment(this.props.ts * 1000).format('HH:mm MMM Do, YYYY'))))));
  };

  return PlayerPanel;

})(React.Component);

playerPanel = React.createFactory(PlayerPanel);

React.render(React.createElement(GameUI, TRAVEL_CONFIG), document.getElementById('content'));

//# sourceMappingURL=ruritania.js.map