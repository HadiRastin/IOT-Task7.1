const mqtt = require("mqtt");
const client = mqtt.connect("mqtt://broker.hivemq.com:1883");

const baseTopic = "led";

// Function to handle incoming messages
function handleMessage(topic, message) {
  // Check if the topic is for adjustDim or alert
  if (topic.endsWith("adjustDim")) {
    const parsedMessage = JSON.parse(message.toString());

    const dimTopic = `${baseTopic}/${parsedMessage.id}/dim`;
    client.publish(
      dimTopic,
      JSON.stringify({ id: parsedMessage.id, dim: parsedMessage.dim })
    );
    console.log(
      `Published to ${dimTopic}: ${JSON.stringify({
        id: parsedMessage.id,
        dim: parsedMessage.dim,
      })}`
    );
  } else if (topic.includes("/alert/")) {
    // Extract id from the topic
    id = topic.split("/")[3];

    // Determine the state based on the alert type
    const state = topic.endsWith("turnoff") ? "OFF" : "ON";

    // Publish state message to the appropriate topic
    const stateTopic = `${baseTopic}/${id}/state`;
    client.publish(stateTopic, JSON.stringify({ id: id, state: state }));
    console.log(`Published to ${stateTopic}: ${JSON.stringify({ id, state })}`);
  }
}

client.on("connect", () => {
  console.log("Connected to MQTT broker");

  // Subscribe to adjustDim and alert topics
  client.subscribe(`${baseTopic}/+/adjustDim`);
  client.subscribe(`${baseTopic}/alert/turnoff/+`);
  client.subscribe(`${baseTopic}/alert/turnon/+`);
});

// Handle incoming messages
client.on("message", handleMessage);
