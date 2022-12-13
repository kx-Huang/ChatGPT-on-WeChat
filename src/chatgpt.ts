import { Config } from "./config.js";
import { Message } from "wechaty";
import { ContactInterface, RoomInterface } from "wechaty/impls";
import { Configuration, OpenAIApi } from "openai";

enum MessageType {
  Unknown = 0,
  Attachment = 1, // Attach(6),
  Audio = 2, // Audio(1), Voice(34)
  Contact = 3, // ShareCard(42)
  ChatHistory = 4, // ChatHistory(19)
  Emoticon = 5, // Sticker: Emoticon(15), Emoticon(47)
  Image = 6, // Img(2), Image(3)
  Text = 7, // Text(1)
  Location = 8, // Location(48)
  MiniProgram = 9, // MiniProgram(33)
  GroupNote = 10, // GroupNote(53)
  Transfer = 11, // Transfers(2000)
  RedEnvelope = 12, // RedEnvelopes(2001)
  Recalled = 13, // Recalled(10002)
  Url = 14, // Url(5)
  Video = 15, // Video(4), Video(43)
  Post = 16, // Moment, Channel, Tweet, etc
}

const ErrorCode2Message: Record<string, string> = {
  "429":
    "OpenAI 服务器限流，请稍后再试 | OpenAI server's traffic was limited, please try later",
  "500":
    "OpenAI 服务器繁忙，请稍后再试 | OpenAI server is busy, please try later",
  "503":
    "OpenAI 服务器繁忙，请稍后再试 | OpenAI server is busy, please try later",
  unknown: "未知错误，请查阅日志 | Unknown Error, please refer to the log",
};

// OpenAI API configuration
const configuration = new Configuration({
  organization: Config.openaiOrganizationID,
  apiKey: Config.openaiApiKey,
});
// OpenAI instance
const openai = new OpenAIApi(configuration);

// message size for a single reply by the bot
const SINGLE_MESSAGE_MAX_SIZE = 500;

export class ChatGPTBot {
  chatgptTriggerKeyword = Config.chatgptTriggerKeyword;
  botName: string = "";

  setBotName(botName: string) {
    this.botName = botName;
  }

  get chatGroupTriggerKeyword(): string {
    return `@${this.botName} ${this.chatgptTriggerKeyword || ""}`;
  }

  async startGPTBot() {
    console.debug(`🤖️ Start GPT Bot Config is:${JSON.stringify(Config)}`);
    console.debug(`🤖️ Start GPT Bot Success, ready to handle message!`);
  }

  // get clean message by removing reply separater and group mention characters
  cleanMessage(rawText: string, isPrivateChat: boolean = false): string {
    let text = rawText;
    const item = rawText.split("- - - - - - - - - - - - - - -");
    if (item.length > 1) {
      text = item[item.length - 1];
    }
    text = text.replace(
      isPrivateChat ? this.chatgptTriggerKeyword : this.chatGroupTriggerKeyword,
      ""
    );
    return text;
  }

  // check whether ChatGPT bot can be triggered
  triggerGPTMessage(text: string, isPrivateChat: boolean = false): boolean {
    const chatgptTriggerKeyword = this.chatgptTriggerKeyword;
    let triggered = false;
    if (isPrivateChat) {
      triggered = chatgptTriggerKeyword
        ? text.startsWith(chatgptTriggerKeyword)
        : true;
    } else {
      triggered = text.startsWith(this.chatGroupTriggerKeyword);
    }
    if (triggered) {
      console.log(`🎯 ChatGPT Triggered: ${text}`);
    }
    return triggered;
  }

  // filter out the message that does not need to be processed
  isNonsense(
    talker: ContactInterface,
    messageType: MessageType,
    text: string
  ): boolean {
    return (
      // self-chatting can be used for testing
      // talker.self() ||
      messageType > MessageType.GroupNote ||
      talker.name() == "微信团队" ||
      // video or voice reminder
      text.includes("收到一条视频/语音聊天消息，请在手机上查看") ||
      // red pocket reminder
      text.includes("收到红包，请在手机上查看") ||
      // location information
      text.includes("/cgi-bin/mmwebwx-bin/webwxgetpubliclinkimg")
    );
  }

  // send question to ChatGPT with OpenAI API and get answer
  async onChatGPT(inputMessage: string): Promise<string> {
    const gptErrorMessage = "🤖️：麦扣的机器人摆烂了，请稍后再试～";
    const response = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: inputMessage,
      temperature: 0.6,
      max_tokens: 2000,
    });
    // use OpenAI API to get ChatGPT reply message
    const chatgptReplyMessage =
      response?.data?.choices[0]?.text?.trim() || gptErrorMessage;
    console.log("🤖️ ChatGPT says: ", chatgptReplyMessage);
    return chatgptReplyMessage;
  }

  // reply with the segmented messages from a single-long message
  async reply(
    talker: RoomInterface | ContactInterface,
    mesasge: string
  ): Promise<void> {
    const messages: Array<string> = [];
    let message = mesasge;
    while (message.length > SINGLE_MESSAGE_MAX_SIZE) {
      messages.push(message.slice(0, SINGLE_MESSAGE_MAX_SIZE));
      message = message.slice(SINGLE_MESSAGE_MAX_SIZE);
    }
    messages.push(message);
    for (const msg of messages) {
      await talker.say(msg);
    }
  }

  // reply to private message
  async onPrivateMessage(talker: ContactInterface, text: string) {
    // get reply from ChatGPT
    const chatgptReplyMessage = await this.onChatGPT(text);
    // send the ChatGPT reply to chat
    await this.reply(talker, chatgptReplyMessage);
  }

  // reply to group message
  async onGroupMessage(text: string, room: RoomInterface) {
    // get reply from ChatGPT
    const chatgptReplyMessage = await this.onChatGPT(text);

    const result = `${text}\n ---------- \n ${chatgptReplyMessage}`;
    await this.reply(room, result);
  }

  // receive a message (main entry)
  async onMessage(message: Message) {
    const talker = message.talker();
    const rawText = message.text();
    const room = message.room();
    const messageType = message.type();
    const isPrivateChat = !room;
    // do nothing if the message:
    //    1. is irrelevant (e.g. voice, video, location...), or
    //    2. doesn't trigger bot (e.g. no or wrong trigger-word)
    if (
      this.isNonsense(talker, messageType, rawText) ||
      !this.triggerGPTMessage(rawText, isPrivateChat)
    ) {
      return;
    }
    // clean the message for ChatGPT input
    const text = this.cleanMessage(rawText, isPrivateChat);
    // reply to private or group chat
    if (isPrivateChat) {
      return await this.onPrivateMessage(talker, text);
    } else {
      return await this.onGroupMessage(text, room);
    }
  }
}
