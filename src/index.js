/**
    Copyright 2014-2015 Amazon.com, Inc. or its affiliates. All Rights Reserved.

    Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at

        http://aws.amazon.com/apache2.0/

    or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
*/

/**
 * This sample shows how to create a Lambda function for handling Alexa Skill requests that:
 * - Web service: communicate with an external web service to get tide data from NOAA CO-OPS API (http://tidesandcurrents.noaa.gov/api/)
 * - Multiple optional slots: has 2 slots (city and date), where the user can provide 0, 1, or 2 values, and assumes defaults for the unprovided values
 * - DATE slot: demonstrates date handling and formatted date responses appropriate for speech
 * - Custom slot type: demonstrates using custom slot types to handle a finite set of known values
 * - Dialog and Session state: Handles two models, both a one-shot ask and tell model, and a multi-turn dialog model.
 *   If the user provides an incorrect slot in a one-shot model, it will direct to the dialog model. See the
 *   examples section for sample interactions of these models.
 * - Pre-recorded audio: Uses the SSML 'audio' tag to include an ocean wave sound in the welcome response.
 *
 * Examples:
 * One-shot model:
 *  User:  "Alexa, ask Tide Pooler when is the high tide in Seattle on Saturday"
 *  Alexa: "Saturday June 20th in Seattle the first high tide will be around 7:18 am,
 *          and will peak at ...""
 * Dialog model:
 *  User:  "Alexa, open Tide Pooler"
 *  Alexa: "Welcome to Tide Pooler. Which city would you like tide information for?"
 *  User:  "Seattle"
 *  Alexa: "For which date?"
 *  User:  "this Saturday"
 *  Alexa: "Saturday June 20th in Seattle the first high tide will be around 7:18 am,
 *          and will peak at ...""
 */

/**
 * App ID for the skill
 */
var APP_ID = undefined;//replace with 'amzn1.echo-sdk-ams.app.[your-unique-value-here]';

var http = require('http'),
    alexaDateUtil = require('./alexaDateUtil');

/**
 * The AlexaSkill prototype and helper functions
 */
var AlexaSkill = require('./AlexaSkill');

/**
 * TidePooler is a child of AlexaSkill.
 * To read more about inheritance in JavaScript, see the link below.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Introduction_to_Object-Oriented_JavaScript#Inheritance
 */
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
        // Determine if this turn is for city (course), for date, or an error.
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

// -------------------------- TidePooler Domain Specific Business Logic --------------------------


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
 * Handles the case where the user asked or for, or is otherwise being with supported cities. 
 */
function handleSupportedCoursesRequest(intent, session, response) {
    // get city (cr_ course) re-prompt
    var repromptText = "Which course would you like information for?";
    var speechOutput = "I can look up information for soups, entrees, sides, and the vegan option. "
        + repromptText;

    response.ask(speechOutput, repromptText);
}

/**
 * Handles the dialog step where the user provides a city
 */
