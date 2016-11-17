/**
    Copyright 2016 Kidite LLC. All Rights Reserved.

    Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at

        http://aws.amazon.com/apache2.0/

    or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
*/

var APP_ID = undefined;//replace with 'amzn1.echo-sdk-ams.app.[your-unique-value-here]';

var http = require('http'),
    alexaDateUtil = require('./alexaDateUtil');

var AlexaSkill = require('./AlexaSkill');

var calendar = {"2016-10-31":"4","2016-11-01":"5","2016-11-02":"6","2016-11-03":"7","2016-11-04":"8","2016-11-07":"1","2016-11-10":"2","2016-11-11":"3","2016-11-14":"4","2016-11-15":"5","2016-11-16":"6","2016-11-17":"7","2016-11-18":"8","2016-11-21":"1","2016-11-22":"Special","2016-11-28":"2","2016-11-29":"3","2016-11-30":"4","2016-12-01":"5","2016-12-02":"6","2016-12-05":"7","2016-12-06":"8","2016-12-07":"1","2016-12-08":"2","2016-12-09":"3","2016-12-12":"4","2016-12-13":"5","2016-12-14":"6","2016-12-15":"7","2017-01-03":"8","2017-01-04":"1","2017-01-05":"2","2017-01-06":"3","2017-01-09":"4","2017-01-10":"5","2017-01-11":"6","2017-01-12":"7","2017-01-13":"8","2017-01-17":"1","2017-01-18":"2","2017-01-19":"3","2017-01-20":"4","2017-01-23":"5","2017-01-24":"6","2017-01-25":"7","2017-01-26":"8","2017-01-27":"1","2017-01-30":"2","2017-01-31":"3","2017-02-01":"4","2017-02-02":"5","2017-02-03":"6","2017-02-06":"7","2017-02-07":"8","2017-02-08":"1","2017-02-09":"2","2017-02-10":"3","2017-02-13":"4","2017-02-14":"5","2017-02-15":"6","2017-02-16":"7","2017-02-17":"8","2017-02-21":"1","2017-02-22":"2","2017-02-23":"3","2017-02-24":"4","2017-02-27":"5","2017-02-28":"6","2017-03-01":"7","2017-03-06":"8","2017-03-07":"1","2017-03-08":"2","2017-03-09":"3","2017-03-10":"4","2017-03-13":"5","2017-03-14":"6","2017-03-15":"7","2017-03-16":"8","2017-03-17":"1","2017-04-03":"2","2017-04-04":"3","2017-04-05":"4","2017-04-06":"5","2017-04-07":"6","2017-04-10":"7","2017-04-12":"8","2017-04-13":"1","2017-04-17":"2","2017-04-18":"3","2017-04-19":"4","2017-04-20":"5","2017-04-21":"6","2017-04-24":"7","2017-04-25":"8","2017-04-26":"1","2017-04-27":"2","2017-04-28":"3","2017-05-01":"4","2017-05-02":"5","2017-05-03":"6","2017-05-04":"7","2017-05-05":"8","2017-05-08":"1","2017-05-09":"2","2017-05-10":"3","2017-05-11":"4","2017-05-12":"5","2017-05-15":"6","2017-05-16":"7","2017-05-17":"8","2017-05-18":"1","2017-05-19":"2","2017-05-22":"3","2017-05-23":"4","2017-05-24":"5","2017-05-25":"6","2017-05-26":"7","2017-05-30":"8","2017-05-31":"1","2017-06-01":"2","2017-06-02":"3","2017-06-05":"4","2017-06-06":"5","2017-06-07":"6","2017-06-08":"7","2017-06-09":"8","2017-06-12":"1","2017-06-13":"2"};


var MenuTeller = function () {
    AlexaSkill.call(this, APP_ID);
};

// Extend AlexaSkill
MenuTeller.prototype = Object.create(AlexaSkill.prototype);
MenuTeller.prototype.constructor = MenuTeller;

// ----------------------- Override AlexaSkill request and intent handlers -----------------------

MenuTeller.prototype.eventHandlers.onSessionStarted = function (sessionStartedRequest, session) {
    console.log("onSessionStarted requestId: " + sessionStartedRequest.requestId
        + ", sessionId: " + session.sessionId);
    // any initialization logic goes here
};

MenuTeller.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
    console.log("onLaunch requestId: " + launchRequest.requestId + ", sessionId: " + session.sessionId);
    handleWelcomeRequest(response);
};

