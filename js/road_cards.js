/*jshint esversion: 8 */

$(document).ready(function () {
  'use strict';

  // Folders
  const image_folder = 'card_images';
  const card_data_file = 'card_data.csv';
  const data_path = 'data';

  // DOM locations
  const CARDSTACK = '.card_stack';
  const CURRENT = '.current_card';
  const DISCARD = '.discards';

  const icon_translator = {
    none: 'noun_ellipsis_150426.png',
    Insec: 'noun_droplets_421424.png',
    Break: 'noun_explosion_777697.png',
    Exh: 'noun_sleep_1594499.png',
    'Doom+': 'noun_Dice_1647827.png',
    DoomUp: 'noun_Up Up_3797452.png',
    "Driver's choice": 'noun_direction_4139407.png',
  };
  const alt_translator = {
    none: 'No effect',
    Insec: 'Insecurity steps up',
    Break: 'Breakdown steps up',
    Exh: 'Exhaustion steps up',
    'Doom+': 'Add d6 to Crisis pool',
    DoomUp: 'One Crisis die steps up',
    "Driver's choice": "Driver's choice",
  };

  class Card {
    constructor(card_object) {
      this.name = card_object.name;
      this.effect = card_object.effect;
      this.flavor_text = card_object.flavor_text;
      this.image = card_object.image; // filename without folder
      this.number = card_object.number; // index
    }
  }

  let blankCard = new Card({
    name: 'Monster Ambulance',
    effect: '',
    flavor_text: '',
    image: '',
    number: '-1',
  });

  // Arrays of Cards
  let all_cards = [];
  let stack = [];
  let discards = [];

  let cards_in_stack = 8;
  const offset = 3;

  // returns a number
  function getCurrentCard() {
    let current_card_html = $('.current_card .card');
    return current_card_html.attr('data-number');
  }

  function cardHTML(card) {
    // console.debug('Get HTML for...');
    // console.debug(card);

    let c = $('<div>');
    c.addClass('card');
    c.attr('data-number', card.number);
    c.css('background-color','white');

    let hdiv = $('<div>');
    hdiv.addClass('header_div');
    hdiv.attr('aria-live', 'polite');
    let imgdiv = $('<div>');
    imgdiv.addClass('image_div');
    let txtdiv = $('<div>');
    txtdiv.addClass('text_div');
    let icondiv = $('<div>');
    icondiv.addClass('icon_div');
    icondiv.attr('aria-live', 'polite');

    c.append(hdiv);
    c.append(imgdiv);
    c.append(txtdiv);
    c.append(icondiv);

    let h = $('<h2>');
    h.text(card.name);
    hdiv.append(h);

    if(card.image !== ''){
      let i = $('<img>');
      i.attr('src', image_folder + '/' + card.image);
      i.attr('alt', '');
      imgdiv.append(i);
    }

    let t = $('<p>');
    t.text(card.flavor_text);
    txtdiv.append(t);

    if(card.effect !== ''){
      let e = $('<p>');
      let icon = $('<img>');
      icon.attr('src', 'card_images/' + icon_translator[card.effect]);
      icon.attr('alt', alt_translator[card.effect]);
      e.append(icon);
      icondiv.append(e);
    }

    return c;
  }

  function changeCard(card, location) {
    $(location).empty();
    $(location).append(cardHTML(card));
  }

  function addCard(card, location) {
    $(location).append(cardHTML(card));
  }

  // Loads card data from CSV file
  function loadCards(filename) {
    console.debug('Loading card data.');
    return new Promise((resolve) => {
      // Adding random parameter to get around caching. No other effect.
      Papa.parse(data_path + '/' + filename + '?' + Math.random(), {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: function (results, file) {
          console.debug('results from CSV parser:');
          console.debug(results);

          let deck = [];

          for (let i = 0; i < results.data.length; i++) {
            let c = results.data[i];
            c.number = i;
            deck.push(new Card(results.data[i]));
          }
          resolve(deck);
        },
        error: function (error, file) {
          console.debug(error);
        },
      });
    });

  }

  function setUpControls() {
    let controlbox = $('.controls');

    function gotoNextCard(){
      // Move the current card (if there is one) to the discard.
      // Put the top card of the stack into the current slot.
      // Remove the top card from the draw pile.
    }
    function gotoPrevCard(){
      // Put the card in the current slot back on the draw pile.
      // Handle visuals
      // Handle data
      // Move the top card of the discard (if there is one) to the current slot.
    }

    // TODO: Add keyboard controls for...
    document.addEventListener('keydown', function(e){
      //   right arrow = next card
      if (e.key === "ArrowRight") {
        gotoNextCard();
      }
      //   left arrow = go back one card
      else if (e.key === 'ArrowLeft') {
        gotoPrevCard();
      }
    });

    // Regular controls
    let draw = $('<button>');
    draw.addClass('draw_button');
    draw.text('Draw card');
    controlbox.append(draw);



    // Debug Controls
    let left = $('<button>');
    let right = $('<button>');
    let show_all = $('<button>');

    left.addClass('prev_card');
    left.text('Prev Card');
    right.addClass('next_card');
    right.text('Next Card');
    show_all.addClass('show_all');
    show_all.text('Show all cards');

    controlbox.append("<br/><br/>");
    controlbox.append('Debug Controls:');
    controlbox.append("<br/>");
    controlbox.append(left);
    controlbox.append(right);
    controlbox.append(show_all);
  }

  // Makes the draw pile, which is an array of cards.
  function buildStack() {
    let new_stack = [];
    let temp_cards = all_cards.slice();
    // Card 0 is the hospital, we shuffle it in later.
    temp_cards.splice(0,1);

    console.log(temp_cards);

    // Make an array of (cards_in_stack + 3) cards.
    for (let i = 0; i < cards_in_stack + 3; i++) {
      let j = Math.floor(Math.random() * temp_cards.length) + 1;
      console.log(j);
      console.log(temp_cards[j]);
      // Take the jth card out of temp_cards and put it on the stack.
      new_stack.push(temp_cards.splice(j, 1)[0]);
    }

    // Shuffle the hospital into the last 4 cards.
    let cardspot = Math.floor(Math.random() * 4);
    new_stack.splice(new_stack.length - cardspot, 0, all_cards[0]);

    console.debug(new_stack);

    return new_stack;
  }

  // Visually spread cards so they look like a stack.
  function spreadCards(location){

    // Spread out the discard slightly
    $(location).children().each(function(i, e){
      $(e).css('position', "absolute");
      $(e).css('top', String(offset * i) + "px");
      $(e).css('left', String(offset * i) + "px");
    });

  }

  // Just shows a set of blank card backs.
  function showStack() {
    // Make a bunch of blank cards.
    let display_stack = Array.from({length:stack.length}).map(x => cardHTML(blankCard));
    console.debug(display_stack);

    // Spread the cards just a little.
    display_stack.forEach(function(e, i){
      e.css('position', "absolute");
      e.css('top', String(offset * i) + "px");
      e.css('left', String(offset * i) + "px");
    });
    display_stack.forEach(function(e, i){
      $(CARDSTACK).append(e);
    });

    spreadCards(CARDSTACK);

    // Move the center card over so we can see it.
    let old_width = Number($(CURRENT).css('width').slice(0, -2));
    $(CARDSTACK).css('width', String(old_width + offset * display_stack.length) + "px");

  }

  // Move the current card into discard, and put the top card of the
  // stack into the current card slot.
  function drawCard(){
    // console.debug('draw card');
    let current_card = all_cards[Number(getCurrentCard())];
    discards.push(current_card);
    let new_card = stack.pop();
    changeCard(new_card, CURRENT);
    addCard(current_card, DISCARD);
    $(CARDSTACK + ' > div:last-child').remove();
    let cards_left = $(CARDSTACK).children().length;

    // Move the center card over so we can see it.
    let old_width = Number($(CURRENT).css('width').slice(0, -2));
    $(CARDSTACK).css('width', String(old_width + offset * cards_left) + "px");

    spreadCards(DISCARD);

  }

  // TODO: Function for saving a card for later use.
  // TODO: Function for backing up one card - current to stack, discard to current.
  // TODO: Function for looking at the discard stack.

  function addListeners() {
    console.debug('Adding listeners');

    // Draw when we click on a draw button or on the card stack.
    let draw = $('.draw_button, ' + CARDSTACK);
    draw.on('click', function(){drawCard()});

    // Listeners for the debug controls
    let left = $('.prev_card');
    let right = $('.next_card');
    let i = Number(getCurrentCard());
    left.on('click', function () {
      console.debug('go previous');
      i = i - 1;
      if (i < 0) {
        i = all_cards.length - 1;
      }
      console.debug(i);
      changeCard(all_cards[i], CURRENT);
    });
    right.on('click', function () {
      console.debug('go next');
      i = i + 1;
      if (i + 1 > all_cards.length) {
        i = 0;
      }
      console.debug(i);
      changeCard(all_cards[i], CURRENT);
    });

    let show_all = $('.show_all');
    show_all.on('click', function(){
      console.debug('show all cards');
      $('body').append('<div class="showall"></div>');
      for(i=0; i < all_cards.length; i++){
        $('.showall').append(cardHTML(all_cards[i]));
      }
    });
  }

  async function readyGo() {
    all_cards = await loadCards(card_data_file);
    console.debug(all_cards);

    setUpControls();
    stack = buildStack();
    console.debug();
    changeCard(stack[0], CURRENT);
    showStack();
    addListeners();
  }

  readyGo();
});
