require("dotenv").config();

const { LLMChain, SimpleSequentialChain } = require("langchain/chains");
const { OpenAI } = require("langchain/llms/openai");
const { PromptTemplate } = require("langchain/prompts");
const { Command } = require("commander");
const { StructuredOutputParser } = require("langchain/output_parsers");
const util = require("util");
const exec = util.promisify(require("child_process").exec);
const program = new Command();

program
  .name("chat-cli")
  .description(
    "Simplify CLI Command Execution with Natural Language Interface."
  )
  .version("1.0.0");

program
  .command("exec")
  .description("Execute a command based on the natural language input.")
  .argument("<command>", "The command to be executed.")
  .option("--unsafe", "Execute the command even if it is unsafe to do so.")
  .action(async (str, options) => {
    const model = new OpenAI({
      temperature: 0,
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    // This is an LLMChain that converts natural language to a command.
    const naturalLanguageToCommandTemplate = `You are a Systems Administrator.
    Given the natural language command, it is you job to convert it to a command that can be executed on the server.
    Respond with the command and do not output anything else.

    Operating System: darwin
    Natural Language Command: {naturalLanguageCommand}
    `;

    const naturalLanguageToCommandPromptTemplate = new PromptTemplate({
      template: naturalLanguageToCommandTemplate,
      inputVariables: ["naturalLanguageCommand"],
    });

    const naturalLanguageToChain = new LLMChain({
      llm: model,
      prompt: naturalLanguageToCommandPromptTemplate,
    });

    // This is an LLMChain that checks if the command is safe to execute.
    const commandSafetyParser = StructuredOutputParser.fromNamesAndDescriptions(
      {
        safe: "'yes' if the command is safe to execute, 'no' otherwise.",
        description: "The description of the command.",
        command: "The command to be executed.",
      }
    );

    const commandSafetyTemplate = `You are a Systems Administrator.
    Given the command, it is you job to check if it is safe to execute.

    {format_instructions}
    Command: {command}
    `;

    const commandSafetyPromptTemplate = new PromptTemplate({
      template: commandSafetyTemplate,
      inputVariables: ["command"],
      partialVariables: {
        format_instructions: commandSafetyParser.getFormatInstructions(),
      },
    });

    const commandSafetyChain = new LLMChain({
      llm: model,
      prompt: commandSafetyPromptTemplate,
    });

    const overallChain = new SimpleSequentialChain({
      chains: [naturalLanguageToChain, commandSafetyChain],
    });

    const response = await overallChain.run(str);
    const parsedResponse = await commandSafetyParser.parse(response);
    const isSafe = parsedResponse.safe === "yes";

    // Do not execute the command if it is unsafe and the user did not specify --unsafe.
    if (!isSafe && !options.unsafe) {
      console.error(
        "Command is unsafe to execute. Use --unsafe to execute anyway."
      );
      console.info("Command:", parsedResponse.command);
      return;
    }

    console.log(`Executing command: ${parsedResponse.command}`);

    const { stdout, stderr } = await exec(parsedResponse.command);
    console.log(stdout || stderr);
  });

program.parse();