MenuTeller.prototype.eventHandlers.onSessionEnded = function (sessionEndedRequest, session) {
    console.log("onSessionEnded requestId: " + sessionEndedRequest.requestId
        + ", sessionId: " + session.sessionId);
    // any cleanup logic goes here
};

/**
 * override intentHandlers to map intent handling functions.
 */
MenuTeller.prototype.intentHandlers = {
    "OneshotChefIntent": function (intent, session, response) {
        handleOneshotMenuRequest(intent, session, response);
    },

    "DialogChefIntent": function (intent, session, response) {
        // Determine if this turn is for course, for date, or an error.
        // We could be passed slots with values, no slots, slots with no value.
        var courseSlot = intent.slots.Course;
        var dateSlot = intent.slots.Date;
        if (courseSlot && courseSlot.value) {
            handleCourseDialogRequest(intent, session, response);
        } else if (dateSlot && dateSlot.value) {
            handleDateDialogRequest(intent, session, response);
        } else {
            handleNoSlotDialogRequest(intent, session, response);
        }
    },

    "SupportedCoursesIntent": function (intent, session, response) {
        handleSupportedCoursesRequest(intent, session, response);
    },

    "AMAZON.HelpIntent": function (intent, session, response) {
        handleHelpRequest(response);
    },

    "AMAZON.StopIntent": function (intent, session, response) {
        var speechOutput = "Goodbye";
        response.tell(speechOutput);
    },

    "AMAZON.CancelIntent": function (intent, session, response) {
        var speechOutput = "Goodbye";
        response.tell(speechOutput);
    }
};

function handleWelcomeRequest(response) {
    var whichMenuPrompt = "Which day would you like the menu for?",
        speechOutput = {
            speech: "<speak>Welcome to Chef Bridgette's Menu Assistant. "
                + whichMenuPrompt
                + "</speak>",
            type: AlexaSkill.speechOutputType.SSML
        },
        repromptOutput = {
            speech: "I can get you the cafeteria menu for "
                + "any school day from the current week. "
                + "You can also ask me for specific courses for a particular day, such as soup, entree, sides, and vegan option. "
                + "You could say what's for lunch on Friday. Or what's "
                + "the entree tomorrow. You can also say exit. "
                + whichMenuPrompt,
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
        };

    response.ask(speechOutput, repromptOutput);
}

function handleHelpRequest(response) {
    var repromptText = "Which day would you like the menu for?";
    var speechOutput = "I can get you the cafeteria menu for "
                + "any school day from the current week. "
                + "You can also ask me for specific courses for a particular day, such as soup, entree, sides, and vegan option. "
                + "You could say what's for lunch on Friday. Or you "
                + "could say exit. "
        + repromptText;

    response.ask(speechOutput, repromptText);
}

/**
 * Handles the case where the user asked or for, or is otherwise being with supported courses. 
 */
function handleSupportedCoursesRequest(intent, session, response) {
    // get course re-prompt
    var repromptText = "Which course would you like information for?";
    var speechOutput = "I can look up information for soups, entrees, sides, and the vegan option. You can say all for the whole menu. "
        + repromptText;

    response.ask(speechOutput, repromptText);
}

/**
 * Handles the dialog step where the user provides a course
 */
function handleCourseDialogRequest(intent, session, response) {

    var courseSelection = getCourseSelectionFromIntent(intent, false),
        repromptText,
        speechOutput;

    if (courseSelection.error) {
        repromptText = "I can get the full menu or just courses including soup, entree, sides, and vegan option. Or all the courses if you say all.";
        // if we received a value for the incorrect course, repeat it to the user, otherwise we received an empty slot
        speechOutput = courseSelection.course ? "I'm sorry, I don't have any info for " + courseSelection.course + ". " + repromptText : repromptText;
        response.ask(speechOutput, repromptText);
        return;
    }

    // if we don't have a date yet, go to date. If we have a date, we perform the final request
    if (session.attributes.date) {

        var date = session.attributes.date;
        var day = new Date(session.attributes.date.date); 

        if (date && !isSchoolDay(date)) {
            repromptText = "You can to get a menu for another day, a school day.";
            speechOutput = "I'm sorry, but " + date.displayDate + " is not a school day and you are on your own for lunch. " + repromptText;
            response.ask(speechOutput, repromptText);
            return;
        }

        if (date && !isCurrentWeek(day)) {
            repromptText = "Would you like to know what's for lunch one day this week? ";
            speechOutput = "I'm sorry, but I only have menu information for the current week. The menu updates on Sunday. " + repromptText;
            response.ask(speechOutput, repromptText);
            return;
        }

        getFinalMenuResponse(courseSelection, session.attributes.date, response);
    } else {
        // set course in session and prompt for date
        session.attributes.course = courseSelection;
        speechOutput = "For which date?";
        repromptText = "For which date would you like " + courseSelection.course + " information?";

        response.ask(speechOutput, repromptText);
    }
}

