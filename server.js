const mqtt = require("mqtt");
const client = mqtt.connect("mqtt://broker.hivemq.com:1883");
const mongoose = require("mongoose");
const DataObject = require("./models/DataObjects.js");

mongoose.connect("mongodb://52.91.228.123:27017/TASK7", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const baseTopic = "led";
const dataObjects = [];

// Function to handle incoming messages
function handleMessage(topic, message) {
  const parsedMessage = JSON.parse(message.toString());
  const id = topic.split("/")[1]; // Extract id from the topic

  // Find the existing object with the same id or create a new one
  let dataObject = dataObjects.find((obj) => obj.id === id);

  if (!dataObject) {
    dataObject = { id, state: null, motion: null, time: null };
    dataObjects.push(dataObject);
  }

  // Update the dataObject based on the topic
  if (topic.endsWith("motion")) {
    dataObject.motion = parsedMessage.motion;
  } else if (topic.endsWith("state")) {
    dataObject.state = parsedMessage.state;
  } else if (topic.endsWith("time")) {
    dataObject.time = parsedMessage.time;
  } else if (topic.endsWith("dim")) {
    dataObject.dim = parsedMessage.dim;
  } else if (topic.endsWith("naturalLight")) {
    dataObject.naturalLight = parsedMessage.naturalLight;
  }

  console.log(`Received from ${topic}: ${JSON.stringify(parsedMessage)}`);
  console.log("Data Objects:", dataObjects);

  // Check and publish alert
  checkAndPublishAlert(dataObject);

  // Adjust dim and publish
  adjustDimAndPublish(dataObject);
}

// Function to check conditions and publish alert
function checkAndPublishAlert(dataObject) {
  if (!dataObject.motion) {
    // Check if state has been ON for more than 1 minute
    const currentTime = new Date().getTime();
    const stateOnTime = new Date(dataObject.time).getTime();

    if (currentTime - stateOnTime > 60000) {
      // Publish alert message
      const alertTopic = `${baseTopic}/alert/turnoff/${dataObject.id}`;
      client.publish(alertTopic, "Alert: Turn off LED");
      console.log(`Published alert to ${alertTopic}`);
    }
  }

  if (dataObject.motion) {
    const alertTopic = `${baseTopic}/alert/turnon/${dataObject.id}`;
    client.publish(alertTopic, "Alert: Turn on LED");
    console.log(`Published alert to ${alertTopic}`);
  }
}

// Function to adjust dim and publish
function adjustDimAndPublish(dataObject) {
  if (dataObject.state === "ON") {
    // Adjust dim to make the sum of naturalLight and dim equal to 100
    const adjustedDim = 100 - dataObject.naturalLight;

    // Publish adjustDim message
    const adjustDimTopic = `${baseTopic}/${dataObject.id}/adjustDim`;
    client.publish(
      adjustDimTopic,
      JSON.stringify({ id: dataObject.id, dim: adjustedDim })
    );
    console.log(`Published adjustDim to ${adjustDimTopic}: ${adjustedDim}`);
  }
}

client.on("connect", () => {
  console.log("Connected to MQTT broker");

  // Subscribe to topics
  client.subscribe(`${baseTopic}/+/motion`);
  client.subscribe(`${baseTopic}/+/time`);
  client.subscribe(`${baseTopic}/+/state`);
  client.subscribe(`${baseTopic}/+/dim`);
  client.subscribe(`${baseTopic}/+/naturalLight`);
});

// Handle incoming messages
client.on("message", handleMessage);

setInterval(() => {
  dataObjects.forEach(async (dataObject) => {
    checkAndPublishAlert(dataObject);
    adjustDimAndPublish(dataObject);

    // Save dataObject to MongoDB
    try {
      await DataObject.updateOne({ id: dataObject.id }, dataObject, {
        upsert: true, // If the document does not exist, insert it
      });
      console.log(`Saved DataObject with id ${dataObject.id} to MongoDB`);
    } catch (error) {
      console.error("Error saving to MongoDB:", error);
    }
  });
}, 5000);