function handleCourseDialogRequest(intent, session, response) {

    var courseSelection = getCourseSelectionFromIntent(intent, false),
        repromptText,
        speechOutput;
    if (courseSelection.error) {
        repromptText = "I can get the full menu or just courses including soup, entree, sides, and vegan option. Or all the courses if you say all.";
        // if we received a value for the incorrect city, repeat it to the user, otherwise we received an empty slot
        speechOutput = courseSelection.course ? "I'm sorry, I don't have any data for " + courseSelection.course + ". " + repromptText : repromptText;
        response.ask(speechOutput, repromptText);
        return;
    }

    // if we don't have a date yet, go to date. If we have a date, we perform the final request
    if (session.attributes.date) {
        getFinalMenuResponse(courseSelection, session.attributes.date, response);
    } else {
        // set city in session and prompt for date
        session.attributes.city = courseSelection;
        speechOutput = "For which date?";
        repromptText = "For which date would you like tide information for " + courseSelection.city + "?";

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
    if (!date) {
        repromptText = "Please try again saying a day of the week, for example, Saturday. "
            + "For which date would you like tide information?";
        speechOutput = "I'm sorry, I didn't understand that date. " + repromptText;

        response.ask(speechOutput, repromptText);
        return;
    }

    // if we don't have a city yet, go to city. If we have a city, we perform the final request
    if (session.attributes.city) {
        getFinalTideResponse(session.attributes.city, date, response);
    } else {
        // The user provided a date out of turn. Set date in session and prompt for city
        session.attributes.date = date;
        speechOutput = "For which city would you like tide information for " + date.displayDate + "?";
        repromptText = "For which city?";

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
    if (session.attributes.city) {
        // get date re-prompt
        var repromptText = "Please try again saying a day of the week, for example, Saturday. ";
        var speechOutput = repromptText;

        response.ask(speechOutput, repromptText);
    } else {
        // get city re-prompt
        handleSupportedCoursesRequest(intent, session, response);
    }
}

/**
 * This handles the one-shot interaction, where the user utters a phrase like:
 * 'Alexa, open Tide Pooler and get tide information for Seattle on Saturday'.
 * If there is an error in a slot, this will guide the user to the dialog approach.
 */
function handleOneshotMenuRequest(intent, session, response) {
 // CR @@@@@ this is where we are leaving off for now.. I think keeping this in here for some course validation makes sense. 

    // Determine city, using default if none provided
    var courseSelection = getCourseSelectionFromIntent(intent, true),
        repromptText,
        speechOutput;
    if (courseSelection.error) {
        // invalid city. move to the dialog
        repromptText = "I can find course information for soup, entree, sides, and vegan option. Or all courses for the full menu." 
            + "Which course would you like information for?";
        // if we received a value for the incorrect city, repeat it to the user, otherwise we received an empty slot
        speechOutput = courseSelection.course ? "I'm sorry, I don't have any data for " + courseSelection.course + ". " + repromptText : repromptText;

        response.ask(speechOutput, repromptText);
        return;
    }

    // Determine custom date
    var date = getDateFromIntent(intent);
    if (!date) {
        // Invalid date. set city in session and prompt for date
        session.attributes.course = courseSelection;
        repromptText = "Please try again saying a day of the week, for example, Saturday. "
            + "For which date would you like menu information?";
        speechOutput = "I'm sorry, I didn't understand that date. " + repromptText;

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
        var speechOutput;

        if (err) {
            speechOutput = "Sorry, something funky is happening with the menu. Please try again later.";
        } else {
            speechOutput = date.displayDate + " The soup is "
                + menuResponse.soup + ". The entree is " + menuResponse.entree
                + ". The side is " + menuResponse.side
                + ". The vegan option is " + menuResponse.vegan 
                + ".";
        }

        response.tellWithCard(speechOutput, "MenuTeller", speechOutput)
    });
}

/**
 * Uses NOAA.gov API, documented: http://tidesandcurrents.noaa.gov/api/
 * Results can be verified at: http://tidesandcurrents.noaa.gov/noaatidepredictions/NOAATidesFacade.jsp?Stationid=[id]
 */

 // need to add some logic here .. for if coures is all versus if its not, the query string changes.... as would the response

function makeMenuRequest(course, date, menuResponseCallback) {

    var endpoint = "http://secret-atoll-35147.herokuapp.com/menus/2016-11-07.json";
    //var queryString = date.requestDateParam;
    //queryString += '&course=' + course;
    //queryString += '.json';
// took off the query string here... 
    http.get(endpoint, function (res) {
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
            } else {

                var menu = findMenu(menuResponseObject);
                menuResponseCallback(null, menu);
            }
        });
    }).on('error', function (e) {
        console.log("Communications error: " + e.message);
        menuResponseCallback(new Error(e.message));
    });
}

/**
 * Algorithm to find the 2 high tides for the day, the first of which is smaller and occurs
 * mid-day, the second of which is larger and typically in the evening
 */
function findMenu(menuResponseObj) {

    var soup = menuResponseObj.soups[0].name;
    var entree = menuResponseObj.entrees[0].name;
    var side = menuResponseObj.sides[0].name;
    var vegan = menuResponseObj.vegans[0].name;

    return {
        soup: soup, entree: entree, side: side, vegan: vegan
    }
}



/**
 * Gets the city (course) from the intent, or returns an error
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
            // For sample skill, default to Seattle. Here CR is defaulting to all courses - so we default in this to complete menu 
            return {
                course: 'all',
            }
        }
    } else {

        // lookup the city. Sample skill uses well known mapping of a few known cities to station id. CR: removed some error correction here. 
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
    if (!dateSlot || !dateSlot.value && current_hour < 16) {
        // date defaults to today  
        date = new Date();

    } else if (!dateSlot || !dateSlot.value && current_hour > 16) {
        // date defaults to tomorrow - since its after 4pm 
        //date = date.setDate(date.getDate() + 1);
        date = new Date();


    } else {

        date = new Date();
    // for debugging: change this: date = new Date(dateSlot.value);

    }
    // format the request date like YYYYMMDD
    var month = (date.getMonth() + 1);
    month = month < 10 ? '0' + month : month;
    var dayOfMonth = date.getDate();
    dayOfMonth = dayOfMonth < 10 ? '0' + dayOfMonth : dayOfMonth;
    var requestDay = date.getFullYear() + '-' + month + '-' + dayOfMonth;


    return {
        displayDate: alexaDateUtil.getFormattedDate(date),
        requestDateParam: requestDay
    }
}

// Create the handler that responds to the Alexa Request.
exports.handler = function (event, context) {
    var menuTeller = new MenuTeller();
    menuTeller.execute(event, context);
};