/**
 * Handles the dialog step where the user provides a date
 */
function handleDateDialogRequest(intent, session, response) {

    var date = getDateFromIntent(intent),
        repromptText,
        speechOutput;
    var day = new Date(date.date); 
    if (!date) {
        repromptText = "Please try again saying a day of the week, for example, Monday. "
            + "For which date would you like menu information?";
        speechOutput = "I'm sorry, I didn't understand that date. " + repromptText;

        response.ask(speechOutput, repromptText);
        return;
    }

    // test here isSchoolDay? 
    if (date && !isSchoolDay(date)) {
        repromptText = "You can to get a menu for another day, a school day.";
        speechOutput = "I'm sorry, but " + date.displayDate + " is not a school day and you are on your own for lunch. " + repromptText;
        response.ask(speechOutput, repromptText);
        return;
    }

    if (date && !isCurrentWeekFromIntent(date)) {
        repromptText = "Would you like to know what's for lunch one day this week? ";
        speechOutput = "I'm sorry, but I only have menu information for the current week. The menu updates on Sunday. " + repromptText;
        response.ask(speechOutput, repromptText);
        return;
    }
    
    // if we don't have a course yet, go to course. If we have a course, we perform the final request.
    if (session.attributes.course) {
        getFinalMenuResponse(session.attributes.course, date, response);
    } else {
        // The user provided a date out of turn. Set date in session and prompt for city
        session.attributes.date = date;
        speechOutput = "Which course on " + date.displayDate + "? You can also say all.";
        repromptText = "For which course?";

        response.ask(speechOutput, repromptText);
    }
}

/**
 * Handle no slots, or slot(s) with no values.
 * In the case of a dialog based skill with multiple slots,
 * when passed a slot with no value, we cannot have confidence
 * it is the correct slot type so we rely on session state to
 * determine the next turn in the dialog, and reprompt.
 */
function handleNoSlotDialogRequest(intent, session, response) {
    if (session.attributes.course) {
        // get date re-prompt
        var repromptText = "Please try again saying a day of the week, for example, Monday. ";
        var speechOutput = repromptText;

        response.ask(speechOutput, repromptText);
    } else {
        // get city re-prompt
        handleSupportedCoursesRequest(intent, session, response);
    }
}

/**
 * This handles the one-shot interaction, where the user utters a phrase like:
 * 'Alexa, ask Chef Bridgette what's for lunch on Friday?'.
 * If there is an error in a course or date slot, this will guide the user to the dialog approach.
 */
function handleOneshotMenuRequest(intent, session, response) {

    // Determine course, using default if none provided
    var courseSelection = getCourseSelectionFromIntent(intent, true),
        repromptText,
        speechOutput;
    if (courseSelection.error) {
        // invalid course. move to the dialog
        repromptText = "I can find course information for soup, entree, sides, and vegan option. Or all courses for the full menu. " 
            + "Which course would you like information for?";
        // if we received a value for the incorrect course, repeat it to the user, otherwise we received an empty slot
        speechOutput = courseSelection.course ? "I'm sorry, I don't have any data for " + courseSelection.course + ". " + repromptText : repromptText;

        response.ask(speechOutput, repromptText);
        return;
    }

    // Determine custom date
    var date = getDateFromIntent(intent);
    if (!date) {
        // Invalid date. set course in session and prompt for date
        session.attributes.course = courseSelection;
        repromptText = "Please try again saying a day of the week, for example, Monday. "
            + "For which date would you like menu information?";
        speechOutput = "I'm sorry, I didn't understand that date. " + repromptText;

        response.ask(speechOutput, repromptText);
        return;
    }

    if (date && !isSchoolDay(date)) {
        repromptText = "You can to get a menu for another day, a school day.";
        speechOutput = "I'm sorry, but " + date.displayDate + " is not a school day and you are on your own for lunch. " + repromptText;
        response.ask(speechOutput, repromptText);
        return;
    }

    if (date && !isCurrentWeekFromIntent(date)) {
        repromptText = "Would you like to know what's for lunch one day this week? ";
        speechOutput = "I'm sorry, but I only have menu information for the current week. The menu updates on Sunday. " + repromptText;
        response.ask(speechOutput, repromptText);
        return;
    }
    
    // all slots filled, either from the user or by default values. Move to final request

    getFinalMenuResponse(courseSelection, date, response);
}

