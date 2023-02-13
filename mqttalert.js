import { createRequire } from "module";
const require = createRequire(import.meta.url);

const mqtt = require("mqtt");
const nodemailer = require("nodemailer");
require("dotenv").config();

// mongodb
import Realm from "realm";
const app = new Realm.App({ id: process.env.NEXT_PUBLIC_APP_ID });
const credentials = Realm.Credentials.apiKey(process.env.MONGODB_USER_API_KEY);
const user = await app.logIn(credentials);
//connect to mongodb
const mongodb = app.currentUser.mongoClient("mongodb-atlas");
const collection = mongodb.db("users").collection("users");

// telegram
const { Telegraf } = require("telegraf");
const bot = new Telegraf(process.env.BOT_SECURITY_TOKEN);

var emailholder = 0; // this holder is for checking if email has been sent before
setInterval(clearemailholder, 10000); // interval for sending email
function clearemailholder() {
  emailholder = 0;
  console.log("reset email holder ", emailholder)
}

// email setting
var transporter = nodemailer.createTransport({
  host: "smtp.office365.com", // Office 365 server
  port: 587, // secure SMTP
  secure: false, // false for TLS - as a boolean not string - but the default is false so just remove this completely
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
  tls: {
    ciphers: "SSLv3",
  },
  requireTLS: true,
});

bot.on("text", async (ctx) => {});

function sendEmail(destination, subject, data) {
  try {
    // mail options
    const mailOptions = {
      from: process.env.EMAIL_USERNAME,
      to: destination,
      subject: subject,
      text: data,
    };
    // here we actually send it
    transporter.sendMail(mailOptions, function (err, info) {
      if (err) {
        console.log("Error sending message: " + err);
      } else {
        // no errors, it worked
        console.log("Message sent succesfully.");
        emailholder = 1;
      }
    });
  } catch (error) {
    console.log("Other error sending message: " + error);
  }
}

// mqtt
const client = mqtt.connect("mqtt://localhost:1883");
client.on("connect", function () {
  client.subscribe("iotp_reception/intruder", function (err) {});
});
client.on("message", async function (topic, message) {
  // message is Buffer
  console.log(message.toString());
  const date = new Date();
  if (!emailholder && message.toString()==="1") {
    sendEmail(
      "timothy.19@ichat.sp.edu.sg",
      "Intruder Alert",
      "Intruder has been detected at IOTP_reception " + date
    );
    const users = await collection.find();
    users?.map((user) => {
      if (user.telegramId) {
        bot.telegram.sendMessage(
          user?.telegramId,
          "Intruder has been detected at IOTP_reception"
        );
      }
    });
  } else {
    console.log("Email was not sent as email was sent recently");
  }
});

bot.launch();
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
