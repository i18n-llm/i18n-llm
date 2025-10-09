"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadState = loadState;
exports.saveState = saveState;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function loadState(statePath) {
    if (fs_1.default.existsSync(statePath)) {
        try {
            const fileContent = fs_1.default.readFileSync(statePath, 'utf-8');
            return JSON.parse(fileContent);
        }
        catch (error) {
            console.warn('⚠️ Could not parse state file. Starting with a fresh state.');
            return {};
        }
    }
    return {};
}
function saveState(state, statePath) {
    try {
        const dir = path_1.default.dirname(statePath);
        if (!fs_1.default.existsSync(dir)) {
            fs_1.default.mkdirSync(dir, { recursive: true });
        }
        fs_1.default.writeFileSync(statePath, JSON.stringify(state, null, 2));
    }
    catch (error) {
        console.error('❌ Failed to save state file:', error);
    }
}
