{div, span, h1, h2, h3, button, br, p, table, tbody, tr, td} = React.DOM

# === gameplay config

LOCATION_NAMES = [
  'New Crobuzon'
  'Gondoshka'
  'El Sobaco'
  'Wuthering Heights'
  'Ingriastadt'
  'Lost-Hope'
  'Naryan Mar'
]

SIGHT_NAMES = [
  'Cathedral'
  'Eiffel Tower'
  'Eternal Fire'
  'Castle'
  'Taj Mahal'
  'Mosque'
  'Video Arcade'
  'Burial Grounds'
  'Lincoln Memorial'
]

TRAVEL_CONFIG =
  map_size: 10
  wear_per_day: 10
  selfie_prize: 100
  selfie_wear: 7
  travel_price_multiplier: 20
  travel_wear_multiplier: 10
  sights_per_location: 3
  tick_minutes: 10
  tick_interval: 1 # seconds
  tick_wear: 1
  startingTS: moment("2011-10-02T12:30").unix()
  eat:
    street:
      price: 5
      heal: 10
    junk:
      price: 10
      heal: 30
    restaurant:
      price: 20
      heal: 70
  sleep:
    park:
      price: 0
      heal: 10
      energy: -20
    hostel:
      price: 10
      heal: 20
      energy: 20
    hotel:
      price: 30
      heal: 30
      energy: 50


# === utils

distance = (c1, c2) ->
  Math.sqrt(Math.pow(c1[0] - c2[0], 2) + Math.pow(c1[1] - c2[1], 2))


# === ui

class GameUI extends React.Component

  constructor: (props) ->
    super(props)
    @locations = @genLocations()

  componentWillMount: ->
    @resetStats()

  resetStats: ->
    @setState
      currentLocation: @locations[0]
      health: 100
      hunger: 100
      energy: 100
      cash: 1000
      ts: @props.startingTS

  tick: =>
    @setState (prevState) ->
      energy: prevState.energy - @props.tick_wear
      ts: prevState.ts + moment.duration(@props.tick_minutes, 'minutes').asSeconds()

  componentDidMount: ->
    @interval = setInterval(@tick, 1000 * @props.tick_interval);

  componentWillUnmount: ->
    clearInterval(@interval)

  genLocation: (locName) ->
    name: locName,
    coords: [_.random(0, @props.map_size), _.random(0, @props.map_size)]
    sights: _.sample(SIGHT_NAMES, @props.sights_per_location)
    destinations: []

  genLocations: ->
    locations = (@genLocation(x) for x in LOCATION_NAMES)

    for l in locations
      l.destinations = (
        {
        name: x.name
        price: Math.floor(distance(l.coords, x.coords) * @props.travel_price_multiplier)
        wear: Math.floor(distance(l.coords, x.coords) * @props.wear_per_day)
        } for x in locations when l.name isnt x.name
      )

    locations

  handleStatsChange: (statsChange) =>
    @setState(
      (prevState) ->
        result = {}
        if prevState.cash < 0 - statsChange.cash
          alert 'not enough cash'
          return false
        for stat, epsilon of statsChange
          newValue = prevState[stat] + epsilon
          if stat in ['health', 'hunger', 'energy']
            if newValue > 100
              newValue = 100
            else if newValue < 0
              newValue = 0
          result[stat] = newValue
        result
    )

  handleTravel: (destination) =>
    location = _.find @locations, (x) -> x.name == destination.name
    @handleStatsChange
      cash: 0 - destination.price
      energy: 0 - destination.wear
      ts: moment.duration(1, 'day').asSeconds()
    @setState
      currentLocation: location

  actionButton: (caption, callback, config = {}) ->
    cfg = _.extend({glyph: null, style: 'default'}, config)
    c = if cfg.glyph == null then caption else "<span class='glyphicon glyphicon-#{cfg.glyph}'></span> #{caption}"
    p {key: caption},
      button
        className: "btn btn-#{cfg.style}"
        dangerouslySetInnerHTML: {__html: c}
        onClick: callback

  eatButton: (name, type) ->
    @actionButton "#{name} ($#{@props.eat[type].price})",
      () => @handleStatsChange
        health: @props.eat[type].heal
        cash: 0 - @props.eat[type].price
      {glyph: 'cutlery'}

  sleepButton: (name, type) ->
    @actionButton "#{name} ($#{@props.sleep[type].price})",
      () => @handleStatsChange
        health: @props.sleep[type].heal
        cash: 0 - @props.sleep[type].price
        energy: @props.sleep[type].energy
        ts: moment.duration(1, 'day').asSeconds()
      {glyph: 'bed'}

  seeButton: (name) ->
    @actionButton name,
      () => @handleStatsChange
        cash: @props.selfie_prize
        energy: 0 - @props.selfie_wear
        ts: moment.duration(1, 'day').asSeconds()
      {glyph: 'picture'}

  render: ->
    div {},
      h1 {}, "Ruritania"
      div {className: 'row'},
        div {className: 'col-md-8'},
          h2 {style: {marginBottom: 50}}, @state.currentLocation.name

# = travel ui
          div {className: 'row'},
            div {className: 'col-md-3'},
              h3 {}, 'Eat'
              @eatButton 'Street food', 'street'
              @eatButton 'Junk food', 'junk'
              @eatButton 'In a restaurant', 'restaurant'
            div {className: 'col-md-3'},
              h3 {}, 'Sleep'
              @sleepButton 'In a park', 'park'
              @sleepButton 'In a hostel', 'hostel'
              @sleepButton 'In a hotel', 'hotel'
            div {className: 'col-md-6'},
              h3 {}, 'See'
              _.map @state.currentLocation.sights, (sight) =>
                @seeButton "The #{sight} of #{@state.currentLocation.name}"

          div {className: 'row'},
            table {className: 'table table-hover table-condensed', id: 'travelTable', style: {marginTop: '100px'}},
              tbody {},
                _.map @state.currentLocation.destinations, (dest) =>
                  tr({key: dest.name},
                    td {}, dest.name
                    td {}, "$#{dest.price}"
                    td {}, @actionButton 'Travel',
                      () =>
                        @handleTravel dest,
                          {glyph: 'plane'})

        playerPanel @state

# ================================

class PlayerPanel extends React.Component

  progressBar: (value, max, style = 'default') ->
    percent = max / 100.0 * value
    div {className: 'progress'},
      div {
        className: "progress-bar progress-bar-#{style}"
        style: {width: "#{percent}%"}
      }, value

  render: ->
    div {className: 'col-md-4', id: 'playerPanel'},
      h2 {}, 'Player'
      table {className: 'table'},
        tbody {},
          tr {},
            td {}, 'Health'
            td {}, @progressBar(@props.health, 100, 'success')
          tr {},
            td {}, 'Hunger'
            td {}, @progressBar(@props.hunger, 100, 'danger')
          tr {},
            td {}, 'Energy'
            td {}, @progressBar(@props.energy, 100, 'info')
          tr {},
            td {}, 'Cash'
            td {}, "$#{@props.cash}"
          tr {},
            td {}, 'Date'
            td {}, moment(@props.ts * 1000).format('HH:mm MMM Do, YYYY')

playerPanel = React.createFactory(PlayerPanel)

# ================================

# == Main

React.render(
  React.createElement(GameUI, TRAVEL_CONFIG),
  document.getElementById 'content'
)
