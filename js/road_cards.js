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

  // Card play definitions
  const cards_in_stack = 4;

  const icon_translator = {
    none: 'noun_ellipsis_150426.png',
    Insec: 'noun_droplets_421424.png',
    Break: 'noun_explosion_777697.png',
    Exh: 'noun_sleep_1594499.png',
    '+Dice': 'noun_Dice_1647827.png',
    StepUp: 'noun_Up Up_3797452.png',
    "Driver's choice": 'noun_direction_4139407.png',
  };
  const alt_translator = {
    none: 'No effect',
    Insec: 'Step up Insecurity',
    Break: 'Step up Breakdown',
    Exh: 'Step up Exhaustion',
    '+Dice': 'Add die to the Emergency',
    StepUp: 'Step up an Emergency die',
    "Driver's choice": "Driver's choice",
  };

  class Card {
    constructor(card_object) {
      this.name = card_object.name;
      this.effect = card_object.effect;
      this.flavor_text = card_object.flavor_text;
      this.image = card_object.image; // filename without folder
      this.number = card_object.number; // index
      this.logo = card_object.logo; // only shown on blank cards
    }
  }

  let blankCard = new Card({
    name: '',
    effect: '',
    flavor_text: '',
    image: '',
    number: '-1',
    logo: 'MonAm_Logo_rotated.png'
  });

  // Arrays of Cards
  let all_cards = [];
  let stack = [];
  let discards = [];

  const offset = 5;

  // returns a number
  function getCurrentCard() {
    let current_card_html = $('.current_card .card');
    return Number(current_card_html.attr('data-number'));
  }

  function cardHTML(card) {
    // console.debug('Get HTML for...');
    // console.debug(card);

    let c = $('<div>');
    c.addClass('card');
    c.attr('data-number', card.number);

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

    if(card.logo){
      let i = $('<img>');
      i.attr('src', image_folder + '/' + card.logo);
      i.attr('alt', 'Blank card');
      i.addClass('blank_card');
      imgdiv.append(i);
    }

    let t = $('<p>');
    t.text(card.flavor_text);
    txtdiv.append(t);

    if(card.effect !== ''){
      let e = $('<p>');
      e.text(alt_translator[card.effect]);
      let icon = $('<img>');
      icon.attr('src', 'card_images/' + icon_translator[card.effect]);
      icon.attr('alt', alt_translator[card.effect]);
      e.append(icon);
      icondiv.append(e);
    }

    return c;
  }

  function displayCard(card, location) {
    $(location).empty();
    $(location).append(cardHTML(card));
  }

  function addCard(card, location) {
    $(location).append(cardHTML(card));
  }

  function stackForward(){
    // console.debug('move stack forward');
    // If there's no stack left, we can't go back and we're done.
    if(stack.length === 0){
      return false;
    }

    // Move the current card into discard,
    let current_card = all_cards[getCurrentCard()];
    discards.push(current_card);
    addCard(current_card, DISCARD);

    // Put the top card of the stack into the current card slot.
    let new_card = stack.pop();
    displayCard(new_card, CURRENT);

    // Remove the image of the top card on the stack.
    $(CARDSTACK + ' > div:visible:last').hide();

    // Position the center card appropriately.
    let cards_left = $(CARDSTACK).children().length;
    let old_width = Number($(CURRENT).css('width').slice(0, -2));
    $(CARDSTACK).css('width', String(old_width + offset * cards_left) + "px");

    // Spread out the discards so we can see all of them.
    spreadCards(DISCARD);

    console.log(stack);
    console.log(discards);
  }

  function stackBack(){
    // console.debug('move stack back');
    // If there's no discard, we can't go back and we're done.
    if(discards.length === 0){
      return false;
    }

    // Put the current card back on top of the stack.
    let current_card = all_cards[getCurrentCard()];
    stack.push(current_card);
    $(CURRENT).empty();
    // Show that the card's back on the stack.
    $(CARDSTACK + ' > div:hidden:first').show();

    // Move the top card of the discard into the current card slot.
    let old_card = discards.pop();
    $(DISCARD + ' > :last').remove();
    displayCard(old_card, CURRENT);

    // Position the center card appropriately.
    let cards_left = $(CARDSTACK).children().length;
    let old_width = Number($(CURRENT).css('width').slice(0, -2));
    $(CARDSTACK).css('width', String(old_width + offset * cards_left) + "px");

    // Spread out the discards so we can see all of them.
    spreadCards(DISCARD);

    console.log(stack);
    console.log(discards);
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

    // keyboard controls
    document.addEventListener('keydown', function(e){
      // right arrow = next card
      if (e.key === "ArrowRight") {
        stackForward();
      }
      // left arrow = go back one card
      else if (e.key === 'ArrowLeft') {
        stackBack();
      }
    });

    // visible controls
    let controlbox = $('.controls');

    let back = $('<button>');
    back.addClass('back_button');
    back.html('&#8592; Go back');
    controlbox.append(back);

    let draw = $('<button>');
    draw.addClass('draw_button');
    draw.html('Draw card &#8594;');
    controlbox.append(draw);

    let reset = $('<button>');
    reset.addClass('reset_button');
    reset.html('Reset &#8634;');
    controlbox.append(reset);
    reset.on('click', function(){
      window.location.reload(true);
    });

    // Draw when we click on a draw button or on the card stack.
    let draw_controls = $('.draw_button, ' + CARDSTACK);
    draw_controls.on('click', function(){stackForward();});

    // Go back when we click on a back button or the discards.
    let back_controls = $('.back_button, ' + DISCARD);
    back_controls.on('click', function(){stackBack();});


    // Debug Controls
    /*
    let show_all = $('<button>');

    show_all.addClass('show_all');
    show_all.text('Show all cards');

    controlbox.append("<br/><br/>");
    controlbox.append('Debug Controls:');
    controlbox.append("<br/>");
    controlbox.append(show_all);

    let show_all = $('.show_all');
    show_all.on('click', function(){
      console.debug('show all cards');
      $('body').append('<div class="showall"></div>');
      for(i=0; i < all_cards.length; i++){
        $('.showall').append(cardHTML(all_cards[i]));
      }
    });
    */
  }

  // Makes the draw pile, which is an array of cards.
  function buildStack() {
    let new_stack = [];
    let temp_cards = all_cards.slice();
    // Card 0 is the hospital, remove it. We shuffle it in later.
    temp_cards.splice(0,1);

    console.log(temp_cards);

    // Make an array of (cards_in_stack + 3) cards.
    for (let i = 0; i < cards_in_stack + 3; i++) {
      console.log(temp_cards.length);
      let j = Math.floor(Math.random() * temp_cards.length);
      console.log(j);
      console.log(temp_cards[j]);
      // Take the jth card out of temp_cards and put it on the stack.
      new_stack.push(temp_cards.splice(j, 1)[0]);
    }

    // Shuffle the hospital into the last 4 cards.
    // Reminder: this is a stack, "last 4" is spots 0-3.
    let cardspot = Math.floor(Math.random() * 4);
    new_stack.splice(cardspot, 0, all_cards[0]);

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
    // console.debug(display_stack);

    // Spread the cards just a little.
    display_stack.forEach(function(e, i){
      e.css('position', "absolute");
      e.css('top', String(offset * i) + "px");
      e.css('left', String(offset * i) + "px");
      e.addClass('blank_card');
    });
    display_stack.forEach(function(e, i){
      $(CARDSTACK).append(e);
    });

    spreadCards(CARDSTACK);

    // Move the center card over so we can see it.
    let old_width = Number($(CURRENT).css('width').slice(0, -2));
    $(CARDSTACK).css('width', String(old_width + offset * display_stack.length) + "px");

  }



  // TODO: Function for saving a card for later use.
  // TODO: Function for backing up one card - current to stack, discard to current.
  // TODO: Function for looking at the discard stack.

  async function readyGo() {
    all_cards = await loadCards(card_data_file);
    console.debug(all_cards);

    setUpControls();
    stack = buildStack();
    console.debug();
    displayCard(stack.pop(), CURRENT);
    showStack();
  }

  readyGo();
});
