/* eslint-disable no-use-before-define */
/* eslint-disable global-require */

const Alexa = require("ask-sdk-core");
const axios = require("axios");

// Greeting when Alexa is actived through "rocket test"
const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === "LaunchRequest";
  },
  handle(handlerInput) {
    let d = new Date();
    let t = d.getHours();

    // Alexa uses Coordinated Univeral Time, so my numbers may look a little awkward for the time.
    if (t > 5 && t < 16) {
      const speechText = "Good morning!  What can I do for you today?";

      return handlerInput.responseBuilder
        .speak(speechText)
        .reprompt(speechText)
        .getResponse();
    } else if (t >= 16 && t < 21) {
      const speechText = "Good afternoon!  What can I do for you today?";

      return handlerInput.responseBuilder
        .speak(speechText)
        .reprompt(speechText)
        .getResponse();
    } else {
      const speechText = "Good evening!  What can I do for you today?";

      return handlerInput.responseBuilder
        .speak(speechText)
        .reprompt(speechText)
        .getResponse();
    }
    // Alternatively, we could put some street lingo for some needed humor
    // "What it do home boy?  I gots information up in dis piece, so throw down whatchu wanna know.";
  },
};

const GetRemoteDataHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === "IntentRequest" &&
      handlerInput.requestEnvelope.request.intent.name === "GetRemoteDataIntent"
    );
  },

  // The information that's going on at Rocket Elevators.  Say something like "What's going on at Rocket Elevators"
  async handle(handlerInput) {
    let outputSpeech = "This is the default message.";

    await getRemoteData(
      "https://rest-api-burroughs.herokuapp.com/api/greetings"
    )
      .then((response) => {
        outputSpeech = response;
      })
      .catch((err) => {
        console.log(`ERROR: ${err.message}`);
        // set an optional error message here
        // outputSpeech = err.message;
      });

    return handlerInput.responseBuilder.speak(outputSpeech).getResponse();
  },
};

// Getting the Elevator Status.  Say something like "Whats the status of Elevator {id number}"
const GetStatusDataHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === "IntentRequest" &&
      handlerInput.requestEnvelope.request.intent.name === "GetStatusDataIntent"
    );
  },
  async handle(handlerInput) {
    let outputSpeech = "This is the default message.";

    let anythingElse = `Is there anything else I can help you with today?`;
    const slots = handlerInput.requestEnvelope.request.intent.slots;
    const number = slots["id"].value;

    await getStatusData(
      `https://rest-api-burroughs.herokuapp.com/api/elevators/${number}/status`
    )
      .then((response) => {
        const data = response;
        outputSpeech = `The status of elevator ${number} is ${data}. ${anythingElse}`;
      })
      .catch((err) => {
        console.log(`ERROR: ${err.message}`);
        // set an optional error message here
        // outputSpeech = err.message;
      });

    return handlerInput.responseBuilder
      .speak(outputSpeech)
      .reprompt(anythingElse)
      .getResponse();
  },
};

// Changing the Elevator Status.  Say something like "change the status of elevator {id} to {status}"
const PutElStatusChangeDataHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === "IntentRequest" &&
      handlerInput.requestEnvelope.request.intent.name ===
        "PutChangeStatusIntent"
    );
  },
  async handle(handlerInput) {
    let outputSpeech = "This is the default message.";

    const slots = handlerInput.requestEnvelope.request.intent.slots;
    const number = slots["id"].value;
    const status = slots["status"].value;
    let capStatus = capitalized(status);

    return getElStatusData(number, status, handlerInput);
  },
};
async function getElStatusData(number, capStatus, handlerInput) {
  return await axios
    .put(
      `https://rest-api-burroughs.herokuapp.com/api/elevators/${number}/status`,
      {
        id: `${number}`,
        status: `${capStatus}`,
      }
    )
    .then((response) => {
      let anythingElse = `Is there anything else I can help you with today?`;
      const data = response;
      const outputSpeech = `The status of elevator ${number} is now ${capStatus}. ${anythingElse}`;

      return handlerInput.responseBuilder
        .speak(outputSpeech)
        .reprompt(anythingElse)
        .getResponse();
    })
    .catch((err) => {
      console.log(`ERROR: ${err.message}`);
      // set an optional error message here
      // outputSpeech = err.message;
    });
}

function capitalized(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// Default Amazon Intents / Helpers
const HelpIntentHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === "IntentRequest" &&
      handlerInput.requestEnvelope.request.intent.name === "AMAZON.HelpIntent"
    );
  },
  handle(handlerInput) {
    const speechText = "You can introduce yourself by telling me your name";

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .getResponse();
  },
};

const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === "IntentRequest" &&
      (handlerInput.requestEnvelope.request.intent.name ===
        "AMAZON.CancelIntent" ||
        handlerInput.requestEnvelope.request.intent.name ===
          "AMAZON.StopIntent")
    );
  },
  handle(handlerInput) {
    const speechText = "Goodbye!";

    return handlerInput.responseBuilder.speak(speechText).getResponse();
  },
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === "SessionEndedRequest";
  },
  handle(handlerInput) {
    console.log(
      `Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`
    );

    return handlerInput.responseBuilder.getResponse();
  },
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);

    return handlerInput.responseBuilder
      .speak("Sorry, I can't understand the command. Please say again.")
      .reprompt("Sorry, I can't understand the command. Please say again.")
      .getResponse();
  },
};
// Default Amazon Intents / Helpers END

// Services of Rocket Elevators
const getRemoteData = (url) =>
  new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? require("https") : require("http");
    const request = client.get(url, (response) => {
      if (response.statusCode < 200 || response.statusCode > 299) {
        reject(new Error(`Failed with status code: ${response.statusCode}`));
      }
      const body = [];
      response.on("data", (chunk) => body.push(chunk));
      response.on("end", () => resolve(body.join("")));
    });
    request.on("error", (err) => reject(err));
  });

// Elevator status data function
const getStatusData = (url) =>
  new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? require("https") : require("http");
    const request = client.get(url, (response) => {
      if (response.statusCode < 200 || response.statusCode > 299) {
        reject(new Error(`Failed with status code: ${response.statusCode}`));
      }
      const body = [];
      response.on("data", (chunk) => body.push(chunk));
      response.on("end", () => resolve(body.join("")));
    });
    request.on("error", (err) => reject(err));
  });

const skillBuilder = Alexa.SkillBuilders.custom();

exports.handler = skillBuilder
  .addRequestHandlers(
    LaunchRequestHandler,
    GetRemoteDataHandler,
    GetStatusDataHandler,
    PutElStatusChangeDataHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    SessionEndedRequestHandler
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();
