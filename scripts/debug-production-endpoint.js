#!/usr/bin/env node

/**
 * Debug Production Endpoint Script
 *
 * This script tests the production webhook endpoint with different approaches
 */

const BASE_URL = "https://timelessaccessories.vercel.app";

async function testEndpoint(url, method = "GET", headers = {}) {
  try {
    console.log(`🔍 Testing ${method} ${url}`);

    const response = await fetch(url, {
      method,
      headers: {
        "User-Agent": "Mozilla/5.0",
        ...headers,
      },
    });

    console.log(`   Status: ${response.status} ${response.statusText}`);

    const text = await response.text();
    console.log(
      `   Response: ${text.substring(0, 200)}${text.length > 200 ? "..." : ""}`
    );
    console.log("");

    return { status: response.status, text };
  } catch (error) {
    console.error(`   Error: ${error.message}`);
    console.log("");
    return { error: error.message };
  }
}

async function debugProductionEndpoint() {
  console.log("🚀 Debugging production webhook endpoint...\n");

  // Test 1: Check if the main site is accessible
  await testEndpoint(BASE_URL);

  // Test 2: Check if API routes work
  await testEndpoint(`${BASE_URL}/api`);

  // Test 3: Test webhook endpoint with GET (should return method not allowed)
  await testEndpoint(`${BASE_URL}/api/webhook/stripe`);

  // Test 4: Test webhook endpoint with POST but no signature
  await testEndpoint(`${BASE_URL}/api/webhook/stripe`, "POST", {
    "Content-Type": "application/json",
  });

  // Test 5: Test other API endpoints to confirm API is working
  await testEndpoint(`${BASE_URL}/api/config/paypal`);

  console.log("🔍 Debug complete!");
}

debugProductionEndpoint();
