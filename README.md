# Sur Accountant Service

> Telegram-based accounting assistant that extracts data from images and stores it in Google Sheets.

## TODO

### Telegram Bot

- [x] Setup Telegram bot
- [x] Reply to messages with AI response
- [x] Listen to message reactions
- [ ] Setup reaction-based replies
  - [x] Save on reaction
  - [x] Action on specific reaction
  - [ ] Move flow inside accounting feature

- [x] Perform actions on message-related data  
       _MVP: store OCR result in memory_
  - [ ] Add actual persistent storage
- [x] Add templates for pretty responses

### AI

- [x] Setup LangChain
- [x] Connect to GPT
- [x] Read data from images
<!-- - [ ] Use different models for text and images -->

### Google Sheets

- [x] Setup Google Sheets API
- [x] Implement methods to write data into tables
- [ ] Add data validation & formatting

### Misc

- [ ] Add Dockerfile and deploy
- [ ] Cleanup main.ts
