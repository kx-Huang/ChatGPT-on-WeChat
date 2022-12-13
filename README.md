# ChatGPT on WeChat! ![License: ISC](https://img.shields.io/badge/License-ISC-yellow.svg) [![wakatime](https://wakatime.com/badge/user/7d2c2fc8-bd1d-4e1e-bb2b-b49c6120ed53/project/205c561e-69ba-4478-b07f-f5bc7a0ed394.svg)](https://wakatime.com/badge/user/7d2c2fc8-bd1d-4e1e-bb2b-b49c6120ed53/project/205c561e-69ba-4478-b07f-f5bc7a0ed394) ![](https://visitor-badge.glitch.me/badge?page_id=kx-Huang.ChatGPT-on-WeChat&left_color=gray&right_color=blue) <!-- omit in toc -->

Turn your WeChat into an auto-reply bot powered by ChatGPT!

![Your Chat Bot in Group Chat!](doc/img/demo.png)

## Acknowledgement && Features

This project is implemented based on [this amazing project](https://github.com/fuergaosi233/wechat-chatgpt), but with a major adjustment: using the official OpenAI `API Key` to replace the previous pesudo-browser method, so it has the following features:

- More stable and robust connection to `ChatGPT`
- Can be deployed on cloud servers with no connection error (which the aforementioned project currently can't)

## How to Deploy this Bot?

### Configure Environment Variables

Create a file `config.yaml`, and paste the following configuration:

```yaml
openaiApiKey: "<your_openai_api_key>"
openaiOrganizationID: "<your_organization_id>"
chatgptTriggerKeyword: "<your_keyword>"
```

**Please note**:

- `openaiApiKey` can be generated in the [**API Keys Page** in your OpenAI account](https://beta.openai.com/account/api-keys)
- `openaiOrganizationID` is optional, which can be found in the [**Settings Page** in your Open AI account](https://beta.openai.com/account/org-settings)
- `chatgptTriggerKeyword` is the keyword which can trigger auto-reply:
  - In private chat, the message starts with it will trigger
  - In group chat, the message starts with `@Name <keyword>` will trigger (Here `@Name` mean do the"@" the bot in the group chat)
- `chatgptTriggerKeyword` is empty string means no keyword to trigger auto-reply

### Deploy in Local

#### 1. Setup Docker Image

```bash
docker build -t chatgpt-on-wechat .
```

#### 2. Setup Docker Container

```bash
docker run -v $(pwd)/config.yaml:/app/config.yaml chatgpt-on-wechat
```

### Deploy on Cloud

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template/zKIfYk?referralCode=D6wD0x)

**Please note:**

Make sure the environment variables are set in RailWay instead of writing directly in `config.yaml`. It's really **NOT** recommended to implicitly write out your `OpenAI API Key` in public. Anyone with your key can get access to the ChatGPT service, and it's possbile for you to lose money if you pay for the OpenAI ChatGPT service.

### Link to WeChat Account

Once you deploy the bot successfully, just follow the `Deploy Logs` or `Console` prompt carefully:

1. Scan the QR Code with mobile WeChat
2. Click "Accpet" to allow desktop login (where our bot stays)
3. Wait a few second and start chatting!
