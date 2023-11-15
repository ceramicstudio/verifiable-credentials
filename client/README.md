# Save Verifiable Credentials to Ceramic with Veramo

This directory contains a simple frontend interface, the Ceramic server configurations, and Ceramic client operations required to create, save, and query credentials created using Veramo to ComposeDB

## Getting Started

1. Install your dependencies:

Install your dependencies:

```bash
npm install
```

2. Generate your admin seed, admin did, and ComposeDB configuration file:

```bash
npm run generate
```

3. Create a .env file with a SECRET_KEY - feel free to copy-paste the dummy seed in the .env.example file.

4. Finally, run your application in a new terminal (first ensure you are running node v16 in your terminal):

```bash
nvm use 16
npm run dev
```

5. Visit `http://localhost:3000/` to generate, store, and verify EIP712 Verifiable Credentials

6. Visit `http://localhost:3000/jwt` to generate, store, and verify Verifiable Credentials in JWT format

## Learn More

To learn more about Ceramic please visit the following links

- [Ceramic Documentation](https://developers.ceramic.network/learn/welcome/) - Learn more about the Ceramic Ecosystem.
- [ComposeDB](https://composedb.js.org/) - Details on how to use and develop with ComposeDB!
- [AI Chatbot on ComposeDB](https://learnweb3.io/lessons/build-an-ai-chatbot-on-compose-db-and-the-ceramic-network) - Build an AI-powered Chatbot and save message history to ComposeDB
- [ComposeDB API Sandbox](https://composedb.js.org/sandbox) - Test GraphQL queries against a live dataset directly from your browser
- [Ceramic Blog](https://blog.ceramic.network/) - Browse technical tutorials and more on our blog
- [Ceramic Discord](https://discord.com/invite/ceramic) - Join the Ceramic Discord
- [Follow Ceramic on Twitter](https://twitter.com/ceramicnetwork) - Follow us on Twitter for latest announcements!