<div id="top"></div>

[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![MIT License][license-shield]][license-url]

<!-- PROJECT LOGO -->
<br />
<div align="center">
  <img src="https://cdn.discordapp.com/attachments/849289892068065310/954062297003860028/logo.png" alt="Logo" width="80" height="80">

  <h3 align="center">Store Bot</h3>

  <p align="center">
    Easy to use application bot, with logging, easy moderation and high customisability.
    <br />
    <br />
  </p>
</div>

<!-- ABOUT THE PROJECT -->
## About The Project

The application bot is a highly customisable bot, with easy to use applications, using Discord's dropdowns, buttons and slash commands to create an easy to use, interactive experience for the user. With automatic inviting, role granting, logging, and restriction to specific roles, this bot should be perfect for all users looking to recruit new people.

Some of the features:
* Easily accept / deny application through discord buttons
* Create one-time invites on acceptance to invite a user to a discord server
* Individually open / close applications
* Easy to customise & setup
* Creates dedicated channel per application, giving perms to those you specify
* Customisable accept / deny messages
* Lots of logging
* Easily restrict commands

<!-- GETTING STARTED -->
## Getting Started

### Prerequisites

This is an example of how to list things you need to use the software and how to install them.
* NodeJS >= v16.13.0
* npm
  ```sh
  npm install npm@latest -g
  ```

### Installation

1. Clone the repo or download the files
   ```sh
   git clone https://github.com/neurondevelopment/CoreBot.git
   ```
2. Install NPM packages
   ```sh
   npm install
   ```
3. Fill in the information in `config.json`, the following fields are required for the bot to start
   ```js
   token serverID
   ```
4. Invite or reinvite the bot with the following link, replace YOURCLIENTID with the Client ID of your bot
   ```
   https://discord.com/api/oauth2/authorize?client_id=YOURCLIENTID&permissions=8&scope=applications.commands%20bot
   ```
5. Starting the bot
   ```sh
   node .
   ```
   **OR**
   
   ```sh
   node index.js
   ```

### Creating Applications

Listings can be found in /db/applications.json

```js
"testapplication": { // Name of the application
        "enabled": true, // Set true or false to allow users to apply for this
        "description": "test description", // Description shown in the dropdown menu, max 100 CHARS (not words)
        "emoji": "🤡", 
        "questions": ["Question 1", "Question 2", "Question 3"], // Questions, max 50 CHARS per question, discords limits not mine. There is a limit of 25 questions
        "discord": "none", // Enter discord ID for auto invites when a user is accepted
        "roles": ["RoleID"], // Roles to grant user if they are accepted, specify role IDs
        "restricted": [], // Restrict application to certain roles, specify their role IDs
        "category": "Channel ID", // Category for applications to be sent to to be approved / denied
        "acceptMessage": "Your application for **{[APPLICATION]}** has been accepted", // Message sent to user if they are accepted. Use {[APPLICATION]} to autofill the name of the application
        "denyMessage": "You have been denied from **{[APPLICATION]}**\nReason: `{[REASON]}`"/ Message sent to user if they are accepted. Use {[APPLICATION]} to autofill the name of the application {[REASON]} to autofill the reason
    },
```
<br>

<!-- LICENSE -->
## License

Distributed under the MIT License. See `LICENSE` for more information.

<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->
[contributors-shield]: https://img.shields.io/github/contributors/neurondevelopment/ApplicationBot.svg?style=for-the-badge
[contributors-url]: https://github.com/neurondevelopment/ApplicationBot/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/neurondevelopment/ApplicationBot.svg?style=for-the-badge
[forks-url]: https://github.com/neurondevelopment/ApplicationBot/network/members
[stars-shield]: https://img.shields.io/github/stars/neurondevelopment/ApplicationBot.svg?style=for-the-badge
[stars-url]: https://github.com/neurondevelopment/ApplicationBot/stargazers
[issues-shield]: https://img.shields.io/github/issues/neurondevelopment/ApplicationBot.svg?style=for-the-badge
[issues-url]: https://github.com/neurondevelopment/ApplicationBot/issues
[license-shield]: https://img.shields.io/github/license/neurondevelopment/ApplicationBot.svg?style=for-the-badge
[license-url]: https://github.com/neurondevelopment/ApplicationBot/blob/master/LICENSE.txt
