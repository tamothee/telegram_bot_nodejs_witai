// to enable require and import
import { createRequire } from "module";
const require = createRequire(import.meta.url);

// environment variable
require("dotenv").config();

// data
import { greeting } from "./greeting.js";
import { faq } from "./faq.js";

// mongodb
import Realm from "realm";
const app = new Realm.App({ id: process.env.NEXT_PUBLIC_APP_ID });
const credentials = Realm.Credentials.apiKey(process.env.MONGODB_USER_API_KEY);
const user = await app.logIn(credentials);
//connect to mongodb
const mongodb = app.currentUser.mongoClient("mongodb-atlas");
const collection = mongodb.db("data").collection("PeopleCount");

// telegram
const { Telegraf } = require("telegraf");
const bot = new Telegraf(process.env.BOT_TOKEN);

bot.on("text", async (ctx) => {
  if (ctx.message.text === "/start") {
    ctx.reply(
      "Hi I am IOTP chatbot. If you have any questions regarding IOTP reception, you can ask me."+
      " Use this command /CheckCrowd to check how many people are at the reception area"
    );
  } else if (ctx.message.text === "/CheckCrowd") {
    const data = await collection.findOne();
    const {timestamp, value} = data;
    ctx.reply("As of " + timestamp + " there are: " + value);
  } else {
    const { Wit, log } = require("node-wit");
    const client = new Wit({
      accessToken: process.env.WITAI_TOKEN,
      logger: new log.Logger(log.DEBUG), // optional
    });
    var msg = ctx.message.text;
    var wit = await client.message(msg);
    console.log("wit reply", wit);

    const intent = wit.intents[0]?.name;
    console.log("intent", intent);

    switch (intent) {
      case "greetings":
        // code block
        let x = Math.round(Math.random() * 23);
        console.log(greeting[x]);
        ctx.reply(greeting[x]);
        break;
      case !undefined:
        // code block
        for (let i = 0; i < faq.length; i++) {
          if (intent.toLowerCase().includes(faq[i].question.toLowerCase())) {
            ctx.reply(faq[i].answer);
            break;
          }
        }
        ctx.reply("Sorry I do not have an answer to that question");
        break;

      default:
        ctx.reply("Sorry I do not understand");
      // code block
    }
  }

  // client.message("hello", {}).then((data) => {
  //   console.log("wit reply" + JSON.stringify(data));
  // });
  // ctx.reply("hello there!");
});

bot.command("oldschool", (ctx) => ctx.reply("oldschool"));

bot.launch();
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
