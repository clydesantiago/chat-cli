# Chat CLI

Execute a command based on the natural language input.

![](https://github.com/clydesantiago/chat-cli/demo.gif)

## Run Locally

Clone the project

```bash
  git clone git@github.com:clydesantiago/chat-cli.git
```

Go to the project directory

```bash
  cd my-project
```

Install dependencies

```bash
  npm install
```

Setup .env. Add your own OpenAI API key.

```bash
  cp .env.example .env
  vi .env
```

## Example commands

- node chat-cli.js exec "What's my current CPU usage?"
- node chat-cli.js exec "List top 5 processes with highest memory usage"
- node chat-cli.js exec "Make 20 folders with random name inside playground"
- node chat-cli.js exec "Initialize a Laravel project called the-amazing-project"
- node chat-cli.js exec "Install PHP version 8.2"