/**
 * Both the one-shot and dialog based paths lead to this method to issue the request, and
 * respond to the user with the final answer.
 */
function getFinalMenuResponse(courseSelection, date, response) {

    // Issue the request, and respond to the user
    makeMenuRequest(courseSelection.course, date, function menuResponseCallback(err, menuResponse) {
        var speechOutput = "For " + date.displayDate + ", day number " + calendar[date.requestDateParam] + ". ";

        if (err) {
            speechOutput = "Sorry, something funky is happening with the menu. Please try again later.";
        } else if (courseSelection.course == "all" ) {
            speechOutput += menuResponse.all;
        } else if (courseSelection.course == "soup") {
            speechOutput += menuResponse.soup; 
        } else if (courseSelection.course == "entree") {
            speechOutput += menuResponse.entree; 
        } else if (courseSelection.course == "sides") {
            speechOutput += menuResponse.side; 
        } else if (courseSelection.course == "vegan" || courseSelection.course == "vegan option") {
            speechOutput += menuResponse.vegan; 
        } else if (courseSelection.course == "day" || courseSelection.course == "day number") {
            speechOutput = "For " + date.displayDate + ", the day number is " + calendar[date.requestDateParam] + ". Have a great day at school! "; 
        } else {
            speechOutput += menuResponse.all;
        }

        response.tellWithCard(speechOutput, "MenuTeller", speechOutput)
    });
}


function makeMenuRequest(course, date, menuResponseCallback) {

    var endpoint = "http://secret-atoll-35147.herokuapp.com/menus/";
    var queryString = date.requestDateParam;
        queryString += '.json';



    http.get(endpoint + queryString, function (res) {
        var menuResponseString = '';
        console.log('Status Code: ' + res.statusCode);

        if (res.statusCode != 200) {
            menuResponseCallback(new Error("Non 200 Response"));
        }

        res.on('data', function (data) {
            menuResponseString += data;
        });

        res.on('end', function () {
            var menuResponseObject = JSON.parse(menuResponseString);

            if (menuResponseObject.error) {

                console.log("MENU error: " + menuResponseObject.error.message);
                menuResponseCallback(new Error(menuResponseObject.error.message));
            }  else {

                var menu = assembleMenu(menuResponseObject);
                menuResponseCallback(null, menu);
            }
        });
    }).on('error', function (e) {
        console.log("Communications error: " + e.message);
        menuResponseCallback(new Error(e.message));
    });
}

/**
 * Parsing the menu object and assembling strings, plural or singular syntax. 
 */

