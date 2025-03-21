#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const readline = require("readline");

const envFilePath = path.join(process.cwd(), ".env");

// Read existing .env file
const readEnvFile = () => {
  try {
    return fs.readFileSync(envFilePath, "utf8");
  } catch (error) {
    console.error("Error reading .env file:", error.message);
    return "";
  }
};

// Write updated .env file
const writeEnvFile = (content) => {
  try {
    fs.writeFileSync(envFilePath, content, "utf8");
    console.log("Successfully updated .env file");
  } catch (error) {
    console.error("Error writing .env file:", error.message);
  }
};

// Update market setting in .env file
const updateMarketSetting = (market) => {
  const envContent = readEnvFile();
  const marketRegex = /NEXT_PUBLIC_MARKET\s*=\s*[\w]+/g;

  if (marketRegex.test(envContent)) {
    // Replace existing setting
    const updatedContent = envContent.replace(
      marketRegex,
      `NEXT_PUBLIC_MARKET=${market}`
    );
    writeEnvFile(updatedContent);
  } else {
    // Add setting if it doesn't exist
    const updatedContent = `${envContent}\n\n# Market Configuration\nNEXT_PUBLIC_MARKET=${market}\n`;
    writeEnvFile(updatedContent);
  }
};

// Command line interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log("\n🛍️  TimelessAccessories Market Switcher 🛍️\n");
console.log("1) GLOBAL - Standard shipping with PayPal/Credit Card/COD");
console.log("2) LASCO - Courier-based shipping with LascoPay\n");

rl.question("Select market type (1 or 2): ", (answer) => {
  if (answer === "1") {
    updateMarketSetting("GLOBAL");
    console.log("\n✅ Switched to GLOBAL market");
    console.log("   Standard shipping with PayPal/Credit Card options");
  } else if (answer === "2") {
    updateMarketSetting("LASCO");
    console.log("\n✅ Switched to LASCO market");
    console.log("   Courier shipping with LascoPay integration");
  } else {
    console.log("\n❌ Invalid selection. Please run again and choose 1 or 2.");
  }

  console.log(
    "\nRemember to restart your development server to apply changes!"
  );
  rl.close();
});
