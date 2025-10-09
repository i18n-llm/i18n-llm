#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const init_1 = require("./commands/init");
const generate_1 = require("./commands/generate");
const review_1 = require("./commands/review");
const program = new commander_1.Command();
program
    .name('i18n-llm')
    .description('A CLI tool to manage i18n using LLMs')
    .version('0.1.0');
program.addCommand(init_1.initCommand);
program.addCommand(generate_1.generateCommand);
program.addCommand(review_1.reviewCommand);
program.parse(process.argv);
