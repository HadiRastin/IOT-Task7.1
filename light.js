const mqtt = require("mqtt");
const { v4: uuidv4 } = require("uuid"); // Import uuid

const client = mqtt.connect("mqtt://broker.hivemq.com:1883");

const baseTopic = "led";

function generateRandomData() {
  const id = uuidv4(); // Use uuid to generate a unique ID
  const motion = Math.random() < 0.5;
  const state = motion ? "ON" : "OFF";
  const time = new Date().toISOString();
  const dim = Math.floor(Math.random() * 100) + 1;
  const naturalLight = Math.floor(Math.random() * 100) + 1;

  return { id, motion, state, time, dim, naturalLight };
}

// Function to publish data to MQTT broker
function publishData(client, topic, data) {
  const message = JSON.stringify(data);
  const fullTopic = `${baseTopic}/${data.id}/${topic}`;

  client.publish(fullTopic, message);
  console.log(`Published to ${fullTopic}: ${message}`);
}

// Periodically generate and publish random data
setInterval(() => {
  const data = generateRandomData();
  publishData(client, "motion", { id: data.id, motion: data.motion });
  publishData(client, "time", { id: data.id, time: data.time });
  publishData(client, "state", { id: data.id, state: data.state });
  publishData(client, "dim", { id: data.id, dim: data.dim });
  publishData(client, "naturalLight", {
    id: data.id,
    naturalLight: data.naturalLight,
  });
}, 5000);
