import { readFileSync, writeFileSync, mkdirSync, cpSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import * as readline from "readline";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "..");

function prompt(question: string): Promise<string> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer.trim());
        });
    });
}

async function main() {
    console.log("Creating a new plugin...\n");

    // Get plugin name
    const pluginName = await prompt("Enter plugin name (kebab-case, e.g., my-plugin): ");

    if (!pluginName) {
        console.error("Error: Plugin name is required");
        process.exit(1);
    }

    // Validate plugin name (kebab-case)
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(pluginName)) {
        console.error("Error: Plugin name must be in kebab-case (lowercase letters, numbers, and hyphens only)");
        process.exit(1);
    }

    const pluginDir = join(rootDir, "src", "plugins", pluginName);

    // Check if plugin already exists
    if (existsSync(pluginDir)) {
        console.error(`Error: Plugin "${pluginName}" already exists at ${pluginDir}`);
        process.exit(1);
    }

    // Create plugin directory
    mkdirSync(pluginDir, { recursive: true });

    // Copy template files
    const templateDir = join(rootDir, "template");
    const filesToCopy = [
        "Component.tsx",
        "Plugin.tsx",
        "state.ts",
        "messages.ts",
    ];

    console.log(`\nCopying template files to src/plugins/${pluginName}/...`);

    for (const file of filesToCopy) {
        const source = join(templateDir, file);
        const dest = join(pluginDir, file);
        const content = readFileSync(source, "utf-8");
        writeFileSync(dest, content, "utf-8");
        console.log(`  ✓ ${file}`);
    }

    // Copy languages directory
    const languagesSource = join(templateDir, "languages");
    const languagesDest = join(pluginDir, "languages");
    cpSync(languagesSource, languagesDest, { recursive: true });
    console.log(`  ✓ languages/`);

    console.log(`\n✓ Plugin "${pluginName}" created successfully!`);
    console.log(`\nNext steps:`);
    console.log(`  1. Edit src/plugins/${pluginName}/Component.tsx to implement your plugin UI`);
    console.log(`  2. Edit src/plugins/${pluginName}/state.ts to define your plugin state`);
    console.log(`  3. Edit src/plugins/${pluginName}/messages.ts to define message types`);
    console.log(`  4. Edit src/plugins/${pluginName}/languages/BasicJS/implementation.ts to implement runtime logic`);
}

main().catch((error) => {
    console.error("Error:", error);
    process.exit(1);
});