function assembleMenu(menuResponseObj) {

    var s, e, sd, v; 
    var all_string = ""; 
    var soup_string = "";
    var entree_string = "";
    var side_string = "";
    var vegan_string = ""; 


    if (menuResponseObj.soups[0].name) {
        if (menuResponseObj.soups.length > 1) {
            soup_string = "The soups are "
            for (var i = 0; i < menuResponseObj.soups.length; i++) {
              soup_string += menuResponseObj.soups[i].name;
              soup_string += " ";
              if (i == menuResponseObj.soups.length - 2) {
                soup_string += "and ";
              }
            };
        soup_string += ". ";
        } else {
            soup_string = "The soup is " + menuResponseObj.soups[0].name + ". "; 
        }
    } 

    if (menuResponseObj.entrees[0].name) {
        if (menuResponseObj.entrees.length > 1) {
            entree_string = "The entrees are "
            for (var i = 0; i < menuResponseObj.entrees.length; i++) {
              entree_string += menuResponseObj.entrees[i].name;
              entree_string += " ";
              if (i == menuResponseObj.entrees.length - 2) {
                entree_string += "and ";
              };
            } 
        entree_string += ". ";
        } else {
            entree_string = "The entree is " + menuResponseObj.entrees[0].name + ". "; 
        }
    } 

    if (menuResponseObj.sides[0].name) {
        if (menuResponseObj.sides.length > 1) {
            side_string = "The sides are "
            for (var i = 0; i < menuResponseObj.sides.length; i++) {
              side_string += menuResponseObj.sides[i].name;
              side_string += " ";
              if (i == menuResponseObj.sides.length - 2) {
                side_string += "and ";
              }
            };
            side_string += ". ";
        } else {
            side_string = "The side is " + menuResponseObj.sides[0].name + ". "; 
        }
    } 

    if (menuResponseObj.vegans[0].name) {
        if (menuResponseObj.vegans.length > 1) {
            vegan_string = "The vegan options are "
            for (var i = 0; i < menuResponseObj.vegans.length; i++) {
              vegan_string += menuResponseObj.vegans[i].name;
              vegan_string += " ";
              if (i == menuResponseObj.vegans.length - 2) {
                vegan_string += "and ";
              }
            };
            vegan_string += ". ";
        } else {
            vegan_string = "The vegan option is " + menuResponseObj.vegans[0].name + ". "; 
        }
    } 

    all_string = soup_string + " " + entree_string + " " + side_string + " " + vegan_string; 


    return {
        soup: soup_string, entree: entree_string, side: side_string, vegan: vegan_string, all: all_string
    }
}


/**
 * Gets the course from the intent, or returns an error
 */
function getCourseSelectionFromIntent(intent, assignDefault) {

    var courseSlot = intent.slots.Course;
    // slots can be missing, or slots can be provided but with empty value.
    // must test for both.
    if (!courseSlot || !courseSlot.value) {
        if (!assignDefault) {
            return {
                error: true
            }
        } else {
            // Defaulting to all courses, when no explicit course intent.
            return {
                course: 'all',
            }
        }
    } else {

        // lookup the course. 
        var courseName = courseSlot.value;
        return {
                course: courseName
            }
    }
}

/**
 * Gets the date from the intent, defaulting to today if none provided,
 * or returns an error
 */
function getDateFromIntent(intent) {

    var dateSlot = intent.slots.Date;

    var date = new Date();
    var current_hour = date.getHours();
    // slots can be missing, or slots can be provided but with empty value.
    // must test for both.
    if (!dateSlot || !dateSlot.value && current_hour < 21) {
        // date defaults to today  
        date = new Date();

    } else if (!dateSlot || !dateSlot.value && current_hour > 21) {
        // date defaults to tomorrow - since its after 4pm est utc + 4
        date.setDate(date.getDate() + 1);
        //date = new Date();


    } else {

        date = new Date(dateSlot.value);

    }
    // format the request date like YYYY-MM-DD. For API and calendar hash.
    var month = (date.getMonth() + 1);
    month = month < 10 ? '0' + month : month;
    var dayOfMonth = date.getDate();
    dayOfMonth = dayOfMonth < 10 ? '0' + dayOfMonth : dayOfMonth;
    var requestDay = date.getFullYear() + '-' + month + '-' + dayOfMonth;


    return {
        date: date, 
        displayDate: alexaDateUtil.getFormattedDate(date),
        requestDateParam: requestDay
    }
}

// function to return day number if its a school day or false

function isSchoolDay(date) {

    if (calendar[date.requestDateParam]) {
        dayNumber = calendar[date];
        return {
            dayNumber
        }
    } else {
         return false; 
    }
};


function isCurrentWeek(date) {

    var curr = new Date;
    var firstday = new Date(curr.setDate(curr.getDate() - curr.getDay()));
    var lastday = new Date(curr.setDate(curr.getDate() - curr.getDay()+5));

    if (date > firstday && date < lastday) {
        return true;
    } else {
         return false; 
    }
};

function isCurrentWeekFromIntent(date) {

    var curr = new Date;
    var firstday = new Date(curr.setDate(curr.getDate() - curr.getDay()));
    var lastday = new Date(curr.setDate(curr.getDate() - curr.getDay()+5));

    if (date.date > firstday && date.date < lastday) {
        return true;
    } else {
         return false; 
    }
};

// Create the handler that responds to the Alexa Request.
exports.handler = function (event, context) {
    var menuTeller = new MenuTeller();
    menuTeller.execute(event, context);
};

